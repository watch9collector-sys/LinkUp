/**
 * Verifies .env.local matches PostgREST: project ref, JWT ref claim, and linkups table.
 * Usage: node scripts/verify-supabase-tables.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const envPath = path.join(root, ".env.local");

function loadEnvLocal() {
  if (!fs.existsSync(envPath)) {
    console.error("Missing .env.local at", envPath);
    process.exit(1);
  }
  const env = {};
  for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("=");
    if (i === -1) continue;
    const k = t.slice(0, i).trim();
    let v = t.slice(i + 1).trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1);
    }
    env[k] = v;
  }
  return env;
}

function jwtPayload(anonKey) {
  const parts = anonKey.split(".");
  if (parts.length < 2) return null;
  const json = Buffer.from(parts[1], "base64url").toString("utf8");
  return JSON.parse(json);
}

function maskKey(k) {
  if (!k || k.length < 24) return "(short)";
  return `${k.slice(0, 12)}…${k.slice(-8)}`;
}

const env = loadEnvLocal();
const url = (env.NEXT_PUBLIC_SUPABASE_URL || "").replace(/\/$/, "");
const key = env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

if (!url || !key) {
  console.error("NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must be set in .env.local");
  process.exit(1);
}

const host = new URL(url).host;
const refFromUrl = host.split(".")[0];
let refFromJwt = "(decode failed)";
try {
  refFromJwt = jwtPayload(key)?.ref ?? "(no ref in JWT)";
} catch {
  /* ignore */
}

console.log("\n--- .env.local ---");
console.log("URL host:     ", host);
console.log("Project ref:  ", refFromUrl, refFromUrl === refFromJwt ? "✓ matches JWT `ref`" : "✗ JWT ref is: " + refFromJwt);
console.log("Anon key:     ", maskKey(key));

const endpoints = [
  `${url}/rest/v1/linkups?select=id&limit=1`,
  `${url}/rest/v1/linkup_attendees?select=id&limit=1`,
];

console.log("\n--- PostgREST ---");
for (const ep of endpoints) {
  try {
    const r = await fetch(ep, {
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        Accept: "application/json",
      },
    });
    const text = await r.text();
    const ok = r.ok;
    console.log(r.status, ok ? "OK" : "FAIL", ep.replace(url, ""));
    if (!ok) console.log("   ", text.slice(0, 280).replace(/\s+/g, " "));
  } catch (e) {
    console.log("FAIL", ep, e?.cause?.message || e.message);
  }
}

console.log("\nIf linkups returns 404 / schema cache: run supabase/migrations/20260212160000_linkups_schema.sql in THIS project, then:");
console.log("  select pg_notify('pgrst', 'reload schema');");
console.log("Restart `npm run dev` after changing .env.local.\n");
