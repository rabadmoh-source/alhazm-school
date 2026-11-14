/* Current, read-only relationship matrix inside the existing community window. */
(() => {
  'use strict';
  const ROOT = 'https://fmmilquujleokfxcbnas.supabase.co/rest/v1/';
  const KEY = 'sb_publishable_O_JqIM-VqzdGgU8VTvhRHQ_eQ9eTH5R';
  const visitor = /(?:^|\/)visitor\.html$/i.test(location.pathname);
  const suffix = visitor ? '?visitor=1' : '';
  const targetRoot = visitor ? './visitor.html?hazmService=family' : './index.html?hazmService=family';
  const counts = ['actions','meetings','works','initiatives','partnerships','impacts'];
  let currentRequest = 0;
  const css = document.createElement('style');
  css.textContent = `
    #hazmCommunityLiveMatrix{direction:rtl;flex:1 1 0;min-width:0;overflow:auto;background:#f7f5fa;padding:24px;color:#302942;font:15px/1.8 Tahoma,Arial,sans-serif}
    #hazmCommunityLiveMatrix .m-card{background:white;border:1px solid #e4ddec;border-radius:15px;padding:21px;margin-bottom:16px}
    #hazmCommunityLiveMatrix h2{margin:0;color:#493563;font-size:23px}
    #hazmCommunityLiveMatrix p{margin:5px 0 16px;color:#695f75}
    #hazmCommunityLiveMatrix .m-back,#hazmCommunityLiveMatrix .m-link{display:inline-block;background:#70558d;color:white;text-decoration:none;border:0;border-radius:10px;padding:9px 14px;font:inherit;cursor:pointer;margin:5px 0}
    #hazmCommunityLiveMatrix table{border-collapse:collapse;width:100%;min-width:570px;text-align:right}
    #hazmCommunityLiveMatrix th,#hazmCommunityLiveMatrix td{padding:12px;border-bottom:1px solid #e8e2ee;vertical-align:middle}
    #hazmCommunityLiveMatrix th{background:#f2ecf7;color:#493563}
    #hazmCommunityLiveMatrix tr:nth-child(even){background:#fbf9fc}
    #hazmCommunityLiveMatrix .m-link{padding:5px 10px;background:#158f8c;font-size:13px}
    #hazmCommunityLiveMatrix .m-note{background:#eaf7f4;padding:14px;border-radius:12px;color:#246a69}
    #hazmCommunityLiveMatrix .m-goal{border-right:5px solid #168f8b;background:#eef9f7}
    #hazmCommunityLiveMatrix .m-goal strong{color:#28536a;font-size:17px}
    #hazmCommunityLiveMatrix .m-muted{color:#786b82;font-size:13px}
    #hazmCommunityLiveMatrix .m-tags{display:flex;flex-wrap:wrap;gap:8px;margin:12px 0}
    #hazmCommunityLiveMatrix .m-tag{background:#eee6f5;color:#53396b;padding:6px 11px;border-radius:12px}
    #hazmCommunityLiveMatrix .m-empty{color:#8b5b33;background:#fff5e9;border-radius:8px;padding:4px 8px}
    @media(max-width:680px){#hazmCommunityLiveMatrix{padding:10px}#hazmCommunityLiveMatrix .m-card{padding:12px}#hazmCommunityLiveMatrix table{min-width:500px}}
  `;
  document.head.append(css);
  function node(tag,text,cls) {
    const e=document.createElement(tag);
    if(text!==undefined)e.textContent=text;
    if(cls)e.className=cls;
    return e;
  }
  async function read(table,query) {
    const response=await fetch(ROOT+table+'?'+query,{headers:{apikey:KEY,Authorization:'Bearer '+KEY}});
    if(!response.ok)throw Error('تعذر تحميل بيانات المصفوفة ('+response.status+')');
    return response.json();
  }
  async function collect(section) {
    const columns=await read('hazm_board_columns','select=id&section=eq.'+section+'&published=eq.true');
    const ids=columns.map(x=>x.id);
    if(!ids.length)return {columns:0,posts:0,files:0};
    const posts=await read('hazm_board_posts','select=id&published=eq.true&column_id=in.('+ids.join(',')+')');
    const postIds=posts.map(x=>x.id);
    const attachments=postIds.length?await read('hazm_board_attachments','select=id&post_id=in.('+postIds.join(',')+')'):[];
    return {columns:columns.length,posts:posts.length,files:attachments.length};
  }
  function link(text,href) {
    const a=node('a',text,'m-link');a.href=href;return a;
  }
  // No inferred relationship is represented as an approved school link.
  function field(record, keys) {
    if (typeof record === 'string') return keys.includes('title') ? record : '';
    if (!record || typeof record !== 'object') return '';
    for (const key of keys) {
      const value = record[key];
      if (typeof value === 'string' && value.trim()) return value.trim();
      if (typeof value === 'number') return String(value);
    }
    return '';
  }
  function display(record, keys, fallback) {
    return field(record,keys) || fallback;
  }
  function box(host, title, description) {
    const card=node('section',undefined,'m-card');
    card.append(node('h3',title));
    if(description)card.append(node('p',description));
    host.append(card);
    return card;
  }
  function summary(host, values) {
    const area=node('div',undefined,'m-tags');
    for (const [title,value] of values)area.append(node('span',title+': '+value,'m-tag'));
    host.append(area);
  }
  async function fill(host,requestId) {
    const status=node('div','جارٍ قراءة الإجراءات والأدلة المنشورة…','m-note');
    host.append(status);
    try {
      const [partnerships,initiatives,publicRows]=await Promise.all([
        collect('community_partnerships'),collect('community_initiatives'),
        read('hazm_community_public','select=payload&id=eq.main')
      ]);
      if(requestId!==currentRequest||!host.isConnected)return;
      status.remove();
      const data=publicRows?.[0]?.payload;
      if(!data || !Array.isArray(data.actions)) {
        host.append(node('div','لا تتوفر حاليًا نسخة منشورة من الإجراءات لعرض الترابط. لم تُنشأ علاقات افتراضية ولم تتغير السجلات.','m-note'));
        return;
      }
      const goal=node('section',undefined,'m-card m-goal');
      goal.append(node('strong','الهدف الاستراتيجي المعتمد للشراكة المجتمعية'));
      goal.append(node('p','سيتواصل 85% من أولياء الأمور وكذلك مؤسسات المجتمع المحلي مع المدرسة.'));
      goal.append(node('p','مسار الترابط: الهدف الاستراتيجي ← الأهداف الإجرائية ← إجراءات وأنشطة المجلس والشراكات ← الأدلة ← الأثر على تعلم الطلبة.','m-muted'));
      host.append(goal);
      const actions=data.actions||[], meetings=data.meetings||[], works=data.works||[],
        localInitiatives=data.initiatives||[], localPartnerships=data.partnerships||[], impacts=data.impacts||[];
      summary(host,[['الإجراءات',actions.length],['الاجتماعات',meetings.length],['الأعمال الموثقة',works.length],
        ['المبادرات المسجلة',localInitiatives.length],['الشراكات المسجلة',localPartnerships.length],
        ['سجلات الأثر',impacts.length]]);
      const card=box(host,'الإجراءات المرتبطة بخطة التواصل والشراكة',
        'تعرض الصفوف الإجراءات المحفوظة فعليًا. أي هدف إجرائي أو أثر لا تسميه البيانات صراحةً يظهر بأنه غير محدد، ولا يُعتمد تلقائيًا.');
      const wrap=node('div');wrap.style.overflowX='auto';
      const table=node('table'),thead=node('thead'),header=node('tr');
      for(const h of ['م','الإجراء الوارد في السجل','الهدف الإجرائي المثبت','الأثر المرتبط المثبت'])header.append(node('th',h));
      thead.append(header);table.append(thead);
      const tbody=node('tbody');
      const actionKeys=['title','name','action','activity','text','description','details','procedure','النشاط','الإجراء','اسم الإجراء'];
      const goalKeys=['proceduralGoal','procedural_goal','objective','goal','target','الهدف الإجرائي','الهدف'];
      const effectKeys=['measuredImpact','measured_impact','impact','effect','outcome','الأثر','أثر'];
      for(let i=0;i<actions.length;i++) {
        const item=actions[i],tr=node('tr');
        tr.append(node('td',String(i+1)));
        tr.append(node('td',display(item,actionKeys,'إجراء محفوظ رقم '+(i+1))));
        const goalText=field(item,goalKeys),effectText=field(item,effectKeys);
        tr.append(node('td',goalText||'لم يُحدد في السجل',goalText?'':'m-empty'));
        tr.append(node('td',effectText||'لم يُربط أثر موثق',effectText?'':'m-empty'));
        tbody.append(tr);
      }
      if(!actions.length){const tr=node('tr'),td=node('td','لا توجد إجراءات منشورة حاليًا');td.colSpan=4;tr.append(td);tbody.append(tr);}
      table.append(tbody);wrap.append(table);card.append(wrap);
      const evidence=box(host,'الأنشطة والأدلة الداعمة',
        'هذه مصادر توثيق مرتبطة بمجال الشراكة. لا تُنسب أي مبادرة أو مرفق إلى إجراء بعينه إلا إذا نص سجلها على ذلك.');
      summary(evidence,[['أعمدة الشراكات المنشورة',partnerships.columns],
        ['منشورات الشراكات',partnerships.posts],['أدلتها المرفقة',partnerships.files],
        ['أعمدة المبادرات المنشورة',initiatives.columns],['منشورات المبادرات',initiatives.posts],
        ['أدلتها المرفقة',initiatives.files]]);
      const links=node('div',undefined,'m-tags');
      links.append(link('عرض الشراكات المجتمعية','./community-partnerships-board.html'+suffix),
        link('عرض المبادرات المجتمعية','./community-initiatives-board.html'+suffix),
        link('عرض الأثر على تعلم الطلبة','./community-impact.html'+suffix),
        link('بادليت أولياء الأمور','./parents-official-padlet.html'+suffix));
      evidence.append(links);
      const impact=box(host,'قياس الأثر على تعلم الطلبة',
        'القياسات المعروضة في صفحة الأثر تُقرأ من المنشورات الموثقة. لا يُعتبر وجود مبادرة أو شراكة دليلًا بحد ذاته على تحقق أثر تعليمي.');
      summary(impact,[['سجلات الأثر في الخطة',impacts.length]]);
      impact.append(link('فتح بطاقات الأثر والأدلة','./community-impact.html'+suffix));
      host.append(node('p','تعتمد المصفوفة على السجلات المنشورة عند فتحها. الروابط الاستراتيجية التفصيلية التي لم تعتمدها المدرسة لا تُنشأ تلقائيًا؛ كما لا تُجمع السجلات القديمة مع منشورات اللوحات باعتبارها سجلات مستقلة دون تحقق.','m-note'));
    } catch(e) {
      if(requestId===currentRequest)status.textContent='تعذر تحميل بيانات الترابط حاليًا: '+e.message+'؛ لم يُحذف أو يُعدل أي سجل.';
    }
  }
  function close() {
    currentRequest++;
    document.getElementById('hazmCommunityLiveMatrix')?.remove();
    const frame=document.getElementById('serviceFrame');
    if(frame)frame.style.display='';
    document.querySelector('#hazmPdSidePanel [data-tab="matrix"]')?.classList.remove('active');
  }
  function show() {
    const side=document.getElementById('hazmPdSidePanel');
    const frame=document.getElementById('serviceFrame');
    if(!side||!frame)return;
    close();
    const requestId=++currentRequest;
    frame.style.display='none';
    const host=node('section',undefined);host.id='hazmCommunityLiveMatrix';
    const parent=frame.parentNode;parent.append(host);
    const card=node('div',undefined,'m-card');
    const back=node('button','↩ العودة إلى التواصل والشراكة المجتمعية','m-back');
    back.type='button';back.onclick=()=>{close();side.querySelector('[data-tab="overview"]')?.click()};
    card.append(back,node('h2','مصفوفة الترابط'),node('p','الترابط الاستراتيجي بين الهدف والإجراءات والأنشطة والأدلة والأثر، وفق السجلات المنشورة دون افتراض علاقات غير معتمدة.'));
    host.append(card);
    side.querySelector('[data-tab="matrix"]')?.classList.add('active');
    fill(host,requestId);
  }
  document.addEventListener('click',e=>{
    const matrix=e.target.closest('#hazmPdSidePanel [data-tab="matrix"]');
    if(matrix){e.preventDefault();e.stopImmediatePropagation();show();return}
    if(e.target.closest('#hazmPdSidePanel [data-tab="overview"]'))close();
  },true);
})();
