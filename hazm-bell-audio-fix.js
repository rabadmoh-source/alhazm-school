/* إصلاح أسماء الحصص المسجلة لساعة الحزم - دون تغيير التسجيلات */
(function(){
function normalize(name){
 const text=String(name||'').normalize('NFKC').replace(/[\u064b-\u065f\u0670]/g,'').replace(/[أإآ]/g,'ا').replace(/ى/g,'ي').replace(/ة/g,'ه');
 if(/طابور|اصطفاف/.test(text))return 'الطابور الصباحي';
 if(/فسح|استراح/.test(text))return 'الفسحة';
 const digit=text.match(/[1-7١-٧]/),map={'١':1,'٢':2,'٣':3,'٤':4,'٥':5,'٦':6,'٧':7};
 let n=digit?(map[digit[0]]||Number(digit[0])):0;
 if(!n){const words=['','الاولي','الثانيه','الثالثه','الرابعه','الخامسه','السادسه','السابعه'];n=words.findIndex((w,i)=>i&&text.includes(w))}
 return n>0?'الحصة '+n:name;
}
function install(){
 const api=window.HazmRecordedBells;
 if(!api){setTimeout(install,150);return}
 if(!api.__hazmFix){const orig=api.play.bind(api);api.play=function(name,vol){return orig(normalize(name),vol)};api.__hazmFix=true}
 const controls=document.querySelector('#bells .controls');
 if(!controls||document.getElementById('hazmSoundTest'))return;
 const btn=document.createElement('button');btn.id='hazmSoundTest';btn.textContent='🎙️ تفعيل وتجربة تسجيل الحصة الأولى';btn.type='button';btn.className='primary';
 const recess=document.createElement('button');recess.type='button';recess.textContent='🎙️ تجربة إعلان الفسحة';
 const info=document.createElement('span');info.id='hazmSoundInfo';info.setAttribute('aria-live','polite');
 const play=function(name){info.textContent='جار تشغيل '+name;api.play(name,Math.max(.6,Number(window.state?.volume)||.8)).then(()=>info.textContent='بدأ تشغيل '+name).catch(e=>info.textContent='تعذر تشغيل التسجيل: '+e.message)};
 btn.onclick=function(){const checkbox=document.getElementById('speechEnabled');if(checkbox)checkbox.checked=true;const bell=document.getElementById('bellEnabled');if(bell)bell.checked=true; if(typeof state!=='undefined'){state.speechEnabled=true;state.bellEnabled=true;if(typeof persist==='function')persist()}play('الحصة الأولى')};
 recess.onclick=()=>play('الفسحة');controls.prepend(info);controls.prepend(recess);controls.prepend(btn);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install);else install();
})();