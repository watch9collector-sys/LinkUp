/**
 * Validates auth-related configuration for closed testing.
 * Usage: node scripts/verify-auth-config.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const envPath = path.join(root, ".env.local");

function loadEnv() {
  const merged = { ...process.env };
  if (fs.existsSync(envPath)) {
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
      if (!(k in process.env)) merged[k] = v;
    }
  }
  return merged;
}

const env = loadEnv();
const siteUrl = (env.NEXT_PUBLIC_SITE_URL || "").trim().replace(/\/$/, "");
const authDebug = (env.NEXT_PUBLIC_LINKUP_AUTH_DEBUG || "").trim().toLowerCase();

const resetPagePath = path.join(root, "app/auth/reset-password/page.tsx");
const resetClientPath = path.join(root, "app/auth/reset-password/ResetPasswordClient.tsx");

let failed = 0;

function fail(msg) {
  console.error("FAIL", msg);
  failed += 1;
}

console.log("\n--- Auth configuration (closed testing) ---");

if (!fs.existsSync(resetPagePath) || !fs.existsSync(resetClientPath)) {
  fail("Password reset route files missing under app/auth/reset-password/");
} else {
  console.log("OK  Password reset page exists (/auth/reset-password).");
}

if (authDebug === "true") {
  console.warn(
    "WARN NEXT_PUBLIC_LINKUP_AUTH_DEBUG=true — disable before shared/staging/production deploy.",
  );
} else {
  console.log("OK  Auth debug flag is not enabled.");
}

const origins = [
  "http://localhost:3030",
  siteUrl || null,
].filter(Boolean);

console.log("\nAdd these Redirect URLs in Supabase → Authentication → URL configuration:");
for (const origin of origins) {
  console.log(`  • ${origin}/auth/reset-password`);
}
console.log("  • http://<your-lan-ip>:3030/auth/reset-password  (for mobile Safari on local network)");
if (siteUrl) {
  console.log(`\nNEXT_PUBLIC_SITE_URL=${siteUrl}`);
} else {
  console.log(
    "\nOptional: set NEXT_PUBLIC_SITE_URL in .env.local for production email links when not testing from browser origin.",
  );
}

console.log("\nManual E2E (required before closed testing):");
console.log("  1. Home → Sign in → Forgot password? → submit account email");
console.log("  2. Open reset email on the SAME browser/device used in step 1");
console.log("  3. Confirm /auth/reset-password shows “Set new password” (not Home dashboard)");
console.log("  4. Save password → sign out → sign in with NEW password only");

if (failed > 0) {
  process.exit(1);
}

console.log("\nOK: Auth configuration files present. Complete manual password-reset E2E before testers.\n");
