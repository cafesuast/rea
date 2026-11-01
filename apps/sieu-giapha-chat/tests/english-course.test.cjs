const fs0=require('fs'),path0=require('path');const OUT=path0.join(__dirname,'out');fs0.mkdirSync(OUT,{recursive:true});process.chdir(OUT);
const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();
for(const [W,H,nm] of [[1280,860,'d'],[390,820,'m']]){
const p=await b.newPage({viewport:{width:W,height:H}});const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error')errs.push(m.text())});
await p.goto('file://'+path0.join(__dirname,'..','index.html'));await p.waitForTimeout(600);
await p.evaluate(()=>show('easy'));await p.waitForTimeout(200);await p.screenshot({path:`e-${nm}-home.png`,fullPage:true});
const c=sel=>p.evaluate(s=>{const e=document.querySelector(s);if(!e)throw new Error('missing '+s);e.click()},sel);
await c('[data-elesson="d3"]');await p.waitForTimeout(100);await c('#eViT');await p.screenshot({path:`e-${nm}-story.png`,fullPage:true});
await c('[data-enext]');await p.screenshot({path:`e-${nm}-words.png`,fullPage:true});
await c('[data-enext]');await c('#eRoleT');
for(const i of await p.evaluate(()=>[...document.querySelectorAll('[data-etype]')].map(x=>x.dataset.etype))){await p.fill(`[data-etype="${i}"]`,'Five my parents my two sisters and me');await p.press(`[data-etype="${i}"]`,'Enter')}
await p.screenshot({path:`e-${nm}-dlg.png`,fullPage:true});
await c('[data-enext]');
const qs=await p.evaluate(()=>eQ.qs.map(q=>({k:q.k,a:q.a,toks:q.toks,ans:q.ans})));
for(let i=0;i<qs.length;i++){const q=qs[i];if(q.k==='order'){for(const w of q.ans.split(' ')){const j=q.toks.indexOf(w);await c(`[data-etok="${i}:${j}"]`)}}else if(q.k==='type'){await p.fill('#eqt'+i,q.ans);await c(`[data-eqtype="${i}"]`)}else await c(`[data-eopt="${i}:${q.a}"]`)}
console.log(nm,'quiz',await p.evaluate(()=>JSON.stringify(eQ.res)));await p.screenshot({path:`e-${nm}-quiz.png`,fullPage:true});
await c('[data-enext]');
await p.evaluate(()=>{sample={json:async pr=>{await new Promise(r=>setTimeout(r,30));return/Learner:/.test(pr)?{reply:"Nice! Do you live with your grandparents?",vi:"Hay quá! Bạn có sống với ông bà không?",fix:"There are five people in my family.",note:"Dùng “There are” để nói số lượng."}:{reply:"Hi! How many people are in your family?",vi:"Chào! Gia đình bạn có mấy người?",fix:"",note:""}}}});
await c('#eTalkStart');await p.waitForTimeout(150);
for(const t of ['Five people','No they live in hometown','Yes nine generations']){await p.fill('#eTalkIn',t);await c('#eTalkGo');await p.waitForTimeout(120)}
await p.screenshot({path:`e-${nm}-talk.png`,fullPage:true});
await c('[data-efinish]');await p.waitForTimeout(100);
console.log(nm,'prog',await p.evaluate(()=>JSON.stringify({done:Object.keys(eP.done),xp:eP.xp,streak:eP.streak,srs:Object.keys(eP.srs).length})));
await p.evaluate(()=>{Object.values(eP.srs).forEach(c=>c.due=0)});await p.evaluate(()=>renderEng());await c('#eRevGo');await c('#eFlip');await p.screenshot({path:`e-${nm}-rev.png`});await c('[data-erev="1"]');
console.log(nm,'rev left',await p.evaluate(()=>eRev.q.length));
// visa lesson + fallback talk without sample
await c('#eRevEnd');await p.evaluate(()=>{sample=null});await c('[data-elesson="v8"]');await c('[data-estep="4"]');await c('#eTalkStart');await p.waitForTimeout(100);await p.fill('#eTalkIn','To visit my son');await c('#eTalkGo');await p.waitForTimeout(100);
console.log(nm,'fallback',await p.evaluate(()=>JSON.stringify(eChat.map(m=>m.t+(m.fix?' [fix '+m.fix+']':'')))));await p.screenshot({path:`e-${nm}-visa.png`,fullPage:true});
await c('[data-emode="tap"]');console.log(nm,'tap',await p.evaluate(()=>!!document.querySelector('.cats')));await c('[data-emode="eng"]');
console.log(nm,'sw',await p.evaluate(()=>document.documentElement.scrollWidth),'errs',JSON.stringify(errs));await p.close()}
await b.close()})();
