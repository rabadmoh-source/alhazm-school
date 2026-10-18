const fs=require('node:fs');
const assert=require('node:assert/strict');
const {initializeTestEnvironment,assertSucceeds,assertFails}=require('@firebase/rules-unit-testing');
const {doc,getDoc,setDoc,deleteDoc}=require('firebase/firestore');

const projectId='alhazm-security-tests';
let env;
before(async()=>{
 env=await initializeTestEnvironment({
  projectId,
  firestore:{rules:fs.readFileSync(require('node:path').join(__dirname,'../firestore-rules-proposed.rules'),'utf8')}
 });
 await env.withSecurityRulesDisabled(async ctx=>{
  const db=ctx.firestore();
  await setDoc(doc(db,'admins','approved'),{role:'admin'});
  await setDoc(doc(db,'admins','other'),{role:'viewer'});
  await setDoc(doc(db,'public_content','portal_settings'),{visitor_enabled:true});
  await setDoc(doc(db,'public_content','hazm_clock_manifest'),{parts:1});
  await setDoc(doc(db,'public_content','secret_misc'),{private:'x'});
  await setDoc(doc(db,'supervisory_visits','entry'),{private:'x'});
  await setDoc(doc(db,'private_data','entry'),{private:'x'});
 });
});
after(async()=>{if(env)await env.cleanup()});
const admin=()=>env.authenticatedContext('approved').firestore();
const outsider=()=>env.authenticatedContext('other').firestore();
const guest=()=>env.unauthenticatedContext().firestore();

it('anonymous visitor reads only approved public documents and portal settings',async()=>{
 await assertSucceeds(getDoc(doc(guest(),'public_content','portal_settings')));
 await assertSucceeds(getDoc(doc(guest(),'public_content','hazm_clock_manifest')));
 await assertFails(getDoc(doc(guest(),'public_content','secret_misc')));
 await assertFails(getDoc(doc(guest(),'supervisory_visits','entry')));
 await assertFails(getDoc(doc(guest(),'private_data','entry')));
 await assertFails(getDoc(doc(guest(),'admins','approved')));
});
it('anonymous cannot write public or private or admin',async()=>{
 await assertFails(setDoc(doc(guest(),'public_content','hazm_clock_part_000'),{part:'x'}));
 await assertFails(setDoc(doc(guest(),'private_data','new'),{x:1}));
 await assertFails(setDoc(doc(guest(),'supervisory_visits','new'),{x:1}));
});
it('authenticated nonadmin has no extra privileges',async()=>{
 await assertFails(getDoc(doc(outsider(),'supervisory_visits','entry')));
 await assertFails(getDoc(doc(outsider(),'private_data','entry')));
 await assertFails(setDoc(doc(outsider(),'public_content','hazm_clock_part_001'),{part:'x'}));
});
it('admin may use private data but cannot alter admin roles',async()=>{
 await assertSucceeds(getDoc(doc(admin(),'supervisory_visits','entry')));
 await assertSucceeds(getDoc(doc(admin(),'private_data','entry')));
 await assertSucceeds(setDoc(doc(admin(),'supervisory_visits','new'),{x:1}));
 await assertSucceeds(setDoc(doc(admin(),'public_content','hazm_clock_part_000'),{part:'x'}));
 await assertFails(setDoc(doc(admin(),'admins','approved'),{role:'viewer'}));
 await assertFails(setDoc(doc(admin(),'public_content','secret_misc'),{x:1}));
});
it('public reading stops when visitors disabled',async()=>{
 await env.withSecurityRulesDisabled(async ctx=>setDoc(doc(ctx.firestore(),'public_content','portal_settings'),{visitor_enabled:false}));
 await assertFails(getDoc(doc(guest(),'public_content','hazm_clock_manifest')));
 await assertSucceeds(getDoc(doc(admin(),'public_content','hazm_clock_manifest')));
 await env.withSecurityRulesDisabled(async ctx=>setDoc(doc(ctx.firestore(),'public_content','portal_settings'),{visitor_enabled:true}));
});
