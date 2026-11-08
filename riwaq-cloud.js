/* Riwaq Alhazm secure cloud integration. Uses publishable client key, never server secrets. */
(()=>{'use strict';
const PROJECT_URL='https://fmmilquujleokfxcbnas.supabase.co', KEY="sb_publishable_O_JqIM-VqzdGgU8VTvhRHQ_eQ9eTH5R";
const style=document.createElement('style');style.textContent='.riwaq-access{background:#fff;border:1px solid #e3d8ea;border-radius:14px;padding:15px;margin:15px 0}.riwaq-access input{max-width:330px;margin:4px}.riwaq-access button{margin:4px}.riwaq-access .riwaq-status{font-size:13px;color:#604977}.riwaq-approved{border-right:4px solid #169b9b;margin:12px 0;padding:12px;background:#fff;border-radius:10px}.riwaq-private{border-right:4px solid #664082;background:#f4eef8;padding:12px;border-radius:10px;margin:12px 0}.riwaq-admin-toolbar{margin-top:12px;display:flex;flex-wrap:wrap;gap:8px}.riwaq-warning{font-weight:bold;color:#9b3b37}';style.textContent+=' .riwaq-local-header,.riwaq-local-footer{border:1px solid #e9e3ef;background:white}.riwaq-local-heading{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:12px}.riwaq-local-heading h3{margin:0}.riwaq-local-save{background:#644084;color:white}.riwaq-local-header .riwaq-local-history{margin-top:12px}';document.head.append(style);
const nav=document.querySelector('main nav'),portal=document.createElement('div');portal.className='riwaq-access';
portal.innerHTML='<strong>إدارة رِواق الحزم</strong><p class="riwaq-status" id="riwaq-status">عرض عام للزوار — لا تظهر الملاحظات الداخلية.</p><div id="riwaq-message" class="riwaq-status" role="status"></div>';nav.before(portal);portal.hidden=false;
const published=document.createElement('div');published.className='card';published.innerHTML='<h3>نتائج الجولات المعتمدة للنشر</h3><div id="riwaq-public-list">يتم تحميل النتائج المعتمدة...</div>';document.querySelector('#home').append(published);
const tool=document.createElement('div');tool.className='riwaq-private';tool.hidden=true;
tool.innerHTML='<h3>السجلات الإدارية الخاصة</h3><label>عنوان السجل</label><input id="riwaq-title" placeholder="عنوان الجولة"><div class="riwaq-admin-toolbar"><button id="riwaq-save">حفظ الجولة في السحابة</button><button id="riwaq-new">سجل جديد</button><button id="riwaq-refresh">تحديث السجلات</button></div><label>فتح سجل سابق</label><select id="riwaq-saved"><option value="">اختاري سجلًا محفوظًا</option></select><h3>نشر ملخص معتمد للزوار</h3><label>عنوان الملخص العلني</label><input id="riwaq-pub-title" placeholder="عنوان النتيجة المنشورة"><label>ملخص للنشر (دون أسماء أو صور خاصة)</label><textarea id="riwaq-pub-summary"></textarea><p class="riwaq-warning">راجعي النص قبل النشر: سيصبح متاحًا لجميع الزوار.</p><button id="riwaq-publish">اعتماد ونشر الملخص</button>';
document.querySelector('#home').append(tool);
let client=null,admin=false,currentId=null;const visitorMode=new URLSearchParams(location.search).get('visitor')==='1';window.riwaqAdminEnabled=false;const login=document.createElement('div');login.id='riwaq-login';login.innerHTML='<button type="button" id="riwaq-login-toggle">دخول إدارة الرواق</button><div id="riwaq-login-fields"><label for="riwaq-email">البريد الإلكتروني للإدارة</label><input type="email" id="riwaq-email" autocomplete="username" placeholder="بريد الإدارة المسجل"><label for="riwaq-password">كلمة المرور</label><input type="password" id="riwaq-password" autocomplete="current-password"><button type="button" id="riwaq-signin">دخول</button></div></div>';portal.append(login);const logout=document.createElement('button');logout.id='riwaq-signout';logout.textContent='خروج الإدارة';logout.hidden=true;portal.append(logout);const $=id=>document.getElementById(id),message=s=>$('riwaq-message').textContent=s;document.querySelectorAll('nav button[data-page], [data-go]').forEach(b=>b.addEventListener('click',()=>{if(admin){const target=document.querySelector('#'+(b.dataset.page||b.dataset.go));if(target&&target.id!=='home')target.prepend(tool)}}));$('riwaq-login-toggle').onclick=()=>{$('riwaq-login-fields').hidden=!$('riwaq-login-fields').hidden};$('riwaq-signin').onclick=async()=>{if(!client){message('لم يكتمل الاتصال بعد');return}const email=$('riwaq-email').value.trim(),password=$('riwaq-password').value;if(!email||!password){message('أدخلي البريد الإلكتروني وكلمة المرور');return}const btn=$('riwaq-signin');btn.disabled=true;message('جارٍ التحقق من حساب الإدارة...');try{const {error}=await client.auth.signInWithPassword({email,password});if(error)throw error;$('riwaq-password').value='';await checkSession()}catch(e){message('تعذّر تسجيل الدخول: '+e.message)}finally{btn.disabled=false}};logout.onclick=async()=>{await client.auth.signOut();admin=false;currentId=null;lockForms();message('تم تسجيل الخروج')};
function lockForms(){window.riwaqAdminEnabled=!visitorMode;for(const id of ['learn','teach','impact']){document.querySelectorAll('#'+id+' input,#'+id+' textarea,#'+id+' select').forEach(x=>{x.disabled=visitorMode})}if(!visitorMode){$('element').disabled=!$('dimension').value;$('observation-element').disabled=!$('observation-dimension').value}tool.hidden=!admin;portal.hidden=true;login.hidden=true;logout.hidden=true;document.querySelectorAll('nav button[data-page]').forEach(b=>{if(b.dataset.page!=='home')b.hidden=visitorMode});document.querySelectorAll('[data-go]').forEach(b=>b.hidden=!admin);if(visitorMode){document.querySelectorAll('main section').forEach(x=>x.hidden=x.id!=='home');document.querySelectorAll('nav button[data-page]').forEach(x=>x.classList.toggle('active',x.dataset.page==='home'))}else if(admin){const page=currentPage();const target=document.querySelector('#'+page);if(target)target.prepend(tool)}$('riwaq-status').textContent=admin?'وضع الإدارة: يمكنك إضافة الجولات وحفظها، ولا يظهر للزوار إلا الملخص المعتمد.':'وضع الزائر: عرض النتائج المنشورة فقط.';}
async function loadPublic(){try{
 const {data,error}=await client.from('riwaq_publications').select('id,title,summary,round_type,published_at,metrics').order('published_at',{ascending:false}).limit(100);
 if(error)throw error;
 const box=$('riwaq-public-list');box.replaceChildren();
 if(!data.length)box.textContent='لم تُنشر جولات على الموقع بعد.';
 (data||[]).forEach(d=>{
  const item=document.createElement('div');item.className='riwaq-approved';
  const btn=document.createElement('button');btn.type='button';btn.textContent=d.title;btn.onclick=()=>openPublishedRound(d);
  const p=document.createElement('p');p.textContent=d.summary;
  item.append(btn,p);box.append(item);
 });
 renderHomeRounds(data||[]);
}catch(e){$('riwaq-public-list').textContent='تعذّر جلب الجولات المنشورة حاليًا.';renderHomeRounds();}}
function fields(page){return [...document.querySelectorAll('#'+page+' input,#'+page+' select,#'+page+' textarea')].filter(x=>x.type!=='file'&&!x.closest('.riwaq-private')&&!x.closest('.riwaq-local-header')&&!x.closest('.riwaq-local-footer'))}
function snapshot(page){return fields(page).map(x=>({tag:x.tagName,value:x.value}));}
function restore(page,values){const fs=fields(page);values.forEach((v,i)=>{if(fs[i]){fs[i].value=v.value||'';fs[i].dispatchEvent(new Event('change',{bubbles:true}));}});}
function currentPage(){return [...document.querySelectorAll('main section')].find(x=>!x.hidden && ['learn','teach','impact'].includes(x.id))?.id||'learn';}
function reset(){currentId=null;$('riwaq-title').value='';for(const p of ['learn','teach','impact'])fields(p).forEach(x=>{x.value='';x.dispatchEvent(new Event('change',{bubbles:true}))});message('نموذج جديد، لم يُحفظ بعد.');}
async function loadEntries(){const {data,error}=await client.from('riwaq_entries').select('id,title,round_type,created_at,payload').order('created_at',{ascending:false}).limit(100);if(error)throw error;const select=$('riwaq-saved');select.replaceChildren(new Option('اختاري سجلًا محفوظًا',''));(data||[]).forEach(d=>{const op=new Option(d.title||'جولة دون عنوان',d.id);op.dataset.payload=JSON.stringify(d.payload);select.add(op)});}
$('riwaq-saved').onchange=e=>{const op=e.target.selectedOptions[0];if(!e.target.value)return;let payload=JSON.parse(op.dataset.payload||'{}');currentId=e.target.value;$('riwaq-title').value=op.textContent;for(const pg of ['learn','teach','impact'])if(payload[pg])restore(pg,payload[pg]);message('تم استرجاع السجل. يمكنك تعديله ثم الضغط على حفظ.');};
$('riwaq-save').onclick=async()=>{if(!admin){message('يجب تسجيل الدخول كإدارة قبل حفظ الجولة.');return}const title=$('riwaq-title').value.trim();if(!title){message('أدخلي عنوان السجل أولًا.');return}const payload={learn:snapshot('learn'),teach:snapshot('teach'),impact:snapshot('impact')},record={title,round_type:currentPage()==='teach'?'teaching':'learning',payload};const btn=$('riwaq-save');btn.disabled=true;try{let result;if(currentId)result=await client.from('riwaq_entries').update({...record,updated_at:new Date().toISOString()}).eq('id',currentId).select('id').single();else result=await client.from('riwaq_entries').insert(record).select('id').single();if(result.error)throw result.error;currentId=result.data.id;await loadEntries();$('riwaq-saved').value=currentId;message('تم حفظ السجل في قاعدة البيانات السحابية بنجاح.')}catch(e){message('فشل الحفظ: '+e.message)}finally{btn.disabled=false}};
$('riwaq-new').onclick=reset;$('riwaq-refresh').onclick=async()=>{try{await loadEntries();message('تم تحديث السجلات.')}catch(e){message(e.message)}};
$('riwaq-publish').onclick=async()=>{if(!admin)return;const title=$('riwaq-pub-title').value.trim(),summary=$('riwaq-pub-summary').value.trim();if(!title||!summary){message('أدخلي عنوان الملخص ونصه قبل نشره.');return}if(!confirm('سيظهر هذا الملخص لجميع زوار البوابة. هل راجعتِ خلوّه من البيانات الداخلية؟'))return;const btn=$('riwaq-publish');btn.disabled=true;try{const type=currentPage()==='teach'?'teaching':currentPage()==='impact'?'impact':'learning';const {error}=await client.from('riwaq_publications').insert({title,summary,round_type:type});if(error)throw error;$('riwaq-pub-title').value='';$('riwaq-pub-summary').value='';await loadPublic();message('تم نشر الملخص المعتمد للزوار.')}catch(e){message('لم يتم النشر: '+e.message)}finally{btn.disabled=false}};
async function checkSession(){if(new URLSearchParams(location.search).get('visitor')==='1'){admin=false;lockForms();return}const {data}=await client.auth.getUser();const user=data.user;if(!user){admin=false;lockForms();message('لإضافة جولة، سجّلي الدخول بحساب إدارة الرواق أولًا.');return}try{const {data:access,error}=await client.from('riwaq_admins').select('user_id').eq('user_id',user.id).maybeSingle();if(error)throw error;admin=!!access;lockForms();if(admin){await loadEntries();message('صلاحية الإدارة مفعّلة. اختاري جولات التعلم أو جولات التدريس ثم ابدئي الإضافة والحفظ.')}else {admin=false;lockForms();message('هذا الحساب غير مضاف إلى قائمة إدارة الرواق.') }}catch(e){admin=false;lockForms();message('تعذّر التحقق من صلاحيات الإدارة: '+e.message)}} 
async function boot(){try{const {createClient}=await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm');client=createClient(PROJECT_URL,KEY,{auth:{persistSession:true,autoRefreshToken:true,storageKey:'alhazm-evidence-session'}});await loadPublic();}catch(e){message('تعذّر الاتصال بالخادم الآن. تبقى الصفحة متاحة للعرض فقط.');lockForms()}}
// Independent on-device drafts: editing works without a second password; publication stays protected by RLS.
const localPrefix='alhazm-riwaq-drafts-v2';
function getDrafts(){try{return JSON.parse(localStorage.getItem(localPrefix)||'[]')}catch{return []}}
function putDrafts(items){localStorage.setItem(localPrefix,JSON.stringify(items))}
function exportRiwaqBackup(){
 const payload={format:'alhazm-riwaq-backup',version:1,exportedAt:new Date().toISOString(),rounds:getDrafts()};
 const blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json;charset=utf-8'});
 const url=URL.createObjectURL(blob),a=document.createElement('a');
 a.href=url;a.download='نسخة_احتياطية_رواق_الحزم_'+new Date().toISOString().slice(0,10)+'.json';
 document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
async function importRiwaqBackup(file){
 const json=JSON.parse(await file.text());
 if(json.format!=='alhazm-riwaq-backup'||!Array.isArray(json.rounds))throw Error('هذا الملف ليس نسخة رواق الحزم');
 const original=getDrafts(),ids=new Set(original.map(x=>x.id));
 for(const d of json.rounds){
  if(!d||!['learn','teach','impact'].includes(d.page)||!Array.isArray(d.values))continue;
  const item={...d,id:String(d.id||Date.now().toString(36)),title:String(d.title||'جولة مسترجعة')};
  const idx=original.findIndex(x=>x.id===item.id);
  if(idx>=0){if(confirm('جولة "'+item.title+'" موجودة. هل تريدين استبدالها؟'))original[idx]=item}
  else{original.push(item);ids.add(item.id)}
 }
 putDrafts(original);
 renderHomeRounds();
 return original.length;
}
function setupBackupControls(){
 if(visitorMode)return;
 const panel=document.createElement('div');panel.className='card';panel.id='riwaq-backup';
 panel.innerHTML='<h3>نسخة احتياطية لرِواق الحزم</h3><p class="tiny">حمّلي نسخة JSON من الجولات المحفوظة على هذا الجهاز، ويمكنك استيرادها لاحقًا من الجهاز نفسه أو جهاز آخر. لا تتضمن الصور، فهي محفوظة بصورة منفصلة في المتصفح.</p><div class="riwaq-admin-toolbar"><button type="button" id="riwaq-export">تنزيل نسخة احتياطية</button><button type="button" id="riwaq-import">استيراد نسخة احتياطية</button><input type="file" id="riwaq-import-file" accept=".json,application/json" style="display:none"></div><p id="riwaq-backup-status" class="tiny" role="status"></p>';
 const home=document.getElementById('home');home.insertBefore(panel,home.firstElementChild);
 panel.querySelector('#riwaq-export').onclick=exportRiwaqBackup;
 panel.querySelector('#riwaq-import').onclick=()=>panel.querySelector('#riwaq-import-file').click();
 panel.querySelector('#riwaq-import-file').onchange=async e=>{const f=e.target.files?.[0];if(!f)return;try{const n=await importRiwaqBackup(f);panel.querySelector('#riwaq-backup-status').textContent='تم استيراد النسخة. إجمالي السجلات: '+n;renderHomeRounds()}catch(err){panel.querySelector('#riwaq-backup-status').textContent='تعذّر الاستيراد: '+err.message}finally{e.target.value=''}};
}
let lastPublications=[];
function renderHomeRounds(publications=null){
 if(Array.isArray(publications))lastPublications=publications;
 publications=lastPublications;
 const local=visitorMode?[]:getDrafts();
 const types=[['learn','learning',0],['teach','teaching',1],['impact','impact',2]];
 const stats=[...document.querySelectorAll('#home .stat')];
 const tiles=stats.map(x=>x.closest('.card'));
 for(const [page,remoteType,index] of types){
  const box=tiles[index];if(!box)continue;
  const cloud=publications.filter(x=>x.round_type===remoteType);
  const localRows=local.filter(x=>x.page===page);
  const unique=new Map();
  cloud.forEach(x=>unique.set('pub:'+x.id,{title:x.title,id:x.id,public:true}));
  localRows.forEach(x=>{const matching=cloud.find(p=>p.id===x.publicationId||p.metrics?.source_id===x.id);if(matching){unique.delete('pub:'+matching.id);unique.set('pub:'+matching.id,{title:matching.title,id:matching.id,public:true});}else unique.set('local:'+x.id,{title:x.title,id:x.id,page,public:false})});
  if(stats[index])stats[index].textContent=unique.size;
  let names=box.querySelector('.riwaq-round-names');
  if(!names){names=document.createElement('div');names.className='riwaq-round-names';names.style.cssText='margin-top:12px;border-top:1px solid #eee;padding-top:10px;font-size:14px';box.append(names)}
  names.replaceChildren();
  for(const round of unique.values()){
   const row=document.createElement('div');row.style.cssText='padding:5px 0';
   if(round.page){const b=document.createElement('button');b.type='button';b.textContent=round.title;b.style.cssText='padding:4px 7px;text-align:right';b.onclick=()=>openRiwaqReadOnly(round.id);row.append(b)}
   else{const b=document.createElement('button');b.type='button';b.textContent=round.title;b.style.cssText='padding:4px 7px;text-align:right';b.onclick=()=>{const found=lastPublications.find(x=>x.id===round.id);if(found)openPublishedRound(found)};row.append(b)}
   names.append(row);
  }
 }
}

function safePublicSummary(record){
 const names={learn:'جولة تعلم',teach:'جولة تدريس',impact:'تقرير قياس أثر'};
 const bits=[names[record.page]||'جولة',record.date?'بتاريخ '+record.date:''];
 const pg=record.page,fs=fields(pg);
 const id=pg==='learn'?'focus':pg==='teach'?'observation-dimension':null;
 if(id){const pos=fs.findIndex(x=>x.id===id);const detail=pos>=0?record.values?.[pos]?.value:'';if(detail)bits.push('البؤرة أو البعد: '+detail)}
 return bits.filter(Boolean).join(' — ');
}
async function publishRound(record){
 if(!client)throw Error('الاتصال السحابي غير متاح');
 const {data:userData,error:userError}=await client.auth.getUser();
 if(userError||!userData?.user)throw Error('يجب تفعيل هوية الإدارة مرة واحدة لنشر الجولات؛ الحفظ على الجهاز متاح بالفعل.');
 const {data:authorized,error:authError}=await client.from('riwaq_admins').select('user_id').eq('user_id',userData.user.id).maybeSingle();
 if(authError||!authorized)throw Error('حسابك غير مخوّل للنشر في الرواق.');
 const base={title:record.title,round_type:record.page==='teach'?'teaching':record.page==='impact'?'impact':'learning',summary:safePublicSummary(record)};
 const request=record.publicationId
  ?client.from('riwaq_publications').update(base).eq('id',record.publicationId).select('id').single()
  :client.from('riwaq_publications').insert(base).select('id').single();
 const {data,error}=await request;
 if(error)throw error;
 record.publicationId=data.id;
 const saved=getDrafts(),index=saved.findIndex(x=>x.id===record.id);
 if(index>=0){saved[index]={...saved[index],publicationId:data.id};putDrafts(saved);renderHomeRounds();renderHomeRounds()}
 await loadPublic();
 return true;
}
async function syncExistingRounds(){
 if(!client||visitorMode)return;
 try{const {data}=await client.auth.getUser();if(!data?.user)return;
 const {data:a}=await client.from('riwaq_admins').select('user_id').eq('user_id',data.user.id).maybeSingle();
 if(!a)return;
 for(const record of getDrafts().filter(r=>!r.publicationId)){try{await publishRound(record)}catch(e){console.warn('round sync failed',e.message)}}
 }catch(e){console.warn('sync unavailable',e.message)}
}

// Photos are optional and stored separately in browser IndexedDB so their size never prevents saving a round.
function photoDatabase(){return new Promise((resolve,reject)=>{if(!window.indexedDB)return reject(new Error('IndexedDB unavailable'));const req=indexedDB.open('alhazm-riwaq-photos',1);req.onupgradeneeded=()=>{if(!req.result.objectStoreNames.contains('roundPhotos'))req.result.createObjectStore('roundPhotos')};req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error)})}
async function storeRoundPhotos(id,files){const db=await photoDatabase();return new Promise((resolve,reject)=>{const tx=db.transaction('roundPhotos','readwrite');tx.objectStore('roundPhotos').put(files,id);tx.oncomplete=()=>{db.close();resolve()};tx.onerror=()=>{db.close();reject(tx.error)}})}
async function readRoundPhotos(id){const db=await photoDatabase();return new Promise((resolve,reject)=>{const tx=db.transaction('roundPhotos','readonly');const req=tx.objectStore('roundPhotos').get(id);req.onsuccess=()=>{db.close();resolve(req.result||[])};req.onerror=()=>{db.close();reject(req.error)}})}
for(const pg of ['learn','teach','impact']){
 const section=document.getElementById(pg);
 const header=document.createElement('div');header.className='card riwaq-local-header';header.hidden=visitorMode;
 header.innerHTML='<div class="riwaq-local-heading"><h3>بيانات الجولة</h3><button type="button" class="riwaq-local-previous">الجولات السابقة</button></div><div class="fields"><div><label>عنوان الجولة</label><input class="riwaq-local-title" placeholder="اكتبي عنوان الجولة"></div><div><label>تاريخ الجولة</label><input class="riwaq-local-date" type="date"></div></div><div class="riwaq-local-history" hidden><label>اختاري الجولة لفتحها وتعديلها</label><select class="riwaq-local-list"></select></div>';
 section.insertBefore(header,section.children[1]||null);
 const footer=document.createElement('div');footer.className='card riwaq-local-footer';footer.hidden=visitorMode;
 footer.innerHTML='<div class="riwaq-admin-toolbar"><button type="button" class="riwaq-local-save">حفظ الجولة</button><button type="button" class="riwaq-local-new">جولة جديدة</button></div><p class="riwaq-local-msg tiny" role="status"></p><p class="tiny">يُحفظ السجل على هذا الجهاز. لا تظهر بياناته للزوار إلا بعد نجاح المزامنة السحابية.</p>';
 section.append(footer);
 let photoInput=null,photoPreview=null,loadedPhotos=[],photoUrls=[];
 if(pg==='learn'||pg==='teach'){
  const evidence=document.createElement('div');evidence.className='riwaq-learning-evidence';evidence.innerHTML=pg==='learn'?'<label for="riwaq-learning-photos">الأدلة المصورة (اختيارية)</label><input id="riwaq-learning-photos" type="file" accept="image/jpeg,image/png,image/webp" multiple><p class="tiny">يمكنك إضافة صور أو حفظ الجولة دون صور. تُحفظ الصور على هذا الجهاز فقط.</p><div class="riwaq-photo-preview" style="display:flex;flex-wrap:wrap;gap:10px"></div>':'<p class="tiny">معاينة الأدلة المصورة المختارة؛ تُحفظ على هذا الجهاز وتظهر في عرض الجولة.</p><div class="riwaq-photo-preview" style="display:flex;flex-wrap:wrap;gap:10px"></div>';
  footer.prepend(evidence);photoInput=pg==='learn'?evidence.querySelector('input'):section.querySelector('#images');photoPreview=evidence.querySelector('.riwaq-photo-preview');
  function renderPhotos(files){photoUrls.forEach(URL.revokeObjectURL);photoUrls=[];photoPreview.replaceChildren();files.forEach(file=>{const img=document.createElement('img');const url=URL.createObjectURL(file);photoUrls.push(url);img.src=url;img.alt=file.name;img.style.cssText='width:130px;height:100px;object-fit:cover;border-radius:8px;border:1px solid #ddd';photoPreview.append(img)})}
  photoInput.addEventListener('change',()=>{loadedPhotos=[...photoInput.files];renderPhotos(loadedPhotos)});
  evidence.renderPhotos=renderPhotos;
 }
 let opened=null;
 const title=header.querySelector('.riwaq-local-title'),date=header.querySelector('.riwaq-local-date'),list=header.querySelector('.riwaq-local-list'),history=header.querySelector('.riwaq-local-history'),msg=footer.querySelector('.riwaq-local-msg');

 const existingDate=pg==='learn'?[...section.querySelectorAll('input[type="date"]')].find(x=>!x.closest('.riwaq-local-header')):null;
 if(existingDate){const row=existingDate.parentElement;row.hidden=true;date.addEventListener('change',()=>{existingDate.value=date.value});}
 function refresh(){list.replaceChildren(new Option('اختاري جولة محفوظة',''));getDrafts().filter(d=>d.page===pg).forEach(d=>list.add(new Option(d.title,d.id)));if(opened)list.value=opened}
 header.querySelector('.riwaq-local-previous').onclick=()=>{history.hidden=!history.hidden;refresh()};
 refresh();
 footer.querySelector('.riwaq-local-save').onclick=async()=>{const name=title.value.trim();if(!name){msg.textContent='اكتبي عنوان الجولة أولًا.';title.focus();return}try{if(existingDate)existingDate.value=date.value;const drafts=getDrafts();if(!opened)opened=Date.now().toString(36)+'-'+Math.random().toString(36).slice(2);const idx=drafts.findIndex(d=>d.id===opened);const record={id:opened,page:pg,title:name,date:date.value,values:snapshot(pg),modified:new Date().toISOString(),publicationId:idx>=0?drafts[idx].publicationId:null};if(idx<0)drafts.unshift(record);else drafts[idx]=record;putDrafts(drafts);refresh();renderHomeRounds();renderHomeRounds();msg.textContent='تم حفظ الجولة بنجاح على هذا الجهاز.';if(photoInput){storeRoundPhotos(opened,loadedPhotos).then(()=>{msg.textContent='تم حفظ الجولة والأدلة المصورة على هذا الجهاز.'}).catch(()=>{msg.textContent=msg.textContent+' تعذّر حفظ الصور على هذا الجهاز.'})}}catch(e){msg.textContent='تعذّر الحفظ المحلي: '+e.message}};
 footer.querySelector('.riwaq-local-new').onclick=()=>{opened=null;title.value='';date.value='';fields(pg).forEach(x=>{x.value='';x.dispatchEvent(new Event('change',{bubbles:true}))});refresh();list.value='';history.hidden=true;if(photoInput){photoInput.value='';loadedPhotos=[];footer.querySelector('.riwaq-learning-evidence').renderPhotos([])}msg.textContent='جولة جديدة جاهزة للإضافة.';title.focus()};
 list.onchange=()=>{const record=getDrafts().find(d=>d.id===list.value);if(!record)return;opened=record.id;title.value=record.title;restore(pg,record.values||[]);date.value=record.date||(existingDate?existingDate.value:'');msg.textContent='تم فتح الجولة المحفوظة، ويمكنك تعديلها وحفظها.';if(photoInput){photoInput.value='';loadedPhotos=[];footer.querySelector('.riwaq-learning-evidence').renderPhotos([]);readRoundPhotos(record.id).then(files=>{if(opened!==record.id)return;loadedPhotos=files;footer.querySelector('.riwaq-learning-evidence').renderPhotos(files)}).catch(()=>{msg.textContent='تم فتح الجولة، لكن تعذّر استرجاع صورها.'})}history.hidden=true};
}


function openPublishedRound(d){
 const overlay=document.createElement('div');overlay.className='riwaq-public-overlay';overlay.style.cssText='position:fixed;inset:0;z-index:10000;background:#24182cbb;overflow:auto;padding:18px';
 const report=document.createElement('article');report.className='riwaq-print-report';report.style.cssText='direction:rtl;background:white;border-radius:14px;max-width:850px;margin:12px auto;padding:30px;font:16px/1.9 Tahoma,Arial,sans-serif;color:#362843';
 const top=document.createElement('div');top.className='riwaq-report-actions';top.style.cssText='display:flex;gap:8px;justify-content:flex-end;flex-wrap:wrap';
 const print=document.createElement('button');print.type='button';print.textContent='طباعة التقرير';print.onclick=()=>window.print();
 const close=document.createElement('button');close.type='button';close.textContent='إغلاق';close.onclick=()=>overlay.remove();
 top.append(print,close);
 const school=document.createElement('p');school.textContent='مدرسة الحزم للتعليم الأساسي (1–4) | رواق الحزم التربوي';
 const title=document.createElement('h2');title.textContent=d.title;
 const category=document.createElement('p');category.textContent=d.round_type==='teaching'?'جولة تدريس':d.round_type==='impact'?'تقرير قياس الأثر':'جولة تعلم';
 const date=document.createElement('p');date.style.cssText='font-size:13px;color:#665a6c';date.textContent=d.metrics?.date?'تاريخ الجولة: '+d.metrics.date:d.published_at?'تاريخ النشر: '+new Date(d.published_at).toLocaleDateString('ar-OM'):'';
 report.append(top,school,title,category,date);
 const saved=d.metrics?.values;
 if(Array.isArray(saved)&&saved.length){
  const teachLabels=['فريق المادة','التاريخ / الحصة','الصف','المعلم المضيف','الميسر','الملاحظون (أعضاء الفريق)','البعد المستهدف','العنصر','موعد الحصة','مبرر اختيار العنصر','نقاط القوة بعد الجولة','فرص التحسين بعد الجولة','التوصيات العملية القابلة للتنفيذ','البعد في بطاقة الملاحظة','العنصر في بطاقة الملاحظة','الأدلة والملاحظات الصفية','الترميز (1–5)','التوصيات'];
  const genericLabels=d.round_type==='learning'?['التاريخ','اليوم','بؤرة الجولة','الصفوف','عدد الصفوف','فريق الجولة','سؤال الجولة','ممارسات المعلمة','ممارسات الطلبة','الشواهد الموضوعية','الأنماط المشتركة']:null;
  const labels=d.round_type==='teaching'?teachLabels:genericLabels||[];
  const heading=document.createElement('h3');heading.textContent=d.round_type==='teaching'?'استمارة التخطيط وبطاقة الملاحظة الصفية':'تفاصيل الجولة';report.append(heading);
  saved.forEach((v,i)=>{
    const value=typeof v==='string'?v:(v?.value??'');
    if(!String(value).trim())return;
    if(i===13&&d.round_type==='teaching'){const div=document.createElement('h3');div.textContent='بطاقة الملاحظة الصفية';div.style.cssText='margin-top:20px;border-top:2px solid #e5dceb;padding-top:15px';report.append(div)}
    const field=document.createElement('section');field.style.cssText='break-inside:avoid;margin:10px 0';
    const label=document.createElement('strong');label.textContent=labels[i]||'بيان '+(i+1);
    const body=document.createElement('div');body.textContent=String(value);body.style.cssText='white-space:pre-wrap;background:#f8f6fb;border-radius:8px;padding:10px 12px;margin-top:4px';
    field.append(label,body);report.append(field);
  });
 }else{
   const summary=document.createElement('div');summary.textContent=d.summary||'لا يوجد ملخص منشور';summary.style.cssText='white-space:pre-wrap;background:#f8f6fb;border-radius:10px;padding:16px';report.append(summary);
 }
 overlay.append(report);overlay.addEventListener('click',e=>{if(e.target===overlay)overlay.remove()});
 document.body.append(overlay);
}
const printStyle=document.createElement('style');printStyle.textContent='@media print{body>*{display:none!important}body>.riwaq-public-overlay,body>.riwaq-readonly-overlay{display:block!important;position:static!important;background:white!important;padding:0!important;overflow:visible!important}.riwaq-public-overlay .riwaq-print-report,.riwaq-readonly-overlay article{display:block!important;box-shadow:none!important;margin:0!important;padding:8mm!important;width:100%!important;max-width:none!important;border:0!important}.riwaq-report-actions,.riwaq-readonly-overlay button{display:none!important}@page{size:A4;margin:13mm}}';document.head.append(printStyle);
function openRiwaqReadOnly(id){
 const record=getDrafts().find(d=>d.id===id);
 if(!record)return;
 const section=document.getElementById(record.page);
 if(!section)return;
 const backdrop=document.createElement('div');
 backdrop.className='riwaq-readonly-overlay';
 backdrop.style.cssText='position:fixed;inset:0;z-index:9999;background:rgba(31,17,46,.7);padding:20px;overflow:auto;display:flex;justify-content:center;align-items:flex-start';
 const article=document.createElement('article');
 article.setAttribute('role','dialog');article.setAttribute('aria-modal','true');article.setAttribute('aria-label','عرض الجولة');
 article.style.cssText='background:#fff;border-radius:18px;width:min(950px,100%);margin:15px auto;padding:24px;box-shadow:0 15px 48px #241b3655;direction:rtl';
 const bar=document.createElement('div');bar.style.cssText='display:flex;gap:12px;align-items:center;justify-content:space-between;flex-wrap:wrap;position:sticky;top:0;background:white;padding:12px 0;border-bottom:1px solid #e4dcea;z-index:1';
 const heading=document.createElement('h2');heading.textContent=record.title;heading.style.margin='0';
 const printButton=document.createElement('button');printButton.type='button';printButton.textContent='طباعة التقرير';printButton.onclick=()=>window.print();const close=document.createElement('button');close.textContent='إغلاق';close.onclick=()=>backdrop.remove();
 bar.append(heading,printButton,close);article.append(bar);
 const date=document.createElement('p');date.className='tiny';date.textContent=record.date?'تاريخ الجولة: '+record.date:'';article.append(date);
 const content=section.cloneNode(true);
 content.removeAttribute('id');content.hidden=false;
 content.querySelectorAll('.riwaq-local-header,.riwaq-local-footer,.riwaq-private,.riwaq-access,button,input[type="file"],.riwaq-photo-preview').forEach(x=>x.remove());
 const liveFields=fields(record.page);
 const clonedFields=[...content.querySelectorAll('input,select,textarea')];
 clonedFields.forEach((el,i)=>{
   const span=document.createElement('div');
   const saved=record.values?.[i]?.value;
   let value=saved===undefined||saved===null?'':String(saved);
   // Keep section forms in read-only presentation, including select values.
   span.textContent=value.trim()||'—';
   span.style.cssText='min-height:32px;white-space:pre-wrap;background:#f8f6fb;border:1px solid #e9e3ef;border-radius:8px;padding:8px 12px';
   el.replaceWith(span);
 });
 // The original page may have a hidden date input; the top heading already shows its date.
 content.querySelectorAll('[hidden]').forEach(x=>{if(!x.closest('section'))x.remove()});
 article.append(content);
 const photoSection=document.createElement('section');photoSection.className='riwaq-report-photos';photoSection.style.cssText='margin-top:18px;border-top:1px solid #e9e3ef;padding-top:14px';
 const photoHeading=document.createElement('h3');photoHeading.textContent='الأدلة المصورة';photoSection.append(photoHeading);
 const gallery=document.createElement('div');gallery.style.cssText='display:flex;flex-wrap:wrap;gap:12px';
 photoSection.append(gallery);article.append(photoSection);
 const localPhotoUrls=[];
 function clearPhotoUrls(){localPhotoUrls.forEach(URL.revokeObjectURL);localPhotoUrls.length=0}
 readRoundPhotos(id).then(files=>{
   if(!backdrop.isConnected)return;
   if(!files.length){const p=document.createElement('p');p.className='tiny';p.textContent='لا توجد صور محفوظة مع هذه الجولة على هذا الجهاز.';gallery.append(p);return}
   for(const file of files){
     if(!(file instanceof Blob)||!file.type.startsWith('image/'))continue;
     const url=URL.createObjectURL(file);localPhotoUrls.push(url);
     const anchor=document.createElement('a');anchor.href=url;anchor.target='_blank';anchor.rel='noopener';
     const img=document.createElement('img');img.src=url;img.alt=file.name||'دليل مصور';img.loading='lazy';img.style.cssText='width:210px;max-width:100%;height:160px;object-fit:contain;border:1px solid #ddd;border-radius:9px;background:#faf9fc';
     anchor.append(img);gallery.append(anchor)
   }
 }).catch(()=>{gallery.textContent='تعذّر قراءة الصور المحفوظة على هذا الجهاز.'});
 const dismiss=()=>{clearPhotoUrls();backdrop.remove()};
 close.onclick=dismiss;
 const foot=document.createElement('p');foot.className='tiny';foot.textContent='نسخة للقراءة والاطلاع فقط. لا يمكن تعديل البيانات من هذا العرض.';article.append(foot);
 backdrop.append(article);
 backdrop.addEventListener('click',e=>{if(e.target===backdrop)dismiss()});
 const onKey=e=>{if(e.key==='Escape'){dismiss();document.removeEventListener('keydown',onKey)}};
 document.addEventListener('keydown',onKey);
 document.body.append(backdrop);
}

setupBackupControls();
renderHomeRounds();

lockForms();boot();
})();