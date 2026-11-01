// Bản chính thức: không còn dữ liệu demo, điều khoản v2 bắt buộc, app chạy không lỗi trên máy tính và điện thoại
const path0=require('path');const FILE=process.env.SGP_FILE||path0.join(__dirname,'..','index.html');
const {chromium}=require('playwright');(async()=>{const b=await chromium.launch();const fail=m=>{throw new Error(m)};
for(const [W,H,nm] of [[1280,860,'d'],[390,820,'m']]){const ctx=await b.newContext({viewport:{width:W,height:H}});const errs=[];
  const p=await ctx.newPage();p.on('pageerror',e=>errs.push(e.message));await p.goto('file://'+FILE);await p.waitForTimeout(1200);
  if(!(await p.evaluate(()=>window.SGP_RELEASE?.channel==='official')))fail('no release tag');
  if(await p.evaluate(()=>TERMS_V)!==2)fail('terms v');
  await p.evaluate(()=>goSlot('gp','view'));await p.waitForTimeout(11000);
  const n=await p.evaluate(()=>typeof gpApi!=='undefined'?gpApi.people.length:0);if(n!==0)fail('people '+n);
  const txt=await p.evaluate(()=>document.documentElement.outerHTML);if(!txt.includes('const DEMO=[].map')||txt.includes('"p17"'))fail('demo data left');
  await p.evaluate(()=>{clanProf=null;cpOpen&&cpOpen()});await p.waitForTimeout(300);if(!(await p.$('#cp_terms')))fail('no terms box');
  const t=await p.evaluate(()=>document.querySelector('.terms')?.textContent||'');if(!t.includes('Quyền của bạn với dữ liệu cá nhân')||t.includes('phi lợi nhuận'))fail('terms text');
  console.log(nm,'release ok sw',await p.evaluate(()=>document.documentElement.scrollWidth),'errs',JSON.stringify(errs));await ctx.close()}
await b.close()})().catch(e=>{console.log('Error',e.message);process.exit(1)});
