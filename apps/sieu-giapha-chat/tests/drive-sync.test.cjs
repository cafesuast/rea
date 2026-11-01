// Đồng bộ Google Drive: tìm thư mục, phân trang, tìm thẳng tệp khi không thấy thư mục, tự đồng bộ 6h sáng
const fs0=require('fs'),path0=require('path');const OUT=path0.join(__dirname,'out');fs0.mkdirSync(OUT,{recursive:true});process.chdir(OUT);
const FILE=process.env.SGP_FILE||path0.join(__dirname,'..','index.html');
const {chromium}=require('playwright');(async()=>{const b=await chromium.launch();
for(const [W,H,nm,variant] of [[1280,860,'d','folder'],[390,820,'m','loose']]){const ctx=await b.newContext({viewport:{width:W,height:H}});const errs=[];
await ctx.addInitScript(v=>{localStorage.setItem('stdien:guideSeen','1');
  const folder={id:'F1',title:'Siêu Từ Điển - RAW'},other={id:'F2',title:'Siêu Từ Điển Doanh Nghiệp Việt - RAW'};
  const kids=[...Array(12)].map((_,i)=>({id:'k'+i,title:i<6?`INDEX-A-${String(i).padStart(3,'0')}.md`:`FULL-A-${String(i).padStart(3,'0')}.md`,modifiedTime:'2026-10-31T10:00:00Z'})).concat([{id:'p',title:'progress.md'},{id:'o',title:'OFFICIAL'}]);
  const page=(arr,tok)=>{const s=+(tok||0),f=arr.slice(s,s+5);return{files:f,nextPageToken:s+5<arr.length?String(s+5):undefined}};
  window.__calls=[];
  const mcp={async callTool(s,t,a){__calls.push(t+':'+(a.query||a.fileId));let r;
    if(t==='search_files'){if(/mimeType = 'application\/vnd.google-apps.folder'/.test(a.query))r=v==='folder'&&/Siêu Từ Điển/.test(a.query)?{files:[other,folder]}:{files:[]};
      else if(/parentId = 'F1'/.test(a.query))r=page(kids,a.pageToken);else if(/parentId/.test(a.query))r={files:[]};
      else if(/INDEX-/.test(a.query))r=v==='loose'?page(kids.filter(k=>/md$/.test(k.title)),a.pageToken):{files:[]};else r={files:[]}}
    else if(t==='read_file_content')r={fileContent:'# INDEX\n\n| Từ | Từ loại | Nghĩa |\n|---|---|---|\n| thử'+a.fileId+' | d. | nghĩa thử |\n'};
    return{content:[{type:'text',text:JSON.stringify(r)}]}}};
  window.claude={use:async n=>n==='mcp'?mcp:null}},variant);
const p=await ctx.newPage();p.on('pageerror',e=>errs.push(e.message));await p.goto('file://'+FILE);await p.waitForTimeout(700);
await p.evaluate(()=>goSlot('td','imp'));await p.waitForTimeout(150);
if(!(await p.evaluate(()=>!!document.querySelector('#adImp [data-autodrive]'))))throw new Error('auto toggle missing in import page');
await p.click('#driveList');await p.waitForTimeout(500);const st=await p.evaluate(()=>document.querySelector('#driveState').textContent);const n=await p.evaluate(()=>document.querySelectorAll('#driveFiles input').length);
if(n!==12)throw new Error(`listed ${n}: ${st}`);if(variant==='folder'&&!/Siêu Từ Điển - RAW/.test(st))throw new Error('wrong folder '+st);
await p.screenshot({path:`ds-${nm}-list.png`});
// tự đồng bộ: bật lúc trước 6h thì chưa chạy, sau 6h thì chạy một lần trong ngày
const due=await p.evaluate(()=>{autoDrive.on=true;autoDrive.last='';const a=autoDriveDue(new Date(2026,10,1,5,59)),b=autoDriveDue(new Date(2026,10,1,6,0));autoDrive.last='2026-11-01';const c=autoDriveDue(new Date(2026,10,1,9,0)),d=autoDriveDue(new Date(2026,10,2,6,30));autoDrive.last='';return[a,b,c,d].join()});
if(due!=='false,true,false,true')throw new Error('due logic '+due);
await p.evaluate(()=>autoDriveRun(true));await p.waitForTimeout(1500);const ad=await p.evaluate(()=>({...autoDrive,words:words.length}));
if(!ad.lastAt||!/12 tệp/.test(ad.msg))throw new Error('auto run '+JSON.stringify(ad));
await p.evaluate(()=>{acctTab='set';show('acct')});await p.waitForTimeout(200);if(!(await p.evaluate(()=>!!document.querySelector('#acct [data-autodrive]'))))throw new Error('settings toggle');
// chọn dòng họ + đồng bộ Drive trong Nhập liệu gia phả
await p.evaluate(()=>{gpSrc='fam';ls.set('gpsrc2','fam');goSlot('gp','view')});await p.waitForTimeout(300);
const nHo=await p.evaluate(()=>document.querySelectorAll('#gpbar [data-gpho] option').length);if(nHo<30)throw new Error('surname options '+nHo);
await p.selectOption('#gpbar [data-gpho]','tran');await p.waitForTimeout(300);
const ho=await p.evaluate(()=>[gpHo,famColName(),lineName(),document.querySelector('#gpbar').innerText.includes('họ Trần')]);if(ho.join()!=='tran,people_tran,lineage_tran,true')throw new Error('ho '+ho);
await p.evaluate(()=>{gpi.open=true;renderGpi()});await p.waitForTimeout(150);if(!(await p.evaluate(()=>!!document.querySelector('#gpiDrive #clanSync')&&!!document.querySelector('#gpiDrive [data-autodrive]')&&/Đồng bộ họ Trần/.test(document.querySelector('#gpiDrive').innerText))))throw new Error('drive card in gp import');
await p.screenshot({path:`ds-${nm}-gpi.png`});await p.evaluate(()=>{gpi.open=false;renderGpi();hoSet('le')});
console.log(nm,variant,'listed',n,'msg',ad.msg,'sw',await p.evaluate(()=>document.documentElement.scrollWidth),'errs',JSON.stringify(errs));await ctx.close()}await b.close()})().catch(e=>{console.log('Error',e.message);process.exit(1)});
