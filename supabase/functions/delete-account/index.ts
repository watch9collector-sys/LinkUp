import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

type Reply = { ok: boolean; code?: string; message?: string };

const allowed = (origin: string | null): boolean => {
  if (!origin) return true; // Non-browser clients must still authenticate and re-verify password.
  if (origin === "https://nyvon.app" || origin === "https://www.nyvon.app" || origin === "http://localhost:3000") return true;
  try {
    const url = new URL(origin);
    return url.protocol === "https:" &&
      url.hostname.endsWith("-watch9collector-5462s-projects.vercel.app") &&
      url.hostname.startsWith("nyvon-");
  } catch { return false; }
};

function reply(result: Reply, status: number, origin: string | null): Response {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "Cache-Control": "no-store",
    "Vary": "Origin",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-api-version",
  };
  if (origin && allowed(origin)) headers["Access-Control-Allow-Origin"] = origin;
  return new Response(JSON.stringify(result), { status, headers });
}

Deno.serve(async (req: Request) => {
  const origin = req.headers.get("origin");
  if (!allowed(origin)) return reply({ ok: false, code: "origin_denied" }, 403, origin);
  if (req.method === "OPTIONS") return reply({ ok: true }, 200, origin);
  if (req.method !== "POST") return reply({ ok: false, code: "method_not_allowed" }, 405, origin);

  const url = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !anonKey || !serviceKey) return reply({ ok: false, code: "not_configured" }, 503, origin);

  const authHeader = req.headers.get("authorization") ?? "";
  if (!/^Bearer \S+$/.test(authHeader)) return reply({ ok: false, code: "sign_in_required" }, 401, origin);
  if (Number(req.headers.get("content-length") ?? "0") > 8192) {
    return reply({ ok: false, code: "request_too_large" }, 413, origin);
  }

  let payload: { confirmation?: unknown; password?: unknown } | null;
  try { payload = await req.json(); }
  catch { return reply({ ok: false, code: "invalid_request" }, 400, origin); }
  if (payload?.confirmation !== "DELETE" || typeof payload.password !== "string" || payload.password.length < 1 || payload.password.length > 1024) {
    return reply({ ok: false, code: "confirmation_required", message: "Enter DELETE and your current password." }, 400, origin);
  }

  const options = { auth: { persistSession: false, autoRefreshToken: false } };
  const userClient = createClient(url, anonKey, options);
  const admin = createClient(url, serviceKey, options);
  const jwt = authHeader.substring(7);
  const { data: userLookup, error: getUserError } = await userClient.auth.getUser(jwt);
  const user = userLookup?.user;
  if (getUserError || !user?.id || !user.email) {
    return reply({ ok: false, code: "sign_in_required", message: "Sign in again before deleting your account." }, 401, origin);
  }

  // Password re-authentication ensures a stolen or stale access token is not sufficient.
  // Uses a separate stateless client so the incoming session is never overwritten.
  const passwordClient = createClient(url, anonKey, options);
  const { data: verification, error: passwordError } = await passwordClient.auth.signInWithPassword({
    email: user.email,
    password: payload.password,
  });
  if (passwordError || verification.user?.id !== user.id) {
    return reply({ ok: false, code: "password_invalid", message: "The password did not match. Your account was not deleted." }, 403, origin);
  }

  // The service-only clearance RPC checks founder protection, legal holds, and open safety cases.
  const { data: clearance, error: clearanceError } = await admin.rpc(
    "nyvon_account_deletion_clearance",
    { p_user_id: user.id },
  );
  if (clearanceError || typeof clearance !== "string") {
    return reply({ ok: false, code: "verification_unavailable", message: "Deletion verification is temporarily unavailable. Contact support." }, 503, origin);
  }
  if (clearance !== "allowed") {
    return reply({ ok: false, code: "manual_safety_review", message: "This account requires a safety or ownership review. Contact nyvonsupport@gmail.com to complete deletion." }, 409, origin);
  }

  // The only supported profile-media storage structure is avatars/{id} and banners/{id}.
  // List all objects before removing any; unexpected subfolders fail closed.
  const paths: string[] = [];
  for (const prefix of ["avatars/", "banners/"]) {
    const folder = prefix + user.id;
    for (let offset = 0; offset <= 1000; offset += 100) {
      const { data: objects, error } = await admin.storage.from("profile-images").list(folder, { limit: 100, offset });
      if (error) return reply({ ok: false, code: "storage_unavailable", message: "We could not verify your profile photos. Your account was not deleted." }, 503, origin);
      for (const object of objects ?? []) {
        if (!object.name || object.name.includes("/") || !object.id) {
          return reply({ ok: false, code: "storage_needs_review", message: "This account needs manual media cleanup before deletion." }, 409, origin);
        }
        paths.push(folder + "/" + object.name);
      }
      if ((objects ?? []).length < 100) break;
      if (offset === 1000) return reply({ ok: false, code: "storage_needs_review" }, 409, origin);
    }
  }

  // Check clearance again immediately before the irreversible phase.
  const { data: finalClearance, error: finalError } = await admin.rpc(
    "nyvon_account_deletion_clearance",
    { p_user_id: user.id },
  );
  if (finalError || finalClearance !== "allowed") {
    return reply({ ok: false, code: "manual_safety_review", message: "Deletion was paused for a safety review." }, 409, origin);
  }

  try {
    for (let i = 0; i < paths.length; i += 100) {
      const { error } = await admin.storage.from("profile-images").remove(paths.slice(i, i + 100));
      if (error) throw new Error("storage_cleanup_failed");
    }

    // Clean account-linked support requests and anonymize non-FK moderation references.
    // Closed safety reports may retain necessary case evidence under the privacy policy.
    const { error: a } = await admin.from("moderation_audit_log").update({ target_user_id: null }).eq("target_user_id", user.id);
    if (a) throw new Error("audit_cleanup_failed");
    const { error: b } = await admin.from("support_requests").delete().eq("user_id", user.id);
    if (b) throw new Error("support_cleanup_failed");
    const { error: c } = await admin.from("support_requests").delete().eq("email", user.email);
    if (c) throw new Error("support_cleanup_failed");

    // Hard-delete the Auth user; FK rules cascade hosted events, attendance,
    // blocks, their self-authored reports and owned moderation actions.
    const { error: deletionError } = await admin.auth.admin.deleteUser(user.id, false);
    if (deletionError) throw new Error("auth_deletion_failed");
    return reply({ ok: true, message: "Your Nyvon account and active profile have been deleted." }, 200, origin);
  } catch {
    return reply({
      ok: false,
      code: "manual_completion_required",
      message: "Deletion could not be fully completed. Contact nyvonsupport@gmail.com; do not repeatedly submit the request.",
    }, 503, origin);
  }
});
