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
  async function fill(host,requestId) {
    const status=node('div','جارٍ قراءة بيانات الشراكات والمبادرات المنشورة…','m-note');
    host.append(status);
    try {
      const [partnerships,initiatives,legacy]=await Promise.all([
        collect('community_partnerships'),collect('community_initiatives'),
        read('hazm_community_public','select=payload&id=eq.main')
      ]);
      if(requestId!==currentRequest||!host.isConnected)return;
      status.remove();
      const legacyCount=counts.reduce((n,k)=>n+(legacy?.[0]?.payload?.[k]?.length||0),0);
      const wrapper=node('div');wrapper.style.overflowX='auto';
      const table=node('table');
      const head=node('thead'),headRow=node('tr');
      for(const label of ['النافذة المعتمدة','الترابط مع التوثيق','البيانات الحالية','الانتقال'])headRow.append(node('th',label));
      head.append(headRow);table.append(head);
      const body=node('tbody');
      const rows=[
        ['نظرة عامة','سجلات المجلس والشراكة المحفوظة مركزيًا',legacyCount+' سجلًا',targetRoot],
        ['الشراكات المجتمعية','أعمدة التوثيق ومنشوراتها وأدلتها',partnerships.columns+' أعمدة · '+partnerships.posts+' منشورات · '+partnerships.files+' مرفقات','./community-partnerships-board.html'+suffix],
        ['المبادرات المجتمعية','المبادرات المنشورة والأدلة الداعمة',initiatives.columns+' أعمدة · '+initiatives.posts+' منشورات · '+initiatives.files+' مرفقات','./community-initiatives-board.html'+suffix],
        ['الأثر على تعلم الطلبة','يُجمع تلقائيًا من توثيق الشراكات والمبادرات','مرتبط بـ '+(partnerships.columns+initiatives.columns)+' أعمدة منشورة','./community-impact.html'+suffix],
        ['بادليت أولياء الأمور','لوحة المشاركات والتواصل مع أولياء الأمور','لوحة Padlet مستقلة','./parents-official-padlet.html'+suffix]
      ];
      for(const [title,relation,number,href] of rows){
        const row=node('tr');row.append(node('td',title),node('td',relation),node('td',number));
        const action=node('td');action.append(link('فتح النافذة ←',href));row.append(action);body.append(row);
      }
      table.append(body);wrapper.append(table);host.append(wrapper);
      host.append(node('p','تُقرأ الأعداد من السجلات المنشورة في السحابة عند فتح المصفوفة. العدد 46 يخص سجلات نظرة عامة القديمة، ولا يُضاف إلى منشورات اللوحات لتجنب التكرار.','m-note'));
    } catch(e) {
      if(requestId===currentRequest)status.textContent='لم تكتمل قراءة المصفوفة السحابية: '+e.message;
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
    card.append(back,node('h2','مصفوفة الترابط'),node('p','الترابط الفعلي بين نوافذ التواصل والشراكة المجتمعية ومصادر التوثيق والأدلة المنشورة.'));
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
