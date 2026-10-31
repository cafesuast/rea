const fs0=require('fs'),path0=require('path');const OUT=path0.join(__dirname,'out');fs0.mkdirSync(OUT,{recursive:true});process.chdir(OUT);
const {chromium}=require('playwright');(async()=>{const b=await chromium.launch();
for(const [W,H,nm] of [[1280,860,'d'],[390,820,'m']]){const p=await b.newPage({viewport:{width:W,height:H}});const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.addInitScript(()=>{window.__said=[];if(window.speechSynthesis)speechSynthesis.speak=u=>__said.push(u.text)});
await p.goto('file://'+path0.join(__dirname,'..','index.html'));await p.waitForTimeout(700);
if(await p.evaluate(()=>document.querySelector('#guideHi').hidden))throw new Error('first-run banner missing');
await p.click('#guideHi .helpgo');await p.waitForTimeout(200);if(await p.evaluate(()=>view)!=='help')throw new Error('help view not opened');
const want={quick:5,six:6,gp:8,td:8,faq:7};for(const k in want){await p.click(`[data-gtab="${k}"]`);await p.waitForTimeout(80);const n=await p.evaluate(()=>document.querySelectorAll('#help .hg').length);if(n!==want[k])throw new Error(`tab ${k}: ${n}`)}
await p.screenshot({path:`g-${nm}-help.png`});
await p.click('#gAll');await p.waitForTimeout(200);const said=await p.evaluate(()=>__said.length);if(!said)throw new Error('read-aloud did nothing');
if(!(await p.evaluate(()=>guideMd())).includes('# Hướng dẫn'))throw new Error('guideMd');
await p.evaluate(()=>goSlot('gp','view'));await p.click('#helpBtn');if(await p.evaluate(()=>view)!=='help')throw new Error('? button');
await p.reload();await p.waitForTimeout(500);if(!(await p.evaluate(()=>document.querySelector('#guideHi').hidden)))throw new Error('banner shown again');
console.log(nm,'said',said,'sw',await p.evaluate(()=>document.documentElement.scrollWidth),'errs',JSON.stringify(errs));await p.close()}await b.close()})().catch(e=>{console.log('Error',e.message);process.exit(1)});
