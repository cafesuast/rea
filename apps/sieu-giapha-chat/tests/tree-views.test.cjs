// Cây gia phả: chọn kiểu xem Cây · Vòng tròn · Mạng 3D · Xoắn 3D
const fs0=require('fs'),path0=require('path');const OUT=path0.join(__dirname,'out');fs0.mkdirSync(OUT,{recursive:true});process.chdir(OUT);
const FILE=process.env.SGP_FILE||path0.join(__dirname,'..','index.html');
const {chromium}=require('playwright');(async()=>{const b=await chromium.launch();
for(const [W,H,nm] of [[1280,860,'d'],[390,820,'m']]){const p=await b.newPage({viewport:{width:W,height:H}});const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.addInitScript(()=>{localStorage.setItem('stdien:guideSeen','1');localStorage.setItem('stdien:gpsrc2','"fam"')});
await p.goto('file://'+FILE);await p.waitForTimeout(800);await p.evaluate(()=>goSlot('gp','view'));await p.waitForTimeout(500);
const n=await p.evaluate(()=>document.querySelectorAll('#gpbar [data-gplay]').length);if(n!==4)throw new Error('layout switch '+n);
const ppl=await p.evaluate(()=>gpApi.people.length);if(ppl<5)throw new Error('demo people '+ppl);
await p.click('[data-gplay="ring"]');await p.waitForTimeout(300);const dots=await p.evaluate(()=>document.querySelectorAll('#gpAlt .rn').length);if(dots!==ppl)throw new Error(`ring dots ${dots}/${ppl}`);
if(await p.evaluate(()=>getComputedStyle(document.querySelector('#gpbox')).display)!=='none')throw new Error('tree not hidden');
await p.screenshot({path:`tv-${nm}-ring.png`});await p.click('#gpAlt .rn:not(.me)');await p.waitForTimeout(100);if(await p.evaluate(()=>document.querySelector('#gpCard').hidden))throw new Error('ring pick');
for(const k of ['net','helix']){await p.click(`[data-gplay="${k}"]`);await p.waitForTimeout(900);const ok=await p.evaluate(()=>{const c=document.querySelector('#gpAlt canvas');if(!c)return'no canvas';const d=c.getContext('2d').getImageData(0,0,c.width,c.height).data;let s=0;for(let i=3;i<d.length;i+=40)if(d[i])s++;return s>200?'ok':'blank '+s});if(ok!=='ok')throw new Error(k+' '+ok);
  const box=await p.evaluate(()=>{const r=document.querySelector('#gpAlt canvas').getBoundingClientRect();return[r.left,r.top,r.width,r.height]});await p.mouse.move(box[0]+box[2]/2,box[1]+box[3]/2);await p.mouse.down();await p.mouse.move(box[0]+box[2]/2+80,box[1]+box[3]/2+20,{steps:5});await p.mouse.up();
  await p.screenshot({path:`tv-${nm}-${k}.png`})}
await p.evaluate(()=>{const c=document.querySelector('#gpAlt canvas');const ev=new Event('x');});
await p.click('[data-gplay="tree"]');await p.waitForTimeout(200);if(await p.evaluate(()=>!document.querySelector('#gpAlt').hidden))throw new Error('back to tree');
await p.evaluate(()=>goSlot('gp','chat'));await p.waitForTimeout(100);if(await p.evaluate(()=>!document.querySelector('#gpAlt').hidden||document.querySelector('[data-gplay]')))throw new Error('switch should only be in tree view');
console.log(nm,'people',ppl,'sw',await p.evaluate(()=>document.documentElement.scrollWidth),'errs',JSON.stringify(errs));await p.close()}await b.close()})().catch(e=>{console.log('Error',e.message);process.exit(1)});
