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
const SUPPORT_RPC = "submit_support_request";

function wrapError(message: string | undefined | null): string {
  return message?.trim() || "Could not submit your request. Please try again.";
}

function isSchemaCacheError(message: string): boolean {
  const lower = message.toLowerCase();
  return (
    lower.includes("schema cache") ||
    lower.includes("pgrst205") ||
    lower.includes("pgrst202")
  );
}

function schemaCacheGuidance(): string {
  return (
    "Support requests are not available on this Supabase API yet. In Dashboard → SQL Editor " +
    "(Production branch, same project as .env.local), run " +
    "supabase/migrations/20260523120000_support_requests_rpc.sql. " +
    "If Contact still fails, confirm the Dashboard project URL matches your env and use " +
    "Settings → General → Pause project → Restore once."
  );
}

async function insertViaRpc(input: SupportRequestInput) {
  return supabase.rpc(SUPPORT_RPC, {
    request_type: input.request_type,
    name: input.name.trim(),
    email: input.email.trim(),
    subject: input.subject?.trim() || null,
    message: input.message.trim(),
    user_id: input.user_id ?? null,
  });
}

async function insertViaTable(input: SupportRequestInput) {
  return supabase.from(SUPPORT_TABLE).insert({
    request_type: input.request_type,
    user_id: input.user_id ?? null,
    name: input.name.trim(),
    email: input.email.trim(),
    subject: input.subject?.trim() || null,
    message: input.message.trim(),
  });
}

export async function submitSupportRequest(
  input: SupportRequestInput,
): Promise<{ ok: boolean; error: string | null }> {
  const { error: rpcError } = await insertViaRpc(input);

  if (!rpcError) {
    return { ok: true, error: null };
  }

  const rpcMessage = rpcError.message ?? "";
  const rpcMissing =
    isSchemaCacheError(rpcMessage) ||
    (rpcMessage.toLowerCase().includes("function") &&
      rpcMessage.toLowerCase().includes("does not exist"));

  if (!rpcMissing) {
    const msg = rpcMessage.toLowerCase();
    if (msg.includes("row-level security") || msg.includes("policy")) {
      return {
        ok: false,
        error:
          "Support requests are not enabled in Supabase yet. Run supabase/migrations/20260523120000_support_requests_rpc.sql.",
      };
    }
    return { ok: false, error: wrapError(rpcMessage) };
  }

  const { error: tableError } = await insertViaTable(input);

  if (!tableError) {
    return { ok: true, error: null };
  }

  const tableMessage = tableError.message ?? "";
  if (isSchemaCacheError(tableMessage)) {
    return { ok: false, error: schemaCacheGuidance() };
  }

  const msg = tableMessage.toLowerCase();
  if (msg.includes("row-level security") || msg.includes("policy")) {
    return {
      ok: false,
      error:
        "Support requests are not enabled in Supabase yet. Run supabase/migrations/20260523120000_support_requests_rpc.sql.",
    };
  }

  return { ok: false, error: wrapError(tableMessage) };
}
