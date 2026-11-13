/* Add impact measurement to the existing shield without changing the approved boards. */
(()=>{'use strict';
 const setup=()=>{
  const nav=document.getElementById('nav');if(!nav||nav.querySelector('[data-hazm-impact]'))return;
  const button=document.createElement('button');button.type='button';button.dataset.hazmImpact='1';
  const icon=document.createElement('span');icon.className='hazmSafetyIcon';icon.textContent='🎯';
  const label=document.createElement('span');label.textContent='قياس الأثر على دعم تعلم الطلبة';button.append(icon,label);
  button.onclick=()=>{
   nav.querySelectorAll('button').forEach(b=>b.classList.remove('active'));
   button.classList.add('active');
   const heading=document.getElementById('heading'),subtitle=document.getElementById('subtitle'),content=document.getElementById('mainContent'),stats=document.getElementById('stats');
   if(heading)heading.textContent='قياس الأثر على دعم تعلم الطلبة';
   if(subtitle)subtitle.textContent='الأثر المكتوب للجولات والأنشطة المنشورة في درع الحزم';
   if(stats)stats.style.display='none';
   document.body.classList.add('safetyPadletMode');
   if(content){content.replaceChildren();const iframe=document.createElement('iframe');iframe.className='hazmSafetyPadletFrame';iframe.title='قياس أثر أنشطة درع الحزم';iframe.src='./safety-impact.html?embedded=1';content.append(iframe)}
  };
  nav.append(button);
 };
 const start=()=>{const nav=document.getElementById('nav');if(!nav)return;setup();new MutationObserver(setup).observe(nav,{childList:true})};
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
