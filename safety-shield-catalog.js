(()=>{'use strict';
const ENDPOINT='https://fmmilquujleokfxcbnas.supabase.co/rest/v1/';
const APIKEY='sb_publishable_O_JqIM-VqzdGgU8VTvhRHQ_eQ9eTH5R';
const sections=[['safety_inspections','الجولات التفقدية','inspections'],['safety_guard','متابعة الحارس','guard'],['safety_evacuation','الإخلاء والطوارئ','evacuation'],['safety_awareness','التوعية والأنشطة','awareness']];
const q=async(table,params)=>{const response=await fetch(ENDPOINT+table+'?'+params,{headers:{apikey:APIKEY}});if(!response.ok)throw Error('تعذر تحميل السجلات ('+response.status+')');return response.json()};
const el=(tag,text,cls)=>{const x=document.createElement(tag);if(text!==undefined)x.textContent=text;if(cls)x.className=cls;return x};
const statusFor=(description,posts)=>{
 const text=[description||'',...posts.map(p=>p.body||'')].join('\n');
 if(/(?:الأثر\s+(?:المتحقق|الفعلي)\s*[:：]|نتائج\s+قياس\s+الأثر\s*[:：]|أثر متحقق موثق)/u.test(text))return ['متحقق','actual'];
 if(/الأثر\s+(?:المستهدف|المتوقع)\s*[:：]/u.test(text))return ['مستهدف','target'];
 return ['بانتظار التوثيق','pending'];
};
async function load(){
 const host=document.getElementById('hazmShieldCatalog');if(!host||host.dataset.loading==='1')return;
 host.dataset.loading='1';host.replaceChildren(el('p','جارٍ جمع البرامج والجولات من أقسام درع الحزم...','catalogMessage'));
 try{
  const collections=await Promise.all(sections.map(async([section,title,key])=>{
   const cols=await q('hazm_board_columns','select=id,title,description,created_at,position&section=eq.'+section+'&published=eq.true&order=position.asc,created_at.asc');
   return cols.map(c=>({...c,section,titleSection:title,key}));
  }));
  const rows=collections.flat();const posts=rows.length?await q('hazm_board_posts','select=column_id,title,body&column_id=in.('+rows.map(r=>r.id).join(',')+')&published=eq.true'):[];
  rows.forEach(r=>{r.status=statusFor(r.description,posts.filter(p=>p.column_id===r.id))});
  const wrapper=el('div',undefined,'catalogPanel'),head=el('div',undefined,'catalogHead');
  head.append(el('h2','📋 السجل الموحد لبرامج الأمن والسلامة'),el('p','جميع الجولات والبرامج المنشورة في درع الحزم، تُضاف تلقائيًا عند نشرها في أقسامها الأصلية.'));
  wrapper.append(head);
  const summary=el('div',undefined,'catalogSummary');
  for(const [label,count] of [['إجمالي السجلات',rows.length],...sections.map(s=>[s[1],rows.filter(r=>r.section===s[0]).length])]){const box=el('div',undefined,'catalogCounter');box.append(el('strong',String(count)),el('span',label));summary.append(box)}
  wrapper.append(summary);
  const filters=el('div',undefined,'catalogFilters'),search=el('input'),select=el('select');
  search.type='search';search.placeholder='🔎 ابحثي عن برنامج أو جولة';search.setAttribute('aria-label','البحث في السجلات');
  select.setAttribute('aria-label','تصفية حسب القسم');
  for(const [value,label] of [['','جميع الأقسام'],...sections.map(s=>[s[0],s[1]])]){const option=el('option',label);option.value=value;select.append(option)}
  filters.append(search,select);wrapper.append(filters);
  const tableWrap=el('div',undefined,'catalogTableWrap'),table=el('table',undefined,'catalogTable');
  const thead=el('thead'),headRow=el('tr');for(const title of ['م','البرنامج / الجولة','القسم','حالة الأثر','التوثيق'])headRow.append(el('th',title));thead.append(headRow);table.append(thead);
  const tbody=el('tbody');table.append(tbody);tableWrap.append(table);wrapper.append(tableWrap);
  const footer=el('p','ملاحظة: حالة «مستهدف» لا تعني أن النتيجة تحققت بالفعل. افتحي التوثيق للاطلاع على الأدلة.','catalogFoot');wrapper.append(footer);
  const draw=()=>{tbody.replaceChildren();const keyword=search.value.trim().toLocaleLowerCase('ar'),chosen=select.value;
   const filtered=rows.filter(r=>(!chosen||r.section===chosen)&&(!keyword||(r.title||'').toLocaleLowerCase('ar').includes(keyword)||r.titleSection.includes(keyword)));
   filtered.forEach((r,i)=>{const tr=el('tr');tr.append(el('td',String(i+1)),el('td',r.title||'دون عنوان'),el('td',r.titleSection));
    const status=el('span',r.status[0],'catalogBadge '+r.status[1]);tr.append(el('td'));tr.lastChild.append(status);
    const action=el('td'),a=el('a','فتح التوثيق ←','catalogLink');a.href='./safety-approved/safety-padlet-board.html?section='+encodeURIComponent(r.key)+(location.search.includes('visitor=1')||/safety-visitor\.html$/i.test(location.pathname)?'&visitor=1':'');action.append(a);tr.append(action);tbody.append(tr)});
   if(!filtered.length){const tr=el('tr'),td=el('td','لا توجد نتائج مطابقة.');td.colSpan=5;td.className='catalogEmpty';tr.append(td);tbody.append(tr)}
  };
  search.addEventListener('input',draw);select.addEventListener('change',draw);draw();host.replaceChildren(wrapper);
 }catch(err){host.replaceChildren(el('p','تعذر تحميل الجدول حاليًا. يمكنك استخدام القائمة الجانبية للوصول إلى التوثيق. '+err.message,'catalogMessage'))}
 finally{host.dataset.loading='0';host.dataset.loaded=String(Date.now())}
}
function check(){const h=document.getElementById('hazmShieldCatalog');if(h&&(!h.dataset.loaded||Date.now()-Number(h.dataset.loaded)>30000))load()}
document.addEventListener('DOMContentLoaded',()=>{const target=document.getElementById('mainContent')||document.getElementById('hazmShieldCatalog')?.parentElement;if(!target)return;new MutationObserver(check).observe(target,{childList:true});check();document.addEventListener('visibilitychange',()=>{if(!document.hidden)check()})});
})();