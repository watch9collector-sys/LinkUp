import { supabase } from "@/src/lib/supabase";

export const REPORT_REASONS = [
  { value: "spam", label: "Spam" },
  { value: "harassment", label: "Harassment" },
  { value: "inappropriate_content", label: "Inappropriate content" },
  { value: "safety_concern", label: "Safety concern" },
  { value: "impersonation", label: "Impersonation" },
  { value: "scam_fraud", label: "Scam/fraud" },
  { value: "other", label: "Other" },
] as const;

export type ReportReason = (typeof REPORT_REASONS)[number]["value"];

export type UserReportRow = {
  id: string;
  reporter_id: string;
  reported_user_id: string | null;
  reported_linkup_id: string | null;
  reason: ReportReason;
  details: string;
  status: "open" | "reviewed" | "dismissed" | "actioned";
  created_at: string;
};

export type UserBlockRow = {
  id: string;
  blocker_id: string;
  blocked_id: string;
  created_at: string;
};

function wrapError(message: string): Error {
  return new Error(message || "Something went wrong. Please try again.");
}

export async function checkIsPlatformFounder(): Promise<boolean> {
  const { data, error } = await supabase.rpc("is_platform_founder");
  if (error) return false;
  return Boolean(data);
}

export async function submitUserReport(input: {
  reason: ReportReason;
  details?: string;
  reportedUserId?: string | null;
  reportedLinkUpId?: string | null;
}): Promise<{ id: string | null; error: Error | null }> {
  const { data, error } = await supabase.rpc("submit_user_report", {
    p_reason: input.reason,
    p_details: (input.details ?? "").trim(),
    p_reported_user_id: input.reportedUserId ?? null,
    p_reported_linkup_id: input.reportedLinkUpId ?? null,
  });

  if (error) {
    return { id: null, error: wrapError(error.message) };
  }
  return { id: typeof data === "string" ? data : String(data), error: null };
}

export async function founderRemoveLinkUp(
  linkupId: string,
  reason: string,
): Promise<{ error: Error | null }> {
  const { error } = await supabase.rpc("founder_remove_linkup", {
    p_linkup_id: linkupId,
    p_reason: reason.trim() || "Platform moderation removal",
  });
  if (error) return { error: wrapError(error.message) };
  return { error: null };
}

export async function founderSetReportStatus(
  reportId: string,
  status: UserReportRow["status"],
): Promise<{ error: Error | null }> {
  const { error } = await supabase.rpc("founder_set_report_status", {
    p_report_id: reportId,
    p_status: status,
  });
  if (error) return { error: wrapError(error.message) };
  return { error: null };
}

export async function fetchOpenReportsForFounder(): Promise<{
  data: UserReportRow[];
  error: Error | null;
}> {
  const { data, error } = await supabase
    .from("user_reports")
    .select(
      "id, reporter_id, reported_user_id, reported_linkup_id, reason, details, status, created_at",
    )
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) return { data: [], error: wrapError(error.message) };
  return { data: (data ?? []) as UserReportRow[], error: null };
}

export async function fetchMyBlocks(): Promise<{
  data: UserBlockRow[];
  error: Error | null;
}> {
  const { data, error } = await supabase
    .from("user_blocks")
    .select("id, blocker_id, blocked_id, created_at")
    .order("created_at", { ascending: false });

  if (error) return { data: [], error: wrapError(error.message) };
  return { data: (data ?? []) as UserBlockRow[], error: null };
}

export async function blockUser(
  blockedId: string,
): Promise<{ error: Error | null }> {
  const { data: sessionData } = await supabase.auth.getSession();
  const blockerId = sessionData.session?.user?.id;
  if (!blockerId) return { error: wrapError("Sign in to block someone.") };
  if (blockerId === blockedId) {
    return { error: wrapError("You cannot block yourself.") };
  }

  const { error } = await supabase.from("user_blocks").insert({
    blocker_id: blockerId,
    blocked_id: blockedId,
  });

  if (error) {
    if (error.message.toLowerCase().includes("duplicate")) {
      return { error: null };
    }
    return { error: wrapError(error.message) };
  }
  return { error: null };
}

export async function unblockUser(
  blockedId: string,
): Promise<{ error: Error | null }> {
  const { data: sessionData } = await supabase.auth.getSession();
  const blockerId = sessionData.session?.user?.id;
  if (!blockerId) return { error: wrapError("Sign in to unblock someone.") };

  const { error } = await supabase
    .from("user_blocks")
    .delete()
    .eq("blocker_id", blockerId)
    .eq("blocked_id", blockedId);

  if (error) return { error: wrapError(error.message) };
  return { error: null };
}

/** Returns user ids the current user has blocked (one direction: I blocked them). */
export async function fetchBlockedUserIds(): Promise<Set<string>> {
  const { data } = await fetchMyBlocks();
  return new Set(data.map((row) => row.blocked_id));
}

/**
 * Returns ids blocked either way involving the current user.
 * Used to hide blocked hosts from Explore without mutating records.
 */
export async function fetchBlockedEitherWayIds(): Promise<Set<string>> {
  const { data, error } = await supabase.rpc("my_interaction_block_ids");
  if (error || !Array.isArray(data)) return new Set();
  return new Set(
    data.filter((id): id is string => typeof id === "string" && Boolean(id)),
  );
}
