// Mọi tính năng bị thu gọn vẫn mở được: bảng Tất cả tính năng, ô tìm kiếm hiểu tên tính năng, các lối vào thay thế
const fs0=require('fs'),path0=require('path');const OUT=path0.join(__dirname,'out');fs0.mkdirSync(OUT,{recursive:true});process.chdir(OUT);
const FILE=process.env.SGP_FILE||path0.join(__dirname,'..','index.html');
const {chromium}=require('playwright');(async()=>{const b=await chromium.launch();
for(const [W,H,nm] of [[1280,860,'d'],[390,820,'m']]){const p=await b.newPage({viewport:{width:W,height:H}});const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.addInitScript(()=>{localStorage.setItem('stdien:guideSeen','1');localStorage.setItem('stdien:gpsrc2','"fam"')});
await p.goto('file://'+FILE);await p.waitForTimeout(800);
const sig=()=>p.evaluate(()=>[view,typeof gpSlot!=='undefined'?gpSlot:'',acctTab,[...document.querySelectorAll('body>.menu')].filter(m=>!m.hidden&&m.getClientRects().length&&!m.classList.contains('upmenu')).length,document.querySelector('#toast').classList.contains('show')?document.querySelector('#toast').textContent:'',!document.querySelector('#upMenu')?.hidden,!document.querySelector('#gpImp')?.hidden,!document.querySelector('#gpHist')?.hidden,!document.querySelector('#detail')?.hidden,!!document.querySelector('.gphost')?.shadowRoot?.querySelector('.menu,.modal:not([hidden]),dialog[open]'),!!document.querySelector('#cpSheet:not([hidden])'),!!document.querySelector('#gpCmp:not([hidden])')].join('|'));
const n=await p.evaluate(()=>FEATS.length);let ok=0;const dead=[];
for(let i=0;i<n;i++){let hit=false;for(const base of ['help','review']){await p.evaluate(v=>{closeMenu?.();upOpen(false);gpCloseOver?.();show(v);document.querySelector('#toast').classList.remove('show');document.querySelector('#detail').hidden=true;const f=document.querySelector('#featSheet');if(f)f.hidden=true;const c=document.querySelector('#cpSheet');if(c)c.hidden=true;const g=document.querySelector('#gpCmp');if(g)g.hidden=true},base);await p.waitForTimeout(60);const before=await sig();
  await p.evaluate(i=>featRun(i),i);await p.waitForTimeout(350);if((await sig())!==before){hit=true;break}}if(hit)ok++;else dead.push(await p.evaluate(i=>FEATS[i][2],i))}
if(dead.length)throw new Error('features with no visible effect: '+dead.join('; '));
// tìm theo tên tính năng
await p.evaluate(()=>goSlot('td','learn'));await p.fill('#gsQ','xuất từ điển');await p.keyboard.press('Enter');await p.waitForTimeout(200);
if(!(await p.evaluate(()=>!!document.querySelector('#upRes [data-feat]'))))throw new Error('search does not show features');await p.keyboard.press('Escape');
// ✨ menu có “Tất cả tính năng”
await p.evaluate(()=>upOpen(true));await p.click('[data-up="featall"]');await p.waitForTimeout(100);if(await p.evaluate(()=>document.querySelector('#featSheet').hidden))throw new Error('feature sheet');
await p.fill('#fsQ','sao lưu');await p.waitForTimeout(80);const hits=await p.evaluate(()=>document.querySelectorAll('#featSheet [data-feat]').length);if(!hits)throw new Error('sheet filter');
await p.screenshot({path:`hf-${nm}-sheet.png`});await p.keyboard.press('Escape');
// xuất từ điển trong Sổ tay, trợ năng ở chân thanh bên, sao lưu gia phả mở menu đúng chỗ
await p.evaluate(()=>goSlot('td','more'));await p.waitForTimeout(150);await p.click('#nbDictExp');await p.waitForTimeout(100);if(!(await p.evaluate(()=>[...document.querySelectorAll('body>.menu')].some(m=>/Markdown/.test(m.innerText)))))throw new Error('dict export menu');
await p.evaluate(()=>closeMenu());
await p.evaluate(()=>{$("#app").classList.add('drawer')});await p.waitForTimeout(100);await p.click('#sideA11y');await p.waitForTimeout(100);if(!(await p.evaluate(()=>[...document.querySelectorAll('body>.menu')].some(m=>/trợ năng/i.test(m.innerText)))))throw new Error('a11y menu');
await p.evaluate(()=>{closeMenu();$("#app").classList.remove('drawer')});
await p.evaluate(()=>goSlot('gp','more'));await p.waitForTimeout(400);await p.click('#gpxBackup');await p.waitForTimeout(150);const bm=await p.evaluate(()=>{const m=document.querySelector('.gphost').shadowRoot.querySelector('.menu');if(!m)return null;const r=m.getBoundingClientRect();return[r.left,r.top,r.width]});
if(!bm||bm[2]<50)throw new Error('backup menu '+JSON.stringify(bm));await p.screenshot({path:`hf-${nm}-backup.png`});
if(nm==='d'){await p.evaluate(()=>goSlot('td','chat'));await p.click('#navMore');await p.waitForTimeout(100);if(!(await p.evaluate(()=>getComputedStyle(document.querySelector('#stats')).display!=='none')))throw new Error('stats under Thêm mục');}
console.log(nm,'features',ok+'/'+n,'sw',await p.evaluate(()=>document.documentElement.scrollWidth),'errs',JSON.stringify(errs));await p.close()}await b.close()})().catch(e=>{console.log('Error',e.message);process.exit(1)});
