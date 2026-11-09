(()=>{
'use strict';
const URL='https://fmmilquujleokfxcbnas.supabase.co';
const KEY='sb_publishable_O_JqIM-VqzdGgU8VTvhRHQ_eQ9eTH5R';
const DB='alhazm_activities_2026_v1';
const isDevelopmentBoard=/professional-development-board\.html$/i.test(location.pathname);
const isPartnershipBoard=/community-partnerships-board\.html$/i.test(location.pathname);
const isCommunityInitiativesBoard=/community-initiatives-board\.html$/i.test(location.pathname);
const isStandaloneBoard=isDevelopmentBoard||isPartnershipBoard||isCommunityInitiativesBoard;
const section=isPartnershipBoard?'community_partnerships':isCommunityInitiativesBoard?'community_initiatives':isDevelopmentBoard?'professional_development':(new URLSearchParams(location.search).get('type')==='activities'?'activities':'initiatives');
const boardName=isPartnershipBoard?'الشراكات المجتمعية':isCommunityInitiativesBoard?'المبادرات المجتمعية':isDevelopmentBoard?'توثيق الإنماء المهني':null;
const visitorMode=new URLSearchParams(location.search).get('visitor')==='1';
if(isStandaloneBoard){
 const tabs=document.querySelector('.tabs');if(tabs){const back=document.getElementById('backToPortal');if(back)back.href= new URLSearchParams(location.search).get('visitor')==='1'?'./visitor.html':'./index.html';}
}
if(visitorMode){
 const a=document.getElementById('activitiesTab'),i=document.getElementById('initiativesTab'),back=document.getElementById('backToPortal');
 if(a)a.href='?type=activities&visitor=1';
 if(i)i.href='?type=initiatives&visitor=1';
 if(back)back.href='./visitor.html';
 const heading=document.querySelector('header h1');
 if(heading)heading.textContent=boardName?'💜 '+boardName+' — عرض الزوار':'💜 لوحة الحزم | الأنشطة والمبادرات — عرض الزوار';
}
const $=id=>document.getElementById(id);
let token=sessionStorage.getItem('hazm_board_access')||'',user=null,admin=false,columns=[],posts=[],attachments=[],locals=[],mode='',current=null,selectedPost=null;
function el(tag,cls,content){const n=document.createElement(tag);if(cls)n.className=cls;if(content!==undefined)n.textContent=content;return n}
function message(s){$('message').textContent=s}
function note(s){alert(s)}
function requestHeaders(extra={}){return {'apikey':KEY,...(token?{'Authorization':'Bearer '+token}:{}),...extra}}
async function call(path,options={}){const r=await fetch(URL+path,{...options,headers:requestHeaders(options.headers||{})});const raw=await r.text();let data;try{data=raw?JSON.parse(raw):null}catch{data=raw}if(!r.ok)throw Error((data&& (data.message||data.msg||data.error_description||data.error))||'HTTP '+r.status);return data}
function esc(s){return encodeURIComponent(s)}
async function query(table,params){return await call('/rest/v1/'+table+'?'+params)}
async function insert(table,payload){const v=await call('/rest/v1/'+table,{method:'POST',headers:{'Content-Type':'application/json','Prefer':'return=representation'},body:JSON.stringify(payload)});return v?.[0]}
async function update(table,id,payload){return await call('/rest/v1/'+table+'?id=eq.'+esc(id),{method:'PATCH',headers:{'Content-Type':'application/json','Prefer':'return=representation'},body:JSON.stringify(payload)})}
async function deleteRow(table,id){return await call('/rest/v1/'+table+'?id=eq.'+esc(id),{method:'DELETE'})}
function isImage(file){return (file?.mime_type||'').startsWith('image/')}
async function verify(){if(!token){admin=false;user=null;return}try{const u=await call('/auth/v1/user');user=u;const rows=await query('riwaq_admins','select=user_id&user_id=eq.'+esc(u.id));admin=Array.isArray(rows)&&rows.length>0;if(!admin){token='';user=null;sessionStorage.removeItem('hazm_board_access')}}catch{admin=false;user=null;token='';sessionStorage.removeItem('hazm_board_access')}}
const toolbar=el('div','row');toolbar.style='padding:8px 20px;justify-content:flex-start';
const authButton=el('button','','الدخول للإدارة');toolbar.append(authButton);
const importInfo=el('span','','');importInfo.style='font-size:12px;color:#665b6f;align-self:center';toolbar.append(importInfo);$('message').after(toolbar);
async function getCredentials(){return new Promise(resolve=>{
const wrap=el('div','modal on'),dialog=el('form','dialog');dialog.autocomplete='on';
const title=el('h2','','دخول إدارة الحزم'),emailLabel=el('label','','البريد الإلكتروني'),email=el('input'),passLabel=el('label','','كلمة المرور'),pass=el('input'),buttons=el('div','row'),cancel=el('button','','إلغاء'),submit=el('button','primary','دخول');
email.type='email';email.required=true;email.autocomplete='username';pass.type='password';pass.required=true;pass.autocomplete='current-password';submit.type='submit';cancel.type='button';
emailLabel.append(email);passLabel.append(pass);buttons.append(cancel,submit);dialog.append(title,emailLabel,passLabel,buttons);wrap.append(dialog);document.body.append(wrap);
const done=value=>{wrap.remove();resolve(value)};cancel.onclick=()=>done(null);dialog.onsubmit=e=>{e.preventDefault();done({email:email.value.trim(),password:pass.value})};email.focus();
})}
authButton.onclick=async()=>{if(admin){token='';admin=false;user=null;sessionStorage.removeItem('hazm_board_access');await load();return}
const credentials=await getCredentials();if(!credentials)return;
try{const out=await call('/auth/v1/token?grant_type=password',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(credentials)});token=out.access_token;await verify();if(!admin){note('الحساب غير مصرح له بإدارة لوحة الحزم.')}else sessionStorage.setItem('hazm_board_access',token);await load()}catch(e){token='';note('تعذر تسجيل الدخول: '+e.message)}};
function localRead(){return new Promise(resolve=>{try{const req=indexedDB.open(DB);req.onupgradeneeded=()=>req.transaction.abort();req.onerror=()=>resolve([]);req.onsuccess=()=>{const db=req.result;const names=Array.from(db.objectStoreNames);if(!names.length)return resolve([]);const t=db.transaction(names[0],'readonly');const q=t.objectStore(names[0]).getAll();q.onsuccess=()=>resolve((q.result||[]).filter(x=>x.type===section));q.onerror=()=>resolve([])}}catch{resolve([])}})}
async function load(){message('جارٍ تحميل البيانات من التخزين المركزي...');authButton.textContent=admin?'تسجيل خروج الإدارة':'دخول الإدارة';try{
columns=await query('hazm_board_columns','select=*&section=eq.'+section+'&order=position.asc,created_at.asc');
if(visitorMode)columns=columns.filter(x=>x.published);
const ids=columns.map(x=>x.id);
posts=ids.length?await query('hazm_board_posts','select=*&column_id=in.('+ids.join(',')+')&order=position.asc,created_at.asc'):[];
if(visitorMode)posts=posts.filter(x=>x.published);
const postids=posts.map(x=>x.id);attachments=postids.length?await query('hazm_board_attachments','select=*&post_id=in.('+postids.join(',')+')'):[];
locals=admin&&!isStandaloneBoard?await localRead():[];draw();
}catch(e){message('تعذر الاتصال بالسحابة: '+e.message+'. البيانات المحلية لم تُحذف.');locals=admin&&!isStandaloneBoard?await localRead():[];columns=[];posts=[];attachments=[];draw()}}
function makeButton(label,action,css=''){const b=el('button',css,label);b.onclick=action;return b}
async function fileLink(a){try{const r=await call('/storage/v1/object/sign/'+a.storage_bucket+'/'+a.storage_path,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({expiresIn:3600})});if(r.signedURL){const signed=r.signedURL.startsWith('http')?r.signedURL:URL+'/storage/v1'+(r.signedURL.startsWith('/')?'':'/')+r.signedURL;return signed}throw Error('تعذر إنشاء رابط الملف')}catch(e){note('تعذر فتح المرفق: '+e.message);return null}}
function renderAttachment(a,host){if(isImage(a)){const img=el('img');img.alt=a.filename||'شاهد';img.loading='lazy';img.style.cursor='zoom-in';img.onclick=async()=>{const signed=await fileLink(a);if(!signed)return;$('zoomImage').src=signed;$('viewer').classList.add('on')};host.append(img);fileLink(a).then(link=>{if(link)img.src=link}).catch(()=>{})}else host.append(makeButton('عرض المرفق: '+a.filename,async()=>{const signed=await fileLink(a);if(signed)window.open(signed,'_blank','noopener')}))}
function localFile(f,host){if(typeof f.data==='string'&&f.data.startsWith('data:image/')){const img=el('img');img.src=f.data;img.loading='lazy';img.onclick=()=>{$('zoomImage').src=f.data;$('viewer').classList.add('on')};host.append(img)}else if(f.data)host.append(makeButton('فتح المرفق',()=>{const a=el('a');a.href=f.data;a.download=f.name||'ملف';a.click()}))}
function renderLane(c,isLocal=false){const lane=el('section','lane'),head=el('div','head');head.append(el('h2','',c.title||'بدون عنوان'));if(isLocal)head.append(el('div','meta','محفوظ على هذا المتصفح فقط، ولم يُنقل للسحابة'));const cover=posts.find(p=>p.column_id===c.id&&p.kind==='description'&&p.published&&attachments.some(a=>a.post_id===p.id&&isImage(a)));head.append(el('p','',isLocal?(c.goal||''):(cover?'':c.description||'')));const ops=el('div','row');
if(!isLocal&&admin){ops.append(makeButton('تعديل العمود',()=>editColumn(c)),makeButton(c.published?'إلغاء النشر':'نشر العمود',()=>setPublished('hazm_board_columns',c,!c.published)),makeButton('حذف العمود',()=>removeColumn(c),'danger'))}
if(isLocal&&admin){const exists=columns.some(x=>x.source_local_id===String(c.id));if(!exists)ops.append(makeButton('نقل للسحابة',()=>importLocal(c)));else ops.append(el('small','', 'نُقل للسحابة ✓'))}
head.append(ops);lane.append(head);
if(isLocal){const d=el('article','post');d.append(el('h3','','بطاقة التوصيف'));d.append(el('div','txt',c.goal||c.details||'لا يوجد توصيف'));lane.append(d);(c.files||[]).forEach((f,i)=>{const post=el('article','post');post.append(el('h3','',f.description||f.name||'شاهد '+(i+1)));localFile(f,post);lane.append(post)})}
else{const d=el('article','post');d.append(el('h3','','بطاقة التوصيف'));
const descriptionPost=posts.find(x=>x.column_id===c.id&&x.kind==='description'&&x.published);
const descriptionFiles=descriptionPost?attachments.filter(x=>x.post_id===descriptionPost.id&&isImage(x)).sort((a,b)=>String(a.created_at||'').localeCompare(String(b.created_at||''))):[];
if(descriptionFiles.length){renderAttachment(descriptionFiles[descriptionFiles.length-1],d)}
else d.append(el('div','txt',c.description||'لم يُدرج توصيف بعد'));
lane.append(d);
for(const p of posts.filter(x=>x.column_id===c.id&&x.kind!=='description')){const post=el('article','post');post.append(el('h3','',p.title||'منشور'));if(p.body)post.append(el('div','txt',p.body));for(const a of attachments.filter(x=>x.post_id===p.id))renderAttachment(a,post);if(admin){const ops=el('div','foot');const row=el('div');row.append(makeButton('تعديل',()=>editPost(c,p)),makeButton(p.published?'إلغاء نشر':'نشر',()=>setPublished('hazm_board_posts',p,!p.published)),makeButton('حذف',()=>removePost(p),'danger'));ops.append(el('span','','دليل'),row);post.append(ops)}lane.append(post)}
if(admin)lane.append(makeButton('＋ إضافة دليل أسفل العمود',()=>newPost(c),'add'))}
$('board').append(lane)}
function draw(){const board=$('board');board.replaceChildren();const remoteIds=new Set(columns.map(x=>x.source_local_id));columns.forEach(x=>renderLane(x));locals.filter(x=>!remoteIds.has(String(x.id))).forEach(x=>renderLane(x,true));if(admin)board.append(makeButton('＋ إضافة عمود جديد',()=>newColumn(),'new'));
importInfo.textContent=admin?'إدارة موثقة • التخزين السحابي مفعّل • سجلات المتصفح القديمة متاحة للنقل اليدوي':'عرض المحتوى المنشور • للدخول الإداري استخدمي حساب الحزم المعتمد';
message((boardName||(section==='activities'?'الأنشطة':'المبادرات'))+' — '+columns.length+' أعمدة سحابية، '+locals.filter(x=>!remoteIds.has(String(x.id))).length+' أعمدة محلية لم تُنقل. لكل عمود توصيف ثابت وأدلة مرتبة أسفله.')}
async function setPublished(table,r,published){try{await update(table,r.id,{published});await load()}catch(e){note(e.message)}}
function form(title,name='',desc='',isPost=false,imageSelected=false,hasImage=false){return new Promise(resolve=>{
mode=isPost?'post':'column';$('editorTitle').textContent=title;$('itemTitle').value=name;$('itemDesc').value=desc;$('itemFile').value='';
const descLabel=$('itemDesc').parentElement, fileLabel=$('fileLabel'),file=$('itemFile');
let choice=imageSelected?'image':'text';
const rowChoice=el('div','row');rowChoice.style='margin-top:12px;gap:10px;align-items:center';
const textChoice=el('label','','◉ توصيف كتابي'),imageChoice=el('label','','◉ توصيف بصورة');
for(const x of [textChoice,imageChoice]){x.style='display:flex;align-items:center;gap:6px;margin:0;cursor:pointer;background:#f6f1fa;padding:7px 10px;border-radius:10px'}
const textRadio=el('input'),imageRadio=el('input');textRadio.type='radio';imageRadio.type='radio';textRadio.name=imageRadio.name='hazmDescriptionType';textRadio.value='text';imageRadio.value='image';
textChoice.prepend(textRadio);imageChoice.prepend(imageRadio);rowChoice.append(textChoice,imageChoice);
const hint=el('div','meta','يمكن الاكتفاء بصورة للتوصيف دون كتابة نص.');hint.style='margin:5px 0 0';
const dialog=$('editor').querySelector('.dialog'),actions=dialog.querySelector('.row');
if(!isPost){actions.before(rowChoice,hint)}
const updateChoice=()=>{if(isPost){descLabel.style.display='block';fileLabel.style.display='block';file.accept='image/*,application/pdf,video/*,.doc,.docx,.xls,.xlsx,.ppt,.pptx';fileLabel.firstChild.textContent='المرفق (اختياري عند التعديل)';return}
choice=imageRadio.checked?'image':'text';descLabel.style.display=choice==='text'?'block':'none';fileLabel.style.display=choice==='image'?'block':'none';
file.accept='image/*';fileLabel.firstChild.textContent='صورة التوصيف (JPG أو PNG أو WebP)';
hint.textContent=choice==='image'?(hasImage?'الصورة الحالية محفوظة؛ اختاري صورة أخرى لاستبدالها، أو احفظي للإبقاء عليها.':'اختاري صورة للتوصيف، ولا يلزم إدخال نص.'):'أدخلي التوصيف الكتابي، ويمكن تغييره إلى صورة لاحقًا.'};
textRadio.checked=choice==='text';imageRadio.checked=choice==='image';
textRadio.onchange=updateChoice;imageRadio.onchange=updateChoice;updateChoice();$('editor').classList.add('on');
const finish=v=>{$('editor').classList.remove('on');$('save').onclick=null;$('cancel').onclick=null;rowChoice.remove();hint.remove();resolve(v)};
$('cancel').onclick=()=>finish(null);
$('save').onclick=()=>{const selectedFile=file.files?.[0]||null;
if(!isPost&&choice==='image'&&!selectedFile&&!hasImage){note('اختاري صورة التوصيف أولًا');return}
if(!isPost&&choice==='image'&&selectedFile&&!selectedFile.type.startsWith('image/')){note('صيغة المرفق يجب أن تكون صورة');return}
finish({title:$('itemTitle').value.trim(),description:$('itemDesc').value.trim(),file:selectedFile,descriptionType:choice})}
})}
function getDescription(c){return posts.find(x=>x.column_id===c.id&&x.kind==='description')||null}
async function saveDescriptionImage(c,file,existing){
let p=existing;
if(!p)p=await insert('hazm_board_posts',{column_id:c.id,kind:'description',title:'صورة التوصيف',body:'',position:-1,created_by:user.id,published:false});
if(file)await upload(file,p.id);
await update('hazm_board_posts',p.id,{published:true});
}
async function newColumn(){
const f=await form('إضافة عمود جديد');if(!f||!f.title){if(f)note('العنوان مطلوب');return}
let c;try{
c=await insert('hazm_board_columns',{section,title:f.title,description:f.description,position:columns.length,created_by:user.id,published:f.descriptionType==='text'});
if(f.descriptionType==='image'){await saveDescriptionImage(c,f.file,null);await update('hazm_board_columns',c.id,{published:true})}
await load()
}catch(e){note('لم يكتمل الحفظ: '+e.message+'. لم تُحذف بيانات موجودة.');await load()}
}
async function editColumn(c){
const existing=getDescription(c),hasImage=!!(existing&&attachments.some(a=>a.post_id===existing.id&&isImage(a)));
const f=await form('تعديل العمود',c.title,c.description,false,!!existing?.published,hasImage);
if(!f||!f.title){if(f)note('العنوان مطلوب');return}
try{
if(f.descriptionType==='image'){
if(f.file||!existing?.published)await saveDescriptionImage(c,f.file,existing);
}else if(existing&&existing.published){await update('hazm_board_posts',existing.id,{published:false})}
await update('hazm_board_columns',c.id,{title:f.title,description:f.description,updated_at:new Date().toISOString()});
await load()
}catch(e){note('تعذر حفظ التوصيف: '+e.message);await load()}
}
async function removeColumn(c){if(!confirm('سيحذف العمود ومنشوراته. يجب حفظ نسخة احتياطية أولًا. هل أنت متأكدة؟'))return;const child=posts.filter(p=>p.column_id===c.id);if(child.some(p=>attachments.some(a=>a.post_id===p.id))){note('لحماية الأدلة، احذفي مرفقات المنشورات أولًا، ثم احذفي العمود.');return}try{await deleteRow('hazm_board_columns',c.id);await load()}catch(e){note(e.message)}}
async function upload(file,postid){if(!file)return;if(file.size>50*1024*1024)throw Error('الملف أكبر من 50 ميجابايت');const safe=(file.name||'file').replace(/[^a-zA-Z0-9._-]/g,'_').slice(-80);const path=user.id+'/'+postid+'/'+(crypto.randomUUID?crypto.randomUUID():Date.now())+'-'+safe;const res=await fetch(URL+'/storage/v1/object/hazm-board-files/'+path,{method:'POST',headers:requestHeaders({'Content-Type':file.type||'application/octet-stream','x-upsert':'false'}),body:file});if(!res.ok){const j=await res.text();throw Error('فشل رفع الملف: '+j.slice(0,160))}await insert('hazm_board_attachments',{post_id:postid,storage_path:path,filename:file.name||safe,mime_type:file.type||'application/octet-stream',file_size:file.size,created_by:user.id})}
async function newPost(c){const f=await form('إضافة دليل جديد','','',true);if(!f)return;if(!f.title&&!f.file){note('أدخلي عنوانًا أو مرفقًا');return}let p;try{p=await insert('hazm_board_posts',{column_id:c.id,kind:'evidence',title:f.title||f.file.name,body:f.description,position:posts.filter(x=>x.column_id===c.id).length,created_by:user.id,published:false});if(f.file)await upload(f.file,p.id);await update('hazm_board_posts',p.id,{published:true});await load()}catch(e){note('لم تكتمل الإضافة: '+e.message+'. ربما بقي المنشور كمسودة؛ تحققي قبل الإعادة.');await load()}}
async function editPost(c,p){const f=await form('تعديل المنشور',p.title,p.body,true);if(!f)return;try{await update('hazm_board_posts',p.id,{title:f.title,body:f.description,updated_at:new Date().toISOString()});if(f.file)await upload(f.file,p.id);await load()}catch(e){note('تعذر التعديل: '+e.message);await load()}}
async function removePost(p){if(!confirm('حذف هذا المنشور نهائيًا؟'))return;const attached=attachments.filter(a=>a.post_id===p.id);if(attached.length){if(!confirm('سيتم حذف '+attached.length+' مرفقات من التخزين السحابي أيضًا. هل تؤكدين؟'))return;try{for(const a of attached){const response=await fetch(URL+'/storage/v1/object/hazm-board-files/'+a.storage_path,{method:'DELETE',headers:requestHeaders()});if(!response.ok)throw Error('تعذر حذف ملف '+a.filename);await deleteRow('hazm_board_attachments',a.id)}}catch(e){note('لم يكتمل حذف المرفقات: '+e.message);await load();return}}try{await deleteRow('hazm_board_posts',p.id);await load()}catch(e){note(e.message)}}
function dataToFile(f){const m=(f.data||'').match(/^data:([^;,]+)?(;base64)?,(.*)$/s);if(!m)return null;let bytes;if(m[2]){const str=atob(m[3]);bytes=new Uint8Array(str.length);for(let i=0;i<str.length;i++)bytes[i]=str.charCodeAt(i)}else bytes=new TextEncoder().encode(decodeURIComponent(m[3]));return new File([bytes],f.name||'evidence',{'type':m[1]||f.mime||'application/octet-stream'})}
async function importLocal(c){if(!admin)return;const files=(c.files||[]);if(!confirm('نقل «'+c.title+'» و'+files.length+' مرفقات إلى التخزين المركزي؟ لن نحذف النسخة المحلية. ستبقى البيانات الجديدة غير منشورة حتى تراجعيها.'))return;
try{let remote=columns.find(x=>x.source_local_id===String(c.id));if(!remote){remote=await insert('hazm_board_columns',{section,title:c.title,description:c.goal||c.details||'',position:columns.length,source_local_id:String(c.id),created_by:user.id,published:false})}
const existing=await query('hazm_board_posts','select=*&column_id=eq.'+remote.id);for(let i=0;i<files.length;i++){const f=files[i],fingerprint='local-evidence-'+i;let p=existing.find(x=>x.body===fingerprint);if(!p){p=await insert('hazm_board_posts',{column_id:remote.id,kind:'evidence',title:f.description||f.name||'شاهد '+(i+1),body:fingerprint,position:i,created_by:user.id,published:false})}
const rows=await query('hazm_board_attachments','select=id&post_id=eq.'+p.id);if(rows.length)continue;const file=dataToFile(f);if(file)await upload(file,p.id);
}
note('انتهى نقل السجل إلى السحابة كمسودة. راجعيه ثم انشري العمود والمنشورات المطلوبة.');await load()
}catch(e){note('توقف النقل: '+e.message+'. لم نُزل السجلات المحلية؛ يمكن استئناف النقل لاحقًا.');await load()}}

const backupInput=el('input');backupInput.type='file';backupInput.accept='.json,application/json';backupInput.style.display='none';document.body.append(backupInput);
const importBtn=makeButton('استيراد سجلات من نسخة احتياطية',()=>backupInput.click());
if(!isStandaloneBoard)toolbar.append(importBtn);
backupInput.onchange=async()=>{if(!admin){note('تسجيل الدخول الإداري مطلوب');return}const file=backupInput.files?.[0];if(!file)return;try{
const parsed=JSON.parse(await file.text());const entries=parsed?.indexedDB?.[DB];if(!Array.isArray(entries))throw Error('لا تحتوي هذه النسخة على سجلات الأنشطة والمبادرات');
const relevant=entries.filter(x=>x.type===section);if(!confirm('وجدت '+relevant.length+' سجلات من قسم '+(section==='activities'?'الأنشطة':'المبادرات')+'. سيتم نقلها كمسودات، مع إبقاء النسخة الاحتياطية دون تعديل. المتابعة؟'))return;
let done=0;for(const record of relevant){await importLocal(record);done++}
note('تمت مراجعة '+done+' سجلات. تحققي من ظهور المرفقات قبل نشرها.')}catch(e){note('تعذر الاستيراد: '+e.message)}finally{backupInput.value=''}};

$('closeViewer').onclick=()=>{$('viewer').classList.remove('on');$('zoomImage').removeAttribute('src')};
if(visitorMode){token='';admin=false;user=null;sessionStorage.removeItem('hazm_board_access');toolbar.remove();load();setInterval(()=>{if(!document.hidden)load()},15000);document.addEventListener('visibilitychange',()=>{if(!document.hidden)load()})}else verify().then(load);
})();