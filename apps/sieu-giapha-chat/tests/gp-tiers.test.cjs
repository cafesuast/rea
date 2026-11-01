// 4 tầng gia phả (Cá nhân 8 đời, Riêng 20 đời, Dòng họ chung, Lịch sử) + mã ráp nối + đối chiếu 3 nguồn + chia sẻ & đồng bộ
const fs0=require('fs'),path0=require('path');const OUT=path0.join(__dirname,'out');fs0.mkdirSync(OUT,{recursive:true});process.chdir(OUT);
const FILE=process.env.SGP_FILE||path0.join(__dirname,'..','index.html');
const {chromium}=require('playwright');(async()=>{const b=await chromium.launch();
for(const [W,H,nm] of [[1280,860,'d'],[390,820,'m']]){const ctx=await b.newContext({viewport:{width:W,height:H}});const errs=[];
await ctx.addInitScript(()=>{localStorage.setItem('stdien:guideSeen','1');localStorage.setItem('sgpm:me','"p9"');localStorage.setItem('stdien:gpsrc2','"mine"');
  localStorage.setItem('stdien:clanProf',JSON.stringify({country:'Việt Nam',ho:'Lê',toc:'Tộc Lê (Bối Khê)',chi:'Không biết',nhanh:'Không biết',dong:'Không biết',doi:'16',consent:{on:true,v:1,at:'2026-11-01T00:00:00Z'}}));
  const priv={};for(let i=1;i<=14;i++)priv['p'+i]={name:'Lê Văn A'+i,gender:'m',fatherId:i>1?'p'+(i-1):'',birth:String(i>8?1900+i*8:1600+i*30),death:i<=8?String(1650+i*30):'',spouseIds:[]};
  priv.p2.birth='1730';priv.p1.deathLunar='';
  const store=window.__store={'data/users/u_A/fam/people':priv,
    people:{fX_a:{name:'Lê Văn A1',birth:'1630',deathLunar:'12/03',code:'LE-BOIKHE-D8-VANA1'},fX_b:{name:'Lê Văn A2',birth:'1735',code:'LE-BOIKHE-D9-VANA2'}},
    lineage_le:{q3:{name:'Lê Văn A3',death:'1740',notes:'Nguồn: Wikidata'},q9:{name:'Lê Thánh Tông',src:'Viện Hán Nôm'}}};
  const subs=[];const merge=(a,b)=>{for(const k in b)a[k]=b[k];return a};
  const list=c=>Object.entries(store[c]||{}).map(([id,d])=>({id,data:()=>JSON.parse(JSON.stringify(d))}));
  const fire=c=>subs.filter(s=>s.c===c).forEach(s=>s.cb({docs:list(c)}));
  const docRef=(c,id)=>({async set(d){(store[c]=store[c]||{})[id]=JSON.parse(JSON.stringify(d));fire(c)},async update(d){merge(store[c][id],d);fire(c)},async delete(){delete store[c]?.[id];fire(c)},async get(){return{exists:!!store[c]?.[id],data:()=>store[c]?.[id]}}});
  const col=c=>({orderBy:()=>col(c),limit:()=>col(c),onSnapshot(cb){const s={c,cb};subs.push(s);setTimeout(()=>fire(c),5);return()=>{subs.splice(subs.indexOf(s),1)}},doc:id=>docRef(c,id)});
  const db={collection:c=>col(c),doc:p=>{const a=p.split('/');return docRef(a.slice(0,-1).join('/'),a.at(-1))}};
  const user={id:async()=>'u_A',me:async()=>({id:'u_A',name:'An'}),can:async()=>true,profiles:async()=>({})};
  window.claude={use:async n=>n==='db'?db:n==='user'?user:null}});
const p=await ctx.newPage();p.on('pageerror',e=>errs.push(e.message));await p.goto('file://'+FILE);await p.waitForTimeout(900);
await p.evaluate(()=>goSlot('gp','view'));await p.waitForTimeout(400);
const tabs=await p.evaluate(()=>[...document.querySelectorAll('#gpbar [data-gpsrc]')].map(b=>b.dataset.gpsrc).join());if(tabs!=='me4,mine,fam,le')throw new Error('tabs '+tabs);
const n20=await p.evaluate(()=>gpApi.people.length);
await p.evaluate(()=>document.querySelector('#gpbar [data-gpsrc="me4"]').click());await p.waitForTimeout(500);
const n8=await p.evaluate(()=>[gpApi.people.length,gpApi.people.map(x=>x.id).sort().join(),document.querySelector('#gpbar').textContent.includes('8 đời')]);
if(n20!==14||n8[0]!==9||!n8[2])throw new Error('tiers '+n20+' '+n8);await p.evaluate(()=>gpApi.put('p5',{name:'Lê Văn A5',gender:'m',birth:'1750',death:'1800',fatherId:'',spouseIds:[]}));await p.waitForTimeout(100);if(await p.evaluate(()=>__store['data/users/u_A/fam/people'].p5.fatherId)!=='p4')throw new Error('hidden father link lost');
await p.screenshot({path:`t-${nm}-me4.png`});if(!(await p.evaluate(()=>document.querySelector('.gphost').shadowRoot.querySelectorAll('[data-p]').length>=9)))throw new Error('tree empty in me4');
if(await p.evaluate(()=>document.documentElement.scrollWidth)>W)throw new Error('overflow');
// đối chiếu 3 nguồn
await p.evaluate(()=>document.querySelector('[data-gpcmp]').click());await p.waitForFunction(()=>gpCmpRes&&!gpCmpBusy,null,{timeout:8000});
const r=await p.evaluate(()=>{const R=gpCmpRes;const g=id=>R.rows.find(x=>x.id===id);return{sum:R.sum,p1:g('p1'),p2:g('p2'),p3:g('p3'),p14:g('p14')}});
if(r.sum.n!==14||r.p1.code!=='LE-BOIKHE-D8-VANA1'||r.p1.st!=='ok'||r.p2.st!=='bad'||r.p3.st!=='ok'||r.p3.htype!=='open'||r.p14.st!=='none'||!r.p14.missing.length||!r.p1.fill.deathLunar)throw new Error('compare '+JSON.stringify(r).slice(0,900));
if(!(r.sum.agree>=2&&r.sum.conflict>=1&&r.sum.ht.open===1&&r.sum.ht.state===1))throw new Error('sum '+JSON.stringify(r.sum));
await p.screenshot({path:`t-${nm}-cmp.png`});
await p.click('[data-gpcfill="p1:deathLunar"]');await p.waitForTimeout(200);if(await p.evaluate(()=>__store['data/users/u_A/fam/people'].p1.deathLunar)!=='12/03')throw new Error('fill');
await p.fill('#gpcQ','D8');await p.waitForTimeout(100);if(await p.evaluate(()=>document.querySelectorAll('.gpc-row').length)!==1)throw new Error('code search');
// chia sẻ & đồng bộ: chỉ người đã mất ngoài 4 đời gần nhất, kèm mã
await p.evaluate(()=>document.querySelector('#gpCmp details.gpc-set').open=true);await p.click('#gpCmp [data-gpsync]');await p.waitForTimeout(600);
const sh=await p.evaluate(()=>{const fam=ls.get('famCode');const d=Object.entries(__store.people).filter(([k])=>k.startsWith(fam+'_'));return{ids:d.map(([k])=>k.split('_')[1]).sort().join(),codes:d.every(([,v])=>/^LE-BOIKHE-D\d+-VANA\d+$/.test(v.code)),on:gpSync.on}});
if(sh.ids!=='p1,p2,p3,p4,p5,p6,p7,p8'||!sh.codes||!sh.on)throw new Error('share '+JSON.stringify(sh));
const due=await p.evaluate(()=>{gpChk.bot='week';gpChk.lastBot='2026-10-20';const a=gpDueBot(new Date(2026,10,1));gpChk.lastBot='2026-10-30';const b=gpDueBot(new Date(2026,10,1));gpChk.bot='month';gpChk.lastBot='2026-10-20';const c=gpDueBot(new Date(2026,10,1));return[a,b,c].join()});
if(due!=='true,false,false')throw new Error('bot due '+due);
await p.keyboard.press('Escape');
// nhập liệu từ tab Lịch sử chuyển về gia phả riêng
await p.evaluate(()=>{gpSrc='le';gpiOpen()});await p.waitForTimeout(200);if(await p.evaluate(()=>gpSrc)!=='mine')throw new Error('import target');
if(!(await p.evaluate(()=>featFind('đối chiếu').length&&featFind('mã ráp nối').length&&featFind('cá nhân 8 đời').length)))throw new Error('feats');
console.log(nm,'sum',JSON.stringify(r.sum.acc),'sw',await p.evaluate(()=>document.documentElement.scrollWidth),'errs',JSON.stringify(errs));await ctx.close()}await b.close()})().catch(e=>{console.log('Error',e.message);process.exit(1)});
