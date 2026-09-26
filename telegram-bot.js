/** Wish Craft Telegram Admin Bot — V16 Cinematic Birthday • Anniversary • Purpose Edition
 * Commands + inline controls.
 * UI settings persist in Supabase admin_settings.
 * When direct Supabase permissions are unavailable, settings/stats use the
 * protected server admin API as a fallback.
 */
require('dotenv').config();
const {createClient}=require('@supabase/supabase-js');

const TOKEN=String(process.env.TELEGRAM_BOT_TOKEN||'').trim();
const DEFAULT_CHAT=String(process.env.TELEGRAM_CHAT_ID||'').trim();
const ADMINS=new Set(String(process.env.TELEGRAM_ADMIN_CHAT_IDS||DEFAULT_CHAT).split(',').map(x=>x.trim()).filter(Boolean));
const BASE=`https://api.telegram.org/bot${encodeURIComponent(TOKEN)}`;
const SITE=String(process.env.SITE_URL||'').replace(/\/$/,'');
const ADMIN_PANEL_KEY=String(process.env.ADMIN_PANEL_KEY||'').trim();
const DBKEY=process.env.SUPABASE_SECRET_KEY||process.env.SUPABASE_SERVICE_ROLE_KEY;
const db=process.env.SUPABASE_URL&&DBKEY?createClient(process.env.SUPABASE_URL,DBKEY,{auth:{persistSession:false}}):null;

let lastHealth=null;

const THEMES={
 default:{name:'Default',mode:'light',purple:'#7657ff',pink:'#ed5b9c',ink:'#241d31',muted:'#797282',line:'#ece8f3',background:'#fcfbff',surface:'#ffffff',surface2:'#f7f4fb',radius:'20px',shadow:'0 18px 55px rgba(45,28,70,.10)',motion:'soft'},
 rose:{name:'Rose Romance',mode:'light',purple:'#c83d76',pink:'#ff8db7',ink:'#321824',muted:'#806875',line:'#f1dce6',background:'#fff8fb',surface:'#ffffff',surface2:'#fff0f5',radius:'24px',shadow:'0 22px 65px rgba(160,47,95,.13)',motion:'soft'},
 midnight:{name:'Midnight Luxe',mode:'dark',purple:'#8d7cff',pink:'#e879b2',ink:'#f5f1ff',muted:'#aaa1bd',line:'#342c49',background:'#0f0c18',surface:'#171322',surface2:'#211a30',radius:'22px',shadow:'0 24px 80px rgba(0,0,0,.35)',motion:'glow'},
 ocean:{name:'Ocean Glass',mode:'light',purple:'#287cff',pink:'#20c9c3',ink:'#152432',muted:'#607381',line:'#d8e8ef',background:'#f4fbff',surface:'#ffffff',surface2:'#eaf8fb',radius:'24px',shadow:'0 22px 65px rgba(32,107,146,.12)',motion:'soft'},
 forest:{name:'Forest Calm',mode:'light',purple:'#238d69',pink:'#8bcf6f',ink:'#17261f',muted:'#66776e',line:'#d9e9e0',background:'#f5fbf8',surface:'#ffffff',surface2:'#ebf7f0',radius:'20px',shadow:'0 20px 60px rgba(34,102,75,.12)',motion:'soft'},
 sunset:{name:'Sunset Pop',mode:'light',purple:'#e36a3b',pink:'#f3a04d',ink:'#2d211d',muted:'#7f7069',line:'#efdfd4',background:'#fff9f5',surface:'#ffffff',surface2:'#fff0e7',radius:'22px',shadow:'0 22px 65px rgba(194,93,48,.14)',motion:'bounce'},
 genz:{name:'Gen-Z Aurora',mode:'dark',purple:'#8b5cf6',pink:'#22d3ee',ink:'#f7f5ff',muted:'#b7b0c8',line:'#342c52',background:'#0b0912',surface:'#15111f',surface2:'#20182e',radius:'26px',shadow:'0 24px 85px rgba(139,92,246,.24)',motion:'bounce'},
 pearl:{name:'Pearl Minimal',mode:'light',purple:'#8b6d4d',pink:'#c8a878',ink:'#2b251e',muted:'#82786b',line:'#e8dfd2',background:'#faf7f1',surface:'#fffdf8',surface2:'#f3ede3',radius:'18px',shadow:'0 18px 55px rgba(84,63,37,.10)',motion:'minimal'},
 candy:{name:'Candy Dream',mode:'light',purple:'#8a63ff',pink:'#ff6fb5',ink:'#30263a',muted:'#7c7185',line:'#eee1f2',background:'#fff9fe',surface:'#ffffff',surface2:'#fff0fa',radius:'28px',shadow:'0 22px 65px rgba(161,87,175,.14)',motion:'bounce'},
 sakura:{name:'Sakura Night',mode:'dark',purple:'#ff6fba',pink:'#ffb36b',ink:'#fff6fb',muted:'#c9a9bb',line:'#4a273c',background:'#150b13',surface:'#21121d',surface2:'#2b1724',radius:'26px',shadow:'0 30px 90px rgba(255,83,164,.22)',motion:'soft'},
 lavender:{name:'Lavender Air',mode:'light',purple:'#7c5cff',pink:'#c58bff',ink:'#2d2740',muted:'#756d88',line:'#e4dcf4',background:'#faf8ff',surface:'#fff',surface2:'#f3efff',radius:'28px',shadow:'0 26px 78px rgba(117,88,185,.14)',motion:'soft'},
 mint:{name:'Mint Breeze',mode:'light',purple:'#0c9f83',pink:'#65d6bd',ink:'#17352f',muted:'#607a74',line:'#d8eee9',background:'#f3fffb',surface:'#fff',surface2:'#eafff8',radius:'24px',shadow:'0 24px 72px rgba(29,125,105,.13)',motion:'soft'},
 coral:{name:'Coral Bloom',mode:'light',purple:'#ef5d5d',pink:'#ff9a72',ink:'#382321',muted:'#806c69',line:'#f4ddd8',background:'#fff9f7',surface:'#fff',surface2:'#fff0eb',radius:'26px',shadow:'0 25px 75px rgba(205,91,76,.15)',motion:'bounce'},
 royal:{name:'Royal Ink',mode:'dark',purple:'#5c7cff',pink:'#a88cff',ink:'#f3f5ff',muted:'#a9b0c8',line:'#303852',background:'#0b1020',surface:'#131a2c',surface2:'#1a233a',radius:'22px',shadow:'0 30px 95px rgba(65,88,190,.28)',motion:'glow'},
 cocoa:{name:'Cocoa Letter',mode:'light',purple:'#8b5e3c',pink:'#d9a06d',ink:'#33251e',muted:'#7e7067',line:'#e9ddd3',background:'#fbf7f3',surface:'#fffdfa',surface2:'#f5ece5',radius:'20px',shadow:'0 22px 68px rgba(102,69,46,.12)',motion:'minimal'},
};
const BTN_STYLES=['glass','solid','outline','minimal','pill','glow','jelly','bubble','aurora','soft'];
const FONT_OPTIONS=['DM Sans','Inter','Poppins','Nunito','Manrope','Playfair Display','Lora','Dancing Script','Cormorant Garamond'];
const QR_TEMPLATES=['aurora','love','pop','neon','pearl'];

async function api(method,body={}){
  if(!TOKEN)return null;
  const r=await fetch(`${BASE}/${method}`,{
    method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)
  });
  const d=await r.json().catch(()=>null);
  if(!r.ok||!d?.ok)throw Error(d?.description||`Telegram ${method} failed`);
  return d.result;
}
function admin(id){return ADMINS.has(String(id))}
function menu(){
  return {inline_keyboard:[
    [{text:'📊 Stats',callback_data:'stats'},{text:'🕘 Recent',callback_data:'recent'}],
    [{text:'🩺 Health',callback_data:'health'},{text:'🎨 Theme',callback_data:'themes'}],
    [{text:'🔘 Buttons',callback_data:'buttons'},{text:'💌 6-Page Buttons',callback_data:'expbuttons'}],
    [{text:'▦ QR Studio',callback_data:'qr'},{text:'🧩 Template Lab',callback_data:'lab'}],
    [{text:'❓ Help',callback_data:'help'}]
  ]};
}
async function send(text,chatId=DEFAULT_CHAT,extra={}){
  if(!TOKEN||!chatId)return false;
  try{
    await api('sendMessage',{chat_id:chatId,text:String(text||'').slice(0,3900),disable_web_page_preview:true,...extra});
    return true;
  }catch(e){console.error('Telegram send:',e.message);return false}
}
function date(v){
  try{return v?new Date(v).toLocaleString('en-IN',{timeZone:process.env.TELEGRAM_TIMEZONE||'Asia/Kolkata'}):'—'}
  catch{return String(v||'—')}
}

async function adminApi(path,method='GET',body){
  if(!SITE||!ADMIN_PANEL_KEY)return null;
  const r=await fetch(`${SITE}${path}`,{
    method,
    headers:{'Content-Type':'application/json','x-admin-key':ADMIN_PANEL_KEY},
    body:body===undefined?undefined:JSON.stringify(body)
  });
  const d=await r.json().catch(()=>({}));
  if(!r.ok)throw Error(d?.error||`Website admin API ${r.status}`);
  return d;
}

function normalizeSettings(data){
  const out={site:{},experience:{}};
  const raw=data?.settings||data||{};
  if(raw.site_ui_overrides)out.site=raw.site_ui_overrides;
  if(raw.experience_ui_overrides)out.experience=raw.experience_ui_overrides;
  return out;
}

async function getSettings(){
  let directError=null;
  if(db){
    try{
      const {data,error}=await db.from('admin_settings').select('key,value')
        .in('key',['site_ui_overrides','experience_ui_overrides']);
      if(!error){
        const o={site:{},experience:{}};
        for(const x of data||[]){
          let v={};try{v=JSON.parse(x.value||'{}')}catch{}
          if(x.key==='site_ui_overrides')o.site=v;
          if(x.key==='experience_ui_overrides')o.experience=v;
        }
        return o;
      }
      directError=error;
    }catch(e){directError=e}
  }
  try{
    const d=await adminApi('/api/admin/settings');
    return normalizeSettings(d);
  }catch(e){
    if(directError)throw Error(`Supabase admin_settings unavailable: ${directError.message||directError}. ${e.message||''}`.trim());
    throw e;
  }
}

async function saveSetting(key,value){
  if(db){
    try{
      const {error}=await db.from('admin_settings').upsert(
        {key,value:JSON.stringify(value),updated_at:new Date().toISOString()},
        {onConflict:'key'}
      );
      if(!error)return;
    }catch(_){}
  }
  await adminApi('/api/admin/settings','POST',{[key]:value});
}

async function setSite(patch){
  const s=await getSettings();
  const next={...s.site,...patch};
  if(patch.theme)next.theme={...(s.site.theme||{}),...patch.theme};
  if(patch.back)next.back={...(s.site.back||{}),...patch.back};
  await saveSetting('site_ui_overrides',next);
}
async function setExp(patch){
  const s=await getSettings();
  const next={...s.experience,...patch};
  if(patch.back)next.back={...(s.experience.back||{}),...patch.back};
  await saveSetting('experience_ui_overrides',next);
}

async function setQr(patch){
  let current={defaultTemplate:'aurora',defaultColor:'#241d31',shareCardRatio:'1:1'};
  try{const s=await getSettings();if(s.site?.qr)current={...current,...s.site.qr}}catch(_){ }
  try{if(db){const {data}=await db.from('admin_settings').select('value').eq('key','qr_settings').maybeSingle();if(data?.value)current={...current,...JSON.parse(data.value)}}}catch(_){ }
  current={...current,...patch};await saveSetting('qr_settings',current);return current;
}
function qrKeyboard(){return {inline_keyboard:[QR_TEMPLATES.slice(0,3).map(k=>({text:k,callback_data:'qr:t:'+k})),QR_TEMPLATES.slice(3).map(k=>({text:k,callback_data:'qr:t:'+k})),[{text:'⬅️ Dashboard',callback_data:'home'}]]}}
async function stats(){
  try{
    const d=await adminApi('/api/admin/overview');
    if(d)return `📊 Wish Craft\n\nTotal wishes: ${d.totalWishes||0}\nActive recent: ${d.activeRecent||0}\n\nServer time: ${date(d.serverTime)}`;
  }catch(_){}
  if(!db)return '🗄️ Database is not configured.';
  const {count,error}=await db.from('wishes').select('id',{head:true,count:'exact'});
  if(error)throw error;
  const {data,error:e}=await db.from('wishes').select('view_count,qr_scan_count').limit(1000);
  if(e)throw e;
  return `📊 Wish Craft\n\nTotal wishes: ${count||0}\nViews: ${(data||[]).reduce((a,x)=>a+Number(x.view_count||0),0)}\nQR scans: ${(data||[]).reduce((a,x)=>a+Number(x.qr_scan_count||0),0)}`;
}
async function recent(){
  try{
    const d=await adminApi('/api/admin/overview');
    if(d?.wishes)return '🕘 Recent wishes\n\n'+d.wishes.slice(0,8).map((x,i)=>
      `${i+1}. ${x.name||'Someone Special'} · ${x.relation||''}\n   ${x.style||'Default'} · ${date(x.created_at)}\n   /w/${x.short_id} · views ${x.view_count||0}`
    ).join('\n\n')||'No wishes found.';
  }catch(_){}
  if(!db)return 'Database is not configured.';
  const {data,error}=await db.from('wishes').select('short_id,name,relation,style,created_at,view_count')
    .order('created_at',{ascending:false}).limit(8);
  if(error)throw error;
  if(!data?.length)return 'No wishes found.';
  return '🕘 Recent wishes\n\n'+data.map((x,i)=>`${i+1}. ${x.name||'Someone Special'} · ${x.relation||''}\n   ${x.style||'Default'} · ${date(x.created_at)}\n   /w/${x.short_id} · views ${x.view_count||0}`).join('\n\n');
}
async function health(){
  let site='not configured',dbok=false;
  if(SITE){try{const r=await fetch(`${SITE}/api/health`);site=r.ok?'online':'error'}catch{site='offline'}}
  if(db){try{const {error}=await db.from('wishes').select('id',{head:true,count:'exact'}).limit(1);dbok=!error}catch{}}
  if(!dbok&&SITE&&ADMIN_PANEL_KEY){
    try{const d=await adminApi('/api/admin/overview');dbok=!!d?.database}catch{}
  }
  return `🩺 Wish Craft health\n\nBot: online\nDatabase: ${dbok?'online':'error/off'}\nWebsite: ${site}\nAdmin: ${ADMINS.size?'configured':'not configured'}\nSettings API fallback: ${SITE&&ADMIN_PANEL_KEY?'ready':'not configured'}`;
}
function help(){
  return `🤖 Wish Craft Admin Bot — V16 Birthday • Anniversary • Purpose Edition

BASIC
/start — dashboard
/help — complete guide
/id — show your Telegram chat ID
/status — bot + website + database status

WEBSITE THEME
/theme default
/theme rose
/theme midnight
/theme ocean
/theme forest
/theme sunset
/theme genz
/theme pearl
/theme candy
/theme sakura
/theme lavender
/theme mint
/theme coral
/theme royal
/theme cocoa

WEBSITE FONTS
/font body DM Sans
/font heading Playfair Display
/font script Dancing Script

MAIN WEBSITE BACK/BUTTONS
/button position footer
/button position header
/button style glass
/button style solid
/button style outline
/button style minimal
/button style pill
/button text ← Back
/button on
/button off
/button style jelly|bubble|aurora|glow|soft

6-PAGE EXPERIENCE
/experience-back position footer
/experience-back position header
/experience-back style glass|solid|outline|minimal|pill
/experience-back text ← Back
/experience-back on
/experience-back off

QR STUDIO
/qr — open QR controls
/qr template aurora|love|pop|neon|pearl
/qr color #241d31

TEMPLATE LAB
/lab — open template controls for the 7 active templates

INFO
/stats — total wishes + recent activity
/recent — latest wishes
/health — health check
/wish ABC123 — lookup wish

INLINE MENU
🎨 Theme = whole website theme
🔘 Buttons = main website Back/button controls
💌 6-Page Buttons = generated 6-page controls
📊 Stats / 🕘 Recent / 🩺 Health
❓ Help = this guide

IMPORTANT
Only Telegram IDs in TELEGRAM_ADMIN_CHAT_IDS can change settings.`;
}
function themesKeyboard(){
  const keys=Object.keys(THEMES);
  return {inline_keyboard:[
    keys.slice(0,3).map(k=>({text:THEMES[k].name,callback_data:'theme:'+k})),
    keys.slice(3,6).map(k=>({text:THEMES[k].name,callback_data:'theme:'+k})),
    keys.slice(6,9).map(k=>({text:THEMES[k].name,callback_data:'theme:'+k})),
    keys.slice(9,10).map(k=>({text:THEMES[k].name,callback_data:'theme:'+k})),
    [{text:'⬅️ Dashboard',callback_data:'home'}]
  ]};
}
function buttonKeyboard(exp=false){
  const p=exp?'exp:':'site:';
  return {inline_keyboard:[
    [{text:'⬅️ Footer',callback_data:p+'pos:footer'},{text:'⬆️ Header',callback_data:p+'pos:header'}],
    [{text:'🫧 Glass',callback_data:p+'style:glass'},{text:'⬛ Solid',callback_data:p+'style:solid'},{text:'◻️ Outline',callback_data:p+'style:outline'}],
    [{text:'〰️ Minimal',callback_data:p+'style:minimal'},{text:'💊 Pill',callback_data:p+'style:pill'},{text:'✨ Glow',callback_data:p+'style:glow'}],
    [{text:'🍬 Jelly',callback_data:p+'style:jelly'},{text:'⭕ Bubble',callback_data:p+'style:bubble'},{text:'🌈 Aurora',callback_data:p+'style:aurora'}],
    [{text:'☁️ Soft',callback_data:p+'style:soft'},{text:'⬅️ Dashboard',callback_data:'home'}]
  ]};
}
async function lookup(id){
  id=String(id||'').trim().replace(/^\/w\//,'');
  if(!id)return 'Use: /wish ABC123';
  try{
    const d=await adminApi('/api/admin/wish/'+encodeURIComponent(id));
    return `🔎 Wish ${d.id}\n\nName: ${d.name}\nRelation: ${d.relation}\nStyle: ${d.style||'Default'}\nCreated: ${date(d.createdAt)}\nExpires: ${date(d.expiresAt)}\nViews: ${d.views||0}\nQR scans: ${d.qrScans||0}\nPhoto: ${d.photoPath?'yes':'no'}${SITE?`\n\n${SITE}/w/${d.id}`:''}`;
  }catch(_){}
  if(!db)return 'Database is not configured.';
  const {data,error}=await db.from('wishes').select('short_id,name,relation,style,created_at,expires_at,view_count,qr_scan_count,photo_path').eq('short_id',id).maybeSingle();
  if(error)throw error;if(!data)return 'Wish not found.';
  return `🔎 Wish ${data.short_id}\n\nName: ${data.name}\nRelation: ${data.relation}\nStyle: ${data.style||'Default'}\nCreated: ${date(data.created_at)}\nExpires: ${date(data.expires_at)}\nViews: ${data.view_count||0}\nQR scans: ${data.qr_scan_count||0}\nPhoto: ${data.photo_path?'yes':'no'}${SITE?`\n\n${SITE}/w/${data.short_id}`:''}`;
}

async function applyTheme(k,id){
  const t=THEMES[k];if(!t)throw Error('Unknown theme');
  await setSite({themeName:k,theme:t});
  return send(`✅ Website theme changed to ${t.name}.\n\nAll normal website pages use it after refresh.`,id,{reply_markup:menu()});
}
async function callback(cb){
  const id=String(cb.from?.id||cb.message?.chat?.id||'');
  await api('answerCallbackQuery',{callback_query_id:cb.id}).catch(()=>{});
  const a=cb.data||'';
  try{
    if(a==='help')return send(help(),id,{reply_markup:menu()});
    if(a==='home')return send('✨ Wish Craft Admin Dashboard\n\nChoose an action:',id,{reply_markup:menu()});
    if(a==='themes'){
      if(!admin(id))return send('🔒 Admin-only.',id);
      return send('🎨 Choose website theme. Default is the original Wish Craft theme.',id,{reply_markup:themesKeyboard()});
    }
    if(a==='buttons'||a==='expbuttons'){
      if(!admin(id))return send('🔒 Admin-only.',id);
      return send(a==='buttons'?'🔘 Main website Back/button controls':'💌 6-page experience Back controls',id,{reply_markup:buttonKeyboard(a==='expbuttons')});
    }
    if(!admin(id))return send('🔒 Admin-only.',id,{reply_markup:menu()});
    if(a.startsWith('theme:'))return applyTheme(a.slice(6),id);
    if(a.startsWith('font:')){const parts=a.split(':');const kind=parts[1],name=parts.slice(2).join(':');if(!['body','heading','script'].includes(kind)||!FONT_OPTIONS.includes(name))throw Error('Invalid font');const s=await getSettings();const next={...(s.site||{}),font:{...((s.site||{}).font||{}),[kind]:name}};await setSite(next);return send(`✅ ${kind} font changed to ${name}.`,id,{reply_markup:menu()});}
    if(a.startsWith('site:pos:')){const v=a.split(':')[2];if(!['footer','header'].includes(v))throw Error('Invalid position');await setSite({back:{position:v}});return send(`✅ Main website Back button: ${v}.`,id,{reply_markup:menu()});}
    if(a.startsWith('site:style:')){const v=a.split(':')[2];if(!BTN_STYLES.includes(v))throw Error('Invalid style');await setSite({buttonStyle:v,back:{style:v}});return send(`✅ Main website button style: ${v}.`,id,{reply_markup:menu()});}
    if(a.startsWith('exp:pos:')){const v=a.split(':')[2];if(!['footer','header'].includes(v))throw Error('Invalid position');await setExp({back:{position:v}});return send(`✅ 6-page Back button: ${v}.`,id,{reply_markup:menu()});}
    if(a.startsWith('exp:style:')){const v=a.split(':')[2];if(!BTN_STYLES.includes(v))throw Error('Invalid style');await setExp({back:{style:v}});return send(`✅ 6-page Back style: ${v}.`,id,{reply_markup:menu()});}
    if(a==='qr'){return send('▦ QR Studio\n\nChoose the default 1:1 QR card template.',id,{reply_markup:qrKeyboard()});}
    if(a.startsWith('qr:t:')){const v=a.slice(5);if(!QR_TEMPLATES.includes(v))throw Error('Invalid QR template');await setQr({defaultTemplate:v});return send(`✅ QR default template: ${v}.`,id,{reply_markup:menu()});}
    if(a==='stats')return send(await stats(),id,{reply_markup:menu()});
    if(a==='recent')return send(await recent(),id,{reply_markup:menu()});
    if(a==='health')return send(await health(),id,{reply_markup:menu()});
  }catch(e){return send(`❌ ${e.message}`,id,{reply_markup:menu()})}
}
async function handle(u){
  const msg=u?.message,cb=u?.callback_query;
  if(cb)return callback(cb);
  if(!msg?.text)return;
  const id=String(msg.chat.id),parts=msg.text.trim().split(/\s+/);
  const cmd=parts[0].toLowerCase().split('@')[0];
  const arg=parts.slice(1).join(' ').trim();
  try{
    if(cmd==='/start')return send('✨ Wish Craft Admin Dashboard\n\nBot commands + inline controls are active.',id,{reply_markup:menu()});
    if(cmd==='/help')return send(help(),id,{reply_markup:menu()});
    if(cmd==='/id')return send(`🆔 Chat ID: ${id}\n\nAdd this to TELEGRAM_ADMIN_CHAT_IDS.`,id);
    if(cmd==='/status')return send(await health(),id,{reply_markup:menu()});
    const adminCmds=['/stats','/recent','/health','/wish','/theme','/button','/experience-back','/experience_back','/qr','/lab'];
    if(adminCmds.includes(cmd)&&!admin(id))return send('🔒 Admin-only command.',id,{reply_markup:menu()});
    if(cmd==='/stats')return send(await stats(),id,{reply_markup:menu()});
    if(cmd==='/recent')return send(await recent(),id,{reply_markup:menu()});
    if(cmd==='/health')return send(await health(),id,{reply_markup:menu()});
    if(cmd==='/wish')return send(await lookup(parts[1]),id,{reply_markup:menu()});

    if(cmd==='/theme'){
      const k=(parts[1]||'').toLowerCase();
      if(!THEMES[k])return send('Use /theme default|rose|midnight|ocean|forest|sunset|genz|pearl|candy|sakura',id,{reply_markup:themesKeyboard()});
      return applyTheme(k,id);
    }

    if(cmd==='/font'){
      const kind=(parts[1]||'').toLowerCase(),name=parts.slice(2).join(' ').trim();
      if(!['body','heading','script'].includes(kind)||!FONT_OPTIONS.includes(name))return send('Use /font body DM Sans | /font heading Playfair Display | /font script Dancing Script',id,{reply_markup:menu()});
      const s=await getSettings();const next={...(s.site||{}),font:{...((s.site||{}).font||{}),[kind]:name}};await setSite(next);return send(`✅ ${kind} font changed to ${name}.`,id,{reply_markup:menu()});
    }

    if(cmd==='/button'){
      const sub=(parts[1]||'').toLowerCase();
      if(sub==='position'&&['footer','header'].includes(parts[2])){
        await setSite({back:{position:parts[2]}});
        return send(`✅ Main website Back button moved to ${parts[2]}.`,id,{reply_markup:menu()});
      }
      if(sub==='style'&&BTN_STYLES.includes(parts[2])){
        await setSite({buttonStyle:parts[2],back:{style:parts[2]}});
        return send(`✅ Main website button style: ${parts[2]}.`,id,{reply_markup:menu()});
      }
      if(sub==='text'&&arg.slice(5).trim()){
        await setSite({back:{text:arg.slice(5).trim().slice(0,40)}});
        return send('✅ Main website Back button text updated.',id,{reply_markup:menu()});
      }
      if(['on','off'].includes(sub)){
        await setSite({back:{enabled:sub==='on'}});
        return send(`✅ Main website Back button ${sub==='on'?'enabled':'disabled'}.`,id,{reply_markup:menu()});
      }
      return send('🔘 Main button examples:\n/button position header\n/button position footer\n/button style glass\n/button style solid\n/button text ← Back\n/button on\n/button off',id,{reply_markup:buttonKeyboard(false)});
    }

    if(cmd==='/qr'){
      const sub=(parts[1]||'').toLowerCase();
      if(!sub)return send('▦ QR Studio\n/qr template aurora|love|pop|neon|pearl\n/qr color #241d31',id,{reply_markup:qrKeyboard()});
      if(sub==='template'&&QR_TEMPLATES.includes((parts[2]||'').toLowerCase())){await setQr({defaultTemplate:parts[2].toLowerCase()});return send(`✅ QR default template: ${parts[2].toLowerCase()}.`,id,{reply_markup:menu()})}
      if(sub==='color'&&/^#[0-9a-f]{6}$/i.test(parts[2]||'')){await setQr({defaultColor:parts[2]});return send(`✅ QR default color: ${parts[2]}.`,id,{reply_markup:menu()})}
      return send('Use /qr template aurora|love|pop|neon|pearl or /qr color #241d31',id,{reply_markup:qrKeyboard()});
    }

    if(cmd==='/experience-back'||cmd==='/experience_back'){
      const sub=(parts[1]||'').toLowerCase();
      if(sub==='position'&&['footer','header'].includes(parts[2])){
        await setExp({back:{position:parts[2]}});
        return send(`✅ 6-page Back button moved to ${parts[2]}.`,id,{reply_markup:menu()});
      }
      if(sub==='style'&&BTN_STYLES.includes(parts[2])){
        await setExp({back:{style:parts[2]}});
        return send(`✅ 6-page Back style: ${parts[2]}.`,id,{reply_markup:menu()});
      }
      if(sub==='text'&&arg.slice(5).trim()){
        await setExp({back:{text:arg.slice(5).trim().slice(0,40)}});
        return send('✅ 6-page Back text updated.',id,{reply_markup:menu()});
      }
      if(['on','off'].includes(sub)){
        await setExp({back:{enabled:sub==='on'}});
        return send(`✅ 6-page Back button ${sub==='on'?'enabled':'disabled'}.`,id,{reply_markup:menu()});
      }
      return send('💌 6-page examples:\n/experience-back position header\n/experience-back position footer\n/experience-back style glass\n/experience-back style solid\n/experience-back text ← Back\n/experience-back on\n/experience-back off',id,{reply_markup:buttonKeyboard(true)});
    }
  }catch(e){return send(`❌ ${e.message}`,id,{reply_markup:menu()})}
}
async function setCommands(){
  if(!TOKEN)return;
  await api('setMyCommands',{commands:[
    {command:'start',description:'Open admin dashboard'},
    {command:'help',description:'Complete bot guide'},
    {command:'id',description:'Show your Telegram chat ID'},
    {command:'status',description:'Bot/site/database status'},
    {command:'theme',description:'Change whole website theme'},
    {command:'font',description:'Change website fonts'},
    {command:'button',description:'Main website Back/button controls'},
    {command:'experience_back',description:'6-page Back button controls'},
    {command:'qr',description:'QR Studio template and color controls'},
    {command:'lab',description:'Open hidden Template Lab'},
    {command:'stats',description:'Website statistics'},
    {command:'recent',description:'Latest wishes'},
    {command:'health',description:'Health check'},
    {command:'wish',description:'Lookup a wish by ID'}
  ]});
}
async function monitor(){
  if(!TOKEN||!ADMINS.size)return;
  try{
    const h=await health();
    const bad=/Database: (error\/off)|Website: (offline|error)/.test(h);
    if(lastHealth===null)lastHealth=bad;
    else if(bad!==lastHealth){lastHealth=bad;await send((bad?'🚨 ALERT — ':'✅ RECOVERY — ')+h);}
  }catch(e){console.error('Telegram monitor:',e.message)}
}
async function poll(){
  if(!TOKEN){console.warn('Telegram bot disabled: TELEGRAM_BOT_TOKEN is not set.');return}
  console.log('Wish Craft Telegram bot started.');
  await setCommands().catch(e=>console.error('Telegram setMyCommands:',e.message));
  let offset=Number(process.env.TELEGRAM_UPDATE_OFFSET||0);
  setInterval(monitor,60000).unref();
  monitor();
  while(true){
    try{
      const us=await api('getUpdates',{timeout:25,offset,allowed_updates:['message','callback_query']});
      for(const u of us||[]){offset=Number(u.update_id)+1;try{await handle(u)}catch(e){console.error('Telegram handler:',e.message)}}
    }catch(e){
      console.error('Telegram polling:',e.message);
      await new Promise(r=>setTimeout(r,2000));
    }
  }
}
if(require.main===module)poll();
module.exports={notify:send,poll};
