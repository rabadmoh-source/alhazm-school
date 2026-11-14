/* Shared read-only visitor view and controlled administrative follow-up. */
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const visitor = new URLSearchParams(location.search).get('visitor') === '1';
  const SUPABASE = 'https://fmmilquujleokfxcbnas.supabase.co';
  const KEY = 'sb_publishable_O_JqIM-VqzdGgU8VTvhRHQ_eQ9eTH5R';
  const SECTION = 'school_plan_2026';
  let token = visitor ? '' : (sessionStorage.getItem('hazm_board_access') || '');
  const labels = {
    pulse: ['💓 نبض الخطة المدرسية', 'متابعة شهرية للأثر المباشر، وقياس الأثر النهائي في موعده، وسجل تراكمي للتقدم.'],
    initiatives: ['🌱 المبادرات المضمنة', 'المبادرات المضمنة ضمن الخطة المدرسية ومتابعة تنفيذها وتوثيق أثرها.'],
    development: ['📚 برامج الإنماء المرتبطة', 'برامج التدريب والإنماء المهني المرتبطة بأهداف الخطة المدرسية.'],
    projects: ['🎯 المشاريع والفعاليات المرتبطة', 'المشاريع والفعاليات والبرامج الداعمة لتنفيذ الخطة المدرسية.'],
    impact: ['📊 قياس الأثر', 'سجل موحد لقياس أثر المبادرات والبرامج والمشاريع، مع فتح بطاقة كل بند.']
  };
  let source = null;
  let updates = new Map();
  let cloudRows = new Map();
  let tab = 'pulse';
  let pulseTab = 'monthly';
  let followMonth = '';
  let selected = null;
  let admin = false;
  let authenticatedUser = null;

  if (visitor) {
    $('backLink').href = './visitor.html';

    $('sourceNotice').textContent = 'نافذة الزائر: عرض واطلاع فقط. لا تتاح أدوات التعديل أو الحفظ.';
  }

  const esc = encodeURIComponent;
  function headers() {
    return {apikey: KEY, ...(token ? {Authorization: 'Bearer ' + token} : {})};
  }
  async function rest(path, options = {}) {
    const response = await fetch(SUPABASE + '/rest/v1/' + path, {
      ...options,
      headers: {...headers(), ...(options.headers || {})}
    });
    if (!response.ok) throw new Error('خطأ في الحفظ المركزي (' + response.status + ')');
    const body = await response.text();
    return body ? JSON.parse(body) : [];
  }
  async function verifyAdmin() {
    if (!token || visitor) return;
    try {
      const response = await fetch(SUPABASE + '/auth/v1/user', {headers: headers()});
      if (!response.ok) return;
      authenticatedUser = await response.json();
      const matching = await rest('riwaq_admins?select=user_id&user_id=eq.' + esc(authenticatedUser.id));
      admin = matching.length > 0;
    } catch (_) { admin = false; }
  }
  function status(message) { $('syncStatus').textContent = message; }
  function authControl() {
    if (visitor) return;
    let button = $('planAuth');
    if (!button) {
      button = document.createElement('button');
      button.id = 'planAuth'; button.className = 'button outline';
      $('syncStatus').after(button);
    }
    button.textContent = admin ? 'تسجيل خروج الإدارة' : 'دخول إدارة الحزم';
    button.onclick = admin ? () => {
      sessionStorage.removeItem('hazm_board_access');
      token = ''; admin = false; authenticatedUser = null;
      authControl(); render();
    } : login;
  }
  async function login() {
    const box = document.createElement('div'); box.className = 'overlay';
    const form = document.createElement('form'); form.className = 'dialog';
    const heading = document.createElement('h3'); heading.textContent = 'دخول إدارة الحزم';
    const email = document.createElement('input'); email.type = 'email'; email.required = true; email.autocomplete = 'username';
    const password = document.createElement('input'); password.type = 'password'; password.required = true; password.autocomplete = 'current-password';
    const emailLabel = document.createElement('label'); emailLabel.textContent = 'البريد الإلكتروني'; emailLabel.append(email);
    const passLabel = document.createElement('label'); passLabel.textContent = 'كلمة المرور'; passLabel.append(password);
    const actions = document.createElement('div'); actions.className = 'actions';
    const close = document.createElement('button'); close.type = 'button'; close.className = 'button outline'; close.textContent = 'إلغاء';
    close.onclick = () => box.remove();
    const enter = document.createElement('button'); enter.type = 'submit'; enter.className = 'button'; enter.textContent = 'دخول';
    actions.append(close, enter); form.append(heading, emailLabel, passLabel, actions); box.append(form); document.body.append(box);
    form.onsubmit = async event => {
      event.preventDefault(); enter.disabled = true;
      try {
        const response = await fetch(SUPABASE + '/auth/v1/token?grant_type=password', {
          method: 'POST', headers: {'apikey':KEY, 'Content-Type':'application/json'},
          body: JSON.stringify({email:email.value.trim(), password:password.value})
        });
        if (!response.ok) throw Error('تعذر التحقق من بيانات الدخول.');
        const session = await response.json();
        token = session.access_token;
        await verifyAdmin();
        if (!admin) throw Error('الحساب ليس ضمن حسابات إدارة الحزم المصرح لها.');
        sessionStorage.setItem('hazm_board_access',token);
        box.remove(); authControl(); await loadCloud(); render();
      } catch (error) {
        token = ''; admin = false; authenticatedUser = null;
        alert(error.message);
      } finally { enter.disabled = false; }
    };
    email.focus();
  }
  async function loadCloud() {
    const list = await rest('hazm_board_columns?select=id,source_local_id,description,created_by&section=eq.' + SECTION + '&published=eq.true&limit=1000');
    const next = new Map();
    const cloud = new Map();
    for (const row of list) {
      if (!row.source_local_id) continue;
      try {
        const value = JSON.parse(row.description || '{}');
        if (typeof value !== 'object' || value === null) continue;
        next.set(row.source_local_id, value);
        cloud.set(row.source_local_id, row);
      } catch (_) { /* Legacy board content is left untouched. */ }
    }
    updates = next;
    cloudRows = cloud;
    status('آخر تحديث: ' + new Intl.DateTimeFormat('ar-OM', {dateStyle:'short', timeStyle:'short'}).format(new Date()) + ' · البيانات المنشورة متاحة للزوار.');
  }
  function merged(row) {
    return {
      execution: row.previousStatus === 'تم التنفيذ' ? 'تم التنفيذ' : 'مخطط',
      impact: 'لم يحن موعد قياس الأثر',
      documentation: row.previousNotes || '',
      result: '', date: '', monthly: {}, final: null, frequency: null,
      ...updates.get(row.id)
    };
  }
  const schoolMonths = Array.from({length:9}, (_,i) => {
    const month = (8+i)%12+1;
    const year = i < 4 ? 2026 : 2027;
    return {key:year+'-'+String(month).padStart(2,'0'), index:i,
      name:new Intl.DateTimeFormat('ar-OM',{month:'long',year:'numeric',timeZone:'Asia/Muscat'}).format(new Date(Date.UTC(year,month-1,10)))};
  });
  function currentSchoolMonth() {
    const bits = new Intl.DateTimeFormat('en-US',{year:'numeric',month:'2-digit',timeZone:'Asia/Muscat'}).formatToParts(new Date());
    const y = bits.find(x=>x.type==='year')?.value, m=bits.find(x=>x.type==='month')?.value;
    return schoolMonths.find(x=>x.key===y+'-'+m)?.key || schoolMonths[0].key;
  }
  function frequency(row, data=merged(row)) {
    if (data.frequency === 'continuous' || data.frequency === 'once') return data.frequency;
    if ((row.months||[]).length > 1) return 'continuous';
    if (row.start && row.end) return (row.end.slice(0,7)>row.start.slice(0,7)) ? 'continuous' : 'once';
    return 'once';
  }
  function scheduled(row, month=followMonth) {
    const entry=schoolMonths.find(x=>x.key===month);
    if (!entry) return false;
    const once=frequency(row)==='once';
    if ((row.months||[]).length) return once ? entry.index===Math.max(...row.months) : row.months.includes(entry.index);
    if (row.start && row.end) return once ? month===row.end.slice(0,7) : month >= row.start.slice(0,7) && month <= row.end.slice(0,7);
    return false;
  }
  function lastScheduledMonth(row) {
    if ((row.months||[]).length) return schoolMonths[Math.max(...row.months)]?.key||null;
    return row.end?.slice(0,7)||null;
  }
  function isOverdue(row,month=followMonth) {
    const last=lastScheduledMonth(row);
    return Boolean(last && month>last && merged(row).execution!=='تم التنفيذ');
  }
  function monthHistory(data, month=followMonth) { return Array.isArray(data.monthly?.[month]) ? data.monthly[month] : []; }
  function latest(data, month=followMonth) { const records=monthHistory(data,month);return records[records.length-1]||null; }
  function dueRows() {
    const query=$('pulseSearch').value.trim().toLocaleLowerCase('ar'),filter=$('pulseFilter').value;
    return source.rows.filter(row=>{
      const data=merged(row),due=scheduled(row)||isOverdue(row)||monthHistory(data).length>0;
      return due && (!query||(row.title+' '+row.owner).toLocaleLowerCase('ar').includes(query)) &&
        (!filter||(filter==='unfollowed'?!latest(data):isOverdue(row)));
    });
  }
  function visibleRows() {
    const q = $('search').value.trim().toLocaleLowerCase('ar');
    const area = $('areaFilter').value;
    const state = $('statusFilter').value;
    return source.rows.filter(row =>
      (tab === 'impact' ? Boolean(row.category) : tab === 'pulse' ? true : row.category === tab) &&
      (!area || row.area === area) &&
      (!state || merged(row).execution === state) &&
      (!q || (row.title + ' ' + row.owner + ' ' + row.area).toLocaleLowerCase('ar').includes(q))
    );
  }
  function el(name, text, className) {
    const x = document.createElement(name);
    if (text != null) x.textContent = text;
    if (className) x.className = className;
    return x;
  }
  function publicOwner(owner) {
    if (!visitor) return owner || '—';
    const safeRoles = ['فريق التقويم الذاتي','فريق الإنماء المهني','مديرة المدرسة','مساعدة المديرة','الهيئة التدريسية','الهيئة الإدارية','معلمات المجال الأول'];
    return safeRoles.some(role => owner === role) ? owner : 'الجهة المنفذة';
  }
  function td(text, klass='') {return el('td',text,klass)}
  function actionCell(label,action) {
    const cell=el('td'), button=el('button',label,'button');
    button.type='button';button.addEventListener('click',action);cell.append(button);return cell;
  }
  function pulseTable(headers, rows) {
    const head=$('pulseHeaders'),body=$('pulseRows');head.replaceChildren();body.replaceChildren();
    const top=el('tr');for (const label of headers) top.append(el('th',label));head.append(top);
    if (!rows.length) {const tr=el('tr'),cell=td('لا توجد إجراءات مستحقة في هذا العرض.');cell.colSpan=headers.length;cell.className='empty';tr.append(cell);body.append(tr);return}
    for (const tr of rows) body.append(tr);
  }
  function pulseSummary(rows) {
    $('allCount').textContent=rows.length;
    $('doneCount').textContent=rows.filter(row=>merged(row).execution==='تم التنفيذ').length;
    $('pendingCount').textContent=rows.filter(row=>merged(row).execution!=='تم التنفيذ').length;
    $('impactCount').textContent=rows.filter(row=>Boolean(merged(row).final)).length;
  }
  function pulseRowsMonthly() {
    const records=dueRows();pulseSummary(records);
    $('followHint').textContent='المستحق هذا الشهر: '+records.length+' · تمت متابعته: '+records.filter(r=>latest(merged(r))).length;
    $('pulseHelp').textContent='تُتابع الإجراءات المستمرة كل شهر ضمن فترة تنفيذها، أما الإجراءات المحددة المدة فتظهر عند موعدها. لا يُعد غياب المتابعة دليلًا على عدم التنفيذ.';
    const rows=records.map(row=>{
      const data=merged(row),entry=latest(data),tr=el('tr');
      tr.append(td(row.title,'titlecell'),td(publicOwner(row.owner)),td(frequency(row,data)==='continuous'?'دوري':'محدد المدة'));
      tr.append(td(isOverdue(row)?'⚠️ متأخر حسب الموعد':data.execution));
      tr.append(td(entry?entry.assessment:'لم تُسجل متابعة','record-detail'));
      tr.append(actionCell(admin?'تسجيل متابعة':'عرض المتابعة',()=>openMonthly(row)));
      return tr;
    });
    pulseTable(['الإجراء','المنفذ','نوع الإجراء','حالة التنفيذ','متابعة الشهر','البطاقة'],rows);
  }
  function pulseRowsImmediate() {
    const records=source.rows.filter(row=>monthHistory(merged(row)).length);
    pulseSummary(records);$('followHint').textContent='أثر مباشر موثق: '+records.filter(r=>latest(merged(r))?.immediate).length;
    $('pulseHelp').textContent='الأثر المباشر ملاحظة موثقة أثناء التنفيذ؛ لا يُعد تلقائيًا تحققًا لمؤشر النجاح النهائي.';
    pulseTable(['الإجراء','المتابعة','الأثر المباشر الملحوظ','الإجراء التحسيني','التفاصيل'],records.map(row=>{
      const data=latest(merged(row)),tr=el('tr');
      tr.append(td(row.title,'titlecell'),td(data?.assessment||'—'),td(data?.immediate||'لم يُسجل أثر مباشر','record-detail'),td(data?.improvement||'—','record-detail'),actionCell('عرض السجل',()=>openMonthly(row)));
      return tr;
    }));
  }
  function pulseRowsFinal() {
    const records=source.rows;pulseSummary(records);
    $('followHint').textContent='بطاقات الأثر النهائي المكتملة: '+records.filter(r=>merged(r).final).length;
    $('pulseHelp').textContent='يُقاس الأثر النهائي عندما تتوافر بيانات قبلية وبعدية أو شواهد مناسبة، وليس بمجرد تنفيذ الإجراء.';
    pulseTable(['الإجراء','حالة التنفيذ','حالة قياس الأثر','النتيجة النهائية','البطاقة'],records.map(row=>{
      const data=merged(row),tr=el('tr');
      tr.append(td(row.title,'titlecell'),td(data.execution),td(data.final?'تم قياس الأثر':data.impact),td(data.final?.result||'لم يُقَس بعد','record-detail'),actionCell(admin?'قياس / تعديل':'عرض القياس',()=>openFinal(row)));
      return tr;
    }));
  }
  function pulseRowsReport() {
    const months=schoolMonths.filter(x=>x.key<=followMonth);
    const entries=months.map(month=>{
      const due=source.rows.filter(r=>scheduled(r,month.key));
      const followed=due.filter(r=>monthHistory(merged(r),month.key).length);
      const immediate=followed.filter(r=>latest(merged(r),month.key)?.immediate);
      return {month,due:due.length,followed:followed.length,immediate:immediate.length};
    });
    $('allCount').textContent=entries.reduce((s,x)=>s+x.due,0);
    $('doneCount').textContent=entries.reduce((s,x)=>s+x.followed,0);
    $('pendingCount').textContent=entries.reduce((s,x)=>s+x.due-x.followed,0);
    $('impactCount').textContent=source.rows.filter(r=>merged(r).final).length;
    $('followHint').textContent='متابعة تراكمية حتى '+(schoolMonths.find(x=>x.key===followMonth)?.name||'');
    $('pulseHelp').textContent='نسبة استكمال المتابعة = الإجراءات التي سُجلت لها متابعة شهرية ÷ الإجراءات المستحقة في الشهر × 100. لا تعني هذه النسبة تحقق الأثر.';
    pulseTable(['الشهر','الإجراءات المستحقة','تمت المتابعة','وثق الأثر المباشر','استكمال المتابعة'],entries.map(x=>{
      const tr=el('tr'),pct=x.due?Math.round(x.followed/x.due*100)+'٪':'—';
      tr.append(td(x.month.name),td(String(x.due)),td(String(x.followed)),td(String(x.immediate)),td(pct));return tr;
    }));
  }
  function renderPulse() {
    const headerNames=pulseTab==='report'?['استحقاقات المتابعة','متابعات مسجلة','متابعات ناقصة','قياسات أثر نهائية']:['إجراءات معروضة','تم التنفيذ','لم يكتمل التنفيذ','تم قياس الأثر النهائي'];
    ['allCount','doneCount','pendingCount','impactCount'].forEach((id,i)=>{$(id).parentElement.firstChild.textContent=headerNames[i]});
    document.querySelectorAll('[data-pulse]').forEach(button=>button.classList.toggle('active',button.dataset.pulse===pulseTab));
    $('followMonth').value=followMonth;
    if (pulseTab==='monthly') pulseRowsMonthly();
    else if (pulseTab==='immediate') pulseRowsImmediate();
    else if (pulseTab==='final') pulseRowsFinal();
    else pulseRowsReport();
  }
  function render() {
    const [heading, detail] = labels[tab];
    $('sectionTitle').textContent = heading;
    $('sectionDescription').textContent = detail;
    document.querySelectorAll('aside [data-tab]').forEach(button => button.classList.toggle('active', button.dataset.tab === tab));
    $('pulsePanel').classList.toggle('hidden',tab!=='pulse');
    $('catalogPanel').classList.toggle('hidden',tab==='pulse');
    if (tab==='pulse') {renderPulse();return}
    ['الإجمالي','تم التنفيذ','لم يكتمل التنفيذ','تم قياس الأثر'].forEach((name,i)=>{
      $(['allCount','doneCount','pendingCount','impactCount'][i]).parentElement.firstChild.textContent=name;
    });
    const records = visibleRows();
    $('allCount').textContent = records.length;
    $('doneCount').textContent = records.filter(row => merged(row).execution === 'تم التنفيذ').length;
    $('pendingCount').textContent = records.filter(row => merged(row).execution !== 'تم التنفيذ').length;
    $('impactCount').textContent = records.filter(row => merged(row).impact === 'تم قياس الأثر').length;
    const tbody = $('rows');
    tbody.replaceChildren();
    if (!records.length) {
      const tr = el('tr'), td = el('td', 'لا توجد بنود مطابقة للتصفية الحالية.', 'empty');
      td.colSpan = 5; tr.append(td); tbody.append(tr); return;
    }
    for (const row of records) {
      const state = merged(row), tr = el('tr');
      const title = el('td', null, 'titlecell');
      title.append(el('span', row.title));
      title.append(el('div', (row.area || '—') + ' · الهدف ' + (row.goal || 'غير محدد'), 'muted'));
      tr.append(title, el('td', publicOwner(row.owner)));
      const execution = el('td');
      execution.append(el('span', state.execution, state.execution === 'تم التنفيذ' ? 'badge good' : 'badge warning'));
      const impact = el('td');
      impact.append(el('span', state.impact, state.impact === 'تم قياس الأثر' ? 'badge good' : 'badge'));
      const follow = el('td');
      const button = el('button', admin ? 'فتح / تحديث البطاقة' : 'عرض البطاقة', 'button');
      button.addEventListener('click', () => openRecord(row));
      follow.append(button);
      tr.append(execution, impact, follow);
      tbody.append(tr);
    }
  }
  function openRecord(row) {
    selected = row;
    const data = merged(row);
    $('modalTitle').textContent = row.title;
    const goal = source.goals.find(g => g.id === row.goal);
    $('modalGoal').textContent = 'المنفذ: ' + publicOwner(row.owner) + ' · ' + (goal?.name || row.area || '');
    $('editExecution').value = data.execution;
    $('editImpact').value = data.impact;
    $('editDate').value = data.date;
    $('editDocumentation').value = data.documentation;
    $('editResult').value = data.result;
    document.querySelectorAll('#modal input,#modal select,#modal textarea').forEach(input => input.disabled = !admin);
    $('save').classList.toggle('hidden', !admin);
    $('modal').classList.remove('hidden');
  }
  function previousMonthlyRecords(row) {
    const history=monthHistory(merged(row));
    let container=$('monthlyHistory');
    if (!container) {container=el('div');container.id='monthlyHistory';container.className='history';$('monthlyContext').after(container)}
    container.replaceChildren();
    if (!history.length) {container.append(el('p','لا توجد متابعة محفوظة لهذا الشهر بعد.','note'));return}
    history.forEach((record,i)=>{
      const item=el('div',null,'history-item');
      item.append(el('strong','متابعة '+(i+1)+' · '+new Date(record.savedAt).toLocaleDateString('ar-OM')));
      item.append(el('div','النتيجة: '+record.assessment));
      if (record.immediate) item.append(el('div','الأثر المباشر: '+record.immediate));
      if (record.improvement) item.append(el('div','التحسين: '+record.improvement));
      container.append(item);
    });
  }
  function openMonthly(row) {
    selected=row;const data=merged(row),entry=latest(data);
    $('monthlyTitle').textContent='المتابعة الشهرية · '+schoolMonths.find(x=>x.key===followMonth).name;
    $('monthlyContext').textContent=row.title+' · '+publicOwner(row.owner);
    previousMonthlyRecords(row);
    $('monthlyFrequency').value=frequency(row,data);
    $('monthlyExecution').value=data.execution;
    $('monthlyAssessment').value=entry?.assessment||'يسير وفق الخطة';
    $('monthlyImmediate').value=entry?.immediate||'';
    $('monthlyEvidence').value=entry?.evidence||'';
    $('monthlyImprovement').value=entry?.improvement||'';
    document.querySelectorAll('#monthlyModal input,#monthlyModal select,#monthlyModal textarea').forEach(x=>x.disabled=!admin);
    $('monthlySave').classList.toggle('hidden',!admin);
    $('monthlyModal').classList.remove('hidden');
  }
  function openFinal(row) {
    selected=row;const data=merged(row),result=data.final||{};
    $('finalTitle').textContent='الأثر النهائي · '+row.title;
    const goal=source.goals.find(g=>g.id===row.goal);
    $('finalContext').textContent='مؤشر النجاح: '+(goal?.indicator||'يُحدد وفق الخطة المعتمدة');
    $('finalBefore').value=result.before||'';$('finalAfter').value=result.after||'';
    $('finalResult').value=result.result||'';$('finalEvidence').value=result.evidence||'';
    document.querySelectorAll('#finalModal textarea').forEach(x=>x.disabled=!admin);
    $('finalSave').classList.toggle('hidden',!admin);
    $('finalModal').classList.remove('hidden');
  }
  async function persistRow(row,change) {
    if (!admin || !authenticatedUser) throw Error('الدخول الإداري مطلوب.');
    const previous=cloudRows.get(row.id);
    // Read the latest central version before modifying one field, preserving
    // all monthly visits, final results, and earlier card annotations.
    let fresh={...merged(row)};
    if (previous) {
      const rows=await rest('hazm_board_columns?select=description&id=eq.'+esc(previous.id));
      if (rows.length) fresh={...fresh,...JSON.parse(rows[0].description||'{}')};
    }
    const data=change(fresh);
    let response;
    if (previous) {
      response=await rest('hazm_board_columns?id=eq.'+esc(previous.id),{
        method:'PATCH',headers:{'Content-Type':'application/json','Prefer':'return=representation'},
        body:JSON.stringify({description:JSON.stringify(data)})
      });
    } else {
      response=await rest('hazm_board_columns',{
        method:'POST',headers:{'Content-Type':'application/json','Prefer':'return=representation'},
        body:JSON.stringify({section:SECTION,title:row.title,description:JSON.stringify(data),
          source_local_id:row.id,position:source.rows.indexOf(row),created_by:authenticatedUser.id,published:true})
      });
    }
    if (!response.length) throw Error('لم يؤكد الخادم حفظ البيانات.');
    await loadCloud();render();
  }
  async function saveMonthly() {
    if (!selected || !admin) return;
    const record={
      assessment:$('monthlyAssessment').value,
      immediate:$('monthlyImmediate').value.trim(),
      evidence:$('monthlyEvidence').value.trim(),
      improvement:$('monthlyImprovement').value.trim(),
      savedAt:new Date().toISOString()
    };
    $('monthlySave').disabled=true;
    try {
      await persistRow(selected,data=>({
        ...data,frequency:$('monthlyFrequency').value,
        execution:$('monthlyExecution').value,
        monthly:{...(data.monthly||{}),[followMonth]:[...monthHistory(data),record]}
      }));
      $('monthlyModal').classList.add('hidden');
    } catch(error) {alert('لم تُحفظ المتابعة الشهرية مركزيًا: '+error.message)}
    finally {$('monthlySave').disabled=false}
  }
  async function saveFinal() {
    if (!selected || !admin) return;
    const result={before:$('finalBefore').value.trim(),after:$('finalAfter').value.trim(),result:$('finalResult').value.trim(),evidence:$('finalEvidence').value.trim(),savedAt:new Date().toISOString()};
    if (!result.before||!result.after||!result.result) return alert('أدخلي بيانات القياس قبل التنفيذ وبعده، ونتيجة الأثر النهائي قبل الاعتماد.');
    $('finalSave').disabled=true;
    try {
      await persistRow(selected,data=>({...data,final:result,impact:'تم قياس الأثر'}));
      $('finalModal').classList.add('hidden');
    } catch(error) {alert('لم يُحفظ قياس الأثر مركزيًا: '+error.message)}
    finally {$('finalSave').disabled=false}
  }
  async function save() {
    if (!selected || !admin || !authenticatedUser) return;
    const data = {
      execution: $('editExecution').value,
      impact: $('editImpact').value,
      date: $('editDate').value,
      documentation: $('editDocumentation').value.trim(),
      result: $('editResult').value.trim()
    };
    $('save').disabled = true;
    try {
      await persistRow(selected,prior=>({...prior,...data}));
      $('modal').classList.add('hidden');
    } catch (error) {
      alert('لم يُنشر التحديث. لا تعتمدي الحفظ حتى يعمل الاتصال المركزي. ' + error.message);
    } finally { $('save').disabled = false; }
  }
  async function init() {
    try {
      const response = await fetch('./school-plan-data.json', {cache:'no-store'});
      if (!response.ok) throw Error('تعذر تحميل بيانات الخطة.');
      source = await response.json();
      followMonth=currentSchoolMonth();
      for (const month of schoolMonths) $('followMonth').append(new Option(month.name,month.key));
      for (const area of [...new Set(source.rows.map(row => row.area))].filter(Boolean).sort()) {
        $('areaFilter').append(new Option(area, area));
      }
      await verifyAdmin();
      authControl();
      try { await loadCloud(); }
      catch (_) { status('تعذر الاتصال بسجل النشر المركزي حاليًا؛ تُعرض البيانات الأساسية فقط، ولا يمكن اعتماد حالة التزامن.'); }
      render();
    } catch (error) { status('تعذر فتح المرصد: ' + error.message); }
  }
  document.querySelectorAll('aside [data-tab]').forEach(button => button.addEventListener('click', () => {
    tab = button.dataset.tab; render();
  }));
  document.querySelectorAll('[data-pulse]').forEach(button=>button.addEventListener('click',()=>{pulseTab=button.dataset.pulse;render()}));
  $('followMonth').addEventListener('change',()=>{followMonth=$('followMonth').value;renderPulse()});
  $('pulseSearch').addEventListener('input',renderPulse);
  $('pulseFilter').addEventListener('change',renderPulse);
  $('search').addEventListener('input', render);
  $('areaFilter').addEventListener('change', render);
  $('statusFilter').addEventListener('change', render);
  $('cancel').addEventListener('click', () => $('modal').classList.add('hidden'));
  $('modal').addEventListener('click', e => { if (e.target === $('modal')) $('modal').classList.add('hidden'); });
  $('save').addEventListener('click', save);
  $('monthlySave').addEventListener('click',saveMonthly);
  $('finalSave').addEventListener('click',saveFinal);
  [['monthlyCancel','monthlyModal'],['finalCancel','finalModal']].forEach(([button,modal])=>{
    $(button).addEventListener('click',()=>$(modal).classList.add('hidden'));
    $(modal).addEventListener('click',event=>{if(event.target===$(modal))$(modal).classList.add('hidden')});
  });
  init();
})();
