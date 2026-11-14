/* ساعة الحزم: نسخة إدارة سحابية، ونشر آمن للبيانات العامة للزوار. */
(() => {
'use strict';
const ROOT='https://fmmilquujleokfxcbnas.supabase.co';
const API='sb_publishable_O_JqIM-VqzdGgU8VTvhRHQ_eQ9eTH5R';
const LOCAL='alhazm-school-clock-v1';
const PUBLIC_FIELDS=['schoolName','directorate','motto','scheduleTitle','periods','news','urgent','bellEnabled','speechEnabled','volume'];
const isVisitor=/visitor\.html(?:$|[?#])/.test(location.pathname);
const frame=document.getElementById('serviceFrame');
if(!frame)return;
let token=sessionStorage.getItem('hazm_board_access')||'';
let userId='',connected=false,cloudStamp='',status=null,panel=null,activeDoc=null,saveQueue=Promise.resolve(),latestPayload=null,lastLocal='',poll=null,loading=false;
const headers=()=>({apikey:API,Authorization:'Bearer '+(token||API)});
async function request(path,options={}){
 const r=await fetch(ROOT+path,{...options,headers:{...headers(),...(options.body?{'Content-Type':'application/json'}:{}),...(options.headers||{})}});
 const raw=await r.text();let data;
 try{data=raw?JSON.parse(raw):null}catch{data=raw}
 if(!r.ok)throw Error(data?.message||data?.error_description||data?.error||('HTTP '+r.status));
 return data;
}
function current(){try{const v=JSON.parse(localStorage.getItem(LOCAL)||'null');return v&&Array.isArray(v.periods)?v:null}catch{return null}}
function say(value,error=false){if(status){status.textContent=value;status.style.color=error?'#a62b39':'#4d3b67'}}
function validDoc(doc){return !!doc?.title?.includes('ساعة الحزم');}
function downloadBackup(data){
 const b=new Blob([JSON.stringify(data,null,2)],{type:'application/json'});
 const url=URL.createObjectURL(b),a=document.createElement('a');
 a.href=url;a.download='hazm-clock-backup-'+new Date().toISOString().slice(0,10)+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
async function verify(){
 const u=await request('/auth/v1/user');
 if(!u?.id)throw Error('انتهت جلسة الإدارة.');
 const a=await request('/rest/v1/riwaq_admins?select=user_id&user_id=eq.'+encodeURIComponent(u.id));
 if(!Array.isArray(a)||!a.length)throw Error('هذا الحساب غير مخول.');
 userId=u.id;
}
async function push(v){
 const rows=await request('/rest/v1/hazm_clock_state?on_conflict=id&select=id,updated_at',{
  method:'POST',headers:{Prefer:'resolution=merge-duplicates,return=representation'},
  body:JSON.stringify({id:'main',payload:v,updated_by:userId,updated_at:new Date().toISOString()})
 });
 if(!Array.isArray(rows)||rows.length!==1)throw Error('لم يؤكد الخادم الحفظ.');
 return rows[0];
}
function schedule(v){
 if(!connected||!userId||loading)return;
 latestPayload=v;
 say('☁️ جارٍ حفظ تغييرات الساعة…');
 saveQueue=saveQueue.catch(()=>{}).then(async()=>{
  const copy=latestPayload;
  const result=await push(copy);
  if(copy===latestPayload){cloudStamp=result.updated_at;say('☁️ تمت المزامنة مع الزوار · '+new Date(cloudStamp).toLocaleString('ar-OM'))}
 }).catch(e=>say('النسخة المحلية محفوظة؛ تعذر الحفظ السحابي: '+e.message,true));
}
function saveHook(){
 const w=frame.contentWindow;
 if(typeof w?.persist!=='function'||w.persist.__hazmClockCloud)return;
 const original=w.persist;
 const wrapped=function(...args){const result=original.apply(this,args);const v=current();if(v){lastLocal=JSON.stringify(v);schedule(v)}return result};
 wrapped.__hazmClockCloud=true;w.persist=wrapped;
}
async function cloudSetup(doc){
 connected=false;
 say('جارٍ فحص نسخة الساعة السحابية…');
 const rows=await request('/rest/v1/hazm_clock_state?select=payload,updated_at&id=eq.main');
 if(!Array.isArray(rows))throw Error('تعذرت قراءة النسخة السحابية.');
 if(rows.length){
  const v=rows[0].payload,local=current();
  if(!v||!Array.isArray(v.periods))throw Error('بنية النسخة السحابية غير متوافقة.');
  cloudStamp=rows[0].updated_at;
  if(local&&JSON.stringify(local)!==JSON.stringify(v)){
   say('توجد نسخة سحابية مختلفة عن نسخة هذا الجهاز. اختاري النسخة المعتمدة.',true);
   const actions=doc.createElement('div');actions.style.marginTop='8px';
   const load=doc.createElement('button');load.textContent='☁️ فتح النسخة السحابية';
   const keep=doc.createElement('button');keep.textContent='⬆️ اعتماد نسخة هذا الجهاز';
   for(const b of [load,keep]){b.type='button';b.style.cssText='background:#72558f;color:white;border:0;border-radius:8px;padding:7px 10px;margin:3px;cursor:pointer;font:inherit';actions.append(b)}
   panel.append(actions);
   load.onclick=()=>{downloadBackup(local);localStorage.setItem(LOCAL,JSON.stringify(v));frame.srcdoc=frame.srcdoc};
   keep.onclick=async()=>{if(!confirm('سيُستبدل محتوى النسخة السحابية بنسخة هذا الجهاز. هل تعتمدين ذلك بعد الاحتفاظ بنسخة احتياطية؟'))return;
    keep.disabled=true;try{await push(local);actions.remove();connected=true;lastLocal=JSON.stringify(local);say('☁️ اعتمدت نسخة هذا الجهاز · المزامنة مفعّلة')}catch(e){keep.disabled=false;say(e.message,true)}
   };
   return;
  }
  if(!local){localStorage.setItem(LOCAL,JSON.stringify(v));frame.srcdoc=frame.srcdoc;return}
  connected=true;lastLocal=JSON.stringify(local);
  say('☁️ نسخة الساعة محفوظة سحابيًا · المزامنة مفعّلة');
 }else{
  const local=current();
  say('لم تُنقل نسخة الساعة من هذا الجهاز إلى السحابة بعد.');
  const b=doc.createElement('button');b.textContent='☁️ نقل نسخة الساعة إلى السحابة';
  b.style.cssText='background:#148c87;color:#fff;border:0;border-radius:9px;padding:8px 13px;margin:6px;cursor:pointer;font:inherit';
  panel.append(b);
  b.onclick=async()=>{
   const v=current();if(!v)return say('لا توجد بيانات ساعة محفوظة على هذا الجهاز.',true);
   if(!confirm('سيُحفظ جدول الساعة كاملًا في سحابة الإدارة المحمية، وستظهر للزوار المعلومات العامة فقط. هل تعتمدين النقل؟'))return;
   b.disabled=true;
   try{const check=await request('/rest/v1/hazm_clock_state?select=id&id=eq.main');if(check.length)throw Error('ظهرت نسخة سحابية أخرى؛ أعيدي فتح النافذة.');
    const result=await request('/rest/v1/hazm_clock_state?select=id',{method:'POST',headers:{Prefer:'return=representation'},body:JSON.stringify({id:'main',payload:v,updated_by:userId})});
    if(!Array.isArray(result)||result.length!==1)throw Error('لم يؤكد الخادم نقل الساعة.');
    const verifyRows=await request('/rest/v1/hazm_clock_state?select=payload&id=eq.main');
    if(JSON.stringify(verifyRows?.[0]?.payload)!==JSON.stringify(v)) {
     // JSON object key order is not a reliable proof, but required keys must match.
     if(!verifyRows?.[0]?.payload?.periods||verifyRows[0].payload.periods.length!==v.periods.length)throw Error('لم يكتمل تحقق النسخة.');
    }
    connected=true;lastLocal=JSON.stringify(v);b.remove();say('☁️ اكتمل نقل الساعة · المزامنة التلقائية مفعّلة');
   }catch(e){b.disabled=false;say('تعذر النقل: '+e.message,true)}
  };
 }
}
async function authenticate(email,password){
 const r=await fetch(ROOT+'/auth/v1/token?grant_type=password',{method:'POST',headers:{apikey:API,'Content-Type':'application/json'},body:JSON.stringify({email,password})});
 const v=await r.json();if(!r.ok||!v.access_token)throw Error(v.error_description||'فشل تسجيل الدخول');
 token=v.access_token;await verify();sessionStorage.setItem('hazm_board_access',token);
}
function mountAdmin(doc){
 panel=doc.createElement('section');panel.id='hazm-clock-cloud-panel';
 panel.style.cssText='background:#f3eef9;border:1px solid #d9c9e8;border-radius:12px;padding:10px 14px;margin:10px;direction:rtl;text-align:right;font:14px/1.8 Tahoma,Arial,sans-serif;color:#4d3b67';
 status=doc.createElement('span');panel.append(status);
 (doc.querySelector('main')||doc.body).prepend(panel);
 const backup=doc.createElement('button');backup.textContent='⬇️ نسخة احتياطية';backup.type='button';
 backup.style.cssText='background:#72558f;color:#fff;border:0;border-radius:8px;padding:6px 10px;margin:3px;cursor:pointer;font:inherit';
 backup.onclick=()=>{const v=current();if(v)downloadBackup(v);else say('لا توجد بيانات للنسخ.',true)};
 panel.append(backup);
 const login=doc.createElement('button');login.type='button';login.textContent='ربط الإدارة بالسحابة';login.style.cssText=backup.style.cssText;panel.append(login);
 login.onclick=()=>{
  panel.querySelector('[data-clock-login]')?.remove();
  const box=doc.createElement('div');box.dataset.clockLogin='1';
  const email=doc.createElement('input');email.type='email';email.placeholder='البريد الإداري';
  const pwd=doc.createElement('input');pwd.type='password';pwd.placeholder='كلمة المرور';
  for(const v of [email,pwd])v.style.cssText='padding:7px;margin:4px;border:1px solid #d5c9e5;border-radius:8px;max-width:200px';
  const go=doc.createElement('button');go.type='button';go.textContent='اتصال';go.style.cssText=backup.style.cssText;
  box.append(email,pwd,go);panel.append(box);
  go.onclick=async()=>{go.disabled=true;try{await authenticate(email.value.trim(),pwd.value);pwd.value='';box.remove();await cloudSetup(doc)}catch(e){say('تعذر الاتصال: '+e.message,true);go.disabled=false}};
 };
 saveHook();
 if(token)verify().then(()=>cloudSetup(doc)).catch(e=>{token='';userId='';sessionStorage.removeItem('hazm_board_access');say('سجلي الدخول لربط الساعة: '+e.message,true)});
 else say('الساعة تعمل محليًا؛ اربطي الإدارة لحفظ نسخة سحابية.');
 lastLocal=JSON.stringify(current());
 // Detect any clock saves that use direct localStorage without calling persist().
 clearInterval(poll);poll=setInterval(()=>{
  if(frame.contentDocument!==doc||!connected)return;
  const v=current(),str=JSON.stringify(v);
  if(v&&str!==lastLocal){lastLocal=str;schedule(v)}
 },2500);
}
function injectPublic(data){
 const w=frame.contentWindow,doc=frame.contentDocument;
 if(!w||!validDoc(doc)||!data)return;
 w.__hazmClockPublicPayload=data;
 const script=doc.createElement('script');
 script.textContent=`(()=>{const p=window.__hazmClockPublicPayload;if(!p)return;for(const k of ${JSON.stringify(PUBLIC_FIELDS)})if(p[k]!==undefined&&p[k]!==null)state[k]=p[k];setHeader();renderPeriods();for(const id of ['schoolName','directorate','motto','scheduleTitle']){const e=document.getElementById(id);if(e)e.value=state[id]||''}for(const id of ['newsText','urgentText']){const e=document.getElementById(id);if(e)e.value=state[id==='newsText'?'news':'urgent']||''}tick();})();`;
 doc.body.append(script);script.remove();
}
async function pullPublic(){
 if(!validDoc(frame.contentDocument))return;
 try{
  const rows=await request('/rest/v1/hazm_clock_public?select=payload,updated_at&id=eq.main');
  if(rows?.length&&rows[0].updated_at!==cloudStamp){cloudStamp=rows[0].updated_at;injectPublic(rows[0].payload)}
 }catch(e){console.warn('Clock visitor sync unavailable:',e.message)}
}
function mount(doc){
 if(!validDoc(doc)||doc===activeDoc)return;
 activeDoc=doc;clearInterval(poll);cloudStamp='';
 if(isVisitor){pullPublic();poll=setInterval(()=>{if(frame.contentDocument===doc)pullPublic()},30000)}
 else mountAdmin(doc);
}
frame.addEventListener('load',()=>{try{mount(frame.contentDocument)}catch(e){console.warn('Clock cloud mount:',e)}});
if(frame.contentDocument?.readyState==='complete')mount(frame.contentDocument);
})();
