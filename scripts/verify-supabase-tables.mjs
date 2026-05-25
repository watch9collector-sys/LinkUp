/**
 * Verifies .env.local matches PostgREST and linkups schema (including latitude/longitude).
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

const headers = {
  apikey: key,
  Authorization: `Bearer ${key}`,
  Accept: "application/json",
};

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
console.log(
  "Project ref:  ",
  refFromUrl,
  refFromUrl === refFromJwt ? "✓ matches JWT `ref`" : "✗ JWT ref is: " + refFromJwt,
);
console.log("Anon key:     ", maskKey(key));

/** Same columns the app selects in src/lib/linkupsApi.ts */
const linkupsAppSelect =
  "id,title,category,location,latitude,longitude,starts_at,description,host_id,host_display_name,created_at,updated_at";

const checks = [
  {
    name: "linkups (app select incl. latitude/longitude)",
    url: `${url}/rest/v1/linkups?select=${encodeURIComponent(linkupsAppSelect)}&limit=1`,
    fix: "supabase/migrations/20260523100000_linkups_coordinates.sql",
  },
  {
    name: "linkup_attendees",
    url: `${url}/rest/v1/linkup_attendees?select=id&limit=1`,
    fix: "supabase/migrations/20260212160000_linkups_schema.sql",
  },
];

console.log("\n--- PostgREST / schema ---");
let failed = 0;

for (const { name, url: ep, fix } of checks) {
  try {
    const r = await fetch(ep, { headers });
    const text = await r.text();
    const ok = r.ok;
    console.log(r.status, ok ? "OK" : "FAIL", name);
    if (!ok) {
      failed += 1;
      console.log("   ", text.slice(0, 400).replace(/\s+/g, " "));
      if (text.includes("latitude") || text.includes("longitude") || text.includes("schema cache")) {
        console.log("   → Run:", fix);
        console.log("   → Then: select pg_notify('pgrst', 'reload schema');");
      }
    }
  } catch (e) {
    failed += 1;
    console.log("FAIL", name, e?.cause?.message || e.message);
  }
}

if (failed > 0) {
  console.log("\nSchema mismatch: apply pending migrations in Supabase SQL Editor, then re-run this script.\n");
  process.exit(1);
}

console.log("\nOK: Database schema matches frontend linkups queries.\n");
