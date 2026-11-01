// Link kho lưu trữ + ô dán link tư liệu RAW (ghi chú link nói về gì) cho Gia phả và Từ điển; miễn trừ trách nhiệm; đồng ý chia sẻ
const fs0=require('fs'),path0=require('path');const OUT=path0.join(__dirname,'out');fs0.mkdirSync(OUT,{recursive:true});process.chdir(OUT);
const FILE=process.env.SGP_FILE||path0.join(__dirname,'..','index.html');
const {chromium}=require('playwright');(async()=>{const b=await chromium.launch();
for(const [W,H,nm] of [[1280,860,'d'],[390,820,'m']]){const ctx=await b.newContext({viewport:{width:W,height:H}});const errs=[];
await ctx.addInitScript(()=>{localStorage.setItem('stdien:guideSeen','1');
  localStorage.setItem('stdien:clanProf',JSON.stringify({country:'Việt Nam',ho:'Lê',toc:'Không biết',chi:'Không biết',nhanh:'Không biết',dong:'Không biết',doi:'Không biết',terms:{v:1,at:'2026-11-01T00:00:00Z'}}));
  const img=()=>{const c=document.createElement('canvas');c.width=40;c.height=40;return c.toDataURL('image/jpeg').split(',')[1]};window.__calls=[];
  const mcp={async callTool(s,t,a){__calls.push(t+':'+(a.query||a.fileId));let r;
    if(t==='search_files')r=/parentId = 'FOLDERabc123'/.test(a.query)?{files:[{id:'im1',title:'a.jpg',mimeType:'image/jpeg'},{id:'im2',title:'b.jpg',mimeType:'image/jpeg'}]}:{files:[]};
    else if(t==='download_file_content')r={content:img(),mimeType:'image/jpeg'};
    else if(t==='read_file_content')r={fileContent:'# INDEX\n\n| Từ | Từ loại | Nghĩa |\n|---|---|---|\n| từ-link-thử | d. | nghĩa thử |\n'};
    return{content:[{type:'text',text:JSON.stringify(r)}]}}};
  window.claude={use:async n=>n==='mcp'?mcp:null}});
const p=await ctx.newPage();p.on('pageerror',e=>errs.push(e.message));await p.goto('file://'+FILE);await p.waitForTimeout(800);
await p.evaluate(()=>gpPrivOpen());await p.waitForTimeout(300);const box='[data-rlbox="gp"]';
if(!(await p.$(box)))throw new Error('gp link box');
await p.fill(box+' [data-rlurl]','drive thư mục');await p.click(box+' [data-rlsave]:not([data-rlscan])');if(!/https/.test(await p.evaluate(()=>rlMsg)))throw new Error('url check');
await p.fill(box+' [data-rlurl]','https://drive.google.com/drive/folders/FOLDERabc123?usp=sharing');await p.click(box+' [data-rlsave]:not([data-rlscan])');if(!/nói về gì/.test(await p.evaluate(()=>rlMsg)))throw new Error('note check');
await p.fill(box+' [data-rlnote]','Ảnh thử gia phả');await p.check(box+' [data-rlstore]');await p.click(box+' [data-rlscan]');
await p.waitForFunction(()=>gpi.pages.length===2&&!rlBusy,null,{timeout:8000});
const L=await p.evaluate(()=>({n:rawLinks.length,s:rawLinks[0].store,t:rawLinks[0].target,pl:rawLinks[0].platform,src:gpSrc,list:document.querySelectorAll('[data-rlbox="gp"] .rlrow').length}));
if(L.n!==1||!L.s||L.t!=='gp'||L.pl!=='Google Drive'||L.src!=='mine'||L.list!==1)throw new Error('saved '+JSON.stringify(L));
await p.screenshot({path:`l-${nm}-gp.png`});
// nền tảng khác: lưu làm nguồn tham khảo
await p.fill(box+' [data-rlurl]','https://www.dropbox.com/s/xyz/giapha.pdf');await p.fill(box+' [data-rlnote]','Bản PDF chép tay');await p.click(box+' [data-rlscan]');await p.waitForTimeout(300);
if(!/chưa đọc trực tiếp/.test(await p.evaluate(()=>rlMsg)))throw new Error('dropbox msg '+await p.evaluate(()=>rlMsg));
// từ điển
await p.evaluate(()=>{gpi.open=false;renderGpi();goSlot('td','imp')});await p.waitForTimeout(300);const tb='[data-rlbox="td"]';if(!(await p.$(tb)))throw new Error('td link box');
const w0=await p.evaluate(()=>words.length);await p.fill(tb+' [data-rlurl]','https://docs.google.com/document/d/DOCxyz7890/edit');await p.fill(tb+' [data-rlnote]','Bảng từ thử');await p.click(tb+' [data-rlscan]');
await p.waitForFunction(()=>!rlBusy&&/từ mới/.test(rlMsg),null,{timeout:8000});if(!/Đã đọc 1 tệp/.test(await p.evaluate(()=>rlMsg))||!(await p.evaluate(()=>__calls.includes('read_file_content:DOCxyz7890'))))throw new Error('td import '+await p.evaluate(()=>rlMsg+' '+words.length+' '+__calls.slice(-3)));
// cài đặt: kho của tôi + đồng ý + miễn trừ
await p.evaluate(()=>{acctTab='set';show('acct')});await p.waitForTimeout(300);if(!/Google Drive: Ảnh thử gia phả/.test(await p.evaluate(()=>document.querySelector('#rlStoreRow')?.innerText||'')))throw new Error('store row');
// bật chia sẻ khi chưa đồng ý: bị chặn, mở bảng đồng ý
await p.evaluate(()=>{show('giapha');gpCmpOpen()});await p.waitForTimeout(400);await p.evaluate(()=>{document.querySelector('#gpCmp details.gpc-set').open=true;const c=document.querySelector('#gpCmp [data-gpsync]');c.checked=true;c.dispatchEvent(new Event('change',{bubbles:true}))});await p.waitForTimeout(200);
const blk=await p.evaluate(()=>({on:gpSync.on,sheet:!document.querySelector('#cpSheet').hidden,dis:/không chịu trách nhiệm/.test(document.querySelector('#cpSheet').textContent),ck:!!document.querySelector('#cp_consent')}));
if(blk.on||!blk.sheet||!blk.dis||!blk.ck)throw new Error('consent gate '+JSON.stringify(blk));
await p.check('#cp_consent');await p.click('#cpSave');await p.waitForTimeout(200);if(!(await p.evaluate(()=>cpConsent())))throw new Error('consent save');
await p.evaluate(()=>{$('#gpCmp').hidden=true;acctTab='priv';show('acct')});await p.waitForTimeout(300);
if(!(await p.evaluate(()=>document.querySelector('#consentSet')?.checked&&/Cây gia phả Việt Nam/.test(document.querySelector('#consentBox').textContent))))throw new Error('priv box');
await p.evaluate(()=>{gpSync.on=true});await p.click('#consentSet');await p.waitForTimeout(200);if(await p.evaluate(()=>cpConsent()||gpSync.on))throw new Error('withdraw');
await p.screenshot({path:`l-${nm}-priv.png`,fullPage:false});
console.log(nm,'sw',await p.evaluate(()=>document.documentElement.scrollWidth),'errs',JSON.stringify(errs));await ctx.close()}await b.close()})().catch(e=>{console.log('Error',e.message);process.exit(1)});
