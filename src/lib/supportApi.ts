import { supabase } from "@/src/lib/supabase";
import {
  logUserFacingError,
  supportRequestErrorMessage,
  supportSchemaUnavailableMessage,
} from "@/src/lib/userFacingErrors";

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

function isSchemaCacheError(message: string): boolean {
  const lower = message.toLowerCase();
  return (
    lower.includes("schema cache") ||
    lower.includes("pgrst205") ||
    lower.includes("pgrst202")
  );
}

/** delete_account only — contact user_id is set server-side from auth.uid(). */
async function resolveDeleteAccountUserId(): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  return data.session?.user?.id ?? null;
}

async function insertViaRpc(input: SupportRequestInput) {
  const params: {
    request_type: SupportRequestType;
    name: string;
    email: string;
    subject: string | null;
    message: string;
    user_id?: string | null;
  } = {
    request_type: input.request_type,
    name: input.name.trim(),
    email: input.email.trim(),
    subject: input.subject?.trim() || null,
    message: input.message.trim(),
  };

  if (input.request_type === "delete_account") {
    params.user_id = input.user_id ?? null;
  }

  return supabase.rpc(SUPPORT_RPC, params);
}

async function insertViaTable(input: SupportRequestInput) {
  const row: {
    request_type: SupportRequestType;
    user_id?: string | null;
    name: string;
    email: string;
    subject?: string | null;
    message: string;
  } = {
    request_type: input.request_type,
    name: input.name.trim(),
    email: input.email.trim(),
    subject: input.subject?.trim() || null,
    message: input.message.trim(),
  };

  if (input.request_type === "delete_account") {
    row.user_id = input.user_id ?? null;
  }

  return supabase.from(SUPPORT_TABLE).insert(row);
}

export async function submitSupportRequest(
  input: SupportRequestInput,
): Promise<{ ok: boolean; error: string | null }> {
  const payload: SupportRequestInput =
    input.request_type === "delete_account"
      ? { ...input, user_id: await resolveDeleteAccountUserId() }
      : { ...input, user_id: undefined };

  const { error: rpcError } = await insertViaRpc(payload);

  if (!rpcError) {
    return { ok: true, error: null };
  }

  const rpcMessage = rpcError.message ?? "";
  const rpcMissing =
    isSchemaCacheError(rpcMessage) ||
    (rpcMessage.toLowerCase().includes("function") &&
      rpcMessage.toLowerCase().includes("does not exist"));

  if (!rpcMissing) {
    logUserFacingError("support RPC error", rpcError);
    return { ok: false, error: supportRequestErrorMessage(rpcError) };
  }

  const { error: tableError } = await insertViaTable(payload);

  if (!tableError) {
    return { ok: true, error: null };
  }

  const tableMessage = tableError.message ?? "";
  if (isSchemaCacheError(tableMessage)) {
    return { ok: false, error: supportSchemaUnavailableMessage() };
  }

  logUserFacingError("support table insert error", tableError);
  return { ok: false, error: supportRequestErrorMessage(tableError) };
}
