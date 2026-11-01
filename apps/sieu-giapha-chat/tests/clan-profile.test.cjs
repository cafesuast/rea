// Hồ sơ dòng họ khi đăng ký (quốc gia, họ, tộc, chi, nhánh, dòng, đời, có "Không biết") + quét ảnh gia phả từ thư mục Google Drive theo lô
const fs0=require('fs'),path0=require('path');const OUT=path0.join(__dirname,'out');fs0.mkdirSync(OUT,{recursive:true});process.chdir(OUT);
const FILE=process.env.SGP_FILE||path0.join(__dirname,'..','index.html');
const {chromium}=require('playwright');(async()=>{const b=await chromium.launch();
for(const [W,H,nm] of [[1280,860,'d'],[390,820,'m']]){const ctx=await b.newContext({viewport:{width:W,height:H}});const errs=[];
await ctx.addInitScript(()=>{localStorage.setItem('stdien:guideSeen','1');window.__calls=[];window.__prompts=[];
  const img=()=>{const c=document.createElement('canvas');c.width=60;c.height=80;const g=c.getContext('2d');g.fillStyle='#fff';g.fillRect(0,0,60,80);g.fillStyle='#000';g.fillText('Đời 9',5,20);return c.toDataURL('image/jpeg').split(',')[1]};
  const folder={id:'G1',title:'GIAPHA LE BOIKE',mimeType:'application/vnd.google-apps.folder'},sub={id:'S1',title:'Chi Giáp',mimeType:'application/vnd.google-apps.folder'};
  const kids=[...Array(7)].map((_,i)=>({id:'i'+i,title:`IMG_${10-i}.jpg`,mimeType:'image/jpeg'})).concat([sub,{id:'t',title:'ghi chu.txt',mimeType:'text/plain'}]);
  const page=(arr,tok)=>{const s=+(tok||0);return{files:arr.slice(s,s+4),nextPageToken:s+4<arr.length?String(s+4):undefined}};
  const mcp={async callTool(s,t,a){__calls.push(t+':'+(a.query||a.fileId));let r;
    if(t==='search_files'){if(/folder/.test(a.query))r=/BOIKE/.test(a.query)?{files:[{id:'X',title:'GIAPHA khác',mimeType:folder.mimeType},folder]}:{files:[]};
      else if(/parentId = 'G1'/.test(a.query))r=page(kids,a.pageToken);else if(/parentId = 'S1'/.test(a.query))r={files:[{id:'s0',title:'trang 127.jpg',mimeType:'image/jpeg'}]};else r={files:[]}}
    else if(t==='download_file_content')r={id:a.fileId,mimeType:'image/jpeg',title:a.fileId,content:img()};
    return{content:[{type:'text',text:JSON.stringify(r)}]}}};
  const sample={limits:async()=>({images:true}),json:async(p,o)=>{__prompts.push(p);const n=__prompts.length;return{text:'Đời thứ '+n,people:[{key:'p1',name:'Lê Huy Thử '+n,gender:'m',generation:String(8+n)}],warnings:[]}}};
  const user={id:async()=>'u1',me:async()=>({name:'Người thử'}),profiles:async()=>({})};
  window.claude={use:async n=>n==='mcp'?mcp:n==='sample'?sample:n==='user'?user:null}});
const p=await ctx.newPage();p.on('pageerror',e=>errs.push(e.message+(process.env.DBG?e.stack:'')));await p.goto('file://'+FILE);
// lần đầu đăng nhập: tự mở bảng chọn hồ sơ dòng họ
await p.waitForSelector('#cpSheet:not([hidden])',{timeout:6000});await p.screenshot({path:`cp-${nm}-sheet.png`});
const nf=await p.evaluate(()=>['country','ho','toc','chi','nhanh','dong','doi'].filter(k=>document.querySelector('#cp_'+k)).length);if(nf!==7)throw new Error('fields '+nf);
await p.fill('#cp_toc','Tộc Lê (Bối Khê)');await p.fill('#cp_doi','16');await p.uncheck('#cp_lineGo');
await p.click('#cpSave');const miss=await p.evaluate(()=>[document.querySelectorAll('#cpSheet .cpf.miss').length,document.querySelector('#cpSheet .cpmsg').textContent]);
if(miss[0]!==3||!/Chi/.test(miss[1]))throw new Error('validation '+miss);
await p.click('[data-cpkb="chi"]');await p.click('#cpAllKb');await p.click('#cpSave');await p.waitForTimeout(200);
const cp=await p.evaluate(()=>({prof:clanProf,ho:gpHo,hidden:document.querySelector('#cpSheet').hidden,row:document.querySelector('#profRow small').textContent}));
if(!cp.hidden||cp.prof.chi!=='Không biết'||cp.prof.nhanh!=='Không biết'||cp.prof.country!=='Việt Nam'||cp.ho!=='le'||!/Tộc Lê \(Bối Khê\) · Đời 16/.test(cp.row))throw new Error('saved '+JSON.stringify(cp));
await p.evaluate(()=>{acctTab='set';show('acct')});await p.waitForTimeout(300);if(!(await p.evaluate(()=>/Bối Khê/.test(document.querySelector('#cpRow')?.innerText||''))))throw new Error('settings row');
// sửa lại từ Cài đặt, đổi họ khác
await p.evaluate(()=>document.querySelector('#cpRow [data-cpopen]').click());await p.selectOption('#cp_ho','__o');await p.fill('#cp_ho_o','Lã');await p.click('#cpSave');await p.waitForTimeout(200);
if(await p.evaluate(()=>hoName()+'|'+gpHo)!=='Lã|la2')throw new Error('custom ho '+await p.evaluate(()=>hoName()+'|'+gpHo));
await p.evaluate(()=>{cpOpen(false)});await p.selectOption('#cp_ho','Lê');await p.click('#cpSave');
// quét thư mục Drive theo lô
await p.evaluate(()=>gpPrivOpen());await p.waitForTimeout(300);if(!(await p.evaluate(()=>!!document.querySelector('#gpiDrive #gdScan')&&document.querySelector('#gdFolder').value==='GIAPHA LE BOIKE')))throw new Error('scan box');
await p.selectOption('#gdBatch','5');
await p.click('#gdScan');await p.waitForFunction(()=>!gd.busy&&gpi.pages.length>0,null,{timeout:8000});
const s1=await p.evaluate(()=>({n:gpi.pages.length,names:gpi.pages.map(x=>x.name),msg:gd.msg,src:gpSrc}));
if(s1.n!==5||s1.names[0]!=='IMG_4.jpg'||!/Còn 3 ảnh/.test(s1.msg)||s1.src!=='mine')throw new Error('batch1 '+JSON.stringify(s1));
await p.screenshot({path:`cp-${nm}-scan.png`});
await p.evaluate(()=>gpiRunImages());await p.waitForFunction(()=>!!gpi.res&&!gpi.busy,null,{timeout:8000});
const pr=await p.evaluate(()=>({n:gpi.res.people.length,p:__prompts[0]}));if(pr.n!==5||!/Tộc Lê \(Bối Khê\)/.test(pr.p)||!/SƠ ĐỒ CÂY/.test(pr.p))throw new Error('read '+pr.n+' '+pr.p.slice(-400));
await p.evaluate(()=>{gpi.res=null;gpi.pages=[];renderGpi()});await p.click('#gdScan');await p.waitForFunction(()=>!gd.busy&&gpi.pages.length>0,null,{timeout:8000});
const s2=await p.evaluate(()=>({names:gpi.pages.map(x=>x.name),msg:gd.msg}));if(s2.names.join()!=='IMG_9.jpg,IMG_10.jpg,trang 127.jpg'||!/Đã lấy hết/.test(s2.msg))throw new Error('batch2 '+JSON.stringify(s2));
// không thấy thư mục: gợi ý thư mục gần giống
await p.evaluate(()=>{gpi.pages=[];renderGpi()});await p.fill('#gdFolder','GIAPHA TRAN');await p.click('#gdScan');await p.waitForFunction(()=>!gd.busy,null,{timeout:8000});
if(!/Không tìm thấy|gần giống/.test(await p.evaluate(()=>gd.msg)))throw new Error('notfound '+await p.evaluate(()=>gd.msg));
// tính năng tìm được trong ✨ Tất cả tính năng
if(!(await p.evaluate(()=>featFind('hồ sơ dòng họ').length&&featFind('quét ảnh').length)))throw new Error('feats');
console.log(nm,'calls',await p.evaluate(()=>__calls.length),'sw',await p.evaluate(()=>document.documentElement.scrollWidth),'errs',JSON.stringify(errs));await ctx.close()}await b.close()})().catch(e=>{console.log('Error',e.message);process.exit(1)});
