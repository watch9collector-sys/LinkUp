/**
 * Verifies the profile-images Supabase Storage bucket exists and is listable.
 * Usage: npm run verify:storage
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

function loadEnv() {
  try {
    const raw = readFileSync(resolve(process.cwd(), ".env.local"), "utf8");
    for (const line of raw.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      const value = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, "");
      if (!process.env[key]) process.env[key] = value;
    }
  } catch {
    // optional
  }
}

loadEnv();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const BUCKET = "profile-images";

if (!url || !key) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY");
  process.exit(1);
}

const supabase = createClient(url, key);

console.log(`Checking bucket: "${BUCKET}"`);
console.log(`Supabase URL: ${url}`);

const { data: buckets, error: listBucketsError } = await supabase.storage.listBuckets();

if (listBucketsError) {
  console.warn("listBuckets:", listBucketsError.message);
} else {
  const names = buckets?.map((b) => b.id ?? b.name) ?? [];
  console.log("Buckets in project:", names.join(", ") || "(none)");
  const found = buckets?.some((b) => b.id === BUCKET || b.name === BUCKET);
  if (!found) {
    console.error(`FAIL: "${BUCKET}" not found via listBuckets.`);
    process.exit(1);
  }
  console.log(`OK: "${BUCKET}" exists.`);
}

const { error: listError } = await supabase.storage.from(BUCKET).list("", { limit: 1 });

if (listError) {
  console.error(`FAIL: cannot list "${BUCKET}":`, listError.message);
  console.error("\nIf the bucket exists in the dashboard, run:");
  console.error("  supabase/migrations/20260518130000_profile_images_storage.sql");
  process.exit(1);
}

console.log(`OK: "${BUCKET}" is reachable.`);
console.log("Upload paths used by the app:");
console.log("  {userId}/avatar.webp (or .jpg)");
console.log("  {userId}/banner.webp (or .jpg)");
console.log("\nIf signed-in uploads fail, run the RLS policies in the migration above.");
