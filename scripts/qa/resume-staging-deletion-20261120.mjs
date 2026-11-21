#!/usr/bin/env node
/**
 * Resume a previously interrupted NYVON staging deletion QA fixture.
 * The script intentionally accepts exactly ONE predetermined disposable
 * email, one staging project, and only known synthetic data. No production.
 * Invoked locally with hidden credentials; never check in credentials.
 */
import assert from "node:assert/strict";
import { createClient } from "@supabase/supabase-js";

const STAGING_URL="https://kxwechptoaituppkmcjr.supabase.co";
const EMAIL="watch9collector+nyvon-qa-delete-20261120@gmail.com";
const REQUIRED_CONFIRM="DELETE THIS DISPOSABLE STAGING ACCOUNT";
if(process.env.NYVON_STAGING_SUPABASE_URL!==STAGING_URL ||
   process.env.NYVON_QA_DELETE_EMAIL!==EMAIL ||
   process.env.NYVON_QA_DELETE_CONFIRM!==REQUIRED_CONFIRM ||
   !process.env.NYVON_QA_DELETE_PASSWORD ||
   !process.env.NYVON_STAGING_SUPABASE_KEY ||
   !process.env.NYVON_STAGING_ADMIN_KEY ||
   process.env.NYVON_STAGING_ADMIN_KEY===process.env.NYVON_STAGING_SUPABASE_KEY ||
   process.env.NYVON_STAGING_ADMIN_KEY.startsWith("sb_publishable_")) {
  console.error("REFUSED: strict staging URL, known QA email, separate staging-only admin key and explicit confirmation required.");
  process.exit(2);
}
const publicKey=process.env.NYVON_STAGING_SUPABASE_KEY;
const adminKey=process.env.NYVON_STAGING_ADMIN_KEY;
const password=process.env.NYVON_QA_DELETE_PASSWORD;
const client=key=>createClient(STAGING_URL,key,{
  auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false},
});
const admin=client(adminKey),user=client(publicKey),guest=client(publicKey);
const bucket=admin.storage.from("profile-images");
const safeRows=async(table,field,value,cols="id")=>{
  const {data,error}=await admin.from(table).select(cols).eq(field,value);
  assert.ifError(error);return data??[];
};
const countOthers=async(id)=>{
  const {count,error}=await admin.from("linkups")
    .select("id",{count:"exact",head:true}).neq("host_id",id);
  assert.ifError(error);assert.notEqual(count,null);return count;
};
const objects=async(folder)=>{
  const {data,error}=await bucket.list(folder,{limit:100});
  assert.ifError(error); return (data??[]).filter(o=>o.name&&!o.name.endsWith("/")).map(o=>o.name);
};
const expectDeniedEventually=async(path)=>{
  const label=path.startsWith("avatars/")?"avatar":"banner";
  let delayed=0,denied=false;
  for(let attempt=0;attempt<19;attempt++){
    const result=await bucket.download(path);
    if(result.error){denied=true;break;}
    if(attempt===18)break;
    delayed+=5;
    await new Promise(resolve=>setTimeout(resolve,5000));
  }
  assert.ok(denied,"Deleted "+label+" still cached after 90 seconds");
  const url=new URL("/storage/v1/object/public/profile-images/"+path.split("/").map(encodeURIComponent).join("/"),STAGING_URL);
  url.searchParams.set("qa_deleted_check",crypto.randomUUID());
  const response=await fetch(url,{headers:{"Cache-Control":"no-cache"},cache:"no-store",signal:AbortSignal.timeout(12000)});
  assert.ok(!response.ok,"Removed "+label+" remains accessible via fresh public URL");
  if(delayed>0) console.warn("WARN previously cached deleted",label,"remained accessible for",delayed,"seconds");
  console.log("PASS deleted",label,"no longer accessible after bounded cache check");
};
let targetId=null,accountDeleted=false;
try {
  const {data:login,error:loginError}=await user.auth.signInWithPassword({email:EMAIL,password});
  assert.ifError(loginError);
  assert.equal(login.user?.email?.toLowerCase(),EMAIL);
  targetId=login.user.id;
  const {data:verified,error:lookupError}=await admin.auth.admin.getUserById(targetId);
  assert.ifError(lookupError);
  assert.equal(verified.user?.email?.toLowerCase(),EMAIL);
  assert.ok(verified.user.email_confirmed_at,"Disposable QA account must be confirmed");
  const eventRows=await safeRows("linkups","host_id",targetId,"id,title");
  assert.equal(eventRows.length,1,"Expected exactly one pre-existing synthetic hosted event");
  assert.ok(eventRows[0].title?.startsWith("STAGING DELETE QA "),"Unexpected hosted event: refuse cleanup");
  const attended=await safeRows("linkup_attendees","linkup_id",eventRows[0].id,"id,user_id");
  assert.equal(attended.length,1,"Unexpected participation in staged event; refuse cleanup");
  assert.equal(attended[0].user_id,targetId,"Another account is attending: refuse cleanup");
  const myAttendance=await safeRows("linkup_attendees","user_id",targetId,"id,linkup_id");
  assert.equal(myAttendance.length,1,"Unexpected attendance records; refuse cleanup");
  assert.equal(myAttendance[0].linkup_id,eventRows[0].id);
  const requests=await safeRows("support_requests","user_id",targetId,"id,email,message,request_type");
  assert.equal(requests.length,1,"Expected exactly one synthetic deletion support request");
  assert.equal(requests[0].email?.toLowerCase(),EMAIL);
  assert.equal(requests[0].request_type,"delete_account");
  assert.equal(requests[0].message,"Disposable staging-only account deletion QA request.");
  const avPath="avatars/"+targetId+"/qa-deletion-avatar.png";
  const bnPath="banners/"+targetId+"/qa-deletion-banner.png";
  const avatarFiles=await objects("avatars/"+targetId);
  const bannerFiles=await objects("banners/"+targetId);
  // Only two safe retry states are accepted: both exact synthetic files
  // are still present, OR both were removed in the previous interrupted run.
  const filesIntact=avatarFiles.length===1 && avatarFiles[0]==="qa-deletion-avatar.png" &&
    bannerFiles.length===1 && bannerFiles[0]==="qa-deletion-banner.png";
  const filesRemoved=avatarFiles.length===0 && bannerFiles.length===0;
  assert.ok(filesIntact||filesRemoved,
    "Unexpected or partially removed staging media: refuse cleanup until independently reviewed");
  const allOtherLinkUps=await countOthers(targetId);
  console.log("PASS preflight: exactly one approved disposable staging account and its known synthetic records");

  // Anonymous Storage DELETE can return a success-shaped empty response
  // when RLS prevents deleting rows. The earlier attempt already verified
  // the test avatar survived. Do not re-test against absent files.
  if(filesIntact) {
    const attempt=await guest.storage.from("profile-images").remove([avPath]);
    const stillExists=(await objects("avatars/"+targetId)).includes("qa-deletion-avatar.png");
    assert.ok(stillExists,"SECURITY FAILURE: guest could remove disposable avatar");
    if(!attempt.error) console.log("INFO anonymous DELETE returned no error, but RLS protected file");
    console.log("PASS unauthorized media deletion prevented");
    // Destructive actions apply to exactly this pre-verified test account.
    const removed=await bucket.remove([avPath,bnPath]);
    assert.ifError(removed.error);
  } else {
    console.log("PASS prior unauthorized removal denial already observed; both approved media files were removed before interruption");
  }
  assert.deepEqual(await objects("avatars/"+targetId),[],"Avatar still listed");
  assert.deepEqual(await objects("banners/"+targetId),[],"Banner still listed");
  await Promise.all([expectDeniedEventually(avPath),expectDeniedEventually(bnPath)]);
  console.log("PASS synthetic account photos and banners removed");

  // Support PII survives the Auth FK SET NULL, so remove its exact row now.
  const deletedSupport=await admin.from("support_requests").delete()
    .eq("id",requests[0].id).eq("user_id",targetId);
  assert.ifError(deletedSupport.error);
  assert.equal((await safeRows("support_requests","user_id",targetId)).length,0,"Support record retained");
  console.log("PASS synthetic support request removed");

  // Delete Auth last, and check both target and unrelated data afterward.
  const deleted=await admin.auth.admin.deleteUser(targetId,false);
  assert.ifError(deleted.error);
  accountDeleted=true;
  const found=await admin.auth.admin.getUserById(targetId);
  assert.ok(found.error||!found.data?.user,"Deleted account still exists in Auth");
  assert.equal((await safeRows("linkups","host_id",targetId)).length,0,"Hosted event not cascaded");
  assert.equal((await safeRows("linkup_attendees","user_id",targetId)).length,0,"Attendance not cascaded");
  assert.equal((await countOthers(targetId)),allOtherLinkUps,"Unrelated LinkUps changed");
  assert.deepEqual(await objects("avatars/"+targetId),[]);
  assert.deepEqual(await objects("banners/"+targetId),[]);
  const fresh=client(publicKey);
  const loginAgain=await fresh.auth.signInWithPassword({email:EMAIL,password});
  assert.ok(loginAgain.error,"Deleted account could still sign in");
  await fresh.auth.signOut();
  console.log("PASS target Auth, LinkUp, attendance, support, files, and sign-in deletion; unrelated LinkUps preserved");
  console.log("RESULT: EXISTING DISPOSABLE STAGING ACCOUNT CLEANUP PASS");
  console.log("NOTE: This validates staging cleanup, not production deletion workflow, JWT revocation or backup retention.");
}catch(error){
  console.error("FAIL staging resume:",error?.message||"Unknown");
  if(targetId&&!accountDeleted)
    console.error("NO AUTH DELETION PERFORMED: inspect exactly this disposable staging account and its files before retrying.");
  console.error("Do NOT blindly rerun. This script changes no production records.");
  process.exitCode=1;
}finally{
  await Promise.allSettled([user.auth.signOut(),guest.auth.signOut()]);
}
