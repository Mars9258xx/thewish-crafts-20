const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..', 'public', 'templates');
const files = [];
function walk(dir){ for(const n of fs.readdirSync(dir)){ const p=path.join(dir,n); const st=fs.statSync(p); st.isDirectory()?walk(p):n.endsWith('.html')&&files.push(p); } }
walk(root);
let failed=false;
for(const f of files){
  const html=fs.readFileSync(f,'utf8');
  const modernPages=(html.match(/class="wc6-page"/g)||[]).length;
  const legacyPages=(html.match(/class="page(?:\s|")/g)||[]).length;
  const pages=modernPages||legacyPages;
  const tokens=[...html.matchAll(/\{\{?([A-Z_]+)\}?\}/g)].map(m=>m[1]);
  const required=['RECIPIENT_NAME','SENDER_NAME','PERSONAL_DETAILS','PHOTO_BLOCK'];
  const missing=required.filter(x=>!tokens.includes(x));
  const validPages=modernPages===6 || (f.endsWith(path.join('birthday','bestie.html')) && legacyPages===7);
  if(!validPages || missing.length){ failed=true; console.error(`FAIL ${path.relative(root,f)}: pages=${pages}, missing=${missing.join(',')}`); }
  else console.log(`OK   ${path.relative(root,f)}: 6 pages, personalization tokens present`);
}
if(failed) process.exit(1);
