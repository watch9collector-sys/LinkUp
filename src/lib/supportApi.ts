import { supabase } from "@/src/lib/supabase";

export type SupportRequestType = "contact" | "delete_account";

export type SupportRequestInput = {
  request_type: SupportRequestType;
  user_id?: string | null;
  name: string;
  email: string;
  subject?: string;
  message: string;
};

const SUPPORT_TABLE = "support_requests";

function wrapError(message: string | undefined | null): string {
  return message?.trim() || "Could not submit your request. Please try again.";
}

export async function submitSupportRequest(
  input: SupportRequestInput,
): Promise<{ ok: boolean; error: string | null }> {
  const { error } = await supabase.from(SUPPORT_TABLE).insert({
    request_type: input.request_type,
    user_id: input.user_id ?? null,
    name: input.name.trim(),
    email: input.email.trim(),
    subject: input.subject?.trim() || null,
    message: input.message.trim(),
  });

  if (error) {
    const msg = error.message.toLowerCase();
    if (msg.includes("row-level security") || msg.includes("policy")) {
      return {
        ok: false,
        error:
          "Support requests are not enabled in Supabase yet. Run supabase/migrations/20260523110000_support_requests.sql.",
      };
    }
    return { ok: false, error: wrapError(error.message) };
  }

  return { ok: true, error: null };
}
