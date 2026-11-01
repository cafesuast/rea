// Tra từ khi để chuột 2 giây, thanh công cụ khi bôi chọn chữ, Skill · Tool · Plugin, giao diện tối giản
const fs0=require('fs'),path0=require('path');const OUT=path0.join(__dirname,'out');fs0.mkdirSync(OUT,{recursive:true});process.chdir(OUT);
const FILE=process.env.SGP_FILE||path0.join(__dirname,'..','index.html');
const {chromium}=require('playwright');(async()=>{const b=await chromium.launch();
for(const [W,H,nm] of [[1280,860,'d'],[390,820,'m']]){const ctx=await b.newContext({viewport:{width:W,height:H},hasTouch:nm==='m'});const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>{errs.push(e.message);if(process.env.DBG)console.log(e.stack)});
await p.addInitScript(()=>{localStorage.setItem('stdien:guideSeen','1')});
await p.goto('file://'+FILE);await p.waitForTimeout(700);
await p.evaluate(()=>{sample=Object.assign(async m=>({text:'KQ: '+String(m[0].content).slice(0,40)}),{json:async()=>({vi:'nghĩa do AI',en:'ai word',note:''})})});
// giao diện tối giản: header không còn nút ? và trợ năng, thanh bên chỉ 4 mục hằng ngày
const hdr=await p.evaluate(()=>['#helpBtn','#a11yBtn','#envPill'].map(s=>getComputedStyle(document.querySelector(s)).display));if(hdr.some(d=>d!=='none'))throw new Error('header not minimal '+hdr);
await p.evaluate(()=>goSlot('gp','chat'));const nGp=await p.evaluate(()=>[...document.querySelectorAll('#secnav .nav')].filter(b=>b.offsetParent).length);
await p.evaluate(()=>goSlot('td','learn'));await p.waitForTimeout(150);const nTd=await p.evaluate(()=>[...document.querySelectorAll('#secnav .nav')].filter(b=>b.offsetParent&&b.dataset.slot.startsWith('td')).length);
if(nm==='d'&&(nGp!==4||nTd!==4))throw new Error(`nav items gp ${nGp} td ${nTd}`);
await p.evaluate(()=>goSlot('td','cal'));await p.waitForTimeout(100);if(nm==='d'&&!(await p.evaluate(()=>!document.querySelector('.navrest').hidden)))throw new Error('rest group should open for active slot');
// tra từ khi để chuột (chỉ máy có chuột)
await p.evaluate(()=>goSlot('td','learn'));await p.waitForTimeout(150);
if(!(await p.evaluate(()=>!!document.querySelector('#v-lessons>.hovsw'))))throw new Error('hover switch bar missing');
await p.evaluate(()=>{const d=document.createElement('p');d.id='tp';d.style.cssText='font-size:22px;padding:20px';d.textContent='Hello friend, đây là cuốn gia phả của nhà tôi.';document.querySelector('#lessons').prepend(d)});
const rectOf=w=>p.evaluate(w=>{const n=document.querySelector('#tp').firstChild,i=n.data.indexOf(w),r=document.createRange();r.setStart(n,i);r.setEnd(n,i+w.length);const b=r.getBoundingClientRect();return{x:b.left+b.width/2,y:b.top+b.height/2}},w);
if(nm==='d'){let c=await rectOf('Hello');await p.mouse.move(c.x,c.y);await p.mouse.move(c.x+1,c.y);await p.waitForTimeout(800);
  if(await p.evaluate(()=>{const n=document.querySelector('#hovPop');return !!n&&!n.hidden}))throw new Error('popup shown before 2s');
  await p.waitForTimeout(1600);let t=await p.evaluate(()=>{const n=document.querySelector('#hovPop');return n&&!n.hidden?n.innerText:''});if(!/xin chào/.test(t))throw new Error('hover EN lookup: '+t);
  await p.screenshot({path:`tl-${nm}-hover.png`});
  c=await rectOf('phả');await p.mouse.move(c.x,c.y);await p.mouse.move(c.x+1,c.y);await p.waitForTimeout(2400);t=await p.evaluate(()=>document.querySelector('#hovPop').hidden?'':document.querySelector('#hovPop').innerText);
  if(!/Từ điển gia phả/i.test(t)||!/gia phả/.test(t))throw new Error('hover gia pha lookup: '+t);
  c=await rectOf('cuốn');await p.mouse.move(c.x,c.y);await p.mouse.move(c.x+1,c.y);await p.waitForTimeout(2400);await p.click('[data-hp="ai"]');await p.waitForTimeout(150);
  t=await p.evaluate(()=>document.querySelector('#hovPop').innerText);if(!/nghĩa do AI/.test(t))throw new Error('AI fallback: '+t);
  await p.keyboard.press('Escape');
  await p.evaluate(()=>{a11y.hover=false;saveA11y()});c=await rectOf('Hello');await p.mouse.move(c.x,c.y);await p.mouse.move(c.x+1,c.y);await p.waitForTimeout(2300);
  if(await p.evaluate(()=>!document.querySelector('#hovPop').hidden))throw new Error('hover should be off');await p.evaluate(()=>{a11y.hover=true;saveA11y()})}
// bôi chọn chữ: thanh công cụ
await p.evaluate(()=>{const n=document.querySelector('#tp').firstChild,i=n.data.indexOf('Hello'),r=document.createRange();r.setStart(n,i);r.setEnd(n,i+5);const s=getSelection();s.removeAllRanges();s.addRange(r)});
await p.waitForTimeout(500);if(await p.evaluate(()=>document.querySelector('#selBar')?.hidden!==false))throw new Error('selection toolbar not shown');
await p.screenshot({path:`tl-${nm}-sel.png`});
await p.click('[data-sb="look"]');await p.waitForTimeout(100);if(!/xin chào/.test(await p.evaluate(()=>document.querySelector('#hovPop').innerText)))throw new Error('sel look');
await p.click('[data-sb="sk"]');await p.waitForTimeout(100);const nSk=await p.evaluate(()=>document.querySelectorAll('#skMenu [data-skrun]').length);if(nSk<8)throw new Error('skill menu '+nSk);
await p.click('#skMenu [data-skrun="b_tr"]');await p.waitForTimeout(200);const so=await p.evaluate(()=>document.querySelector('#skOut').innerText);if(!/KQ: Dịch đoạn sau/.test(so)||!/Hello/.test(so))throw new Error('skill run: '+so);
await p.screenshot({path:`tl-${nm}-skill.png`});await p.click('[data-so="x"]');
// tạo skill + tool, xuất plugin
await p.evaluate(()=>{acctTab='sk';show('acct')});await p.waitForTimeout(200);
await p.click('[data-sknewk="skill"]');await p.click('[data-sktpl="2"]');await p.click('#skSave');await p.waitForTimeout(150);
await p.click('[data-sknewk="tool"]');await p.fill('#skName','Tra Cambridge');await p.fill('#skUrl','javascript:alert(1)');await p.click('#skSave');await p.waitForTimeout(100);
{const n=await p.evaluate(()=>skMine.length);if(n!==1)throw new Error('unsafe url accepted '+n)};
await p.fill('#skUrl','https://dictionary.cambridge.org/search/english/?q={text}');await p.click('#skSave');await p.waitForTimeout(150);
if(await p.evaluate(()=>skMine.length)!==2)throw new Error('tool not saved');
await p.screenshot({path:`tl-${nm}-manage.png`,fullPage:true});
const inMenu=await p.evaluate(()=>{skMenu('word');return [...document.querySelectorAll('#skMenu [data-skrun]')].map(b=>b.innerText).join('|')});if(!/Mẹo nhớ từ/.test(inMenu)||!/Tra Cambridge/.test(inMenu))throw new Error('custom items not in menu');
await p.keyboard.press('Escape');
const plug=await p.evaluate(()=>JSON.stringify({type:'sieu-giapha-plugin',version:1,name:'Thử',items:skMine.map(x=>skClean(x)).concat([{kind:'tool',name:'Xấu',type:'url',url:'http://x'}])}));
await p.setInputFiles('#skImport',{name:'p.json',mimeType:'application/json',buffer:Buffer.from(plug)});await p.waitForTimeout(300);
if(await p.evaluate(()=>skMine.length)!==4)throw new Error('plugin import count '+await p.evaluate(()=>skMine.length));
// ✨ menu có skill
await p.evaluate(()=>goSlot('td','chat'));await p.click('#upBtn');await p.waitForTimeout(100);if(!(await p.evaluate(()=>!!document.querySelector('[data-up="sk:b_tr"]'))))throw new Error('skill in ✨ menu');await p.keyboard.press('Escape');
// cài đặt
await p.evaluate(()=>{acctTab='set';show('acct')});await p.waitForTimeout(150);if(!(await p.evaluate(()=>!!document.querySelector('[data-set="hover"]')&&!!document.querySelector('[data-setv="hovMs:3000"]'))))throw new Error('settings group');
await p.click('[data-setv="hovMs:3000"]');if(await p.evaluate(()=>a11y.hovMs)!==3000)throw new Error('hovMs');
// bộ lọc tra cứu gọn
await p.evaluate(()=>goSlot('td','view'));await p.waitForTimeout(100);if(await p.evaluate(()=>getComputedStyle(document.querySelector('#fDomain')).display)!=='none')throw new Error('filters should be folded');
await p.click('#lkFilt');if(await p.evaluate(()=>getComputedStyle(document.querySelector('#fDomain')).display)==='none')throw new Error('filters toggle');
await p.evaluate(()=>goSlot('td','chat'));await p.screenshot({path:`tl-${nm}-home.png`});await p.evaluate(()=>goSlot('gp','chat'));await p.waitForTimeout(200);await p.screenshot({path:`tl-${nm}-gp.png`});
console.log(nm,'sw',await p.evaluate(()=>document.documentElement.scrollWidth),'errs',JSON.stringify(errs));await ctx.close()}await b.close()})().catch(e=>{console.log('Error',e.message);process.exit(1)});
