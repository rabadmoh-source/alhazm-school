(function(){
'use strict';
var script=document.currentScript;
var service=(script&&script.getAttribute('data-service'))||'general';
var key='alhazm:evidence-links:v1:'+service;
var records=[];
try{var saved=JSON.parse(localStorage.getItem(key)||'[]');if(Array.isArray(saved))records=saved.filter(x=>x&&typeof x.url==='string');}catch(e){}
function el(tag,attrs,txt){var n=document.createElement(tag);Object.keys(attrs||{}).forEach(k=>n.setAttribute(k,attrs[k]));if(txt!==undefined)n.textContent=txt;return n;}
function validUrl(s){try{var u=new URL(s);return /^https?:$/.test(u.protocol)?u.href:null}catch(e){return null}}
function save(){try{localStorage.setItem(key,JSON.stringify(records));return true}catch(e){alert('تعذّر حفظ الرابط في هذا المتصفح. انسخي الرابط واحتفظي به خارجيًا.');return false}}
function init(){
if(document.getElementById('hazm-evidence-links'))return;
var root=el('div',{id:'hazm-evidence-links',dir:'rtl'});
root.innerHTML='<style>#hazm-evidence-links{position:fixed;bottom:14px;left:14px;z-index:2147480000;font:14px/1.7 Tahoma,Arial,sans-serif;direction:rtl;color:#293047}#hazm-evidence-links button{cursor:pointer;font:inherit}#hazm-evidence-links .eh-toggle{background:#70558d;color:white;border:0;border-radius:12px;padding:10px 15px;box-shadow:0 4px 12px #49365a44}#hazm-evidence-links .eh-panel{display:none;position:absolute;bottom:52px;left:0;width:min(390px,calc(100vw - 28px));max-height:70vh;overflow:auto;background:white;border:1px solid #ded4e8;border-radius:16px;box-shadow:0 10px 40px #302a4560;padding:16px}#hazm-evidence-links .eh-panel.open{display:block}#hazm-evidence-links h3{font-size:17px;color:#654684;margin:0 0 5px}#hazm-evidence-links p{font-size:12px;color:#677184;margin:0 0 10px}#hazm-evidence-links label{display:block;margin:7px 0;font-size:12px;font-weight:bold}#hazm-evidence-links input{width:100%;box-sizing:border-box;background:white;border:1px solid #ccc2db;border-radius:8px;padding:8px;font:inherit;direction:rtl}#hazm-evidence-links input.eh-url{direction:ltr}#hazm-evidence-links .eh-add{background:#188f90;color:#fff;border:0;border-radius:9px;padding:7px 14px;margin:8px 0}#hazm-evidence-links .eh-list{list-style:none;padding:0;margin:0}#hazm-evidence-links li{border-top:1px solid #ece8f0;padding:9px 0;overflow-wrap:anywhere}#hazm-evidence-links a{color:#70558d;margin-left:12px}#hazm-evidence-links .eh-del{border:1px solid #decbd7;background:#fff;color:#954262;border-radius:8px;padding:3px 9px;font-size:12px}#hazm-evidence-links .eh-close{float:left;border:0;background:transparent;font-size:20px;color:#655a72}#hazm-evidence-links .eh-none{color:#888}</style>';
var toggle=el('button',{type:'button',class:'eh-toggle','aria-expanded':'false'},'🔗 روابط الأدلة');
var panel=el('div',{class:'eh-panel',role:'region','aria-label':'روابط الأدلة'});
var close=el('button',{type:'button',class:'eh-close','aria-label':'إغلاق'},'×');
panel.appendChild(close);panel.appendChild(el('h3',{},'روابط الأدلة والملفات'));panel.appendChild(el('p',{},'احفظي رابط العرض بدل رفع الملف. الملفات تبقى في السحابة وتخضع لصلاحيات مشاركتها. الروابط محفوظة في هذا المتصفح فقط.'));
var nameLabel=el('label',{},'اسم الملف أو السجل');var name=el('input',{type:'text',placeholder:'مثال: أدلة مبادرة أقرأ لأرتقي',maxlength:'180'});nameLabel.appendChild(name);panel.appendChild(nameLabel);
var urlLabel=el('label',{},'رابط العرض (SharePoint أو OneDrive أو رابط آمن)');var url=el('input',{type:'url',class:'eh-url',placeholder:'https://…'});urlLabel.appendChild(url);panel.appendChild(urlLabel);
var add=el('button',{type:'button',class:'eh-add'},'+ حفظ رابط العرض');panel.appendChild(add);
var list=el('ul',{class:'eh-list'});panel.appendChild(list);root.appendChild(toggle);root.appendChild(panel);document.body.appendChild(root);
function show(v){panel.classList.toggle('open',v);toggle.setAttribute('aria-expanded',String(v))}
toggle.onclick=function(){show(!panel.classList.contains('open'))};close.onclick=function(){show(false)};
function render(){list.textContent='';if(!records.length){list.appendChild(el('li',{class:'eh-none'},'لا توجد روابط محفوظة بعد.'));return}records.forEach(function(r,i){var li=el('li');li.appendChild(el('strong',{},r.name||'ملف مرفق'));li.appendChild(el('span',{},'  '));li.appendChild(el('a',{href:r.url,target:'_blank',rel:'noopener noreferrer'},'عرض الملف ↗'));var del=el('button',{type:'button',class:'eh-del'},'حذف');del.onclick=function(){if(!confirm('حذف الرابط من هذا السجل؟ لن يُحذف الملف الأصلي.'))return;records.splice(i,1);if(save())render()};li.appendChild(del);list.appendChild(li)})}
add.onclick=function(){var u=validUrl(url.value.trim());if(!u){alert('يرجى إدخال رابط صحيح يبدأ بـ https:// أو http://');return}var title=name.value.trim()||'ملف مرفق';records.push({name:title,url:u,at:new Date().toISOString()});if(save()){name.value='';url.value='';render()}};render();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();