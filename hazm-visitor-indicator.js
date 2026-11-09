/* Hazm visitor header badge — presentational only; no data or authorization changes. */
(()=>{'use strict';
  const path=location.pathname;
  const isVisitorHome=/\/visitor\.html$/i.test(path);
  const isSafetyVisitor=/\/safety-visitor\.html$/i.test(path);
  const visitorQuery=new URLSearchParams(location.search).get('visitor')==='1';
  let fromVisitor=false;
  if(/\/riwaq-alhazm\.html$/i.test(path)){
    try{const r=new URL(document.referrer);fromVisitor=r.origin===location.origin&&/\/(?:visitor|safety-visitor)\.html$/i.test(r.pathname)}catch(_){}
  }
  if(!(isVisitorHome||isSafetyVisitor||visitorQuery||fromVisitor))return;
  if(document.getElementById('hazm-visitor-indicator'))return;
  const css=document.createElement('style');css.id='hazm-visitor-indicator-style';
  css.textContent='.hazm-visitor-indicator{display:inline-flex;align-items:center;gap:7px;direction:rtl;vertical-align:middle;padding:6px 12px;border-radius:999px;background:#e6f7f5;border:1px solid #8bcac5;color:#126c70;font:700 13px/1.5 Tahoma,Arial,sans-serif;white-space:nowrap;box-shadow:0 2px 7px #164d4d0a}.hazm-visitor-indicator svg{width:18px;height:18px;flex:none;stroke:currentColor;fill:none;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}.hazm-visitor-indicator-wrap{margin:9px 0 12px;display:flex;justify-content:flex-start}@media(max-width:600px){.hazm-visitor-indicator{padding:5px 10px;font-size:12px}}';
  document.head.appendChild(css);
  const badge=document.createElement('span');badge.id='hazm-visitor-indicator';badge.className='hazm-visitor-indicator';badge.setAttribute('aria-label','نافذة الزوار');
  badge.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg><span>نافذة الزوار</span>';
  const hero=isVisitorHome?document.querySelector('main .hero'):null;
  const heading=hero?.querySelector('h1');
  const target=isSafetyVisitor?document.querySelector('main .header h2'):document.querySelector('header h1');
  if(heading){const wrap=document.createElement('div');wrap.className='hazm-visitor-indicator-wrap';wrap.append(badge);heading.parentNode.insertBefore(wrap,heading);}
  else if(target){target.append(' ',badge);}
  else{const head=document.querySelector('header')||document.querySelector('.brandbar');if(head)head.appendChild(badge);}
})();