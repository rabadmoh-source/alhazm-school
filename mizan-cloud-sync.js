/* Alhazm Mizan: admin-only cloud sync. The existing local records remain intact. */
(() => {
  'use strict';
  const ROOT = 'https://fmmilquujleokfxcbnas.supabase.co';
  const KEY = 'sb_publishable_O_JqIM-VqzdGgU8VTvhRHQ_eQ9eTH5R';
  const LOCAL = 'alhazm_quality_v1';
  const frame = document.getElementById('serviceFrame');
  if (!frame) return;
  let token = sessionStorage.getItem('hazm_board_access') || '';
  let userId = '';
  let connected = false;
  let panel;
  let status;
  let saveQueue = Promise.resolve();
  let latestPayload = null;
  let activeDocument = null;
  const el = (tag, text, cls) => {
    const node = document.createElement(tag);
    if (text) node.textContent = text;
    if (cls) node.className = cls;
    return node;
  };
  function say(message, error = false) {
    if (!status) return;
    status.textContent = message;
    status.style.color = error ? '#a62b39' : '#4c396a';
  }
  function headers(json = false) {
    return { apikey: KEY, Authorization: `Bearer ${token || KEY}`, ...(json ? { 'Content-Type': 'application/json' } : {}) };
  }
  async function request(path, options = {}) {
    const response = await fetch(ROOT + path, { ...options, headers: { ...headers(!!options.body), ...options.headers } });
    const raw = await response.text();
    let data;
    try { data = raw ? JSON.parse(raw) : null; } catch { data = raw; }
    if (!response.ok) throw Error(data?.message || data?.error_description || data?.error || `HTTP ${response.status}`);
    return data;
  }
  async function verify() {
    const user = await request('/auth/v1/user');
    if (!user?.id) throw Error('انتهت جلسة الإدارة؛ يرجى تسجيل الدخول مجددًا.');
    const allowed = await request(`/rest/v1/riwaq_admins?select=user_id&user_id=eq.${encodeURIComponent(user.id)}`);
    if (!Array.isArray(allowed) || !allowed.length) throw Error('هذا الحساب غير مخول لإدارة ميزان الحزم.');
    userId = user.id;
  }
  function currentState() {
    try {
      const data = JSON.parse(localStorage.getItem(LOCAL) || 'null');
      return data && Array.isArray(data.indicator) && Array.isArray(data.evidence) && Array.isArray(data.improvement) ? data : null;
    } catch { return null; }
  }
  async function push(data) {
    if (!connected || !userId) throw Error('المزامنة غير متصلة.');
    const body = JSON.stringify({ id: 'main', payload: data, schema_version: 1, updated_by: userId, updated_at: new Date().toISOString() });
    const result = await request('/rest/v1/hazm_mizan_state?on_conflict=id&select=id,updated_at', {
      method: 'POST', body,
      headers: { Prefer: 'resolution=merge-duplicates,return=representation' }
    });
    if (!Array.isArray(result) || result.length !== 1) throw Error('لم يؤكد الخادم اكتمال حفظ السجل.');
    return result[0];
  }
  function uploadLatest(data) {
    latestPayload = data;
    say('جارٍ حفظ التعديلات سحابيًا…');
    saveQueue = saveQueue.catch(() => {}).then(async () => {
      const snapshot = latestPayload;
      const result = await push(snapshot);
      if (latestPayload === snapshot) say('☁️ تم الحفظ والمزامنة · ' + new Date(result.updated_at).toLocaleString('ar-OM'));
    }).catch(err => {
      say('تعذرت المزامنة، بقيت البيانات محفوظة محليًا: ' + err.message, true);
    });
    return saveQueue;
  }
  window.hazmMizanCloudSave = data => {
    if (!connected) {
      say('الحفظ محلي حاليًا؛ سجلي الدخول لتفعيل المزامنة.', true);
      return;
    }
    uploadLatest(data);
  };
  async function loadCloud() {
    connected = false;
    say('جارٍ التحقق من السجل السحابي…');
    const result = await request('/rest/v1/hazm_mizan_state?select=payload,updated_at&id=eq.main');
    if (!Array.isArray(result)) throw Error('تعذر قراءة سجل الميزان.');
    if (result.length) {
      const cloud = result[0].payload;
      const local = currentState();
      if (local && JSON.stringify(local) !== JSON.stringify(cloud)) {
        const proceed = window.confirm('توجد نسخة سحابية تختلف عن بيانات هذا المتصفح. هل تريدين عرض النسخة السحابية؟ ستبقى نسختك الاحتياطية المحفوظة لديكِ كما هي.');
        if (!proceed) { say('لم تُستبدل البيانات المحلية. المزامنة متوقفة حتى تختاري النسخة المعتمدة.', true); return; }
      }
      if (typeof frame.contentWindow?.hazmMizanApplyCloud !== 'function') throw Error('واجهة الميزان لم تجهز لاستقبال السجلات بعد.');
      frame.contentWindow.hazmMizanApplyCloud(cloud);
      connected = true;
      say('☁️ تم تحميل النسخة السحابية · التعديلات التالية تتزامن تلقائيًا');
    } else {
      const data = currentState();
      const count = data?.indicator?.length || 0;
      say(`لا توجد نسخة سحابية بعد. بيانات هذا الجهاز: ${count} مؤشرًا.`);
      const importBtn = el('button', '☁️ نقل بيانات هذا الجهاز إلى السحابة');
      importBtn.type = 'button';
      importBtn.style.cssText = 'background:#158b88;color:white;border:0;border-radius:9px;padding:8px 13px;cursor:pointer;font:inherit;margin:4px';
      panel.querySelectorAll('[data-mizan-import]').forEach(x => x.remove());
      importBtn.dataset.mizanImport = '1';
      panel.append(importBtn);
      importBtn.onclick = async () => {
        if (!data) return say('لا توجد بيانات صالحة للنقل.', true);
        if (!window.confirm(`سيُرفع ${count} مؤشرًا وتقارير الميزان الحالية إلى التخزين السحابي الخاص بالإدارة. هل تعتمدين هذا النقل الأول؟`)) return;
        importBtn.disabled = true;
        try {
          say('جارٍ رفع النسخة الأولى… لا تغلقي الصفحة حتى التأكيد.');
          const check = await request('/rest/v1/hazm_mizan_state?select=id&id=eq.main');
          if (check.length) throw Error('ظهرت نسخة سحابية أثناء النقل. أعيدي فتح النافذة للتحقق منها.');
          const result = await request('/rest/v1/hazm_mizan_state?select=id', { method: 'POST', body: JSON.stringify({ id: 'main', payload: data, schema_version: 1, updated_by: userId }), headers: { Prefer: 'return=representation' } });
          if (!Array.isArray(result) || result.length !== 1) throw Error('لم يؤكد الخادم نقل السجل.');
          const verified = await request('/rest/v1/hazm_mizan_state?select=payload&id=eq.main');
          if (verified?.[0]?.payload?.indicator?.length !== data.indicator.length) throw Error('لم تتطابق أعداد المؤشرات بعد النقل؛ راجعي النسخة الاحتياطية.');
          connected = true;
          importBtn.remove();
          say(`☁️ اكتمل النقل والتحقق من ${count} مؤشرًا · المزامنة مفعّلة`);
        } catch (e) { importBtn.disabled = false; say('لم يكتمل النقل: ' + e.message, true); }
      };
    }
  }
  async function authenticate(email, password) {
    const response = await fetch(ROOT + '/auth/v1/token?grant_type=password', {
      method: 'POST', headers: { apikey: KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await response.json();
    if (!response.ok || !data.access_token) throw Error(data.error_description || data.msg || 'فشل تسجيل الدخول');
    token = data.access_token;
    await verify();
    sessionStorage.setItem('hazm_board_access', token);
  }
  function mount(doc) {
    if (!doc?.title?.includes('ميزان الحزم') || doc === activeDocument) return;
    activeDocument = doc;
    connected = false;
    panel = el('section');
    panel.id = 'hazm-mizan-cloud-status';
    panel.style.cssText = 'background:#f3eef9;border:1px solid #d8cce6;border-radius:12px;padding:12px 16px;margin:12px 0;direction:rtl;text-align:right;font:14px/1.8 Tahoma,Arial,sans-serif;color:#4c396a';
    status = el('div', '☁️ يجري تهيئة المزامنة…');
    panel.append(status);
    const actions = doc.querySelector('.actions');
    const container = actions?.closest('.topbar') || doc.querySelector('#content')?.parentElement || doc.body;
    container.parentNode.insertBefore(panel, container.nextSibling);
    const login = el('button', 'دخول الإدارة السحابية');
    login.type = 'button';
    login.style.cssText = 'background:#70558d;color:#fff;border:0;border-radius:9px;padding:7px 12px;cursor:pointer;font:inherit;margin:5px';
    panel.append(login);
    login.onclick = () => {
      panel.querySelectorAll('[data-mizan-login]').forEach(x => x.remove());
      const box = el('div'); box.dataset.mizanLogin = '1';
      const email = el('input'); email.type = 'email'; email.placeholder = 'البريد الإداري المعتمد';
      const pass = el('input'); pass.type = 'password'; pass.placeholder = 'كلمة المرور';
      for (const field of [email,pass]) field.style.cssText = 'padding:8px;border:1px solid #d8cce6;border-radius:8px;margin:4px;max-width:230px';
      const go = el('button', 'اتصال'); go.type = 'button'; go.style.cssText = login.style.cssText;
      box.append(email,pass,go);panel.append(box);
      go.onclick = async () => {
        go.disabled = true;
        try { await authenticate(email.value.trim(),pass.value); pass.value='';box.remove();await loadCloud(); }
        catch (e) { say('تعذر الدخول: ' + e.message,true);go.disabled=false; }
      };
    };
    if (token) verify().then(loadCloud).catch(e => { token='';userId='';sessionStorage.removeItem('hazm_board_access');say('سجلي الدخول لتفعيل المزامنة: '+e.message,true); });
    else say('البيانات المعروضة محلية حتى تسجيل دخول الإدارة السحابية.');
  }
  frame.addEventListener('load', () => { try { mount(frame.contentDocument); } catch (e) { console.warn('Mizan cloud panel unavailable',e); } });
  if (frame.contentDocument?.readyState === 'complete') mount(frame.contentDocument);
})();
