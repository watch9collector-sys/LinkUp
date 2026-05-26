/**
 * Verifies the profile-images Supabase Storage bucket exists and is listable.
 * Uses the Storage REST API (no @supabase/supabase-js) so Node 20 does not need ws.
 * Usage: npm run verify:storage
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const envPath = path.join(root, ".env.local");
const BUCKET = "profile-images";

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

function maskKey(k) {
  if (!k || k.length < 24) return "(short)";
  return `${k.slice(0, 12)}…${k.slice(-8)}`;
}

async function storageFetch(baseUrl, key, pathname, options = {}) {
  const url = `${baseUrl}/storage/v1${pathname}`;
  const headers = {
    apikey: key,
    Authorization: `Bearer ${key}`,
    ...options.headers,
  };
  const response = await fetch(url, { ...options, headers });
  const text = await response.text();
  let body = null;
  if (text) {
    try {
      body = JSON.parse(text);
    } catch {
      body = text;
    }
  }
  return { response, body, text };
}

const env = loadEnvLocal();
const url = (env.NEXT_PUBLIC_SUPABASE_URL || "").replace(/\/$/, "");
const key = env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

if (!url || !key) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local");
  process.exit(1);
}

console.log(`\nChecking bucket: "${BUCKET}"`);
console.log("Supabase URL:", url);
console.log("Anon key:    ", maskKey(key));
console.log("\n--- Storage REST API (Node", process.version + ") ---\n");

let failed = 0;

// Optional: list buckets (may be restricted on some projects; object list is the real check)
try {
  const { response, body } = await storageFetch(url, key, "/bucket", { method: "GET" });
  if (response.ok && Array.isArray(body)) {
    const names = body.map((b) => b.name ?? b.id).filter(Boolean);
    console.log(response.status, "OK", "list buckets");
    console.log("   buckets:", names.join(", ") || "(none)");
    const found = names.includes(BUCKET);
    if (!found) {
      console.warn(`   WARN: "${BUCKET}" not in bucket list (object list check still runs)`);
    } else {
      console.log(`   OK: "${BUCKET}" listed.`);
    }
  } else {
    console.warn(
      response.status,
      "SKIP list buckets",
      typeof body === "object" && body?.message ? body.message : response.statusText,
    );
    console.warn("   (This is normal with anon key; continuing with object list…)");
  }
} catch (err) {
  failed += 1;
  console.error("FAIL list buckets:", err?.cause?.message || err.message);
}

// Same operation the app uses: list objects at bucket root (checkProfileImagesBucketReachable)
try {
  const { response, body, text } = await storageFetch(url, key, `/object/list/${BUCKET}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prefix: "", limit: 1, offset: 0 }),
  });

  if (response.ok) {
    console.log(response.status, "OK", `list objects in "${BUCKET}"`);
  } else {
    failed += 1;
    const msg =
      (typeof body === "object" && (body.message || body.error)) ||
      text?.slice(0, 280) ||
      response.statusText;
    console.error(response.status, "FAIL", `list objects in "${BUCKET}"`);
    console.error("   ", msg);
    if (
      String(msg).toLowerCase().includes("bucket not found") ||
      response.status === 404
    ) {
      console.error("\nRun in Supabase SQL Editor:");
      console.error("  supabase/migrations/20260518130000_profile_images_storage.sql");
    }
    if (String(msg).toLowerCase().includes("policy") || response.status === 403) {
      console.error("\nBucket may exist but RLS/policies block listing. Run the migration above.");
    }
  }
} catch (err) {
  failed += 1;
  console.error("FAIL list objects:", err?.cause?.message || err.message);
}

if (failed > 0) {
  console.error("\nStorage verification failed.\n");
  process.exit(1);
}

console.log(`\nOK: "${BUCKET}" is reachable via Storage API.`);
console.log("Upload paths used by the app:");
console.log("  {userId}/avatar.webp (or .jpg)");
console.log("  {userId}/banner.webp (or .jpg)");
console.log("\nNote: Upload/update/delete require a signed-in user in the browser.");
console.log("If browser uploads fail, confirm RLS policies from the migration above.\n");
