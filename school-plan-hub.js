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
    initiatives: ['🌱 المبادرات المضمنة', 'المبادرات المضمنة ضمن الخطة المدرسية ومتابعة تنفيذها وتوثيق أثرها.'],
    development: ['📚 برامج الإنماء المرتبطة', 'برامج التدريب والإنماء المهني المرتبطة بأهداف الخطة المدرسية.'],
    projects: ['🎯 المشاريع والفعاليات المرتبطة', 'المشاريع والفعاليات والبرامج الداعمة لتنفيذ الخطة المدرسية.'],
    impact: ['📊 قياس الأثر', 'سجل موحد لقياس أثر المبادرات والبرامج والمشاريع، مع فتح بطاقة كل بند.']
  };
  let source = null;
  let updates = new Map();
  let cloudRows = new Map();
  let tab = 'initiatives';
  let selected = null;
  let admin = false;
  let authenticatedUser = null;

  if (visitor) {
    $('backLink').href = './visitor.html';
    $('legacyLink').classList.add('hidden');
    $('sourceNotice').textContent = 'نافذة الزائر: عرض واطلاع فقط. لا تتاح أدوات التعديل أو الحفظ.';
  }
  $('legacyLink').addEventListener('click', e => {
    // Access to the original embedded plan remains available as a backup.
    if (visitor) e.preventDefault();
  });

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
      result: '', date: '', ...updates.get(row.id)
    };
  }
  function visibleRows() {
    const q = $('search').value.trim().toLocaleLowerCase('ar');
    const area = $('areaFilter').value;
    const state = $('statusFilter').value;
    return source.rows.filter(row =>
      (tab === 'impact' ? Boolean(row.category) : row.category === tab) &&
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
  function render() {
    const [heading, detail] = labels[tab];
    $('sectionTitle').textContent = heading;
    $('sectionDescription').textContent = detail;
    document.querySelectorAll('aside [data-tab]').forEach(button => button.classList.toggle('active', button.dataset.tab === tab));
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
  async function save() {
    if (!selected || !admin || !authenticatedUser) return;
    const data = {
      execution: $('editExecution').value,
      impact: $('editImpact').value,
      date: $('editDate').value,
      documentation: $('editDocumentation').value.trim(),
      result: $('editResult').value.trim()
    };
    const previous = cloudRows.get(selected.id);
    $('save').disabled = true;
    try {
      let record;
      if (previous) {
        record = await rest('hazm_board_columns?id=eq.' + esc(previous.id), {
          method:'PATCH', headers:{'Content-Type':'application/json','Prefer':'return=representation'},
          body:JSON.stringify({description:JSON.stringify(data)})
        });
      } else {
        record = await rest('hazm_board_columns', {
          method:'POST', headers:{'Content-Type':'application/json','Prefer':'return=representation'},
          body:JSON.stringify({section:SECTION,title:selected.title,description:JSON.stringify(data),
            source_local_id:selected.id,position:source.rows.indexOf(selected),created_by:authenticatedUser.id,published:true})
        });
      }
      if (!record.length) throw Error('لم يؤكد الخادم حفظ البيانات.');
      await loadCloud();
      $('modal').classList.add('hidden');
      render();
    } catch (error) {
      alert('لم يُنشر التحديث. لا تعتمدي الحفظ حتى يعمل الاتصال المركزي. ' + error.message);
    } finally { $('save').disabled = false; }
  }
  async function init() {
    try {
      const response = await fetch('./school-plan-data.json', {cache:'no-store'});
      if (!response.ok) throw Error('تعذر تحميل بيانات الخطة.');
      source = await response.json();
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
  $('search').addEventListener('input', render);
  $('areaFilter').addEventListener('change', render);
  $('statusFilter').addEventListener('change', render);
  $('cancel').addEventListener('click', () => $('modal').classList.add('hidden'));
  $('modal').addEventListener('click', e => { if (e.target === $('modal')) $('modal').classList.add('hidden'); });
  $('save').addEventListener('click', save);
  init();
})();
