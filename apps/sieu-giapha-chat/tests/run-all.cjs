// Chạy toàn bộ kiểm thử giao diện (Playwright, Chromium). Dùng: node tests/run-all.cjs
const {execFileSync}=require('child_process');const fs=require('fs');const path=require('path');
let fail=0;for(const f of fs.readdirSync(__dirname).filter(f=>f.endsWith('.test.cjs')).sort()){
  process.stdout.write('== '+f+'\n');let out='';
  try{out=execFileSync(process.execPath,[path.join(__dirname,f)],{encoding:'utf8',timeout:180000})}catch(e){out=(e.stdout||'')+(e.stderr||'');fail++}
  const bad=/errs \[(?!\])/.test(out)||/Error/.test(out);if(bad)fail++;
  out.split('\n').filter(l=>/errs|sw /.test(l)).forEach(l=>console.log('  '+l.slice(0,160)));console.log(bad?'  ✗ LỖI':'  ✓ đạt')}
console.log(fail?`\n${fail} bộ có lỗi`:'\nTất cả đều đạt');process.exit(fail?1:0);
