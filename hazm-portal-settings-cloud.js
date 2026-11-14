/* إعدادات بوابة الحزم: قراءة عامة، وتعديل محمي للإدارة. */
(()=>{
'use strict';
const ROOT='https://fmmilquujleokfxcbnas.supabase.co';
const KEY='sb_publishable_O_JqIM-VqzdGgU8VTvhRHQ_eQ9eTH5R';
const LOCAL='hazm_portal_settings_v1';
const visitor=location.pathname.endsWith('/visitor.html');
let token=sessionStorage.getItem('hazm_board_access')||'',uid='',stamp='',status,queue=Promise.resolve(),busy=false;
const settings=document.getElementById('settings'),modal=document.querySelector('#shade .modal');
if(!settings||!modal||typeof window.hazmApplyPortalSettings!=='function')return;
function notice(t,bad=false){if(status){status.textContent=t;status.style.color=bad?'#ac3443':'#4a3e67'}}
function local(){try{return JSON.parse(localStorage.getItem(LOCAL)||'null')}catch{return null}}
function normalized(v){return {students:String(v?.students??''),parents:String(v?.parents??''),classes:String(v?.classes??''),news:String(v?.news??'')}}
function same(a,b){return JSON.stringify(normalized(a))===JSON.stringify(normalized(b))}
async function api(path,opt={}){
 const r=await fetch(ROOT+path,{...opt,headers:{apikey:KEY,Authorization:'Bearer '+(token||KEY),...(opt.body?{'Content-Type':'application/json'}:{}),...(opt.headers||{})}});
 const raw=await r.text();let v;try{v=raw?JSON.parse(raw):null}catch{v=raw}
 if(!r.ok)throw Error(v?.message||v?.error_description||v?.error||('HTTP '+r.status));
 return v;
}
async function allowed(){
 const u=await api('/auth/v1/user');
 if(!u?.id)throw Error('انتهت جلسة الإدارة.');
 const a=await api('/rest/v1/riwaq_admins?select=user_id&user_id=eq.'+encodeURIComponent(u.id));
 if(!Array.isArray(a)||!a.length)throw Error('هذا الحساب غير مخول بالتعديل.');
 uid=u.id;
}
async function cloud(){
 const r=await api('/rest/v1/hazm_portal_settings?select=students,parents,classes,news,updated_at&id=eq.main');
 return Array.isArray(r)?r[0]:null;
}
async function load(){
 try{
  const v=await cloud();if(!v)return;
  stamp=v.updated_at;
  if(visitor){window.hazmApplyPortalSettings(normalized(v));return}
  const l=local();
  const isEmpty=!l||(!l.students&&!l.parents&&!l.classes);
  if(isEmpty){window.hazmApplyPortalSettings(normalized(v));notice('☁️ تم تحميل إعدادات البوابة السحابية')}
  else if(same(l,v))notice('☁️ إعدادات هذا الجهاز مطابقة للنسخة المنشورة');
  else notice('إعدادات هذا الجهاز مختلفة؛ اضغطي «حفظ» لاعتمادها ونشرها للزوار.');
 }catch(e){if(!visitor)notice('تعذرت قراءة النسخة السحابية: '+e.message,true)}
}
async function saveNow(){
 const v=normalized(local());if(!uid)throw Error('اتصلي بحساب الإدارة أولًا.');
 const rows=await api('/rest/v1/hazm_portal_settings?on_conflict=id&select=updated_at',{
  method:'POST',headers:{Prefer:'resolution=merge-duplicates,return=representation'},
  body:JSON.stringify({...v,id:'main',updated_by:uid,updated_at:new Date().toISOString()})
 });
 if(!Array.isArray(rows)||rows.length!==1)throw Error('لم يؤكد الخادم الحفظ.');
 stamp=rows[0].updated_at;
 notice('☁️ حُفظت إعدادات البوابة ونُشرت للزوار');
}
function queueSave(){
 if(busy)return;
 queue=queue.catch(()=>{}).then(async()=>{
  if(!uid){if(!token){notice('حُفظت محليًا. اربطي الإدارة بالسحابة لنشرها.',true);showLogin();document.getElementById('shade').classList.add('show');return}
   try{await allowed()}catch(e){token='';sessionStorage.removeItem('hazm_board_access');notice('أعيدي ربط الإدارة بالسحابة: '+e.message,true);showLogin();document.getElementById('shade').classList.add('show');return}}
  await saveNow();
 }).catch(e=>notice('حُفظت محليًا، لكن تعذرت المزامنة: '+e.message,true));
}
function showLogin(){
 if(modal.querySelector('[data-portal-cloud-login]'))return;
 const box=document.createElement('div');box.dataset.portalCloudLogin='1';box.style.cssText='border:1px solid #ddcbea;border-radius:12px;padding:10px;margin:10px 0;background:#f7f1fc;direction:rtl';
 const title=document.createElement('strong');title.textContent='☁️ ربط إعدادات البوابة بالإدارة السحابية';
 const email=document.createElement('input');email.type='email';email.placeholder='البريد الإداري المعتمد';
 const password=document.createElement('input');password.type='password';password.placeholder='كلمة المرور';
 const button=document.createElement('button');button.type='button';button.textContent='اتصال ونشر';button.className='btn primary';
 for(const el of [email,password])el.style.cssText='padding:8px;border:1px solid #d9c9e7;border-radius:8px;margin:5px;max-width:200px';
 box.append(title,document.createElement('br'),email,password,button);
 modal.insertBefore(box,modal.querySelector('.bar'));
 button.addEventListener('click',async()=>{
  button.disabled=true;
  try{
   const r=await fetch(ROOT+'/auth/v1/token?grant_type=password',{method:'POST',headers:{apikey:KEY,'Content-Type':'application/json'},body:JSON.stringify({email:email.value.trim(),password:password.value})});
   const v=await r.json();if(!r.ok||!v.access_token)throw Error(v.error_description||'تعذر تسجيل الدخول');
   token=v.access_token;await allowed();sessionStorage.setItem('hazm_board_access',token);
   password.value='';await saveNow();box.remove();
  }catch(e){notice('تعذر الاتصال: '+e.message,true);button.disabled=false}
 });
}
if(!visitor){
 const note=modal.querySelector('.small');
 if(note)note.textContent='هذه الإعدادات تُحفظ سحابيًا وتظهر تلقائيًا للزوار. التعديل للإدارة فقط.';
 status=document.createElement('div');status.setAttribute('role','status');
 status.style.cssText='color:#4a3e67;background:#f5f0fb;border-radius:8px;padding:8px 11px;margin:8px 0;font:13px/1.8 Tahoma,Arial,sans-serif';
 modal.insertBefore(status,modal.querySelector('.bar'));
 settings.addEventListener('click',()=>{if(!uid&&token)allowed().catch(()=>{});});
 for(const id of ['save','reset'])document.getElementById(id)?.addEventListener('click',queueSave);
}
load();
if(visitor){
 setInterval(async()=>{try{const v=await cloud();if(v&&v.updated_at!==stamp){stamp=v.updated_at;window.hazmApplyPortalSettings(normalized(v))}}catch(e){console.warn('Portal settings refresh:',e.message)}},30000);
 document.addEventListener('visibilitychange',()=>{if(!document.hidden)load()});
}
})();