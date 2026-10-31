const fs0=require('fs'),path0=require('path');const OUT=path0.join(__dirname,'out');fs0.mkdirSync(OUT,{recursive:true});process.chdir(OUT);
const {chromium}=require('playwright');const fs=require('fs');
const FX={idx:fs.readFileSync(__dirname+'/fixtures/index.md','utf8'),full:fs.readFileSync(__dirname+'/fixtures/full.md','utf8'),ged:fs.readFileSync(__dirname+'/fixtures/le.ged','utf8')};
const PEOPLE=fs.readdirSync(__dirname+'/fixtures/people').map(f=>[f.replace('.json',''),JSON.parse(fs.readFileSync(__dirname+'/fixtures/people/'+f,'utf8'))]);
(async()=>{const b=await chromium.launch();
for(const [W,H,nm] of [[1280,860,'d'],[390,820,'m']]){
const p=await b.newPage({viewport:{width:W,height:H}});const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error')errs.push(m.text())});
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
console.log(nm,'title',await p.title());
await p.evaluate(()=>show('giapha'));await p.waitForTimeout(500);
const info=await p.evaluate(()=>{const R=document.querySelector('.gphost').shadowRoot;return{n:gpApi.people.length,mode:gpApi.mode,nodes:R.querySelectorAll('.node,[data-id]').length,strip:!!R.querySelector('.gstrip')}});console.log(nm,'fam',JSON.stringify(info));
await p.screenshot({path:`g-${nm}-chat.png`});
// switch to tree inside shadow
await p.evaluate(()=>document.querySelector('.gphost').shadowRoot.querySelector('.gstrip [data-view="tree"]').click());await p.waitForTimeout(300);await p.screenshot({path:`g-${nm}-tree.png`});
// open add form
await p.evaluate(()=>document.querySelector('.gphost').shadowRoot.querySelector('.gstrip [data-add]').click());await p.waitForTimeout(200);
console.log(nm,'form open',await p.evaluate(()=>!document.querySelector('.gphost').shadowRoot.querySelector('#formScrim').hidden));await p.screenshot({path:`g-${nm}-form.png`});
await p.keyboard.press('Escape');
// clan
await p.evaluate(()=>{rtab='clan';show('roots')});await p.waitForTimeout(200);
await p.evaluate(()=>document.querySelector('#clanSync').click());await p.waitForFunction(()=>!clanBusy,null,{timeout:10000});await p.waitForTimeout(200);
console.log(nm,'clan',await p.evaluate(()=>JSON.stringify({msg:clanMsg,rows:clanRows().length,ents:clanEntries().map(e=>[e.title,e.tiers.length,e.sum]),line:lineCount,le:window.__store.lineage_le?.Q2986223})));
await p.evaluate(()=>document.querySelector('.cfull summary').click());await p.waitForTimeout(100);
await p.screenshot({path:`g-${nm}-clan.png`,fullPage:true});
console.log(nm,'tierhtml',await p.evaluate(()=>document.querySelector('.tiers').innerHTML.slice(0,300)));
await p.fill('#cq','Chân');await p.waitForTimeout(100);console.log(nm,'search',await p.evaluate(()=>document.querySelectorAll('.crow').length));
await p.evaluate(()=>document.querySelector('[data-gpgo="le"]').click());await p.waitForTimeout(500);
const le=await p.evaluate(()=>({n:gpApi.people.length,mode:gpApi.mode,view}));console.log(nm,'le',JSON.stringify(le));
await p.evaluate(()=>document.querySelector('.gphost').shadowRoot.querySelector('.gstrip [data-view="tree"]').click());await p.waitForTimeout(300);await p.screenshot({path:`g-${nm}-letree.png`});
await p.evaluate(()=>document.querySelector('[data-gpsrc="fam"]').click());await p.waitForTimeout(300);console.log(nm,'back fam',await p.evaluate(()=>gpApi.people.length));
console.log(nm,'sw',await p.evaluate(()=>document.documentElement.scrollWidth),'errs',JSON.stringify(errs));await p.close()}
await b.close()})();
