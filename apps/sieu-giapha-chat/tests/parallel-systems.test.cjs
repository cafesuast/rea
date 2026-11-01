// Siêu Gia Phả và Siêu Từ Điển: 2 hệ thống song song, mỗi bên đủ 12 mục, dùng dữ liệu của nhau
const fs0=require('fs'),path0=require('path');const OUT=path0.join(__dirname,'out');fs0.mkdirSync(OUT,{recursive:true});process.chdir(OUT);
const FILE=process.env.SGP_FILE||path0.join(__dirname,'..','index.html');
const {chromium}=require('playwright');(async()=>{const b=await chromium.launch();
for(const [W,H,nm] of [[1280,860,'d'],[390,820,'m']]){const p=await b.newPage({viewport:{width:W,height:H}});const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.addInitScript(()=>{localStorage.setItem('stdien:guideSeen','1');localStorage.setItem('stdien:gpsrc2','"fam"')});
await p.goto('file://'+FILE);await p.waitForTimeout(800);
// mỗi bên có đủ: Trò chuyện, Tra cứu, Kiểm duyệt, Kế hoạch, Nhập liệu, Bài học, Dễ dùng, Sổ tay
const need=['Trò chuyện','Tra cứu','Kiểm duyệt','Kế hoạch','Nhập liệu','Bài học','Dễ dùng','Sổ tay'];
for(const s of ['gp','td']){const labels=await p.evaluate(s=>SEC[s].slots.map(x=>x[2]).join('|'),s);const miss=need.filter(n=>!labels.includes(n));if(miss.length)throw new Error(s+' missing '+miss)}
await p.evaluate(()=>goSlot('gp','view'));await p.waitForTimeout(400);
for(const k of ['review','plan','more']){await p.evaluate(k=>goSlot('gp',k),k);await p.waitForTimeout(200);if(await p.evaluate(()=>document.querySelector('#gpX').hidden))throw new Error('gp '+k);await p.screenshot({path:`ps-${nm}-gp-${k}.png`})}
// kiểm duyệt: duyệt một người không còn lỗi
await p.evaluate(()=>goSlot('gp','review'));await p.click('[data-gprf="todo"]');await p.waitForTimeout(100);
const before=await p.evaluate(()=>gpStatsData().ver);const btn=await p.$('[data-gpver]:not([disabled])');if(btn){await btn.click();await p.waitForTimeout(300);const after=await p.evaluate(()=>gpStatsData().ver);if(after!==before+1)throw new Error('verify '+before+'->'+after)}
// sổ tay gia phả
await p.click('[data-gprf="need"]');await p.waitForTimeout(80);await p.evaluate(()=>gpNbAdd(gpP()[0]));await p.evaluate(()=>goSlot('gp','more'));await p.waitForTimeout(150);if(!(await p.evaluate(()=>document.querySelectorAll('#gpX .gpnb').length)))throw new Error('gp notebook');
// kho người ở thanh bên khi ở Gia phả, kho từ khi ở Từ điển
if(nm==='d'){const st=await p.evaluate(()=>[getComputedStyle(document.querySelector('#gpStats')).display,getComputedStyle(document.querySelector('#stats')).display]);if(st[0]==='none'||st[1]!=='none')throw new Error('gp stats '+st);
  await p.evaluate(()=>goSlot('td','chat'));await p.waitForTimeout(150);const st2=await p.evaluate(()=>[getComputedStyle(document.querySelector('#gpStats')).display,getComputedStyle(document.querySelector('#stats')).display]);if(st2[0]!=='none'||st2[1]==='none')throw new Error('td stats '+st2)}
// tìm kiếm chéo: ở Từ điển tìm tên người, ở Gia phả tìm thuật ngữ
await p.evaluate(()=>goSlot('td','learn'));await p.fill('#gsQ','Lê Văn');await p.keyboard.press('Enter');await p.waitForTimeout(200);if(!(await p.evaluate(()=>!!document.querySelector('#upRes [data-gpopen]'))))throw new Error('td search -> people');await p.keyboard.press('Escape');
await p.evaluate(()=>goSlot('gp','view'));await p.waitForTimeout(200);await p.fill('#gsQ','tộc phả');await p.keyboard.press('Enter');await p.waitForTimeout(200);if(!(await p.evaluate(()=>!!document.querySelector('#upRes [data-askword]'))))throw new Error('gp search -> dictionary');
console.log(nm,'sw',await p.evaluate(()=>document.documentElement.scrollWidth),'errs',JSON.stringify(errs));await p.close()}await b.close()})().catch(e=>{console.log('Error',e.message);process.exit(1)});
