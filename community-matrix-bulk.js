/* Bulk-reviewed suggested strategic relationships: administration only. */
(()=>{
'use strict';
if(/\/visitor\.html$/i.test(location.pathname))return;
const ROOT='https://fmmilquujleokfxcbnas.supabase.co';
const KEY='sb_publishable_O_JqIM-VqzdGgU8VTvhRHQ_eQ9eTH5R';
const LOCAL='alhazm_community_v1';
const RULES=[
 [/استقبال.*الأول|طريقتي نحو|الاستعداد للدراسة|النجاح/u,'تعزيز تكيف الطلبة وتهيئتهم للتعلم','تعزيز استعداد الطلبة وانخراطهم الإيجابي في الحياة المدرسية.'],
 [/قراءة|المكتبة|مصادر التعلم|اللغة العربية|أقرأ لأرتقي/u,'تعزيز المهارات الأساسية والتحصيل الدراسي','تنمية مهارات القراءة واللغة لدى الطلبة وزيادة مشاركتهم في أنشطتها.'],
 [/أسرتي|أسرة|بيتي|منزلية|أولياء/u,'تفعيل الشراكة الأسرية في دعم تعلم الطلبة','تعزيز مشاركة الأسرة في متابعة تعلم الأبناء ودعم تقدمهم الدراسي.'],
 [/هوية|تراث|وطن|المرأة العمانية|القيم|قيمنا|قيمي|الثقافة/u,'تعزيز القيم والمواطنة والهوية العُمانية','تعزيز تمثل الطلبة للقيم الإيجابية والاعتزاز بالهوية العُمانية.'],
 [/صحة|صحتي|سمنة|سرطان|تغذية|نوم|التوحد/u,'تعزيز الوعي الصحي والاجتماعي','رفع وعي الطلبة بالممارسات الصحية والتعامل الإيجابي مع التنوع.'],
 [/مرورية|السلامة|استخدامي|الأجهزة/u,'تعزيز السلوكيات الآمنة والمسؤولة','تنمية الالتزام بممارسات السلامة والاستخدام الآمن للأجهزة.'],
 [/ابتكار|مشروع|التدوير|رسم|أفكارنا/u,'تنمية الإبداع والموهبة لدى الطلبة','تعزيز التفكير الإبداعي والمشاركة في الأنشطة الابتكارية.'],
 [/بيئة|الماء|ساعة الأرض/u,'تعزيز القيم والمواطنة والهوية العُمانية','تنمية الوعي البيئي وترشيد الموارد لدى الطلبة.'],
 [/الصدقة|السلة الرمضانية|اليتيم|كسوة|القرآن/u,'تعزيز القيم والمواطنة والهوية العُمانية','تعزيز قيم التكافل والتطوع والمشاركة في الأعمال المجتمعية.'],
 [/تقرير|تكريم المجلس|منجزات المجلس/u,'تفعيل الشراكة الأسرية والمجتمعية','تعزيز توثيق أعمال المجلس وتقويم فاعلية مشاركته في دعم المدرسة.']
];
const CATEGORIES=['التكافل المجتمعي','التوعية','دعم التعلم','التوثيق والمتابعة'];
function suggestCategory(title){
 if(/تقرير|توثيق|منجزات المجلس|تكريم المجلس|متابعة المجلس/u.test(title))return 'التوثيق والمتابعة';
 if(/السلة الرمضانية|كسوة|اليتيم|الصدقة|تطوع/u.test(title))return 'التكافل المجتمعي';
 if(/قراءة|اللغة العربية|المكتبة|مصادر التعلم|التفوق|النجاح|الدراسة|الصف الأول|الابتكار|مسابقة|القرآن/u.test(title))return 'دعم التعلم';
 if(/توعية|صحة|الهوية|القيم|قيمنا|قيمي|ثقافة|المرورية|السلامة|الماء|البيئة|الأرض|السمنة|السرطان|التوحد|الأجهزة|التدوير/u.test(title))return 'التوعية';
 return '';
}
function suggest(text){
 const match=RULES.find(([re])=>re.test(text));
 return match?[match[1],match[2]]:['تفعيل الشراكة الأسرية والمجتمعية','تعزيز مشاركة الأسرة والمجتمع في دعم الأنشطة المدرسية.'];
}
const css=document.createElement('style');css.textContent=`
#hazmCommunityLiveMatrix .bulk-suggest{margin:7px 8px;background:#138d89;color:#fff;border:none;border-radius:11px;padding:10px 16px;cursor:pointer;font:700 14px Tahoma,Arial}
.hazm-bulk-overlay{position:fixed;inset:0;z-index:2147483050;background:#1d1637c9;display:flex;justify-content:center;align-items:center;padding:12px;direction:rtl}
.hazm-bulk-box{background:#faf9fd;color:#322443;border-radius:17px;width:min(1250px,100%);max-height:94vh;display:flex;flex-direction:column;padding:18px;font:14px/1.7 Tahoma,Arial}
.hazm-bulk-box h2{margin:0 0 7px;color:#654887}.hazm-bulk-box p{margin:5px 0 12px}.hazm-bulk-scroll{overflow:auto;border:1px solid #d7cde1;border-radius:12px;flex:1}
.hazm-bulk-box table{border-collapse:collapse;width:100%;min-width:910px}.hazm-bulk-box th,.hazm-bulk-box td{border-bottom:1px solid #e8e0ed;padding:9px;vertical-align:top}
.hazm-bulk-box th{position:sticky;top:0;background:#ebe3f3;z-index:2}.hazm-bulk-box tr:nth-child(even){background:#f7f3fa}
.hazm-bulk-box textarea,.hazm-bulk-box select{width:100%;box-sizing:border-box;border:1px solid #d1c2dd;border-radius:8px;padding:8px;font:inherit;background:#fff;min-height:63px}
.hazm-bulk-box select{min-height:39px}.hazm-bulk-controls{display:flex;flex-wrap:wrap;gap:8px;justify-content:flex-end;margin-top:12px}
.hazm-bulk-controls button{background:#73558d;color:#fff;border:0;border-radius:9px;padding:9px 16px;cursor:pointer;font:inherit}
.hazm-bulk-controls .secondary{background:#ebe5ef;color:#49385c}.hazm-bulk-caption{color:#98621e;font-size:12px}
@media(max-width:650px){.hazm-bulk-box{padding:10px}.hazm-bulk-box h2{font-size:19px}}
`;document.head.append(css);
const el=(tag,text,cls)=>{const x=document.createElement(tag);if(text!==undefined)x.textContent=text;if(cls)x.className=cls;return x;};
let session='',user=null,dialogBusy=false;
async function call(path,options={}){
 const r=await fetch(ROOT+path,{...options,headers:{apikey:KEY,Authorization:'Bearer '+(session||KEY),...(options.body?{'Content-Type':'application/json'}:{}),...(options.headers||{})}});
 const raw=await r.text();let out;try{out=raw?JSON.parse(raw):null}catch{out=raw}
 if(!r.ok)throw Error(out?.message||out?.error_description||out?.error||'HTTP '+r.status);
 return out;
}
async function verify(){
 session=sessionStorage.getItem('hazm_board_access')||'';
 if(!session)throw Error('سجلي الدخول إلى الإدارة السحابية أولًا.');
 user=await call('/auth/v1/user');
 if(!user?.id)throw Error('انتهت جلسة الإدارة.');
 const allowed=await call('/rest/v1/riwaq_admins?select=user_id&user_id=eq.'+encodeURIComponent(user.id));
 if(!allowed?.length)throw Error('هذا الحساب غير مخوّل بتحرير الترابط.');
}
async function evidenceOptions(){
 const options=[];
 for(const section of ['community_partnerships','community_initiatives']){
  const label=section==='community_partnerships'?'شراكة':'مبادرة';
  try{
   const rows=await call('/rest/v1/hazm_board_columns?select=id,title&section=eq.'+section+'&published=eq.true');
   rows.forEach(x=>options.push({id:String(x.id),title:label+' | '+(x.title||'دون عنوان'),rawTitle:x.title||''}));
  }catch{}
 }
 return options;
}
async function openBulk(host){
 if(dialogBusy)return;dialogBusy=true;
 try{
  await verify();
  const states=await call('/rest/v1/hazm_community_state?select=payload,updated_at&id=eq.main');
  const record=states?.[0],actions=record?.payload?.actions;
  if(!Array.isArray(actions)||actions.length!==37)throw Error('عدد الإجراءات لا يطابق السجل المعتمد؛ لن ننفذ حفظًا جماعيًا.');
  const evidences=await evidenceOptions();
  const cover=el('div',undefined,'hazm-bulk-overlay'),box=el('div',undefined,'hazm-bulk-box');
  box.append(el('h2','✨ مراجعة الترابط المقترح للإجراءات الـ37'));
  box.append(el('p','الاقتراحات للمراجعة فقط. يمكنك تعديلها أو إلغاء تحديد أي صف؛ لن يُحفظ شيء حتى تضغطي «اعتماد المحدد». ولا يُضاف أثر متحقق تلقائيًا.'));
  const scroll=el('div',undefined,'hazm-bulk-scroll'),table=el('table'),thead=el('thead'),hr=el('tr');
  for(const t of ['اعتماد','الإجراء','تصنيف الإجراء','الهدف الإجرائي المقترح','الأثر المستهدف المقترح','الدليل المرتبط (اختياري)'])hr.append(el('th',t));
  thead.append(hr);table.append(thead);
  const tbody=el('tbody'),entries=[];
  actions.forEach((a,i)=>{
   const title=String(a?.title||a?.name||a?.action||a?.activity||'إجراء رقم '+(i+1));
   const [sGoal,sImpact]=suggest(title);
   const tr=el('tr'),check=el('input');check.type='checkbox';
   check.checked=!a.proceduralGoal||!a.targetImpact;
   const cell0=el('td');cell0.append(check,el('small',String(i+1)));tr.append(cell0);
   tr.append(el('td',title));
   const category=el('select'),goal=el('textarea'),impact=el('textarea'),related=el('select');
   category.append(new Option('اختاري التصنيف',''));
   CATEGORIES.forEach(x=>category.append(new Option(x,x)));
   category.value=a.matrixCategory||suggestCategory(title);
   goal.value=a.proceduralGoal||sGoal;impact.value=a.targetImpact||sImpact;
   related.append(new Option('لا يوجد ربط معتمد',''));
   evidences.forEach(e=>related.append(new Option(e.title,e.id)));
   related.value=a.matrixEvidenceId||'';
   const exact=evidences.filter(e=>e.rawTitle&&title.includes(e.rawTitle));
   if(!related.value&&exact.length===1)related.value=exact[0].id;
   for(const input of [category,goal,impact,related]){const td=el('td');td.append(input);tr.append(td);}
   tbody.append(tr);entries.push({i,title,check,category,goal,impact,related});
  });
  table.append(tbody);scroll.append(table);box.append(scroll);
  const foot=el('div',undefined,'hazm-bulk-controls'),cancel=el('button','إلغاء','secondary'),toggle=el('button','تحديد جميع الصفوف','secondary'),save=el('button','اعتماد المحدد وحفظه');
  cancel.onclick=()=>cover.remove();
  toggle.onclick=()=>{entries.forEach(x=>x.check.checked=true);};
  save.onclick=async()=>{
   const selected=entries.filter(x=>x.check.checked);
   if(!selected.length){alert('حددي إجراءً واحدًا على الأقل للاعتماد.');return;}
   if(selected.some(x=>!x.goal.value.trim()||!x.impact.value.trim())){alert('راجعي الهدف والأثر المستهدف في الصفوف المحددة.');return;}
   if(!confirm('سيُحفظ ترابط '+selected.length+' إجراءً بعد مراجعتك، ويظهر المحتوى المعتمد للزوار تلقائيًا. هل تعتمدين؟'))return;
   save.disabled=true;
   try{
    await verify();
    const latestRows=await call('/rest/v1/hazm_community_state?select=payload,updated_at&id=eq.main');
    const latest=latestRows?.[0],list=latest?.payload?.actions;
    if(!Array.isArray(list)||list.length!==37)throw Error('تغير السجل؛ أعيدي فتح المراجعة.');
    for(const entry of selected){
     const src=list[entry.i];const sourceTitle=String(src?.title||src?.name||src?.action||src?.activity||'إجراء رقم '+(entry.i+1));
     if(sourceTitle!==entry.title)throw Error('تغير ترتيب بعض الإجراءات؛ لم يُحفظ شيء.');
    }
    const selectedMap=new Map(selected.map(x=>[x.i,x]));
    const nextList=list.map((a,i)=>{
     const entry=selectedMap.get(i);if(!entry)return a;
     const evidence=evidences.find(e=>e.id===entry.related.value);
     return {...a,matrixCategory:entry.category.value,proceduralGoal:entry.goal.value.trim(),targetImpact:entry.impact.value.trim(),
      matrixEvidenceId:evidence?.id||'',matrixEvidenceTitle:evidence?.title||''};
    });
    const payload={...latest.payload,actions:nextList};
    const result=await call('/rest/v1/hazm_community_state?id=eq.main&updated_at=eq.'+encodeURIComponent(latest.updated_at)+'&select=id',{
     method:'PATCH',headers:{Prefer:'return=representation'},body:JSON.stringify({payload,updated_by:user.id,updated_at:new Date().toISOString()})
    });
    if(!Array.isArray(result)||result.length!==1)throw Error('السجل تغير خلال الحفظ؛ أعيدي فتح المراجعة.');
    try{localStorage.setItem(LOCAL,JSON.stringify(payload))}catch{}
    const rows=[...host.querySelectorAll('tbody tr')];
    selected.forEach(x=>{const row=rows[x.i];if(!row)return;row.children[2].textContent=x.goal.value.trim();row.children[2].classList.remove('m-empty');row.children[3].textContent=nextList[x.i].measuredImpact?'أثر متحقق: '+nextList[x.i].measuredImpact:'أثر مستهدف: '+x.impact.value.trim();row.children[3].classList.remove('m-empty')});
    cover.remove();alert('✅ اعتُمد وحُفظ ترابط '+selected.length+' إجراءً. سيظهر للزوار من السجل المنشور.');
   }catch(e){alert('لم يُحفظ الترابط الجماعي: '+e.message)}
   finally{save.disabled=false;}
  };
  foot.append(cancel,toggle,save);box.append(foot);cover.append(box);document.body.append(cover);
 }catch(e){alert('تعذر إعداد المراجعة: '+e.message)}
 finally{dialogBusy=false;}
}
setInterval(()=>{
 const host=document.getElementById('hazmCommunityLiveMatrix');
 if(!host||host.querySelector('.bulk-suggest')||!host.querySelector('tbody'))return;
 const card=host.querySelector('.m-card');if(!card)return;
 const b=el('button','✨ إعداد الترابط المقترح للإجراءات الـ37','bulk-suggest');
 b.onclick=()=>openBulk(host);card.append(b);
},900);
})();