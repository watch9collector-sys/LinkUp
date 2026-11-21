#!/usr/bin/env node
/**
 * NYVON STAGING-ONLY destructive account-deletion acceptance test.
 * Run LOCALLY with credentials read from a hidden-input wrapper.
 *
 * Required environment:
 * NYVON_STAGING_SUPABASE_URL=https://kxwechptoaituppkmcjr.supabase.co
 * NYVON_STAGING_SUPABASE_KEY=staging publishable/anon key
 * NYVON_STAGING_ADMIN_KEY=staging service-role key (LOCAL only; never in CI/chat)
 * NYVON_QA_DELETE_EMAIL=watch9collector+nyvon-qa-delete-<suffix>@gmail.com
 * NYVON_QA_DELETE_PASSWORD=<disposable password>
 * NYVON_QA_DELETE_CONFIRM="DELETE THIS DISPOSABLE STAGING ACCOUNT"
 *
 * Never accepts production URL or ordinary/non-disposable accounts.
 * Deletes exactly one explicitly selected disposable account after tests.
 * Never runs automatically in npm build/CI.
 */
import assert from "node:assert/strict";
import { createClient } from "@supabase/supabase-js";

const PROJECT = "kxwechptoaituppkmcjr";
const URL = "https://" + PROJECT + ".supabase.co";
const uri = process.env.NYVON_STAGING_SUPABASE_URL;
const publicKey = process.env.NYVON_STAGING_SUPABASE_KEY;
const adminKey = process.env.NYVON_STAGING_ADMIN_KEY;
const email = process.env.NYVON_QA_DELETE_EMAIL?.toLowerCase().trim();
const password = process.env.NYVON_QA_DELETE_PASSWORD;
const confirm = process.env.NYVON_QA_DELETE_CONFIRM;
const allowedEmail = /^watch9collector\+nyvon-qa-delete-[a-z0-9._-]+@gmail\.com$/;

if (uri !== URL || !publicKey || !adminKey || !email || !password ||
    !allowedEmail.test(email) ||
    confirm !== "DELETE THIS DISPOSABLE STAGING ACCOUNT") {
  console.error("REFUSED: requires exact staging URL, dedicated QA-delete email, both staging keys and explicit confirmation.");
  process.exit(2);
}
if (publicKey === adminKey || adminKey.startsWith("sb_publishable_")) {
  console.error("REFUSED: admin key must be separate from public key.");
  process.exit(2);
}
function client(key) {
  return createClient(URL, key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}
const userClient = client(publicKey);
const admin = client(adminKey);
const bucket = admin.storage.from("profile-images");
const png = Uint8Array.from(Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Y9XzGAAAAAASUVORK5CYII=",
  "base64",
));
const avatarPath = id => "avatars/" + id + "/qa-deletion-avatar.png";
const bannerPath = id => "banners/" + id + "/qa-deletion-banner.png";
const findRows = async (table,field,id) => {
  const {data,error} = await admin.from(table).select("id").eq(field,id);
  assert.ifError(error);
  return data;
};
const emptyFolder = async folder => {
  const {data,error} = await bucket.list(folder,{limit:100});
  assert.ifError(error);
  return (data??[]).filter(x=>x.name && !x.name.endsWith("/")).length===0;
};
let victimId,createdEventId,accountDeleted=false;
try {
  const signed = await userClient.auth.signInWithPassword({email,password});
  assert.ifError(signed.error);
  assert.equal(signed.data.user?.email?.toLowerCase(),email);
  victimId=signed.data.user.id;
  const token=signed.data.session?.access_token;
  assert.ok(token,"Real staging session required");
  const owner=await admin.auth.admin.getUserById(victimId);
  assert.ifError(owner.error);
  assert.equal(owner.data.user?.email?.toLowerCase(),email,"Admin independently verified disposable target");
  assert.ok(owner.data.user?.email_confirmed_at,"Test account must be confirmed");

  // Dedicated new disposable account: reject all existing account content.
  assert.equal((await findRows("linkups","host_id",victimId)).length,0,"Preexisting hosted LinkUps");
  assert.equal((await findRows("linkup_attendees","user_id",victimId)).length,0,"Preexisting attendance");
  assert.equal((await findRows("support_requests","user_id",victimId)).length,0,"Preexisting support requests");
  assert.ok(await emptyFolder("avatars/"+victimId),"Preexisting avatar media");
  assert.ok(await emptyFolder("banners/"+victimId),"Preexisting banner media");
  const {count:otherBefore,error:otherError}=await admin.from("linkups")
    .select("id",{count:"exact",head:true}).neq("host_id",victimId);
  assert.ifError(otherError);
  assert.ok(otherBefore!==null);

  const {data:created,error:createError}=await userClient.from("linkups").insert({
    title:"STAGING DELETE QA "+crypto.randomUUID(),
    category:"Social",location:"QA staging location only",
    latitude:38.091,longitude:-103.091,
    starts_at:new Date(Date.now()+10*86400000).toISOString(),
    description:"Disposable account deletion test; no real people",
    host_id:victimId,host_display_name:"QA Delete Member",
  }).select("id").single();
  assert.ifError(createError);
  createdEventId=created.id;
  assert.ifError((await userClient.from("linkup_attendees").insert({
    linkup_id:createdEventId,user_id:victimId,display_name:"QA Delete Member",
  })).error);
  assert.ifError((await userClient.from("support_requests").insert({
    request_type:"delete_account",user_id:victimId,
    name:"QA Delete Member",email,subject:"QA account deletion request",
    message:"Disposable staging-only account deletion QA request.",
  })).error);
  for (const path of [avatarPath(victimId),bannerPath(victimId)]) {
    assert.ifError((await userClient.storage.from("profile-images")
      .upload(path,png,{contentType:"image/png",upsert:false,cacheControl:"0"})).error);
    const downloaded=await userClient.storage.from("profile-images").download(path);
    assert.ifError(downloaded.error);
    assert.ok((await downloaded.data.arrayBuffer()).byteLength>0);
  }
  console.log("PASS disposable staging account created its own event, attendance, deletion request, avatar and banner");

  // An unsigned-in client cannot delete someone else's image.
  const guest=client(publicKey);
  const guestRemoval=await guest.storage.from("profile-images").remove([avatarPath(victimId)]);
  // Supabase Storage may return an empty success for a DELETE filtered
  // to zero rows by RLS. Only verify the actual object survived.
  const stillListed=await bucket.list("avatars/"+victimId,{
    search:"qa-deletion-avatar.png",limit:100,
  });
  assert.ifError(stillListed.error);
  assert.ok((stillListed.data??[]).some(obj=>obj.name==="qa-deletion-avatar.png"),
    "SECURITY FAILURE: guest deletion actually removed the test avatar");
  if(!guestRemoval.error) {
    console.log("INFO guest DELETE returned without an error, but object remained protected by RLS");
  }
  await guest.auth.signOut();
  console.log("PASS anonymous media deletion prevented (verified object intact)");

  // Privileged server-only fulfillment: remove ONLY this verified user profile's media.
  const media=[avatarPath(victimId),bannerPath(victimId)];
  const removed=await bucket.remove(media);
  assert.ifError(removed.error);
  // The storage row is deleted before a previously cached download has
  // necessarily expired. Confirm metadata removal, then check bounded
  // eventual read denial. This never equates to instant cache revocation.
  assert.ok(await emptyFolder("avatars/"+victimId),"Avatar path must be empty");
  assert.ok(await emptyFolder("banners/"+victimId),"Banner path must be empty");

  async function verifyMediaRemoval(path) {
    const label=path.startsWith("avatars/")?"avatar":"banner";
    let staleSeconds=0;
    let denied=false;
    for(let attempt=0;attempt<17;attempt++) {
      const check=await bucket.download(path);
      if(check.error){ denied=true; break; }
      if(attempt===16)break;
      await new Promise(resolve=>setTimeout(resolve,5000));
      staleSeconds+=5;
    }
    assert.ok(denied,"Deleted "+label+" remains retrievable after bounded 80-second CDN wait");
    if(staleSeconds>0) {
      console.warn("WARN deleted staging "+label+" remained cached for approximately "+staleSeconds+" seconds");
    }
    const freshUrl=new URL("/storage/v1/object/public/profile-images/"+
      path.split("/").map(encodeURIComponent).join("/"),URL);
    freshUrl.searchParams.set("qa_cache_probe",crypto.randomUUID());
    const fresh=await fetch(freshUrl,{
      cache:"no-store",
      headers:{"Cache-Control":"no-cache"},
      signal:AbortSignal.timeout(12000),
    });
    assert.ok(!fresh.ok,"Deleted staging "+label+" remains publicly available at a fresh URL");
    console.log("PASS deleted "+label+" absent from Storage and inaccessible after CDN wait");
  }
  await Promise.all(media.map(verifyMediaRemoval));

  // Support PII does not automatically cascade on Auth deletion.
  assert.ifError((await admin.from("support_requests").delete().eq("user_id",victimId)).error);
  assert.equal((await findRows("support_requests","user_id",victimId)).length,0);

  // Delete Auth LAST: only the confirmed synthetic staging identity.
  const deleted=await admin.auth.admin.deleteUser(victimId,false);
  assert.ifError(deleted.error);
  accountDeleted=true;
  console.log("PASS explicit staging-only Auth deletion executed");

  const after=await admin.auth.admin.getUserById(victimId);
  assert.ok(after.error || !after.data?.user,"Removed Auth identity must not be found");
  assert.equal((await findRows("linkups","host_id",victimId)).length,0,"Hosted LinkUps not cascaded");
  assert.equal((await findRows("linkup_attendees","user_id",victimId)).length,0,"Attendance not cascaded");
  assert.equal((await findRows("support_requests","user_id",victimId)).length,0);
  const {count:otherAfter,error:otherAfterError}=await admin.from("linkups")
    .select("id",{count:"exact",head:true}).neq("host_id",victimId);
  assert.ifError(otherAfterError);
  assert.equal(otherAfter,otherBefore,"Unrelated LinkUps must be unchanged");
  const fresh=client(publicKey);
  const relogin=await fresh.auth.signInWithPassword({email,password});
  assert.ok(relogin.error,"Deleted account must not be able to sign in");
  await fresh.auth.signOut();
  console.log("PASS Auth, hosted event, attendance, support PII, media and unrelated records verified");
  console.log("RESULT: staging account deletion acceptance test PASS. Not a production-release approval.");
  console.log("NOTE: Previously issued JWTs can persist until expiration; separate session revocation checks remain.");
} catch (error) {
  console.error("FAIL staging deletion test:",error?.message||"unknown");
  console.error("CLEANUP/REVIEW REQUIRED: test may have left a disposable staging account or media.");
  if(victimId && !accountDeleted)console.error("The test did NOT delete the staging account. Review before rerunning.");
  if(createdEventId)console.error("Synthetic event was created; verify its disposition.");
  process.exitCode=1;
} finally {
  try { await userClient.auth.signOut(); } catch {}
}
