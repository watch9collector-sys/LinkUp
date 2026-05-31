/**
 * Validates required environment before `next build`.
 * Usage: node scripts/validate-env.mjs
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

function jwtRef(anonKey) {
  const payload = JSON.parse(Buffer.from(anonKey.split(".")[1], "base64url").toString());
  return payload.ref;
}

const env = loadEnv();
const url = (env.NEXT_PUBLIC_SUPABASE_URL || "").trim().replace(/\/$/, "");
const anonKey = (env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "").trim();
const authDebug = (env.NEXT_PUBLIC_LINKUP_AUTH_DEBUG || "").trim().toLowerCase();
const isProductionBuild = process.env.NODE_ENV === "production";

let failed = 0;

function fail(message) {
  console.error("FAIL:", message);
  failed += 1;
}

console.log("\n--- Environment validation ---");

if (!url) {
  fail("NEXT_PUBLIC_SUPABASE_URL is missing. Add it to .env.local or CI secrets.");
} else {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
      fail(`NEXT_PUBLIC_SUPABASE_URL must be http(s): got ${parsed.protocol}`);
    }
  } catch {
    fail("NEXT_PUBLIC_SUPABASE_URL is not a valid URL.");
  }
}

if (!anonKey) {
  fail("NEXT_PUBLIC_SUPABASE_ANON_KEY is missing. Add it to .env.local or CI secrets.");
}

if (url && anonKey) {
  try {
    const refFromUrl = new URL(url).host.split(".")[0];
    const refFromJwt = jwtRef(anonKey);
    if (refFromUrl !== refFromJwt) {
      fail(
        `Supabase URL project ref (${refFromUrl}) does not match anon key JWT ref (${refFromJwt}).`,
      );
    } else {
      console.log("OK  Supabase URL and anon key project ref match:", refFromUrl);
    }
  } catch {
    fail("Could not decode NEXT_PUBLIC_SUPABASE_ANON_KEY JWT.");
  }
}

if (isProductionBuild && authDebug === "true") {
  fail(
    "NEXT_PUBLIC_LINKUP_AUTH_DEBUG=true is not allowed for production builds. Remove it from deployment env.",
  );
} else if (authDebug === "true") {
  console.warn("WARN NEXT_PUBLIC_LINKUP_AUTH_DEBUG=true (dev only — do not use in shared/staging/prod).");
} else {
  console.log("OK  Auth debug disabled (NEXT_PUBLIC_LINKUP_AUTH_DEBUG not true).");
}

if (failed > 0) {
  console.error(`\n${failed} environment error(s). Fix .env.local or CI secrets, then re-run build.\n`);
  process.exit(1);
}

console.log("OK  Required environment variables are present.\n");
