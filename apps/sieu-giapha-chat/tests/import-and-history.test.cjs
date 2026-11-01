const fs0=require('fs'),path0=require('path');const OUT=path0.join(__dirname,'out');fs0.mkdirSync(OUT,{recursive:true});process.chdir(OUT);
const {chromium}=require('playwright');const fs=require('fs');
const FX={idx:fs.readFileSync(__dirname+'/fixtures/index.md','utf8'),full:fs.readFileSync(__dirname+'/fixtures/full.md','utf8'),ged:fs.readFileSync(__dirname+'/fixtures/le.ged','utf8')};
const PEOPLE=fs.readdirSync(__dirname+'/fixtures/people').map(f=>[f.replace('.json',''),JSON.parse(fs.readFileSync(__dirname+'/fixtures/people/'+f,'utf8'))]);
(async()=>{const b=await chromium.launch();
for(const [W,H,nm] of [[1280,860,'d'],[390,820,'m']]){
const p=await b.newPage({viewport:{width:W,height:H}});const errs=[];p.on('pageerror',e=>errs.push(e.stack));p.on('console',m=>{if(m.type()==='error')errs.push(m.text())});
await p.addInitScript(({FX,PEOPLE})=>{
  localStorage.setItem('stdien:gpsrc2','"fam"'); /* các bộ này kiểm gia phả dòng họ chung */
  const store={people:Object.fromEntries(PEOPLE)};const subs={};
  const emit=c=>(subs[c]||[]).forEach(cb=>cb({docs:Object.entries(store[c]||{}).map(([id,d])=>({id,data:()=>JSON.parse(JSON.stringify(d))}))}));
  const db={collection:c=>({onSnapshot(cb,er){(subs[c]=subs[c]||[]).push(cb);setTimeout(()=>emit(c),10);return()=>{}},
    doc:id=>({async set(d){(store[c]=store[c]||{})[id]=d;emit(c)},async update(d){store[c][id]={...store[c][id],...d};emit(c)},async delete(){delete store[c][id];emit(c)},async get(){return{exists:!!store[c]?.[id],data:()=>store[c]?.[id]}}}),
    async add(d){const id='x'+Math.random().toString(36).slice(2);(store[c]=store[c]||{})[id]=d;emit(c);return{id}}})};
  const files=[{id:'a',title:'sieu-tu-dien-gia-pha-ho-le_INDEX-LE-004.md'},{id:'b',title:'sieu-tu-dien-gia-pha-ho-le_FULL-LE-001.md'},{id:'c',title:'sieu-tu-dien-gia-pha-ho-le_trieu-le.ged'},{id:'d',title:'sieu-tu-dien-gia-pha-ho-le_README.md'}];
  const mcp={async callTool(s,t,a){if(t==='search_files')return{content:[{type:'text',text:JSON.stringify({files:/gia-pha-ho-le/.test(a.query)?files:[]})}]};
    const txt={a:FX.idx,b:FX.full,c:FX.ged}[a.fileId]||'';return{content:[{type:'text',text:JSON.stringify({fileContent:txt})}]}}};
  window.__store=store;
  window.claude={use:async n=>n==='db'?db:n==='mcp'?mcp:n==='user'?{can:async()=>true,me:async()=>({id:'u1',name:'Test'})}:null};
},{FX,PEOPLE});
await p.goto('file://'+path0.join(__dirname,'..','index.html'));await p.waitForTimeout(800);
await p.evaluate(()=>{sample={limits:async()=>({images:true}),json:async(pr,o)=>{await new Promise(r=>setTimeout(r,30));
 if(o&&o.images)return{text:"Đời thứ nhất: Cụ Lê Văn Phúc... Đời thứ hai: Lê Văn Minh lấy Trần Thị Lan, sinh Lê Văn Bình (1978).",people:[{key:"p1",name:"Lê Văn Phúc",gender:"m",birth:"1925"},{key:"p2",name:"Lê Văn Bình",gender:"m",birth:"1978",father:"Lê Văn Minh",mother:"Trần Thị Lan",spouses:["p3"]},{key:"p3",name:"Phan Thị Cúc",gender:"f",birth:"1980",spouses:["p2"]},{key:"p4",name:"Lê Thị Mận",gender:"f",birth:"2005",death:"",father:"p2",mother:"p3",deathLunar:""}],warnings:["Dòng 3 mờ, chưa chắc chữ 'Mận'"]};
 return{text:"",people:[{key:"a",name:"Lê Văn Tư",gender:"m",birth:"1932",father:"Lê Văn Phúc"}],warnings:[]}}}});
const c=sel=>p.evaluate(s=>{const e=document.querySelector(s);if(!e)throw new Error('missing '+s);e.click()},sel);
await p.evaluate(()=>show('giapha'));await p.waitForTimeout(400);const n0=await p.evaluate(()=>gpApi.people.length);
await c('[data-slot="gp:imp"]');await c('[data-gpikind="hand"]');
await p.setInputFiles('#gpImp input[data-gpifile][multiple]',[__dirname+'/fixtures/page.png']);
await p.waitForTimeout(400);await p.screenshot({path:`i-${nm}-pick.png`,fullPage:true});
await c('#gpiRun');await p.waitForFunction(()=>!gpi.busy&&gpi.res);await p.waitForTimeout(100);await p.screenshot({path:`i-${nm}-review.png`,fullPage:true});
console.log(nm,'review',await p.evaluate(()=>JSON.stringify(gpi.res.people.map(x=>[x.name,x.ok,!!x.match]))));
await c('#gpiSave');await p.waitForTimeout(500);
console.log(nm,'saved',n0,'->',await p.evaluate(()=>{const P=gpApi.people;const b=P.find(x=>x.name==='Lê Văn Bình'),m=P.find(x=>x.name==='Lê Thị Mận'),cu=P.find(x=>x.name==='Phan Thị Cúc');return JSON.stringify({n:P.length,bFather:gpApi.byId(b.fatherId)?.name,bMother:gpApi.byId(b.motherId)?.name,bSp:b.spouseIds.map(i=>gpApi.byId(i)?.name),mFather:gpApi.byId(m.fatherId)?.name,mMother:gpApi.byId(m.motherId)?.name,src:m.src})}));
console.log(nm,'sources',await p.evaluate(()=>Object.keys(window.__store.gpsources||{}).length));
await c('[data-slot="gp:imp"]');await p.fill('#gpiText','Cụ Lê Văn Tư sinh 1932 là con thứ hai của cụ Phúc');await c('#gpiTextGo');await p.waitForFunction(()=>!gpi.busy&&gpi.res);
console.log(nm,'text',await p.evaluate(()=>JSON.stringify(gpi.res.people.map(x=>[x.name,x.father]))));await c('#gpiSave');await p.waitForTimeout(300);
console.log(nm,'tu father',await p.evaluate(()=>{const t=gpApi.people.find(x=>x.name==='Lê Văn Tư');return gpApi.byId(t.fatherId)?.name}));
await p.evaluate(()=>document.querySelector('#gpbar [data-gphopen]').click());await p.waitForTimeout(200);await p.screenshot({path:`i-${nm}-hist.png`,fullPage:false});
console.log(nm,'hist rows',await p.evaluate(()=>document.querySelectorAll('.gph-r').length));
await c('#gpHist [data-gphp]');await p.waitForTimeout(200);console.log(nm,'closed',await p.evaluate(()=>document.querySelector('#gpHist').hidden));
console.log(nm,'sw',await p.evaluate(()=>document.documentElement.scrollWidth),'errs',JSON.stringify(errs));await p.close()}
await b.close()})();
