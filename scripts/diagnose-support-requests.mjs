/**
 * Proves whether public.support_requests is visible to PostgREST for the
 * project in .env.local (same API as npm run verify:supabase).
 *
 * Usage: node scripts/diagnose-support-requests.mjs
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

function jwtPayload(key) {
  return JSON.parse(Buffer.from(key.split(".")[1], "base64url").toString("utf8"));
}

async function rest(method, endpoint, key, body) {
  const headers = {
    apikey: key,
    Authorization: `Bearer ${key}`,
    Accept: "application/json",
  };
  if (body) headers["Content-Type"] = "application/json";
  const res = await fetch(endpoint, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = text;
  }
  return { status: res.status, json, text };
}

const env = loadEnv();
const base = (env.NEXT_PUBLIC_SUPABASE_URL || "").replace(/\/$/, "");
const key = env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

if (!base || !key) {
  console.error("Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local");
  process.exit(1);
}

const host = new URL(base).host;
const refFromUrl = host.split(".")[0];
let jwt;
try {
  jwt = jwtPayload(key);
} catch {
  console.error("Could not decode anon key JWT");
  process.exit(1);
}

console.log("\n=== LinkUp PostgREST diagnostic ===\n");
console.log("Dashboard must show Project URL:", base);
console.log("Project ref (URL):            ", refFromUrl);
console.log("Project ref (JWT):            ", jwt.ref);
console.log("JWT role:                     ", jwt.role);
console.log(
  refFromUrl === jwt.ref ? "Ref match:                     YES" : "Ref match:                     NO — fix .env.local",
);
console.log("\nIf Dashboard URL/ref differs, SQL was applied to a different project or branch.\n");

const tests = [
  {
    label: "linkups (baseline — same project/API)",
    method: "GET",
    url: `${base}/rest/v1/linkups?select=id&limit=1`,
  },
  {
    label: "linkup_attendees (baseline)",
    method: "GET",
    url: `${base}/rest/v1/linkup_attendees?select=id&limit=1`,
  },
  {
    label: "support_requests GET select=id",
    method: "GET",
    url: `${base}/rest/v1/support_requests?select=id&limit=1`,
  },
  {
    label: "support_requests POST insert (app path)",
    method: "POST",
    url: `${base}/rest/v1/support_requests`,
    body: {
      request_type: "contact",
      name: "LinkUp Diagnostic",
      email: "diagnostic@linkup.test",
      message: "PostgREST probe — safe to delete from Dashboard.",
    },
  },
];

console.log("--- REST probes (anon key from .env.local) ---\n");

let linkupsOk = false;
let supportPostOk = false;

for (const t of tests) {
  try {
    const { status, json, text } = await rest(t.method, t.url, key, t.body);
    const code = json && typeof json === "object" && "code" in json ? json.code : "";
    const hint = json && typeof json === "object" && "hint" in json ? json.hint : "";
    console.log(`${status} ${t.label}`);
    console.log(`    ${t.method} ${t.url}`);
    if (code) console.log(`    code: ${code}`);
    if (hint) console.log(`    hint: ${hint}`);
    if (!code && status >= 400) {
      console.log(`    body: ${text.slice(0, 280).replace(/\s+/g, " ")}`);
    }
    console.log("");
    if (t.label.startsWith("linkups") && status === 200) linkupsOk = true;
    if (t.label.startsWith("support_requests POST") && (status === 201 || status === 204)) {
      supportPostOk = true;
    }
  } catch (e) {
    console.log(`FAIL ${t.label}: ${e.message}\n`);
  }
}

console.log("--- Interpretation ---\n");

if (!linkupsOk) {
  console.log("linkups failed → .env.local does not match a project with LinkUp schema.");
  process.exit(1);
}

if (supportPostOk) {
  console.log("support_requests POST succeeded → table is in PostgREST for ref", refFromUrl);
  console.log("Re-run: npm run verify:supabase");
  process.exit(0);
}

console.log("linkups OK but support_requests 404/PGRST205 on ref", refFromUrl);
console.log("");
console.log("This means ONE of:");
console.log("  A) Table is NOT in the database PostgREST serves for THIS ref (wrong branch/project);");
console.log("  B) Table exists in Postgres but PostgREST schema cache is stuck.");
console.log("");
console.log("Run the SQL block below in Dashboard → SQL Editor for project", refFromUrl);
console.log("(branch selector must be Production / main, not a preview branch).\n");

console.log(`--- SQL (paste in Supabase SQL Editor, project ${refFromUrl}) ---

-- 1) Table registered in Postgres?
SELECT
  c.oid::regclass AS table_name,
  c.relrowsecurity AS rls_enabled,
  pg_catalog.pg_get_userbyid(c.relowner) AS owner
FROM pg_catalog.pg_class c
JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public' AND c.relname = 'support_requests';

-- 2) API role privileges (PostgREST uses anon/authenticated)
SELECT
  has_table_privilege('anon', 'public.support_requests', 'SELECT') AS anon_select,
  has_table_privilege('anon', 'public.support_requests', 'INSERT') AS anon_insert,
  has_table_privilege('authenticated', 'public.support_requests', 'SELECT') AS auth_select,
  has_table_privilege('authenticated', 'public.support_requests', 'INSERT') AS auth_insert;

-- 3) Compare sibling tables on same DB
SELECT tablename
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('linkups', 'linkup_attendees', 'support_requests')
ORDER BY tablename;

-- 4) Reload PostgREST cache (run both)
SELECT pg_notify('pgrst', 'reload tables');
SELECT pg_notify('pgrst', 'reload schema');

---`);

console.log("If step 1 returns 0 rows → table is NOT on this project's database.");
console.log("If step 1 returns 1 row but REST still 404 → pause/resume project:");
console.log("  Dashboard → Project Settings → General → Pause project → Restore");
console.log("Then wait 2 min and run: node scripts/diagnose-support-requests.mjs\n");
