#!/usr/bin/env node
/**
 * NYVON isolated STAGING-only photo upload/download/removal end-to-end test.
 * Requires a disposable confirmed staging Auth account, NOT a live account.
 * Does not use service-role credentials, delete an account, or touch production.
 *
 * NYVON_STAGING_SUPABASE_URL=https://kxwechptoaituppkmcjr.supabase.co
 * NYVON_STAGING_SUPABASE_KEY=<only the staging anon/publishable key>
 * NYVON_STAGING_TEST_EMAIL=<disposable staging email>
 * NYVON_STAGING_TEST_PASSWORD=<disposable staging password>
 */
import assert from "node:assert/strict";
import { createClient } from "@supabase/supabase-js";

const STAGING = "kxwechptoaituppkmcjr";
const PROD = new Set(["zijrcnzjdafndjdpltst", "iwpjmlprykltjnvbmikk"]);
const rawUrl = process.env.NYVON_STAGING_SUPABASE_URL;
const key = process.env.NYVON_STAGING_SUPABASE_KEY;
const email = process.env.NYVON_STAGING_TEST_EMAIL;
const password = process.env.NYVON_STAGING_TEST_PASSWORD;
if (!rawUrl || !key || !email || !password) {
  console.error("Missing a required staging-only environment variable.");
  process.exit(2);
}
let parsed;
try { parsed = new URL(rawUrl); }
catch { console.error("Invalid URL"); process.exit(2); }
const ref = parsed.hostname.split(".")[0];
if (
  parsed.protocol !== "https:" ||
  parsed.hostname !== STAGING + ".supabase.co" ||
  ref !== STAGING || PROD.has(ref) ||
  parsed.username || parsed.password || parsed.search || parsed.hash ||
  parsed.pathname !== "/"
) {
  console.error("REFUSED: this tool can ONLY access the approved isolated staging project.");
  process.exit(2);
}
const client = createClient(parsed.toString(), key, {
  auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
});
const png = Uint8Array.from(
  Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Y9XzGAAAAAASUVORK5CYII=", "base64")
);
const run = async () => {
  const {data:login,error:loginError} = await client.auth.signInWithPassword({email,password});
  assert.ifError(loginError);
  assert.ok(login.user?.id, "Confirmed disposable staging account required");
  const id = login.user.id;
  // Test both user-owned media directories. Do not touch any existing object.
  const paths = ["avatars","banners"].map(prefix =>
    prefix + "/" + id + "/qa-" + crypto.randomUUID() + ".png"
  );
  const uploaded = new Set();
  let completed = false;
  try {
    for (const path of paths) {
      const up = await client.storage.from("profile-images")
        .upload(path, png, {contentType:"image/png",cacheControl:"0",upsert:false});
      assert.ifError(up.error);
      uploaded.add(path);
      const got = await client.storage.from("profile-images").download(path);
      assert.ifError(got.error);
      assert.ok((await got.data.arrayBuffer()).byteLength > 0);
      console.log("PASS staging upload and download:", path.startsWith("avatars/") ? "avatar" : "banner");
    }
    for (const path of paths) {
      const removed = await client.storage.from("profile-images").remove([path]);
      assert.ifError(removed.error);
      uploaded.delete(path);
      const after = await client.storage.from("profile-images").download(path);
      assert.ok(after.error, "Expected removed object to be inaccessible");
      console.log("PASS staging object removal and readback denial:", path.startsWith("avatars/") ? "avatar" : "banner");
    }
    completed = true;
  } finally {
    for (const path of uploaded) {
      const cleanup = await client.storage.from("profile-images").remove([path]);
      if (cleanup.error) console.error("CLEANUP REQUIRED: synthetic uploaded photo remains");
    }
    await client.auth.signOut();
  }
  if (!completed) process.exitCode = 1;
};
try { await run(); }
catch (e) { console.error("FAIL staging storage lifecycle:",e?.message||"unknown error"); process.exitCode = 1; }
