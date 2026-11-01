// Bản web chạy độc lập: chế độ trên máy (IndexedDB) và chế độ Supabase (giả lập RLS).
const fs0=require('fs'),path0=require('path'),http=require('http');const OUT=path0.join(__dirname,'out');fs0.mkdirSync(OUT,{recursive:true});
const WEB=path0.join(__dirname,'..','web');const MOCK=fs0.readFileSync(path0.join(__dirname,'fixtures','mock-supabase.js'),'utf8');
const TYPES={'.html':'text/html','.js':'text/javascript','.webmanifest':'application/manifest+json','.svg':'image/svg+xml','.png':'image/png'};
const srv=http.createServer((q,r)=>{let p=decodeURIComponent(q.url.split('?')[0]);if(p.endsWith('/'))p+='index.html';const f=path0.join(WEB,p);if(!f.startsWith(WEB)||!fs0.existsSync(f)){r.writeHead(404);return r.end()}r.writeHead(200,{'content-type':TYPES[path0.extname(f)]||'application/octet-stream'});fs0.createReadStream(f).pipe(r)});
const {chromium}=require('playwright');
(async()=>{await new Promise(r=>srv.listen(0,r));const URL0=`http://127.0.0.1:${srv.address().port}/`;const b=await chromium.launch();const fail=m=>{throw new Error(m)};
for(const [W,H,nm] of [[1280,860,'d'],[390,820,'m']]){
  /* ---- 1. Chế độ trên máy ---- */
  {const ctx=await b.newContext({viewport:{width:W,height:H},acceptDownloads:true});const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
   await ctx.route(/fonts\.|cdnjs|jsdelivr/,r=>r.abort());
   await ctx.route('https://api.anthropic.com/**',r=>r.fulfill({status:200,contentType:'application/json',body:JSON.stringify({model:'claude-haiku-5-5',stop_reason:'end_turn',content:[{type:'text',text:'Kết quả: {"ok":true,"w":"xin chào"}'}]})}));
   await p.goto(URL0);await p.waitForTimeout(1200);
   if(await p.locator('.sgp-login').count())fail('login sheet in local mode');
   const mode=await p.evaluate(()=>SGP.mode);if(mode!=='local')fail('mode '+mode);
   await p.evaluate(()=>show('acct'));await p.waitForTimeout(300);if(!await p.locator('#sgpSet').count())fail('settings card');
   await p.fill('#sgpName','Lê Văn An');await p.fill('#sgpKey','sk-ant-test-1234');p.once('dialog',d=>d.accept());await p.click('#sgpSave');await p.waitForLoadState('load');await p.waitForTimeout(1200);
   const who=await p.evaluate(()=>acct.me?.name);if(who!=='Lê Văn An')fail('name '+who);
   const ai=await p.evaluate(async()=>{const s=await window.claude.use('sample');return s?await s.json('thử'):null});if(!ai?.ok)fail('ai '+JSON.stringify(ai));
   /* đổi sang ChatGPT */
   await ctx.route('https://api.openai.com/**',r=>{const b=JSON.parse(r.request().postData());r.fulfill({status:200,contentType:'application/json',body:JSON.stringify({model:b.model,choices:[{finish_reason:'stop',message:{content:'{"hang":"gpt","model":"'+b.model+'","img":'+JSON.stringify(Array.isArray(b.messages[0].content)&&b.messages[0].content.some(c=>c.type==='image_url'))+'}'}}]})})});
   await p.evaluate(()=>show('acct'));await p.waitForTimeout(300);await p.selectOption('#sgpAi','gpt');await p.waitForLoadState('load');await p.waitForTimeout(1200);
   await p.evaluate(()=>show('acct'));await p.waitForTimeout(300);await p.fill('#sgpKey','sk-openai-test');p.once('dialog',d=>d.accept());await p.click('#sgpSave');await p.waitForLoadState('load');await p.waitForTimeout(1200);
   const g=await p.evaluate(async()=>{const s=await window.claude.use('sample');return s.json('thử',{images:[new Blob([new Uint8Array([137,80,78,71])],{type:'image/png'})]})});if(g.hang!=='gpt'||g.model!=='gpt-5'||!g.img)fail('gpt '+JSON.stringify(g));
   const back=await p.evaluate(async()=>{const s=await window.claude.use('sample');return (await s('x',{provider:'claude'})).provider});if(back!=='claude')fail('per-call provider '+back);
   const noimg=await p.evaluate(async()=>{localStorage.setItem('sgp-standalone:keys',JSON.stringify({...JSON.parse(localStorage.getItem('sgp-standalone:keys')),deepseek:'sk-ds'}));const s=await window.claude.use('sample');try{await s.json('x',{provider:'deepseek',images:[new Blob(['a'],{type:'image/png'})]});return 'no error'}catch(e){return e.code}});if(noimg!=='unsupported')fail('deepseek image '+noimg);
   const opts=await p.evaluate(()=>[...document.querySelectorAll('#sgpAi option')].length);if(opts!==7)fail('providers '+opts);
   await p.evaluate(()=>{gpSrc='mine';show('giapha')});await p.waitForTimeout(600);
   await p.evaluate(()=>gpApi.put('x1',{name:'Cụ Lê Văn Tổ',gender:'m',birth:'1900',death:'1970',spouseIds:[]}));await p.waitForTimeout(300);
   await p.reload();await p.waitForTimeout(1200);await p.evaluate(()=>{gpSrc='mine';show('giapha')});await p.waitForTimeout(600);
   const kept=await p.evaluate(()=>gpApi.people.map(x=>x.name).join());if(!kept.includes('Cụ Lê Văn Tổ'))fail('not persisted '+kept);
   await p.evaluate(()=>show('acct'));await p.waitForTimeout(300);
   const [dl]=await Promise.all([p.waitForEvent('download',{timeout:5000}),p.click('#sgpExport')]);const bk=JSON.parse(fs0.readFileSync(await dl.path(),'utf8'));if(!Object.values(bk.docs).some(d=>d.name==='Cụ Lê Văn Tổ'))fail('backup');
   const sw=await p.evaluate(async()=>!!(await navigator.serviceWorker.getRegistration()));
   await p.screenshot({path:path0.join(OUT,`w-${nm}-local.png`)});
   console.log(nm,'local ok sw',sw,'sw',await p.evaluate(()=>document.documentElement.scrollWidth),'errs',JSON.stringify(errs));await ctx.close()}
  /* ---- 2. Chế độ Supabase (giả lập) ---- */
  {const ctx=await b.newContext({viewport:{width:W,height:H}});const errs=[];
   await ctx.route(/fonts\.|cdnjs|jsdelivr/,r=>r.abort());
   await ctx.route('**/config.js',r=>r.fulfill({contentType:'text/javascript',body:'window.SGP_CONFIG={supabaseUrl:"https://demo.supabase.co",supabaseAnonKey:"anon"}'}));
   await ctx.route('**/vendor/supabase-js-2.118.0.js',r=>r.fulfill({contentType:'text/javascript',body:MOCK}));
   let aiAuth='',aiProv='';await ctx.route('https://demo.supabase.co/functions/v1/ai',r=>{aiAuth=r.request().headers().authorization||'';if(r.request().method()==='GET')return r.fulfill({status:200,contentType:'application/json',body:JSON.stringify({providers:['claude','gpt','gemini']})});aiProv=JSON.parse(r.request().postData()).provider;r.fulfill({status:200,contentType:'application/json',body:JSON.stringify({text:'{"verdict":"ok","label":"Fact","note":"đúng"}',model:'m'})})});
   const p=await ctx.newPage();p.on('pageerror',e=>errs.push(e.message));
   await p.goto(URL0);await p.waitForTimeout(1200);
   if(!await p.locator('.sgp-login').count())fail('no login sheet for guest');await p.screenshot({path:path0.join(OUT,`w-${nm}-login.png`)});
   await p.click('[data-sgpin="google"]');if(await p.evaluate(()=>window.__signin)!=='google')fail('google sign-in');
   await p.click('[data-sgpguest]');if(await p.locator('.sgp-login').count())fail('guest close');
   const guestSample=await p.evaluate(async()=>!!(await window.claude.use('sample')));if(guestSample)fail('guest has AI');
   /* đăng nhập người A */
   const A='aaaaaaaa-0000-0000-0000-000000000001',Bu='bbbbbbbb-0000-0000-0000-000000000002';
   await p.evaluate(u=>{localStorage.setItem('__sb_user',u);sessionStorage.clear()},A);await p.reload();await p.waitForTimeout(1300);
   if(await p.locator('.sgp-login').count())fail('login sheet while signed in');
   const uid=await p.evaluate(()=>acct.uid);if(uid!==A)fail('uid '+uid);
   await p.evaluate(()=>{gpSrc='mine';show('giapha')});await p.waitForTimeout(600);
   await p.evaluate(()=>gpApi.put('m1',{name:'Bà Nội Riêng',gender:'f',birth:'1940',spouseIds:[]}));await p.waitForTimeout(300);
   const row=await p.evaluate(a=>Object.keys(__sbdb.docs).find(k=>k.startsWith('data/users/'+a+'/fam/people/')),A);if(!row)fail('private row');
   const v=await p.evaluate(async()=>{const s=await window.claude.use('sample');return s.json('kiểm')});if(v.verdict!=='ok'||!aiAuth.includes('tok-'+A))fail('ai via function');
   await p.evaluate(()=>show('acct'));await p.waitForTimeout(300);await p.evaluate(()=>{acctTab='bot';renderAcct()});await p.waitForTimeout(250);await p.click('#botCreate');await p.waitForTimeout(300);
   await p.selectOption('#botAi','gemini');await p.waitForTimeout(300);const bai=await p.evaluate(a=>__sbdb.docs['bots/'+a]?.data?.ai,A);if(bai!=='gemini')fail('bot ai '+bai);
   const dis=await p.evaluate(()=>[...document.querySelectorAll('#botAi option')].filter(o=>o.disabled).length);if(dis!==4)fail('disabled providers '+dis);
   await p.evaluate(()=>{sample=null});await p.evaluate(async()=>{sample=await window.claude.use('sample')});await p.evaluate(()=>runBot(false));await p.waitForFunction(()=>!acct.running);if(aiProv!=='gemini')fail('bot used '+aiProv);
   /* người B không đọc được gia phả riêng của A, không sửa được bot của A */
   await p.evaluate(u=>localStorage.setItem('__sb_user',u),Bu);await p.reload();await p.waitForTimeout(1300);
   const peek=await p.evaluate(async a=>{const db=await window.claude.use('db');const s=await db.collection(`data/users/${a}/fam/people`).get();return s.docs.length},A);if(peek)fail('B reads A private');
   const hack=await p.evaluate(async a=>{const db=await window.claude.use('db');try{await db.doc('bots/'+a).set({nick:'hack'});return 'written'}catch(e){return e.code}},A);if(hack!=='invalid_argument')fail('B wrote A bot: '+hack);
   const bots=await p.evaluate(()=>acct.bots.length);if(bots!==1)fail('bots visible '+bots);
   await p.evaluate(()=>show('acct'));await p.waitForTimeout(300);await p.screenshot({path:path0.join(OUT,`w-${nm}-sb-acct.png`)});
   console.log(nm,'supabase ok','sw',await p.evaluate(()=>document.documentElement.scrollWidth),'errs',JSON.stringify(errs));await ctx.close()}
}
await b.close();srv.close()})().catch(e=>{console.log('Error',e.message);srv.close();process.exit(1)});
