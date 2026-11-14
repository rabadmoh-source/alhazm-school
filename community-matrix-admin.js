/* Administration-only editor for the existing published community matrix. */
(() => {
'use strict';
if (/\/visitor\.html$/i.test(location.pathname)) return;
const ROOT='https://fmmilquujleokfxcbnas.supabase.co';
const KEY='sb_publishable_O_JqIM-VqzdGgU8VTvhRHQ_eQ9eTH5R';
const LOCAL='alhazm_community_v1';
let user=null, accessToken='', evidenceChoices=[], busy=false;
const css=document.createElement('style');
css.textContent=`
#hazmCommunityLiveMatrix .matrix-edit{margin:7px 0 0;background:#148a87;color:#fff;border:0;border-radius:9px;padding:5px 10px;font:13px Tahoma,Arial;cursor:pointer}
#hazmCommunityLiveMatrix .matrix-edit:disabled{opacity:.55}
#hazmCommunityLiveMatrix .matrix-admin-note{margin:12px 0;background:#f0faf7;border:1px solid #bce5df;border-radius:11px;padding:10px;color:#185e5d}
.hazm-matrix-modal{position:fixed;inset:0;z-index:2147483000;background:#1d1535b8;display:flex;align-items:center;justify-content:center;padding:15px;direction:rtl}
.hazm-matrix-dialog{background:#fff;border-radius:17px;width:min(620px,100%);max-height:90vh;overflow:auto;padding:22px;box-shadow:0 9px 40px #160e3344;color:#322643;font:15px/1.8 Tahoma,Arial}
.hazm-matrix-dialog h2{color:#624580;margin:0 0 12px}.hazm-matrix-dialog label{display:block;margin:13px 0;font-weight:700}
.hazm-matrix-dialog input,.hazm-matrix-dialog textarea,.hazm-matrix-dialog select{display:block;width:100%;box-sizing:border-box;border:1px solid #cfc3da;border-radius:9px;padding:10px;font:inherit;background:white;color:#302842}
.hazm-matrix-dialog textarea{min-height:72px;resize:vertical}.hazm-matrix-actions{display:flex;flex-wrap:wrap;gap:8px;justify-content:flex-end;margin-top:16px}
.hazm-matrix-actions button{border:0;border-radius:9px;background:#70558d;color:white;padding:9px 18px;font:inherit;cursor:pointer}.hazm-matrix-actions .cancel{background:#eee9f2;color:#453652}
`;
document.head.append(css);
function el(tag,label,cls){const x=document.createElement(tag);if(label!==undefined)x.textContent=label;if(cls)x.className=cls;return x;}
function token(){return sessionStorage.getItem('hazm_board_access')||'';}
async function api(path,opts={}) {
 const res=await fetch(ROOT+path,{...opts,headers:{apikey:KEY,Authorization:'Bearer '+(accessToken||KEY),...(opts.body?{'Content-Type':'application/json'}:{}),...(opts.headers||{})}});
 const raw=await res.text();let data;try{data=raw?JSON.parse(raw):null}catch{data=raw}
 if(!res.ok)throw Error(data?.message||data?.error||'HTTP '+res.status);
 return data;
}
async function authorized(){
 accessToken=token();
 if(!accessToken){user=null;return false;}
 try{
  const who=await api('/auth/v1/user');
  if(!who?.id)throw Error('انتهت الجلسة');
  const allowed=await api('/rest/v1/riwaq_admins?select=user_id&user_id=eq.'+encodeURIComponent(who.id));
  if(!allowed?.length)throw Error('صلاحيات الإدارة غير متاحة');
  user=who;return true;
 }catch{user=null;return false;}
}
async function choices(){
 const types=[['community_partnerships','🤝 الشراكات'],['community_initiatives','🌱 المبادرات']];
 let all=[];
 for(const [section,label] of types){
  try{const rows=await api('/rest/v1/hazm_board_columns?select=id,title&published=eq.true&section=eq.'+section);
   all.push(...rows.map(x=>({id:String(x.id),title:label+' | '+(x.title||'دون عنوان')})));
  }catch{}
 }
 evidenceChoices=all;
}
function showForm(index,action,row){
 const cover=el('div',undefined,'hazm-matrix-modal'),box=el('form',undefined,'hazm-matrix-dialog');
 box.append(el('h2','✏️ تحرير الترابط — الإجراء '+(index+1)),el('p',action.title||action.name||action.action||'الإجراء المسجل'));
 const category=el('select'),goal=el('textarea'),target=el('textarea'),measured=el('textarea'),related=el('select');
 category.append(new Option('اختاري تصنيف الإجراء',''));
 ['التكافل المجتمعي','التوعية','دعم التعلم','التوثيق والمتابعة'].forEach(x=>category.append(new Option(x,x)));
 category.value=action.matrixCategory||'';
 goal.value=action.proceduralGoal||'';target.value=action.targetImpact||'';measured.value=action.measuredImpact||'';
 related.append(new Option('لم يُحدَّد ارتباط بدليل بعد',''));
 for(const choice of evidenceChoices)related.append(new Option(choice.title,choice.id));
 related.value=action.matrixEvidenceId||'';
 function field(label,input){const l=el('label',label);l.append(input);box.append(l);}
 field('تصنيف الإجراء',category);
 field('الهدف الإجرائي المعتمد',goal);
 field('الشراكة أو المبادرة المرتبطة (اختياري)',related);
 field('الأثر المستهدف (لا يعني تحقق الأثر)',target);
 field('الأثر المتحقق بعد القياس (اختياري)',measured);
 const explanation=el('p','اتركي خانة الأثر المتحقق فارغة حتى يتوفر قياس موثق. يُحفظ الربط دون تغيير اسم الإجراء أو حذف أدلته.');box.append(explanation);
 const actions=el('div',undefined,'hazm-matrix-actions'),cancel=el('button','إلغاء','cancel'),save=el('button','حفظ الربط');
 cancel.type='button';save.type='submit';actions.append(cancel,save);box.append(actions);cover.append(box);document.body.append(cover);
 cancel.onclick=()=>cover.remove();
 cover.addEventListener('click',e=>{if(e.target===cover)cover.remove()});
 box.onsubmit=async e=>{
  e.preventDefault();if(busy)return;
  if(!goal.value.trim()){alert('اكتبي الهدف الإجرائي قبل حفظ الترابط.');return;}
  busy=true;save.disabled=true;
  try{
   if(!await authorized())throw Error('يرجى تسجيل الدخول بحساب الإدارة السحابية ثم إعادة المحاولة.');
   const states=await api('/rest/v1/hazm_community_state?select=payload,updated_at&id=eq.main');
   if(!states?.length||!Array.isArray(states[0].payload?.actions))throw Error('لم تتوفر سجلات الإدارة السحابية.');
   const original=states[0],list=original.payload.actions,latest=list[index];
   if(!latest||typeof latest!=='object')throw Error('تعذرت مطابقة الإجراء؛ افتحي المصفوفة مجددًا.');
   const titleOf=x=>String(x.title||x.name||x.action||x.activity||'');
   if(titleOf(latest)!==titleOf(action))throw Error('تغير ترتيب الإجراءات؛ افتحي المصفوفة مجددًا لحماية البيانات.');
   const selected=evidenceChoices.find(x=>x.id===related.value);
   const next={...latest,matrixCategory:category.value,proceduralGoal:goal.value.trim(),matrixEvidenceId:selected?.id||'',matrixEvidenceTitle:selected?.title||'',targetImpact:target.value.trim(),measuredImpact:measured.value.trim()};
   const payload={...original.payload,actions:list.map((x,i)=>i===index?next:x)};
   const updated=await api('/rest/v1/hazm_community_state?id=eq.main&updated_at=eq.'+encodeURIComponent(original.updated_at)+'&select=id,updated_at',{
    method:'PATCH',headers:{Prefer:'return=representation'},
    body:JSON.stringify({payload,updated_by:user.id,updated_at:new Date().toISOString()})
   });
   if(!Array.isArray(updated)||updated.length!==1)throw Error('تغيرت السجلات في جهاز آخر؛ أعيدي الفتح قبل الحفظ.');
   localStorage.setItem(LOCAL,JSON.stringify(payload));
   row.children[2].textContent=next.proceduralGoal;
   row.children[2].classList.remove('m-empty');
   row.children[3].textContent=next.measuredImpact?'أثر متحقق: '+next.measuredImpact:(next.targetImpact?'أثر مستهدف: '+next.targetImpact:'لم يُربط أثر موثق');
   row.children[3].classList.toggle('m-empty',!next.measuredImpact&&!next.targetImpact);
   action.matrixCategory=next.matrixCategory;action.proceduralGoal=next.proceduralGoal;action.matrixEvidenceId=next.matrixEvidenceId;action.matrixEvidenceTitle=next.matrixEvidenceTitle;action.targetImpact=next.targetImpact;action.measuredImpact=next.measuredImpact;
   const evidence= row.querySelector('.matrix-evidence');
   if(evidence)evidence.textContent=next.matrixEvidenceTitle||'';
   cover.remove();
   alert('تم حفظ الترابط في السجل السحابي بنجاح.');
  }catch(err){alert('تعذر حفظ الترابط: '+err.message);}
  finally{busy=false;save.disabled=false;}
 };
}
async function mount(host){
 if(host.dataset.adminMatrixEditor)return;
 host.dataset.adminMatrixEditor='loading';
 let note=host.querySelector('.matrix-admin-note');
 if(!note){note=el('div','جارٍ التحقق من صلاحية تعديل الترابط…','matrix-admin-note');host.querySelector('.m-card')?.after(note);}
 const valid=await authorized();
 if(!host.isConnected)return;
 if(!valid){note.textContent='🔒 تحرير الترابط خاص بالإدارة. سجلي الدخول السحابي من «نظرة عامة»، ثم أعيدي فتح المصفوفة.';host.dataset.adminMatrixEditor='auth';host.dataset.authToken=token();return;}
 await choices();
 const table=host.querySelector('tbody');
 if(!table){note.textContent='جارٍ تحميل سجلات الترابط…';host.dataset.adminMatrixEditor='retry';return;}
 const rows=[...table.querySelectorAll('tr')];
 rows.forEach((row,i)=>{
  if(row.children.length!==4)return;
  const btn=el('button','✏️ تحرير الترابط','matrix-edit');
  const title=row.children[1].firstChild?.textContent||'';
  const action={title};
  const rgoal=row.children[2].textContent.trim();
  if(rgoal!=='لم يُحدد في السجل')action.proceduralGoal=rgoal;
  const effect=row.children[3].textContent.trim();
  if(effect.startsWith('أثر متحقق: '))action.measuredImpact=effect.slice(12);
  else if(effect.startsWith('أثر مستهدف: '))action.targetImpact=effect.slice(12);
  btn.onclick=async()=>{
   btn.disabled=true;
   try{
    if(!await authorized())throw Error('سجلي الدخول إلى الإدارة السحابية أولًا.');
    const current=await api('/rest/v1/hazm_community_state?select=payload&id=eq.main');
    const latest=current?.[0]?.payload?.actions?.[i];
    if(!latest||typeof latest!=='object')throw Error('تعذر قراءة الإجراء من السحابة.');
    const originalTitle=String(latest.title||latest.name||latest.action||latest.activity||'');
    if(originalTitle!==title)throw Error('تغير ترتيب الإجراءات؛ أعيدي فتح المصفوفة.');
    showForm(i,{...latest},row);
   }catch(e){alert('تعذر فتح التحرير: '+e.message)}
   finally{btn.disabled=false}
  };
  const badge=el('div','','matrix-evidence');badge.style.cssText='font-size:12px;color:#167a76';
  row.children[1].append(document.createElement('br'),btn,badge);
 });
 note.textContent='✅ وضع الإدارة: يمكنك تحرير ربط كل إجراء وحفظه في السجل السحابي. لا يتغير نص الإجراء الأصلي.';
 host.dataset.adminMatrixEditor='ready';
}
setInterval(()=>{
 const host=document.getElementById('hazmCommunityLiveMatrix');
 if(host && host.querySelector('tbody')){
  const state=host.dataset.adminMatrixEditor||'';
  if(state===''||state==='retry'||(state==='auth'&&host.dataset.authToken!==token()))mount(host);
 }
},900);
})();