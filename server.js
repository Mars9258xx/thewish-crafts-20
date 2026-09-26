/**
 * ============================================================
 * Wish Craft — server.js (CORE / LOCKED)
 * ============================================================
 * YE FILE MAIN BRAIN HAI.
 *
 * Yahan change karne se kya hota hai:
 * - API routes change → frontend toot sakta hai
 * - Photo upload / expiry / cleanup logic change → data loss possible
 * - Telegram function → notifications
 * - builtInWish() → fallback wish text
 * - Gemini prompt → AI response style
 *
 * SAFE areas (agar bilkul zaroori ho):
 * - builtInWish function ke andar text
 * - Telegram message templates
 * - Rate limit numbers
 *
 * Mat chhedna:
 * - Route names (/api/generate-wish, /api/save-wish, /w/:id etc.)
 * - Database field names
 * - Photo path validation
 * - Expiry calculation core
 *
 * Telegram Bot future mein is file mein controlled admin routes add honge,
 * lekin core logic protected rahega.
 * ============================================================
 */

const express = require("express");
const path = require("path");
const crypto = require("crypto");
const multer = require("multer");
const { createClient } = require("@supabase/supabase-js");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;
const MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";
const USE_GEMINI = String(process.env.USE_GEMINI || "false").toLowerCase() === "true";
const SUPABASE_KEY = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
const ROOT = __dirname;
const PHOTO_BUCKET = process.env.SUPABASE_PHOTO_BUCKET || "wish-photos";
const PHOTO_MAX_BYTES = Number(process.env.PHOTO_MAX_BYTES || 1500000);
const DEFAULT_EXPIRY = process.env.DEFAULT_WISH_EXPIRY || "3d";
const ADMIN_KEY = String(process.env.ADMIN_PANEL_KEY || "").trim();
const SITE_URL = String(process.env.SITE_URL || "").trim().replace(/\/$/, "");
const TELEGRAM_TIMEZONE = String(process.env.TELEGRAM_TIMEZONE || "Asia/Kolkata");
const TEMP_ORPHAN_MAX_AGE_MS = Number(process.env.TEMP_ORPHAN_MAX_AGE_MS || 60 * 60 * 1000);
const METRICS_FLUSH_MS = Number(process.env.METRICS_FLUSH_MS || 60 * 1000);
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: PHOTO_MAX_BYTES, files: 1 }
});

if (!process.env.SUPABASE_URL || !SUPABASE_KEY) {
  console.warn("WARNING: SUPABASE_URL / SUPABASE_SECRET_KEY are not configured. Wish storage will be unavailable until they are added.");
}
const supabase = process.env.SUPABASE_URL && SUPABASE_KEY
  ? createClient(process.env.SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: false } })
  : null;

app.use(express.json({ limit: "700kb" }));
function makeAdminSession(){
  const ts=String(Date.now());
  const sig=crypto.createHmac("sha256",ADMIN_KEY).update(ts).digest("hex");
  return ts+"."+sig;
}
function validAdminSession(req){
  if(!ADMIN_KEY)return false;
  const raw=String(req.headers.cookie||"").split(";").map(x=>x.trim()).find(x=>x.startsWith("wc_admin_session="));
  if(!raw)return false;
  const token=raw.slice("wc_admin_session=".length);
  const [ts,sig]=token.split(".");
  if(!ts||!sig||Date.now()-Number(ts)>1000*60*60*8)return false;
  const expected=crypto.createHmac("sha256",ADMIN_KEY).update(ts).digest("hex");
  const a=Buffer.from(sig),b=Buffer.from(expected);
  return a.length===b.length&&crypto.timingSafeEqual(a,b);
}
app.post("/api/admin/session",(req,res)=>{
  if(!allowed(req.ip, 5, 15 * 60 * 1000)) return res.status(429).json({error:"Too many admin login attempts. Try again later."});
  const supplied=String(req.body?.key||req.get("x-admin-key")||"");
  if(!ADMIN_KEY) return res.status(503).json({error:"Admin panel is not configured. Set ADMIN_PANEL_KEY."});
  const a=Buffer.from(supplied),b=Buffer.from(ADMIN_KEY);
  if(a.length!==b.length||!a.length||!crypto.timingSafeEqual(a,b)) return res.status(401).json({error:"Invalid admin key"});
  res.setHeader("Set-Cookie",`wc_admin_session=${makeAdminSession()}; Max-Age=28800; Path=/; HttpOnly; SameSite=Lax${process.env.NODE_ENV==='production'?'; Secure':''}`);
  res.json({ok:true});
});
app.post("/api/admin/logout",(req,res)=>{res.setHeader("Set-Cookie","wc_admin_session=; Max-Age=0; Path=/; HttpOnly; SameSite=Lax");res.json({ok:true})});
app.disable("x-powered-by");
app.set("trust proxy", 1);

const metricState = { date: "", total: 0, api: 0, page: 0, errors: 0, byHour: {}, byPath: {}, errorRows: [], lastReportDate: "" };
function metricLocalParts(d=new Date()){
  const parts=new Intl.DateTimeFormat('en-CA',{timeZone:TELEGRAM_TIMEZONE,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',hour12:false}).formatToParts(d).reduce((a,x)=>(a[x.type]=x.value,a),{});
  return {date:`${parts.year}-${parts.month}-${parts.day}`,hour:Number(parts.hour)};
}
function ensureMetricDay(){const x=metricLocalParts();if(metricState.date!==x.date){metricState.date=x.date;metricState.total=0;metricState.api=0;metricState.page=0;metricState.errors=0;metricState.byHour={};metricState.byPath={};metricState.errorRows=[];}return x;}
function recordMetric(req,status,ms){const x=ensureMetricDay();metricState.total++;if(req.path.startsWith('/api/'))metricState.api++;else metricState.page++;if(status>=400){metricState.errors++;metricState.errorRows.push({time:new Date().toISOString(),path:req.path,status,ms});if(metricState.errorRows.length>100)metricState.errorRows.shift();}metricState.byHour[x.hour]=(metricState.byHour[x.hour]||0)+1;metricState.byPath[req.path]=(metricState.byPath[req.path]||0)+1;}
async function flushMetrics(){if(!supabase)return;try{const x=ensureMetricDay();const payload={date:metricState.date,total:metricState.total,api:metricState.api,page:metricState.page,errors:metricState.errors,byHour:metricState.byHour,byPath:metricState.byPath,errorRows:metricState.errorRows,updatedAt:new Date().toISOString()};await supabase.from('admin_daily_metrics').upsert({metric_date:payload.date,payload:JSON.stringify(payload),updated_at:new Date().toISOString()},{onConflict:'metric_date'});}catch(e){console.error('Metrics flush failed:',e.message)}}
function formatDailyReport(data){const hours=Object.entries(data.byHour||{}).sort((a,b)=>Number(a[0])-Number(b[0])).map(([h,n])=>`${String(h).padStart(2,'0')}:00–${String((Number(h)+1)%24).padStart(2,'0')}:00  ${n}`).join('\n')||'No traffic recorded';const top=Object.entries(data.byPath||{}).sort((a,b)=>b[1]-a[1]).slice(0,8).map(([p,n])=>`${n}× ${p}`).join('\n')||'—';const errs=(data.errorRows||[]).slice(-10).map(e=>`${e.status} ${e.path} @ ${new Date(e.time).toLocaleTimeString('en-IN',{timeZone:TELEGRAM_TIMEZONE})}`).join('\n')||'No errors recorded';return `🌙 Wish Craft — Daily Report\n📅 ${data.date}\n\n📊 Traffic\nTotal requests: ${data.total||0}\nPage requests: ${data.page||0}\nAPI requests: ${data.api||0}\nErrors (4xx/5xx): ${data.errors||0}\n\n⏱ Hourly traffic\n${hours}\n\n🔥 Top paths\n${top}\n\n🚨 Recent errors\n${errs}\n\n🗄️ Data: Supabase metrics snapshot\n🕒 Timezone: ${TELEGRAM_TIMEZONE}`;}
async function sendDailyReportIfDue(){const x=metricLocalParts();if(x.hour!==23)return;if(metricState.lastReportDate===x.date)return;await flushMetrics();try{let data={...metricState};if(supabase){const {data:row}=await supabase.from('admin_daily_metrics').select('payload').eq('metric_date',x.date).maybeSingle();if(row?.payload)try{data=JSON.parse(row.payload)}catch{}}await telegram(formatDailyReport(data));metricState.lastReportDate=x.date;}catch(e){console.error('Daily report failed:',e.message)}}
app.use((req,res,next)=>{const started=Date.now();res.on('finish',()=>recordMetric(req,res.statusCode,Date.now()-started));next();});
app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("X-Frame-Options", "SAMEORIGIN");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  if (process.env.NODE_ENV === "production") res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  if (req.path.startsWith("/api/") && req.method === "OPTIONS") return res.status(204).end();
  next();
});

app.use(express.static(path.join(ROOT, "public"), { extensions: ["html"] }));

const hits = new Map();
function allowed(ip, limit = 12, windowMs = 3600000) {
  const now = Date.now();
  const key = String(ip || "unknown");
  const x = hits.get(key) || [];
  const fresh = x.filter(t => now - t < windowMs);
  if (fresh.length >= limit) { hits.set(key, fresh); return false; }
  fresh.push(now); hits.set(key, fresh);
  if (hits.size > 10000) {
    for (const [k, v] of hits) if (!v.some(t => now - t < windowMs)) hits.delete(k);
  }
  return true;
}
function clean(s, max = 120) { return String(s ?? "").replace(/[<>]/g, "").trim().slice(0, max); }


// Final safety pass for legacy/custom templates. Supports optional PHOTO_URL tokens.
function normalizeWishHtml(html, photoUrl = "") {
  let out = String(html || "");
  if (photoUrl) out = out.replace(/\{\{PHOTO_URL\}\}|\{PHOTO_URL\}/g, photoUrl);
  return out;
}

function escapeHtmlAttr(value) {
  return String(value ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\"/g, "&quot;").replace(/'/g, "&#39;");
}

function recipientMood(relation = "", style = "") {
  const text = `${relation} ${style}`.toLowerCase();
  if (/annivers|couple|husband|wife|partner|love|romantic|girlfriend|boyfriend/.test(text)) return { accent: "#A85C86", accent2: "#D95E7F", soft: "#FFF1F5", icon: "♡", eyebrow: "A little love, made just for you", title: "You have a wish waiting for you" };
  if (/thank|gratitude|teacher|mentor/.test(text)) return { accent: "#B56A83", accent2: "#D89A57", soft: "#FFF7EF", icon: "✦", eyebrow: "A little note of gratitude", title: "Someone made something special for you" };
  if (/birthday|bestie|friend|brother|sister|boy|girl|cute/.test(text)) return { accent: "#E76F8E", accent2: "#D89A57", soft: "#FFF5F7", icon: "✿", eyebrow: "A little celebration, made just for you", title: "You have a special wish waiting" };
  return { accent: "#A85C86", accent2: "#D89A57", soft: "#FFF7F8", icon: "✧", eyebrow: "A little something, made just for you", title: "You have a special wish waiting" };
}

function recipientStatusPage(code, title, message) {
  const isExpired = Number(code) === 410;
  const label = isExpired ? "This moment has passed" : Number(code) === 404 ? "Wish Craft · 404" : "Wish Craft · unavailable";
  const icon = isExpired ? "♡" : "✦";
  const safeTitle = escapeHtmlAttr(title);
  const safeMessage = escapeHtmlAttr(message);
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><meta name="theme-color" content="#E76F8E"><meta name="robots" content="noindex,nofollow,noarchive"><title>${safeTitle} — Wish Craft</title><link rel="icon" type="image/svg+xml" href="/favicon.svg"><link rel="preconnect" href="https://fonts.googleapis.com"><link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet"><style>:root{--rose:#E76F8E;--deep:#D95E7F;--plum:#A85C86;--ink:#3A2630;--muted:#786A71;--bg:#FFFCFC}*{box-sizing:border-box}body{margin:0;min-height:100vh;display:grid;place-items:center;padding:18px;background:radial-gradient(circle at 10% 8%,rgba(255,255,255,.98),transparent 34%),radial-gradient(circle at 92% 10%,rgba(231,111,142,.13),transparent 30%),radial-gradient(circle at 50% 100%,rgba(168,92,134,.08),transparent 36%),var(--bg);font-family:"Plus Jakarta Sans",system-ui,sans-serif;color:var(--ink)}main{width:min(620px,100%);padding:clamp(28px,7vw,52px) clamp(20px,7vw,44px);text-align:center;background:rgba(255,255,255,.92);border:1px solid rgba(168,92,134,.14);border-radius:32px;box-shadow:0 30px 90px rgba(58,38,48,.13)}.brand{display:block;width:150px;max-width:65%;margin:0 auto 28px}.icon{width:68px;height:68px;margin:0 auto 20px;border-radius:22px;display:grid;place-items:center;background:linear-gradient(145deg,var(--rose),var(--plum));color:#fff;font-size:28px;box-shadow:0 14px 34px rgba(168,92,134,.18)}.code{font-size:10px;letter-spacing:.15em;text-transform:uppercase;font-weight:800;color:var(--plum)}h1{margin:10px 0 12px;font:700 clamp(2rem,6vw,3.25rem)/1.08 "Playfair Display",Georgia,serif}p{max-width:48ch;margin:0 auto 25px;color:var(--muted);line-height:1.75;font-size:.95rem}.actions{display:flex;justify-content:center;gap:10px;flex-wrap:wrap}.btn{display:inline-flex;align-items:center;justify-content:center;min-height:44px;padding:0 18px;border-radius:999px;text-decoration:none;font-weight:800;font-size:.82rem}.primary{color:#fff;background:linear-gradient(135deg,var(--rose),var(--plum));box-shadow:0 10px 24px rgba(168,92,134,.2)}.secondary{color:var(--ink);background:#fff;border:1px solid #eadfe4}@media(max-width:520px){main{border-radius:26px}.brand{margin-bottom:22px}}</style></head><body><main role="main"><img class="brand" src="/assets/brand/wishcraft-logo.svg" alt="Wish Craft"><div class="icon" aria-hidden="true">${icon}</div><div class="code">${label}</div><h1>${safeTitle}</h1><p>${safeMessage}</p><div class="actions"><a class="btn primary" href="/">Create a new wish</a><a class="btn secondary" href="/about.html">About Wish Craft</a></div></main></body></html>`;
}
function ensureRecipientImageAlts(html) {
  return String(html || "").replace(/<img\b([^>]*?)(?:\/?)>/gi, (tag, attrs) => {
    if (/\balt\s*=/i.test(attrs)) return tag;
    return tag.replace(/\s*\/?\s*>$/, ' alt="Wish Craft image">');
  });
}

function enhanceRecipientWish(html, meta = {}, photoUrl = "") {
  let out = ensureRecipientImageAlts(String(html || ""));
  if (!/<main\b/i.test(out)) out = out.replace(/<body(\b[^>]*)>/i, `$&<main id="wc-recipient-main" tabindex="-1">`).replace(/<\/body>/i, `</main></body>`);
  const mood = recipientMood(meta.relation, meta.style);
  const name = escapeHtmlAttr(meta.name || "Someone Special");
  const photo = escapeHtmlAttr(photoUrl || "");
  const photoBlock = photo && !/alt=["']Recipient photo["']/i.test(out)
    ? `<section class="wc-memory-photo" aria-label="Shared photo"><div class="wc-memory-photo__label">A little memory for you</div><img src="${photo}" alt="A photo shared with ${name}" loading="eager"></section>` : "";
  const style = `<style id="wc-recipient-experience">
    :root{--wc-r:${mood.accent};--wc-r2:${mood.accent2};--wc-soft:${mood.soft};--wc-action:#B84F6D}
    #wc-gift-gate{position:fixed;inset:0;z-index:2147483000;display:grid;place-items:center;padding:24px;background:radial-gradient(circle at 15% 15%,rgba(255,255,255,.96),transparent 34%),radial-gradient(circle at 88% 12%,color-mix(in srgb,var(--wc-r) 18%,white),transparent 34%),linear-gradient(145deg,#fffdfd,#fff7f8);font-family:"Plus Jakarta Sans",system-ui,sans-serif;color:#3A2630;transition:opacity .65s ease,visibility .65s ease}
    #wc-gift-gate.wc-opened{opacity:0;visibility:hidden;pointer-events:none}.wc-gate-card{width:min(440px,100%);text-align:center;padding:34px 24px 28px;border:1px solid rgba(168,92,134,.16);border-radius:30px;background:rgba(255,255,255,.9);box-shadow:0 30px 90px rgba(58,38,48,.16),0 8px 24px rgba(168,92,134,.08);position:relative;overflow:hidden}.wc-gate-logo{width:136px;height:auto;margin:0 auto 20px;display:block}.wc-gate-eyebrow{font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:var(--wc-r);font-weight:800;margin-bottom:9px}.wc-gate-title{font-family:"Playfair Display",Georgia,serif;font-size:clamp(30px,8vw,42px);line-height:1.08;margin:0 auto 10px;color:#3A2630;max-width:390px}.wc-gate-to{font-size:13px;color:#786A71;line-height:1.65;margin:0 auto 22px;max-width:340px}
    .wc-gift{width:118px;height:98px;margin:4px auto 24px;position:relative;cursor:pointer;outline:none;display:block;border:0;background:none;filter:drop-shadow(0 16px 20px rgba(58,38,48,.14))}.wc-gift__box{position:absolute;left:8px;right:8px;bottom:0;height:66px;border-radius:10px 10px 16px 16px;background:linear-gradient(145deg,var(--wc-r),var(--wc-r2));box-shadow:inset 0 1px rgba(255,255,255,.55)}.wc-gift__lid{position:absolute;left:2px;right:2px;top:22px;height:25px;border-radius:9px;background:linear-gradient(145deg,var(--wc-r2),var(--wc-r));transform-origin:92% 85%;transition:transform .6s cubic-bezier(.2,.8,.2,1),top .6s}.wc-gift__ribbon{position:absolute;top:22px;bottom:0;left:calc(50% - 9px);width:18px;background:rgba(255,255,255,.58);z-index:2}.wc-gift__bow{position:absolute;top:8px;left:50%;width:38px;height:25px;transform:translateX(-50%);z-index:4}.wc-gift__bow:before,.wc-gift__bow:after{content:"";position:absolute;top:2px;width:25px;height:18px;border:6px solid var(--wc-r);border-radius:80% 25% 80% 25%;background:#fff8;transform:rotate(-22deg)}.wc-gift__bow:after{right:-2px;transform:scaleX(-1) rotate(-22deg)}.wc-gift:focus-visible{outline:3px solid color-mix(in srgb,var(--wc-r) 45%,white);outline-offset:7px;border-radius:18px}.wc-open-btn{border:0;border-radius:999px;padding:14px 22px;background:var(--wc-action);color:#fff;font:800 13px/1 "Plus Jakarta Sans",system-ui,sans-serif;box-shadow:0 12px 28px color-mix(in srgb,var(--wc-r) 24%,transparent);cursor:pointer}.wc-open-btn:focus-visible{outline:3px solid #3A2630;outline-offset:3px}
    #wc-recipient-tools{position:fixed;right:18px;bottom:18px;z-index:9999;display:flex;gap:8px;opacity:0;transform:translateY(10px);pointer-events:none;transition:opacity .4s ease,transform .4s ease}body.wc-recipient-revealed #wc-recipient-tools{opacity:1;transform:none;pointer-events:auto}.wc-tool{border:1px solid rgba(168,92,134,.18);border-radius:999px;background:rgba(255,255,255,.94);color:#3A2630;padding:11px 14px;font:800 11px/1 "Plus Jakarta Sans",system-ui,sans-serif;box-shadow:0 10px 28px rgba(58,38,48,.12);cursor:pointer}.wc-tool--primary{background:var(--wc-action);color:white;border-color:transparent}.wc-tool:focus-visible{outline:3px solid color-mix(in srgb,var(--wc-r) 42%,white);outline-offset:2px}
    .wc-memory-photo{width:min(620px,calc(100% - 32px));margin:28px auto;padding:12px;border-radius:26px;background:linear-gradient(145deg,#fff,#fff7f8);border:1px solid rgba(168,92,134,.12);box-shadow:0 20px 55px rgba(58,38,48,.1);text-align:center}.wc-memory-photo__label{font:700 11px/1.4 "Plus Jakarta Sans",system-ui,sans-serif;letter-spacing:.1em;text-transform:uppercase;color:#786A71;margin:5px 0 10px}.wc-memory-photo img{display:block;width:100%;max-height:68vh;object-fit:cover;border-radius:18px}.wc-finish{width:min(680px,calc(100% - 32px));margin:34px auto 80px;padding:28px 22px;text-align:center;border-radius:28px;background:linear-gradient(145deg,#fff,#fff7f8);border:1px solid rgba(168,92,134,.12);box-shadow:0 20px 60px rgba(58,38,48,.08)}.wc-finish__icon{font-size:28px;color:var(--wc-r);margin-bottom:8px}.wc-finish h2{font:700 clamp(25px,6vw,36px)/1.15 "Playfair Display",Georgia,serif;color:#3A2630;margin:0 0 8px}.wc-finish p{font:500 13px/1.7 "Plus Jakarta Sans",system-ui,sans-serif;color:#786A71;margin:0}
    @media(max-width:560px){#wc-gift-gate{padding:16px}.wc-gate-card{padding:28px 18px 24px;border-radius:26px}.wc-gate-title{font-size:31px}.wc-gift{transform:scale(.92);margin-bottom:18px}#wc-recipient-tools{left:14px;right:14px;bottom:14px;justify-content:center}.wc-tool{flex:1;max-width:170px}.wc-memory-photo,.wc-finish{width:calc(100% - 24px)}}
    .wc-gift:hover{transform:translateY(-3px) scale(1.015);filter:drop-shadow(0 20px 24px rgba(58,38,48,.16))}.wc-gift:active{transform:scale(.985)}
    .wc-gift.wc-gift-opening .wc-gift__lid{transform:rotate(-12deg) translate(8px,-13px)}
    .wc-gift.wc-gift-opening .wc-gift__bow{transform:translateX(-50%) translateY(-6px) scale(.94)}
    .wc-gate-card{animation:wc-recipient-gate-in .7s cubic-bezier(.22,1,.36,1) both}.wc-gate-eyebrow,.wc-gate-title,.wc-gate-to,.wc-gift,.wc-open-btn{animation:wc-recipient-stagger .65s cubic-bezier(.22,1,.36,1) both}.wc-gate-eyebrow{animation-delay:70ms}.wc-gate-title{animation-delay:120ms}.wc-gate-to{animation-delay:170ms}.wc-gift{animation-delay:230ms}.wc-open-btn{animation-delay:290ms}
    @keyframes wc-recipient-gate-in{from{opacity:0;transform:translateY(14px) scale(.985)}to{opacity:1;transform:none}}@keyframes wc-recipient-stagger{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
    @media(prefers-reduced-motion:reduce){#wc-gift-gate,#wc-recipient-tools,.wc-open-btn,.wc-gate-card,.wc-gate-eyebrow,.wc-gate-title,.wc-gate-to,.wc-gift{transition:none!important;animation:none!important}.wc-gift:hover,.wc-gift:active{transform:none}}
  </style>`;
  const script = `<script id="wc-recipient-experience-script">
    (()=>{const gate=document.getElementById('wc-gift-gate'),gift=document.getElementById('wc-gift-button'),open=document.getElementById('wc-open-wish'),share=document.getElementById('wc-share-wish'),qr=document.getElementById('wc-qr-wish'),reduced=!!(window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches);let previousFocus=null;const focusables=()=>[...gate.querySelectorAll('button:not([disabled]),a[href],input:not([disabled]),[tabindex]:not([tabindex="-1"])')].filter(x=>x.offsetParent!==null);const trap=e=>{if(e.key!=='Tab'||gate.getAttribute('aria-hidden')==='true')return;const items=focusables();if(!items.length)return;const first=items[0],last=items[items.length-1];if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus()}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus()}};const reveal=()=>{if(!gate)return;gate.setAttribute('aria-hidden','true');document.querySelectorAll('body > *:not(#wc-gift-gate)').forEach(el=>el.inert=false);gift?.classList.add('wc-gift-opening');gate.classList.add('wc-opened');document.body.classList.add('wc-recipient-revealed');document.body.classList.add('wc-motion-active');setTimeout(()=>{gate.remove();(share||document.getElementById('wc-recipient-main'))?.focus?.()},reduced?0:700)};if(gate){gate.setAttribute('aria-hidden','false');document.querySelectorAll('body > *:not(#wc-gift-gate)').forEach(el=>{try{el.inert=true}catch{}});setTimeout(()=>focusables()[0]?.focus(),0);gate.addEventListener('keydown',trap)}gift?.addEventListener('click',reveal);open?.addEventListener('click',reveal);gift?.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();reveal()}});share?.addEventListener('click',async()=>{try{if(navigator.share){await navigator.share({title:'A Wish for You — Wish Craft',text:'Someone made a special wish for you on Wish Craft.',url:location.href});return}throw new Error('share-unavailable')}catch(e){if(e?.name==='AbortError')return;try{await navigator.clipboard.writeText(location.href);share.textContent='Link copied ✓';window.wcA11yAnnounce?.('Wish link copied to clipboard');setTimeout(()=>share.textContent='Share this wish',1800)}catch{share.textContent='Copy this page link';window.wcA11yAnnounce?.('Share was unavailable. Copy the page link instead.');setTimeout(()=>share.textContent='Share this wish',2200)}}});qr?.addEventListener('click',()=>location.href='/qr.html?u='+encodeURIComponent(location.href)+'&name='+encodeURIComponent(${JSON.stringify(meta.name||'Someone Special')}));document.body.classList.add('wc-recipient-ready')})();
  <\/script>`;
  const gate = `<div id="wc-gift-gate" role="dialog" aria-modal="true" aria-hidden="false" aria-labelledby="wc-gate-title" aria-describedby="wc-gate-description" tabindex="-1"><div class="wc-gate-card"><img class="wc-gate-logo" src="/assets/brand/wishcraft-logo.svg" alt="Wish Craft"><div class="wc-gate-eyebrow">${escapeHtmlAttr(mood.eyebrow)}</div><h1 class="wc-gate-title" id="wc-gate-title">${escapeHtmlAttr(mood.title)}</h1><p class="wc-gate-to" id="wc-gate-description">Made especially for <strong>${name}</strong> — from someone who wanted to make this moment a little more special.</p><button class="wc-gift" id="wc-gift-button" type="button" aria-label="Open your Wish Craft gift"><span class="wc-gift__box" aria-hidden="true"></span><span class="wc-gift__lid" aria-hidden="true"></span><span class="wc-gift__ribbon" aria-hidden="true"></span><span class="wc-gift__bow" aria-hidden="true"></span></button><button class="wc-open-btn" id="wc-open-wish" type="button">Open your wish ${mood.icon}</button></div></div>`;
  const tools = `<nav id="wc-recipient-tools" aria-label="Wish actions"><button class="wc-tool wc-tool--primary" id="wc-share-wish" type="button">Share this wish</button><button class="wc-tool" id="wc-qr-wish" type="button">QR code</button></nav>`;
  const finish = `<section class="wc-finish" aria-label="Wish Craft closing message"><div class="wc-finish__icon" aria-hidden="true">${mood.icon}</div><h2>A little moment worth keeping.</h2><p>This wish was made with care, just for ${name}. If it made you smile, you can share the experience with someone else too.</p></section>`;
  out = out.replace(/<head(\b[^>]*)>/i, `$&${style}`);
  out = out.replace(/<\/body>/i, `${photoBlock}${finish}${tools}${gate}${script}</body>`);
  out = out.replace(/<body(\b[^>]*)>/i, `<body class="wc-recipient-page"$1>`);
  return out;
}

function normalizeSavedWishPhoto(html, photoProxyUrl) {
  let out = String(html || "");
  if (!photoProxyUrl) return out;
  // The creator preview may contain a browser-only blob/file/content URL.
  // Replace only the dedicated recipient-photo image, never arbitrary images.
  out = out.replace(/<img\b([^>]*\balt=["']Recipient photo["'][^>]*)>/gi, (tag) => {
    if (/\bsrc=["'][^"']*["']/i.test(tag)) return tag.replace(/\bsrc=(["'])[^"']*\1/i, 'src="' + photoProxyUrl + '"');
    return tag.replace(/>$/, ' src="' + photoProxyUrl + '">');
  });
  out = out.replace(/\{\{PHOTO_URL\}\}|\{PHOTO_URL\}/g, photoProxyUrl);
  return out;
}

function makeShortId() { return crypto.randomBytes(7).toString("base64url"); }
function expiryFrom(value) {
  const now = Date.now();
  if (value === "24h") return new Date(now + 24 * 3600e3).toISOString();
  if (value === "3d") return new Date(now + 3 * 86400e3).toISOString();
  if (value === "7d") return new Date(now + 7 * 86400e3).toISOString();
  if (value === "30d") return new Date(now + 30 * 86400e3).toISOString();
  if (value === "permanent") return null;
  return new Date(now + 3 * 86400e3).toISOString();
}
function requireDb(res) {
  if (!supabase) { res.status(503).json({ error: "Wish storage is not configured. Add Supabase environment variables." }); return false; }
  return true;
}

function safePhotoPath(value) {
  const p = String(value || "").trim();
  // Only paths created by this app are accepted. Never allow arbitrary Storage paths.
  return /^wishes\/[A-Za-z0-9_-]{20,80}\.(webp|jpg|jpeg|png)$/i.test(p) ? p : "";
}

async function removePhotoObject(photoPath) {
  if (!supabase || !photoPath) return false;
  const safePath = safePhotoPath(photoPath);
  if (!safePath) return false;
  const { error } = await supabase.storage.from(PHOTO_BUCKET).remove([safePath]);
  if (error) {
    console.error("Supabase photo delete error:", error.message);
    return false;
  }
  return true;
}

async function cleanupExpiredWishes() {
  if (!supabase) return { expired: 0, deleted: 0, failed: 0 };
  const result = { expired: 0, deleted: 0, failed: 0 };
  try {
    const nowIso = new Date().toISOString();
    const { data: expired, error: selectError } = await supabase
      .from("wishes")
      .select("id,short_id,photo_path")
      .not("expires_at", "is", null)
      .lte("expires_at", nowIso)
      .order("expires_at", { ascending: true })
      .limit(200);
    if (selectError) throw selectError;
    result.expired = expired?.length || 0;
    for (const wish of expired || []) {
      const photoPath = safePhotoPath(wish.photo_path);
      if (photoPath) {
        const { error: storageError } = await supabase.storage.from(PHOTO_BUCKET).remove([photoPath]);
        if (storageError) {
          result.failed++;
          console.error("Expired photo cleanup error:", storageError.message, photoPath);
          continue; // Keep DB row so the same photo can be retried safely.
        }
      }
      const { error: deleteError } = await supabase.from("wishes").delete().eq("id", wish.id);
      if (deleteError) {
        result.failed++;
        console.error("Expired wish cleanup error:", deleteError.message, wish.short_id);
      } else {
        result.deleted++;
      }
    }
    if (result.failed) telegram(`⚠️ Wish Craft cleanup warning\nExpired found: ${result.expired}\nDeleted: ${result.deleted}\nFailed/retry: ${result.failed}`);
    return result;
  } catch (e) {
    console.error("Expired wish cleanup failed:", e.message);
    telegram(`🚨 Wish Craft cleanup failed\n${e.message}`);
    return { ...result, failed: result.failed + 1 };
  }
}

async function cleanupOrphanPhotos() {
  if (!supabase) return { scanned: 0, removed: 0, failed: 0 };
  const result = { scanned: 0, removed: 0, failed: 0 };
  try {
    const referenced = new Set();
    let from = 0;
    while (true) {
      const { data, error } = await supabase.from("wishes").select("photo_path").not("photo_path", "is", null).range(from, from + 999);
      if (error) throw error;
      for (const row of data || []) { const p = safePhotoPath(row.photo_path); if (p) referenced.add(p); }
      if (!data || data.length < 1000) break;
      from += 1000;
    }
    const now = Date.now();
    const { data: files, error } = await supabase.storage.from(PHOTO_BUCKET).list("wishes", { limit: 1000, offset: 0, sortBy: { column: "created_at", order: "asc" } });
    if (error) throw error;
    for (const file of files || []) {
      if (!file?.name) continue;
      const p = `wishes/${file.name}`;
      if (!safePhotoPath(p) || referenced.has(p)) continue;
      result.scanned++;
      const created = Date.parse(file.created_at || file.updated_at || "");
      if (created && now - created < TEMP_ORPHAN_MAX_AGE_MS) continue;
      const { error: delError } = await supabase.storage.from(PHOTO_BUCKET).remove([p]);
      if (delError) { result.failed++; console.error("Orphan photo delete error:", delError.message, p); }
      else result.removed++;
    }
    if (result.removed || result.failed) telegram(`🧹 Photo cleanup\nUnreferenced scanned: ${result.scanned}\nRemoved: ${result.removed}\nFailed: ${result.failed}`);
  } catch (e) {
    console.error("Orphan photo cleanup failed:", e.message);
    telegram(`🚨 Orphan photo cleanup failed\n${e.message}`);
    result.failed++;
  }
  return result;
}

const { notify: telegram, poll: telegramPoll } = require("./telegram-bot");

function escapeHtml(s) {
  return String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

function builtInWish({ name, relation, style, extra }) {
  const n = escapeHtml(name);
  const r = escapeHtml(relation);
  const v = escapeHtml(style);
  const e = escapeHtml(extra || "");
  const detail = e ? `<p>${e}</p>` : `<p>Today is a little reminder that your presence makes ordinary moments feel special.</p>`;
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>A Birthday Wish for ${n}</title><style>body{margin:0;font-family:"Plus Jakarta Sans",system-ui,sans-serif;background:radial-gradient(circle at 10% 5%,rgba(231,111,142,.12),transparent 32%),radial-gradient(circle at 90% 10%,rgba(168,92,134,.10),transparent 30%),#FFFCFC;color:#2D2026}main{max-width:760px;margin:auto;padding:48px 22px}section{background:#FFFFFF;border:1px solid #F1E2E7;border-radius:28px;padding:38px 26px;margin:18px 0;box-shadow:0 18px 50px rgba(58,38,48,.08)}h1{font-family:"Playfair Display",Georgia,serif;font-size:clamp(42px,10vw,76px);line-height:1.05;margin:0 0 14px;color:#3A2630}h2{font-family:"Playfair Display",Georgia,serif;font-size:28px;color:#3A2630}p{font-family:"Plus Jakarta Sans",system-ui,sans-serif;font-size:18px;line-height:1.8}.tag{font-family:"Plus Jakarta Sans",system-ui,sans-serif;letter-spacing:.08em;text-transform:uppercase;color:#A85C86}.heart{font-size:44px}a{color:#A85C86}footer{text-align:center;font:14px "Plus Jakarta Sans",system-ui,sans-serif;color:#786A71}</style></head><body><main><section><div class="tag">A little birthday surprise · ${v}</div><h1>Happy Birthday, ${n}! ✨</h1><p>For my wonderful ${r}, may this new year of your life be filled with peaceful moments, genuine smiles, beautiful surprises, and everything your heart has been quietly hoping for.</p></section><section><div class="heart">💖</div><h2>A note just for you</h2>${detail}<p>You deserve to be celebrated not only today, but in all the little moments that make life meaningful.</p></section><section><h2>One more thing…</h2><p>Keep being exactly who you are. Your kindness, your laughter, and the light you bring to people around you are worth more than you probably realize.</p><p>May your next chapter be your happiest one yet. 🌸</p></section><section><h2>With lots of love ❤️</h2><p>Happy Birthday once again, ${n}. Here's to wonderful memories, new adventures, and countless reasons to smile.</p><p><a href="/">Create your own wish →</a></p></section><footer>Made with ♥ on Wish Craft</footer></main></body></html>`;
}

function builtInQuickWish({ name, relation, detail }) {
  const d = detail ? ` ${detail}` : "";
  return `Happy Birthday, ${name}! 🎂✨ As your ${relation}, you deserve a day filled with happiness, laughter, beautiful memories and people who truly care about you.${d ? ` ${d}` : ""} May this new year bring you closer to your dreams and give you countless reasons to smile. Have an amazing birthday and a wonderful year ahead! 💖`;
}

async function gemini(prompt) {
  if (!process.env.GEMINI_API_KEY) throw new Error("NO_KEY");
  const u = "https://generativelanguage.googleapis.com/v1beta/models/" + encodeURIComponent(MODEL) + ":generateContent?key=" + encodeURIComponent(process.env.GEMINI_API_KEY);
  const r = await fetch(u, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { temperature: .9, maxOutputTokens: 12000 } }) });
  const d = await r.json();
  if (!r.ok) throw new Error("GEMINI_FAILED");
  return (d?.candidates?.[0]?.content?.parts || []).map(x => x.text || "").join("").replace(/^```html\s*/i, "").replace(/^```\s*/i, "").replace(/\s*```$/i, "").trim();
}

app.post("/api/generate-wish", async (req, res) => {
  if (!allowed(req.ip, 10)) return res.status(429).json({ error: "Too many generations. Please try again later." });
  const name = clean(req.body?.name, 80) || "Someone Special";
  const relation = clean(req.body?.relation, 50) || "Special Person";
  const style = clean(req.body?.style, 60) || "Romantic & dreamy";
  const extra = clean(req.body?.extra, 1400);
  const prompt = `Create a premium, emotionally beautiful, standalone HTML surprise experience for "${name}". The recipient is the user's ${relation}. Vibe: ${style}. Personal details: ${extra || "No extra details; keep writing warm and believable"}.
Make it feel like a handcrafted romantic microsite, not a generic greeting card. Use elegant serif display headings, handwritten script accents, soft layered pastel gradients, glass/white cards, generous whitespace, subtle shadows, floating hearts/particles, gentle entrance animations and a beautiful mobile layout.
Required sections: cinematic hero with the name; heartfelt opening; a few tiny personalized notes; one more thing; emotional final closing; small footer "Made with ♥ on Wish Craft". Keep every visible message SHORT: mostly one sentence or 6-18 words, never long paragraphs. The creator will use the generated copy as micro-copy inside a six-page visual experience. Add a tasteful "Create your own wish →" link to "/" near the end.
Do not invent highly specific facts not supplied. Use tasteful emojis. Prioritize visual storytelling over text; the recipient should be able to understand the feeling at a glance. Technical: one self-contained HTML file, inline CSS+JS only, no external JS libraries, no network requests, responsive, accessible, no forms, no iframes. Return ONLY the complete HTML document.`;
  try {
    const html = USE_GEMINI ? await gemini(prompt) : builtInWish({ name, relation, style, extra });
    if (!/^<!doctype html|^<html/i.test(html) || html.length > 650000) throw new Error("INVALID_HTML");
    res.json({ html, source: USE_GEMINI ? "gemini" : "built-in" });
  } catch { res.status(503).json({ error: "Wish generation unavailable" }); }
});

app.post("/api/generate-quick-wish", async (req, res) => {
  if (!allowed(req.ip, 18)) return res.status(429).json({ error: "Too many requests" });
  const name = clean(req.body?.name, 80) || "Someone Special";
  const relation = clean(req.body?.relation, 50) || "Special Person";
  const detail = clean(req.body?.detail, 500);
  const prompt = `Write one beautiful birthday message for ${name}, the user's ${relation}. ${detail ? `Personal detail: ${detail}.` : ""} 70-110 words, warm, natural, shareable, not cheesy, with 2-4 tasteful emojis. Return only the message.`;
  try { res.json({ text: USE_GEMINI ? await gemini(prompt) : builtInQuickWish({ name, relation, detail }), source: USE_GEMINI ? "gemini" : "built-in" }); }
  catch { res.status(503).json({ error: "Wish generation unavailable" }); }
});

app.post("/api/upload-photo", (req, res, next) => {
  if (!allowed(req.ip, 12)) return res.status(429).json({ error: "Too many photo uploads. Please try again later." });
  // Accept "photo" or "file" field names (frontend may send either / both).
  // .single("photo") alone throws LIMIT_UNEXPECTED_FILE when a second file field exists.
  upload.fields([
    { name: "photo", maxCount: 1 },
    { name: "file", maxCount: 1 }
  ])(req, res, err => {
    if (err) {
      console.error("Multer upload error:", err.code || "", err.message);
      if (err.code === "LIMIT_FILE_SIZE") {
        return res.status(413).json({ error: "Photo is too large. Please choose a smaller image." });
      }
      if (err.code === "LIMIT_UNEXPECTED_FILE") {
        return res.status(400).json({ error: "Unexpected upload field. Please try again." });
      }
      return res.status(400).json({ error: err.message || "Invalid upload request." });
    }
    next();
  });
}, async (req, res) => {
  if (!requireDb(res)) return;
  const file =
    (req.files && req.files.photo && req.files.photo[0]) ||
    (req.files && req.files.file && req.files.file[0]) ||
    req.file ||
    null;
  if (!file) return res.status(400).json({ error: "Please choose an image." });
  const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
  let mime = String(file.mimetype || "").toLowerCase();
  // Some mobile browsers send empty / octet-stream; guess from filename.
  if (!allowedTypes.has(mime)) {
    const name = String(file.originalname || "").toLowerCase();
    if (name.endsWith(".png")) mime = "image/png";
    else if (name.endsWith(".jpg") || name.endsWith(".jpeg")) mime = "image/jpeg";
    else if (name.endsWith(".webp")) mime = "image/webp";
  }
  if (!allowedTypes.has(mime)) {
    return res.status(415).json({ error: "Only JPG, PNG or WebP images are supported." });
  }
  if (file.size > PHOTO_MAX_BYTES) {
    return res.status(413).json({ error: "Photo is too large. Please choose a smaller image." });
  }

  const ext = mime === "image/png" ? "png" : mime === "image/jpeg" ? "jpg" : "webp";
  const objectPath = `wishes/${crypto.randomBytes(18).toString("base64url")}.${ext}`;
  try {
    const { error } = await supabase.storage.from(PHOTO_BUCKET).upload(objectPath, file.buffer, {
      contentType: mime,
      cacheControl: "31536000",
      upsert: false
    });
    if (error) throw error;
    // Keep the stored bucket private if desired. Shared wishes use our proxy path,
    // which creates a short-lived signed URL on demand.
    const proxyPath = `/api/wish-photo?path=${encodeURIComponent(objectPath)}`;
    res.json({ url: proxyPath, path: objectPath, photoUrl: proxyPath, photoPath: objectPath, proxyPath });
  } catch (e) {
    console.error("Supabase photo upload error:", e.message);
    res.status(503).json({ error: "Could not upload photo. Please try again." });
  }
});

/* Proxy wish photos so shared links work even if the Supabase bucket is private.
   Frontend stores /api/wish-photo?path=wishes/... in the saved HTML. */
app.get("/api/wish-photo", async (req, res) => {
  if (!allowed(req.ip, 240, 60 * 60 * 1000)) return res.status(429).json({ error: "Too many photo requests. Please try again later." });
  if (!requireDb(res)) return;
  const photoPath = safePhotoPath(req.query?.path);
  if (!photoPath) return res.status(400).json({ error: "Invalid photo path." });
  try {
    // Generate a short-lived signed URL so the browser can fetch a private-bucket
    // object without exposing the Supabase service key or requiring a public bucket.
    const { data, error } = await supabase.storage.from(PHOTO_BUCKET).createSignedUrl(photoPath, 60 * 60);
    if (error || !data?.signedUrl) {
      console.error("Wish photo signed URL error:", error?.message || "no signed URL");
      return res.status(404).json({ error: "Photo not found." });
    }
    res.setHeader("Cache-Control", "private, max-age=300");
    res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
    return res.redirect(302, data.signedUrl);
  } catch (e) {
    console.error("Wish photo proxy error:", e.message);
    res.status(503).json({ error: "Could not load photo." });
  }
});

app.post("/api/save-wish", async (req, res) => {
  await cleanupExpiredWishes();
  if (!allowed(req.ip, 25)) return res.status(429).json({ error: "Too many saves" });
  if (!requireDb(res)) return;
  let html = String(req.body?.html || "");
  if (!html || html.length > 650000 || !/^<!doctype html|^<html/i.test(html)) return res.status(400).json({ error: "Invalid HTML" });
  const photoPath = safePhotoPath(req.body?.photoPath);
  if (photoPath) {
    const proxy = `/api/wish-photo?path=${encodeURIComponent(photoPath)}`;
    html = normalizeSavedWishPhoto(html, proxy);
  }
  const shortId = makeShortId();
  const row = {
    short_id: shortId,
    name: clean(req.body?.name, 80) || "Someone Special",
    relation: clean(req.body?.relation, 50) || "Special Person",
    style: clean(req.body?.style, 60),
    qr_theme: ["birthday", "love", "friend", "cute", "royal"].includes(req.body?.qrTheme) ? req.body.qrTheme : "birthday",
    html,
    expires_at: expiryFrom(DEFAULT_EXPIRY),
    photo_url: String(req.body?.photoUrl || "").trim().slice(0, 2000),
    photo_path: photoPath,
    delete_photo_on_expire: req.body?.deletePhotoOnExpire !== false
  };
  const { data, error } = await supabase.from("wishes").insert(row).select("id,short_id,created_at,expires_at,qr_theme,name,relation").single();
  if (error) {
    console.error("Supabase save error:", error.message);
    if (row.photo_path) await removePhotoObject(row.photo_path);
    return res.status(503).json({ error: "Could not save wish" });
  }
  const base = (SITE_URL || `${req.protocol}://${req.get("host")}`).replace(/\/$/, "");
  const url = `${base}/w/${data.short_id}`;
  const shareUrl = url;
  telegram(`🎁 Wish Craft — New wish saved\n\nName: ${row.name}\nRelation: ${row.relation}\nStyle: ${row.style || "Default"}\nExpiry: ${data.expires_at || "Permanent"}\nDirect link: ${url}`);
  res.json({ id: data.short_id, url, shareUrl, expiresAt: data.expires_at });
});

app.get("/api/wishes", async (req, res) => {
  await cleanupExpiredWishes();
  if (!requireDb(res)) return;
  const ids = String(req.query.ids || "").split(",").map(x => x.trim()).filter(Boolean).slice(0, 30);
  if (!ids.length) return res.json({ wishes: [] });
  const { data, error } = await supabase.from("wishes").select("short_id,name,relation,style,qr_theme,created_at,expires_at,view_count,qr_scan_count,photo_url").in("short_id", ids).order("created_at", { ascending: false });
  if (error) return res.status(503).json({ error: "Could not load wishes" });
  res.json({ wishes: (data || []).map(x => ({
    id: x.short_id, short_id: x.short_id, name: x.name, relation: x.relation, style: x.style, qr_theme: x.qr_theme,
    qrTheme: x.qr_theme, created_at: x.created_at, createdAt: x.created_at, expires_at: x.expires_at, expiresAt: x.expires_at,
    view_count: x.view_count, viewCount: x.view_count, qr_scan_count: x.qr_scan_count, qrScanCount: x.qr_scan_count, photoUrl: x.photo_url || ""
  })) });
});

app.get("/api/wish/:id", async (req, res) => {
  await cleanupExpiredWishes();
  if (!requireDb(res)) return;
  const { data, error } = await supabase.from("wishes").select("id,short_id,name,relation,style,qr_theme,created_at,expires_at,view_count,qr_scan_count,photo_url,photo_path,delete_photo_on_expire").eq("short_id", req.params.id).maybeSingle();
  if (error) return res.status(503).json({ error: "Could not load wish" });
  if (!data) return res.status(404).json({ error: "Wish not found" });
  if (data.expires_at && new Date(data.expires_at) <= new Date()) return res.status(410).json({ error: "Wish expired", expiresAt: data.expires_at });
  const photoUrl = data.photo_path
    ? `/api/wish-photo?path=${encodeURIComponent(data.photo_path)}`
    : (data.photo_url || "");
  res.json({ id: data.short_id, name: data.name, relation: data.relation, style: data.style, qrTheme: data.qr_theme, createdAt: data.created_at, expiresAt: data.expires_at, viewCount: data.view_count, photoUrl, photoPath: data.photo_path || "" });
});

async function getWish(shortId) {
  const { data, error } = await supabase.from("wishes").select("id,short_id,name,relation,style,qr_theme,html,created_at,expires_at,view_count,photo_url,photo_path,delete_photo_on_expire").eq("short_id", shortId).maybeSingle();
  if (error) throw error;
  return data;
}

// Legacy compatibility: old /share/:id links now go straight to the recipient wish.
// The intermediate share.html gateway is no longer part of the user journey.
app.get("/share/:id", async (req, res) => {
  await cleanupExpiredWishes();
  if (!requireDb(res)) return;
  try {
    const x = await getWish(req.params.id);
    if (!x) return res.status(404).send("Wish not found");
    if (x.expires_at && new Date(x.expires_at) <= new Date()) return res.status(410).send("This wish has expired. Create a new wish on Wish Craft.");
    res.redirect(301, `/w/${encodeURIComponent(req.params.id)}`);
  } catch { res.status(503).send("Could not load wish"); }
});

app.get("/w/:id", async (req, res) => {
  await cleanupExpiredWishes();
  if (!requireDb(res)) return;
  try {
    const x = await getWish(req.params.id);
    if (!x) return res.status(404).send(recipientStatusPage(404, "This wish could not be found", "The link may be incomplete, old, or no longer available."));
    if (x.expires_at && new Date(x.expires_at) <= new Date()) return res.status(410).send(recipientStatusPage(410, "This wish has expired", "The share link is no longer active, but you can always create a new little moment on Wish Craft."));
    supabase.from("wishes").update({ view_count: (x.view_count || 0) + 1 }).eq("id", x.id).then(() => {}).catch(() => {});
    let wishHtml = normalizeWishHtml(x.html, x.photo_url || "");
    if (x.photo_path) {
      const photoProxyUrl = `/api/wish-photo?path=${encodeURIComponent(x.photo_path)}`;
      // Normalize every form of the photo URL to the live absolute proxy URL so the
      // recipient always sees the image (even if the creator saved from content://,
      // file://, localhost, or an old domain).
      if (x.photo_url) wishHtml = wishHtml.split(x.photo_url).join(photoProxyUrl);
      wishHtml = wishHtml.replace(/https?:\/\/[^"'\s<>]+\/api\/wish-photo\?path=[^"'\s<>&]+(?:&amp;path=[^"'\s<>]+)?/gi, photoProxyUrl);
      wishHtml = wishHtml.replace(/\/api\/wish-photo\?path=[^"'\s<>&]+/gi, photoProxyUrl);
    }
    wishHtml = enhanceRecipientWish(wishHtml, { name: x.name, relation: x.relation, style: x.style }, x.photo_path ? `/api/wish-photo?path=${encodeURIComponent(x.photo_path)}` : (x.photo_url || ""));
    const recipientName = escapeHtmlAttr(x.name || "Someone Special");
    const wishTitle = `A little wish for ${recipientName} — Wish Craft`;
    const wishDescription = "Someone made a special digital wish for you on Wish Craft.";
    const wishMeta = `<meta name="description" content="${wishDescription}"><meta name="robots" content="noindex,nofollow,noarchive"><meta property="og:type" content="website"><meta property="og:site_name" content="Wish Craft"><meta property="og:title" content="${wishTitle}"><meta property="og:description" content="${wishDescription}"><meta property="og:url" content="${String(SITE_URL || `${req.protocol}://${req.get("host")}`).replace(/\/$/, "")}/w/${encodeURIComponent(req.params.id)}"><meta property="og:image" content="${String(SITE_URL || `${req.protocol}://${req.get("host")}`).replace(/\/$/, "")}/og-image.jpg"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630"><meta property="og:image:alt" content="Wish Craft — beautiful digital wishes"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${wishTitle}"><meta name="twitter:description" content="${wishDescription}"><meta name="twitter:image" content="${String(SITE_URL || `${req.protocol}://${req.get("host")}`).replace(/\/$/, "")}/og-image.jpg"><meta name="twitter:image:alt" content="Wish Craft — beautiful digital wishes">`;
    wishHtml = wishHtml.replace(/<title>.*?<\/title>/i, `<title>${wishTitle}</title>${wishMeta}`);
    res.setHeader("Content-Security-Policy", "sandbox allow-scripts allow-forms; default-src 'none'; img-src 'self' https: data: blob:; style-src 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com data:; script-src 'unsafe-inline'; base-uri 'none'; form-action 'none'");
    res.setHeader("X-Robots-Tag", "noindex, nofollow, noarchive");
    res.type("html").send(wishHtml);
  } catch { res.status(503).send("Could not load wish"); }
});

// Vercel me setInterval cron nahi chalta, isliye Vercel Cron Jobs (vercel.json)
// is route ko periodically hit karta hai taaki expired wishes/orphan photos
// clean hote rahein. Ek secret se protected hai taaki koi bhi bahar se spam na kare.
app.all("/api/cron/cleanup", async (req, res) => {
  const bearer = String(req.get("authorization") || "").replace(/^Bearer\s+/i, "");
  const secret = String(req.get("x-cron-secret") || req.query.secret || bearer || "");
  const expected = String(process.env.CRON_SECRET || ADMIN_KEY || "");
  if (!expected || secret !== expected) return res.status(401).json({ error: "Unauthorized" });
  try {
    await cleanupExpiredWishes();
    await cleanupOrphanPhotos();
    await flushMetrics();
    await sendDailyReportIfDue();
    res.json({ ok: true, ranAt: new Date().toISOString() });
  } catch (e) {
    res.status(500).json({ error: "Cleanup failed", detail: e.message });
  }
});

app.get("/api/health", async (req, res) => {
  if (!supabase) return res.status(503).json({ ok: false, database: false });
  const { error } = await supabase.from("wishes").select("id", { head: true, count: "exact" }).limit(1);
  res.status(error ? 503 : 200).json({ ok: !error, database: !error });
});

app.get("/robots.txt", (req, res) => {
  const base = (SITE_URL || `${req.protocol}://${req.get("host")}`).replace(/\/$/, "");
  res.type("text").send(`User-agent: *\nAllow: /\nDisallow: /api/\nDisallow: /admin\nDisallow: /w/\nDisallow: /my-wishes.html\nDisallow: /qr.html\nSitemap: ${base}/sitemap.xml\n`);
});
app.get("/sitemap.xml", (req,res) => {
  const base = (SITE_URL || `${req.protocol}://${req.get("host")}`).replace(/\/$/, "");
  const urls=["/","/birthday.html","/anniversary.html","/purpose.html","/birthday-card.html","/thank-you-card.html","/about.html","/contact.html","/privacy.html","/terms.html"];
  res.type("application/xml").send(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.map(u=>`<url><loc>${base}${u}</loc></url>`).join("")}</urlset>`);
});

app.use((err, req, res, next) => {
  if (err?.code === "LIMIT_FILE_SIZE") {
    return res.status(413).json({ error: "Photo is too large. Please choose a smaller image." });
  }
  if (err?.code === "LIMIT_UNEXPECTED_FILE") {
    return res.status(400).json({ error: "Unexpected upload field. Please try again." });
  }
  if (err) {
    console.error("Request error:", err.code || "", err.message);
    if (req.path.startsWith("/api/")) {
      return res.status(400).json({ error: err.message || "Invalid request." });
    }
  }
  return next(err);
});


/* ============================================================
   ADMIN CONTROL PLANE — additive, isolated from locked wish APIs
   The admin UI can manage operational settings and monitoring.
   It intentionally has NO file-delete/edit endpoint, so protected
   application files cannot be deleted from the panel.
   ============================================================ */
function adminAuthorized(req) {
  if (!ADMIN_KEY) return false;
  const supplied = String(req.get("x-admin-key") || "");
  const a = Buffer.from(supplied);
  const b = Buffer.from(ADMIN_KEY);
  const headerOk = a.length === b.length && a.length > 0 && crypto.timingSafeEqual(a, b);
  return headerOk || validAdminSession(req);
}
function requireAdmin(req,res){
  if(!ADMIN_KEY) return res.status(503).json({error:"Admin panel is not configured. Set ADMIN_PANEL_KEY."});
  if(!adminAuthorized(req)) return res.status(401).json({error:"Invalid admin key"});
  return true;
}
const ADMIN_DEFAULTS={site_notice:"",maintenance_mode:false,alerts_enabled:true,template_management:true,site_ui_overrides:{},experience_ui_overrides:{},qr_settings:{defaultTemplate:'aurora',defaultColor:'#241d31',shareCardRatio:'1:1'},template_overrides:{}};
const PUBLIC_UI_DEFAULTS={
  qr:{defaultTemplate:"aurora",defaultColor:"#241d31",shareCardRatio:"1:1"},
  site:{themeName:"default",theme:{purple:"#A85C86",pink:"#E76F8E",ink:"#2D2026",muted:"#786A71",line:"#F1E2E7",background:"#FFFCFC",surface:"#FFFFFF",surface2:"#FFF7F8",radius:"24px",shadow:"0 24px 70px rgba(58,38,48,.10)",font:"Plus Jakarta Sans",headingFont:"Playfair Display",scriptFont:"Dancing Script",mode:"light",texture:"sky"},font:{body:"Plus Jakarta Sans",heading:"Playfair Display",script:"Dancing Script"},home:{layout:"layout-1"},back:{enabled:true,position:"footer",style:"glass",text:"← Back",ariaLabel:"Go back",fallback:"/",pages:["purpose","surprise","birthday-card","birthday-wish","my-wishes","privacy","qr","share","thank-you-card"]}},
  experience:{back:{enabled:true,position:"footer",style:"glass",text:"← Back",ariaLabel:"Go to previous page",showOnFirstPage:false},games:{enabled:true,sound:true},media:{pages:[{type:"image",url:""},{type:"image",url:""},{type:"sticker",url:""},{type:"video",url:""},{type:"image",url:""},{type:"sticker",url:""}]}} ,
  templates:{}
};
async function getPublicUIConfig(){
  const out=JSON.parse(JSON.stringify(PUBLIC_UI_DEFAULTS));
  if(!supabase)return out;
  try{
    const {data,error}=await supabase.from("admin_settings").select("key,value").in("key",["site_ui_overrides","experience_ui_overrides","qr_settings","template_overrides"]);
    if(error)throw error;
    for(const x of data||[]){let v={};try{v=JSON.parse(x.value||"{}")}catch{v={}};if(x.key==="site_ui_overrides")out.site={...out.site,...v,theme:{...out.site.theme,...(v.theme||{})},back:{...out.site.back,...(v.back||{})}};if(x.key==="experience_ui_overrides")out.experience={...out.experience,...v,back:{...out.experience.back,...(v.back||{})},media:{...out.experience.media,...(v.media||{})}};if(x.key==="qr_settings")out.qr={...out.qr,...v};if(x.key==="template_overrides")out.templates=v||{};
    }
  }catch(_){ }
  return out;
}
async function getAdminSettings(){
  if(!supabase) return {...ADMIN_DEFAULTS};
  try{
    const {data,error}=await supabase.from("admin_settings").select("key,value");
    if(error) throw error;
    const out={...ADMIN_DEFAULTS}; for(const x of data||[]){try{out[x.key]=JSON.parse(x.value)}catch{out[x.key]=x.value}}
    return out;
  }catch{return {...ADMIN_DEFAULTS};}
}
app.get("/api/ui-config",async(req,res)=>{res.setHeader("Cache-Control","no-store");res.json(await getPublicUIConfig())});

app.get("/api/admin/overview", async (req,res)=>{
  if(!requireAdmin(req,res)) return;
  if(!supabase) return res.json({ok:true,database:false,settings:await getAdminSettings(),wishes:[]});
  try{
    await cleanupExpiredWishes();
    const {count,error}=await supabase.from("wishes").select("id",{head:true,count:"exact"}); if(error) throw error;
    const {data:recent,error:e2}=await supabase.from("wishes").select("short_id,name,relation,style,created_at,expires_at,view_count,qr_scan_count").order("created_at",{ascending:false}).limit(25); if(e2) throw e2;
    const active=(recent||[]).filter(x=>!x.expires_at||new Date(x.expires_at)>new Date()).length;
    res.json({ok:true,database:true,totalWishes:count||0,activeRecent:active,settings:await getAdminSettings(),wishes:recent||[],serverTime:new Date().toISOString()});
  }catch(e){res.status(503).json({error:"Could not load admin overview"})}
});
app.get("/api/admin/settings",async(req,res)=>{if(!requireAdmin(req,res))return;res.json(await getAdminSettings())});
app.post("/api/admin/settings",async(req,res)=>{
  if(!requireAdmin(req,res))return;
  if(!supabase)return res.status(503).json({error:"Database is not configured"});
  const allowed=new Set(Object.keys(ADMIN_DEFAULTS)); const entries=Object.entries(req.body||{}).filter(([k])=>allowed.has(k));
  try{for(const [key,value] of entries){const {error}=await supabase.from("admin_settings").upsert({key,value:JSON.stringify(value),updated_at:new Date().toISOString()},{onConflict:"key"});if(error)throw error}res.json({ok:true,settings:await getAdminSettings()})}catch(e){res.status(503).json({error:"Could not save settings"})}
});
app.get("/api/admin/wish/:id",async(req,res)=>{if(!requireAdmin(req,res))return;if(!supabase)return res.status(503).json({error:"Database is not configured"});try{const x=await getWish(req.params.id);if(!x)return res.status(404).json({error:"Wish not found"});res.json({id:x.short_id,name:x.name,relation:x.relation,style:x.style,createdAt:x.created_at,expiresAt:x.expires_at,views:x.view_count,qrScans:x.qr_scan_count,photoPath:x.photo_path||""})}catch(e){res.status(503).json({error:"Could not load wish"})}});
app.delete("/api/admin/wish/:id",async(req,res)=>{if(!requireAdmin(req,res))return;if(!supabase)return res.status(503).json({error:"Database is not configured"});try{const x=await getWish(req.params.id);if(!x)return res.status(404).json({error:"Wish not found"});if(x.photo_path){const removed=await removePhotoObject(x.photo_path);if(!removed)return res.status(503).json({error:"Photo could not be deleted; wish was kept safe."})}const {error}=await supabase.from("wishes").delete().eq("id",x.id);if(error)throw error;telegram(`🗑️ Admin deleted wish ${x.short_id} (${x.name||"Someone Special"})`);res.json({ok:true,id:x.short_id})}catch(e){res.status(503).json({error:"Could not delete wish"})}});

app.get("/api/admin/metrics", async (req,res)=>{
  if(!requireAdmin(req,res)) return;
  const date=String(req.query?.date||metricLocalParts().date).slice(0,10);
  try{let data=null;if(supabase){const {data:row,error}=await supabase.from('admin_daily_metrics').select('payload').eq('metric_date',date).maybeSingle();if(error)throw error;if(row?.payload)try{data=JSON.parse(row.payload)}catch{}}if(!data && date===metricState.date)data={...metricState};res.json({ok:true,date,data});}catch(e){res.status(503).json({error:'Could not load metrics'})}
});
app.get("/api/admin/storage", async (req,res)=>{
  if(!requireAdmin(req,res) || !supabase) return;
  try {
    const { data, error } = await supabase.storage.from(PHOTO_BUCKET).list("wishes", { limit: 1000, offset: 0, sortBy: { column: "created_at", order: "desc" } });
    if(error) throw error;
    const files=(data||[]).filter(x=>safePhotoPath(`wishes/${x.name}`)).map(x=>({name:x.name,path:`wishes/${x.name}`,size:x.metadata?.size||0,createdAt:x.created_at||x.updated_at||null}));
    const bytes=files.reduce((n,x)=>n+Number(x.size||0),0);
    res.json({ok:true,bucket:PHOTO_BUCKET,count:files.length,bytes,files});
  } catch(e){res.status(503).json({error:"Could not list storage"})}
});
app.delete("/api/admin/storage", async (req,res)=>{
  if(!requireAdmin(req,res) || !supabase) return;
  const p=safePhotoPath(req.body?.path);
  if(!p)return res.status(400).json({error:"Only Wish Craft photo objects can be deleted."});
  try{const {data:refs,error:refError}=await supabase.from("wishes").select("short_id").eq("photo_path",p).limit(1);if(refError)throw refError;if(refs?.length)return res.status(409).json({error:"This photo is linked to a live wish. Delete the wish instead so its database row and photo stay consistent."});const {error}=await supabase.storage.from(PHOTO_BUCKET).remove([p]);if(error)throw error;res.json({ok:true,path:p})}catch(e){res.status(503).json({error:"Could not delete storage object"})}
});
app.get("/api/admin/db/export", async (req,res)=>{
  if(!requireAdmin(req,res) || !supabase) return;
  try{const {data,error}=await supabase.from("wishes").select("id,short_id,name,relation,style,qr_theme,created_at,expires_at,view_count,qr_scan_count,photo_path,delete_photo_on_expire").order("created_at",{ascending:false}).limit(5000);if(error)throw error;res.json({ok:true,wishes:data||[],exportedAt:new Date().toISOString()})}catch(e){res.status(503).json({error:"Could not export database records"})}
});
app.get("/anniversary.html",(req,res)=>res.sendFile(path.join(ROOT,"public","anniversary.html")));
app.get("/admin",(req,res)=>res.sendFile(path.join(ROOT,"public","admin","index.html")));

// Branded HTML fallback for unknown browser routes. API/static requests keep their normal behavior.
app.use((req, res, next) => {
  const acceptsHtml = String(req.get("accept") || "").includes("text/html");
  if (req.method !== "GET" || !acceptsHtml || req.path.startsWith("/api/")) return next();
  res.status(404).type("html").send(recipientStatusPage(404, "This page could not be found", "The link may be incomplete, old, or no longer available. You can head back to Wish Craft and create a new little moment."));
});

/**
 * ============================================================
 * DEPLOYMENT MODE
 * ============================================================
 * Vercel = serverless: har request apne alag, short-lived function
 * instance me chalta hai. app.listen(), setInterval() cron loops,
 * aur Telegram long-polling yahan kaam NAHI karte (process baar baar
 * restart/freeze hota hai), isliye ye sab sirf traditional server
 * (Render, Railway, VPS, ya local `npm start`) par hi chalte hain.
 *
 * process.env.VERCEL Vercel khud set karta hai runtime pe, isliye
 * usi se detect kar rahe hain — kahin manually set karne ki zaroorat nahi.
 * ============================================================
 */
const IS_VERCEL = !!process.env.VERCEL;

if (!IS_VERCEL) {
  app.listen(PORT, () => {
    console.log(`Wish Craft V19.0 running on port ${PORT}`);
    cleanupExpiredWishes().catch(() => {});
    cleanupOrphanPhotos().catch(() => {});
    setInterval(() => cleanupExpiredWishes(), 10 * 60 * 1000).unref();
    setInterval(() => cleanupOrphanPhotos(), 60 * 60 * 1000).unref();
    setInterval(() => flushMetrics(), METRICS_FLUSH_MS).unref();
    setInterval(() => sendDailyReportIfDue().catch(()=>{}), 30 * 1000).unref();
    telegram(`🚀 Wish Craft is online\nMode: ${USE_GEMINI ? "Gemini AI" : "Built-in wishes"}\nPort: ${PORT}`);
    if (
      process.env.TELEGRAM_BOT_TOKEN &&
      String(process.env.TELEGRAM_BOT_IN_SERVER || "true").toLowerCase() === "true"
    ) {
      telegramPoll().catch(e=>console.error("Telegram bot startup:",e.message));
    }
  });
}

// Vercel serverless entry point (see /api/index.js + vercel.json).
module.exports = app;
