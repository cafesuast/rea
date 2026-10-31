const fs0=require('fs'),path0=require('path');const OUT=path0.join(__dirname,'out');fs0.mkdirSync(OUT,{recursive:true});process.chdir(OUT);
const {chromium}=require('playwright');(async()=>{const b=await chromium.launch();
for(const [W,H,nm] of [[1280,860,'d'],[390,820,'m']]){const p=await b.newPage({viewport:{width:W,height:H}});const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('file://'+path0.join(__dirname,'..','index.html'));await p.waitForTimeout(700);console.log(nm,'view',await p.evaluate(()=>view));await p.screenshot({path:`n-${nm}-home.png`});
await p.evaluate(()=>document.querySelector('[data-sec="td"]').click());await p.waitForTimeout(200);console.log(nm,'tu',await p.evaluate(()=>view));await p.screenshot({path:`n-${nm}-tu.png`});
if(nm==='m'){await p.evaluate(()=>document.querySelector('#showNav').click());await p.waitForTimeout(300);await p.screenshot({path:`n-m-drawer.png`})}
await p.evaluate(()=>document.querySelector('[data-slot="td:cal"]').click());console.log(nm,'plan',await p.evaluate(()=>view+' '+document.querySelector('[data-slot="td:cal"]').classList.contains('on')));
await p.evaluate(()=>document.querySelector('[data-sec="gp"]').click());console.log(nm,'gp',await p.evaluate(()=>view),'sw',await p.evaluate(()=>document.documentElement.scrollWidth),JSON.stringify(errs));await p.close()}await b.close()})();
