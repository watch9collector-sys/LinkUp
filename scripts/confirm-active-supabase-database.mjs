/**
 * Confirms .env.local points at the database where linkups + support_requests live.
 * Usage: node scripts/confirm-active-supabase-database.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const envPath = path.join(root, ".env.local");

const OVERRIDE_KEYS = new Set([
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
]);

function loadEnv() {
  const env = { ...process.env };
  if (!fs.existsSync(envPath)) {
    console.error("Missing .env.local");
    process.exit(1);
  }
  for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("=");
    if (i < 0) continue;
    const k = t.slice(0, i).trim();
    let v = t.slice(i + 1).trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1);
    }
    if (OVERRIDE_KEYS.has(k) || !(k in process.env)) env[k] = v;
  }
  return env;
}

async function request(method, url, key, body) {
  const headers = {
    apikey: key,
    Authorization: `Bearer ${key}`,
    Accept: "application/json",
  };
  if (body) headers["Content-Type"] = "application/json";
  const res = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = null;
  }
  return { status: res.status, text, json };
}

const env = loadEnv();
const base = (env.NEXT_PUBLIC_SUPABASE_URL || "").replace(/\/$/, "");
const key = env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const ref = new URL(base).host.split(".")[0];

console.log("\n=== Active Supabase database check ===\n");
console.log("Project ref (from .env.local):", ref);
console.log("Dashboard Project URL must be:", base);
console.log("Branch selector must be: Production (not a preview branch)\n");

const probeBody = {
  request_type: "contact",
  name: "LinkUp Confirm",
  email: "confirm@linkup.test",
  message: "Database confirmation probe — safe to delete.",
  subject: null,
  user_id: null,
};

const linkups = await request("GET", `${base}/rest/v1/linkups?select=id&limit=1`, key);
const rpc = await request(
  "POST",
  `${base}/rest/v1/rpc/submit_support_request`,
  key,
  probeBody,
);
const table = await request("POST", `${base}/rest/v1/support_requests`, key, {
  request_type: "contact",
  name: "LinkUp Confirm",
  email: "confirm@linkup.test",
  message: "Database confirmation probe — safe to delete.",
});

console.log("linkups GET:                    ", linkups.status, linkups.status === 200 ? "OK" : "FAIL");
console.log("submit_support_request RPC POST:", rpc.status, rpc.json?.code ?? "");
console.log("support_requests table POST:    ", table.status, table.json?.code ?? "");

let failed = false;

if (linkups.status !== 200) {
  failed = true;
  console.log("\nlinkups failed → .env.local does not match a LinkUp database.");
}

if (rpc.status === 200 || rpc.status === 201 || rpc.status === 204) {
  console.log("\nOK: Support RPC works on project", ref);
  process.exit(0);
}

if (table.status === 201 || table.status === 204) {
  console.log("\nOK: Support table insert works on project", ref);
  process.exit(0);
}

failed = true;
console.log("\nFAIL: Support API not available on project", ref);
console.log("\nRoot cause (most common):");
console.log("  • SQL was applied on a preview branch or different project than .env.local");
console.log("  • Or PostgREST has not picked up support_requests on this database");
console.log("\nFix (once):");
console.log("  1. Dashboard → SQL Editor → Production branch → project", ref);
console.log("  2. Run supabase/migrations/20260523120000_support_requests_rpc.sql");
console.log("  3. Re-run: node scripts/confirm-active-supabase-database.mjs");
console.log("  4. If still failing: Settings → General → Pause project → Restore (once)\n");

if (rpc.text) {
  console.log("RPC body:", rpc.text.slice(0, 280).replace(/\s+/g, " "));
}

process.exit(failed ? 1 : 0);
