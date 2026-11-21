#!/usr/bin/env node
/**
 * Nyvon isolated staging HTTP smoke checks.
 * READ-ONLY as an anonymous client: no production calls, no writes.
 * Run manually with disposable staging publishable/anon key in environment.
 * This is NOT a substitute for signed-in, Realtime, frontend, or Android E2E.
 *
 * Required environment:
 *   NYVON_STAGING_SUPABASE_URL=https://kxwechptoaituppkmcjr.supabase.co
 *   NYVON_STAGING_SUPABASE_KEY=<staging publishable OR legacy anon key>
 *
 * Never commit real credentials or use the production project URL.
 */
import assert from "node:assert/strict";

const APPROVED_STAGING_REF = "kxwechptoaituppkmcjr";
const BLOCKED_REFS = new Set([
  "zijrcnzjdafndjdpltst", // Nyvon live production
  "iwpjmlprykltjnvbmikk", // historical project, not staging
]);

const urlRaw = process.env.NYVON_STAGING_SUPABASE_URL;
const key = process.env.NYVON_STAGING_SUPABASE_KEY;
if (!urlRaw || !key) {
  console.error("Set staging-only NYVON_STAGING_SUPABASE_URL and NYVON_STAGING_SUPABASE_KEY.");
  process.exit(2);
}

let base;
try {
  base = new URL(urlRaw);
} catch {
  console.error("Invalid staging Supabase URL.");
  process.exit(2);
}

const projectRef = base.hostname.split(".")[0];
if (
  base.protocol !== "https:" ||
  base.username ||
  base.password ||
  base.search ||
  base.hash ||
  base.pathname !== "/" ||
  base.hostname !== `${APPROVED_STAGING_REF}.supabase.co` ||
  projectRef !== APPROVED_STAGING_REF ||
  BLOCKED_REFS.has(projectRef)
) {
  console.error("REFUSED: URL is not the explicitly approved isolated staging project.");
  process.exit(2);
}

const headers = {
  apikey: key,
  Accept: "application/json",
};
// Legacy anon JWTs can be sent as Bearer. sb_publishable_ keys must
// not be misused as Bearer tokens; the gateway recognizes the apikey header.
if (key.split(".").length === 3) headers.Authorization = `Bearer ${key}`;

function endpoint(path, params = {}) {
  const result = new URL(`/rest/v1/${path}`, base);
  for (const [k, v] of Object.entries(params)) result.searchParams.set(k, String(v));
  return result;
}

async function request(path, { method = "GET", params, body } = {}) {
  const response = await fetch(endpoint(path, params), {
    method,
    headers: {
      ...headers,
      ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    signal: AbortSignal.timeout(12_000),
    redirect: "error",
  });
  const responseBody = await response.text();
  let payload;
  try { payload = JSON.parse(responseBody); } catch { payload = null; }
  return { status: response.status, payload };
}

const fakeId = "00000000-0000-0000-0000-000000000000";
let checks = 0;
let failures = 0;
async function check(name, action) {
  checks++;
  try {
    await action();
    console.log(`PASS ${name}`);
  } catch (error) {
    failures++;
    console.error(`FAIL ${name}: ${error?.message || "unknown test error"}`);
  }
}

const expectedDenied = (result) =>
  assert.ok(
    [401, 403].includes(result.status),
    `expected explicit HTTP 401/403, got ${result.status}`,
  );

console.log(`Checking isolated staging HTTP API (${APPROVED_STAGING_REF}) only.`);

await check("anonymous discovery returns redacted upcoming rows", async () => {
  const r = await request("rpc/fetch_safe_linkups", {
    params: { p_as_of: new Date().toISOString(), p_limit: 50, p_offset: 0 },
  });
  assert.equal(r.status, 200);
  assert.ok(Array.isArray(r.payload) && r.payload.length >= 2, "expected synthetic upcoming fixtures");
  for (const item of r.payload) {
    assert.equal(item.host_id, null);
    assert.equal(item.latitude, null);
    assert.equal(item.longitude, null);
    assert.equal(item.description, "");
    assert.equal(item.host_display_name, "Host");
    assert.equal(item.location, "Location shared with attendees");
    assert.deepEqual(item.linkup_attendees, []);
    assert.equal(item.you_host, false);
    assert.equal(item.you_joined, false);
    assert.ok(new Date(item.starts_at) > new Date(), "past event leaked");
  }
  assert.ok(!r.payload.some((x) => x.title === "Staging A past"), "past fixture leaked");
});

await check("anonymous beta metrics expose ONLY aggregate totals", async () => {
  const r = await request("rpc/fetch_public_beta_metrics", { method: "POST", body: {} });
  assert.equal(r.status, 200);
  assert.ok(Array.isArray(r.payload) && r.payload.length === 1, "expected a single aggregate row");
  const stats = r.payload[0];
  assert.deepEqual(Object.keys(stats).sort(), ["connections_made", "linkups_created"]);
  for (const key of ["connections_made", "linkups_created"]) {
    const count = Number(stats[key]);
    assert.ok(Number.isSafeInteger(count) && count >= 0, "expected a valid nonnegative count");
  }
});

for (const table of ["linkups", "linkup_attendees"]) {
  await check(`anon direct table SELECT denied: ${table}`, async () => {
    expectedDenied(await request(table, { params: { select: "id", limit: 1 } }));
  });
}

// These checks use only the staging project, synthetic IDs, and an ANONYMOUS
// credential. The mutations must fail at the privileges layer; non-401/403
// responses are treated as FAIL, not assumed to be benign.
const privileged = [
  ["current_user_hosts_linkup", "GET", { p_linkup_id: fakeId }],
  ["linkup_join_allowed", "GET", { p_linkup_id: fakeId }],
  ["is_platform_founder", "GET", {}],
  ["my_interaction_block_ids", "GET", {}],
  ["users_blocked_either_way", "GET", { a: fakeId, b: fakeId }],
  ["block_linkup_host", "POST", { p_linkup_id: fakeId }],
  ["founder_remove_linkup", "POST", { p_linkup_id: fakeId, p_reason: "synthetic staging probe" }],
  ["founder_set_report_status", "POST", { p_report_id: fakeId, p_status: "reviewed" }],
  ["submit_user_report", "POST", {
    p_reason: "other", p_details: "synthetic staging test only",
    p_reported_user_id: fakeId, p_reported_linkup_id: null,
  }],
];
for (const [name, method, args] of privileged) {
  await check(`anon privileged RPC denied: ${name}`, async () => {
    const result = method === "GET"
      ? await request(`rpc/${name}`, { params: args })
      : await request(`rpc/${name}`, { method, body: args });
    expectedDenied(result);
  });
}

console.log(`Anonymous HTTP gate: ${checks - failures}/${checks} checks passed.`);
console.log("NOT COVERED: real signed-in JWT roles, join/leave writes, WebSocket, browser, Android, account deletion.");
if (failures) process.exitCode = 1;
