#!/usr/bin/env node
/**
 * NYVON STAGING-ONLY signed-in RLS + Realtime WebSocket test.
 * Uses three separate disposable, confirmed staging accounts:
 * host, member, outsider, plus an unauthenticated guest client. Creates then deletes exactly one synthetic event.
 * No production credentials, service role, auth-user deletion, or real data.
 *
 * NYVON_STAGING_SUPABASE_URL=https://kxwechptoaituppkmcjr.supabase.co
 * NYVON_STAGING_SUPABASE_KEY=<staging public anon/publishable key only>
 * NYVON_QA_HOST_EMAIL / NYVON_QA_HOST_PASSWORD
 * NYVON_QA_MEMBER_EMAIL / NYVON_QA_MEMBER_PASSWORD
 * NYVON_QA_OUTSIDER_EMAIL / NYVON_QA_OUTSIDER_PASSWORD
 */
import assert from "node:assert/strict";
import { createClient } from "@supabase/supabase-js";

const REF = "kxwechptoaituppkmcjr";
const raw=process.env.NYVON_STAGING_SUPABASE_URL;
const key=process.env.NYVON_STAGING_SUPABASE_KEY;
if(!raw||!key) { console.error("Missing staging-only URL or public key"); process.exit(2); }
let base;
try{base=new URL(raw)}catch{console.error("Invalid URL");process.exit(2);}
if(base.protocol!=="https:"||base.hostname!==REF+".supabase.co"||
  base.pathname!=="/"||base.search||base.hash||base.username||base.password) {
  console.error("REFUSED: staging project only; production is forbidden.");
  process.exit(2);
}
const sleeper=ms=>new Promise(r=>setTimeout(r,ms));
const clients=[];
async function login(role){
 const email=process.env["NYVON_QA_"+role+"_EMAIL"];
 const password=process.env["NYVON_QA_"+role+"_PASSWORD"];
 assert.ok(email&&password,"Missing disposable staging account credentials for "+role);
 const c=createClient(base.toString(),key,{
   auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false},
 });
 clients.push(c);
 const {data,error}=await c.auth.signInWithPassword({email,password});
 assert.ifError(error);
 assert.ok(data.user?.id,"Signed-in staging user expected");
 return {c,id:data.user.id};
}
async function subscribe(client,label,eventId,onEvent){
 const channel=client.channel("nyvon-qa-"+crypto.randomUUID())
   .on("postgres_changes",{event:"UPDATE",schema:"public",table:"linkups",filter:"id=eq."+eventId},onEvent);
 const state=await Promise.race([
   new Promise(resolve=>channel.subscribe(s=>{
     if(["SUBSCRIBED","CHANNEL_ERROR","TIMED_OUT","CLOSED"].includes(s))resolve(s);
   })),
   sleeper(12000).then(()=>"timeout")
 ]);
 return {channel,state,label};
}
let eventId=null,host=null;
try{
 const member=await login("MEMBER");
 host=await login("HOST");
 const outsider=await login("OUTSIDER");
 const guest=createClient(base.toString(),key,{
   auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false},
 });
 clients.push(guest);
 assert.equal(new Set([host.id,member.id,outsider.id]).size,3,"Separate accounts required");
 const title="NYVON STAGING QA "+crypto.randomUUID();
 const {data:event,error:creating}=await host.c.from("linkups")
   .insert({title,category:"Social",location:"QA private test only",
     latitude:38.091,longitude:-103.091,
     starts_at:new Date(Date.now()+14*86400000).toISOString(),
     description:"Sensitive staging-only synthetic details",
     host_id:host.id,host_display_name:"Staging QA Host"})
   .select("id").single();
 assert.ifError(creating); eventId=event.id;
 const autoJoin=await host.c.from("linkup_attendees").insert({
   linkup_id:eventId,user_id:host.id,display_name:"Staging QA Host"});
 assert.ifError(autoJoin.error);
 const outsiderRaw=await outsider.c.from("linkups").select("id,latitude,longitude,description").eq("id",eventId);
 assert.ifError(outsiderRaw.error);
 assert.deepEqual(outsiderRaw.data,[],"Unjoined users must not access raw private event");
 console.log("PASS nonmember direct SQL/API table access denied");
 const guestRaw=await guest.from("linkups")
   .select("id,latitude,longitude,description").eq("id",eventId);
 assert.ifError(guestRaw.error);
 assert.deepEqual(guestRaw.data,[],"Guest must not read raw private event");
 const publicSafe=await outsider.c.rpc("fetch_safe_linkups",{
   p_as_of:new Date().toISOString(),p_limit:100,p_offset:0});
 assert.ifError(publicSafe.error);
 const redacted=publicSafe.data.find(x=>x.id===eventId);
 assert.ok(redacted,"Event must appear through safe discovery");
 assert.equal(redacted.host_id,null);
 assert.equal(redacted.longitude,null);
 assert.equal(redacted.latitude,null);
 assert.equal(redacted.description,"");
 console.log("PASS nonmember sees redacted discovery only");
 const joined=await member.c.from("linkup_attendees").insert({
   linkup_id:eventId,user_id:member.id,display_name:"Staging QA Member"});
 assert.ifError(joined.error);
 const memberRaw=await member.c.from("linkups")
   .select("id,latitude,longitude,description").eq("id",eventId).single();
 assert.ifError(memberRaw.error);
 assert.equal(memberRaw.data.longitude,-103.091);
 console.log("PASS joined member can access private event");
 let hCount=0,mCount=0,oCount=0,gCount=0;
 const chans=await Promise.all([
   subscribe(host.c,"host",eventId,()=>hCount++),
   subscribe(member.c,"member",eventId,()=>mCount++),
   subscribe(outsider.c,"outsider",eventId,()=>oCount++),
   subscribe(guest,"guest",eventId,()=>gCount++),
 ]);
 try{
   for(const ch of chans)assert.equal(ch.state,"SUBSCRIBED",ch.label+" failed to subscribe: "+ch.state);
   await sleeper(650);
   const updated=await host.c.from("linkups")
     .update({description:"QA update "+crypto.randomUUID()}).eq("id",eventId);
   assert.ifError(updated.error);
   await sleeper(4000);
   assert.equal(oCount,0,"PRIVACY LEAK: nonmember received private event update");
   assert.equal(gCount,0,"PRIVACY LEAK: guest received private event update");
   assert.ok(hCount>0,"Host did not receive Realtime update");
   assert.ok(mCount>0,"Joined member did not receive Realtime update");
   console.log("PASS Realtime host/member received event; guest and unrelated user received none");
 }finally{
   await Promise.allSettled(chans.map((x,i)=>clients[[1,0,2,3][i]].removeChannel(x.channel)));
 }
}catch(e){
 console.error("FAILED staging signed-in/Reatime QA:",e?.message||"unknown test error");
 process.exitCode=1;
}finally{
 if(eventId&&host){
   const cleanup=await host.c.from("linkups").delete().eq("id",eventId);
   if(cleanup.error){console.error("CLEANUP REQUIRED: synthetic LinkUp could not be deleted");process.exitCode=1}
 }
 for(const c of clients){try{await c.removeAllChannels();await c.auth.signOut()}catch{}}
}
