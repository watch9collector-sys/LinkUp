#!/usr/bin/env node
/**
 * NYVON V1.5 — PRODUCTION PUBLIC PRIVACY RELEASE GATE (READ-ONLY).
 *
 * No Auth passwords, admin keys, service_role credentials or writes.
 * Uses only a PUBLIC/anon key. Tests only HTTP GET and read-only RPC POSTs.
 * Fails CLOSED until the two dangerous raw-table read endpoints are denied.
 * Prints status/results only; NEVER prints user data or environment keys.
 *
 * This script does not approve publication by itself: also test signed-in
 * flows, real Android app compatibility, Play signing, deletion fulfillment.
 */
import assert from "node:assert/strict";

const URL = "https://zijrcnzjdafndjdpltst.supabase.co";
const KEY = process.env.NYVON_PRODUCTION_PUBLISHABLE_KEY?.trim();
if (!KEY || /^sb_secret_|^sb_service_role_/i.test(KEY)) {
  console.error("REFUSED: supply ONLY the PRODUCTION public/anon/publishable key.");
  process.exit(2);
}
const HEADERS = {
  apikey: KEY,
  "Content-Type": "application/json",
  Accept: "application/json",
};
if (KEY.startsWith("eyJ")) HEADERS.Authorization = "Bearer " + KEY;
const base = URL + "/rest/v1/";
const failures = [];
async function request(path, opts = {}) {
  const response = await fetch(base + path, {
    headers: HEADERS,
    cache: "no-store",
    signal: AbortSignal.timeout(12_000),
    ...opts,
  });
  let json = null;
  try { json = await response.json(); } catch {}
  return { status: response.status, json };
}
async function run(label, fn) {
  try {
    const info = await fn();
    console.log("PASS", label, info ?? "");
  } catch (e) {
    failures.push(label);
    console.error("FAIL", label, (e instanceof Error ? e.message : "unknown").slice(0,200));
  }
}
async function rawMustBeDenied(table, select) {
  const resp = await request(
    table + "?select=" + encodeURIComponent(select) + "&limit=1",
    { method: "GET" }
  );
  if (![401,403].includes(resp.status)) {
    throw new Error("raw table read NOT denied; HTTP " + resp.status);
  }
  return "HTTP " + resp.status;
}

await run("anonymous raw LinkUp reads DENIED", () =>
  rawMustBeDenied("linkups", "id,host_id,latitude,longitude"));
await run("anonymous raw attendee reads DENIED", () =>
  rawMustBeDenied("linkup_attendees", "id,user_id,display_name"));
await run("anonymous support-request data NOT EXPOSED", async () => {
  const resp = await request("support_requests?select=id,email&limit=1", {method:"GET"});
  if ([401,403].includes(resp.status)) return "HTTP " + resp.status;
  // SELECT may be granted but RLS has no anonymous SELECT policy, giving
  // 200/[] instead of 401. This proves only no records in this read, not
  // the underlying policies: separately audit live pg_policies.
  if (resp.status===200 && Array.isArray(resp.json) && resp.json.length===0) {
    return "HTTP 200, zero visible rows (confirm RLS metadata separately)";
  }
  throw new Error("support data unexpectedly accessible; HTTP " + resp.status);
});
await run("redacted guest-safe discovery works", async () => {
  const resp = await request("rpc/fetch_safe_linkups", {
    method: "POST",
    body: JSON.stringify({
      p_as_of: new Date().toISOString(),
      p_limit: 25,
      p_offset: 0,
    }),
  });
  assert.equal(resp.status,200,"safe discovery HTTP "+resp.status);
  assert.ok(Array.isArray(resp.json),"safe discovery must return a list");
  const allowed = new Set([
    "id","title","category","location","latitude","longitude",
    "starts_at","description","host_id","host_display_name","created_at",
    "updated_at","linkup_attendees","attendee_count","you_joined",
    "you_host","location_is_approximate"
  ]);
  for (const row of resp.json) {
    assert.ok(row && typeof row === "object","invalid row");
    for (const key of Object.keys(row)) assert.ok(allowed.has(key),"unexpected field");
    assert.equal(row.host_id,null,"host identifier exposed");
    assert.equal(row.latitude,null,"latitude exposed");
    assert.equal(row.longitude,null,"longitude exposed");
    assert.equal(row.description,"","private description exposed");
    assert.deepEqual(row.linkup_attendees,[],"attendee identities exposed");
    assert.equal(row.you_joined,false,"anonymous session erroneously joined");
    assert.equal(row.you_host,false,"anonymous session erroneously hosts");
  }
  return "HTTP 200; " + resp.json.length + " event(s) redacted";
});
await run("public beta metrics returns only aggregate counts", async () => {
  const resp = await request("rpc/fetch_public_beta_metrics", {
    method: "POST",
    body: "{}",
  });
  assert.equal(resp.status,200,"public metrics HTTP "+resp.status);
  const value = Array.isArray(resp.json) ? resp.json[0] : resp.json;
  assert.ok(value && typeof value==="object" && !Array.isArray(value),
    "expected a counts-only response");
  const fields=Object.keys(value);
  assert.deepEqual(fields.sort(),["connections_made","linkups_created"],
    "unexpected metrics columns");
  for(const field of fields) {
    assert.ok(Number.isSafeInteger(Number(value[field])) &&
              Number(value[field])>=0,"invalid aggregate");
  }
  return "HTTP 200; count values not printed";
});
if (failures.length) {
  console.error("RELEASE NO-GO: " + failures.length +
    " public privacy gate(s) failed. Never publish or reopen public SELECT.");
  process.exitCode=1;
} else {
  console.log("PUBLIC PRIVACY GATE PASS (read-only). Signed-in/mobile/Play gates remain independent.");
}
