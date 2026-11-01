// v23: nhận biết máy tính / điện thoại, chế độ quét tài liệu & chữ viết tay, toàn màn hình, menu tự thu gọn sau 3s, chọn bên trái/phải
const fs0=require('fs'),path0=require('path');const OUT=path0.join(__dirname,'out');fs0.mkdirSync(OUT,{recursive:true});process.chdir(OUT);
const FILE=process.env.SGP_FILE||path0.join(__dirname,'..','index.html');
const {chromium}=require('playwright');(async()=>{const b=await chromium.launch();const fail=m=>{throw new Error(m)};
for(const [W,H,nm,mob] of [[1280,860,'d',false],[390,820,'m',true]]){
  const ctx=await b.newContext({viewport:{width:W,height:H},hasTouch:mob,userAgent:mob?'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) Mobile/15E148':undefined});const errs=[];
  await ctx.addInitScript(()=>{localStorage.setItem('stdien:guideSeen','1');localStorage.setItem('stdien:clanProf',JSON.stringify({country:'Việt Nam',ho:'Lê',toc:'Không biết',chi:'Không biết',nhanh:'Không biết',dong:'Không biết',doi:'Không biết',terms:{v:1,at:'2026-11-01T00:00:00Z'}}))});
  const p=await ctx.newPage();p.on('pageerror',e=>errs.push(e.message));await p.goto('file://'+FILE);await p.waitForTimeout(900);
  const dev=await p.evaluate(()=>document.documentElement.dataset.dev);if(dev!==(mob?'mobile':'pc'))fail('dev '+dev);
  if(!(await p.$('#fsBtn')))fail('no fsBtn');
  if(!mob){// menu trái thu gọn sau 3 giây
    await p.mouse.move(700,400);await p.waitForTimeout(3400);if(!(await p.evaluate(()=>document.querySelector('#app').classList.contains('navless'))))fail('nav not collapsed');
    await p.mouse.move(3,400);await p.waitForTimeout(150);if(!(await p.evaluate(()=>document.querySelector('#app').classList.contains('peek'))))fail('no peek');
    await p.mouse.move(700,400);await p.waitForTimeout(3400);if(!(await p.evaluate(()=>document.querySelector('#app').classList.contains('navless'))))fail('not re-collapsed');}
  // toàn màn hình (trong khung kiểm thử: chế độ tập trung hoặc fullscreen API)
  await p.evaluate(()=>fsToggle());await p.waitForTimeout(300);if(!(await p.evaluate(()=>fsOn())))fail('fs on');
  await p.evaluate(()=>fsToggle());await p.waitForTimeout(300);if(await p.evaluate(()=>fsOn()))fail('fs off');
  // quét tài liệu: chip chế độ trong nhập liệu gia phả
  await p.evaluate(()=>gpPrivOpen());await p.waitForTimeout(500);await p.evaluate(()=>{if(!gpi.open){gpi.open=true;renderGpi()}});await p.waitForTimeout(300);
  const chips=await p.evaluate(()=>document.querySelectorAll('#gpImp .scanmode [data-scan]').length);if(chips!==3)fail('scan chips '+chips);
  await p.evaluate(()=>document.querySelector('#gpImp [data-scan="hand"]').click());await p.waitForTimeout(200);
  const sc=await p.evaluate(async()=>{const c=document.createElement('canvas');c.width=120;c.height=80;const g=c.getContext('2d');g.fillStyle='#d8cfa8';g.fillRect(0,0,120,80);g.fillStyle='#333';g.font='20px serif';g.fillText('Lê Huy',10,45);
    const bl=await new Promise(r=>c.toBlob(r,'image/png'));const f=new File([bl],'trang.png',{type:'image/png'});const a=await scanEnhance(f,'doc'),h=await scanEnhance(f,'hand'),ph=await scanEnhance(f,'photo'),again=await scanMaybe(a);
    return{lay:lay.scan,a:a.name,h:h.name,t:a.type,ph:ph.name,again:again===a}});
  if(sc.lay!=='hand'||sc.a!=='trang-scan.jpg'||sc.h!=='trang-scan.jpg'||sc.t!=='image/jpeg'||sc.ph!=='trang.png'||!sc.again)fail('scan '+JSON.stringify(sc));
  await p.screenshot({path:`dv-${nm}-scan.png`});
  // Cài đặt › Màn hình & thiết bị
  await p.evaluate(()=>{acctTab='set';show('acct')});await p.waitForTimeout(500);if(!(await p.$('#layBox')))fail('no layBox');
  await p.click('[data-lay="navSide:right"]');await p.waitForTimeout(150);if(!(await p.evaluate(()=>document.querySelector('#app').classList.contains('navright'))))fail('navright');
  await p.click('[data-lay="navSide:left"]');await p.click('[data-lay="right:float"]');await p.waitForTimeout(150);
  await p.evaluate(()=>goSlot('gp','view'));await p.waitForTimeout(500);
  const rp=await p.evaluate(()=>document.querySelector('.gphost')?.shadowRoot?.getElementById('rpStyle')?.textContent||'');if(mob?rp!=='':!rp.includes('position:fixed'))fail('rp '+rp.slice(0,40));
  if(await p.evaluate(()=>document.documentElement.scrollWidth)>W)fail('overflow');
  await p.screenshot({path:`dv-${nm}-gp.png`});
  console.log(nm,'device ok',dev,'sw',await p.evaluate(()=>document.documentElement.scrollWidth),'errs',JSON.stringify(errs));await ctx.close()}
await b.close()})().catch(e=>{console.log('Error',e.message);process.exit(1)});
