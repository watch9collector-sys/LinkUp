/**
 * Confirms .env.local points at one Supabase project and optionally tests sign-in.
 *
 * Usage:
 *   node scripts/verify-auth-project.mjs
 *   AUTH_TEST_EMAIL=you@example.com AUTH_TEST_PASSWORD='your-password' node scripts/verify-auth-project.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(__dirname, "..", ".env.local");

function loadEnv() {
  if (!fs.existsSync(envPath)) {
    console.error("Missing .env.local");
    process.exit(1);
  }
  const env = {};
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
    env[k] = v;
  }
  return env;
}

function jwtRef(anonKey) {
  const payload = JSON.parse(Buffer.from(anonKey.split(".")[1], "base64url").toString());
  return payload.ref;
}

const env = loadEnv();
const url = (env.NEXT_PUBLIC_SUPABASE_URL || "").replace(/\/$/, "");
const anonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

if (!url || !anonKey) {
  console.error("Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local");
  process.exit(1);
}

const host = new URL(url).host;
const refFromUrl = host.split(".")[0];
let refFromJwt = "";
try {
  refFromJwt = jwtRef(anonKey);
} catch {
  console.error("Could not decode anon key JWT");
  process.exit(1);
}

console.log("\n--- Supabase project (.env.local) ---");
console.log("URL host:      ", host);
console.log("Project ref:   ", refFromUrl);
console.log("JWT ref match: ", refFromUrl === refFromJwt ? "YES" : `NO (JWT=${refFromJwt})`);

if (refFromUrl !== refFromJwt) {
  console.error("\nFAIL: URL and anon key are from different Supabase projects.");
  process.exit(1);
}

const testEmail = (process.env.AUTH_TEST_EMAIL || "").trim().toLowerCase();
const testPassword = process.env.AUTH_TEST_PASSWORD || "";

if (!testEmail || !testPassword) {
  console.log("\nOptional sign-in test (does not print your password):");
  console.log("  AUTH_TEST_EMAIL=you@example.com AUTH_TEST_PASSWORD='...' node scripts/verify-auth-project.mjs");
  console.log("\nThen confirm the user exists in Supabase Dashboard → Authentication → Users");
  console.log("  project:", refFromUrl);
  console.log("");
  process.exit(0);
}

console.log("\n--- Sign-in test ---");
console.log("Email:", testEmail);

const tokenUrl = `${url}/auth/v1/token?grant_type=password`;
const response = await fetch(tokenUrl, {
  method: "POST",
  headers: {
    apikey: anonKey,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({ email: testEmail, password: testPassword }),
});

const body = await response.json().catch(() => ({}));

if (response.ok && body.access_token) {
  console.log("OK: sign-in succeeded for this project.");
  console.log("User id:", body.user?.id ?? "(in token response)");
  process.exit(0);
}

console.error("FAIL: sign-in rejected by Supabase Auth");
console.error("HTTP", response.status);
console.error("error:", body.error || body.msg || body.message || body);
console.error("error_code:", body.error_code || body.code || "(none)");

if ((body.error_code || body.code) === "invalid_credentials") {
  console.error("\nLikely causes:");
  console.error("  1. User does not exist in project", refFromUrl);
  console.error("  2. Password is wrong (use password AFTER last reset, not an old one)");
  console.error("  3. Account was created in a different Supabase project");
  console.error("  4. Email typo — compare exact address in Dashboard → Users");
  console.error("\nFix: Dashboard → Authentication → Users → find email → Reset password");
  console.error("     or create a new test user in THIS project.");
}

process.exit(1);
