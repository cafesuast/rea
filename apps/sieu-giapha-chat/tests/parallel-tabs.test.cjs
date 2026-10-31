const fs0=require('fs'),path0=require('path');const OUT=path0.join(__dirname,'out');fs0.mkdirSync(OUT,{recursive:true});process.chdir(OUT);
const {chromium}=require('playwright');(async()=>{const b=await chromium.launch();
for(const [W,H,nm] of [[1280,860,'d'],[390,820,'m']]){const p=await b.newPage({viewport:{width:W,height:H}});const errs=[];p.on('pageerror',e=>errs.push(e.stack));
await p.goto('file://'+path0.join(__dirname,'..','index.html'));await p.waitForTimeout(700);
const c=s=>p.evaluate(s=>{const e=document.querySelector(s);if(!e)throw new Error('missing '+s);e.click()},s);
for(const s of ['gp','td'])for(const k of ['chat','view','list','cal','imp','learn','easy','more']){await p.evaluate(([s,k])=>goSlot(s,k),[s,k]);await p.waitForTimeout(120);
  const st=await p.evaluate(()=>({view,gpSlot,title:document.querySelector('#viewTitle').textContent,imp:!document.querySelector('#gpImp').hidden,easy:!document.querySelector('#gpEasy').hidden,on:[...document.querySelectorAll('.side [data-slot].on')].map(b=>b.dataset.slot).join()}));console.log(nm,s,k,JSON.stringify(st))}
await p.evaluate(()=>goSlot('gp','easy'));await p.waitForTimeout(150);await p.screenshot({path:`p-${nm}-gpeasy.png`});
await p.evaluate(()=>goSlot('gp','imp'));await p.waitForTimeout(150);await p.screenshot({path:`p-${nm}-gpimp.png`});
await p.evaluate(()=>goSlot('td','imp'));await p.waitForTimeout(150);await p.screenshot({path:`p-${nm}-tdimp.png`});
await p.evaluate(()=>goSlot('td','chat'));await c('#plusBtn');await p.waitForTimeout(150);await p.screenshot({path:`p-${nm}-tdplus.png`});await p.keyboard.press('Escape');
await p.evaluate(()=>goSlot('gp','chat'));await p.waitForTimeout(300);await p.evaluate(()=>document.querySelector('.gphost').shadowRoot.querySelector('#plusBtn').click());await p.waitForTimeout(150);await p.screenshot({path:`p-${nm}-gpplus.png`});
await p.evaluate(()=>document.querySelector('.gphost').shadowRoot.querySelector('.menu [data-v="six:paste"]').click());await p.waitForTimeout(150);console.log(nm,'gp paste ->',await p.evaluate(()=>gpSlot+' '+!document.querySelector('#gpImp').hidden+' '+(document.activeElement&&document.activeElement.id)));
console.log(nm,'sw',await p.evaluate(()=>document.documentElement.scrollWidth),JSON.stringify(errs));await p.close()}await b.close()})();
