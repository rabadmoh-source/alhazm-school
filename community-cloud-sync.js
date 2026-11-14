/* Community legacy records: admin cloud migration and automatic saving. */
(() => {
  'use strict';
  const ROOT = 'https://fmmilquujleokfxcbnas.supabase.co';
  const KEY = 'sb_publishable_O_JqIM-VqzdGgU8VTvhRHQ_eQ9eTH5R';
  const LOCAL = 'alhazm_community_v1';
  const frame = document.getElementById('serviceFrame');
  if (!frame) return;
  let token = sessionStorage.getItem('hazm_board_access') || '';
  let userId = '';
  let connected = false;
  let panel, status, activeDocument;
  let saveQueue = Promise.resolve();
  let latestPayload;
  function message(text, error = false) {
    if (status) { status.textContent = text; status.style.color = error ? '#a62b39' : '#4c396a'; }
  }
  async function request(path, options = {}) {
    const response = await fetch(ROOT + path, {
      ...options,
      headers: { apikey: KEY, Authorization: 'Bearer ' + (token || KEY), ...(options.body ? { 'Content-Type': 'application/json' } : {}), ...(options.headers || {}) }
    });
    const raw = await response.text();
    let data;
    try { data = raw ? JSON.parse(raw) : null; } catch { data = raw; }
    if (!response.ok) throw Error(data?.message || data?.error_description || data?.error || `HTTP ${response.status}`);
    return data;
  }
  async function verify() {
    const user = await request('/auth/v1/user');
    if (!user?.id) throw Error('انتهت جلسة الإدارة.');
    const allowed = await request('/rest/v1/riwaq_admins?select=user_id&user_id=eq.' + encodeURIComponent(user.id));
    if (!Array.isArray(allowed) || !allowed.length) throw Error('الحساب غير مخول لإدارة السجلات.');
    userId = user.id;
  }
  function current() {
    try {
      const v = JSON.parse(localStorage.getItem(LOCAL) || 'null');
      return v && ['actions','meetings','works','initiatives','partnerships','impacts'].every(k => Array.isArray(v[k])) ? v : null;
    } catch { return null; }
  }
  function count(v) { return ['actions','meetings','works','initiatives','partnerships','impacts'].reduce((n,k) => n + (v?.[k]?.length || 0),0); }
  function syncSave(v) {
    if (!connected || !userId) { message('التعديل محفوظ محليًا؛ سجلي الدخول لتفعيل المزامنة.', true); return; }
    latestPayload = v;
    message('جارٍ مزامنة سجلات الشراكة…');
    saveQueue = saveQueue.catch(() => {}).then(async () => {
      const snapshot = latestPayload;
      const result = await request('/rest/v1/hazm_community_state?on_conflict=id&select=id,updated_at', {
        method:'POST',
        headers: {Prefer:'resolution=merge-duplicates,return=representation'},
        body:JSON.stringify({id:'main',payload:snapshot,updated_by:userId,updated_at:new Date().toISOString()})
      });
      if (!Array.isArray(result) || result.length !== 1) throw Error('لم يؤكد الخادم حفظ السجلات.');
      if (snapshot === latestPayload) message('☁️ تمت المزامنة · ' + new Date(result[0].updated_at).toLocaleString('ar-OM'));
    }).catch(e => message('تعذرت المزامنة؛ البيانات محفوظة محليًا: ' + e.message,true));
  }
  function attachSaveHook(doc) {
    const w = frame.contentWindow;
    if (typeof w?.save !== 'function' || w.save.__hazmCloudHook) return;
    const original = w.save;
    const wrapped = function(...args) {
      const result = original.apply(this,args);
      if (result) { const data = current(); if (data) syncSave(data); }
      return result;
    };
    wrapped.__hazmCloudHook = true;
    w.save = wrapped;
  }
  async function loadCloud(doc) {
    connected = false;
    message('جارٍ التحقق من سجلات الشراكة السحابية…');
    const result = await request('/rest/v1/hazm_community_state?select=payload,updated_at&id=eq.main');
    if (!Array.isArray(result)) throw Error('تعذرت قراءة السجلات.');
    if (result.length) {
      const cloud = result[0].payload;
      if (!cloud || !Array.isArray(cloud.actions)) throw Error('بنية النسخة السحابية غير صحيحة.');
      const local = current();
      if (local && JSON.stringify(local) !== JSON.stringify(cloud)) {
        if (!confirm('تختلف النسخة المحلية عن السحابية. هل تريدين فتح النسخة السحابية المعتمدة؟ احتفظي بنسختك الاحتياطية قبل الاستبدال.')) {
          message('لم تُستبدل النسخة المحلية؛ المزامنة متوقفة حتى اختيار النسخة المعتمدة.',true);
          return;
        }
      }
      if (local && JSON.stringify(local) !== JSON.stringify(cloud) || !local) {
        localStorage.setItem(LOCAL,JSON.stringify(cloud));
        // Reinitialize the embedded application's own state without altering its design.
        if (frame.contentDocument === doc && frame.srcdoc) { frame.srcdoc = frame.srcdoc; return; }
      }
      connected = true;
      message('☁️ تم تحميل ' + count(cloud) + ' سجلًا سحابيًا · المزامنة مفعّلة');
    } else {
      const local = current();
      message('لا توجد نسخة سحابية بعد. بيانات هذا الجهاز: ' + count(local) + ' سجلًا.');
      if (panel.querySelector('[data-community-import]')) return;
      const button = document.createElement('button');
      button.dataset.communityImport = '1';
      button.textContent = '☁️ نقل سجلات هذا الجهاز إلى السحابة';
      button.style.cssText = 'background:#15918f;color:white;border:0;border-radius:9px;padding:8px 13px;margin:5px;cursor:pointer;font:inherit';
      panel.append(button);
      button.onclick = async () => {
        const data = current();
        if (!data) return message('لا توجد سجلات صالحة للنقل.',true);
        if (!confirm('سيُنقل ' + count(data) + ' سجلًا مع الصور والمرفقات إلى السحابة وتُتاح النسخة المنشورة للزوار. هل تعتمدين النقل؟')) return;
        button.disabled = true;
        try {
          message('جارٍ النقل والتحقق… يرجى عدم إغلاق الصفحة.');
          const check = await request('/rest/v1/hazm_community_state?select=id&id=eq.main');
          if (check.length) throw Error('ظهرت نسخة سحابية بالفعل؛ أعيدي فتح النافذة.');
          const result = await request('/rest/v1/hazm_community_state?select=id', {method:'POST',body:JSON.stringify({id:'main',payload:data,updated_by:userId}),headers:{Prefer:'return=representation'}});
          if (!Array.isArray(result) || result.length !== 1) throw Error('لم يؤكد الخادم نقل السجلات.');
          const verify = await request('/rest/v1/hazm_community_state?select=payload&id=eq.main');
          if (count(verify?.[0]?.payload) !== count(data)) throw Error('لم تتطابق أعداد السجلات.');
          connected = true;
          button.remove();
          message('☁️ اكتمل النقل والتحقق من ' + count(data) + ' سجلًا · المزامنة مفعّلة');
        } catch(e) { button.disabled=false; message('لم يكتمل النقل: '+e.message,true); }
      };
    }
  }
  async function authenticate(email,password) {
    const r=await fetch(ROOT+'/auth/v1/token?grant_type=password', {method:'POST',headers:{apikey:KEY,'Content-Type':'application/json'},body:JSON.stringify({email,password})});
    const data=await r.json();
    if(!r.ok||!data.access_token) throw Error(data.error_description||'فشل تسجيل الدخول');
    token=data.access_token;
    await verify();
    sessionStorage.setItem('hazm_board_access',token);
  }
  function mount(doc) {
    if (!doc?.title?.includes('التواصل والشراكة المجتمعية') || doc===activeDocument) return;
    activeDocument=doc;
    connected=false;
    panel=doc.createElement('section');
    panel.id='hazm-community-cloud-status';
    panel.style.cssText='background:#f3eef9;border:1px solid #d8cce6;border-radius:12px;padding:12px 16px;margin:12px 0;direction:rtl;text-align:right;font:14px/1.8 Tahoma,Arial,sans-serif;color:#4c396a';
    status=doc.createElement('div');
    panel.append(status);
    (doc.querySelector('main')||doc.body).prepend(panel);
    const login=doc.createElement('button');
    login.type='button'; login.textContent='دخول الإدارة السحابية';
    login.style.cssText='background:#70558d;color:#fff;border:0;border-radius:9px;padding:7px 12px;cursor:pointer;font:inherit;margin:5px';
    panel.append(login);
    login.onclick=()=>{
      panel.querySelector('[data-community-login]')?.remove();
      const box=doc.createElement('div');box.dataset.communityLogin='1';
      const email=doc.createElement('input');email.type='email';email.placeholder='البريد الإداري المعتمد';
      const password=doc.createElement('input');password.type='password';password.placeholder='كلمة المرور';
      const submit=doc.createElement('button');submit.type='button';submit.textContent='اتصال';submit.style.cssText=login.style.cssText;
      for (const input of [email,password])input.style.cssText='padding:8px;border:1px solid #d8cce6;border-radius:8px;margin:4px;max-width:220px';
      box.append(email,password,submit);panel.append(box);
      submit.onclick=async()=>{submit.disabled=true;try{await authenticate(email.value.trim(),password.value);password.value='';box.remove();await loadCloud(doc)}catch(e){message('تعذر الدخول: '+e.message,true);submit.disabled=false}};
    };
    attachSaveHook(doc);
    if(token) verify().then(()=>loadCloud(doc)).catch(e=>{token='';userId='';sessionStorage.removeItem('hazm_board_access');message('سجلي الدخول لتفعيل المزامنة: '+e.message,true)});
    else message('البيانات المعروضة محلية حتى تسجيل دخول الإدارة السحابية.');
  }
  frame.addEventListener('load',()=>{try{mount(frame.contentDocument)}catch(e){console.warn('Community cloud unavailable',e)}});
  if(frame.contentDocument?.readyState==='complete')mount(frame.contentDocument);
})();
