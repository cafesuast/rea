// Tài khoản, bot trao đổi, gia phả riêng (ẩn 4 đời khi chia sẻ), menu ✨ cập nhật
const fs0=require('fs'),path0=require('path');const OUT=path0.join(__dirname,'out');fs0.mkdirSync(OUT,{recursive:true});process.chdir(OUT);
const {chromium}=require('playwright');(async()=>{const b=await chromium.launch();
for(const [W,H,nm] of [[1280,860,'d'],[390,820,'m']]){const ctx=await b.newContext({viewport:{width:W,height:H}});const errs=[];
await ctx.addInitScript(()=>{
  const store=window.__store=JSON.parse(localStorage.getItem('__mockdb')||'{}');const subs=[];const persist=()=>localStorage.setItem('__mockdb',JSON.stringify(store));
  const merge=(a,b)=>{for(const k in b){if(b[k]&&typeof b[k]==='object'&&!Array.isArray(b[k])&&a[k]&&typeof a[k]==='object')merge(a[k],b[k]);else a[k]=b[k]}return a};
  const list=c=>Object.entries(store[c]||{}).map(([id,d])=>({id,data:()=>JSON.parse(JSON.stringify(d))}));
  const fire=c=>subs.filter(s=>s.c===c).forEach(s=>{let d=list(c);if(s.o)d.sort((x,y)=>String(y.data()[s.o]).localeCompare(String(x.data()[s.o])));s.cb({docs:d})});
  const docRef=(c,id)=>({async set(d){(store[c]=store[c]||{})[id]=JSON.parse(JSON.stringify(d));persist();fire(c)},async update(d){if(!store[c]?.[id])throw{code:'invalid_argument',message:'missing'};merge(store[c][id],JSON.parse(JSON.stringify(d)));persist();fire(c)},async delete(){delete store[c]?.[id];persist();fire(c)},async get(){return{exists:!!store[c]?.[id],data:()=>store[c]?.[id]}}});
  const col=(c,o)=>({orderBy:f=>col(c,f),limit:()=>col(c,o),onSnapshot(cb){subs.push({c,cb,o});setTimeout(()=>fire(c),5);return()=>{}},doc:id=>docRef(c,id)});
  const db={collection:c=>col(c),doc:p=>{const a=p.split('/');return docRef(a.slice(0,-1).join('/'),a.at(-1))}};
  const uid=localStorage.getItem('__uid')||'u_A';
  const user={id:async()=>uid,me:async()=>({id:uid,name:uid==='u_A'?'An':'Bình',avatarUrl:'',isOwner:uid==='u_A',canEdit:uid==='u_A'}),can:async()=>true,profiles:async ids=>Object.fromEntries([].concat(ids).map(i=>[i,{id:i,name:{u_A:'An',u_B:'Bình',u_C:'Chi'}[i]||'',avatarUrl:''}]))};
  const perms={state:async()=>'granted'};
  window.claude={use:async n=>n==='db'?db:n==='user'?user:n==='permissions'?perms:null};
});
const p=await ctx.newPage();p.on('pageerror',e=>errs.push(e.message));
const mockSample=()=>p.evaluate(()=>{sample={json:async pr=>{await new Promise(r=>setTimeout(r,10));
  if(/KIỂM CHỨNG/.test(pr))return{verdict:'ok',label:'Fact',note:'Đúng'};
  if(/BIÊN SOẠN/.test(pr))return{items:[{w:'bánh chưng thử',pos:'danh từ',meaning:'bánh ngày Tết',en:'square sticky rice cake',example:'Tết gói bánh chưng.',source:'Từ điển tiếng Việt'}]};
  if(/SỬ HỌC/.test(pr))return{items:[{year:1513,lab:'1513',title:'Sự kiện thử nghiệm',desc:'Dữ liệu giả lập cho kiểm thử.',source:'https://vi.wikipedia.org/wiki/Chiếu_dời_đô'}]};return{}}}});
await p.goto('file://'+path0.join(__dirname,'..','index.html'));await p.waitForTimeout(900);await mockSample();
// 1. bot của An
await p.click('#acctChip');await p.waitForTimeout(200);await p.evaluate(()=>{acctTab='bot';renderAcct()});await p.waitForTimeout(250);await p.click('#botCreate');await p.waitForTimeout(200);
await p.click('#botRun');await p.waitForFunction(()=>!acct.running,null,{timeout:8000});await p.waitForTimeout(200);
const pend=await p.evaluate(()=>acct.props.filter(x=>x.status==='pending').length);if(pend<2)throw new Error('no proposals '+pend);
await p.screenshot({path:`a-${nm}-bot.png`});
// 2. bot của Bình và Chi kiểm chứng → vào thư viện
for(const u of ['u_B','u_C']){await p.evaluate(u=>localStorage.setItem('__uid',u),u);await p.reload();await p.waitForFunction(()=>typeof acct!=="undefined"&&acct.ready&&acct.bots.length>0);await p.waitForTimeout(200);await mockSample();
  await p.evaluate(()=>show('acct'));await p.waitForTimeout(200);await p.evaluate(()=>{acctTab='bot';renderAcct()});await p.waitForTimeout(250);await p.click('#botCreate');await p.waitForTimeout(200);await p.click('#botRun');await p.waitForFunction(()=>!acct.running,null,{timeout:8000});await p.waitForTimeout(200)}
const st=await p.evaluate(()=>({merged:acct.props.filter(x=>x.status==='merged').length,hist:(window.HISTV||[]).length,word:!!words.find(w=>w.w==='bánh chưng thử'),bots:acct.bots.length}));
if(!st.merged||!st.hist||!st.word||st.bots!==3)throw new Error('merge '+JSON.stringify(st));
await p.evaluate(()=>{acctTab='ex';renderAcct()});await p.waitForTimeout(200);await p.screenshot({path:`a-${nm}-ex.png`,fullPage:false});
// 3. gia phả riêng: lưu vào vùng riêng, chia sẻ ẩn 4 đời
await p.evaluate(()=>localStorage.setItem('__uid','u_A'));await p.reload();await p.waitForTimeout(900);
await p.evaluate(()=>{gpSrc='mine';show('giapha')});await p.waitForTimeout(400);
await p.evaluate(async()=>{const G=[['a1','Cụ Tổ',"",'1800','1870'],['a2','Cụ 2','a1','1830','1900'],['a3','Cụ 3','a2','1860','1930'],['a4','Ông 4','a3','1890','1960'],['a5','Ông 5','a4','1920','1990'],['a6','Bố 6','a5','1950',''],['a7','Con 7','a6','1980',''],['a8','Cháu 8','a7','2010','']];
  for(const [id,name,f,b,d] of G)await gpApi.put(id,{name,gender:'m',birth:b,death:d,fatherId:f,spouseIds:[],phone:id==='a8'?'0900':''})});
await p.waitForTimeout(300);
const priv=await p.evaluate(()=>Object.keys(window.__store['data/users/u_A/fam/people']||{}).length);if(priv!==8)throw new Error('private '+priv);
p.on('dialog',d=>d.accept());await p.click('#gpShare');await p.waitForTimeout(500);
const pub=await p.evaluate(()=>Object.values(window.__store.people||{}).map(x=>x.name));
if(pub.length!==4||pub.some(n=>/Ông 5|Bố|Con|Cháu/.test(n))||await p.evaluate(()=>Object.values(window.__store.people).some(x=>x.phone)))throw new Error('share '+pub);
await p.screenshot({path:`a-${nm}-mine.png`});
// 4. menu ✨
await p.click('#upBtn');await p.waitForTimeout(150);const items=await p.evaluate(()=>[...document.querySelectorAll('#upMenu [data-up]')].map(b=>b.dataset.up).join(','));
await p.screenshot({path:`a-${nm}-up.png`});await p.fill('#upQ','Cụ');await p.click('[data-upq="lib"]');await p.waitForTimeout(150);
const hits=await p.evaluate(()=>document.querySelectorAll('#upRes [data-uppp]').length);if(!hits)throw new Error('lib search');
await p.keyboard.press('Escape');await p.click('#gsPlus');await p.waitForTimeout(100);const six=await p.evaluate(()=>document.querySelectorAll('#gsSix [data-gssix]').length);if(six!==6)throw new Error('search bar + menu '+six);
console.log(nm,'pend',pend,JSON.stringify(st),'pub',pub.length,'menu',items,'sw',await p.evaluate(()=>document.documentElement.scrollWidth),'errs',JSON.stringify(errs));await ctx.close()}await b.close()})().catch(e=>{console.log('Error',e.message);process.exit(1)});
