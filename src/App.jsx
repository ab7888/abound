import { useState, useEffect, useMemo, useRef, Component } from "react";
import * as XLSX from "xlsx";
import logo from "./logo.png";

class ErrorBoundary extends Component {
  constructor(props){ super(props); this.state={crashed:false,error:null}; }
  static getDerivedStateFromError(error){ return {crashed:true,error}; }
  componentDidCatch(error,info){ console.error("Abound crashed:",error,info); }
  render(){
    if(!this.state.crashed) return this.props.children;
    return(
      <div style={{minHeight:"100vh",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",background:"#09081a",padding:32,textAlign:"center",fontFamily:"'Inter',system-ui,sans-serif"}}>
        <img src={logo} alt="Abound" style={{height:40,marginBottom:24,opacity:0.7,mixBlendMode:"screen"}}/>
        <div style={{fontSize:22,fontWeight:800,color:"#e0e7ff",marginBottom:8}}>Something went wrong</div>
        <div style={{fontSize:14,color:"#6b7280",marginBottom:28,lineHeight:1.6,maxWidth:340}}>
          An unexpected error occurred. Your data hasn't been lost — try refreshing the page.
        </div>
        <button onClick={()=>window.location.reload()}
          style={{padding:"11px 28px",background:"linear-gradient(135deg,#6366f1,#4f46e5)",color:"#fff",border:"none",borderRadius:10,fontSize:14,fontWeight:700,cursor:"pointer",boxShadow:"0 4px 16px rgba(99,102,241,0.4)",marginBottom:12}}>
          Refresh page
        </button>
        <button onClick={()=>this.setState({crashed:false,error:null})}
          style={{padding:"9px 20px",background:"none",color:"#6b7280",border:"1px solid #1f1d35",borderRadius:10,fontSize:13,cursor:"pointer"}}>
          Try to continue
        </button>
        {this.state.error&&(
          <details style={{marginTop:24,maxWidth:480,textAlign:"left"}}>
            <summary style={{fontSize:11,color:"#4b5563",cursor:"pointer"}}>Error details</summary>
            <pre style={{fontSize:10,color:"#6b7280",marginTop:8,overflow:"auto",background:"#0f0e1f",padding:12,borderRadius:8}}>{String(this.state.error)}</pre>
          </details>
        )}
      </div>
    );
  }
}

// ─── Stripe ───────────────────────────────────────────────────────────────────
const STRIPE_PUBLISHABLE_KEY = "pk_test_51TPlSFPcKkSmNBEQqNiWP7J3Udw0PywkFDsHYQIXIbnAQKbKj9bvBvz1aHa0otuA2UJi2E9AXU3npqBuQMD4FuCt00W7xaqHZ6";
const FREE_AI_RUNS = 3;
const AI_RUNS_KEY = "abound_ai_runs_v1";
const PREMIUM_KEY = "abound_premium_v1";

function getAiRunsUsed() { try { return parseInt(localStorage.getItem(AI_RUNS_KEY)||"0",10); } catch{ return 0; } }
function incrementAiRuns() { try { localStorage.setItem(AI_RUNS_KEY, String(getAiRunsUsed()+1)); } catch{} }
function isPremium() { try { return localStorage.getItem(PREMIUM_KEY)==="1"; } catch{ return false; } }
function setPremium() { try { localStorage.setItem(PREMIUM_KEY,"1"); } catch{} }

async function redirectToCheckout() {
  try {
    const res = await fetch("/api/create-checkout-session", { method:"POST", headers:{"Content-Type":"application/json"} });
    const { url } = await res.json();
    if(url) window.location.href = url;
  } catch(e) { alert("Couldn't start checkout — please try again."); }
}

// ─── Constants ────────────────────────────────────────────────────────────────
const DEFAULT_CATEGORIES = ["Food", "Travel", "Rent", "Memberships", "Online Shopping", "Healthcare", "Income", "Transfers", "Investments", "Other Payments"];
const APP_VERSION = "1.0.0";
const INTERCOMPANY_CATEGORY = "Card Repayment";
const PURPLE = "#6366f1";
const CATEGORY_COLORS = ["#10b981","#3b82f6","#f59e0b","#8b5cf6","#059669","#6366f1","#ec4899","#14b8a6","#f97316","#ef4444"];
const ACCOUNT_LABELS = { 0:"Main Account", 1:"Credit Card", 2:"Credit Card 2", 3:"Credit Card 3" };
// ─── Feedback ─────────────────────────────────────────────────────────────────
// Responses are emailed to you via formsubmit.co — replace with your email address
const FEEDBACK_EMAIL = "ali.barrie100@gmail.com";

const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;0,9..40,800&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    html { -webkit-text-size-adjust: 100%; background: #08070f; height: 100%; overscroll-behavior: none; }
  body { -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; background: #08070f; margin: 0; padding: 0; min-height: 100%; overscroll-behavior: none; touch-action: pan-x pan-y; }
  :root {
    --app-bg:#08070f; --nav-bg:#09081a; --nav-border:#1f1d35;
    --nav-tab-active:#a5b4fc; --nav-tab-inactive:#52525b;
    --card:#0d0c1e; --text:#e0e7ff; --text2:#9ca3af; --text3:#4b5563;
    --border:#1f1d35; --border2:#2d2a6e;
    --input-bg:#0f0e1a; --input-color:#e0e7ff;
    --snapshot-bg:#0c0b1d; --snap-border:#1f1d35;
    --row-even:rgba(255,255,255,0.012); --row-odd:rgba(255,255,255,0.005);
    --row-hover:rgba(99,102,241,0.06); --row-border:#13112a;
    --txn-text:#c7d2fe; --acct-chip:rgba(255,255,255,0.04);
    --tbl-hdr:linear-gradient(90deg,#1e1b4b,#1a1738); --tbl-hdr-border:#2d2a6e;
    --sort-bg:#0d0c1e; --tour-bg:#1a1830; --tour-body:#a1a1aa;
    --oneoff-border:rgba(255,255,255,0.15); --oneoff-border-on:rgba(255,255,255,0.5);
    --oneoff-bg-on:rgba(255,255,255,0.12);
    --oneoff-text:rgba(255,255,255,0.4); --oneoff-text-on:#ffffff;
  }
  [data-theme="light"] {
    --app-bg:#f5f3ff; --nav-bg:#ffffff; --nav-border:#e2e8f0;
    --nav-tab-active:#4338ca; --nav-tab-inactive:#52525b;
    --card:#ffffff; --text:#1e1b4b; --text2:#4a4868; --text3:#6b7280;
    --border:#e2e8f0; --border2:#c7d2fe;
    --input-bg:#f0eefa; --input-color:#1e1b4b;
    --snapshot-bg:#eeedf8; --snap-border:#e2e8f0;
    --row-even:rgba(0,0,0,0.012); --row-odd:rgba(0,0,0,0.005);
    --row-hover:rgba(99,102,241,0.04); --row-border:#eceaf5;
    --txn-text:#374151; --acct-chip:rgba(0,0,0,0.05);
    --tbl-hdr:linear-gradient(90deg,#ede9fe,#e0e7ff); --tbl-hdr-border:rgba(99,102,241,0.25);
    --sort-bg:#f0eefa; --tour-bg:#ffffff; --tour-body:#52525b;
    --oneoff-border:rgba(99,102,241,0.3); --oneoff-border-on:rgba(99,102,241,0.6);
    --oneoff-bg-on:rgba(99,102,241,0.12);
    --oneoff-text:rgba(99,102,241,0.45); --oneoff-text-on:#4338ca;
  }
  .dark-screen { font-family: 'DM Sans', system-ui, sans-serif; }
  button, select, input { touch-action: manipulation; }
  @keyframes pulse { 0%,100%{transform:scale(1);opacity:0.3} 50%{transform:scale(1.4);opacity:1} }
  @keyframes fadeUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
  @keyframes fadeIn { from{opacity:0} to{opacity:1} }
  @keyframes heroText { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
  @keyframes scanline { from{opacity:0;transform:translateY(-4px)} to{opacity:1;transform:translateY(0)} }
  @keyframes glow { 0%,100%{box-shadow:0 0 8px rgba(99,102,241,0.3)} 50%{box-shadow:0 0 28px rgba(99,102,241,0.7)} }
  @keyframes slideInUp { from{opacity:0;transform:translateY(24px)} to{opacity:1;transform:translateY(0)} }
  @keyframes slideInRight { from{opacity:0;transform:translateX(32px)} to{opacity:1;transform:translateX(0)} }
  @keyframes cashBalPulse { 0%,100%{box-shadow:none} 30%{box-shadow:0 0 0 3px rgba(99,102,241,0.6),0 0 32px rgba(99,102,241,0.4)} 60%{box-shadow:0 0 0 2px rgba(99,102,241,0.4),0 0 20px rgba(99,102,241,0.25)} }
  @keyframes typingDot { 0%,60%,100%{transform:translateY(0);opacity:0.3} 30%{transform:translateY(-4px);opacity:1} }
  @keyframes tooltipIn { from{opacity:0;transform:translateY(4px)} to{opacity:1;transform:translateY(0)} }
  @keyframes spotlightIn { from{opacity:0;transform:translateY(12px) scale(0.97)} to{opacity:1;transform:translateY(0) scale(1)} }
  @keyframes cursorFloat { 0%,100%{transform:translate(0,0)} 40%{transform:translate(4px,6px)} 60%{transform:translate(4px,6px) scale(0.9)} 80%{transform:translate(4px,6px) scale(1)} }
  @keyframes cursorClick { 0%,100%{transform:scale(1)} 50%{transform:scale(0.82)} }
  @keyframes ripple { 0%{transform:scale(0.5);opacity:0.8} 100%{transform:scale(2.5);opacity:0} }
  @keyframes cursorFadeIn { from{opacity:0;transform:translate(-8px,-8px)} to{opacity:1;transform:translate(0,0)} }
  @keyframes slideInUp { from{opacity:0;transform:translateY(40px)} to{opacity:1;transform:translateY(0)} }
  @keyframes logoWipe { from{width:0} to{width:100%} }
  @keyframes logoBgFade { from{opacity:0} to{opacity:1} }
  @keyframes tourBtnPulse { 0%,100%{box-shadow:0 4px 18px rgba(99,102,241,0.55)} 50%{box-shadow:0 4px 28px rgba(99,102,241,0.9),0 0 0 6px rgba(99,102,241,0.2)} }
  @keyframes skeletonPulse { 0%,100%{opacity:0.5} 50%{opacity:1} }
  @keyframes insightsPulse { 0%,100%{opacity:0.5;transform:scale(1)} 50%{opacity:1;transform:scale(1.4)} }
  @keyframes insightFadeIn { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
  @keyframes incomeArrowPulse { 0%,100%{transform:translateY(0);opacity:0.55} 50%{transform:translateY(-4px);opacity:1} }
  .abound-row:hover td { background: rgba(99,102,241,0.07) !important; transition: background 0.1s; }
  @media (max-width: 1024px) {
    [data-sticky-label] { position: sticky !important; left: 0; z-index: 2; background: var(--sticky-bg, #0d0c1e) !important; }
    [data-sticky-label2] { position: sticky !important; left: 26px; z-index: 2; background: var(--sticky-bg, #0d0c1e) !important; box-shadow: var(--sticky-shadow, 6px 0 10px rgba(0,0,0,0.5)); }
    [data-sticky-hdr] { position: sticky !important; left: 0; z-index: 6; }
  }
`;

function isMobileDevice() {
  return window.innerWidth < 768 || (window.innerWidth < 1024 && navigator.maxTouchPoints > 0);
}
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(typeof window!=="undefined"?isMobileDevice():false);
  useEffect(()=>{
    const handler=()=>setIsMobile(isMobileDevice());
    window.addEventListener("resize",handler);
    return()=>window.removeEventListener("resize",handler);
  },[]);
  return isMobile;
}
let cashFlowTourShown = false;
// ─── Merchant data ────────────────────────────────────────────────────────────
const MERCHANT_MAP = {
  Food: [
    "tesco","sainsbury","waitrose","lidl","aldi","asda","morrisons","marks","m&s","co-op","coop",
    "londis","spar","budgens","iceland","farmfoods","whole foods","wholefoods","planet organic",
    "kokoro","noodles","noodles city","dojo*kokoro","dojo kokoro",
    "pret","pret a manger","starbucks","costa","caffe nero","greggs","subway","mcdonalds","mcdonald",
    "kfc","burger king","five guys","nandos","wagamama","itsu","wasabi","leon","pod","eat",
    "deliveroo","just eat","uber eats","ubereats","doordash","gopuff","getir","zapp",
    "pizza hut","dominos","domino","papa johns","papa john","pizza express","pizzaexpress",
    "yo sushi","sushi","tonkotsu","ramen","dishoom","ottolenghi","gail","gails",
    "abel & cole","riverford","farmdrop","ocado","amazon fresh","amazonfresh",
    "wetherspoon","wetherspoons","jd wetherspoon","pub","bar","cafe","restaurant",
    "wine","beer","spirits","majestic","oddbins","honest burgers","honest burger",
    "gousto","hellofresh","mindful chef","simply cook","pasta evangelists",
    "eden","jimmys","patty","shake shack","byron","honest"
  ],
  Travel: [
    "tfl","transport for london","oyster","citymapper",
    "uber","bolt","ola","free now","addison lee","black cab",
    "trainline","lner","gwr","avanti","southeastern","southern","thameslink","c2c","chiltern",
    "eurostar","national rail","rail","greater anglia","crosscountry","transpennine","northern",
    "ryanair","easyjet","british airways","ba.com","lufthansa","klm","air france","wizz",
    "jet2","virgin atlantic","emirates","qatar","turkish airlines","norwegian",
    "heathrow express","gatwick express","stansted express","luton",
    "enterprise","hertz","avis","zipcar","enterprise car","sixt",
    "parking","ncp","q-park","airparks","holiday extras",
    "viator","trip.com","klook","getyourguide","musement","tiqets",
    "booking.com","hotels.com","expedia","airbnb","hostelworld",
    "national express","megabus","flixbus","coach",
    "p&o","carnival","cruise","ferry","hovercraft",
    "lime","bird","scooter","voi","tier","dott","e-scooter"
  ],
  Memberships: [
    "netflix","spotify","apple","itunes","icloud","apple.com","appstore",
    "amazon prime","prime video","disney","disney+","disneyplus",
    "hbo","hulu","paramount","peacock","britbox","mubi",
    "gymbox","puregym","virgin active","david lloyd","anytime fitness","planet fitness",
    "gym","fitness","crossfit","pilates","yoga","barry's","f45","orangetheory",
    "audible","kindle","scribd","times newspaper","guardian","ft.com","financial times",
    "sky","now tv","nowtv","bt sport","dazn","eurosport","discovery+",
    "youtube premium","twitch","patreon",
    "adobe","microsoft","office 365","microsoft 365","dropbox",
    "duolingo","masterclass","coursera","udemy","skillshare",
    "hinge","tinder","bumble","match.com","eharmony",
    "headspace","calm","betterhelp",
    // Telecoms / mobile
    "o2","three","ee","ee limited","giffgaff","id mobile","smarty","tesco mobile","lebara","lyca","sky mobile","bt mobile","talkmobile","virgin mobile",
    "claude.ai","claude ai","anthropic",
    // Insurance
    "insurance","aviva","axa","direct line","directline","admiral","churchill","hastings direct",
    "esure","saga","rac breakdown","green flag","aa breakdown","legal & general",
    "legal and general","royal london","zurich","allianz","ageas","sun life","sunlife",
    "nfu mutual","vitality health","cigna","aig life","one call",
    "pet plan","petplan","bought by many","waggel","animal friends",
    "home protect","homeprotect","policy bee","lv insurance","lv=","sheila's wheels",
    "hastings","zenith insurance","intact insurance",
    // Road tax / vehicle
    "dvla","vehicle tax","road tax","driver & vehicle","dvla licensing",
    // Utilities treated as subscriptions
    "water plus","affinity water","southern water direct",
    // Sports / clubs
    "sparring partners","boxing club","martial arts","judo","karate","taekwondo",
    "swimming club","tennis club","golf club","squash club","badminton","cricket club",
    "football club","rugby club","cycling club","running club","triathlon"
  ],
  Rent: [
    "rent","landlord","letting","estate agent","rightmove","zoopla","openrent",
    "mortgage","nationwide","barclays mortgage","hsbc mortgage","santander mortgage",
    "ground rent","service charge","freeholder","leaseholder","management company",
    "storage","big yellow","safestore","access storage","shurgard",
    "thames water","severn trent","anglian water","yorkshire water","united utilities","southern water",
    "british gas","eon","e.on","edf","octopus","bulb","ovo","npower","scottish power","sse",
    "virgin media","talktalk","vodafone","council tax","rates","water rates","tv licence","broadband"
  ],
  "Online Shopping": [
    "paypal","paypal *",
    "amazon","ebay","etsy","asos","next","very","shein","boohoo","prettylittlething","missguided",
    "aliexpress","wish","depop","vinted","argos","currys","john lewis","johnlewis","jd sports","jdsports",
    "sports direct","nike","adidas","net-a-porter","farfetch","revolve","made.com","wayfair","dunelm",
    "the range","wilko","b&q","homebase","ikea","matalan","tkmaxx","primark","topshop","zara","h&m",
    "gap","new look","river island","dorothy perkins","burton","marks and spencer","m&s"
  ],
  Healthcare: [
    "specsavers","vision express","boots","superdrug","lloyds pharmacy","well pharmacy","day lewis",
    "boots pharmacy","chemist","optician","opticians","dentist","dental","nhs","bupa","vitality",
    "nuffield","benenden","axa health","private gp","physio","physiotherapy","pharmacy","pharmacist",
    "skin","dermatologist","gp","counselling","psychologist","hearing"
  ],
  Income: [
    "salary","payroll","wages"
  ],
  Investments: [
    "lightyear","trading 212","trading212","freetrade","vanguard",
    "hargreaves lansdown","hargreaves","hl limited","hl ltd","hl invest",
    "investec","degiro","etoro","nutmeg","moneybox","aj bell","ajbell",
    "interactive investor","ii limited","interactive brokers","fidelity",
    "charles stanley","cavendish online","bestinvest","stocktrade",
    "trading 212 ltd","freetrade ltd","vanguard ltd","nutmeg ltd"
  ]
};

const FIRST_WORD_MAP = {};
Object.entries(MERCHANT_MAP).forEach(([cat, merchants]) => {
  merchants.forEach(m => {
    const firstWord = m.split(/\s+/)[0].toLowerCase();
    if (!FIRST_WORD_MAP[firstWord]) FIRST_WORD_MAP[firstWord] = cat;
  });
});

const INTERCOMPANY_PATTERNS = [
  "american express","amex","nw world","nw world mastercard","natwest world","world mastercard",
  "mastercard","visa credit","credit card","card repayment","card payment","creditcard",
  "barclaycard","natwest card","hsbc card","lloyds card","halifax card","tsb card",
  "capital one","aqua","vanquis","newday","fluid","aquis","virgin money credit",
  "tesco bank card","sainsbury bank card","mbna","creation finance","currys credit",
  "very credit","argos card","next credit","amazon visa","john lewis card","waitrose card",
  "payment to credit","payment to card","payment to amex","payment to barclaycard"
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function merchantLookup(narrative) {
  const n = narrative.toLowerCase().trim();
  if (INTERCOMPANY_PATTERNS.some(p => n.includes(p))) return INTERCOMPANY_CATEGORY;
  for (const [cat, merchants] of Object.entries(MERCHANT_MAP)) {
    if (merchants.some(m => m.length >= 3 && n.includes(m))) return cat;
  }
  return null;
}

function parseDate(val) {
  if (!val) return null;
  if (typeof val === "number") {
    const d = new Date(Math.round((val - 25569) * 86400 * 1000));
    if (!isNaN(d) && d.getFullYear() >= 2000) return d;
    return null;
  }
  if (val instanceof Date) {
    if (!isNaN(val) && val.getFullYear() >= 2000) return val;
    return null;
  }
  const s = String(val).trim();
  const mo = {jan:0,feb:1,mar:2,apr:3,may:4,jun:5,jul:6,aug:7,sep:8,oct:9,nov:10,dec:11};
  // DD-Mon-YY  e.g. 13-Mar-24
  const m1 = s.match(/^(\d{1,2})-([A-Za-z]{3})-(\d{2})$/);
  if (m1) return new Date(2000+parseInt(m1[3]), mo[m1[2].toLowerCase()], parseInt(m1[1]));
  // DD-Mon-YYYY  e.g. 13-Mar-2024
  const m2 = s.match(/^(\d{1,2})-([A-Za-z]{3})-(\d{4})$/);
  if (m2) return new Date(parseInt(m2[3]), mo[m2[2].toLowerCase()], parseInt(m2[1]));
  // DD/MM/YYYY
  const m3 = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (m3) return new Date(parseInt(m3[3]), parseInt(m3[2])-1, parseInt(m3[1]));
  // YYYY-MM-DD
  const m4 = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m4) return new Date(parseInt(m4[1]), parseInt(m4[2])-1, parseInt(m4[3]));
  // DD/MM/YY
  const m5 = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2})$/);
  if (m5) return new Date(2000+parseInt(m5[3]), parseInt(m5[2])-1, parseInt(m5[1]));
  // DD Mon YYYY  e.g. 13 Mar 2024
  const m6 = s.match(/^(\d{1,2})\s+([A-Za-z]{3})\s+(\d{4})$/);
  if (m6) return new Date(parseInt(m6[3]), mo[m6[2].toLowerCase()], parseInt(m6[1]));
  // DD Mon YY  e.g. 13 Mar 24
  const m7 = s.match(/^(\d{1,2})\s+([A-Za-z]{3})\s+(\d{2})$/);
  if (m7) return new Date(2000+parseInt(m7[3]), mo[m7[2].toLowerCase()], parseInt(m7[1]));
  // DD Mon  (no year — Halifax, Lloyds PDFs) — infer year
  const m8 = s.match(/^(\d{1,2})\s+([A-Za-z]{3})$/);
  if (m8) {
    const day=parseInt(m8[1]), month=mo[m8[2].toLowerCase()];
    if (month===undefined) return null;
    const now=new Date(), yr=now.getFullYear();
    // If the month is more than 2 months in the future, assume previous year
    const candidate=new Date(yr,month,day);
    if (candidate>new Date(now.getFullYear(),now.getMonth()+2,now.getDate())) return new Date(yr-1,month,day);
    return candidate;
  }
  // MM/DD or DD/MM — no year (Chase US uses MM/DD; UK banks use DD/MM)
  const m9 = s.match(/^(\d{1,2})\/(\d{1,2})$/);
  if (m9) {
    const a = parseInt(m9[1]), b = parseInt(m9[2]);
    const now = new Date(), yr = now.getFullYear();
    let month, day;
    if (b > 12)      { month = a - 1; day = b; }  // b can't be month → MM/DD (Chase style)
    else if (a > 12) { month = b - 1; day = a; }  // a can't be month → DD/MM (UK style)
    else             { month = a - 1; day = b; }  // ambiguous → assume MM/DD (Chase/US default)
    const candidate = new Date(yr, month, day);
    if (candidate > new Date(yr, now.getMonth() + 2, now.getDate())) return new Date(yr - 1, month, day);
    return candidate;
  }
  const d = new Date(s);
  if (!isNaN(d) && d.getFullYear() >= 2000) return d;
  return null;
}

function getWeekMonday(date) {
  const d = new Date(date), day = d.getDay();
  d.setDate(d.getDate()+(day===0?-6:1-day)); d.setHours(0,0,0,0); return d;
}
function getWeekSunday(mon) { const d=new Date(mon); d.setDate(d.getDate()+6); return d; }
function fmt(date) { return date.toLocaleDateString("en-GB",{day:"2-digit",month:"short",year:"2-digit"}); }
function fmtDate(date) { return date.toLocaleDateString("en-GB",{day:"2-digit",month:"short",year:"numeric"}); }
const CURRENCIES = [
  {code:"GBP", symbol:"£"}, {code:"USD", symbol:"$"}, {code:"EUR", symbol:"€"},
  {code:"AUD", symbol:"A$"}, {code:"CAD", symbol:"C$"}, {code:"CHF", symbol:"Fr"},
  {code:"SEK", symbol:"kr"}, {code:"NOK", symbol:"kr"}, {code:"DKK", symbol:"kr"},
  {code:"SGD", symbol:"S$"}, {code:"HKD", symbol:"HK$"}, {code:"JPY", symbol:"¥"},
  {code:"INR", symbol:"₹"}, {code:"ZAR", symbol:"R"}, {code:"NZD", symbol:"NZ$"},
];
const CURRENCY_KEY = "abound_currency_v1";
function getCurrencySymbol() { return localStorage.getItem(CURRENCY_KEY) || "£"; }
let _currencySymbol = getCurrencySymbol();
function setCurrencySymbol(sym) { _currencySymbol = sym; localStorage.setItem(CURRENCY_KEY, sym); }
function fmtMoney(v) {
  if (v===0||v===null||v===undefined) return "-";
  const n = Math.round(v);
  const sym = _currencySymbol;
  if (n < 0) return `(${sym}${Math.abs(n).toLocaleString()})`;
  return `${sym}${n.toLocaleString()}`;
}
function rollingAvg(vals) { const nz=vals.filter(v=>v>0); return nz.length?Math.round(nz.reduce((a,b)=>a+b,0)/nz.length):0; }
function rollingAvgFiltered(vals) {
  const nz=vals.filter(v=>v>0);
  if(!nz.length) return 0;
  const sorted=[...nz].sort((a,b)=>a-b);
  const median=sorted[Math.floor(sorted.length/2)];
  // Remove outlier weeks more than 2.5x the median (e.g. holiday travel splurge)
  const filtered=nz.filter(v=>v<=median*2.5);
  const use=filtered.length>=Math.ceil(nz.length/2)?filtered:nz;
  return Math.round(use.reduce((a,b)=>a+b,0)/use.length);
}

// ─── File Reading ─────────────────────────────────────────────────────────────
function readExcelFile(file) {
  return new Promise(resolve => {
    const reader = new FileReader();
    const ext = file.name.split('.').pop().toLowerCase();
    reader.onload = e => {
      try {
        const wb = ext==="csv"
          ? XLSX.read(e.target.result, {type:"string"})
          : XLSX.read(new Uint8Array(e.target.result), {type:"array"});
        const sheet = wb.Sheets[wb.SheetNames[0]];
        const allRows = XLSX.utils.sheet_to_json(sheet, {header:1, defval:"", raw:true});
        const dateRx = /\bdate\b/i;
        const descRx = /\b(description|narrative|details|merchant|payee|reference|transaction.?desc)\b/i;
        const amtRx  = /\b(amount|debit|credit|value|trans)\b/i;
        let headerRowIndex = -1;
        let dateKey, descKey, amtKey;
        for (let i = 0; i < Math.min(allRows.length, 20); i++) {
          const row = allRows[i].map(c => String(c).trim());
          const dIdx = row.findIndex(c => dateRx.test(c) && !/update|expiry|birth/i.test(c));
          const nIdx = row.findIndex(c => descRx.test(c));
          const aIdx = row.findIndex(c => amtRx.test(c) && !/balance|date/i.test(c));
          if (dIdx !== -1 && nIdx !== -1 && aIdx !== -1) {
            headerRowIndex = i;
            dateKey = row[dIdx]; descKey = row[nIdx]; amtKey = row[aIdx];
            break;
          }
        }
        if (headerRowIndex === -1) { resolve({rows:[],summaryBalance:null}); return; }
        const headers = allRows[headerRowIndex].map(h => String(h).trim());
        const dataRows = allRows.slice(headerRowIndex + 1)
          .filter(r => r.some(c => c !== "" && c !== null && c !== undefined))
          .map(r => { const obj = {}; headers.forEach((h, i) => { if (h) obj[h] = r[i] ?? ""; }); return obj; });
        const hasBalanceCol=headers.some(h=>/^(balance|running.?balance|account.?balance)$/i.test(h));
        let summaryBalance=null;
        if(!hasBalanceCol&&wb.SheetNames.length>1){
          const PREFER=['new balance','closing balance','balance','total'];
          const found={};
          for(let si=1;si<wb.SheetNames.length;si++){
            const sRows=XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[si]],{header:1,defval:"",raw:true});
            for(const sRow of sRows){
              const cells=sRow.map(c=>String(c).trim());
              for(let ci=0;ci<cells.length;ci++){
                const lbl=cells[ci].toLowerCase().replace(/\s+/g,' ').trim();
                if(/^(total|balance|closing balance|new balance)$/.test(lbl)&&!(lbl in found)){
                  const neighbors=[cells[ci+1],cells[ci-1],cells[ci+2],cells[ci-2]].filter(Boolean);
                  const val=neighbors.map(n=>parseFloat(String(n).replace(/[£$€,]/g,''))).find(v=>!isNaN(v));
                  if(val!==undefined)found[lbl]=val;
                }
              }
            }
          }
          for(const key of PREFER){if(found[key]!==undefined){summaryBalance=found[key];break;}}
        }
        resolve({rows:dataRows,summaryBalance});
      } catch(err){console.error("Error reading file:",err);resolve({rows:[],summaryBalance:null});}
    };
    if (ext==="csv") reader.readAsText(file);
    else reader.readAsArrayBuffer(file);
  });
}
async function loadPdfJs() {
  if (window.pdfjsLib) return window.pdfjsLib;
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
    script.onload = () => {
      window.pdfjsLib.GlobalWorkerOptions.workerSrc =
        'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
      resolve(window.pdfjsLib);
    };
    script.onerror = () => reject(new Error('Failed to load PDF.js'));
    document.head.appendChild(script);
  });
}

async function readPdfFile(file) {
  const pdfjsLib = await loadPdfJs();
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

  // Matches dates at start of text: "13 Mar", "09/22" (Chase MM/DD), dd/mm/yy, dd-Mon-yyyy, etc.
  // The 2-part MM/DD pattern is last so full dates (dd/mm/yyyy) match first.
  const dateRx = /^(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}|\d{1,2}[\/\-][A-Za-z]{3}[\/\-]\d{2,4}|\d{1,2}\s+[A-Za-z]{3}(?:\s+\d{2,4})?|\d{2}\/\d{2}(?!\/\d))/;
  // Matches plain money values: 1,234.56 or -1234.56 (strip £ before testing)
  const moneyRx = /^-?[\d,]+\.\d{2}$/;
  const TRANSACTION_TYPES = /^(D\/D|S\/O|BACS|DPC|CHQ|TFR|ATM|FP|BGC|OTH|CR|DR|VIS|MAE|C\/L|BP|CHAPS|DD|SO|BAC|TF|FPS|STO|CPT|TFI|INT|Giro|Visa|Maestro|Contactless|LINK|STO|TFR|SEPA|SWIFT)$/i;
  const rows = [];
  let lastDateStr = null; // carry forward date for banks that omit it on continuation lines

  // Column x-positions for debit/credit detection — persist across pages
  let creditX = null, debitX = null; // "paid in" / "money in" = credit; "paid out" / "money out" = debit

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const textContent = await page.getTextContent();

    const items = textContent.items
      .map(item => ({
        text: item.str.trim(),
        x: Math.round(item.transform[4]),
        y: Math.round(item.transform[5] / 4) * 4, // 4px snap for better line grouping
        w: item.width,
      }))
      .filter(i => i.text.length > 0);

    // Group into lines by y-coordinate
    const lineMap = {};
    items.forEach(item => {
      if (!lineMap[item.y]) lineMap[item.y] = [];
      lineMap[item.y].push(item);
    });

    const lines = Object.values(lineMap)
      .map(lineItems => lineItems.sort((a, b) => a.x - b.x))
      .sort((a, b) => b[0].y - a[0].y); // descending y = top to bottom

    for (const lineItems of lines) {
      const lineText = lineItems.map(i => i.text).join(' ');
      const lower = lineText.toLowerCase();

      // Detect column headers for credit/debit columns
      // Handles: "Paid in/out", "Money in/out", "Credit/Debit", "Payments in/out" (Chase)
      const hasCredit = lower.includes('paid in') || lower.includes('money in') || lower.includes('payments in') || lower.includes('credit') || /\bin\b/.test(lower);
      const hasDebit  = lower.includes('paid out') || lower.includes('money out') || lower.includes('payments out') || lower.includes('debit') || /\bout\b/.test(lower);
      if (hasCredit && hasDebit) {
        let cX = null, dX = null;
        const joinedItems = lineItems.map((it, i) => ({...it, next: lineItems[i+1]?.text.toLowerCase()||'', prev: lineItems[i-1]?.text.toLowerCase()||''}));
        for (const it of joinedItems) {
          const t = it.text.toLowerCase();
          if (t === 'paid in' || t === 'money in' || t === 'payments in' || (t === 'in' && (it.prev === 'paid' || it.prev === 'money' || it.prev === 'payments')))  cX = it.x;
          if (t === 'paid out' || t === 'money out' || t === 'payments out' || (t === 'out' && (it.prev === 'paid' || it.prev === 'money' || it.prev === 'payments'))) dX = it.x;
          if ((t === 'paid'||t === 'money'||t === 'payments') && it.next === 'in')  cX = it.x;
          if ((t === 'paid'||t === 'money'||t === 'payments') && it.next === 'out') dX = it.x;
          if (t === 'credit' && (lower.includes('debit') || lower.includes('out'))) cX = it.x;
          if (t === 'debit'  && (lower.includes('credit') || lower.includes('in'))) dX = it.x;
        }
        if (cX !== null) creditX = cX;
        if (dX !== null) debitX = dX;
        continue;
      }

      // Skip reference/continuation lines (Ref: XXXX, Narrative: etc.)
      if (/^\s*Ref\s*:/i.test(lineText) || /^\s*Narrative\s*:/i.test(lineText)) continue;
      // Skip balance summary rows and section headers
      if (/start.?balance|brought.?forward|closing.?balance|opening.?balance|beginning.?balance|end(?:ing)?\s+balance|^\s*balance\b|total\s+(debit|credit)|checking.?summary|deposits.?and.?addition|electronic.?withdrawal|ATM.*withdrawal/i.test(lineText)) continue;

      const dateMatch = lineText.match(dateRx);
      const hasDate = !!dateMatch;
      // Lines with no date can still be transactions if we have a carried-forward date and money amounts
      if (!hasDate && !lastDateStr) continue;
      const dateStr = hasDate ? dateMatch[0] : lastDateStr;
      if (hasDate) lastDateStr = dateStr;

      // Collect money amounts on this line
      const moneyItems = lineItems.filter(it => moneyRx.test(it.text.replace(/[£$,]/g, '')));
      if (moneyItems.length === 0) continue;

      // If the amount itself is negative (explicit sign), trust it directly
      const lastMoney = moneyItems[moneyItems.length - 1];
      const secondLast = moneyItems.length >= 2 ? moneyItems[moneyItems.length - 2] : null;

      // Determine which item is the transaction amount vs balance
      // Convention: rightmost is usually balance, second-from-right is amount
      const txnItem = secondLast || lastMoney;
      const balItem = secondLast ? lastMoney : null;

      const rawStr = txnItem.text.replace(/[£$,]/g, '');
      const rawAmt = parseFloat(rawStr);
      if (isNaN(rawAmt) || rawAmt === 0) continue;

      let signedAmt = rawAmt; // may already be negative if PDF contains minus sign

      if (rawAmt > 0) {
        // Try column-position detection first
        if (creditX !== null && debitX !== null) {
          const distCredit = Math.abs(txnItem.x - creditX);
          const distDebit  = Math.abs(txnItem.x - debitX);
          signedAmt = distDebit < distCredit ? -rawAmt : rawAmt;
        } else if (balItem) {
          // Fall back: if balance dropped, it was a debit
          const balAmt = parseFloat(balItem.text.replace(/[£$,]/g, ''));
          if (!isNaN(balAmt) && rows.length > 0) {
            const prevBal = parseFloat(rows[rows.length - 1].Balance);
            if (!isNaN(prevBal) && balAmt < prevBal - 0.005) signedAmt = -rawAmt;
          }
        } else {
          // Last resort: check if line contains "DR" or ends with "D" indicator
          if (/\bDR\b/.test(lineText) || /\bdebit\b/i.test(lineText)) signedAmt = -rawAmt;
        }
      }

      // Description = text between date and first money item, stripped of type codes
      const firstMoneyX = moneyItems[0].x;
      const dateEndX = lineItems[0].x + dateStr.length * 5; // rough estimate
      const descItems = lineItems.filter(it =>
        it.x > dateEndX - 10 &&
        it.x < firstMoneyX - 4 &&
        !TRANSACTION_TYPES.test(it.text.trim()) &&
        !dateRx.test(it.text)
      );
      const description = descItems.map(i => i.text).join(' ').trim();
      if (!description || description.length < 2) continue;

      rows.push({
        Date:        dateStr,
        Description: description,
        Amount:      String(signedAmt),
        Balance:     balItem ? balItem.text.replace(/[£$,]/g, '') : '',
      });
    }
  }

  return rows;
}

function normaliseRows(rawRows, accountLabel, summaryBalance=null) {
  let rows = rawRows;
  if (!rows.length) return [];
  const keys = Object.keys(rows[0]);
  const isMainAccount = accountLabel === "Main Account";
  const toNum = s => Number(String(s||"").replace(/[£$€,\s]/g,""))||0;

  // Filter Revolut declined/reverted rows before processing
  const stateKey = keys.find(k=>/^state$/i.test(k.trim()));
  if (stateKey) rows = rows.filter(r=>!/^(reverted|declined|failed|pending)$/i.test(String(r[stateKey]).trim()));

  const dateKey = keys.find(k=>/^(date|transaction.?date|started.?date|completed.?date)$/i.test(k.trim()))
               || keys.find(k=>/date/i.test(k)&&!/update|expiry/i.test(k));
  const narKey  = keys.find(k=>/^(description|narrative|details|merchant|payee|reference|counter.?party)$/i.test(k.trim()))
               || keys.find(k=>/desc|narr|merchant|payee|detail|counter/i.test(k));

  // Detect split debit/credit column pattern (Lloyds, Halifax, Barclays, NatWest, Santander)
  const creditKey = keys.find(k=>/\b(credit|money.?in|paid.?in|deposit)\b/i.test(k.trim()) && !/\b(debit|out)\b/i.test(k.trim()));
  const debitKey  = keys.find(k=>/\b(debit|money.?out|paid.?out|withdrawal)\b/i.test(k.trim()) && !/\b(credit|in)\b/i.test(k.trim()));
  const splitMode = !!(creditKey && debitKey);

  // Single-amount column fallback (Monzo, Starling, Revolut, Wise, Tide)
  const amtKey = !splitMode
    ? (keys.find(k=>/^(amount|value|trans|net.?amount)$/i.test(k.trim()))
    || keys.find(k=>/amount|value|trans|spend/i.test(k)&&!/balance|date|extended|statement|fee|currency/i.test(k)))
    : null;

  const balKey = keys.find(k=>/^(balance|running.?balance|account.?balance)$/i.test(k.trim()));

  if (!dateKey||!narKey||(splitMode?false:!amtKey)) {
    console.error(`[${accountLabel}] Missing columns. Keys:`, keys.join(", "));
    return [];
  }

  // Strip trailer/balance-summary rows (e.g. NatWest CC "Balance as at DD Mon YYYY"):
  // rows where the amount column(s) are empty/zero but the balance column has a value.
  let trailerBalance = null;
  if (balKey) {
    rows = rows.filter(row => {
      const narVal = String(row[narKey]||"").trim();
      const amtZero = splitMode
        ? toNum(row[creditKey])===0 && toNum(row[debitKey])===0
        : toNum(row[amtKey])===0;
      const balVal = toNum(row[balKey]);
      if (amtZero && balVal!==0 && /\bbalance\b/i.test(narVal)) {
        trailerBalance = balVal;
        return false;
      }
      return true;
    });
  }

  const txnList = rows.map(row=>{
    const date = parseDate(row[dateKey]);
    const narrative = String(row[narKey]||"").replace(/\r\n|\r|\n/g," ").trim();
    const balance = balKey?(toNum(row[balKey])||null):null;

    let rawAmt;
    if (splitMode) {
      const inAmt  = toNum(row[creditKey]);
      const outAmt = toNum(row[debitKey]);
      if (inAmt===0 && outAmt===0) return null;
      // Money-in = positive, money-out = negative
      rawAmt = inAmt > 0 ? inAmt : -outAmt;
    } else {
      rawAmt = toNum(row[amtKey]);
    }

    if (!date||!narrative||rawAmt===0) return null;
    // Discard balance-summary rows that slipped through PDF parsing (e.g. "balance", "End balance")
    if (/^(balance|end\s+balance|opening\s+balance|closing\s+balance|brought\s+forward|start\s+balance)$/i.test(narrative)) return null;
    const amount = Math.abs(rawAmt);
    const isIncome = isMainAccount ? rawAmt>0 : rawAmt<0;
    return {date, narrative, amount, isIncome, balance, account:accountLabel, category:null};
  }).filter(Boolean);

  // Inject trailer balance (Case 1) or sheet-summary balance (Case 2) onto the most recent
  // transaction when no per-row balance was present in the data.
  const injectBal = trailerBalance !== null ? trailerBalance : summaryBalance;
  if (injectBal !== null && !txnList.some(t => t.balance !== null)) {
    const maxDate = txnList.reduce((max, t) => t.date > max ? t.date : max, new Date(0));
    txnList.forEach(t => { if (t.date.getTime() === maxDate.getTime()) t.balance = injectBal; });
  }
  return txnList;
}

function hasAnyBalance(txns) {
  return txns.some(t => t.balance !== null && t.balance !== undefined);
}

// ─── AI Categorisation ────────────────────────────────────────────────────────
function ruleBasedCat(narrative, allCats) {
  const n = narrative.toLowerCase().trim();
  const firstWord = n.split(/\s+/)[0];
  if (FIRST_WORD_MAP[firstWord] && allCats.includes(FIRST_WORD_MAP[firstWord])) return FIRST_WORD_MAP[firstWord];
  for (const w of n.split(/\s+/)) {
    if (w.length >= 4 && FIRST_WORD_MAP[w] && allCats.includes(FIRST_WORD_MAP[w])) return FIRST_WORD_MAP[w];
  }
  return "Other Payments";
}

function normalizeMerchant(narrative) {
  const cleaned = narrative.toLowerCase()
    .replace(/\b(limited|ltd|plc|uk|gb|gbr|group|holdings?|international|intl|direct|debit|payment|bacs|faster|charge|fee)\b/g," ")
    .replace(/[0-9*#@&.,'\-_]/g," ").replace(/\s+/g," ").trim();
  const stopWords = new Set(["the","and","for","via","ref","dbt","crd","pay","app","www","http","from","with"]);
  const words = cleaned.split(" ").filter(w=>w.length>=3&&!stopWords.has(w));
  return words.slice(0,2).join(" ");
}

const SESSION_ID = crypto.randomUUID();

async function callClaudeMessages(messages, maxTokens=800, timeoutMs=15000) {
  const ctrl = new AbortController();
  const timer = setTimeout(()=>ctrl.abort(), timeoutMs);
  try {
    const res = await fetch("/api/categorise",{
      method:"POST",
      headers:{"content-type":"application/json","x-session-id":SESSION_ID},
      body:JSON.stringify({model:"claude-haiku-4-5-20251001",max_tokens:maxTokens,messages}),
      signal: ctrl.signal,
    });
    if(!res.ok){
      const errBody=await res.json().catch(()=>({}));
      if(res.status===429 && errBody?.error==="limit_reached"){
        const e=new Error(errBody.message||"Categorisation limit reached for this session.");
        e.isLimitReached=true;
        throw e;
      }
      throw new Error(errBody?.error?.message||errBody?.message||(typeof errBody?.error==="string"?errBody.error:null)||`HTTP ${res.status}`);
    }
    const data = await res.json();
    return data.content[0].text.trim();
  } finally {
    clearTimeout(timer);
  }
}

async function callClaude(prompt, maxTokens=800, timeoutMs=15000) {
  const ctrl = new AbortController();
  const timer = setTimeout(()=>ctrl.abort(), timeoutMs);
  try {
    const res = await fetch("/api/categorise",{
      method:"POST",
      headers:{"content-type":"application/json","x-session-id":SESSION_ID},
      body:JSON.stringify({model:"claude-haiku-4-5-20251001",max_tokens:maxTokens,messages:[{role:"user",content:prompt}]}),
      signal: ctrl.signal,
    });
    if(!res.ok){
      const errBody=await res.json().catch(()=>({}));
      if(res.status===429 && errBody?.error==="limit_reached"){
        const e=new Error(errBody.message||"Categorisation limit reached for this session.");
        e.isLimitReached=true;
        throw e;
      }
      throw new Error(errBody?.error?.message||errBody?.message||(typeof errBody?.error==="string"?errBody.error:null)||`HTTP ${res.status}`);
    }
    const data = await res.json();
    return data.content[0].text.trim();
  } finally {
    clearTimeout(timer);
  }
}

async function smartCategorise(transactions, userCategories, multipleAccounts, onProgress) {
  let limitReachedEmitted = false;
  function emitLimit(e) { if(e?.isLimitReached && !limitReachedEmitted){ limitReachedEmitted=true; onProgress({type:"limit_reached"}); } }
  const allCats = multipleAccounts
    ? [...userCategories.filter(c=>c!==INTERCOMPANY_CATEGORY), INTERCOMPANY_CATEGORY]
    : userCategories;
  const spendCats = allCats.filter(c=>c!=="Income");

  // Pattern: "FIRSTNAME LASTNAME, PAYMENT" or "NAME , MONTHLY , VIA MOBILE - LVP" — person-to-person bank transfer
  const TRANSFER_RE = /^([A-Za-z][A-Za-z'-]*(?:\s+[A-Za-z'-]+){1,3})\s*,\s*(?:payment|monthly)/i;
  const VIA_MOBILE_RE = /^[A-Za-z][A-Za-z'-]*(?:\s+[A-Za-z'-]+)+\s*,.*via\s+mobile/i;
  const BUSINESS_WORDS = /\b(bank|building|society|card|finance|limited|ltd|plc|group|services|insurance|direct|national|barclays|lloyds|hsbc|natwest|halifax|santander|monzo|starling|revolut|amex|visa|mastercard|paypal|apple|google|amazon)\b/i;
  function isPersonTransfer(narrative) {
    const n = narrative.trim();
    const m = n.match(TRANSFER_RE);
    if (m && !BUSINESS_WORDS.test(m[1])) return true;
    if (VIA_MOBILE_RE.test(n) && !BUSINESS_WORDS.test(n.split(/\s*,/)[0])) return true;
    return false;
  }

  // Step 1: income/transfer routing — reliable, no ambiguity
  const withIncome = transactions.map(t => {
    // Person-to-person transfer (outgoing or incoming) — caught before income routing
    if (isPersonTransfer(t.narrative)) return {...t, category:"Transfers"};
    if (t.isIncome && t.account!=="Main Account") return {...t, category:"Card Repayment"};
    if (t.isIncome && t.account==="Main Account") {
      return {...t, category:"Income"};
    }
    return {...t, category:null};
  });
  const toClassify = withIncome.filter(t=>t.category===null);
  onProgress({type:"lookup_done", known:withIncome.length-toClassify.length, unknown:toClassify.length, pct:10});
  if (toClassify.length===0) { onProgress({type:"done"}); return withIncome; }

  const results = new Map();

  const MAIN_PROMPT = (batch, cats) =>
`You are categorising UK bank transactions. Assign every transaction to EXACTLY one of: ${cats.join(", ")}.

Rules (be strict — follow these exactly):
- Food: supermarkets (Tesco, Sainsbury's, Asda, Morrisons, Aldi, Lidl, Waitrose, M&S Food, Co-op, Iceland), restaurants, cafes, Pret, Costa, Starbucks, McDonald's, KFC, Nando's, Greggs, takeaways, Deliveroo, Just Eat, Uber Eats
- Travel: TfL, Oyster, Uber, Bolt, Lyft, trains (Trainline, National Rail, Avanti, GWR, LNER, Eurostar), flights (EasyJet, Ryanair, BA, Wizz), parking, petrol/fuel stations (Shell, BP, Esso, Texaco)
- Rent: rent, mortgage, letting agents, estate agents, property management companies, council tax, utilities (gas, electricity, water)
- Memberships: ONLY use this for clearly recurring subscriptions — phone/mobile contracts (O2, Vodafone, EE, Three, giffgaff, iD Mobile, Smarty, Tesco Mobile, Lebara, Sky Mobile); broadband/TV (BT, Virgin Media, Sky, TalkTalk, Plusnet); streaming services (Netflix, Spotify, Disney+, Amazon Prime, Apple TV, YouTube Premium); gym memberships; explicitly subscription-based SaaS (iCloud, Adobe, Microsoft 365, Google One); insurance (car, home, life, pet — Aviva, AXA, Direct Line, Admiral, Churchill, Hastings, Saga, RAC, AA, Legal & General, Royal London, Zurich, Allianz, Sun Life, BUPA Dental, Vitality); DVLA vehicle tax, road tax. Do NOT use Memberships for one-off purchases, general online purchases, healthcare, or anything ambiguous — prefer Other Payments in doubt
- Transfers: person-to-person bank transfers. Patterns: (1) "FIRSTNAME LASTNAME, PAYMENT" or "FIRSTNAME LASTNAME , MONTHLY"; (2) any narrative starting with a person's name followed by ", ... , VIA MOBILE" or containing "VIA MOBILE - LVP". Both sending and receiving money to/from friends or family. NOT business payments.
- Investments: deposits to investment platforms — Lightyear, Trading 212, Freetrade, Vanguard, Hargreaves Lansdown, HL Ltd, Investec, DeGiro, eToro, Nutmeg, Moneybox, AJ Bell, Interactive Investor, Fidelity, Charles Stanley, or any narrative containing "ISA", "SIPP", "FUND", "STOCKS AND SHARES" when it is an outgoing payment to a financial platform
- Online Shopping: Amazon purchases (NOT Amazon Prime), eBay, ASOS, Etsy, Next, Very, Shein, Boohoo, Argos, Currys, John Lewis, JD Sports, Sports Direct, Zara, H&M, Primark, IKEA, B&Q, Wayfair, Dunelm, PayPal purchases (when clearly retail), any online retail
- Healthcare: Boots, Superdrug, Specsavers, Vision Express, any pharmacy, optician, dentist, NHS charges, private GP, physio, counselling
- Card Repayment: outgoing payments TO a credit card — narratives containing "BARCLAYCARD", "AMEX", "AMERICAN EXPRESS", "HSBC CARD", "LLOYDS CARD", "NATWEST CARD", "CAPITAL ONE", "VANQUIS", "VIRGIN MONEY CARD", or any "PAYMENT TO [CARD NAME]"
- Income: any incoming credit on the Main Account — wages, BACS, freelance payments, client transfers, and any other credit that isn't clearly a shop refund. When in doubt about an incoming credit, use Income.
- Other Payments: ATM withdrawals, unclear bank transfers, cash, anything not matching above
- IMPORTANT: Transactions marked [INCOMING CREDIT] are money coming IN (refunds, cashback, credits). Do NOT assign them Memberships, Food, Travel, Rent, or other spend categories. Use Income (if employer/wages/freelance), Transfers (if from a person), or Other Payments.

Every transaction MUST get a category — no nulls. If genuinely unsure → Other Payments.
Respond ONLY with a valid JSON array of strings, one per transaction, same order as input.

Transactions:
${batch.map((t,i)=>`${i+1}. "${t.narrative}" £${Math.abs(t.amount).toFixed(2)}${t.isIncome?" [INCOMING CREDIT]":""}`).join("\n")}`;

  {
    const BATCH = 30;
    const batches = Array.from({length:Math.ceil(toClassify.length/BATCH)},(_,i)=>toClassify.slice(i*BATCH,(i+1)*BATCH));
    for (let bi=0; bi<batches.length; bi++) {
      const batch = batches[bi];
      onProgress({type:"progress", pct:10+Math.round(((bi+1)/batches.length)*70), batchNum:bi+1, totalBatches:batches.length});
      try {
        const text = await callClaude(MAIN_PROMPT(batch, spendCats));
        const match = text.match(/\[[\s\S]*\]/);
        if(!match) throw new Error("no json");
        const cats = JSON.parse(match[0]);
        batch.forEach((t,i)=>{
          const cat = cats[i];
          results.set(t.narrative+t.date+t.amount, allCats.includes(cat)?cat:merchantLookup(t.narrative)||ruleBasedCat(t.narrative,allCats));
        });
      } catch(e) {
        emitLimit(e);
        batch.forEach(t=>results.set(t.narrative+t.date+t.amount, merchantLookup(t.narrative)||ruleBasedCat(t.narrative,allCats)));
      }
    }

    // Auto-category detection: find repeated merchants stuck in Other Payments
    onProgress({type:"progress", pct:82, batchNum:batches.length, totalBatches:batches.length});
    const otherTxns = toClassify.filter(t=>results.get(t.narrative+t.date+t.amount)==="Other Payments");
    const groups = {};
    otherTxns.forEach(t=>{
      const key = normalizeMerchant(t.narrative);
      if(!key||key.length<3) return;
      if(!groups[key]) groups[key]=[];
      groups[key].push(t);
    });
    const clusters = Object.entries(groups).filter(([,txns])=>txns.length>=3);
    if(clusters.length>0) {
      try {
        const namingPrompt =
`For each cluster of UK bank transactions below, suggest a short friendly spending category name (2-3 words, title case, e.g. "Healthcare", "Online Shopping", "Pet Care", "ATM Withdrawals").

${clusters.map(([key,txns],i)=>`${i+1}. Key: "${key}" | ${txns.length} transactions | Examples: ${[...new Set(txns.map(t=>t.narrative))].slice(0,3).join(" / ")}`).join("\n")}

Respond ONLY with a JSON array of ${clusters.length} strings, one name per cluster.`;
        const nameText = await callClaude(namingPrompt, 300);
        const nameMatch = nameText.match(/\[[\s\S]*\]/);
        if(!nameMatch) throw new Error("no json");
        const names = JSON.parse(nameMatch[0]);
        const ALLOWED_AUTO = [
          {match:/shop|retail|cloth|fashion|market|superstore|store|purchase/i, name:"Shopping"},
          {match:/gym|fitness|sport|crossfit|pilates|yoga|leisure|active/i, name:"Gym"},
          {match:/medic|pharma|health|chemist|clinic|dental|optical|prescription/i, name:"Medication"},
        ];
        const newCatsList = [];
        clusters.forEach(([,txns],i)=>{
          const raw = (names[i]&&typeof names[i]==="string"&&names[i].trim()) || "";
          const allowed = ALLOWED_AUTO.find(a=>a.match.test(raw));
          const catName = allowed ? allowed.name : null;
          if(!catName) return;
          newCatsList.push({name:catName, count:txns.length, examples:[...new Set(txns.map(t=>t.narrative))].slice(0,2)});
          txns.forEach(t=>results.set(t.narrative+t.date+t.amount, catName));
        });
        if(newCatsList.length>0) onProgress({type:"new_categories", categories:newCatsList});
      } catch(e) { emitLimit(e); }
    }
  }

  // Monthly-once heuristic: if a narrative lands in Other Payments but appears
  // in 2+ distinct calendar months with at most 2 occurrences per month, it's
  // almost certainly a subscription → reclassify to Memberships.
  const monthlyOnceCandidates = new Map(); // normalised narrative → Set<"YYYY-M">
  withIncome.forEach(t=>{
    const assigned = t.category || results.get(t.narrative+t.date+t.amount) || "Other Payments";
    if(assigned!=="Other Payments") return;
    const key = t.narrative.toLowerCase().replace(/[^a-z0-9 ]/g," ").replace(/\s+/g," ").trim();
    if(key.length<4) return;
    const monthKey = `${t.date.getFullYear()}-${t.date.getMonth()}`;
    if(!monthlyOnceCandidates.has(key)) monthlyOnceCandidates.set(key, new Map());
    const mo = monthlyOnceCandidates.get(key);
    mo.set(monthKey, (mo.get(monthKey)||0)+1);
  });
  const monthlyMembershipKeys = new Set();
  monthlyOnceCandidates.forEach((monthMap, key)=>{
    const months = [...monthMap.keys()];
    const allMonthly = [...monthMap.values()].every(count=>count<=2);
    if(months.length>=3 && allMonthly) monthlyMembershipKeys.add(key);
  });

  onProgress({type:"done"});
  return withIncome.map(t=>{
    if (t.category!==null) return t;
    const rawCat = results.get(t.narrative+t.date+t.amount)||"Other Payments";
    // Salary is not a valid spend category — merge into Income
    const cat = rawCat==="Salary" ? "Income" : rawCat;
    // Income should never be classified as a spend category
    if(t.isIncome && !["Income","Transfers","Other Payments"].includes(cat)){
      return {...t, category:"Other Payments"};
    }
    if(cat==="Other Payments"){
      const key = t.narrative.toLowerCase().replace(/[^a-z0-9 ]/g," ").replace(/\s+/g," ").trim();
      // Don't promote income transactions to Memberships via the monthly heuristic
      if(!t.isIncome && monthlyMembershipKeys.has(key)) return {...t, category:"Memberships"};
    }
    return {...t, category:cat};
  });
}

// ─── Category Icons ───────────────────────────────────────────────────────────
function CatIcon({cat, size=18, color="#6366f1"}) {
  const s = {width:size, height:size, display:"block", flexShrink:0};
  const p = {stroke:color, strokeWidth:1.5, strokeLinecap:"round", strokeLinejoin:"round", fill:"none"};
  switch(cat) {
    case "Food": return <svg viewBox="0 0 20 20" style={s}><path {...p} d="M7 2v5c0 1.7 1.3 3 3 3s3-1.3 3-3V2"/><line {...p} x1="10" y1="10" x2="10" y2="18"/><path {...p} d="M6 2v3M10 2v3M14 2v3"/></svg>;
    case "Travel": return <svg viewBox="0 0 20 20" style={s}><path {...p} d="M2 14l4-9 4 4 3-5 5 10"/><circle {...p} cx="15" cy="5" r="1" fill={color}/></svg>;
    case "Rent": return <svg viewBox="0 0 20 20" style={s}><path {...p} d="M3 9.5L10 3l7 6.5V17a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z"/><path {...p} d="M8 18v-6h4v6"/></svg>;
    case "Memberships": return <svg viewBox="0 0 20 20" style={s}><rect {...p} x="2" y="5" width="16" height="11" rx="2"/><path {...p} d="M2 9h16"/><circle {...p} cx="6" cy="13" r="1" fill={color}/><path {...p} d="M10 13h4"/></svg>;
    case "Income": return <svg viewBox="0 0 20 20" style={s}><path {...p} d="M10 2v16M6 5.5C6 4.1 7.8 3 10 3s4 1.1 4 2.5S12.2 8 10 8s-4 1.1-4 2.5S7.8 13 10 13s4-1.1 4-2.5"/></svg>;
    case "Card Repayment": return <svg viewBox="0 0 20 20" style={s}><rect {...p} x="2" y="5" width="16" height="11" rx="2"/><path {...p} d="M2 9h16"/><path {...p} d="M14 13.5l2-1.5-2-1.5"/><path {...p} d="M16 12H9"/></svg>;
    case "Investments": return <svg viewBox="0 0 20 20" style={s}><polyline {...p} points="2,15 7,9 11,12 16,5"/><polyline {...p} points="13,5 16,5 16,8"/></svg>;
    case "Other Payments": return <svg viewBox="0 0 20 20" style={s}><circle {...p} cx="10" cy="10" r="8"/><path {...p} d="M10 6v4l3 2"/></svg>;
    default: return <svg viewBox="0 0 20 20" style={s}><rect {...p} x="3" y="3" width="14" height="14" rx="2"/><path {...p} d="M7 10h6M10 7v6"/></svg>;
  }
}

function InsightIcon({type, color}) {
  const s = {width:14, height:14, display:"block", flexShrink:0};
  const p = {stroke:color, strokeWidth:1.6, strokeLinecap:"round", strokeLinejoin:"round", fill:"none"};
  if(type==="chart") return <svg viewBox="0 0 20 20" style={s}><path {...p} d="M3 15l4-6 4 3 4-8"/><circle {...p} cx="15" cy="4" r="1" fill={color}/></svg>;
  if(type==="warn") return <svg viewBox="0 0 20 20" style={s}><path {...p} d="M10 3L2 17h16L10 3z"/><path {...p} d="M10 9v4M10 14.5v.5"/></svg>;
  if(type==="check") return <svg viewBox="0 0 20 20" style={s}><circle {...p} cx="10" cy="10" r="7"/><path {...p} d="M7 10l2 2 4-4"/></svg>;
  return <svg viewBox="0 0 20 20" style={s}><circle {...p} cx="10" cy="10" r="7"/><path {...p} d="M10 9v5M10 7v.5"/></svg>;
}


// ─── Illustrations ────────────────────────────────────────────────────────────
function IllustrationLayers() {
  return (
    <svg viewBox="0 0 240 150" fill="none" xmlns="http://www.w3.org/2000/svg" style={{width:"100%",display:"block"}}>
      <g opacity="0.35">
        <polygon points="120,120 178,90 120,60 62,90" fill="rgba(99,102,241,0.06)" stroke="rgba(255,255,255,0.12)" strokeWidth="0.8"/>
        <polygon points="178,90 178,106 120,136 120,120" fill="rgba(12,10,28,0.85)" stroke="rgba(255,255,255,0.07)" strokeWidth="0.8"/>
        <polygon points="62,90 62,106 120,136 120,120" fill="rgba(20,18,42,0.78)" stroke="rgba(255,255,255,0.07)" strokeWidth="0.8"/>
        <line x1="91" y1="104" x2="149" y2="76" stroke="rgba(255,255,255,0.06)" strokeWidth="0.5"/>
        <line x1="76" y1="97" x2="164" y2="83" stroke="rgba(255,255,255,0.06)" strokeWidth="0.5"/>
      </g>
      <g opacity="0.62">
        <polygon points="120,88 172,61 120,34 68,61" fill="rgba(99,102,241,0.09)" stroke="rgba(255,255,255,0.24)" strokeWidth="1"/>
        <polygon points="172,61 172,78 120,105 120,88" fill="rgba(12,10,28,0.88)" stroke="rgba(255,255,255,0.14)" strokeWidth="1"/>
        <polygon points="68,61 68,78 120,105 120,88" fill="rgba(20,18,42,0.78)" stroke="rgba(255,255,255,0.14)" strokeWidth="1"/>
        <line x1="94" y1="74" x2="146" y2="48" stroke="rgba(255,255,255,0.09)" strokeWidth="0.5"/>
        <line x1="81" y1="68" x2="159" y2="54" stroke="rgba(255,255,255,0.09)" strokeWidth="0.5"/>
      </g>
      <g opacity="1">
        <polygon points="120,54 164,32 120,10 76,32" fill="rgba(99,102,241,0.15)" stroke="rgba(255,255,255,0.52)" strokeWidth="1.3"/>
        <polygon points="164,32 164,48 120,70 120,54" fill="rgba(12,10,28,0.92)" stroke="rgba(255,255,255,0.32)" strokeWidth="1.3"/>
        <polygon points="76,32 76,48 120,70 120,54" fill="rgba(20,18,42,0.84)" stroke="rgba(255,255,255,0.32)" strokeWidth="1.3"/>
        <line x1="98" y1="44" x2="142" y2="21" stroke="rgba(255,255,255,0.16)" strokeWidth="0.7"/>
        <line x1="87" y1="38" x2="153" y2="26" stroke="rgba(255,255,255,0.13)" strokeWidth="0.6"/>
        <circle cx="120" cy="32" r="2.5" fill="rgba(99,102,241,1)" stroke="rgba(255,255,255,0.75)" strokeWidth="0.8"/>
      </g>
    </svg>
  );
}

function IllustrationDocumentStack() {
  return (
    <svg viewBox="0 0 180 140" fill="none" xmlns="http://www.w3.org/2000/svg" style={{width:"100%",display:"block"}}>
      <g opacity="0.45" transform="rotate(-7 90 70)">
        <rect x="44" y="15" width="72" height="96" rx="3" fill="rgba(12,10,28,0.82)" stroke="rgba(255,255,255,0.16)" strokeWidth="0.8"/>
        <line x1="56" y1="34" x2="104" y2="34" stroke="rgba(255,255,255,0.09)" strokeWidth="0.7"/>
        <line x1="56" y1="45" x2="104" y2="45" stroke="rgba(255,255,255,0.09)" strokeWidth="0.7"/>
        <line x1="56" y1="56" x2="88" y2="56" stroke="rgba(255,255,255,0.07)" strokeWidth="0.7"/>
      </g>
      <rect x="44" y="10" width="92" height="118" rx="4" fill="rgba(16,14,40,0.94)" stroke="rgba(255,255,255,0.48)" strokeWidth="1.2"/>
      <line x1="58" y1="32" x2="124" y2="32" stroke="rgba(255,255,255,0.22)" strokeWidth="0.8"/>
      <line x1="58" y1="43" x2="124" y2="43" stroke="rgba(255,255,255,0.22)" strokeWidth="0.8"/>
      <line x1="58" y1="54" x2="105" y2="54" stroke="rgba(255,255,255,0.16)" strokeWidth="0.8"/>
      <line x1="58" y1="65" x2="124" y2="65" stroke="rgba(255,255,255,0.13)" strokeWidth="0.8"/>
      <line x1="58" y1="76" x2="115" y2="76" stroke="rgba(255,255,255,0.11)" strokeWidth="0.8"/>
      <line x1="90" y1="110" x2="90" y2="98" stroke="rgba(99,102,241,0.95)" strokeWidth="1.8" strokeLinecap="round"/>
      <polyline points="84,104 90,98 96,104" fill="none" stroke="rgba(99,102,241,0.95)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
      <line x1="78" y1="114" x2="102" y2="114" stroke="rgba(99,102,241,0.5)" strokeWidth="1.2" strokeLinecap="round"/>
    </svg>
  );
}

function IllustrationSortBlocks() {
  return (
    <svg viewBox="0 0 200 160" fill="none" xmlns="http://www.w3.org/2000/svg" style={{width:"100%",display:"block"}}>
      <g opacity="0.5">
        <polygon points="62,86 96,68 62,50 28,68" fill="rgba(99,102,241,0.08)" stroke="rgba(255,255,255,0.2)" strokeWidth="0.9"/>
        <polygon points="96,68 96,98 62,116 62,86" fill="rgba(12,10,28,0.88)" stroke="rgba(255,255,255,0.12)" strokeWidth="0.9"/>
        <polygon points="28,68 28,98 62,116 62,86" fill="rgba(20,18,42,0.78)" stroke="rgba(255,255,255,0.12)" strokeWidth="0.9"/>
      </g>
      <g opacity="0.88">
        <polygon points="138,68 166,53 138,38 110,53" fill="rgba(99,102,241,0.13)" stroke="rgba(255,255,255,0.44)" strokeWidth="1.2"/>
        <polygon points="166,53 166,84 138,99 138,68" fill="rgba(12,10,28,0.9)" stroke="rgba(255,255,255,0.25)" strokeWidth="1.2"/>
        <polygon points="110,53 110,84 138,99 138,68" fill="rgba(20,18,42,0.82)" stroke="rgba(255,255,255,0.25)" strokeWidth="1.2"/>
      </g>
      <g opacity="0.45">
        <polygon points="95,120 130,102 95,84 60,102" fill="rgba(99,102,241,0.07)" stroke="rgba(255,255,255,0.15)" strokeWidth="0.8"/>
        <polygon points="130,102 130,128 95,146 95,120" fill="rgba(12,10,28,0.85)" stroke="rgba(255,255,255,0.09)" strokeWidth="0.8"/>
        <polygon points="60,102 60,128 95,146 95,120" fill="rgba(20,18,42,0.75)" stroke="rgba(255,255,255,0.09)" strokeWidth="0.8"/>
      </g>
      <g opacity="0.7">
        <polygon points="162,106 182,95 162,84 142,95" fill="rgba(99,102,241,0.1)" stroke="rgba(255,255,255,0.3)" strokeWidth="0.9"/>
        <polygon points="182,95 182,112 162,123 162,106" fill="rgba(12,10,28,0.88)" stroke="rgba(255,255,255,0.18)" strokeWidth="0.9"/>
        <polygon points="142,95 142,112 162,123 162,106" fill="rgba(20,18,42,0.78)" stroke="rgba(255,255,255,0.18)" strokeWidth="0.9"/>
      </g>
    </svg>
  );
}

function IllustrationBarchart() {
  return (
    <svg viewBox="0 0 240 140" fill="none" xmlns="http://www.w3.org/2000/svg" style={{width:"100%",display:"block"}}>
      <g opacity="0.6">
        <polygon points="50,104 74,91 50,78 26,91" fill="rgba(16,185,129,0.1)" stroke="rgba(16,185,129,0.6)" strokeWidth="1"/>
        <polygon points="74,91 74,117 50,130 50,104" fill="rgba(12,10,28,0.88)" stroke="rgba(16,185,129,0.35)" strokeWidth="1"/>
        <polygon points="26,91 26,117 50,130 50,104" fill="rgba(18,16,40,0.78)" stroke="rgba(16,185,129,0.3)" strokeWidth="1"/>
      </g>
      <g opacity="0.72">
        <polygon points="94,82 118,69 94,56 70,69" fill="rgba(16,185,129,0.1)" stroke="rgba(16,185,129,0.65)" strokeWidth="1"/>
        <polygon points="118,69 118,117 94,130 94,104" fill="rgba(12,10,28,0.88)" stroke="rgba(16,185,129,0.38)" strokeWidth="1"/>
        <polygon points="70,69 70,117 94,130 94,104" fill="rgba(18,16,40,0.78)" stroke="rgba(16,185,129,0.33)" strokeWidth="1"/>
      </g>
      <g opacity="0.92">
        <polygon points="138,52 162,39 138,26 114,39" fill="rgba(99,102,241,0.14)" stroke="rgba(99,102,241,0.78)" strokeWidth="1.2"/>
        <polygon points="162,39 162,117 138,130 138,104" fill="rgba(12,10,28,0.9)" stroke="rgba(99,102,241,0.44)" strokeWidth="1.2"/>
        <polygon points="114,39 114,117 138,130 138,104" fill="rgba(18,16,40,0.82)" stroke="rgba(99,102,241,0.4)" strokeWidth="1.2"/>
      </g>
      <g opacity="0.78">
        <polygon points="182,66 206,53 182,40 158,53" fill="rgba(99,102,241,0.12)" stroke="rgba(99,102,241,0.65)" strokeWidth="1"/>
        <polygon points="206,53 206,117 182,130 182,104" fill="rgba(12,10,28,0.88)" stroke="rgba(99,102,241,0.38)" strokeWidth="1"/>
        <polygon points="158,53 158,117 182,130 182,104" fill="rgba(18,16,40,0.8)" stroke="rgba(99,102,241,0.34)" strokeWidth="1"/>
      </g>
    </svg>
  );
}

function IllustrationLineGraph({balances=[], accent="#6366f1", accent2="#8b5cf6"}){
  const W=560, H=120, pad=16;
  const vals = balances.filter(v=>v!=null);
  if(vals.length<2) vals.push(0,0);
  const mn=Math.min(...vals), mx=Math.max(...vals);
  const range=mx-mn||1;
  const pts=vals.map((v,i)=>{
    const x=pad+(i/(vals.length-1))*(W-pad*2);
    const y=H-pad-(((v-mn)/range)*(H-pad*2));
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  const polyline=pts.join(" ");
  // Area fill path
  const first=pts[0], last=pts[pts.length-1];
  const areaD=`M${first} L${pts.slice(1).join(" L")} L${last.split(",")[0]},${H} L${pad},${H} Z`;
  const id=`lg${accent.replace(/[^a-z0-9]/gi,"")}`;
  return(
    <svg viewBox={`0 0 ${W} ${H}`} fill="none" xmlns="http://www.w3.org/2000/svg" style={{width:"100%",display:"block",overflow:"visible"}}>
      <defs>
        <linearGradient id={`${id}line`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor={accent} stopOpacity="0.9"/>
          <stop offset="100%" stopColor={accent2} stopOpacity="0.9"/>
        </linearGradient>
        <linearGradient id={`${id}area`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={accent} stopOpacity="0.18"/>
          <stop offset="100%" stopColor={accent} stopOpacity="0"/>
        </linearGradient>
        <filter id={`${id}glow`}>
          <feGaussianBlur stdDeviation="2.5" result="blur"/>
          <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>
      {/* Subtle grid lines */}
      {[0.25,0.5,0.75].map(t=>(
        <line key={t} x1={pad} y1={(H-pad-(t*(H-pad*2))).toFixed(1)} x2={W-pad} y2={(H-pad-(t*(H-pad*2))).toFixed(1)}
          stroke="rgba(99,102,241,0.1)" strokeWidth="1" strokeDasharray="4 6"/>
      ))}
      <path d={areaD} fill={`url(#${id}area)`}/>
      <polyline points={polyline} stroke={`url(#${id}line)`} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" filter={`url(#${id}glow)`} style={{transition:"all 0.9s cubic-bezier(0.4,0,0.2,1)"}}/>
      {/* Dot at latest value */}
      {pts.length>0&&(()=>{const [lx,ly]=last.split(",");return(<><circle cx={lx} cy={ly} r="4" fill={accent2} opacity="0.9"/><circle cx={lx} cy={ly} r="8" fill={accent2} opacity="0.15"/></>);})()}
    </svg>
  );
}

// ─── Session persistence ──────────────────────────────────────────────────────
const SESSION_KEY = "abound_session_v1";

function saveSession(transactions, categories) {
  try {
    const dates = transactions.map(t => t.date instanceof Date ? t.date : new Date(t.date)).filter(d => !isNaN(d.getTime()));
    const lastTxnDate = dates.length ? new Date(Math.max(...dates.map(d => d.getTime()))).toISOString() : null;
    const payload = {
      savedAt: new Date().toISOString(),
      txnCount: transactions.length,
      lastTxnDate,
      categories,
      transactions: transactions.map(t => ({
        ...t,
        date: t.date instanceof Date ? t.date.toISOString() : t.date,
      })),
    };
    localStorage.setItem(SESSION_KEY, JSON.stringify(payload));
  } catch(e) { console.warn("Session save failed", e); }
}

function loadSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const p = JSON.parse(raw);
    if (!p.transactions || !p.categories) return null;
    return {
      ...p,
      transactions: p.transactions.map(t => ({
        ...t,
        date: new Date(t.date),
      })),
    };
  } catch(e) { return null; }
}

function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}

// ─── Forecast persistence ─────────────────────────────────────────────────────
const FORECAST_KEY = "abound_last_forecast";
const FORECAST_ACCURACY_KEY = "abound_prev_accuracy";

function saveLastForecast(data) {
  try { localStorage.setItem(FORECAST_KEY, JSON.stringify(data)); } catch {}
}
function loadLastForecast() {
  try { const r = localStorage.getItem(FORECAST_KEY); return r ? JSON.parse(r) : null; } catch { return null; }
}

function computeAccuracy(saved, transactions) {
  if (!saved?.weekStartDates?.length || !saved?.forecastByCategory) return null;
  const mostRecentDate = transactions.reduce((max, t) => t.date > max ? t.date : max, new Date(0));
  if (mostRecentDate.getTime() === 0) return null;
  const lastMonday = getWeekMonday(mostRecentDate);
  const actualWeekKeys = new Set(Array.from({length: 6}, (_, i) => {
    const mon = new Date(lastMonday); mon.setDate(mon.getDate() - (5 - i) * 7);
    return mon.toISOString().slice(0, 10);
  }));
  const overlapEntries = saved.weekStartDates.map((wk, i) => ({wk, i})).filter(({wk}) => actualWeekKeys.has(wk));
  if (overlapEntries.length < 2) return null;
  // Net spend per category per week (replicate weeklyByAccountCat sign convention)
  const weeklyByCat = {};
  transactions.forEach(t => {
    if (t.category === "Income" || t.category === "Card Repayment") return;
    const key = getWeekMonday(t.date).toISOString().slice(0, 10);
    if (!weeklyByCat[key]) weeklyByCat[key] = {};
    weeklyByCat[key][t.category] = (weeklyByCat[key][t.category] || 0) + (-t.amount);
  });
  let totalForecast = 0, totalError = 0;
  const catRows = [];
  Object.entries(saved.forecastByCategory).forEach(([cat, fcstVals]) => {
    let catForecast = 0, catActual = 0;
    overlapEntries.forEach(({wk, i}) => {
      catForecast += fcstVals[i] || 0;
      catActual += Math.abs(weeklyByCat[wk]?.[cat] || 0);
    });
    if (catForecast < 1 && catActual < 1) return;
    const diff = Math.round(catActual - catForecast);
    const accuracy = catForecast > 0 ? Math.max(0, Math.round((1 - Math.abs(diff) / catForecast) * 100)) : null;
    catRows.push({cat, forecast: Math.round(catForecast), actual: Math.round(catActual), diff, accuracy});
    if (catForecast > 0) { totalForecast += catForecast; totalError += Math.abs(diff); }
  });
  catRows.sort((a, b) => Math.abs(b.diff) - Math.abs(a.diff));
  const overallAccuracy = totalForecast > 0 ? Math.max(0, Math.round((1 - totalError / totalForecast) * 100)) : null;
  return {overallAccuracy, catRows, overlapWeeks: overlapEntries.length, savedAt: saved.savedAt};
}

// ─── SCREEN 0: Hero ───────────────────────────────────────────────────────────
function HeroScreen({onEnter, onResume}) {
  const [phase, setPhase] = useState(0);
  const [leaving, setLeaving] = useState(false);
  const [session, setSession] = useState(null);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [adminCode, setAdminCode] = useState("");
  const [adminError, setAdminError] = useState(false);
  const tapRef = useRef({count:0,timer:null});
  useEffect(()=>{
    const t1=setTimeout(()=>setPhase(1),500);
    const t2=setTimeout(()=>setPhase(2),1200);
    setSession(loadSession());
    return ()=>{clearTimeout(t1);clearTimeout(t2);};
  },[]);
  function handleEnter(){setLeaving(true);setTimeout(onEnter,500);}
  function handleResume(){setLeaving(true);setTimeout(onResume,500);}
  function handleVersionTap(){
    tapRef.current.count++;
    clearTimeout(tapRef.current.timer);
    if(tapRef.current.count>=7){
      tapRef.current.count=0;
      setAdminCode("");setAdminError(false);setShowAdminModal(true);
    } else {
      tapRef.current.timer=setTimeout(()=>{tapRef.current.count=0;},2000);
    }
  }
  function submitAdminCode(){
    if(adminCode==="ab7888"){setPremium();window.location.reload();}
    else{setAdminError(true);setAdminCode("");}
  }
  const features=[
    {dot:"#10b981",text:"Your statement never leaves your device — we never see your data."},
    {dot:"#6366f1",text:"Upload your statement. See 6 weeks ahead."},
    {dot:"#f59e0b",text:"Built for people who want to actually understand their money."},
  ];
  return (
    <div style={{minHeight:"100vh",background:"#08070f",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"40px 24px",position:"relative",overflow:"hidden",opacity:leaving?0:1,transition:"opacity 0.5s ease"}}>
      <style>{GLOBAL_CSS}</style>
      {/* Background radial + grid */}
      <div style={{position:"absolute",inset:0,background:"radial-gradient(ellipse at 50% 0%, rgba(99,102,241,0.12) 0%, transparent 60%)",pointerEvents:"none"}}/>
      <div style={{position:"absolute",inset:0,backgroundImage:"linear-gradient(rgba(99,102,241,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(99,102,241,0.03) 1px,transparent 1px)",backgroundSize:"48px 48px",pointerEvents:"none"}}/>
      <div style={{position:"relative",zIndex:1,maxWidth:540,width:"100%",textAlign:"center"}}>
        <div style={{width:110,margin:"0 auto 14px",opacity:0.72,animation:"fadeUp 0.7s ease both"}}>
          <IllustrationDocumentStack/>
        </div>
        <div style={{marginBottom:36,display:"flex",justifyContent:"center"}}>
          <div style={{padding:"10px 20px",borderRadius:16,background:"rgba(8,7,15,0.92)",border:"1px solid rgba(99,102,241,0.15)",boxShadow:"0 0 40px rgba(99,102,241,0.08)",animation:"logoBgFade 0.3s ease both"}}>
            {/* overflow:hidden + width animation = left-to-right wipe */}
            <div style={{overflow:"hidden",height:52,animation:"logoWipe 1s cubic-bezier(0.4,0,0.2,1) 0.2s both"}}>
              <img src={logo} alt="Abound" style={{height:52,display:"block",minWidth:"100%",mixBlendMode:"screen"}}/>
            </div>
          </div>
        </div>
        <div style={{width:180,margin:"0 auto 28px",opacity:0.88,animation:"fadeUp 0.9s cubic-bezier(0.16,1,0.3,1) 0.05s both"}}>
          <IllustrationLayers/>
        </div>
        <h1 style={{fontSize:"clamp(36px,6vw,56px)",fontWeight:800,lineHeight:1.1,color:"#fff",marginBottom:24,letterSpacing:"-0.03em",animation:"heroText 0.9s cubic-bezier(0.16,1,0.3,1) 0.1s both"}}>
          {"Your money,"}<br/>
          <span style={{background:"linear-gradient(135deg,#6366f1,#8b5cf6,#06b6d4)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",backgroundClip:"text"}}>{"finally clear."}</span>
        </h1>
        <div style={{display:"flex",flexDirection:"column",gap:12,alignItems:"center",marginBottom:48}}>
          {features.map((f,i)=>(
            <div key={i} style={{display:"flex",alignItems:"center",gap:10,opacity:phase>=1?1:0,transform:phase>=1?"translateY(0)":"translateY(8px)",transition:`all 0.5s cubic-bezier(0.16,1,0.3,1) ${i*150}ms`}}>
              <div style={{width:6,height:6,borderRadius:"50%",background:f.dot,flexShrink:0,boxShadow:`0 0 8px ${f.dot}`}}/>
              <span style={{fontSize:15,color:"#a1a1aa",fontWeight:500}}>{f.text}</span>
            </div>
          ))}
        </div>
        <div style={{opacity:phase>=2?1:0,transform:phase>=2?"translateY(0)":"translateY(8px)",transition:"all 0.5s cubic-bezier(0.16,1,0.3,1) 0.2s"}}>
          {session&&(
            <div style={{marginBottom:16,animation:"fadeUp 0.5s ease both"}}>
              <button onClick={handleResume}
                style={{width:"100%",padding:"14px 24px",background:"linear-gradient(135deg,#6366f1,#4f46e5)",color:"#fff",border:"none",borderRadius:12,fontSize:15,fontWeight:700,cursor:"pointer",letterSpacing:"-0.01em",boxShadow:"0 0 0 1px rgba(99,102,241,0.4),0 8px 32px rgba(99,102,241,0.3)",transition:"all 0.2s",marginBottom:0}}
                onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-2px)";}}
                onMouseLeave={e=>{e.currentTarget.style.transform="";}}>
                Resume last session →
              </button>
              <div style={{marginTop:8,fontSize:11,color:"#3f3f46",display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
                <span>{session.txnCount} transactions · saved {new Date(session.savedAt).toLocaleDateString("en-GB",{day:"numeric",month:"short"})}</span>
                <button onClick={e=>{e.stopPropagation();clearSession();setSession(null);}} style={{fontSize:10,color:"#374151",border:"1px solid #1f1d35",borderRadius:4,padding:"1px 6px",background:"none",cursor:"pointer"}}>clear</button>
              </div>
            </div>
          )}
          <button onClick={handleEnter}
            style={{padding:"14px 40px",background:session?"transparent":"linear-gradient(135deg,#6366f1,#4f46e5)",color:session?"#52525b":"#fff",border:session?"1px solid #1f1d35":"none",borderRadius:12,fontSize:session?13:15,fontWeight:700,cursor:"pointer",letterSpacing:"-0.01em",boxShadow:session?"none":"0 0 0 1px rgba(99,102,241,0.4),0 8px 32px rgba(99,102,241,0.3)",transition:"all 0.2s"}}
            onMouseEnter={e=>{if(!session){e.currentTarget.style.transform="translateY(-2px)";}}}
            onMouseLeave={e=>{e.currentTarget.style.transform="";}}>
            {session?"Start fresh instead":"Get started →"}
          </button>
          <div style={{marginTop:14,fontSize:11,color:"#3f3f46",letterSpacing:"0.08em"}}>FREE · NO ACCOUNT REQUIRED</div>
          <div onClick={handleVersionTap} style={{marginTop:8,fontSize:10,color:"#27272a",letterSpacing:"0.06em",userSelect:"none"}}>v{APP_VERSION}</div>
        </div>
      </div>
      {showAdminModal&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.7)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:9999,padding:24}} onClick={()=>setShowAdminModal(false)}>
          <div style={{background:"#111827",border:"1px solid #1f2937",borderRadius:16,padding:28,width:"100%",maxWidth:300,textAlign:"center"}} onClick={e=>e.stopPropagation()}>
            <div style={{fontSize:13,fontWeight:700,color:"#9ca3af",marginBottom:16,letterSpacing:"0.04em"}}>ADMIN ACCESS</div>
            <input
              autoFocus
              type="password"
              value={adminCode}
              onChange={e=>{setAdminCode(e.target.value);setAdminError(false);}}
              onKeyDown={e=>e.key==="Enter"&&submitAdminCode()}
              placeholder="Enter code"
              style={{width:"100%",boxSizing:"border-box",padding:"10px 14px",borderRadius:8,border:`1px solid ${adminError?"#ef4444":"#374151"}`,background:"#0d1117",color:"#f9fafb",fontSize:15,outline:"none",marginBottom:adminError?6:16,textAlign:"center",letterSpacing:"0.1em"}}
            />
            {adminError&&<div style={{fontSize:11,color:"#ef4444",marginBottom:12}}>Incorrect code</div>}
            <div style={{display:"flex",gap:10}}>
              <button onClick={()=>setShowAdminModal(false)} style={{flex:1,padding:"10px",borderRadius:8,border:"1px solid #374151",background:"transparent",color:"#6b7280",cursor:"pointer",fontSize:13,fontWeight:600}}>Cancel</button>
              <button onClick={submitAdminCode} style={{flex:1,padding:"10px",borderRadius:8,border:"none",background:"#6366f1",color:"#fff",cursor:"pointer",fontSize:13,fontWeight:700}}>Unlock</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Feedback Screen ──────────────────────────────────────────────────────────
function FeedbackScreen({txnCount, onDone}) {
  const [answers, setAnswers] = useState({});
  const [text, setText] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const QUESTIONS = [
    {id:"overall",   label:"How satisfied are you with Abound overall?",    options:["Very satisfied","Satisfied","Neutral","Dissatisfied","Very dissatisfied"]},
    {id:"accuracy",  label:"How accurate was the AI categorisation?",         options:["Very accurate","Mostly accurate","Somewhat accurate","Mostly inaccurate","Very inaccurate"]},
    {id:"ease",      label:"How easy was the app to use?",                    options:["Very easy","Easy","Neutral","Difficult","Very difficult"]},
    {id:"return",    label:"Would you use Abound again?",                     options:["Definitely","Probably","Maybe","Probably not","Definitely not"]},
    {id:"usecase",   label:"What best describes your use case?",              options:["Personal budgeting","Planning a big purchase","Tracking monthly spend","Reviewing past spending","Professional / business use"]},
  ];
  const [userName, setUserName] = useState("");
  const [improvements, setImprovements] = useState("");
  const allAnswered = QUESTIONS.every(q=>answers[q.id]);
  async function handleSubmit() {
    setSubmitting(true);
    try {
      await fetch(`https://formsubmit.co/ajax/${FEEDBACK_EMAIL}`, {
        method:"POST",
        headers:{"Content-Type":"application/json","Accept":"application/json"},
        body:JSON.stringify({...answers, name:userName||"Anonymous", improvements, feedback:text, txnCount, submittedAt:new Date().toISOString(), _subject:"Abound feedback"}),
      });
    } catch(e){console.warn("Feedback failed",e);}
    setSubmitted(true);
    setSubmitting(false);
    setTimeout(onDone, 2200);
  }
  if(submitted) return(
    <div style={{minHeight:"100vh",background:"#08070f",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center"}}>
      <style>{GLOBAL_CSS}</style>
      <div style={{textAlign:"center",animation:"fadeUp 0.6s ease both"}}>
        <div style={{fontSize:52,marginBottom:16}}>🙏</div>
        <div style={{fontSize:20,fontWeight:800,color:"#fff",marginBottom:8}}>Thanks for your feedback!</div>
        <div style={{fontSize:14,color:"#52525b"}}>Heading back now...</div>
      </div>
    </div>
  );
  return(
    <div style={{minHeight:"100vh",background:"#08070f",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"flex-start",padding:"40px 24px 80px",overflowY:"auto",position:"relative"}}>
      <style>{GLOBAL_CSS}</style>
      <div style={{position:"fixed",inset:0,background:"radial-gradient(ellipse at 50% 0%,rgba(99,102,241,0.1) 0%,transparent 55%)",pointerEvents:"none"}}/>
      <div style={{width:"100%",maxWidth:520,position:"relative",zIndex:1,animation:"fadeUp 0.5s ease both"}}>
        <div style={{display:"flex",alignItems:"center",gap:14,marginBottom:32}}>
          <img src={logo} alt="Abound" style={{height:30,opacity:0.95,mixBlendMode:"screen"}}/>
          <div style={{width:1,height:28,background:"#1f1d35"}}/>
          <div>
            <div style={{fontSize:18,fontWeight:800,color:"#fff",letterSpacing:"-0.02em"}}>How did we do?</div>
            <div style={{fontSize:12,color:"#52525b",marginTop:2}}>30 seconds · helps us improve</div>
          </div>
        </div>
        {QUESTIONS.map((q,qi)=>(
          <div key={q.id} style={{marginBottom:24,animation:`fadeUp 0.5s ease ${qi*60}ms both`}}>
            <div style={{fontSize:13,fontWeight:700,color:"#e0e7ff",marginBottom:10}}>{q.label}</div>
            <div style={{display:"flex",flexDirection:"column",gap:6}}>
              {q.options.map(opt=>{
                const sel=answers[q.id]===opt;
                return(
                  <button key={opt} onClick={()=>setAnswers(a=>({...a,[q.id]:opt}))}
                    style={{padding:"11px 16px",background:sel?"rgba(99,102,241,0.15)":"rgba(255,255,255,0.03)",border:`1.5px solid ${sel?"#6366f1":"#1f1d35"}`,borderRadius:10,color:sel?"#a5b4fc":"#6b7280",fontSize:13,fontWeight:sel?700:400,cursor:"pointer",textAlign:"left",transition:"all 0.15s",display:"flex",alignItems:"center",gap:10}}>
                    <span style={{width:16,height:16,borderRadius:"50%",border:`2px solid ${sel?"#6366f1":"#374151"}`,background:sel?"#6366f1":"transparent",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center"}}>
                      {sel&&<span style={{width:6,height:6,borderRadius:"50%",background:"#fff",display:"block"}}/>}
                    </span>
                    {opt}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
       {/* Name */}
        <div style={{marginBottom:24}}>
          <div style={{fontSize:13,fontWeight:700,color:"#e0e7ff",marginBottom:4}}>Your name <span style={{fontSize:11,fontWeight:400,color:"#52525b"}}>(optional)</span></div>
          <input value={userName} onChange={e=>setUserName(e.target.value)}
            placeholder="e.g. Sarah"
            style={{width:"100%",padding:"11px 14px",background:"rgba(255,255,255,0.03)",border:"1px solid #1f1d35",borderRadius:10,color:"#e0e7ff",fontSize:16,outline:"none",fontFamily:"inherit"}}
            onFocus={e=>{e.target.style.borderColor="#6366f1";}}
            onBlur={e=>{e.target.style.borderColor="#1f1d35";}}/>
        </div>

        {/* What could be improved */}
        <div style={{marginBottom:24}}>
          <div style={{fontSize:13,fontWeight:700,color:"#e0e7ff",marginBottom:4}}>What could be improved?</div>
          <textarea value={improvements} onChange={e=>setImprovements(e.target.value)}
            placeholder="Any bugs, confusing parts, or features you wished existed..."
            rows={3}
            style={{width:"100%",padding:"12px 14px",background:"rgba(255,255,255,0.03)",border:"1px solid #1f1d35",borderRadius:10,color:"#e0e7ff",fontSize:16,resize:"vertical",outline:"none",fontFamily:"inherit",lineHeight:1.6}}
            onFocus={e=>{e.target.style.borderColor="#6366f1";}}
            onBlur={e=>{e.target.style.borderColor="#1f1d35";}}/>
        </div>

        {/* Anything else */}
        <div style={{marginBottom:24}}>
          <div style={{fontSize:13,fontWeight:700,color:"#e0e7ff",marginBottom:4}}>Anything else you'd like to share?</div>
          <textarea value={text} onChange={e=>setText(e.target.value)}
            placeholder="What worked well, what you loved, what you'd like to see next..."
            rows={3}
            style={{width:"100%",padding:"12px 14px",background:"rgba(255,255,255,0.03)",border:"1px solid #1f1d35",borderRadius:10,color:"#e0e7ff",fontSize:16,resize:"vertical",outline:"none",fontFamily:"inherit",lineHeight:1.6}}
            onFocus={e=>{e.target.style.borderColor="#6366f1";}}
            onBlur={e=>{e.target.style.borderColor="#1f1d35";}}/>
        </div>
        <button onClick={handleSubmit} disabled={!allAnswered||submitting}
          style={{width:"100%",padding:"14px",background:allAnswered?"linear-gradient(135deg,#6366f1,#4f46e5)":"#151322",color:allAnswered?"#fff":"#3f3f46",border:"none",borderRadius:12,fontSize:15,fontWeight:700,cursor:allAnswered?"pointer":"not-allowed",boxShadow:allAnswered?"0 0 0 1px rgba(99,102,241,0.4),0 8px 24px rgba(99,102,241,0.25)":"none",transition:"all 0.2s",marginBottom:12}}>
          {submitting?"Sending...":"Submit feedback →"}
        </button>
        <button onClick={onDone} style={{width:"100%",padding:"10px",background:"none",border:"none",color:"#374151",fontSize:12,cursor:"pointer"}}>
          Skip
        </button>
      </div>
    </div>
  );
}

// ─── Session Complete ─────────────────────────────────────────────────────────
function SessionCompleteScreen({txnCount, onRestart}) {
  const [visible, setVisible] = useState(false);
  useEffect(()=>{
    setVisible(true);
    const t = setTimeout(onRestart, 3800);
    return ()=>clearTimeout(t);
  },[]);
  return (
    <div style={{minHeight:"100vh",background:"#08070f",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center"}}>
      <style>{GLOBAL_CSS}</style>
      <div style={{textAlign:"center",opacity:visible?1:0,transform:visible?"translateY(0)":"translateY(20px)",transition:"all 0.8s cubic-bezier(0.16,1,0.3,1)"}}>
        <div style={{width:160,margin:"0 auto 36px",opacity:0.65}}>
          <IllustrationBarchart/>
        </div>
        <div style={{fontSize:11,letterSpacing:"0.15em",color:"#3f3f46",marginBottom:32,fontWeight:600,textTransform:"uppercase"}}>Session complete</div>
        <div style={{fontSize:15,color:"#a1a1aa",marginBottom:8,fontVariantNumeric:"tabular-nums"}}>{txnCount} transactions analysed</div>
        <div style={{fontSize:15,color:"#a1a1aa",marginBottom:8}}>6 weeks of history mapped</div>
        <div style={{fontSize:15,color:"#a1a1aa",marginBottom:48}}>12 weeks forecast ahead</div>
        <div style={{fontSize:13,color:"#3f3f46"}}>See you next time.</div>
      </div>
    </div>
  );
}

// ─── Forecast Accuracy Screen ─────────────────────────────────────────────────
function ForecastAccuracyScreen({savedForecast, transactions, categories, onContinue, precomputed=null}) {
  const isMobile = useIsMobile();
  const currency = getCurrencySymbol();
  const accuracy = useMemo(
    () => precomputed || (savedForecast && transactions ? computeAccuracy(savedForecast, transactions) : null),
    [] // eslint-disable-line react-hooks/exhaustive-deps
  );
  const [aiInsight, setAiInsight] = useState(null);
  const [insightLoading, setInsightLoading] = useState(false);

  useEffect(() => {
    if (precomputed || !accuracy?.catRows?.length) return;
    const top = accuracy.catRows[0];
    if (!top || Math.abs(top.diff) < 5) return;
    const dir = top.diff > 0 ? "more" : "less";
    const prompt = `A cash flow forecast predicted ${top.cat} spending of ${currency}${top.forecast} but actual was ${currency}${top.actual} — ${currency}${Math.abs(top.diff)} ${dir} than forecast. In one friendly sentence under 20 words (no jargon), what commonly causes this kind of miss?`;
    setInsightLoading(true);
    callClaude(prompt, 80, 8000).then(t => setAiInsight(t)).catch(() => {}).finally(() => setInsightLoading(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (!accuracy) { onContinue(); return null; }

  const score = accuracy.overallAccuracy;
  const scoreColor = score === null ? "#6b7280" : score >= 80 ? "#10b981" : score >= 60 ? "#f59e0b" : "#ef4444";
  const savedDate = accuracy.savedAt
    ? new Date(accuracy.savedAt).toLocaleDateString("en-GB", {day:"numeric", month:"short"})
    : "last session";
  const r = 34, circ = 2 * Math.PI * r;

  return (
    <div style={{position:"fixed",inset:0,background:"#08070f",zIndex:9000,overflowY:"auto",fontFamily:"'Inter',system-ui,sans-serif"}}>
      <style>{GLOBAL_CSS}</style>
      <div style={{position:"fixed",inset:0,background:"radial-gradient(ellipse at 50% 0%,rgba(99,102,241,0.08) 0%,transparent 60%)",pointerEvents:"none"}}/>
      <div style={{maxWidth:680,margin:"0 auto",padding:isMobile?"20px 16px 100px":"48px 24px 80px",position:"relative",zIndex:1}}>
        <img src={logo} alt="Abound" style={{height:30,marginBottom:32,opacity:0.9,mixBlendMode:"screen"}}/>

        {/* Header */}
        <div style={{marginBottom:28,animation:"fadeUp 0.5s ease both"}}>
          <h1 style={{fontSize:isMobile?22:26,fontWeight:800,color:"#fff",letterSpacing:"-0.03em",margin:"0 0 8px"}}>
            How accurate was your last forecast?
          </h1>
          <p style={{fontSize:13,color:"#52525b",margin:0}}>
            Based on your statement from {savedDate} · {accuracy.overlapWeeks} week{accuracy.overlapWeeks!==1?"s":""} of data compared
          </p>
        </div>

        {/* Accuracy ring + score */}
        <div style={{display:"flex",alignItems:"center",gap:20,marginBottom:28,padding:"20px",background:"rgba(255,255,255,0.02)",border:"1px solid #1f1d35",borderRadius:14,animation:"fadeUp 0.5s ease 0.05s both"}}>
          <div style={{position:"relative",width:80,height:80,flexShrink:0}}>
            <svg width="80" height="80" viewBox="0 0 80 80" style={{transform:"rotate(-90deg)"}}>
              <circle cx="40" cy="40" r={r} fill="none" stroke="#1f1d35" strokeWidth="6"/>
              <circle cx="40" cy="40" r={r} fill="none" stroke={scoreColor} strokeWidth="6"
                strokeDasharray={circ}
                strokeDashoffset={circ * (1 - (score || 0) / 100)}
                strokeLinecap="round"
                style={{transition:"stroke-dashoffset 1.2s cubic-bezier(0.16,1,0.3,1) 0.3s"}}
              />
            </svg>
            <div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:17,fontWeight:800,color:scoreColor,fontVariantNumeric:"tabular-nums"}}>
              {score !== null ? `${score}%` : "—"}
            </div>
          </div>
          <div>
            <div style={{fontSize:11,fontWeight:700,color:"#52525b",letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:4}}>Forecast accuracy</div>
            <div style={{fontSize:14,color:"#a1a1aa",lineHeight:1.5}}>
              {score === null ? "Not enough data to score accurately."
                : score >= 80 ? "Your forecast was highly accurate."
                : score >= 60 ? "A few categories drifted from the forecast."
                : "Your spending differed significantly from the forecast."}
            </div>
          </div>
        </div>

        {/* Category breakdown */}
        {accuracy.catRows.length > 0 && (
          <div style={{marginBottom:24,animation:"fadeUp 0.5s ease 0.1s both"}}>
            <div style={{fontSize:11,fontWeight:700,color:"#52525b",letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:10}}>By category</div>
            {isMobile ? (
              <div style={{display:"flex",flexDirection:"column",gap:6}}>
                {accuracy.catRows.map(row => {
                  const ac = row.accuracy===null?"#52525b":row.accuracy>=80?"#10b981":row.accuracy>=60?"#f59e0b":"#ef4444";
                  return (
                    <div key={row.cat} style={{display:"flex",alignItems:"center",padding:"11px 14px",background:"rgba(255,255,255,0.02)",border:"1px solid #1f1d35",borderRadius:10,gap:10}}>
                      <div style={{flex:1,fontSize:13,fontWeight:600,color:"#e0e7ff"}}>{row.cat}</div>
                      <div style={{fontSize:12,color:"#52525b",textAlign:"right"}}>
                        <span style={{color:"#a1a1aa"}}>{currency}{row.actual}</span>
                        <span style={{color:"#2d2a4e"}}> / </span>
                        <span>{currency}{row.forecast}</span>
                      </div>
                      {row.accuracy !== null && (
                        <div style={{fontSize:12,fontWeight:700,color:ac,minWidth:34,textAlign:"right"}}>{row.accuracy}%</div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={{background:"rgba(255,255,255,0.02)",border:"1px solid #1f1d35",borderRadius:12,overflow:"hidden"}}>
                <table style={{width:"100%",borderCollapse:"collapse"}}>
                  <thead>
                    <tr style={{borderBottom:"1px solid #1f1d35"}}>
                      {["Category","Forecast","Actual","Difference","Accuracy"].map((h,i) => (
                        <th key={h} style={{padding:"9px 14px",fontSize:10,fontWeight:700,color:"#3f3f46",letterSpacing:"0.07em",textTransform:"uppercase",textAlign:i===0?"left":"right"}}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {accuracy.catRows.map((row, ri) => {
                      const dc = row.diff > 0 ? "#ef4444" : "#10b981";
                      const ac = row.accuracy===null?"#52525b":row.accuracy>=80?"#10b981":row.accuracy>=60?"#f59e0b":"#ef4444";
                      return (
                        <tr key={row.cat} style={{borderBottom:ri<accuracy.catRows.length-1?"1px solid #0f0e1f":"none"}}
                          onMouseEnter={e=>e.currentTarget.style.background="rgba(255,255,255,0.02)"}
                          onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                          <td style={{padding:"10px 14px",fontSize:13,color:"#e0e7ff",fontWeight:600}}>{row.cat}</td>
                          <td style={{padding:"10px 14px",fontSize:13,color:"#52525b",textAlign:"right",fontVariantNumeric:"tabular-nums"}}>{currency}{row.forecast}</td>
                          <td style={{padding:"10px 14px",fontSize:13,color:"#a1a1aa",textAlign:"right",fontVariantNumeric:"tabular-nums"}}>{currency}{row.actual}</td>
                          <td style={{padding:"10px 14px",fontSize:13,color:dc,textAlign:"right",fontVariantNumeric:"tabular-nums",fontWeight:600}}>
                            {row.diff > 0 ? "+" : ""}{currency}{Math.abs(row.diff)}
                          </td>
                          <td style={{padding:"10px 14px",textAlign:"right"}}>
                            {row.accuracy !== null
                              ? <span style={{fontSize:11,fontWeight:700,color:ac,background:`${ac}1a`,padding:"2px 8px",borderRadius:20}}>{row.accuracy}%</span>
                              : <span style={{fontSize:12,color:"#2d2a4e"}}>—</span>}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* AI insight — only shown on first view, not modal replay */}
        {!precomputed && (
          <div style={{marginBottom:32,padding:"14px 16px",background:"rgba(99,102,241,0.06)",border:"1px solid rgba(99,102,241,0.15)",borderLeft:"3px solid rgba(99,102,241,0.4)",borderRadius:10,animation:"fadeUp 0.5s ease 0.15s both"}}>
            <div style={{fontSize:10,fontWeight:700,color:"#6366f1",letterSpacing:"0.07em",textTransform:"uppercase",marginBottom:6}}>AI insight</div>
            {insightLoading
              ? <div style={{fontSize:13,color:"#3f3f46",fontStyle:"italic"}}>Analysing your biggest miss...</div>
              : aiInsight
                ? <div style={{fontSize:13,color:"#a1a1aa",lineHeight:1.6}}>{aiInsight}</div>
                : accuracy.catRows[0]
                  ? <div style={{fontSize:13,color:"#52525b"}}>Biggest miss: {accuracy.catRows[0].cat} ({accuracy.catRows[0].diff>0?"+":""}{currency}{Math.abs(accuracy.catRows[0].diff)} vs forecast)</div>
                  : <div style={{fontSize:13,color:"#3f3f46"}}>No significant misses detected.</div>
            }
          </div>
        )}

        {/* CTAs */}
        <div style={{display:"flex",gap:10,flexDirection:isMobile?"column":"row",animation:"fadeUp 0.5s ease 0.2s both"}}>
          <button onClick={onContinue}
            style={{flex:1,padding:"14px 24px",background:"linear-gradient(135deg,#6366f1,#4f46e5)",color:"#fff",border:"none",borderRadius:12,fontSize:14,fontWeight:700,cursor:"pointer",letterSpacing:"-0.01em",boxShadow:"0 0 0 1px rgba(99,102,241,0.4),0 8px 24px rgba(99,102,241,0.25)"}}>
            {precomputed ? "Close" : "See full forecast →"}
          </button>
          {!precomputed && (
            <button onClick={onContinue}
              style={{padding:"14px 24px",background:"none",color:"#52525b",border:"1px solid #1f1d35",borderRadius:12,fontSize:14,cursor:"pointer"}}>
              Dismiss
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Loading Screen ───────────────────────────────────────────────────────────
function LoadingScreen({pct, message, done, logLines=[]}) {
  return (
    <div style={{minHeight:"100vh",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",background:"#08070f",padding:40}}>
      <style>{GLOBAL_CSS}</style>
      <img src={logo} alt="Abound" style={{height:40,marginBottom:48,opacity:0.9,mixBlendMode:"screen"}}/>
      {done?(
        <div style={{textAlign:"center",animation:"fadeUp 0.6s ease both"}}>
          <div style={{width:44,height:44,borderRadius:"50%",background:"rgba(16,185,129,0.12)",border:"2px solid #10b981",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,margin:"0 auto 16px",color:"#10b981"}}>✓</div>
          <div style={{fontSize:17,fontWeight:700,color:"#fff",marginBottom:6}}>All categorised.</div>
          <div style={{fontSize:13,color:"#4b5563"}}>Loading your breakdown...</div>
        </div>
      ):(
        <div style={{width:"100%",maxWidth:420}}>
          {/* Terminal log */}
          <div style={{background:"#0d0c1a",border:"1px solid #1f1d35",borderRadius:12,padding:"18px 22px",marginBottom:20,minHeight:100,fontFamily:"'Menlo','Monaco','Consolas',monospace"}}>
            {logLines.length===0
              ? <div style={{fontSize:12,color:"#374151"}}>Initialising...</div>
              : logLines.map((line,i)=>(
                  <div key={i} style={{fontSize:12,lineHeight:1.9,display:"flex",alignItems:"center",gap:10,animation:`scanline 0.3s ease ${i*80}ms both`}}>
                    <span style={{color:line.done?"#10b981":line.active?"#6366f1":"#374151",flexShrink:0,fontSize:11}}>{line.done?"✓":line.active?"⟳":"·"}</span>
                    <span style={{color:line.done?"#71717a":line.active?"#e0e7ff":"#3f3f46"}}>{line.text}</span>
                  </div>
                ))
            }
          </div>
          {/* Progress bar */}
          <div style={{height:2,background:"#1f1d35",borderRadius:999,overflow:"hidden",marginBottom:10}}>
            <div style={{height:"100%",width:`${pct}%`,background:"linear-gradient(90deg,#6366f1,#8b5cf6,#06b6d4)",transition:"width 0.8s cubic-bezier(0.16,1,0.3,1)"}}/>
          </div>
          <div style={{display:"flex",justifyContent:"space-between"}}>
            <span style={{fontSize:11,color:"#374151"}}>{message}</span>
            <span style={{fontSize:11,color:"#6366f1",fontWeight:700,fontVariantNumeric:"tabular-nums"}}>{pct}%</span>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Upload Screen ────────────────────────────────────────────────────────────
const BANK_GUIDES = [
  {bank:"Barclays",steps:["Log in to the Barclays app or barclays.co.uk","Go to the account you want → select 'Statements & documents'","Choose your date range → tap 'Download'","Select Excel (.xlsx) format","Save the file and upload it here"]},
  {bank:"HSBC",steps:["Log in to hsbc.co.uk or the HSBC app","Select your account → 'Statements'","Choose date range → 'Download'","Pick 'Excel' or 'CSV' format","Save and upload here"]},
  {bank:"Lloyds / Halifax / Bank of Scotland",steps:["Go to lloydsbankinggroup.com and log in","Select your account → 'Download transactions'","Choose date range and 'Excel spreadsheet (.xls)'","Download and upload here"]},
  {bank:"NatWest / RBS",steps:["Log in to natwest.com or the app","Go to your account → 'Download transactions'","Set date range and select 'Excel (.xlsx)'","Download and upload here"]},
  {bank:"Monzo",steps:["Open Monzo app → tap your account","Scroll down → 'Export transactions'","Choose 'CSV' format (Excel opens CSV fine)","Email or save the file, then upload here"]},
  {bank:"Starling",steps:["Open Starling app → tap the account","Go to 'Statements' → 'Download'","Choose 'CSV' or 'PDF' — CSV preferred","Save and upload here"]},
  {bank:"Santander",steps:["Log in at santander.co.uk","Select account → 'Statements' → 'Download'","Pick date range → choose 'Excel' format","Save and upload here"]},
  {bank:"American Express",steps:["Log in at americanexpress.com","Go to 'Statements & Activity'","Click 'Download' → select 'Excel' or 'CSV'","Save and upload here as a credit card"]},
  {bank:"Other bank",steps:["Log in to your bank's website (not the app)","Find 'Statements', 'Transaction history', or 'Download'","Look for Export / Download options — choose Excel or CSV","If only PDF is available, upload the PDF — we can read those too"]},
];

function UploadScreen({onDone, onAddAccount=null}) {
  const [accounts, setAccounts] = useState([{id:1,file:null,name:""}]);
  const [loading, setLoading] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [showHomeScreenTip, setShowHomeScreenTip] = useState(()=>isMobileDevice()&&!localStorage.getItem("homeScreenTipDismissed"));
  const [guideBank, setGuideBank] = useState(0);
  const [step, setStep] = useState("upload"); // "upload" | "balance"
  const [parsedTxns, setParsedTxns] = useState([]);
  const [multipleAccounts, setMultipleAccounts] = useState(false);
  const [missingBalanceAccounts, setMissingBalanceAccounts] = useState([]); // [{label, value}]
  const [balanceInputs, setBalanceInputs] = useState({});
  const [prevSession, setPrevSession] = useState(null);
  const [continueChosen, setContinueChosen] = useState(false);
  const [continueDismissed, setContinueDismissed] = useState(false);
  useEffect(()=>{
    const s = loadSession();
    if(s && s.transactions && s.transactions.length > 0) setPrevSession(s);
  },[]);
  const hasMainFile = !!accounts[0].file;
  function addCard(){setAccounts(a=>[...a,{id:Date.now(),file:null,name:""}]);}
  function removeAccount(id){setAccounts(a=>a.filter(x=>x.id!==id));}
  async function handleFile(id,file){setAccounts(a=>a.map(x=>x.id===id?{...x,file,name:file.name}:x));}

  async function handleContinue(){
    setLoading(true);
    const allRows=[];let ccIndex=1;
    const missing=[];
    for(const acc of accounts){
      if(!acc.file)continue;
      const ext=acc.file.name.split('.').pop().toLowerCase();
      let rows,fileSummaryBalance=null;
      if(ext==="pdf"){rows=await readPdfFile(acc.file);}
      else{const r=await readExcelFile(acc.file);rows=r.rows;fileSummaryBalance=r.summaryBalance;}
      const isFirst=acc.id===accounts[0].id;
      let label;
      if(isFirst)label="Main Account";
      else if(ccIndex===1){label="Credit Card";ccIndex++;}
      else{label=`Credit Card ${ccIndex}`;ccIndex++;}
      const txns=normaliseRows(rows,label,fileSummaryBalance);
      allRows.push(...txns);
      if(!hasAnyBalance(txns)) missing.push({label, txns});
    }
    setLoading(false);
    if(missing.length>0){
      setParsedTxns(allRows);
      setMultipleAccounts(accounts.filter(a=>a.file).length>1);
      setMissingBalanceAccounts(missing);
      const inputs={};
      missing.forEach(m=>{inputs[m.label]="";});
      setBalanceInputs(inputs);
      setStep("balance");
    } else {
      onDone(allRows, accounts.filter(a=>a.file).length>1, continueChosen);
    }
  }

  function handleBalanceConfirm(){
    // Inject the manually entered balance as a synthetic balance on the most recent transaction
    const injected=parsedTxns.map(t=>{
      const entry=missingBalanceAccounts.find(m=>m.label===t.account);
      if(!entry) return t;
      const val=parseFloat(String(balanceInputs[t.account]||"").replace(/[£,]/g,""));
      if(isNaN(val)) return t;
      // Find the most recent transaction for this account and attach balance there
      const acctTxns=parsedTxns.filter(x=>x.account===t.account);
      const mostRecent=acctTxns.reduce((a,b)=>a.date>b.date?a:b);
      if(t===mostRecent||t.date.getTime()===mostRecent.date.getTime()) return {...t, balance:val};
      return t;
    });
    onDone(injected, multipleAccounts, continueChosen);
  }`
  `
  if(step==="balance"){
    return(
      <div className="dark-screen" style={{minHeight:"100vh",background:"#08070f",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"40px 24px",position:"relative",overflow:"hidden"}}>
        <style>{GLOBAL_CSS}</style>
        <div style={{position:"absolute",inset:0,background:"radial-gradient(ellipse at 50% 0%,rgba(239,68,68,0.07) 0%,transparent 50%)",pointerEvents:"none"}}/>
        <div style={{width:"100%",maxWidth:440,position:"relative",zIndex:1,animation:"fadeUp 0.5s ease both"}}>
          {/* Warning header */}
          <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:28}}>
            <div style={{width:40,height:40,borderRadius:10,background:"rgba(239,68,68,0.1)",border:"1px solid rgba(239,68,68,0.3)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M10 3L2 17h16L10 3z" stroke="#ef4444" strokeWidth="1.5" strokeLinejoin="round"/><path d="M10 8v4M10 13.5v.5" stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round"/></svg>
            </div>
            <div>
              <div style={{fontSize:17,fontWeight:800,color:"#fff",letterSpacing:"-0.02em"}}>Opening balance not found</div>
              <div style={{fontSize:12,color:"#52525b",marginTop:2}}>Your statement doesn't include a balance column. Without this, the cash flow forecast will be wrong.</div>
            </div>
          </div>

          {/* Explanation card */}
          <div style={{background:"rgba(239,68,68,0.05)",border:"1px solid rgba(239,68,68,0.15)",borderRadius:12,padding:"14px 16px",marginBottom:24}}>
            <div style={{fontSize:11,fontWeight:700,color:"#ef4444",letterSpacing:"0.05em",marginBottom:6}}>WHY THIS MATTERS</div>
            <div style={{fontSize:12,color:"#9ca3af",lineHeight:1.6}}>The Cash Balance row — the most important number in Abound — is calculated by walking forward from your opening balance. If this is wrong, every week's forecast will be wrong by the same amount.</div>
          </div>

          {/* Balance inputs per missing account */}
          {missingBalanceAccounts.map(({label})=>(
            <div key={label} style={{marginBottom:16}}>
              <div style={{fontSize:11,fontWeight:700,color:"#52525b",letterSpacing:"0.06em",marginBottom:8,textTransform:"uppercase"}}>{label} — current balance</div>
              <div style={{position:"relative"}}>
                <span style={{position:"absolute",left:14,top:"50%",transform:"translateY(-50%)",fontSize:16,color:"#6366f1",fontWeight:700,pointerEvents:"none"}}>£</span>
                <input
                  type="number"
                  placeholder="e.g. 2450.00"
                  value={balanceInputs[label]||""}
                  onChange={e=>setBalanceInputs(p=>({...p,[label]:e.target.value}))}
                  style={{width:"100%",padding:"13px 14px 13px 30px",background:"rgba(255,255,255,0.04)",border:"1px solid #2d2a6e",borderRadius:10,color:"#fff",fontSize:16,fontWeight:700,outline:"none",fontVariantNumeric:"tabular-nums",letterSpacing:"-0.01em"}}
                  onFocus={e=>{e.target.style.borderColor="#6366f1";e.target.style.boxShadow="0 0 0 2px rgba(99,102,241,0.15)";}}
                  onBlur={e=>{e.target.style.borderColor="#2d2a6e";e.target.style.boxShadow="none";}}
                />
              </div>
              <div style={{fontSize:11,color:"#374151",marginTop:6}}>Open your banking app and enter what you see as the current balance.</div>
            </div>
          ))}

          <div style={{display:"flex",gap:10,marginTop:8}}>
            <button onClick={handleBalanceConfirm}
              disabled={missingBalanceAccounts.some(({label})=>!balanceInputs[label]||isNaN(parseFloat(String(balanceInputs[label]).replace(/[£,]/g,""))))}
              style={{flex:1,padding:"13px",background:"linear-gradient(135deg,#6366f1,#4f46e5)",color:"#fff",border:"none",borderRadius:10,fontSize:14,fontWeight:700,cursor:"pointer",boxShadow:"0 0 0 1px rgba(99,102,241,0.4),0 8px 24px rgba(99,102,241,0.25)",letterSpacing:"-0.01em",opacity:missingBalanceAccounts.some(({label})=>!balanceInputs[label])?0.5:1,transition:"opacity 0.2s"}}>
              Continue with this balance →
            </button>
          </div>
          <button onClick={()=>onDone(parsedTxns,multipleAccounts)} style={{width:"100%",padding:"10px",marginTop:8,background:"none",border:"none",color:"#374151",fontSize:12,cursor:"pointer"}}>
            Skip — I know the forecast may be inaccurate
          </button>
        </div>
      </div>
    );
  }

  function DropZone({account,index}){
    const [dragging,setDragging]=useState(false);
    const inputRef=useRef(null);
    const loaded=!!account.file;
    function onFileChange(e){
      const file=e.target.files?.[0];
      if(file) handleFile(account.id,file);
      e.target.value="";
    }
    function onDrop(e){
      e.preventDefault();setDragging(false);
      const file=e.dataTransfer?.files?.[0];
      if(file) handleFile(account.id,file);
    }
    const labelText=index===0?"Main Account":index===1?"Credit Card":`Credit Card ${index}`;
    return(
      <div
        onClick={()=>inputRef.current?.click()}
        onDragOver={e=>{e.preventDefault();setDragging(true);}}
        onDragLeave={()=>setDragging(false)}
        onDrop={onDrop}
        style={{display:"block",border:loaded?"1px solid #4338ca":dragging?"1px solid #6366f1":"1px dashed #2d2a6e",borderRadius:12,padding:"18px",cursor:"pointer",background:loaded?"rgba(99,102,241,0.06)":dragging?"rgba(99,102,241,0.04)":"rgba(255,255,255,0.02)",transition:"all 0.2s",marginBottom:10,boxShadow:loaded?"0 0 0 1px rgba(99,102,241,0.15)":"none",WebkitTapHighlightColor:"transparent"}}>
        <input ref={inputRef} type="file" accept=".xlsx,.xls,.csv,.pdf" onChange={onFileChange} onClick={e=>e.stopPropagation()} style={{position:"fixed",top:-9999,left:-9999,width:1,height:1,opacity:0}}/>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          <div style={{width:34,height:34,borderRadius:8,background:loaded?"rgba(99,102,241,0.15)":"rgba(255,255,255,0.04)",border:`1px solid ${loaded?"#4338ca":"#2d2a6e"}`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
            {loaded
              ? <svg width="16" height="16" viewBox="0 0 20 20" fill="none"><path stroke="#a5b4fc" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M4 10l5 5 7-8"/></svg>
              : <svg width="16" height="16" viewBox="0 0 20 20" fill="none"><path stroke="#52525b" strokeWidth="1.5" strokeLinecap="round" d="M10 13V5M6 9l4-4 4 4"/><path stroke="#52525b" strokeWidth="1.5" strokeLinecap="round" d="M4 15h12"/></svg>
            }
          </div>
          <div style={{flex:1,minWidth:0}}>
            <div style={{fontSize:13,fontWeight:600,color:loaded?"#a5b4fc":"#71717a",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{loaded?account.name:`Drop ${labelText} statement here`}</div>
            <div style={{fontSize:11,color:"#3f3f46",marginTop:2}}>{loaded?"Ready · Excel, CSV or PDF":"Excel, CSV or PDF · drag & drop or click"}</div>
          </div>
          {loaded&&<div style={{width:7,height:7,borderRadius:"50%",background:"#10b981",flexShrink:0,boxShadow:"0 0 6px #10b981"}}/>}
        </div>
      </div>
    );
  }
    return(
    <div className="dark-screen" style={{minHeight:"100vh",background:"#08070f",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"40px 24px",position:"relative",overflow:"hidden"}}>
      <style>{GLOBAL_CSS}</style>
      <div style={{position:"absolute",inset:0,background:"radial-gradient(ellipse at 50% 0%,rgba(99,102,241,0.07) 0%,transparent 50%)",pointerEvents:"none"}}/>
      {/* Privacy banner — permanent, not fading */}
      <div style={{position:"fixed",top:0,left:0,right:0,zIndex:100,display:"flex",justifyContent:"center",alignItems:"center",gap:8,padding:"9px 16px",background:"rgba(16,185,129,0.08)",borderBottom:"1px solid rgba(16,185,129,0.15)"}}>
        <div style={{width:7,height:7,borderRadius:"50%",background:"#10b981",boxShadow:"0 0 6px #10b981",flexShrink:0}}/>
        <span style={{fontSize:12,color:"#6ee7b7",fontWeight:600}}>Your statement is processed <strong style={{color:"#34d399"}}>entirely on your device</strong> — we never see, store, or transmit your bank data.</span>
      </div>
      <div style={{width:"100%",maxWidth:420,position:"relative",zIndex:1,animation:"fadeUp 0.6s ease both"}}>
        {/* Mobile: save to home screen tip */}
        {showHomeScreenTip&&(
          <div style={{background:"rgba(99,102,241,0.08)",border:"1px solid rgba(99,102,241,0.25)",borderLeft:"3px solid #6366f1",borderRadius:10,padding:"10px 12px",marginBottom:20,display:"flex",alignItems:"flex-start",gap:10}}>
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none" style={{flexShrink:0,marginTop:2}}><rect x="3" y="3" width="14" height="14" rx="3" stroke="#818cf8" strokeWidth="1.6"/><path d="M10 7v6M7 10h6" stroke="#818cf8" strokeWidth="1.6" strokeLinecap="round"/></svg>
            <div style={{flex:1}}>
              <div style={{fontSize:12,fontWeight:700,color:"#a5b4fc",marginBottom:3}}>Save Abound to your Home Screen</div>
              <div style={{fontSize:11,color:"#6b7280",lineHeight:1.5}}>iOS: tap the Share button in Safari, then "Add to Home Screen". Android: tap the menu and "Add to Home Screen".</div>
            </div>
            <button onClick={()=>{localStorage.setItem("homeScreenTipDismissed","1");setShowHomeScreenTip(false);}}
              style={{background:"none",border:"none",color:"#4b5563",fontSize:16,cursor:"pointer",padding:0,lineHeight:1,flexShrink:0}}>×</button>
          </div>
        )}
        {/* Welcome-back / continue prompt */}
        {prevSession && !continueDismissed && (()=>{
          const lastDate = prevSession.lastTxnDate ? new Date(prevSession.lastTxnDate).toLocaleDateString("en-GB",{day:"numeric",month:"long",year:"numeric"}) : null;
          return(
            <div style={{background:"linear-gradient(135deg,rgba(99,102,241,0.12),rgba(79,70,229,0.08))",border:"1px solid rgba(99,102,241,0.3)",borderRadius:14,padding:"16px 18px",marginBottom:24,animation:"fadeUp 0.4s ease both"}}>
              <div style={{fontSize:13,fontWeight:700,color:"#e0e7ff",marginBottom:4}}>Welcome back</div>
              <div style={{fontSize:12,color:"#818cf8",marginBottom:14,lineHeight:1.5}}>Want to pick up where you left off? Upload your latest statement and we'll carry forward your categories.</div>
              <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                <button onClick={()=>{setContinueChosen(true);setContinueDismissed(true);}}
                  style={{flex:1,minWidth:140,padding:"9px 14px",background:"linear-gradient(135deg,#6366f1,#4f46e5)",color:"#fff",border:"none",borderRadius:9,fontSize:12,fontWeight:700,cursor:"pointer",letterSpacing:"-0.01em",boxShadow:"0 4px 14px rgba(99,102,241,0.35)"}}>
                  Continue from {lastDate||"last session"} →
                </button>
                <button onClick={()=>setContinueDismissed(true)}
                  style={{padding:"9px 14px",background:"transparent",color:"#52525b",border:"1px solid #2d2a6e",borderRadius:9,fontSize:12,fontWeight:500,cursor:"pointer"}}>
                  Start fresh
                </button>
              </div>
            </div>
          );
        })()}
        {/* Continue mode active indicator */}
        {continueChosen && (
          <div style={{background:"rgba(16,185,129,0.08)",border:"1px solid rgba(16,185,129,0.2)",borderRadius:9,padding:"8px 14px",marginBottom:16,display:"flex",alignItems:"center",gap:8}}>
            <div style={{width:6,height:6,borderRadius:"50%",background:"#10b981",boxShadow:"0 0 6px #10b981",flexShrink:0}}/>
            <span style={{fontSize:11,color:"#6ee7b7",fontWeight:600}}>Continue mode — only new transactions since last session will be processed</span>
          </div>
        )}
        {/* Step indicator */}
        <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:0,marginBottom:32}}>
          {[["Upload",true],["Categorise",false],["Review",false]].map(([label,active],i)=>(
            <div key={i} style={{display:"flex",alignItems:"center"}}>
              <div style={{display:"flex",alignItems:"center",gap:5}}>
                <span style={{fontSize:9,color:active?"#6366f1":"#3f3f46"}}>{active?"●":"○"}</span>
                <span style={{fontSize:10,fontWeight:active?700:400,color:active?"#6366f1":"#3f3f46",letterSpacing:"0.06em"}}>{label.toUpperCase()}</span>
              </div>
              {i<2&&<div style={{width:28,height:1,background:"#1f1d35",margin:"0 8px"}}/>}
            </div>
          ))}
        </div>
        {/* Bank guide modal */}
        {showGuide&&(
          <>
            <div onClick={()=>setShowGuide(false)} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.7)",zIndex:200}}/>
            <div style={{position:"fixed",top:"50%",left:"50%",transform:"translate(-50%,-50%)",zIndex:201,background:"#0d0c1e",border:"1px solid #2d2a6e",borderRadius:16,padding:"24px",width:"min(460px,92vw)",maxHeight:"80vh",overflow:"auto",boxShadow:"0 20px 60px rgba(0,0,0,0.6)"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
                <div style={{fontSize:15,fontWeight:800,color:"#e0e7ff"}}>How to export your bank statement</div>
                <button onClick={()=>setShowGuide(false)} style={{fontSize:20,color:"#4b5563",border:"none",background:"none",cursor:"pointer",lineHeight:1}}>×</button>
              </div>
              {/iPhone|iPod/.test(navigator.userAgent)&&/Safari/.test(navigator.userAgent)&&!/CriOS|FxiOS/.test(navigator.userAgent)&&(
                <div style={{background:"rgba(251,191,36,0.08)",border:"1px solid rgba(251,191,36,0.3)",borderRadius:10,padding:"11px 13px",marginBottom:16,display:"flex",gap:10,alignItems:"flex-start"}}>
                  <span style={{fontSize:16,lineHeight:1,flexShrink:0}}>⚠️</span>
                  <div>
                    <div style={{fontSize:12,fontWeight:700,color:"#fbbf24",marginBottom:3}}>iPhone Safari — use Desktop Site</div>
                    <div style={{fontSize:11,color:"#9ca3af",lineHeight:1.55}}>Mobile Safari blocks file uploads on some bank sites. Tap <span style={{color:"#e0e7ff",fontWeight:600}}>aA</span> in the address bar, then choose <span style={{color:"#e0e7ff",fontWeight:600}}>Request Desktop Website</span> before downloading your statement.</div>
                  </div>
                </div>
              )}
              <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:16}}>
                {BANK_GUIDES.map((g,i)=>(
                  <button key={i} onClick={()=>setGuideBank(i)}
                    style={{padding:"5px 10px",borderRadius:20,border:`1px solid ${i===guideBank?"#6366f1":"#2d2a6e"}`,background:i===guideBank?"rgba(99,102,241,0.15)":"transparent",color:i===guideBank?"#a5b4fc":"#52525b",fontSize:11,fontWeight:600,cursor:"pointer",transition:"all 0.15s"}}>
                    {g.bank}
                  </button>
                ))}
              </div>
              <div style={{background:"rgba(99,102,241,0.06)",border:"1px solid #2d2a6e",borderRadius:10,padding:"14px 16px"}}>
                <div style={{fontSize:12,fontWeight:700,color:"#6366f1",marginBottom:10,letterSpacing:"0.04em"}}>{BANK_GUIDES[guideBank].bank.toUpperCase()}</div>
                {BANK_GUIDES[guideBank].steps.map((s,i)=>(
                  <div key={i} style={{display:"flex",gap:10,marginBottom:8,alignItems:"flex-start"}}>
                    <div style={{width:18,height:18,borderRadius:"50%",background:"rgba(99,102,241,0.2)",border:"1px solid #4338ca",color:"#a5b4fc",fontSize:10,fontWeight:700,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,marginTop:1}}>{i+1}</div>
                    <div style={{fontSize:12,color:"#9ca3af",lineHeight:1.5}}>{s}</div>
                  </div>
                ))}
              </div>
              <div style={{marginTop:12,fontSize:11,color:"#374151",textAlign:"center"}}>Can't find the export option? Look for "Download", "Export", or "Statements" in your bank's website settings.</div>
            </div>
          </>
        )}
        <div style={{marginBottom:24,display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
          <div>
            <h2 style={{fontSize:21,fontWeight:800,color:"#fff",marginBottom:6,letterSpacing:"-0.02em"}}>Upload your statements</h2>
            <p style={{fontSize:13,color:"#52525b",margin:0}}>Drop in your bank exports. We'll handle the rest.</p>
          </div>
          <button onClick={()=>setShowGuide(true)} title="How to get your bank statement"
            style={{width:30,height:30,borderRadius:"50%",border:"1px solid #2d2a6e",background:"rgba(99,102,241,0.1)",color:"#818cf8",fontSize:14,fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,marginTop:4}}>
            ?
          </button>
        </div>
        {accounts.map((acc,i)=>(
          <div key={acc.id} style={{position:"relative"}}>
            {i>0&&<button onClick={()=>removeAccount(acc.id)} style={{position:"absolute",top:12,right:12,zIndex:10,fontSize:14,color:"#52525b",border:"none",background:"none",cursor:"pointer",lineHeight:1}}>×</button>}
            <DropZone account={acc} index={i}/>
          </div>
        ))}
        <button onClick={addCard}
          style={{width:"100%",padding:"10px",border:"1px dashed #2d2a6e",borderRadius:10,background:"none",color:"#52525b",fontSize:12,fontWeight:500,cursor:"pointer",marginBottom:10,transition:"all 0.2s"}}
          onMouseEnter={e=>{e.target.style.borderColor="#4338ca";e.target.style.color="#818cf8";}}
          onMouseLeave={e=>{e.target.style.borderColor="#2d2a6e";e.target.style.color="#52525b";}}>
          + Add a credit card
        </button>
        <button onClick={handleContinue} disabled={!hasMainFile||loading}
          style={{width:"100%",padding:"13px",background:hasMainFile?"linear-gradient(135deg,#6366f1,#4f46e5)":"#151322",color:hasMainFile?"#fff":"#3f3f46",border:"none",borderRadius:12,fontSize:14,fontWeight:700,cursor:hasMainFile?"pointer":"not-allowed",transition:"all 0.3s",boxShadow:hasMainFile?"0 0 0 1px rgba(99,102,241,0.4),0 8px 24px rgba(99,102,241,0.25)":"none",letterSpacing:"-0.01em"}}
          onMouseEnter={e=>{if(hasMainFile){e.target.style.transform="translateY(-1px)";e.target.style.boxShadow="0 0 0 1px rgba(99,102,241,0.6),0 12px 32px rgba(99,102,241,0.35)";}}}
          onMouseLeave={e=>{e.target.style.transform="";e.target.style.boxShadow=hasMainFile?"0 0 0 1px rgba(99,102,241,0.4),0 8px 24px rgba(99,102,241,0.25)":"none";}}>
          {loading?"Reading files...":"Continue →"}
        </button>
        {prevSession&&onAddAccount&&(
          <div style={{textAlign:"center",marginTop:10}}>
            <span onClick={onAddAccount} style={{fontSize:11,color:"rgba(255,255,255,0.45)",cursor:"pointer"}} onMouseEnter={e=>e.currentTarget.style.color="rgba(255,255,255,0.75)"} onMouseLeave={e=>e.currentTarget.style.color="rgba(255,255,255,0.45)"}>+ Add another card or account</span>
          </div>
        )}
        <div style={{marginTop:12,display:"flex",alignItems:"center",justifyContent:"center",gap:6}}>
          <svg width="12" height="12" viewBox="0 0 20 20" fill="none"><rect x="5" y="9" width="10" height="9" rx="2" stroke="#10b981" strokeWidth="1.5"/><path d="M7 9V6a3 3 0 0 1 6 0v3" stroke="#10b981" strokeWidth="1.5" strokeLinecap="round"/></svg>
          <span style={{fontSize:11,color:"#4b7a68",textAlign:"center",lineHeight:1.4}}>Your file is read locally in your browser. Nothing is uploaded to any server. We never see your transactions.</span>
        </div>
      </div>
    </div>
  );
}
async function computeCategorySuggestions(txns, existingCats, apiKey) {
  const STOP = new Set(["from","with","payment","purchase","transaction","direct","debit","transfer","card","charge","services","service","limited","ltd","uk","the","and","for","via","ref","online","pay","paid","account","bank"]);
  const otherTxns = txns.filter(t=>t.category==="Other Payments");
  if(otherTxns.length < 3) return [];

  // Group by keyword frequency
  const wordGroups = {};
  otherTxns.forEach(t=>{
    const words = t.narrative.toLowerCase().replace(/[^a-z\s]/g," ").split(/\s+/).filter(w=>w.length>3&&!STOP.has(w));
    const seen = new Set();
    words.forEach(w=>{
      if(seen.has(w)) return;
      seen.add(w);
      if(!wordGroups[w]) wordGroups[w]={count:0,narratives:[]};
      wordGroups[w].count++;
      wordGroups[w].narratives.push(t.narrative);
    });
  });

  const clusters = Object.entries(wordGroups)
    .filter(([w,g])=>g.narratives.length>=3&&!existingCats.map(c=>c.toLowerCase()).includes(w))
    .sort((a,b)=>b[1].narratives.length-a[1].narratives.length)
    .slice(0,6)
    .map(([word,g])=>({keyword:word, narratives:[...new Set(g.narratives)].slice(0,5), count:[...new Set(g.narratives)].length}));

  if(clusters.length===0) return [];

  // Use Claude to name each cluster

    try {
      const prompt = `You are helping categorise personal bank transactions. For each cluster of similar transactions below, suggest a short, friendly spending category name (2-3 words max, title case, e.g. "Pet Care", "Healthcare", "Gym & Fitness", "Childcare", "Dining Out").

Clusters:
${clusters.map((c,i)=>`${i+1}. Keyword: "${c.keyword}" | Example transactions: ${c.narratives.join(", ")}`).join("\n")}

Respond ONLY with a JSON array of ${clusters.length} strings, one name per cluster. No explanation.`;

      const res = await fetch("/api/categorise",{
  method:"POST",
  headers:{"Content-Type":"application/json"},
  body:JSON.stringify({model:"claude-haiku-4-5-20251001",max_tokens:200,messages:[{role:"user",content:prompt}]})
});
      if(res.ok){
        const data = await res.json();
        const text = data.content?.[0]?.text||"[]";
        const names = JSON.parse(text.replace(/```json|```/g,"").trim());
        return clusters.map((c,i)=>({
          keyword:c.keyword,
          name: names[i]||c.keyword.charAt(0).toUpperCase()+c.keyword.slice(1),
          count:c.count
        }));
      }
    } catch(e){ console.warn("Suggestion naming failed",e); }

  // Fallback without API
  return clusters.map(c=>({
    keyword:c.keyword,
    name:c.keyword.charAt(0).toUpperCase()+c.keyword.slice(1),
    count:c.count
  }));
}
// ─── Categorise Screen ────────────────────────────────────────────────────────
function CategoriseScreen({transactions, multipleAccounts, onDone}) {
  const [pct, setPct] = useState(5);
  const [message, setMessage] = useState("Matching merchants...");
  const [done, setDone] = useState(false);
  const [categorised, setCategorised] = useState([]);
  const baseCats = multipleAccounts?[...DEFAULT_CATEGORIES.filter(c=>c!==INTERCOMPANY_CATEGORY),INTERCOMPANY_CATEGORY]:DEFAULT_CATEGORIES;
  const [categories, setCategories] = useState(baseCats);
  const [newCat, setNewCat] = useState("");
  const [editingCat, setEditingCat] = useState(null);
  const [editVal, setEditVal] = useState("");
  const [step, setStep] = useState("loading");
  const [logLines, setLogLines] = useState([{text:"Starting AI categorisation...",done:false,active:true}]);
  const [autoCats, setAutoCats] = useState([]);
  const [limitReached, setLimitReached] = useState(false);
  useEffect(()=>{
    (async()=>{
      const result = await smartCategorise(transactions, DEFAULT_CATEGORIES, multipleAccounts, update=>{
        if(update?.type==="limit_reached"){
          setLimitReached(true);
        } else if(update?.type==="lookup_done"){
          setPct(10);
          setLogLines([
            {text:`Income & salary routed (${update.known} transactions)`,done:true,active:false},
            {text:`Sending ${update.unknown} transactions to Claude...`,done:false,active:true},
          ]);
        } else if(update?.type==="progress"){
          setPct(update.pct);
          const isDetecting = update.pct>=82;
          setLogLines(l=>[...l.slice(0,-1),{...l[l.length-1],done:true,active:false},
            {text:isDetecting?"Detecting spending patterns...":`Categorising batch ${update.batchNum} of ${update.totalBatches}...`,done:false,active:true}]);
        } else if(update?.type==="new_categories"){
          setAutoCats(update.categories);
          setCategories(prev=>{
            const toAdd=update.categories.map(c=>c.name).filter(n=>!prev.includes(n));
            return [...prev,...toAdd];
          });
          setLogLines(l=>[...l.slice(0,-1),{...l[l.length-1],done:true,active:false},
            {text:`Created ${update.categories.length} new category${update.categories.length>1?"ies":""} from your spend`,done:false,active:true}]);
        } else if(update?.type==="done"){
          setPct(100);
          setLogLines(l=>[...l.map(x=>({...x,done:true,active:false})),{text:"All categorised ✓",done:true,active:false}]);
        }
      });
      setCategorised(result);
      setDone(true);
      setTimeout(()=>setStep("review"),1200);
    })();
  },[]);
  const summary = useMemo(()=>{
    const totals={};
    categories.forEach(c=>{totals[c]=0;});
    const now=new Date(),cutoff=new Date(now);cutoff.setDate(now.getDate()-30);
    const recent=categorised.filter(t=>t.date>=cutoff);
    const use=recent.length>20?recent:categorised;
    use.forEach(t=>{totals[t.category]=(totals[t.category]||0)+t.amount;});
    return totals;
  },[categorised,categories]);
  function addCategory(){const t=newCat.trim().replace(/^\S/,c=>c.toUpperCase());if(!t||categories.includes(t))return;setCategories(c=>[...c,t]);setNewCat("");}
  function removeCategory(cat){if(baseCats.includes(cat))return;setCategories(c=>c.filter(x=>x!==cat));setCategorised(t=>t.map(tx=>tx.category===cat?{...tx,category:"Other Payments"}:tx));}
  function saveRename(){if(!editVal.trim())return;const old=editingCat;setCategories(c=>c.map(x=>x===old?editVal:x));setCategorised(t=>t.map(tx=>tx.category===old?{...tx,category:editVal}:tx));setEditingCat(null);}
 const isMobile=useIsMobile();
  if(step==="loading") return <LoadingScreen pct={pct} message={message} done={done} logLines={logLines}/>;
  const CAT_EMOJI={};// icons handled by CatIcon
  return (
    <div className="dark-screen" style={{minHeight:"100vh",background:"#08070f",position:"relative",overflow:"hidden"}}>
      <style>{GLOBAL_CSS}</style>
      {/* Background radial + grid */}
      <div style={{position:"fixed",inset:0,background:"radial-gradient(ellipse at 60% 0%,rgba(99,102,241,0.1) 0%,transparent 55%)",pointerEvents:"none"}}/>
      <div style={{position:"fixed",inset:0,backgroundImage:"linear-gradient(rgba(99,102,241,0.025) 1px,transparent 1px),linear-gradient(90deg,rgba(99,102,241,0.025) 1px,transparent 1px)",backgroundSize:"48px 48px",pointerEvents:"none"}}/>

      <div style={{maxWidth:680,margin:"0 auto",padding:isMobile?"16px 16px 120px":"40px 24px 120px",position:"relative",zIndex:1}}>

        {/* AI limit reached notice */}
        {limitReached&&(
          <div style={{marginBottom:16,padding:"12px 16px",background:"rgba(251,191,36,0.06)",border:"1px solid rgba(251,191,36,0.2)",borderLeft:"3px solid #f59e0b",borderRadius:10,animation:"fadeUp 0.4s ease both",display:"flex",alignItems:"flex-start",gap:10}}>
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none" style={{flexShrink:0,marginTop:1}}><path d="M10 3L2 17h16L10 3z" stroke="#f59e0b" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M10 9v4M10 14.5v.5" stroke="#f59e0b" strokeWidth="1.5" strokeLinecap="round"/></svg>
            <div>
              <div style={{fontSize:13,fontWeight:700,color:"#fbbf24",marginBottom:2}}>AI categorisation limit reached</div>
              <div style={{fontSize:12,color:"#92400e",lineHeight:1.5}}>Remaining transactions were categorised using built-in rules. You can still manually assign categories below.</div>
            </div>
          </div>
        )}

        {/* Auto-created categories notice */}
        {autoCats.length>0&&(
          <div style={{marginBottom:20,padding:"14px 16px",background:"rgba(16,185,129,0.06)",border:"1px solid rgba(16,185,129,0.2)",borderLeft:"3px solid #10b981",borderRadius:10,animation:"fadeUp 0.4s ease both"}}>
            <div style={{fontSize:13,fontWeight:700,color:"#34d399",marginBottom:6}}>✦ New categories created from your spend</div>
            <div style={{fontSize:12,color:"#6b7280",marginBottom:10,lineHeight:1.5}}>We spotted recurring merchants in your transactions and created these categories automatically. You can rename or remove them below.</div>
            <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
              {autoCats.map((c,i)=>(
                <div key={i} style={{display:"flex",alignItems:"center",gap:5,padding:"4px 10px",background:"rgba(16,185,129,0.1)",border:"1px solid rgba(16,185,129,0.25)",borderRadius:20}}>
                  <span style={{fontSize:12,fontWeight:600,color:"#34d399"}}>{c.name}</span>
                  <span style={{fontSize:11,color:"#6b7280"}}>{c.count} txns</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Header */}
        <div style={{display:"flex",alignItems:"center",gap:14,marginBottom:32,animation:"fadeUp 0.5s ease both"}}>
          <img src={logo} alt="Abound" style={{height:isMobile?28:34,opacity:0.95,mixBlendMode:"screen"}}/>
          <div style={{width:1,height:28,background:"#1f1d35"}}/>
          <div>
            <div style={{fontSize:isMobile?16:19,fontWeight:800,color:"#fff",letterSpacing:"-0.02em"}}>{"Your spending breakdown"}</div>
            <div style={{fontSize:12,color:"#52525b",marginTop:2}}>{categorised.length} transactions categorised · tweak anything below</div>
          </div>
        </div>

        {/* Illustration + step indicator row */}
        <div style={{display:"flex",alignItems:"center",gap:16,marginBottom:28,animation:"fadeUp 0.5s ease 0.05s both"}}>
          <div style={{width:72,flexShrink:0,opacity:0.7}}>
            <IllustrationSortBlocks/>
          </div>
          <div style={{flex:1}}>
            <div style={{display:"flex",alignItems:"center",gap:0,marginBottom:8}}>
              {[["Upload",false],["Categorise",true],["Sort",false]].map(([label,active],i)=>(
                <div key={i} style={{display:"flex",alignItems:"center"}}>
                  <div style={{display:"flex",alignItems:"center",gap:5}}>
                    <span style={{fontSize:9,color:active?"#6366f1":"#2d2a6e"}}>{active?"●":"○"}</span>
                    <span style={{fontSize:10,fontWeight:active?700:400,color:active?"#6366f1":"#3f3f46",letterSpacing:"0.06em"}}>{label.toUpperCase()}</span>
                  </div>
                  {i<2&&<div style={{width:20,height:1,background:"#1f1d35",margin:"0 8px"}}/>}
                </div>
              ))}
            </div>
            <div style={{fontSize:12,color:"#3f3f46",lineHeight:1.5}}>{"Review the categories below. Rename or remove any that don't fit."}</div>
          </div>
        </div>

        {/* Spend summary cards */}
        <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr 1fr":"repeat(auto-fill,minmax(160px,1fr))",gap:8,marginBottom:24,animation:"fadeUp 0.5s ease 0.1s both"}}>
          {categories.map((cat,i)=>{
            const total=summary[cat]||0;
            const color=CATEGORY_COLORS[i%CATEGORY_COLORS.length];
            const emoji=CAT_EMOJI[cat]||"📂";
            return(
              <div key={cat} style={{background:"rgba(255,255,255,0.03)",borderRadius:12,padding:"14px 16px",border:"1px solid #1f1d35",borderTop:`2px solid ${color}44`,position:"relative",overflow:"hidden"}}>
                <div style={{position:"absolute",top:0,left:0,right:0,height:1,background:`linear-gradient(90deg,${color}88,transparent)`}}/>
                <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:8}}>
                  <CatIcon cat={cat} size={15} color={color}/>
                  <span style={{fontSize:10,fontWeight:700,color:"#52525b",letterSpacing:"0.05em",textTransform:"uppercase"}}>{cat}</span>
                </div>
                <div style={{fontSize:22,fontWeight:800,color:total===0?"#2d2a6e":color,fontVariantNumeric:"tabular-nums",letterSpacing:"-0.02em"}}>
                  {total===0?"—":`£${Math.round(total).toLocaleString()}`}
                </div>
                <div style={{fontSize:10,color:"#374151",marginTop:3}}>{"last 30 days"}</div>
              </div>
            );
          })}
        </div>


        {/* Categories list */}
        <div style={{background:"rgba(255,255,255,0.02)",borderRadius:14,border:"1px solid #1f1d35",overflow:"hidden",marginBottom:20,animation:"fadeUp 0.5s ease 0.15s both"}}>
          <div style={{padding:"12px 18px",borderBottom:"1px solid #1f1d35",display:"flex",alignItems:"center",gap:8}}>
            <div style={{fontSize:10,fontWeight:700,color:"#374151",letterSpacing:"0.1em",flex:1}}>CATEGORIES</div>
            <div style={{fontSize:10,color:"#2d2a6e"}}>{categories.length} total</div>
          </div>
          {categories.map((cat,i)=>{
            const color=CATEGORY_COLORS[i%CATEGORY_COLORS.length];
            const emoji=CAT_EMOJI[cat]||"📂";
            return(
              <div key={cat} style={{display:"flex",alignItems:"center",padding:"11px 18px",borderBottom:`1px solid #0f0e1a`,borderLeft:`3px solid ${color}`,gap:12,transition:"background 0.15s"}}
                onMouseEnter={e=>e.currentTarget.style.background="rgba(99,102,241,0.04)"}
                onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                <CatIcon cat={cat} size={16} color={color}/>
                <div style={{width:8,height:8,borderRadius:"50%",background:color,flexShrink:0,boxShadow:`0 0 6px ${color}88`}}/>
                {editingCat===cat
                  ?<input autoFocus value={editVal} onChange={e=>setEditVal(e.target.value)} onKeyDown={e=>{if(e.key==="Enter")saveRename();if(e.key==="Escape")setEditingCat(null);}} style={{flex:1,fontSize:13,background:"#1e1b38",border:`1px solid ${PURPLE}`,borderRadius:6,padding:"4px 10px",color:"#fff",outline:"none"}}/>
                  :<span style={{flex:1,fontSize:13,fontWeight:600,color:"#e0e7ff"}}>{cat}</span>
                }
                {editingCat===cat
                  ?<button onClick={saveRename} style={{fontSize:11,color:"#10b981",border:"1px solid #10b98133",background:"rgba(16,185,129,0.08)",borderRadius:6,padding:"3px 10px",cursor:"pointer",fontWeight:700}}>Save</button>
                  :<button onClick={()=>{setEditingCat(cat);setEditVal(cat);}} style={{fontSize:11,color:"#374151",border:"none",background:"none",cursor:"pointer",padding:"3px 6px",transition:"color 0.15s"}}
                    onMouseEnter={e=>e.target.style.color="#6366f1"}
                    onMouseLeave={e=>e.target.style.color="#374151"}>rename</button>
                }
                <button onClick={()=>removeCategory(cat)} style={{fontSize:16,color:baseCats.includes(cat)?"#1f1d35":"#374151",border:"none",background:"none",cursor:baseCats.includes(cat)?"not-allowed":"pointer",lineHeight:1,padding:"2px 4px",transition:"color 0.15s"}}
                  onMouseEnter={e=>{if(!baseCats.includes(cat))e.target.style.color="#ef4444";}}
                  onMouseLeave={e=>e.target.style.color=baseCats.includes(cat)?"#1f1d35":"#374151"}>−</button>
              </div>
            );
          })}
          <div style={{display:"flex",gap:8,padding:"12px 18px",borderTop:"1px solid #0f0e1a"}}>
            <input value={newCat} onChange={e=>setNewCat(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addCategory()} placeholder="Add a custom category..." style={{flex:1,fontSize:16,background:"rgba(255,255,255,0.03)",border:"1px solid #1f1d35",borderRadius:8,padding:"8px 12px",color:"#e0e7ff",outline:"none"}}/>
            <button onClick={addCategory} style={{padding:"8px 18px",background:"linear-gradient(135deg,#6366f1,#4f46e5)",color:"#fff",border:"none",borderRadius:8,fontSize:14,fontWeight:700,cursor:"pointer",boxShadow:"0 4px 12px rgba(99,102,241,0.3)"}}>+</button>
          </div>
        </div>

      </div>

      {/* Sticky CTA */}
      <div style={{position:"fixed",bottom:0,left:0,right:0,zIndex:10,padding:isMobile?"16px":"20px 24px",background:"linear-gradient(to top,#08070f 70%,transparent)"}}>
        <div style={{maxWidth:680,margin:"0 auto"}}>
          <button onClick={()=>onDone(categorised,categories)}
            style={{width:"100%",padding:"15px",background:"linear-gradient(135deg,#6366f1,#4f46e5)",color:"#fff",border:"none",borderRadius:12,fontSize:15,fontWeight:800,cursor:"pointer",boxShadow:"0 0 0 1px rgba(99,102,241,0.4),0 8px 32px rgba(99,102,241,0.35)",letterSpacing:"-0.01em",transition:"all 0.2s"}}
            onMouseEnter={e=>{e.target.style.transform="translateY(-1px)";e.target.style.boxShadow="0 0 0 1px rgba(99,102,241,0.6),0 12px 40px rgba(99,102,241,0.4)";}}
            onMouseLeave={e=>{e.target.style.transform="";e.target.style.boxShadow="0 0 0 1px rgba(99,102,241,0.4),0 8px 32px rgba(99,102,241,0.35)";}}>
            {"Sort remaining transactions →"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Sort Screen ──────────────────────────────────────────────────────────────
function SortScreen({transactions, categories: initialCategories, onDone, continueSince}) {
  const allItems = useMemo(()=>
    transactions.filter(t=>t.category==="Other Payments")
      .reduce((acc,t)=>{const ex=acc.find(x=>x.narrative===t.narrative);if(ex){ex.total+=t.amount;ex.count+=1;}else acc.push({narrative:t.narrative,total:t.amount,count:1,category:"Other Payments"});return acc;},[])
      .sort((a,b)=>b.total-a.total)
  ,[]);
  const [items, setItems] = useState(allItems);
  const [categories, setCategories] = useState(initialCategories);
  const [hoveredCat, setHoveredCat] = useState(null);
  const [bucketCounts, setBucketCounts] = useState({});
  const [newCat, setNewCat] = useState("");
  const [showAddCat, setShowAddCat] = useState(false);
  const [mobileAddingCat, setMobileAddingCat] = useState(false);
  const [mobileCatInput, setMobileCatInput] = useState("");
  const dragRef = useRef(null);
  const [undoHistory, setUndoHistory] = useState([]);
  const touchStartX = useRef(null);
  const touchStartY = useRef(null);
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [swipeTarget, setSwipeTarget] = useState(null);
  const [mobileCatPage, setMobileCatPage] = useState(0);
  const [windowWidth, setWindowWidth] = useState(typeof window!=="undefined"?window.innerWidth:1200);
  useEffect(()=>{const handler=()=>setWindowWidth(window.innerWidth);window.addEventListener("resize",handler);return()=>window.removeEventListener("resize",handler);},[]);
  const isMobileView = windowWidth<768;
  const VISIBLE=5;
  const unsorted=items.filter(i=>i.category==="Other Payments");
  const sorted=items.filter(i=>i.category!=="Other Payments"&&i.category!=="Skip");
  const skipped=items.filter(i=>i.category==="Skip");
  const visible=unsorted.slice(0,VISIBLE);
  const spendCats=categories.filter(c=>c!=="Other Payments"&&c!=="Card Repayment"&&c!=="Investments"&&c!=="Salary");
  const catRepaymentInCats=categories.includes("Card Repayment");
  const investInCats=categories.includes("Investments");
  const allBuckets=[...spendCats,investInCats?"Investments":null,catRepaymentInCats?"Card Repayment":null,"Skip"].filter(Boolean);
  const CAT_COLORS={"Food":"#10b981","Travel":"#3b82f6","Rent":"#f59e0b","Memberships":"#8b5cf6","Investments":"#10b981","Card Repayment":"#ec4899"};
  const INVESTMENT_SIGNALS=/lightyear|trading[\s-]?212|freetrade|vanguard|hargreaves|degiro|etoro|nutmeg|moneybox|aj[\s-]?bell|investec|interactive[\s-]?investor|fidelity|stocks[\s\S]*shares|isa\b|sipp\b|\bfund\b|invest/i;
  const [investHintDismissed,setInvestHintDismissed]=useState(()=>{try{return JSON.parse(localStorage.getItem("abound_investment_hints_dismissed")||"[]");}catch{return[];}});
  function catColor(cat,i){return CAT_COLORS[cat]||CATEGORY_COLORS[i%CATEGORY_COLORS.length]||"#6366f1";}
  function assignItem(narrative,cat){if(cat!=="Skip")setBucketCounts(p=>({...p,[cat]:(p[cat]||0)+1}));setItems(p=>p.map(x=>x.narrative===narrative?{...x,category:cat}:x));setSwipeOffset(0);setSwipeTarget(null);setUndoHistory(h=>[...h,{narrative,cat}]);}
  function dropIntoCat(cat){const n=dragRef.current;if(!n)return;assignItem(n,cat);dragRef.current=null;setHoveredCat(null);}
  function undoItem(narrative,fromCat){if(fromCat!=="Skip")setBucketCounts(p=>({...p,[fromCat]:Math.max(0,(p[fromCat]||1)-1)}));setItems(p=>p.map(x=>x.narrative===narrative?{...x,category:"Other Payments"}:x));}
  function undoLast(){if(!undoHistory.length)return;const last=undoHistory[undoHistory.length-1];undoItem(last.narrative,last.cat);setUndoHistory(h=>h.slice(0,-1));}
  function addCategory(){const t=newCat.trim().replace(/^\S/,c=>c.toUpperCase());if(!t||categories.includes(t))return;setCategories(c=>[...c,t]);setNewCat("");setShowAddCat(false);}
  function removeCategory(cat){if(DEFAULT_CATEGORIES.includes(cat))return;setCategories(c=>c.filter(x=>x!==cat));setItems(p=>p.map(x=>x.category===cat?{...x,category:"Other Payments"}:x));setBucketCounts(p=>{const n={...p};delete n[cat];return n;});}
  function handleConfirm(){const map={};items.forEach(i=>{map[i.narrative]=i.category==="Skip"?"Other Payments":i.category;});onDone(transactions.map(t=>t.category==="Other Payments"&&map[t.narrative]?{...t,category:map[t.narrative]}:t),categories);}
  const pct=allItems.length?Math.round(((sorted.length+skipped.length)/allItems.length)*100):100;
  const txnCountByCat=useMemo(()=>{const counts={};transactions.forEach(t=>{if(t.category&&t.category!=="Other Payments")counts[t.category]=(counts[t.category]||0)+1;});return counts;},[transactions,items]);
  useEffect(()=>{const handler=e=>{if((e.ctrlKey||e.metaKey)&&e.key==='z'){e.preventDefault();undoLast();}};window.addEventListener('keydown',handler);return()=>window.removeEventListener('keydown',handler);},[undoHistory]);
  const SWIPE_THRESHOLD=80,CATS_PER_PAGE=4;
  const totalPages=Math.ceil(allBuckets.length/CATS_PER_PAGE);
  const visibleMobileCats=allBuckets.slice(mobileCatPage*CATS_PER_PAGE,(mobileCatPage+1)*CATS_PER_PAGE);
  function onTouchStart(e){touchStartX.current=e.touches[0].clientX;touchStartY.current=e.touches[0].clientY;}
  function onTouchMove(e){if(touchStartX.current===null)return;const dx=e.touches[0].clientX-touchStartX.current,dy=e.touches[0].clientY-touchStartY.current;if(Math.abs(dy)>Math.abs(dx)+10)return;e.preventDefault();setSwipeOffset(dx);if(dx>SWIPE_THRESHOLD&&visibleMobileCats[0])setSwipeTarget(visibleMobileCats[0]);else if(dx<-SWIPE_THRESHOLD&&visibleMobileCats[1])setSwipeTarget(visibleMobileCats[1]);else setSwipeTarget(null);}
  function onTouchEnd(){if(touchStartX.current===null)return;const topItem=unsorted[0];if(topItem&&swipeTarget)assignItem(topItem.narrative,swipeTarget);else{setSwipeOffset(0);setSwipeTarget(null);}touchStartX.current=null;touchStartY.current=null;}
  function getBucketIcon(cat, color, size=22){return <CatIcon cat={cat} size={size} color={color}/>;}
  const DesktopSort=()=>(
    <div style={{flex:1,display:"flex",minHeight:0,overflow:"hidden"}}>
      <div style={{width:280,flexShrink:0,background:"#0a0818",borderRight:"1px solid #1f1d35",display:"flex",flexDirection:"column",overflow:"hidden"}}>
        <div style={{padding:"16px 16px 12px",borderBottom:"1px solid #1f1d35",flexShrink:0}}>
          <div style={{fontSize:10,fontWeight:700,color:"#4b5563",letterSpacing:1.5,marginBottom:2}}>TO SORT</div>
          <div style={{fontSize:22,fontWeight:800,color:"#fff",fontVariantNumeric:"tabular-nums"}}>{unsorted.length} <span style={{fontSize:13,fontWeight:400,color:"#4b5563"}}>remaining</span></div>
          {continueSince&&<div style={{fontSize:10,color:"#6366f1",marginTop:4,fontWeight:600}}>New since {new Date(continueSince).toLocaleDateString("en-GB",{day:"numeric",month:"short"})}</div>}
        </div>
        <div style={{flex:1,padding:"12px 12px 8px",display:"flex",flexDirection:"column",gap:6,overflowY:"auto"}}>
          {unsorted.length===0&&(
            <div style={{textAlign:"center",padding:"32px 20px"}}>
              <div style={{width:150,margin:"0 auto 16px",opacity:0.78}}>
                <IllustrationSortBlocks/>
              </div>
              <div style={{fontSize:15,fontWeight:700,color:"#fff",marginBottom:8}}>All sorted!</div>
              <div style={{fontSize:12,color:"#4b5563",marginBottom:20}}>Your cash flow is ready.</div>
              <button onClick={handleConfirm} style={{padding:"10px 24px",background:"#6366f1",color:"#fff",border:"none",borderRadius:8,fontSize:13,fontWeight:700,cursor:"pointer"}}>View Cash Flow →</button>
            </div>
          )}
          {visible.map((item,idx)=>{
            const isTop=idx===0;
            return(
              <div key={item.narrative} draggable={isTop} onDragStart={e=>{dragRef.current=item.narrative;e.dataTransfer.effectAllowed='move';e.dataTransfer.setData('text/plain',item.narrative);}} onDragEnd={()=>{dragRef.current=null;setHoveredCat(null);}}
                style={{background:isTop?"linear-gradient(135deg,#1e1b38,#2d2a52)":"rgba(20,18,42,0.6)",border:`1px solid ${isTop?"#4338ca":"#1f1d35"}`,borderRadius:12,padding:isTop?"14px 14px 12px":"8px 14px",cursor:isTop?"grab":"default",opacity:isTop?1:0.5-(idx*0.08),transform:`scale(${1-idx*0.01})`,transformOrigin:"top center",userSelect:"none",flexShrink:0,boxShadow:isTop?"0 4px 20px rgba(0,0,0,0.4)":"none",transition:"opacity 0.2s"}}>
                {isTop&&<div style={{fontSize:9,fontWeight:700,color:"#6366f1",letterSpacing:1,marginBottom:6}}>DRAG TO SORT ↗</div>}
                <div style={{fontSize:isTop?13:11,fontWeight:isTop?600:400,color:isTop?"#e0e7ff":"#4b5563",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{item.narrative}</div>
                {isTop&&(
                  <div style={{display:"flex",alignItems:"center",gap:8,marginTop:8,paddingTop:8,borderTop:"1px solid #2d2a6e"}}>
                    <span style={{fontSize:18,fontWeight:800,color:"#a5b4fc",fontVariantNumeric:"tabular-nums"}}>£{Math.round(item.total).toLocaleString()}</span>
                    <span style={{fontSize:11,color:"#4b5563"}}>{item.count} occurrence{item.count>1?"s":""}</span>
                  </div>
                )}
              </div>
            );
          })}
          {unsorted.length>VISIBLE&&<div style={{textAlign:"center",padding:"8px 0",fontSize:11,color:"#374151"}}>+{unsorted.length-VISIBLE} more to sort</div>}
          {(()=>{const topItem=visible[0];const showHint=topItem&&INVESTMENT_SIGNALS.test(topItem.narrative)&&!investHintDismissed.includes(topItem.narrative)&&topItem.category!=="Investments";if(!showHint)return null;return(
            <div style={{margin:"8px 0 4px",background:"#0f0c2e",border:"1px solid rgba(16,185,129,0.4)",borderRadius:12,padding:"14px 16px",flexShrink:0}}>
              <div style={{fontSize:12,fontWeight:700,color:"#34d399",marginBottom:6}}>Looks like an investment deposit?</div>
              <div style={{fontSize:11,color:"#6ee7b7",lineHeight:1.5,marginBottom:10}}>Drop it into Investments to track it separately from your spending.</div>
              <button onClick={()=>{const next=[...investHintDismissed,topItem.narrative];setInvestHintDismissed(next);localStorage.setItem("abound_investment_hints_dismissed",JSON.stringify(next));}} style={{fontSize:11,color:"#10b981",background:"rgba(16,185,129,0.1)",border:"1px solid rgba(16,185,129,0.3)",borderRadius:6,padding:"4px 10px",cursor:"pointer",fontWeight:700}}>Got it ✓</button>
            </div>
          );})()}
        </div>
        {(sorted.length>0||skipped.length>0)&&(
          <div style={{borderTop:"1px solid #1f1d35",padding:"10px 12px",maxHeight:200,overflowY:"auto",flexShrink:0}}>
            <div style={{fontSize:10,fontWeight:700,color:"#4b5563",letterSpacing:1,marginBottom:6}}>SORTED ✓</div>
            {[...sorted,...skipped].slice(-8).map(item=>(
              <div key={item.narrative} style={{display:"flex",alignItems:"center",gap:6,padding:"4px 0",borderBottom:"1px solid #1a1830"}}>
                <div style={{width:6,height:6,borderRadius:"50%",background:item.category==="Skip"?"#374151":catColor(item.category,spendCats.indexOf(item.category)),flexShrink:0}}/>
                <div style={{flex:1,fontSize:10,color:"#4b5563",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{item.narrative}</div>
                <button onClick={()=>undoItem(item.narrative,item.category)} style={{fontSize:9,color:"#374151",border:"none",background:"none",cursor:"pointer",padding:"1px 4px",flexShrink:0}}>undo</button>
              </div>
            ))}
          </div>
        )}
      </div>
      <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
        <div style={{padding:"14px 20px 12px",borderBottom:"1px solid #1f1d35",display:"flex",alignItems:"center",gap:12,flexShrink:0}}>
          <div style={{fontSize:10,fontWeight:700,color:"#4b5563",letterSpacing:1.5}}>DROP INTO A CATEGORY</div>
          <div style={{flex:1}}/>
          <button onClick={undoLast} disabled={!undoHistory.length} title="Undo last (Ctrl+Z)" style={{padding:"5px 12px",background:undoHistory.length?"rgba(99,102,241,0.10)":"rgba(255,255,255,0.03)",border:`1px solid ${undoHistory.length?"#4338ca":"#2d2a6e"}`,borderRadius:7,color:undoHistory.length?"#818cf8":"#374151",fontSize:11,fontWeight:700,cursor:undoHistory.length?"pointer":"default",display:"flex",alignItems:"center",gap:5,transition:"all 0.2s"}}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 14 4 9l5-5"/><path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11"/></svg>
            Undo
          </button>
          {showAddCat?(
            <div style={{display:"flex",gap:6}}>
              <input autoFocus value={newCat} onChange={e=>setNewCat(e.target.value)} onKeyDown={e=>{if(e.key==="Enter")addCategory();if(e.key==="Escape")setShowAddCat(false);}} placeholder="Category name..." style={{padding:"5px 10px",background:"#1e1b38",border:"1px solid #4338ca",borderRadius:7,color:"#fff",fontSize:12,width:160}}/>
              <button onClick={addCategory} style={{padding:"5px 12px",background:"#6366f1",color:"#fff",border:"none",borderRadius:7,fontSize:12,fontWeight:700,cursor:"pointer"}}>Add</button>
              <button onClick={()=>setShowAddCat(false)} style={{padding:"5px 8px",background:"none",border:"1px solid #374151",borderRadius:7,color:"#6b7280",fontSize:12,cursor:"pointer"}}>×</button>
            </div>
          ):(
            <button onClick={()=>setShowAddCat(true)} style={{padding:"5px 14px",background:"rgba(99,102,241,0.12)",border:"1px dashed #4338ca",borderRadius:7,color:"#818cf8",fontSize:11,fontWeight:700,cursor:"pointer"}}>+ Add category</button>
          )}
        </div>
        <div style={{flex:1,padding:"16px 20px",overflow:"auto",display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(155px,1fr))",alignContent:"start",gap:12}}>
          {spendCats.map((cat,i)=>{
            const color=catColor(cat,i),isHovered=hoveredCat===cat;
            const totalCount=(txnCountByCat[cat]||0)+(bucketCounts[cat]||0);
            const isDefault=DEFAULT_CATEGORIES.includes(cat);
            return(
              <div key={cat} onDragEnter={e=>{e.preventDefault();setHoveredCat(cat);}} onDragOver={e=>{e.preventDefault();}} onDragLeave={e=>{if(!e.currentTarget.contains(e.relatedTarget))setHoveredCat(null);}} onDrop={e=>{e.preventDefault();dropIntoCat(cat);}}
                style={{border:`2px ${isHovered?"solid":"dashed"} ${isHovered?color:`${color}55`}`,borderRadius:14,padding:"14px 12px 12px",background:isHovered?`${color}1a`:"rgba(255,255,255,0.02)",transition:"all 0.15s",cursor:"default",display:"flex",flexDirection:"column",alignItems:"center",gap:8,position:"relative",boxShadow:isHovered?`0 0 24px ${color}33`:"none"}}>
                {!isDefault&&<button onClick={()=>removeCategory(cat)} style={{position:"absolute",top:6,right:8,fontSize:12,color:"#374151",border:"none",background:"none",cursor:"pointer",lineHeight:1,opacity:0.6}}>×</button>}
                <div style={{display:"flex",alignItems:"center",justifyContent:"center",width:30,height:30,marginTop:2}}>{getBucketIcon(cat,isHovered?"#fff":color,24)}</div>
                <div style={{fontSize:13,fontWeight:700,color:isHovered?"#fff":color,textAlign:"center",lineHeight:1.3}}>{cat}</div>
                <div style={{fontSize:10,fontWeight:600,color:totalCount>0?color:"#2d2a6e",background:totalCount>0?`${color}18`:"rgba(255,255,255,0.03)",borderRadius:20,padding:"2px 10px",border:`1px solid ${totalCount>0?`${color}44`:"#1f1d35"}`}}>
                  {totalCount>0?`${totalCount} txn${totalCount>1?"s":""}`:isHovered?"drop here":"empty"}
                </div>
              </div>
            );
          })}
          {investInCats&&(()=>{const ivHovered=hoveredCat==="Investments";const ivColor="#10b981";const ivCount=(txnCountByCat["Investments"]||0)+(bucketCounts["Investments"]||0);return(
            <div key="Investments" onDragEnter={e=>{e.preventDefault();setHoveredCat("Investments");}} onDragOver={e=>{e.preventDefault();}} onDragLeave={e=>{if(!e.currentTarget.contains(e.relatedTarget))setHoveredCat(null);}} onDrop={e=>{e.preventDefault();dropIntoCat("Investments");}}
              style={{border:`2px ${ivHovered?"solid":"dashed"} ${ivHovered?ivColor:`${ivColor}55`}`,borderRadius:14,padding:"14px 12px 12px",background:ivHovered?`${ivColor}1a`:"rgba(255,255,255,0.02)",transition:"all 0.15s",cursor:"default",display:"flex",flexDirection:"column",alignItems:"center",gap:8,boxShadow:ivHovered?`0 0 24px ${ivColor}33`:"none"}}>
              <div style={{display:"flex",alignItems:"center",justifyContent:"center",width:30,height:30,marginTop:2}}>{getBucketIcon("Investments",ivHovered?"#fff":ivColor,24)}</div>
              <div style={{fontSize:13,fontWeight:700,color:ivHovered?"#fff":ivColor,textAlign:"center",lineHeight:1.3}}>Investments</div>
              <div style={{fontSize:10,fontWeight:600,color:ivCount>0?ivColor:"#2d2a6e",background:ivCount>0?`${ivColor}18`:"rgba(255,255,255,0.03)",borderRadius:20,padding:"2px 10px",border:`1px solid ${ivCount>0?`${ivColor}44`:"#1f1d35"}`}}>
                {ivCount>0?`${ivCount} txn${ivCount>1?"s":""}`:ivHovered?"drop here":"empty"}
              </div>
            </div>
          );})()}
          {catRepaymentInCats&&(()=>{const crHovered=hoveredCat==="Card Repayment";const crColor="#ec4899";const crCount=(txnCountByCat["Card Repayment"]||0)+(bucketCounts["Card Repayment"]||0);return(
            <div key="Card Repayment" onDragEnter={e=>{e.preventDefault();setHoveredCat("Card Repayment");}} onDragOver={e=>{e.preventDefault();}} onDragLeave={e=>{if(!e.currentTarget.contains(e.relatedTarget))setHoveredCat(null);}} onDrop={e=>{e.preventDefault();dropIntoCat("Card Repayment");}}
              style={{border:`2px ${crHovered?"solid":"dashed"} ${crHovered?crColor:`${crColor}55`}`,borderRadius:14,padding:"14px 12px 12px",background:crHovered?`${crColor}1a`:"rgba(255,255,255,0.02)",transition:"all 0.15s",cursor:"default",display:"flex",flexDirection:"column",alignItems:"center",gap:8,boxShadow:crHovered?`0 0 24px ${crColor}33`:"none"}}>
              <div style={{display:"flex",alignItems:"center",justifyContent:"center",width:30,height:30,marginTop:2}}>{getBucketIcon("Card Repayment",crHovered?"#fff":crColor,24)}</div>
              <div style={{fontSize:13,fontWeight:700,color:crHovered?"#fff":crColor,textAlign:"center",lineHeight:1.3}}>Card Repayment</div>
              <div style={{fontSize:10,fontWeight:600,color:crCount>0?crColor:"#2d2a6e",background:crCount>0?`${crColor}18`:"rgba(255,255,255,0.03)",borderRadius:20,padding:"2px 10px",border:`1px solid ${crCount>0?`${crColor}44`:"#1f1d35"}`}}>
                {crCount>0?`${crCount} txn${crCount>1?"s":""}`:crHovered?"drop here":"empty"}
              </div>
            </div>
          );})()}
          {(()=>{const isHovered=hoveredCat==="Skip",count=skipped.length;return(
            <div onDragEnter={e=>{e.preventDefault();setHoveredCat("Skip");}} onDragOver={e=>{e.preventDefault();}} onDragLeave={e=>{if(!e.currentTarget.contains(e.relatedTarget))setHoveredCat(null);}} onDrop={e=>{e.preventDefault();dropIntoCat("Skip");}}
              style={{border:`2px dashed ${isHovered?"#9ca3af":"#374151"}`,borderRadius:14,padding:"14px 12px 12px",background:isHovered?"rgba(107,114,128,0.12)":"rgba(255,255,255,0.02)",transition:"all 0.15s",cursor:"default",display:"flex",flexDirection:"column",alignItems:"center",gap:8}}>
              <div style={{display:"flex",alignItems:"center",justifyContent:"center",width:30,height:30,opacity:isHovered?1:0.6,marginTop:2}}><svg viewBox="0 0 20 20" width="24" height="24" fill="none"><path stroke={isHovered?"#9ca3af":"#6b7280"} strokeWidth="1.5" strokeLinecap="round" d="M6 8c0-2.2 1.8-4 4-4s4 1.8 4 4c0 1.5-.8 2.8-2 3.5V13H8v-1.5C6.8 10.8 6 9.5 6 8z"/><path stroke={isHovered?"#9ca3af":"#6b7280"} strokeWidth="1.5" strokeLinecap="round" d="M8 16h4"/></svg></div>
              <div style={{fontSize:13,fontWeight:700,color:isHovered?"#9ca3af":"#6b7280",textAlign:"center",lineHeight:1.3}}>Not sure</div>
              <div style={{fontSize:10,fontWeight:600,color:count>0?"#6b7280":"#374151",background:"rgba(255,255,255,0.03)",borderRadius:20,padding:"2px 10px",border:"1px solid #1f1d35"}}>
                {count>0?`${count} txn${count>1?"s":""}`:isHovered?"drop here":"stays in Other Payments"}
              </div>
            </div>
          );})()}
        </div>
      </div>
    </div>
  );

const MobileSort=()=>{
    const topItem=unsorted[0];
    const addingCat=mobileAddingCat;
    const setAddingCat=setMobileAddingCat;

    function doAdd(){
      const t=mobileCatInput.trim();
      if(!t||categories.includes(t))return;
      setCategories(c=>[...c,t]);
      setMobileCatInput("");
      setMobileAddingCat(false);
    }
    return(
      <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden",overscrollBehavior:"none"}}>
        {/* Progress bar */}
        <div style={{padding:"12px 16px 8px",display:"flex",flexDirection:"column",gap:4,flexShrink:0}}>
          {continueSince&&<div style={{fontSize:10,color:"#6366f1",fontWeight:600,marginBottom:2}}>New since {new Date(continueSince).toLocaleDateString("en-GB",{day:"numeric",month:"short"})} — {allItems.length} item{allItems.length!==1?"s":""} to sort</div>}
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <div style={{flex:1,height:3,background:"#1f1d35",borderRadius:999,overflow:"hidden"}}>
              <div style={{height:"100%",width:`${pct}%`,background:"linear-gradient(90deg,#6366f1,#10b981)",transition:"width 0.4s"}}/>
            </div>
            <span style={{fontSize:11,color:pct===100?"#10b981":"#6366f1",fontWeight:700,flexShrink:0,fontVariantNumeric:"tabular-nums"}}>{sorted.length+skipped.length}/{allItems.length}</span>
          </div>
        </div>

        {/* Card stack */}
        <div style={{padding:"0 16px",flexShrink:0}}>
          {unsorted.length===0?(
            <div style={{textAlign:"center",padding:"24px 0 16px"}}>
              <div style={{width:100,margin:"0 auto 12px",opacity:0.7}}><IllustrationSortBlocks/></div>
              <div style={{fontSize:15,fontWeight:700,color:"#fff",marginBottom:8}}>All sorted!</div>
              <button onClick={handleConfirm} style={{padding:"10px 24px",background:"#6366f1",color:"#fff",border:"none",borderRadius:8,fontSize:13,fontWeight:700,cursor:"pointer"}}>Show cash flow →</button>
            </div>
          ):(
            <div style={{position:"relative",height:118,marginBottom:8}}>
              {visible.slice(1,3).map((item,idx)=>(
                <div key={item.narrative} style={{position:"absolute",top:0,left:0,right:0,background:`rgba(20,18,42,${1-(idx+1)*0.15})`,border:"1px solid #2d2a6e",borderRadius:14,padding:"14px",transform:`translateY(${(idx+1)*5}px) scale(${1-(idx+1)*0.025})`,transformOrigin:"top center",zIndex:1-idx}}/>
              ))}
              {topItem&&(
                <div style={{position:"absolute",top:0,left:0,right:0,background:"#1e1b38",border:"2px solid #4338ca",borderRadius:14,padding:"16px 18px",zIndex:10,userSelect:"none"}}>
                  <div style={{fontSize:13,fontWeight:600,color:"#c7d2fe",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",marginBottom:6}}>{topItem.narrative}</div>
                  <div style={{display:"flex",alignItems:"center",gap:10}}>
                    <span style={{fontSize:20,fontWeight:800,color:"#a5b4fc",fontVariantNumeric:"tabular-nums"}}>£{Math.round(topItem.total).toLocaleString()}</span>
                    <span style={{fontSize:11,color:"#4b5563"}}>{topItem.count} txn{topItem.count>1?"s":""} · {unsorted.length} left</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Category grid */}
        {unsorted.length>0&&(
          <div style={{flex:1,overflowY:"auto",overscrollBehavior:"contain",padding:"4px 16px 24px",WebkitOverflowScrolling:"touch",touchAction:"pan-y"}}>
            <div style={{marginBottom:10}}>
              <div style={{fontSize:13,fontWeight:700,color:"#e0e7ff",marginBottom:2}}>Which category does it belong to?</div>
              <div style={{fontSize:11,color:"#52525b"}}>Tap to assign.</div>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
              {allBuckets.map(cat=>{
                const isSkip=cat==="Skip";
                const color=isSkip?"#9ca3af":catColor(cat,spendCats.indexOf(cat));
                const count=isSkip?skipped.length:(txnCountByCat[cat]||0)+(bucketCounts[cat]||0);
                return(
                  <button key={cat}
                    onClick={()=>{if(unsorted[0])assignItem(unsorted[0].narrative,cat);}}
                    style={{padding:"13px 10px",background:`${color}14`,border:`1.5px solid ${color}55`,borderRadius:12,color,fontWeight:700,fontSize:13,cursor:"pointer",textAlign:"center",display:"flex",flexDirection:"column",gap:4,alignItems:"center",WebkitTapHighlightColor:"transparent",transition:"background 0.1s",touchAction:"manipulation"}}
                    onTouchStart={e=>e.currentTarget.style.background=`${color}28`}
                    onTouchEnd={e=>e.currentTarget.style.background=`${color}14`}>
                    <span style={{display:"flex",alignItems:"center",justifyContent:"center",width:24,height:24}}>
                      {isSkip
                        ?<svg width="18" height="18" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="7" stroke={color} strokeWidth="1.5"/><path d="M7 10h6M13 8l2 2-2 2" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                        :<CatIcon cat={cat} size={18} color={color}/>
                      }
                    </span>
                    <span style={{fontSize:12}}>{isSkip?"Skip":cat}</span>
                    {count>0&&<span style={{fontSize:9,fontWeight:500,opacity:0.6}}>{count} sorted</span>}
                  </button>
                );
              })}

              {/* Add category inline card */}
              {addingCat?(
                <div style={{gridColumn:"span 2",padding:"12px",background:"rgba(99,102,241,0.08)",border:"1.5px solid #6366f1",borderRadius:12,display:"flex",flexDirection:"column",gap:8}}>
                  <div style={{fontSize:10,fontWeight:700,color:"#6366f1",letterSpacing:"0.08em"}}>NEW CATEGORY</div>
                  <div style={{display:"flex",gap:6}}>
                    <input autoFocus value={mobileCatInput}
                      onChange={e=>setMobileCatInput(e.target.value)}
                      onKeyDown={e=>{if(e.key==="Enter")doAdd();if(e.key==="Escape"){setMobileAddingCat(false);setMobileCatInput("");}}}
                      placeholder="e.g. Healthcare..."
                      style={{flex:1,padding:"10px 12px",background:"#0f0e1a",border:"1px solid #2d2a6e",borderRadius:8,color:"#fff",fontSize:16,outline:"none"}}/>
                    <button onClick={doAdd} style={{padding:"10px 16px",background:"#6366f1",color:"#fff",border:"none",borderRadius:8,fontSize:14,fontWeight:700,cursor:"pointer",touchAction:"manipulation"}}>Add</button>
                    <button onClick={()=>{setMobileAddingCat(false);setMobileCatInput("");}} style={{padding:"10px 12px",background:"none",border:"1px solid #2d2a6e",borderRadius:8,color:"#6b7280",fontSize:14,cursor:"pointer",touchAction:"manipulation"}}>×</button>
                  </div>
                </div>
              ):(
                <button onClick={()=>setAddingCat(true)}
                  style={{padding:"13px 10px",background:"rgba(99,102,241,0.06)",border:"1.5px dashed #4338ca",borderRadius:12,color:"#6366f1",fontWeight:600,fontSize:12,cursor:"pointer",textAlign:"center",display:"flex",flexDirection:"column",gap:4,alignItems:"center",WebkitTapHighlightColor:"transparent",touchAction:"manipulation"}}
                  onTouchStart={e=>e.currentTarget.style.background="rgba(99,102,241,0.12)"}
                  onTouchEnd={e=>e.currentTarget.style.background="rgba(99,102,241,0.06)"}>
                  <span style={{display:"flex",alignItems:"center",justifyContent:"center",width:24,height:24}}>
                    <svg width="18" height="18" viewBox="0 0 20 20" fill="none"><path d="M10 4v12M4 10h12" stroke="#6366f1" strokeWidth="1.8" strokeLinecap="round"/></svg>
                  </span>
                  <span>Add category</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  return(
    <div style={{height:"100vh",maxHeight:"100vh",background:"#0f0e1a",display:"flex",flexDirection:"column",fontFamily:"'Inter',system-ui,sans-serif",overflow:"hidden"}}>
      <style>{GLOBAL_CSS}</style>
      <div style={{padding:"0 24px",background:"#0a0818",borderBottom:"1px solid #1f1d35",display:"flex",alignItems:"center",gap:16,flexShrink:0,height:54}}>
        <img src={logo} alt="Abound" style={{height:28,mixBlendMode:"screen"}}/>
        <div style={{width:1,height:24,background:"#1f1d35"}}/>
        <span style={{fontSize:14,fontWeight:800,color:"#fff"}}>Sort transactions</span>
        <div style={{flex:1,display:"flex",alignItems:"center",gap:10,maxWidth:320}}>
          <div style={{flex:1,height:4,background:"#1f1d35",borderRadius:999,overflow:"hidden"}}>
            <div style={{height:"100%",width:`${pct}%`,background:"linear-gradient(90deg,#6366f1,#10b981)",borderRadius:999,transition:"width 0.5s ease"}}/>
          </div>
          <span style={{fontSize:12,color:pct===100?"#10b981":"#6366f1",fontWeight:700,minWidth:32,fontVariantNumeric:"tabular-nums"}}>{pct}%</span>
        </div>
        <span style={{fontSize:12,color:"#4b5563"}}>{unsorted.length>0?`${unsorted.length} left · ${sorted.length+skipped.length} sorted`:"✅ All sorted!"}</span>
        <button onClick={handleConfirm} style={{padding:"7px 18px",background:pct===100?"linear-gradient(135deg,#10b981,#059669)":"#6366f1",color:"#fff",border:"none",borderRadius:8,fontSize:13,fontWeight:700,cursor:"pointer",marginLeft:"auto",transition:"background 0.3s"}}>Done →</button>
      </div>
      {isMobileView?<MobileSort/>:<DesktopSort/>}
    </div>
  );
}

// ─── Review Screen ────────────────────────────────────────────────────────────
function ReviewScreen({transactions, categories, onUpdate, onGoToCashFlow, onReviewEdit, reviewEditCount, nonRecurring=new Set(), onToggleNonRecurring}) {
  const [editCount, setEditCount] = useState(0);
  const [showUpdatedBanner, setShowUpdatedBanner] = useState(false);
  const [showMobileTip, setShowMobileTip] = useState(()=>!sessionStorage.getItem("reviewMobileTipSeen"));
  const [undoStack, setUndoStack] = useState([]); // [{narrative,date,amount,prevCategory}]
  const [filterCat, setFilterCat] = useState("All");
  const [filterAccount, setFilterAccount] = useState("All");
  const [search, setSearch] = useState("");
  const [sortMode, setSortMode] = useState("amount"); // "amount" | "category" | "date"
  const [oneOffTip, setOneOffTip] = useState(null);
  const isMobile = useIsMobile();
  const accounts = useMemo(()=>{const seen=new Set(),list=[];transactions.forEach(t=>{if(!seen.has(t.account)){seen.add(t.account);list.push(t.account);}});return list;},[transactions]);
  const sortedTxns = useMemo(()=>[...transactions].sort((a,b)=>{
    if(sortMode==="amount") return Math.abs(b.amount)-Math.abs(a.amount);
    if(sortMode==="category") return (a.category||"").localeCompare(b.category||"")||Math.abs(b.amount)-Math.abs(a.amount);
    if(sortMode==="date") return new Date(b.date)-new Date(a.date);
    return 0;
  }),[transactions,sortMode]);
  const filtered = useMemo(()=>sortedTxns.filter(t=>{if(filterCat!=="All"&&t.category!==filterCat)return false;if(filterAccount!=="All"&&t.account!==filterAccount)return false;if(search&&!t.narrative.toLowerCase().includes(search.toLowerCase()))return false;return true;}),[sortedTxns,filterCat,filterAccount,search]);
  function changeCategory(txn,newCat){
    setUndoStack(s=>[...s,{narrative:txn.narrative,date:txn.date,amount:txn.amount,prevCategory:txn.category}]);
    const updated=transactions.map(t=>t.narrative===txn.narrative&&t.date===txn.date&&t.amount===txn.amount?{...t,category:newCat}:t);
    onUpdate(updated);setEditCount(c=>c+1);if(onReviewEdit)onReviewEdit();if(editCount>=1)setShowUpdatedBanner(true);
  }
  function undoLastChange(){
    if(!undoStack.length) return;
    const last=undoStack[undoStack.length-1];
    const reverted=transactions.map(t=>t.narrative===last.narrative&&t.date===last.date&&t.amount===last.amount?{...t,category:last.prevCategory}:t);
    onUpdate(reverted);
    setUndoStack(s=>s.slice(0,-1));
    setEditCount(c=>Math.max(0,c-1));
  }
  const catColors={};categories.forEach((c,i)=>{catColors[c]=CATEGORY_COLORS[i%CATEGORY_COLORS.length];});
  const inputStyle={padding:"7px 12px",border:"1px solid var(--border)",borderRadius:8,fontSize:13,background:"var(--input-bg)",color:"var(--input-color)",outline:"none",cursor:"pointer"};
  useEffect(()=>{
    function onKey(e){if((e.metaKey||e.ctrlKey)&&e.key==="z"){e.preventDefault();undoLastChange();}}
    window.addEventListener("keydown",onKey);
    return()=>window.removeEventListener("keydown",onKey);
  },[undoStack]);
  return(
    <div style={{flex:1,overflow:"auto",background:"var(--app-bg)"}}>
      <style>{GLOBAL_CSS}</style>
      {oneOffTip&&(
        <div style={{position:"fixed",left:oneOffTip.x,top:oneOffTip.y,zIndex:9999,maxWidth:250,background:"var(--card)",border:"1px solid var(--border2)",borderRadius:10,padding:"10px 13px",fontSize:11,color:"var(--text)",lineHeight:1.65,pointerEvents:"none",boxShadow:"0 6px 24px rgba(0,0,0,0.4)",animation:"tooltipIn 0.15s ease both"}}>
          <div style={{fontWeight:700,color:"var(--text)",marginBottom:5}}>One-off transactions</div>
          Mark a transaction as a one-off expense — like a holiday, car repair, or big purchase. It's excluded from your rolling forecast averages so it won't inflate your predicted weekly spend going forward.
        </div>
      )}
      {showUpdatedBanner&&(
        <div style={{background:"linear-gradient(135deg,rgba(99,102,241,0.15),rgba(139,92,246,0.12))",borderBottom:"1px solid rgba(99,102,241,0.3)",padding:"14px 24px",display:"flex",alignItems:"center",gap:16,animation:"slideInUp 0.3s ease both"}}>
          <div style={{width:8,height:8,borderRadius:"50%",background:"#6366f1",boxShadow:"0 0 8px #6366f1",flexShrink:0}}/>
          <div style={{flex:1}}>
            <div style={{fontWeight:700,color:"#e0e7ff",fontSize:13}}>Good work — categories updated</div>
            <div style={{color:"#818cf8",fontSize:12}}>Head back to Cash Flow for your personalised financial analysis.</div>
          </div>
          <button onClick={onGoToCashFlow} style={{padding:"8px 18px",background:"linear-gradient(135deg,#6366f1,#4f46e5)",color:"#fff",border:"none",borderRadius:8,fontSize:13,fontWeight:700,cursor:"pointer",boxShadow:"0 2px 8px rgba(99,102,241,0.4)",flexShrink:0}}>View my analysis →</button>
          <button onClick={()=>setShowUpdatedBanner(false)} style={{fontSize:18,color:"#4b5563",background:"none",border:"none",cursor:"pointer",flexShrink:0}}>×</button>
        </div>
      )}
      <div style={{padding:isMobile?"12px 16px":"20px 24px"}}>
        {/* Header */}
        <div style={{marginBottom:20,display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:12}}>
          <div>
            <h2 style={{fontSize:20,fontWeight:800,color:"var(--text)",marginBottom:4,letterSpacing:"-0.02em"}}>Review Transactions</h2>
            <p style={{fontSize:13,color:"#52525b",margin:0}}>Fix any miscategorised transactions to sharpen your forecast.</p>
          </div>
          <button onClick={undoLastChange} disabled={!undoStack.length} title={isMobile?"Undo last change":"Undo last change (Ctrl+Z)"}
            style={{flexShrink:0,display:"flex",alignItems:"center",gap:6,padding:"8px 14px",borderRadius:8,border:`1px solid ${undoStack.length?"#4338ca":"#27272a"}`,background:undoStack.length?"rgba(99,102,241,0.15)":"rgba(255,255,255,0.03)",color:undoStack.length?"#a5b4fc":"#3f3f46",fontSize:13,fontWeight:600,cursor:undoStack.length?"pointer":"not-allowed",transition:"all 0.15s",marginTop:2}}
            onMouseEnter={e=>{if(undoStack.length){e.currentTarget.style.background="rgba(99,102,241,0.25)";e.currentTarget.style.borderColor="#6366f1";}}}
            onMouseLeave={e=>{if(undoStack.length){e.currentTarget.style.background="rgba(99,102,241,0.15)";e.currentTarget.style.borderColor="#4338ca";}}}>
            <svg width="13" height="13" viewBox="0 0 20 20" fill="none"><path d="M3 10a7 7 0 1 0 1.5-4.3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><path d="M3 4v6h6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
            Undo{undoStack.length>0&&<span style={{background:"rgba(99,102,241,0.3)",borderRadius:4,padding:"1px 5px",fontSize:11}}>{undoStack.length}</span>}
          </button>
        </div>
        {/* Filters */}
        <div style={{display:"flex",gap:8,marginBottom:16,flexWrap:"wrap",alignItems:"center"}}>
          <div style={{position:"relative",flex:isMobile?1:undefined}}>
            <svg width="14" height="14" viewBox="0 0 20 20" fill="none" style={{position:"absolute",left:10,top:"50%",transform:"translateY(-50%)",pointerEvents:"none"}}><circle cx="9" cy="9" r="5" stroke="#52525b" strokeWidth="1.6"/><path d="M14 14l3 3" stroke="#52525b" strokeWidth="1.6" strokeLinecap="round"/></svg>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search..." style={{...inputStyle,paddingLeft:30,width:isMobile?"100%":190}}/>
          </div>
          <select value={filterAccount} onChange={e=>setFilterAccount(e.target.value)} style={inputStyle}>
            <option value="All">All accounts</option>
            {accounts.map(a=><option key={a} value={a}>{a}</option>)}
          </select>
          <select value={filterCat} onChange={e=>setFilterCat(e.target.value)} style={inputStyle}>
            <option value="All">All categories</option>
            {categories.map(c=><option key={c} value={c}>{c}</option>)}
          </select>
          <div style={{display:"flex",gap:2,background:"var(--sort-bg)",borderRadius:8,border:"1px solid var(--border)",padding:2,flexShrink:0}}>
            {[["amount","£"],["date","Date"],["category","Cat"]].map(([m,label])=>(
              <button key={m} onClick={()=>setSortMode(m)} style={{padding:"4px 10px",borderRadius:6,border:"none",fontSize:11,fontWeight:700,cursor:"pointer",background:sortMode===m?"#6366f1":"transparent",color:sortMode===m?"#fff":"#4b5563",transition:"all 0.15s"}}>
                {label}
              </button>
            ))}
          </div>
          <div style={{marginLeft:"auto",whiteSpace:"nowrap"}}>
            <span style={{fontSize:12,color:"#4b5563"}}>
              {filtered.length} transaction{filtered.length!==1?"s":""}
              {editCount>0&&<span style={{marginLeft:8,color:"#10b981",fontWeight:600}}>· {editCount} edited</span>}
            </span>
          </div>
        </div>
        {/* Mobile onboarding tip */}
        {isMobile&&showMobileTip&&(
          <div style={{background:"rgba(99,102,241,0.12)",border:"1px solid rgba(99,102,241,0.35)",borderRadius:12,padding:"13px 16px",marginBottom:14,display:"flex",alignItems:"flex-start",gap:12,animation:"slideInUp 0.3s ease both"}}>
            <div style={{fontSize:22,flexShrink:0}}>👆</div>
            <div style={{flex:1}}>
              <div style={{fontSize:13,fontWeight:700,color:"var(--text)",marginBottom:3}}>Tap the coloured pill to fix a category</div>
              <div style={{fontSize:12,color:"#818cf8",lineHeight:1.5}}>The AI makes mistakes — spending 2 minutes here makes your forecast much more accurate.</div>
            </div>
            <button onClick={()=>{sessionStorage.setItem("reviewMobileTipSeen","1");setShowMobileTip(false);}} style={{fontSize:18,color:"#4b5563",background:"none",border:"none",cursor:"pointer",flexShrink:0,lineHeight:1,padding:0}}>×</button>
          </div>
        )}
        {/* Table */}
        <div style={{background:"var(--card)",borderRadius:12,border:"1px solid var(--border)",overflow:"hidden",boxShadow:"0 4px 24px rgba(0,0,0,0.3)"}}>
          {!isMobile&&(
            <div style={{display:"grid",gridTemplateColumns:"110px 1fr 110px 220px",background:"var(--tbl-hdr)",padding:"10px 16px",borderBottom:"1px solid var(--tbl-hdr-border)"}}>
              <div style={{fontSize:10,fontWeight:700,color:"#6366f1",letterSpacing:"0.1em"}}>DATE</div>
              <div style={{fontSize:10,fontWeight:700,color:"#6366f1",letterSpacing:"0.1em"}}>DESCRIPTION</div>
              <div style={{fontSize:10,fontWeight:700,color:"#6366f1",letterSpacing:"0.1em",textAlign:"right"}}>AMOUNT</div>
              <div style={{fontSize:10,fontWeight:700,color:"#6366f1",letterSpacing:"0.1em",paddingLeft:16,display:"flex",alignItems:"center",gap:7}}>
                CATEGORY
                <span
                  onMouseEnter={e=>{const r=e.currentTarget.getBoundingClientRect();setOneOffTip({x:r.left,y:r.bottom+8});}}
                  onMouseLeave={()=>setOneOffTip(null)}
                  style={{display:"inline-flex",alignItems:"center",justifyContent:"center",width:14,height:14,borderRadius:"50%",background:"rgba(255,255,255,0.1)",border:"1px solid rgba(255,255,255,0.3)",color:"rgba(255,255,255,0.6)",fontSize:9,fontWeight:700,cursor:"help",flexShrink:0,lineHeight:1}}>
                  ⓘ
                </span>
                <span style={{fontSize:9,color:"rgba(99,102,241,0.5)",letterSpacing:"0.06em",fontStyle:"italic"}}>+ ONE-OFF</span>
              </div>
            </div>
          )}
          {filtered.map((t,i)=>{
            const rowBg=i%2===0?"var(--row-even)":"var(--row-odd)";
            const hoverBg="var(--row-hover)";
            const amtColor=t.isIncome?"#10b981":"var(--text)";
            const pillBg=`${catColors[t.category]||"#6366f1"}22`;
            return isMobile ? (
              <div key={i} style={{padding:"13px 16px",borderBottom:"1px solid var(--row-border)",background:rowBg}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
                  <span style={{fontSize:11,color:"#4b5563"}}>{fmtDate(t.date)} · <span style={{color:"#374151"}}>{t.account==="Main Account"?"Main":t.account.replace("Credit Card","CC")}</span></span>
                  <span style={{fontSize:13,fontWeight:700,color:amtColor,fontVariantNumeric:"tabular-nums"}}>
                    {t.isIncome?"+":""}{`£${t.amount.toLocaleString(undefined,{maximumFractionDigits:2})}`}
                  </span>
                </div>
                <div style={{fontSize:13,color:"var(--txn-text)",marginBottom:10,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{t.narrative}</div>
                <div style={{display:"flex",gap:8,alignItems:"center"}}>
                  <select value={t.category||""} onChange={e=>changeCategory(t,e.target.value)}
                    style={{padding:"6px 12px",borderRadius:20,border:`1.5px solid ${catColors[t.category]||"#6366f1"}`,background:pillBg,color:catColors[t.category]||"#a5b4fc",fontSize:12,fontWeight:700,cursor:"pointer",outline:"none",flex:1}}>
                    {[...categories,...(categories.includes("Card Repayment")?[]:["Card Repayment"])].map(c=><option key={c} value={c} style={{background:"var(--input-bg)",color:"var(--input-color)"}}>{c}</option>)}
                  </select>
                  <button onClick={()=>onToggleNonRecurring&&onToggleNonRecurring(t.narrative)}
                    title="Mark as one-off — excludes from forecast"
                    style={{padding:"6px 10px",borderRadius:20,border:`1.5px solid ${nonRecurring.has(t.narrative)?"var(--oneoff-border-on)":"var(--oneoff-border)"}`,background:nonRecurring.has(t.narrative)?"var(--oneoff-bg-on)":"transparent",color:nonRecurring.has(t.narrative)?"var(--oneoff-text-on)":"var(--oneoff-text)",fontSize:11,fontWeight:700,cursor:"pointer",whiteSpace:"nowrap",flexShrink:0}}>
                    {nonRecurring.has(t.narrative)?"One-off ✓":"One-off"}
                  </button>
                </div>
              </div>
            ) : (
              <div key={i} style={{display:"grid",gridTemplateColumns:"110px 1fr 110px 220px",padding:"9px 16px",borderBottom:"1px solid var(--row-border)",background:rowBg,alignItems:"center",transition:"background 0.1s",cursor:"default"}}
                onMouseEnter={e=>e.currentTarget.style.background=hoverBg}
                onMouseLeave={e=>e.currentTarget.style.background=rowBg}>
                <div style={{fontSize:11,color:"#4b5563",fontVariantNumeric:"tabular-nums"}}>{fmtDate(t.date)}</div>
                <div style={{fontSize:12,color:"var(--txn-text)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",paddingRight:12}}>
                  <span style={{fontSize:10,color:"#374151",marginRight:6,display:"inline-block",background:"var(--acct-chip)",borderRadius:4,padding:"1px 5px"}}>{t.account==="Main Account"?"Main":t.account.replace("Credit Card","CC")}</span>
                  {t.narrative}
                </div>
                <div style={{fontSize:12,fontWeight:600,color:amtColor,textAlign:"right",fontVariantNumeric:"tabular-nums"}}>
                  {t.isIncome?"+":""}{`£${t.amount.toLocaleString(undefined,{maximumFractionDigits:2})}`}
                </div>
                <div style={{paddingLeft:16,display:"flex",gap:7,alignItems:"center"}}>
                  <select value={t.category||""} onChange={e=>changeCategory(t,e.target.value)}
                    style={{padding:"4px 10px",borderRadius:20,border:`1.5px solid ${catColors[t.category]||"#6366f1"}`,background:pillBg,color:catColors[t.category]||"#a5b4fc",fontSize:11,fontWeight:700,cursor:"pointer",outline:"none",flex:1,maxWidth:120}}>
                    {[...categories,...(categories.includes("Card Repayment")?[]:["Card Repayment"])].map(c=><option key={c} value={c} style={{background:"var(--input-bg)",color:"var(--input-color)"}}>{c}</option>)}
                  </select>
                  <button onClick={()=>onToggleNonRecurring&&onToggleNonRecurring(t.narrative)}
                    style={{padding:"4px 10px",borderRadius:20,
                      border:`1.5px solid ${nonRecurring.has(t.narrative)?"var(--oneoff-border-on)":"var(--oneoff-border)"}`,
                      background:nonRecurring.has(t.narrative)?"var(--oneoff-bg-on)":"transparent",
                      color:nonRecurring.has(t.narrative)?"var(--oneoff-text-on)":"var(--oneoff-text)",
                      fontSize:11,fontWeight:700,cursor:"pointer",whiteSpace:"nowrap",flexShrink:0,
                      transition:"all 0.15s",letterSpacing:"0.01em"}}
                    onMouseEnter={e=>{if(!nonRecurring.has(t.narrative)){e.currentTarget.style.background="rgba(99,102,241,0.07)";e.currentTarget.style.borderColor="var(--oneoff-border)";e.currentTarget.style.color="var(--oneoff-text)";}}}
                    onMouseLeave={e=>{if(!nonRecurring.has(t.narrative)){e.currentTarget.style.background="transparent";e.currentTarget.style.borderColor="var(--oneoff-border)";e.currentTarget.style.color="var(--oneoff-text)";}}}>
                    {nonRecurring.has(t.narrative)?"✓ One-off":"One-off"}
                  </button>
                </div>
              </div>
            );
          })}
          {filtered.length===0&&(
            <div style={{padding:"56px 24px",textAlign:"center"}}>
              <div style={{marginBottom:12,opacity:0.3,display:"flex",justifyContent:"center"}}><svg width="32" height="32" viewBox="0 0 20 20" fill="none"><circle cx="9" cy="9" r="5" stroke="#9ca3af" strokeWidth="1.5"/><path d="M14 14l3 3" stroke="#9ca3af" strokeWidth="1.5" strokeLinecap="round"/></svg></div>
              <div style={{fontSize:14,color:"#374151",fontWeight:600,marginBottom:4}}>No transactions found</div>
              <div style={{fontSize:12,color:"#2d2a6e"}}>Try adjusting your filters</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
// ─── Rotate Prompt ────────────────────────────────────────────────────────────
function useOrientation() {
  const [isLandscape, setIsLandscape] = useState(
    typeof window!=="undefined" ? window.innerWidth > window.innerHeight : true
  );
  useEffect(()=>{
    const handler = () => setIsLandscape(window.innerWidth > window.innerHeight);
    window.addEventListener("resize", handler);
    window.addEventListener("orientationchange", handler);
    return()=>{window.removeEventListener("resize",handler);window.removeEventListener("orientationchange",handler);};
  },[]);
  return isLandscape;
}

function RotateScreen() {
  return(
    <div style={{minHeight:"100vh",background:"#08070f",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"40px 24px",fontFamily:"'Inter',system-ui,sans-serif"}}>
      <style>{GLOBAL_CSS}</style>
      <div style={{position:"absolute",inset:0,background:"radial-gradient(ellipse at 50% 0%,rgba(99,102,241,0.1) 0%,transparent 55%)",pointerEvents:"none"}}/>
      <div style={{position:"relative",zIndex:1,textAlign:"center",maxWidth:320}}>
        {/* Animated phone rotation illustration */}
        <div style={{margin:"0 auto 32px",width:80,height:80,position:"relative"}}>
          <svg viewBox="0 0 80 80" fill="none" style={{width:80,height:80,animation:"rotatePhone 2.5s ease-in-out infinite"}}>
            <rect x="20" y="10" width="40" height="60" rx="6" stroke="rgba(99,102,241,0.8)" strokeWidth="2.5" fill="rgba(99,102,241,0.06)"/>
            <rect x="28" y="18" width="24" height="36" rx="2" fill="rgba(99,102,241,0.12)" stroke="rgba(99,102,241,0.3)" strokeWidth="1"/>
            <circle cx="40" cy="62" r="3" fill="rgba(99,102,241,0.6)"/>
            <path d="M52 38 L62 38 M58 34 L62 38 L58 42" stroke="rgba(99,102,241,0.9)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <div style={{fontSize:22,fontWeight:800,color:"#fff",marginBottom:10,letterSpacing:"-0.02em"}}>Rotate your phone</div>
        <div style={{fontSize:14,color:"#71717a",lineHeight:1.6,marginBottom:20}}>The cash flow table needs a bit more space — turn to landscape to see all 12 weeks.</div>
        {/* Rotation lock warning — the most common reason rotation doesn't work */}
        <div style={{background:"rgba(99,102,241,0.1)",border:"1px solid rgba(99,102,241,0.25)",borderRadius:12,padding:"14px 16px",marginBottom:24,textAlign:"left"}}>
          <div style={{fontSize:12,fontWeight:700,color:"#a5b4fc",marginBottom:8,display:"flex",alignItems:"center",gap:6}}>
            <span style={{fontSize:15}}>🔒</span> Screen not rotating? Check your rotation lock
          </div>
          <div style={{fontSize:12,color:"#6b7280",lineHeight:1.65}}>
            <span style={{color:"#9ca3af",fontWeight:600}}>iPhone:</span> Swipe down from the top-right corner to open Control Centre, then tap the <span style={{color:"#c4b5fd",fontWeight:600}}>rotation lock icon</span> to turn it off.<br/>
            <span style={{color:"#9ca3af",fontWeight:600,marginTop:4,display:"block"}}>Android:</span> Swipe down from the top to open the notification shade, then tap <span style={{color:"#c4b5fd",fontWeight:600}}>Auto rotate</span>.
          </div>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:8,justifyContent:"center"}}>
          <div style={{width:6,height:6,borderRadius:"50%",background:"#6366f1",animation:"pulse 1.5s ease-in-out infinite"}}/>
          <span style={{fontSize:12,color:"#374151"}}>Waiting for rotation...</span>
        </div>
      </div>
    </div>
  );
}

// ─── Insights Screen ──────────────────────────────────────────────────────────
function InsightsScreen({ transactions, categories, onGoToCashFlow }) {
  const isMobile = useIsMobile();
  const spendCats = useMemo(()=>categories.filter(c=>c!=="Income"&&c!=="Card Repayment"&&c!=="Investments"),[categories]);

  const stats = useMemo(()=>{
    const sym=getCurrencySymbol();
    const allWks=[...new Set(transactions.map(t=>getWeekMonday(t.date).toISOString().slice(0,10)))].sort();
    const recentWks=allWks.slice(-8);
    function wkSum(wks,pred){return wks.map(wk=>transactions.filter(t=>getWeekMonday(t.date).toISOString().slice(0,10)===wk&&pred(t)).reduce((s,t)=>s+Math.abs(t.amount),0));}
    const incomeByWk=wkSum(recentWks,t=>t.category==="Income");
    const avgIncome=incomeByWk.reduce((a,b)=>a+b,0)/Math.max(recentWks.length,1);
    const catAvg={};
    spendCats.forEach(c=>{const vals=wkSum(recentWks,t=>t.category===c);catAvg[c]=vals.reduce((a,b)=>a+b,0)/Math.max(recentWks.length,1);});
    const avgSpend=Object.values(catAvg).reduce((a,b)=>a+b,0);
    const weeklyNet=avgIncome-avgSpend;
    const monday=getWeekMonday(new Date());
    const forecastDates=Array.from({length:7},(_,i)=>new Date(monday.getTime()+i*7*24*60*60*1000));
    const balances=forecastDates.map((_,i)=>Math.round(i*weeklyNet));
    const minVal=Math.min(...balances);
    const lowIdx=balances.indexOf(minVal);
    const topCats=Object.entries(catAvg).filter(([,v])=>v>0).sort((a,b)=>b[1]-a[1]).slice(0,3).map(([c,v])=>({cat:c,amount:Math.round(v)}));
    const salTot=transactions.filter(t=>t.category==="Income").reduce((s,t)=>s+Math.abs(t.amount),0);
    const spTot=transactions.filter(t=>spendCats.includes(t.category)).reduce((s,t)=>s+Math.abs(t.amount),0);
    const invTot=Math.round(transactions.filter(t=>t.category==="Investments").reduce((s,t)=>s+Math.abs(t.amount),0));
    const cTotals={};
    spendCats.forEach(c=>{cTotals[c]=Math.round(transactions.filter(t=>t.category===c).reduce((s,t)=>s+Math.abs(t.amount),0));});
    const topCat=Object.entries(cTotals).sort((a,b)=>b[1]-a[1])[0]?.[0]||"";
    return{sym,allWks,weekCount:allWks.length,avgIncome:Math.round(avgIncome),avgSpend:Math.round(avgSpend),weeklyNet:Math.round(weeklyNet),balances,forecastDates,lowIdx,lowVal:minVal,topCats,catAvg,cTotals,topCat,salaryTotal:Math.round(salTot),netCashFlow:Math.round(salTot-spTot),invTotal:invTot};
  },[transactions,spendCats]);

  const{sym:currSym,weekCount,avgIncome,avgSpend,weeklyNet,balances,forecastDates,lowIdx,lowVal,topCats,catAvg,cTotals,topCat,salaryTotal,netCashFlow,invTotal}=stats;

  const WIZARD_KEY="abound_insights_wizard";
  const savedWizard=useMemo(()=>{try{return JSON.parse(localStorage.getItem(WIZARD_KEY)||"null");}catch{return null;}},[]);
  const [wizStep,setWizStep]=useState(()=>savedWizard?.complete?"chat":1);
  const [animKey,setAnimKey]=useState(0);
  const [oneOffText,setOneOffText]=useState(savedWizard?.oneOffText||"");
  const [goals,setGoals]=useState(()=>new Set(savedWizard?.goals||[]));
  const [chatDisplay,setChatDisplay]=useState(()=>{try{return JSON.parse(localStorage.getItem("abound_insights_chat")||"[]");}catch{return[];}});
  const [chatApiHistory,setChatApiHistory]=useState(()=>{try{return JSON.parse(localStorage.getItem("abound_chat_api_history")||"[]");}catch{return[];}});
  const [chatInput,setChatInput]=useState("");
  const [chatLoading,setChatLoading]=useState(false);
  const [initLoading,setInitLoading]=useState(false);
  const [showPremiumGate,setShowPremiumGate]=useState(false);
  const chatEndRef=useRef(null);
  const isPro=isPremium();

  useEffect(()=>{try{localStorage.setItem("abound_insights_chat",JSON.stringify(chatDisplay));}catch{}},[chatDisplay]);
  useEffect(()=>{try{localStorage.setItem("abound_chat_api_history",JSON.stringify(chatApiHistory));}catch{}},[chatApiHistory]);
  useEffect(()=>{chatEndRef.current?.scrollIntoView({behavior:"smooth"});},[chatDisplay,chatLoading]);

  function saveWizard(data){try{localStorage.setItem(WIZARD_KEY,JSON.stringify(data));}catch{}}
  function goNextStep(n){setAnimKey(k=>k+1);setWizStep(n);}
  function toggleGoal(g){setGoals(prev=>{const n=new Set(prev);n.has(g)?n.delete(g):n.add(g);return n;});}

  function buildCtx(){
    const monthCount=Math.max(weekCount/4.33,1);
    const MONTHLY_CATS=["Rent","Memberships"];
    const catLines=Object.entries(cTotals).filter(([,v])=>v>0).sort((a,b)=>b[1]-a[1]).slice(0,8).map(([c,v])=>MONTHLY_CATS.includes(c)?`${c}: ${currSym}${Math.round(v/monthCount)}/month`:`${c}: ${currSym}${Math.round(v/Math.max(weekCount,1))}/wk`).join(", ");
    const goalsCtx=goals.size>0?`\nUser goals: ${[...goals].join(", ")}.`:"";
    const oneOffCtx=oneOffText.trim()?`\nUser noted one-off costs: "${oneOffText}".`:"";
    const lowDateStr=forecastDates[lowIdx]?.toLocaleDateString("en-GB",{day:"numeric",month:"short"});
    const lowCtx=`\nForecast: balance ${weeklyNet>=0?"grows":"drops"} by ${currSym}${Math.abs(weeklyNet)}/wk on avg. Lowest projected point: w/c ${lowDateStr}, ${lowVal<0?`goes negative by ${currSym}${Math.abs(lowVal)}`:`${currSym}${lowVal} from current`}. Top spend categories: ${topCats.map(c=>`${c.cat} ${currSym}${c.amount}/wk`).join(", ")}.`;
    const invNote=invTotal>0?`\nInvestment deposits: ${currSym}${invTotal} total (tracked separately).`:"";
    return `You are a concise, direct personal finance advisor inside Abound (${weekCount} weeks of data). Snapshot: ${currSym}${avgSpend}/wk spend, ${currSym}${avgIncome}/wk income, net ${currSym}${Math.abs(netCashFlow)} ${netCashFlow>=0?"surplus":"deficit"}, top category: ${topCat}. Category breakdown: ${catLines||"(none)"}.${invNote}${lowCtx}${oneOffCtx}${goalsCtx} Reply in 4 sentences max. Use ${currSym} and exact data numbers. No bullet points unless explicitly asked.`;
  }

  async function startChat(){
    if(initLoading)return;
    saveWizard({oneOffText,goals:[...goals],complete:true});
    setWizStep("chat");setInitLoading(true);
    const ctx=buildCtx();
    const goalsStr=goals.size>0?` Goals: ${[...goals].join(", ")}.`:"";
    const oneOffStr=oneOffText.trim()?` One-offs noted: ${oneOffText}.`:"";
    const seed=`${ctx}\n\nUser:${oneOffStr}${goalsStr} Give me a 4-sentence personalised analysis: biggest risk, what's driving it, and your single most actionable recommendation.`;
    const apiMsgs=[{role:"user",content:seed}];
    try{
      const text=await callClaudeMessages(apiMsgs,500,30000);
      setChatApiHistory([...apiMsgs,{role:"assistant",content:text}]);
      setChatDisplay([{role:"assistant",content:text}]);
    }catch(e){
      setChatDisplay([{role:"assistant",content:`Couldn't generate your analysis — ${e.message||"please try again"}.`}]);
    }
    setInitLoading(false);
  }

  async function sendChat(msg){
    if(!msg.trim()||chatLoading)return;
    if(!isPro&&chatApiHistory.length>2){setShowPremiumGate(true);return;}
    const ctx=buildCtx();
    const apiMsgs=chatApiHistory.length===0?[{role:"user",content:`${ctx}\n\nUser: ${msg}`}]:[...chatApiHistory,{role:"user",content:msg}];
    setChatDisplay(prev=>[...prev,{role:"user",content:msg}]);
    setChatInput("");setChatLoading(true);
    try{
      const text=await callClaudeMessages(apiMsgs,500,25000);
      setChatApiHistory([...apiMsgs,{role:"assistant",content:text}]);
      setChatDisplay(prev=>[...prev,{role:"assistant",content:text}]);
    }catch(e){
      setChatDisplay(prev=>[...prev,{role:"assistant",content:`Sorry — ${e.message||"please try again"}.`}]);
    }
    setChatLoading(false);
  }

  function restart(){
    setWizStep(1);setAnimKey(k=>k+1);setOneOffText("");setGoals(new Set());
    setChatDisplay([]);setChatApiHistory([]);
    ["abound_insights_wizard","abound_insights_chat","abound_chat_api_history","abound_insights_phase","abound_insights_oneoff","abound_insights_goals"].forEach(k=>localStorage.removeItem(k));
  }

  const goesNeg=lowVal<0;
  const lowDateStr=forecastDates[lowIdx]?.toLocaleDateString("en-GB",{day:"numeric",month:"short",year:"numeric"});
  const lowDateShort=forecastDates[lowIdx]?.toLocaleDateString("en-GB",{day:"numeric",month:"short"});

  const GOALS=["Build an emergency fund","Pay off debt / credit card","Cut my weekly spending","Save for a goal","Grow my investments","Understand my cash flow"];

  function MiniChart(){
    const W=400,H=130,PL=12,PR=12,PT=20,PB=26;
    const n=balances.length;
    const minB=Math.min(...balances,0);
    const maxB=Math.max(...balances,0);
    const yRange=Math.max(maxB-minB,200);
    const toX=i=>PL+(i/(n-1))*(W-PL-PR);
    const toY=v=>PT+(1-(v-minB)/yRange)*(H-PT-PB);
    const pts=balances.map((b,i)=>[toX(i),toY(b)]);
    const zeroY=toY(0);
    function smoothD(points){
      if(points.length<2)return"";
      let d=`M${points[0][0].toFixed(1)},${points[0][1].toFixed(1)}`;
      for(let i=1;i<points.length;i++){const p=points[i-1],c=points[i],cpx=(p[0]+c[0])/2;d+=` C${cpx.toFixed(1)},${p[1].toFixed(1)} ${cpx.toFixed(1)},${c[1].toFixed(1)} ${c[0].toFixed(1)},${c[1].toFixed(1)}`;}
      return d;
    }
    const pathD=smoothD(pts);
    const areaD=`${pathD} L${pts[n-1][0].toFixed(1)},${zeroY.toFixed(1)} L${pts[0][0].toFixed(1)},${zeroY.toFixed(1)} Z`;
    const lowPt=pts[lowIdx];
    const wkLabels=forecastDates.map((d,i)=>{
      if(i===0)return{x:toX(i),label:"Now"};
      if(i===n-1||i===Math.floor(n/2))return{x:toX(i),label:d.toLocaleDateString("en-GB",{day:"numeric",month:"short"})};
      return null;
    }).filter(Boolean);
    const labelAbove=lowPt[1]>PT+28;
    const labelX=Math.min(Math.max(lowPt[0],44),W-44);
    const labelY=labelAbove?lowPt[1]-14:lowPt[1]+22;
    return(
      <svg viewBox={`0 0 ${W} ${H}`} style={{width:"100%",height:"auto",overflow:"visible",display:"block"}}>
        <defs>
          <linearGradient id="igFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={goesNeg?"#ef4444":"#6366f1"} stopOpacity={goesNeg?"0.2":"0.15"}/>
            <stop offset="100%" stopColor={goesNeg?"#ef4444":"#6366f1"} stopOpacity="0.01"/>
          </linearGradient>
          <linearGradient id="igLine" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#818cf8"/>
            <stop offset="100%" stopColor={goesNeg?"#ef4444":"#6366f1"}/>
          </linearGradient>
        </defs>
        {minB<0&&<line x1={PL} y1={zeroY} x2={W-PR} y2={zeroY} stroke="rgba(99,102,241,0.25)" strokeWidth="1" strokeDasharray="5,4"/>}
        <path d={areaD} fill="url(#igFill)"/>
        <path d={pathD} fill="none" stroke="url(#igLine)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
        <circle cx={pts[0][0]} cy={pts[0][1]} r="3.5" fill="#818cf8"/>
        {wkLabels.map(({x,label},i)=>(
          <text key={i} x={x} y={H-4} textAnchor="middle" fontSize="9" fill="rgba(156,163,175,0.7)">{label}</text>
        ))}
        <circle cx={lowPt[0]} cy={lowPt[1]} r="11" fill="none" stroke={goesNeg?"rgba(239,68,68,0.3)":"rgba(245,158,11,0.35)"} strokeWidth="1.5">
          <animate attributeName="r" values="8;14;8" dur="2.2s" repeatCount="indefinite"/>
          <animate attributeName="opacity" values="0.5;0.1;0.5" dur="2.2s" repeatCount="indefinite"/>
        </circle>
        <circle cx={lowPt[0]} cy={lowPt[1]} r="5" fill={goesNeg?"#ef4444":"#f59e0b"} stroke={goesNeg?"rgba(239,68,68,0.5)":"rgba(245,158,11,0.5)"} strokeWidth="2"/>
        <text x={labelX} y={labelY} textAnchor="middle" fontSize="10" fontWeight="700" fill={goesNeg?"#f87171":"#fbbf24"}>
          {goesNeg?`-${currSym}${Math.abs(lowVal).toLocaleString()}`:`${currSym}${lowVal.toLocaleString()} low`}
        </text>
      </svg>
    );
  }

  function StepDots({current}){
    return(
      <div style={{display:"flex",alignItems:"center",gap:0,marginBottom:24}}>
        {[1,2,3].map((n,i)=>(
          <>
            {i>0&&<div key={`line-${n}`} style={{flex:1,height:1.5,background:n<=current?"#6366f1":"rgba(99,102,241,0.18)",maxWidth:36,transition:"background 0.5s"}}/>}
            <div key={`dot-${n}`} style={{width:28,height:28,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",background:n<current?"#6366f1":n===current?"rgba(99,102,241,0.12)":"transparent",border:n<current?"none":`2px solid ${n===current?"#6366f1":"rgba(99,102,241,0.22)"}`,transition:"all 0.35s",flexShrink:0}}>
              {n<current
                ?<svg width="11" height="11" viewBox="0 0 12 12" fill="none"><path d="M2.5 6l2.5 2.5L9.5 3.5" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
                :<span style={{fontSize:11,fontWeight:700,color:n===current?"#818cf8":"rgba(99,102,241,0.35)"}}>{n}</span>
              }
            </div>
          </>
        ))}
        <div style={{marginLeft:10,fontSize:10,color:"var(--text3)",fontWeight:500,flexShrink:0}}>Step {Math.min(current,3)} of 3</div>
      </div>
    );
  }

  function TypingDots(){
    return(
      <div style={{display:"flex",gap:10,alignItems:"flex-start"}}>
        <div style={{width:30,height:30,borderRadius:8,background:"linear-gradient(135deg,#6366f1,#4f46e5)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
          <span style={{fontSize:11,color:"#fff",fontWeight:800}}>✦</span>
        </div>
        <div style={{padding:"12px 15px",background:"var(--card)",border:"1px solid var(--snap-border)",borderRadius:"4px 12px 12px 12px",display:"flex",gap:5,alignItems:"center"}}>
          {[0,1,2].map(i=><div key={i} style={{width:5,height:5,borderRadius:"50%",background:"#6366f1",animation:`typingDot 1.2s ease-in-out ${i*180}ms infinite`}}/>)}
        </div>
      </div>
    );
  }

  return(
    <div style={{display:"flex",flexDirection:"column",height:"100%",background:"var(--app-bg)",overflow:"hidden"}}>

      {wizStep!=="chat"&&(
        <>
          <div style={{flexShrink:0,padding:"12px 24px",background:"var(--snapshot-bg)",borderBottom:"1px solid var(--snap-border)",display:"flex",alignItems:"center",gap:8}}>
            <div style={{width:22,height:22,borderRadius:6,background:"linear-gradient(135deg,#6366f1,#4f46e5)",display:"flex",alignItems:"center",justifyContent:"center"}}>
              <span style={{fontSize:10,color:"#fff",fontWeight:800}}>✦</span>
            </div>
            <span style={{fontSize:12,fontWeight:700,color:"var(--text)"}}>AI Insights</span>
            <span style={{fontSize:11,color:"var(--text3)",marginLeft:4}}>— personalised analysis</span>
          </div>

          <div style={{flex:1,overflowY:"auto",padding:isMobile?"20px 16px 36px":"28px 32px 44px",display:"flex",flexDirection:"column"}}>
            <div key={animKey} style={{animation:"insightFadeIn 0.38s cubic-bezier(0.16,1,0.3,1) both",flex:1,display:"flex",flexDirection:"column"}}>
              <StepDots current={wizStep}/>

              {wizStep===1&&(
                <>
                  <h2 style={{fontSize:isMobile?19:23,fontWeight:800,color:"var(--text)",margin:"0 0 8px",letterSpacing:"-0.025em",lineHeight:1.2}}>
                    {goesNeg?"Your balance is forecast to dip negative":"Let's look at your forecast"}
                  </h2>
                  <p style={{fontSize:13,color:"var(--text2)",margin:"0 0 18px",lineHeight:1.65,maxWidth:480}}>
                    {goesNeg
                      ?`Your cash balance is projected to go negative around w/c ${lowDateStr}. Here's what's putting pressure on it.`
                      :`Your lowest forecast point is the week of ${lowDateStr}. Here's what's driving your spending.`
                    }
                  </p>
                  <div style={{background:"var(--card)",border:`1px solid ${goesNeg?"rgba(239,68,68,0.2)":"var(--snap-border)"}`,borderRadius:12,padding:"16px 14px 10px",marginBottom:16,position:"relative",overflow:"visible"}}>
                    {goesNeg&&(
                      <div style={{position:"absolute",top:10,right:12,fontSize:10,fontWeight:700,color:"#ef4444",background:"rgba(239,68,68,0.1)",border:"1px solid rgba(239,68,68,0.2)",borderRadius:20,padding:"2px 8px",zIndex:1}}>
                        ⚠ Goes negative
                      </div>
                    )}
                    <MiniChart/>
                  </div>
                  {topCats.length>0&&(
                    <div style={{marginBottom:22}}>
                      <div style={{fontSize:10,fontWeight:700,color:"var(--text3)",letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:10}}>Top spending categories</div>
                      {topCats.map(({cat,amount},i)=>{
                        const barW=topCats[0].amount>0?Math.round((amount/topCats[0].amount)*100):0;
                        return(
                          <div key={cat} style={{display:"flex",alignItems:"center",gap:10,marginBottom:9}}>
                            <div style={{width:22,height:22,borderRadius:5,background:`rgba(99,102,241,${0.16-i*0.04})`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                              <span style={{fontSize:10,color:"#818cf8",fontWeight:700}}>{i+1}</span>
                            </div>
                            <div style={{flex:1}}>
                              <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                                <span style={{fontSize:12,fontWeight:600,color:"var(--text)"}}>{cat}</span>
                                <span style={{fontSize:12,fontWeight:700,color:"#818cf8"}}>{currSym}{amount.toLocaleString()}<span style={{fontSize:9,color:"var(--text3)",fontWeight:400}}>/wk avg</span></span>
                              </div>
                              <div style={{height:3,borderRadius:2,background:"rgba(99,102,241,0.1)",overflow:"hidden"}}>
                                <div style={{width:`${barW}%`,height:"100%",background:"linear-gradient(90deg,#6366f1,#818cf8)",borderRadius:2}}/>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                  <div style={{marginTop:"auto",paddingTop:8}}>
                    <button onClick={()=>goNextStep(2)}
                      style={{padding:"11px 28px",background:"linear-gradient(135deg,#6366f1,#4f46e5)",color:"#fff",border:"none",borderRadius:9,fontSize:13,fontWeight:700,cursor:"pointer",boxShadow:"0 2px 14px rgba(99,102,241,0.35)"}}>
                      Next →
                    </button>
                  </div>
                </>
              )}

              {wizStep===2&&(
                <>
                  <h2 style={{fontSize:isMobile?19:23,fontWeight:800,color:"var(--text)",margin:"0 0 8px",letterSpacing:"-0.025em",lineHeight:1.2}}>
                    Any one-off costs?
                  </h2>
                  <p style={{fontSize:13,color:"var(--text2)",margin:"0 0 18px",lineHeight:1.65,maxWidth:480}}>
                    Were any recent costs unusual — a car repair, annual subscription, holiday, or big one-time purchase? Your regular spending may be lower than it looks.
                  </p>
                  <textarea value={oneOffText} onChange={e=>setOneOffText(e.target.value)}
                    placeholder="e.g. Car service £380, flight to Lisbon £220… (or leave blank to skip)"
                    rows={4}
                    style={{width:"100%",boxSizing:"border-box",padding:"12px 14px",background:"var(--input-bg)",border:"1px solid var(--border2)",borderRadius:10,color:"var(--text)",fontSize:13,resize:"none",fontFamily:"inherit",lineHeight:1.55,outline:"none",marginBottom:20,transition:"border-color 0.2s"}}
                    onFocus={e=>e.target.style.borderColor="#6366f1"}
                    onBlur={e=>e.target.style.borderColor=""}/>
                  <div style={{display:"flex",gap:10,marginTop:"auto"}}>
                    <button onClick={()=>goNextStep(3)}
                      style={{padding:"11px 28px",background:"linear-gradient(135deg,#6366f1,#4f46e5)",color:"#fff",border:"none",borderRadius:9,fontSize:13,fontWeight:700,cursor:"pointer",boxShadow:"0 2px 14px rgba(99,102,241,0.35)"}}>
                      Next →
                    </button>
                    <button onClick={()=>{setOneOffText("");goNextStep(3);}}
                      style={{padding:"11px 18px",background:"none",border:"1px solid var(--snap-border)",color:"var(--text3)",borderRadius:9,fontSize:13,cursor:"pointer"}}>
                      Nothing unusual
                    </button>
                  </div>
                </>
              )}

              {wizStep===3&&(
                <>
                  <h2 style={{fontSize:isMobile?19:23,fontWeight:800,color:"var(--text)",margin:"0 0 8px",letterSpacing:"-0.025em",lineHeight:1.2}}>
                    What's your financial goal?
                  </h2>
                  <p style={{fontSize:13,color:"var(--text2)",margin:"0 0 18px",lineHeight:1.65,maxWidth:480}}>
                    Pick one or more — this shapes the advice and priorities in your analysis.
                  </p>
                  <div style={{display:"flex",flexWrap:"wrap",gap:9,marginBottom:24}}>
                    {GOALS.map(g=>{
                      const sel=goals.has(g);
                      return(
                        <button key={g} onClick={()=>toggleGoal(g)}
                          style={{padding:"9px 16px",border:`1.5px solid ${sel?"#6366f1":"rgba(99,102,241,0.2)"}`,borderRadius:22,background:sel?"rgba(99,102,241,0.14)":"var(--card)",color:sel?"#a5b4fc":"var(--text3)",fontSize:12,fontWeight:sel?700:400,cursor:"pointer",transition:"all 0.18s",display:"flex",alignItems:"center",gap:6}}>
                          {sel&&<svg width="10" height="10" viewBox="0 0 12 12" fill="none"><path d="M2.5 6l2.5 2.5L9.5 3.5" stroke="#a5b4fc" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                          {g}
                        </button>
                      );
                    })}
                  </div>
                  <div style={{marginTop:"auto"}}>
                    <button onClick={startChat}
                      style={{padding:"11px 28px",background:"linear-gradient(135deg,#6366f1,#4f46e5)",color:"#fff",border:"none",borderRadius:9,fontSize:13,fontWeight:700,cursor:"pointer",boxShadow:"0 2px 14px rgba(99,102,241,0.35)",display:"flex",alignItems:"center",gap:8}}>
                      <svg width="13" height="13" viewBox="0 0 20 20" fill="none"><path d="M10 2l1.8 3.6 4 .6-2.9 2.8.68 4-3.58-1.88L6.42 13l.68-4L4.2 6.2l4-.6L10 2z" fill="#fff" stroke="#fff" strokeWidth="0.5" strokeLinejoin="round"/></svg>
                      Get my analysis
                    </button>
                    {goals.size===0&&<p style={{margin:"10px 0 0",fontSize:11,color:"var(--text3)"}}>No goal selected — you can skip and explore with AI</p>}
                  </div>
                </>
              )}
            </div>
          </div>
        </>
      )}

      {wizStep==="chat"&&(
        <>
          <div style={{flexShrink:0,background:"var(--snapshot-bg)",borderBottom:"1px solid var(--snap-border)",padding:"10px 20px"}}>
            <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
              <div style={{display:"flex",alignItems:"center",gap:6}}>
                <div style={{width:22,height:22,borderRadius:6,background:"linear-gradient(135deg,#6366f1,#4f46e5)",display:"flex",alignItems:"center",justifyContent:"center"}}>
                  <span style={{fontSize:10,color:"#fff",fontWeight:800}}>✦</span>
                </div>
                <span style={{fontSize:11,fontWeight:700,color:"#818cf8",letterSpacing:"0.04em"}}>AI INSIGHTS</span>
              </div>
              <div style={{display:"flex",alignItems:"center",gap:5}}>
                <span style={{fontSize:10,color:"var(--text3)"}}>Low point:</span>
                <span style={{fontSize:10,fontWeight:700,color:goesNeg?"#f87171":"#fbbf24"}}>
                  {goesNeg?`-${currSym}${Math.abs(lowVal).toLocaleString()}`:`${currSym}${lowVal.toLocaleString()}`} w/c {lowDateShort}
                </span>
              </div>
              {goals.size>0&&(
                <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
                  {[...goals].map(g=>(
                    <span key={g} style={{fontSize:9,padding:"2px 7px",background:"rgba(99,102,241,0.1)",border:"1px solid rgba(99,102,241,0.22)",borderRadius:20,color:"#818cf8",fontWeight:600}}>
                      {g}
                    </span>
                  ))}
                </div>
              )}
              <button onClick={restart} style={{marginLeft:"auto",fontSize:10,color:"var(--text3)",background:"none",border:"none",cursor:"pointer",display:"flex",alignItems:"center",gap:3,flexShrink:0,padding:"3px 6px",borderRadius:5}}>
                ↩ Start over
              </button>
            </div>
          </div>

          <div style={{flex:1,overflowY:"auto",padding:isMobile?"16px 14px":"20px 24px",display:"flex",flexDirection:"column",gap:14}}>
            {initLoading&&<TypingDots/>}
            {chatDisplay.map((msg,i)=>(
              <div key={i} style={{display:"flex",gap:10,justifyContent:msg.role==="user"?"flex-end":"flex-start",animation:"insightFadeIn 0.3s ease both"}}>
                {msg.role==="assistant"&&(
                  <div style={{width:30,height:30,borderRadius:8,background:"linear-gradient(135deg,#6366f1,#4f46e5)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,marginTop:2}}>
                    <span style={{fontSize:11,color:"#fff",fontWeight:800}}>✦</span>
                  </div>
                )}
                <div style={{maxWidth:"80%",padding:"11px 14px",borderRadius:msg.role==="user"?"11px 11px 2px 11px":"4px 11px 11px 11px",background:msg.role==="user"?"linear-gradient(135deg,#6366f1,#4f46e5)":"var(--card)",border:msg.role==="user"?"none":"1px solid var(--snap-border)",fontSize:12,color:msg.role==="user"?"#fff":"var(--text)",lineHeight:1.7,whiteSpace:"pre-wrap"}}>
                  {msg.content}
                </div>
              </div>
            ))}
            {chatLoading&&<TypingDots/>}
            <div ref={chatEndRef}/>
          </div>

          <div style={{flexShrink:0,padding:"10px 12px",borderTop:"1px solid var(--snap-border)",background:"var(--snapshot-bg)"}}>
            {(!isPro&&chatApiHistory.length>2)?(
              <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:8,padding:"8px 0"}}>
                <span style={{fontSize:12,color:"var(--text3)"}}>You've reached the free chat limit</span>
                <button onClick={()=>setShowPremiumGate(true)}
                  style={{padding:"8px 22px",background:"linear-gradient(135deg,#6366f1,#4f46e5)",color:"#fff",border:"none",borderRadius:7,fontSize:12,fontWeight:700,cursor:"pointer"}}>
                  Upgrade to continue chatting
                </button>
              </div>
            ):(
              <div style={{display:"flex",gap:6,alignItems:"flex-end"}}>
                <textarea value={chatInput} onChange={e=>setChatInput(e.target.value)}
                  onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey&&chatInput.trim()){e.preventDefault();sendChat(chatInput);}}}
                  placeholder="Ask a follow-up… (Enter to send)"
                  rows={2}
                  disabled={initLoading}
                  style={{flex:1,padding:"8px 11px",background:"var(--input-bg)",border:"1px solid var(--border2)",borderRadius:8,color:"var(--text)",fontSize:12,resize:"none",fontFamily:"inherit",lineHeight:1.45,outline:"none",transition:"border-color 0.2s",opacity:initLoading?0.4:1}}
                  onFocus={e=>e.target.style.borderColor="#6366f1"}
                  onBlur={e=>e.target.style.borderColor=""}/>
                <button onClick={()=>sendChat(chatInput)} disabled={!chatInput.trim()||chatLoading||initLoading}
                  style={{padding:"0 15px",height:54,background:chatInput.trim()&&!initLoading?"linear-gradient(135deg,#6366f1,#4f46e5)":"rgba(99,102,241,0.1)",color:chatInput.trim()&&!initLoading?"#fff":"#4b5563",border:"none",borderRadius:8,fontSize:16,fontWeight:700,cursor:chatInput.trim()&&!initLoading?"pointer":"not-allowed",flexShrink:0,transition:"all 0.2s"}}>
                  ↑
                </button>
              </div>
            )}
          </div>
        </>
      )}

      {showPremiumGate&&<UpgradeModal runsUsed={getAiRunsUsed()} onUpgrade={redirectToCheckout} onDismiss={()=>setShowPremiumGate(false)}/>}
    </div>
  );
}

// ─── Main Shell ───────────────────────────────────────────────────────────────

function OrientationGate({children}) {
  const isMobile = useIsMobile();
  const isLandscape = useOrientation();
  if(isMobile && !isLandscape) return <RotateScreen/>;
  return children;
}
function MainScreen({transactions: initialTransactions, categories, onStartOver, onFeedback, onAddAccount}) {
  const [transactions, setTransactions] = useState(()=>initialTransactions.map(t=>t.category==="Salary"?{...t,category:"Income"}:t));
  const [activeTab, setActiveTab] = useState("cashflow");
  const [showReviewPrompt, setShowReviewPrompt] = useState(true);
  const [reviewEditCount, setReviewEditCount] = useState(0);
  const [nonRecurring, setNonRecurring] = useState(new Set());
  const [showInlineUpgrade, setShowInlineUpgrade] = useState(false);
  const [insightsVisited, setInsightsVisited] = useState(false);
  const [showWizardCard, setShowWizardCard] = useState(false);
  const isMobile = useIsMobile();
  const userIsPremium = isPremium();
  const runsUsed = getAiRunsUsed();
  const runsLeft = Math.max(0, FREE_AI_RUNS - runsUsed);
  const otherCount = transactions.filter(t=>t.category==="Other Payments").length;
  function goToReview(){setActiveTab("review");setShowReviewPrompt(false);}
  function goToInsights(){setInsightsVisited(true);setActiveTab("insights");}
  function onTourFinish(){if(!localStorage.getItem("abound_wizard_dismissed"))setShowWizardCard(true);}
  function toggleNonRecurring(narrative){setNonRecurring(s=>{const n=new Set(s);n.has(narrative)?n.delete(narrative):n.add(narrative);return n;});}
  return(
    <div style={{display:"flex",flexDirection:"column",height:"100vh",fontFamily:"'Inter',system-ui,sans-serif"}}>
      <style>{GLOBAL_CSS}</style>

      <div style={{background:"var(--nav-bg)",borderBottom:"1px solid var(--nav-border)",padding:"0 24px",display:isMobile&&activeTab==="cashflow"?"none":"flex",alignItems:"center",height:57,flexShrink:0}}>
        <img src={logo} alt="Abound" style={{height:36,marginRight:24,mixBlendMode:"screen"}}/>
        <button onClick={()=>setActiveTab("cashflow")} style={{padding:"0 18px",height:"100%",border:"none",borderBottom:activeTab==="cashflow"?`2px solid ${PURPLE}`:"2px solid transparent",background:"none",fontSize:13,fontWeight:activeTab==="cashflow"?700:500,color:activeTab==="cashflow"?"var(--nav-tab-active)":"var(--nav-tab-inactive)",cursor:"pointer",transition:"all 0.2s",display:"flex",alignItems:"center",gap:5}}>
          <svg width="13" height="13" viewBox="0 0 20 20" fill="none"><path stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" d="M3 15l4-6 4 3 4-8"/></svg>Cash Flow
        </button>
        {!isMobile&&<button onClick={goToReview} style={{padding:"0 18px",height:"100%",border:"none",borderBottom:activeTab==="review"?`2px solid ${PURPLE}`:"2px solid transparent",background:"none",fontSize:13,fontWeight:activeTab==="review"?700:500,color:activeTab==="review"?"var(--nav-tab-active)":"var(--nav-tab-inactive)",cursor:"pointer",transition:"all 0.2s",display:"flex",alignItems:"center",gap:6}}>
          <svg width="13" height="13" viewBox="0 0 20 20" fill="none"><circle cx="9" cy="9" r="5" stroke="currentColor" strokeWidth="1.8"/><path d="M14 14l3 3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>Review Transactions
          {otherCount>0&&<span style={{background:"#ef4444",color:"#fff",borderRadius:10,fontSize:10,fontWeight:700,padding:"1px 6px",lineHeight:1.4}}>{otherCount}</span>}
        </button>}
        {!isMobile&&<button onClick={goToInsights} style={{padding:"0 18px",height:"100%",border:"none",borderBottom:activeTab==="insights"?`2px solid ${PURPLE}`:"2px solid transparent",background:"none",fontSize:13,fontWeight:activeTab==="insights"?700:500,color:activeTab==="insights"?"var(--nav-tab-active)":"var(--nav-tab-inactive)",cursor:"pointer",transition:"all 0.2s",display:"flex",alignItems:"center",gap:6,position:"relative"}}>
          <svg width="13" height="13" viewBox="0 0 20 20" fill="none"><path d="M10 2l1.8 3.6 4 .6-2.9 2.8.68 4-3.58-1.88L6.42 13l.68-4L4.2 6.2l4-.6L10 2z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"/></svg><span style={{color:"#818cf8",marginRight:1}}>✦</span>Insights
          {!insightsVisited&&<span style={{position:"absolute",top:10,right:6,width:6,height:6,borderRadius:"50%",background:"#6366f1",animation:"insightsPulse 2s ease-in-out infinite"}}/>}
        </button>}
        {/* Plan badge */}
        <div style={{marginLeft:"auto",display:"flex",alignItems:"center",gap:8,flexShrink:0}}>
          {userIsPremium?(
            <div style={{display:"flex",alignItems:"center",gap:5,padding:"4px 10px",background:"rgba(16,185,129,0.1)",border:"1px solid rgba(16,185,129,0.25)",borderRadius:20,fontSize:11,fontWeight:700,color:"#10b981"}}>
              <svg width="10" height="10" viewBox="0 0 20 20" fill="none"><path d="M10 2l2.4 4.8 5.3.8-3.85 3.75.91 5.3L10 14.27l-4.76 2.38.91-5.3L2.3 7.6l5.3-.8L10 2z" fill="#10b981"/></svg>
              Premium
            </div>
          ):(
            <button onClick={()=>setShowInlineUpgrade(true)} style={{display:"flex",alignItems:"center",gap:6,padding:"5px 12px",background:"rgba(99,102,241,0.12)",border:"1px solid rgba(99,102,241,0.3)",borderRadius:20,fontSize:11,fontWeight:700,color:"#a5b4fc",cursor:"pointer",transition:"all 0.15s"}}
              onMouseEnter={e=>{e.currentTarget.style.background="rgba(99,102,241,0.22)";}}
              onMouseLeave={e=>{e.currentTarget.style.background="rgba(99,102,241,0.12)";}}>
              <svg width="10" height="10" viewBox="0 0 20 20" fill="none"><path d="M10 2l2.4 4.8 5.3.8-3.85 3.75.91 5.3L10 14.27l-4.76 2.38.91-5.3L2.3 7.6l5.3-.8L10 2z" fill="#a5b4fc"/></svg>
              {isMobile?"Upgrade":`Free · ${runsLeft} AI run${runsLeft!==1?"s":""} left · Upgrade`}
            </button>
          )}
          <button onClick={onFeedback} style={{padding:isMobile?"8px 10px":"6px 16px",height:36,background:"linear-gradient(135deg,#6366f1,#4f46e5)",color:"#fff",border:"none",borderRadius:8,fontSize:isMobile?11:13,fontWeight:700,cursor:"pointer",boxShadow:"0 2px 8px rgba(99,102,241,0.35)",display:"flex",alignItems:"center",gap:4,flexShrink:0}}>
            {isMobile?"Review":"Leave a review"}
          </button>
          {!isMobile&&<button onClick={onStartOver} style={{fontSize:12,color:"#374151",border:"none",background:"none",cursor:"pointer",opacity:0.5}}>← Start over</button>}
        </div>
        {showInlineUpgrade&&<UpgradeModal runsUsed={runsUsed} onUpgrade={redirectToCheckout} onDismiss={()=>setShowInlineUpgrade(false)}/>}
      </div>
      {showWizardCard&&(
        <div style={{background:"var(--nav-bg)",borderBottom:"2px solid #6366f1",padding:"12px 24px",display:"flex",alignItems:"center",gap:12,flexShrink:0,flexWrap:"wrap",animation:"slideInUp 0.3s ease both"}}>
          <span style={{fontSize:12,fontWeight:700,color:"#a5b4fc",flexShrink:0}}>What would you like to do next?</span>
          <button onClick={()=>{setShowWizardCard(false);goToReview();}} style={{padding:"6px 14px",background:"rgba(99,102,241,0.18)",color:"#a5b4fc",border:"1px solid rgba(99,102,241,0.4)",borderRadius:8,fontSize:12,fontWeight:600,cursor:"pointer"}}>Review Transactions →</button>
          <button onClick={()=>{setShowWizardCard(false);goToInsights();}} style={{padding:"6px 14px",background:"rgba(99,102,241,0.18)",color:"#a5b4fc",border:"1px solid rgba(99,102,241,0.4)",borderRadius:8,fontSize:12,fontWeight:600,cursor:"pointer"}}>AI Insights →</button>
          <button onClick={()=>{setShowWizardCard(false);try{localStorage.setItem("abound_wizard_dismissed","1");}catch{}}} style={{marginLeft:"auto",fontSize:11,color:"#4b5563",background:"none",border:"none",cursor:"pointer"}}>Skip</button>
        </div>
      )}
      {activeTab==="cashflow"&&showReviewPrompt&&!isMobile&&(()=>{
        const otherCount=transactions.filter(t=>t.category==="Other Payments").length;
        return(
        <div style={{background:"linear-gradient(135deg,rgba(99,102,241,0.18),rgba(139,92,246,0.14))",borderBottom:"1px solid rgba(99,102,241,0.25)",padding:"10px 24px",display:"flex",alignItems:"center",gap:16,flexShrink:0}}>
          <svg width="18" height="18" viewBox="0 0 20 20" fill="none" flexShrink="0"><circle cx="9" cy="9" r="5" stroke="#a5b4fc" strokeWidth="1.8"/><path d="M14 14l3 3" stroke="#a5b4fc" strokeWidth="1.8" strokeLinecap="round"/></svg>
          <div style={{flex:1}}>
            <div style={{fontWeight:700,color:"#e0e7ff",fontSize:13}}>{otherCount>0?`${otherCount} transaction${otherCount!==1?"s":""} need${otherCount===1?"s":""} a category`:"Double-check your categories"}</div>
            <div style={{color:"#818cf8",fontSize:12}}>{otherCount>0?"These are in 'Other Payments' — sorting them improves your forecast.":"A quick review makes your forecast dramatically more accurate."}</div>
          </div>
          <button onClick={goToReview} style={{padding:"7px 16px",background:"rgba(99,102,241,0.25)",color:"#a5b4fc",border:"1px solid rgba(99,102,241,0.4)",borderRadius:8,fontSize:13,fontWeight:700,cursor:"pointer",flexShrink:0}}>Review now →</button>
          <button onClick={()=>setShowReviewPrompt(false)} style={{fontSize:18,color:"#4b5563",background:"none",border:"none",cursor:"pointer",flexShrink:0}}>×</button>
        </div>
        );
      })()}
      <div style={{display:activeTab==="cashflow"?"flex":"none",flex:1,flexDirection:"column",overflow:"hidden",minHeight:0}}><OrientationGate><CashFlowScreen transactions={transactions} categories={categories} onGoToReview={goToReview} showReviewPrompt={showReviewPrompt} onUpdateTxns={setTransactions} reviewEditCount={reviewEditCount} onGoToCashFlow={()=>setActiveTab("cashflow")} onGoToInsights={goToInsights} nonRecurring={nonRecurring} onToggleNonRecurring={toggleNonRecurring} onFeedback={onFeedback} onTourFinish={onTourFinish} onAddAccount={onAddAccount}/></OrientationGate></div>
      {activeTab==="review"&&<ReviewScreen transactions={transactions} categories={categories} onUpdate={setTransactions} onGoToCashFlow={()=>setActiveTab("cashflow")} onReviewEdit={()=>setReviewEditCount(c=>c+1)} reviewEditCount={reviewEditCount} nonRecurring={nonRecurring} onToggleNonRecurring={toggleNonRecurring}/>}
      {activeTab==="insights"&&<InsightsScreen transactions={transactions} categories={categories} onGoToCashFlow={()=>setActiveTab("cashflow")}/>}
    </div>
  );
}

function AnimatedCursor({targetSelector, offsetX=0, offsetY=0}) {
  const [pos, setPos] = useState(null);
  const [cellRect, setCellRect] = useState(null);
  const [clicking, setClicking] = useState(false);

  useEffect(()=>{
    function measure(){
      let el = null;
      // Handle special selectors that encode intent rather than CSS
      if(targetSelector==="actual-cell"){
        // Find first non-zero actual data cell in tbody
        const tds = document.querySelectorAll("tbody td");
        for(const td of tds){
          const txt = td.textContent?.trim();
          if(txt && txt !== "-" && /^\d/.test(txt)){el=td;break;}
        }
      } else if(targetSelector==="forecast-cell"){
        // Derive column index from the forecast header rather than hardcoding
        const forecastHdrs = document.querySelectorAll("thead tr:first-child th[data-tour='forecast']");
        const targetHdr = forecastHdrs[1] || forecastHdrs[0];
        if(targetHdr){
          const colIdx = targetHdr.cellIndex;
          const rows = document.querySelectorAll("tbody tr.abound-row");
          for(const row of rows){
            const td = row.cells[colIdx];
            if(!td) continue;
            const txt = td.textContent?.trim();
            if(txt && txt !== "-" && /\d/.test(txt)){el=td;break;}
          }
        }
      } else {
        el = document.querySelector(targetSelector);
      }
     if(!el) return;
      const r = el.getBoundingClientRect();
      if(r.width===0||r.height===0) return;
      setCellRect({left:r.left, top:r.top, width:r.width, height:r.height});
      setPos({x: r.left + r.width*0.5 - 4, y: r.top + r.height*0.5 - 4});
    }
    measure();
    const t = setTimeout(measure, 600);
    window.addEventListener("resize", measure);
    return ()=>{ clearTimeout(t); window.removeEventListener("resize", measure); };
  },[targetSelector]);

  useEffect(()=>{
    if(!pos) return;
    if(targetSelector==="actual-cell") return; // no clicking on actual step
    const interval = setInterval(()=>{
      setClicking(true);
      setTimeout(()=>setClicking(false), 350);
    }, 1800);
    return ()=>clearInterval(interval);
  },[pos, targetSelector]);

  if(!pos||!cellRect) return null;
  return(
    <>
      {/* Cell highlight box */}
      <div style={{
        position:"fixed",
        left:cellRect.left-3,
        top:cellRect.top-3,
        width:cellRect.width+6,
        height:cellRect.height+6,
        borderRadius:6,
        border:"2px solid #818cf8",
        background:"rgba(99,102,241,0.35)",
        boxShadow:"0 0 0 2px rgba(99,102,241,0.5),0 0 28px rgba(99,102,241,0.6),inset 0 0 12px rgba(165,180,252,0.3)",
        pointerEvents:"none",
        zIndex:1003,
        animation:"glow 1.4s ease-in-out infinite"
      }}/>
      {/* Cursor */}
      <div style={{position:"fixed", left:pos.x, top:pos.y, zIndex:1005, pointerEvents:"none", animation:"cursorFadeIn 0.4s ease both"}}>
        {clicking&&(
          <div style={{position:"absolute",left:-12,top:-12,width:24,height:24,borderRadius:"50%",border:"2px solid #6366f1",animation:"ripple 0.5s ease-out both",pointerEvents:"none"}}/>
        )}
        <svg width="22" height="26" viewBox="0 0 22 26" fill="none"
          style={{animation:"cursorFloat 1.8s ease-in-out infinite", filter:"drop-shadow(0 2px 4px rgba(0,0,0,0.4))"}}>
          <path d="M1 1l7 18 3.5-5.5L18 17 1 1z" fill="white" stroke="#1a1a2e" strokeWidth="1.5" strokeLinejoin="round"/>
          <path d="M1 1l7 18 3.5-5.5L18 17 1 1z" fill="white" opacity="0.9"/>
        </svg>
        {clicking&&(
          <div style={{position:"absolute",left:-6,top:-6,width:14,height:14,borderRadius:"50%",background:"rgba(99,102,241,0.4)",animation:"cursorClick 0.35s ease both",pointerEvents:"none"}}/>
        )}
      </div>
    </>
  );
}

// ─── Income Events helpers ────────────────────────────────────────────────────
function normDay(d){if(!d)return null;const n=new Date(d);n.setHours(0,0,0,0);return n;}
function getIncomeOccurrencesInWeek(ev, weekStart, weekEnd) {
  if (!ev.expectedDate) return [];
  const base = normDay(ev.expectedDate);
  const originalDOM = base.getDate();
  if (ev.recurrence === 'none') {
    return (base >= weekStart && base <= weekEnd) ? [new Date(base)] : [];
  }
  function nextOcc(d) {
    const r = new Date(d);
    if (ev.recurrence === 'weekly') { r.setDate(r.getDate()+7); }
    else if (ev.recurrence === 'biweekly') { r.setDate(r.getDate()+14); }
    else { // monthly — preserve original DOM, snap to month-end if needed
      r.setDate(1);
      r.setMonth(r.getMonth()+1);
      r.setDate(Math.min(originalDOM, new Date(r.getFullYear(),r.getMonth()+1,0).getDate()));
    }
    return r;
  }
  // Walk forward from base (the first occurrence) until we reach the week
  let occ = new Date(base);
  while (occ < weekStart) occ = nextOcc(occ);
  return (occ <= weekEnd) ? [new Date(occ)] : [];
}
function projectIncomeEvents(events, weeks) {
  return weeks.map(w => {
    const pills = [];
    events.forEach(ev => {
      if (ev.status === 'received' && ev.receivedDate) {
        const recvDate=normDay(ev.receivedDate), expDate=normDay(ev.expectedDate);
        const recvInWk = recvDate && recvDate >= w.date && recvDate <= w.sunday;
        const expInWk  = expDate  && expDate  >= w.date && expDate  <= w.sunday;
        if (recvInWk) pills.push({ ev, date: recvDate, isReceived: true });
        else if (expInWk) pills.push({ ev, date: expDate, isGhost: true });
      } else {
        const occs = getIncomeOccurrencesInWeek(ev, w.date, w.sunday);
        if (occs.length) pills.push({ ev, date: occs[0] });
      }
    });
    return pills;
  });
}

// ─── Cash Flow Screen ─────────────────────────────────────────────────────────
function CashFlowScreen({transactions, categories, onGoToReview, showReviewPrompt=false, onUpdateTxns, reviewEditCount, onGoToCashFlow, onGoToInsights=()=>{}, nonRecurring=new Set(), onToggleNonRecurring=()=>{}, onFeedback, onTourFinish=()=>{}, onAddAccount=null}) {
  const isMobile = useIsMobile();
  const [hiddenCats, setHiddenCats] = useState(new Set());
  const [collapsedAccounts, setCollapsedAccounts] = useState(new Set());
  const [monthlyBudgets, setMonthlyBudgets] = useState(()=>{try{return JSON.parse(localStorage.getItem("abound_budget_targets")||"{}");}catch{return {};}});
  const [showBudgetPanel, setShowBudgetPanel] = useState(false);
  const [showHomeScreenGuide, setShowHomeScreenGuide] = useState(false);
 const [tourStep, setTourStep] = useState(null);
  const [tourVisible, setTourVisible] = useState(false);
  const [investigationOpen, setInvestigationOpen] = useState(false);
  const [tourHighlightTick, setTourHighlightTick] = useState(0);
  const [showStocksTooltip, setShowStocksTooltip] = useState(false);
  const [tooltip, setTooltip] = useState(null);
  const tooltipTimer = useRef(null);
  function showTooltip(text, x, y) {
    if(tooltipTimer.current) clearTimeout(tooltipTimer.current);
    setTooltip({text, x, y});
    tooltipTimer.current = setTimeout(()=>setTooltip(null), 3000);
  }
  const [events, setEvents] = useState([]);
  const [editingEvent, setEditingEvent] = useState(null);
  const [incomeEvents, setIncomeEvents] = useState(()=>{try{return JSON.parse(localStorage.getItem("abound_income_events")||"[]").map(e=>({...e,expectedDate:e.expectedDate?new Date(e.expectedDate):null,receivedDate:e.receivedDate?new Date(e.receivedDate):null}));}catch{return[];}});
  const [incomeFormState, setIncomeFormState] = useState(null);
  const [reconcileState, setReconcileState] = useState({});
  useEffect(()=>{try{localStorage.setItem("abound_income_events",JSON.stringify(incomeEvents.map(e=>({...e,expectedDate:e.expectedDate?.toISOString(),receivedDate:e.receivedDate?.toISOString()}))));}catch{}},[incomeEvents]);
  // Auto-match income transactions to declared income events on mount
  useEffect(()=>{
    const incomeTxns=transactions.filter(t=>t.category==="Income"||t.category==="Salary");
    if(!incomeTxns.length||!incomeEvents.length)return;
    let changed=false;
    const updated=incomeEvents.map(ev=>{
      if(ev.status!=='expected'||!ev.expectedDate)return ev;
      const match=incomeTxns.find(t=>{
        const diff=ev.amount>0?Math.abs(t.amount-ev.amount)/ev.amount:0;
        return diff<=0.05&&Math.abs(t.date-ev.expectedDate)/86400000<=5;
      });
      if(match){changed=true;return{...ev,status:'received',receivedAmount:match.amount,receivedDate:match.date};}
      return ev;
    });
    if(changed)setIncomeEvents(updated);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[]);
  useEffect(()=>{try{localStorage.setItem("abound_budget_targets",JSON.stringify(monthlyBudgets));}catch{}},[monthlyBudgets]);
  function openAddIncomeForm(x,y){const d=new Date();d.setDate(d.getDate()+30);setIncomeFormState({editId:null,x,y,data:{label:'',amount:'',expectedDate:d.toISOString().slice(0,10),recurrence:'none'}});}
  const fmtDateInput=d=>d?`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`:'';
  function openEditIncomeForm(ev,x,y){setIncomeFormState({editId:ev.id,x,y,data:{label:ev.label,amount:String(ev.amount),expectedDate:fmtDateInput(normDay(ev.expectedDate)),recurrence:ev.recurrence||'none'}});}
  function saveIncomeForm(){if(!incomeFormState)return;const{editId,data}=incomeFormState;const amount=parseFloat(data.amount);if(!data.label||isNaN(amount)||amount<=0||!data.expectedDate)return;const ev={id:editId||String(Date.now()),label:data.label,amount,expectedDate:new Date(data.expectedDate+'T00:00:00'),recurrence:data.recurrence,status:'expected'};if(editId){setIncomeEvents(evs=>evs.map(e=>e.id===editId?{...e,...ev}:e));}else{setIncomeEvents(evs=>[...evs,ev]);}setIncomeFormState(null);}
  function deleteIncomeEvent(){if(!incomeFormState?.editId)return;setIncomeEvents(evs=>evs.filter(e=>e.id!==incomeFormState.editId));setIncomeFormState(null);}
  const [salarySuggestionDismissed,setSalarySuggestionDismissed]=useState(()=>{try{return JSON.parse(localStorage.getItem("abound_salary_suggestion_dismissed")||"[]");}catch{return[];}});
  const salarySuggestion=useMemo(()=>{
    if(!incomeFormState||incomeFormState.editId) return null;
    const now=new Date();now.setHours(0,0,0,0);
    const sixWeeksAgo=new Date(now);sixWeeksAgo.setDate(now.getDate()-42);
    const candidates=transactions.filter(t=>{
      if(!t.isIncome||t.amount<500) return false;
      if(t.category==="Transfers"||t.category==="Investments") return false;
      if(t.date<sixWeeksAgo||t.date>now) return false;
      return !incomeEvents.some(ev=>Math.abs(ev.amount-t.amount)<=10);
    });
    if(!candidates.length) return null;
    const best=candidates.reduce((a,b)=>b.amount>a.amount?b:a);
    const key=`${best.narrative}|${best.amount}`;
    return salarySuggestionDismissed.includes(key)?null:best;
  },[incomeFormState,transactions,incomeEvents,salarySuggestionDismissed]);
  function applySuggestion(txn){
    const dom=txn.date.getDate();
    const today=new Date();today.setHours(0,0,0,0);
    let next=new Date(today.getFullYear(),today.getMonth(),dom);
    if(next<today){
      const m=today.getMonth()+1,y=today.getFullYear()+(m>11?1:0),mo=m>11?0:m;
      const daysInMo=new Date(y,mo+1,0).getDate();
      next=new Date(y,mo,Math.min(dom,daysInMo));
    }
    const ds=fmtDateInput(next);
    setIncomeFormState(s=>({...s,data:{...s.data,label:'Salary',amount:String(Math.round(txn.amount)),expectedDate:ds,recurrence:'monthly'}}));
  }
  function closeIncomeForm(dismissSuggestion=false){
    if(dismissSuggestion&&salarySuggestion){
      const key=`${salarySuggestion.narrative}|${salarySuggestion.amount}`;
      if(!salarySuggestionDismissed.includes(key)){
        const next=[...salarySuggestionDismissed,key];
        setSalarySuggestionDismissed(next);
        try{localStorage.setItem("abound_salary_suggestion_dismissed",JSON.stringify(next));}catch{}
      }
    }
    setIncomeFormState(null);
  }
  const wizardSuggestion=useMemo(()=>{
    if(incomeEvents.length>0) return null;
    const now=new Date();now.setHours(0,0,0,0);
    const sixWeeksAgo=new Date(now);sixWeeksAgo.setDate(now.getDate()-42);
    const candidates=transactions.filter(t=>{
      if(!t.isIncome||t.amount<500) return false;
      if(t.category==="Transfers"||t.category==="Investments") return false;
      if(t.date<sixWeeksAgo||t.date>now) return false;
      return true;
    });
    if(!candidates.length) return null;
    return candidates.reduce((a,b)=>b.amount>a.amount?b:a);
  },[transactions,incomeEvents]);
  function _wizardNextDate(txnDate){
    const dom=txnDate.getDate();
    const today=new Date();today.setHours(0,0,0,0);
    let next=new Date(today.getFullYear(),today.getMonth(),dom);
    if(next<today){const m=today.getMonth()+1,y=today.getFullYear()+(m>11?1:0),mo=m>11?0:m;const daysInMo=new Date(y,mo+1,0).getDate();next=new Date(y,mo,Math.min(dom,daysInMo));}
    return next;
  }
  function triggerIncomeWizard(){
    if(incomeEvents.length>0) return;
    if(localStorage.getItem("abound_income_wizard_skipped")) return;
    const d=new Date();d.setDate(d.getDate()+30);
    setWizardForm({label:'',amount:'',expectedDate:fmtDateInput(d),recurrence:'monthly'});
    setIncomeWizardStep(wizardSuggestion?"suggest":"manual");
    setShowIncomeWizard(true);
  }
  function applyWizardSuggestion(txn){
    const ev={id:String(Date.now()),label:'Salary',amount:Math.round(txn.amount),expectedDate:_wizardNextDate(txn.date),recurrence:'monthly',status:'expected'};
    setIncomeEvents(evs=>[...evs,ev]);
    setShowIncomeWizard(false);
  }
  function switchWizardToManual(){
    if(wizardSuggestion){
      const next=_wizardNextDate(wizardSuggestion.date);
      setWizardForm({label:'Salary',amount:String(Math.round(wizardSuggestion.amount)),expectedDate:fmtDateInput(next),recurrence:'monthly'});
    }
    setIncomeWizardStep("manual");
  }
  function saveWizardForm(){
    const amount=parseFloat(wizardForm.amount);
    if(!wizardForm.label||isNaN(amount)||amount<=0||!wizardForm.expectedDate) return;
    const ev={id:String(Date.now()),label:wizardForm.label,amount,expectedDate:new Date(wizardForm.expectedDate+'T00:00:00'),recurrence:wizardForm.recurrence,status:'expected'};
    setIncomeEvents(evs=>[...evs,ev]);
    setShowIncomeWizard(false);
  }
  function skipIncomeWizard(){
    try{localStorage.setItem("abound_income_wizard_skipped","1");}catch{}
    setIncomeWizardSkipped(true);
    setShowIncomeWizard(false);
  }
  const [ctxMenu, setCtxMenu] = useState(null);
  function txnKey(t){return t.narrative+'|'+t.date.getTime()+'|'+t.amount;}
  function openCtxMenu(e, account, cat, weekKey){
    e.preventDefault();
    const txns = transactions.filter(t=>{
      const wk=getWeekMonday(t.date).toISOString().slice(0,10);
      return (account==="ALL"||t.account===account)&&t.category===cat&&wk===weekKey;
    });
    const selectedKeys = new Set(txns.map(txnKey));
    setCtxMenu({x:e.clientX, y:e.clientY, account, cat, weekKey, txns, selectedKeys});
  }
  const [excludedWeeks, setExcludedWeeks] = useState({}); // {[cat]: Set<weekKey>}
  const [showPremiumGate, setShowPremiumGate] = useState(false);
  const isPro = isPremium();
  const [previewCollapsed,setPreviewCollapsed]=useState(()=>{try{return localStorage.getItem("abound_preview_collapsed")==="true";}catch{return false;}});
  const togglePreview=()=>setPreviewCollapsed(c=>{const next=!c;try{localStorage.setItem("abound_preview_collapsed",String(next));}catch{}return next;});
  const [forecastExpanded,setForecastExpanded]=useState(()=>{try{return localStorage.getItem("abound_forecast_expanded")==="1";}catch{return false;}});
  const toggleForecastExpanded=()=>setForecastExpanded(e=>{const next=!e;try{localStorage.setItem("abound_forecast_expanded",next?"1":"0");}catch{}return next;});
  const [showStockSetup, setShowStockSetup] = useState(false);
  const [stocks, setStocks] = useState(()=>{try{return JSON.parse(localStorage.getItem("abound_stocks_v1")||"[]");}catch{return[];}});
  const [stockData, setStockData] = useState({});
  function openStocks(){if(!isPremium()){setShowPremiumGate(true);return;}setShowStockSetup(true);}
  function saveStocks(s){setStocks(s);try{localStorage.setItem("abound_stocks_v1",JSON.stringify(s));}catch{}}
  const [showIncomeWizard,setShowIncomeWizard]=useState(false);
  const [incomeWizardStep,setIncomeWizardStep]=useState("suggest");
  const [wizardForm,setWizardForm]=useState({label:'',amount:'',expectedDate:'',recurrence:'monthly'});
  const [incomeWizardSkipped,setIncomeWizardSkipped]=useState(()=>!!localStorage.getItem("abound_income_wizard_skipped"));
  useEffect(()=>{
    if(!stocks.length) return;
    stocks.forEach(async(s)=>{
      try{
        const res=await fetch('/api/stock-data',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({ticker:s.ticker})});
        const d=await res.json();
        if(d.price!=null) setStockData(prev=>({...prev,[s.ticker]:{...d,currentPrice:d.price}}));
      }catch(e){}
    });
  },[stocks.map(s=>s.ticker).join(',')]);
  const [highlightCashBal, setHighlightCashBal] = useState(false);
  const highlightCashBalTimer = useRef(null);
  const theadRef = useRef(null);
  const [theadH, setTheadH] = useState(60);
  const [sparkHoverIdx, setSparkHoverIdx] = useState(null);
  useEffect(()=>{
    if(!theadRef.current) return;
    const obs=new ResizeObserver(entries=>{for(const e of entries) setTheadH(Math.round(e.contentRect.height));});
    obs.observe(theadRef.current);
    return()=>obs.disconnect();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[]);
  const [forecastOverrides, setForecastOverrides] = useState([]); // used in forecast useMemo
  const [isDark, setIsDark] = useState(true);
  const [showThemeTip, setShowThemeTip] = useState(()=>!localStorage.getItem("themeTipSeen"));
  const [showAccuracyModal, setShowAccuracyModal] = useState(false);
  const [prevAccuracyData] = useState(()=>{try{const r=localStorage.getItem(FORECAST_ACCURACY_KEY);return r?JSON.parse(r):null;}catch{return null;}});
  const [currency, setCurrency] = useState(()=>getCurrencySymbol());
  const [showCurrencyPicker, setShowCurrencyPicker] = useState(false);
  const [splitByCard, setSplitByCard] = useState(false);
  useEffect(()=>{
    if(!showThemeTip)return;
    const t=setTimeout(()=>{setShowThemeTip(false);localStorage.setItem("themeTipSeen","1");},4000);
    return()=>clearTimeout(t);
  },[showThemeTip]);
  useEffect(()=>{
    if(stocks.length>0||localStorage.getItem("abound_stocks_tooltip_shown")) return;
    const t=setTimeout(()=>{localStorage.setItem("abound_stocks_tooltip_shown","1");setShowStocksTooltip(true);},2000);
    return()=>clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[]);
  useEffect(()=>{
    if(!showStocksTooltip) return;
    const t=setTimeout(()=>setShowStocksTooltip(false),4000);
    const dismiss=()=>setShowStocksTooltip(false);
    document.addEventListener("click",dismiss,{once:true});
    return()=>{clearTimeout(t);document.removeEventListener("click",dismiss);};
  },[showStocksTooltip]);
  const T = isDark ? {
    bg:"#08070f",card:"#0d0c1e",border:"#1f1d35",border2:"#2d2a6e",
    tableBg:"#0a0919",theadA:"#1e1b4b",theadB:"#0f0c2e",theadC:"#080712",theadD:"#060611",
    text:"#fff",dimText:"#9ca3af",sidebar:"#09081a",summaryRow:"rgba(255,255,255,0.015)",
    cashBalRow:"#111827",forecastArea:"#1e1b5e",forecastCell:"rgba(99,102,241,0.06)",
    borderLeft4:"2px solid #374151",totBg:"#111827",
    catText:"#c7d2fe",catRowBorder:"#13112a",dimBorder:"#2d2a6e",dimBorderMid:"#1a1830",
    actualHdrBg:"#1e1b4b",actualHdrText:"#c7d2fe",actualHdrBorder:"#2d2a6e",
    budgetInputBg:"#0f0e1a",budgetInputColor:"#e0e7ff",budgetSpendColor:"#e0e7ff",
    progressTrack:"rgba(255,255,255,0.07)",
    tooltipBg:"#1e1b38",tooltipBorder:"#4338ca",tooltipColor:"#c7d2fe",
    aiCardBg:"#0d0c1e",aiCardBorder:"#1f1d35",
    drawerBg:"#0a0919",drawerBorderColor:"#2d2a6e",
    drawerHdrBg:"linear-gradient(135deg,#1e1b4b,#13112a)",drawerHdrText:"#e0e7ff",
    sidebarBtnBorder:"#1f1d35",insightsText:"#c7d2fe",
    openBalNullColor:"#2d2a6e",acctLabelColor:"#374151",acctDotColor:"#2d2a6e",
  } : {
    bg:"#f0f4f8",card:"#ffffff",border:"#e2e8f0",border2:"#c7d2fe",
    tableBg:"#ffffff",theadA:"#ede9fe",theadB:"#f5f3ff",theadC:"#f8f7ff",theadD:"#f1f5f9",
    text:"#1e1b4b",dimText:"#6b7280",sidebar:"#f8fafc",summaryRow:"rgba(0,0,0,0.018)",
    cashBalRow:"#f0f4f8",forecastArea:"#ede9fe",forecastCell:"rgba(99,102,241,0.04)",
    borderLeft4:"2px solid #c7d2fe",totBg:"#f5f3ff",
    catText:"#374151",catRowBorder:"#eceaf5",dimBorder:"#ddd6fe",dimBorderMid:"#eceaf5",
    actualHdrBg:"#6366f1",actualHdrText:"#ffffff",actualHdrBorder:"rgba(99,102,241,0.3)",
    budgetInputBg:"#f8f9fa",budgetInputColor:"#1e1b4b",budgetSpendColor:"#1e1b4b",
    progressTrack:"rgba(0,0,0,0.07)",
    tooltipBg:"#ffffff",tooltipBorder:"#c7d2fe",tooltipColor:"#374151",
    aiCardBg:"#f8fafc",aiCardBorder:"#e2e8f0",
    drawerBg:"#ffffff",drawerBorderColor:"#e2e8f0",
    drawerHdrBg:"linear-gradient(135deg,#ede9fe,#ddd6fe)",drawerHdrText:"#4338ca",
    sidebarBtnBorder:"#e2e8f0",insightsText:"#4338ca",
    openBalNullColor:"#c7d2fe",acctLabelColor:"#6b7280",acctDotColor:"#c7d2fe",
  };

  useEffect(()=>{
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
    const bg = isDark ? '#0d0c1e' : '#ffffff';
    const shadow = isDark ? '6px 0 10px rgba(0,0,0,0.5)' : '6px 0 8px rgba(0,0,0,0.06)';
    document.documentElement.style.setProperty('--sticky-bg', bg);
    document.documentElement.style.setProperty('--sticky-shadow', shadow);
  },[isDark]);
  useEffect(()=>{
    setInvestigationOpen(false);
    if(!localStorage.getItem("cashFlowTourSeen_v2")){
      const t=setTimeout(()=>{setTourStep(0);setTourVisible(true);},800);
      return()=>clearTimeout(t);
    }
  },[]);

  const ROW_TOOLTIPS = {
    "Opening Balance":"Your account balance at the start of each week, walked forward and backward from your actual balance data.",
    "Income":"Money in — wages, BACS credits, and transfers into your main account.",
    "Food":"Groceries, restaurants, cafes, takeaways, and food delivery.",
    "Travel":"TfL, trains, flights, Uber, Bolt, parking — anything transport.",
    "Rent":"Rent, mortgage, and utilities like energy, broadband and water.",
    "Memberships":"Subscriptions — streaming, gym, phone contracts, insurance, road tax, and any recurring services.",
    "Transfers":"Money sent or received to/from friends and family — excluded from your spend totals as it's not really spending.",
    "Other Payments":"Transactions that didn't fit a specific category.",
    "Investments":"Money moved to investment platforms — tracked separately from spending so it doesn't distort your Net Movement.",
    "Card Repayment":"Money moved to pay your credit card — not counted as spend in Net Movement.",
    "Net Movement":"Income minus spend. Excludes transfers, investments and card repayments — these are not new spending.",
    "Cash Balance":"Your predicted end-of-week cash position across all accounts. Green = positive, red = dipping negative.",
  };

  const TOUR_STEPS = [
    {title:"Welcome to Abound",body:"Your transactions are mapped into a weekly grid — history on the left, AI forecast on the right.\n\nTake a quick tour.",cta:"Show me around →",skip:"Skip tour",highlight:null},
    {title:"Your actual spending",body:"White columns = real transactions, by week and category.\n\nClick any amount to move that week's transactions to a different category.",cta:"Next →",highlight:"actual"},
    {title:"Your 6-week forecast",body:"Purple columns predict what's coming based on your patterns. Monthly bills land on their usual date; daily spend uses a 6-week rolling average.",cta:"Next →",highlight:"forecast"},
    {title:"Plan a purchase",body:"Click any forecast cell to add a one-off expense — holiday, phone, car repair. It instantly adjusts your future cash balance.",cta:"Next →",highlight:null,cursorTarget:"forecast-cell"},
    {title:"Cash Balance",body:"Your predicted end-of-week cash across all accounts.\n\nGreen = healthy. Red = heading negative.",cta:"Next →",highlight:"cashbalance",scrollTo:"cashbalance"},
    {title:"Set a budget",body:"Open the Budget panel to set monthly spending targets per category. See projected vs actual and apply targets to your forecast.",cta:"Next →",highlight:"budget",scrollTo:null},
    ...(!isMobile?[{title:"Check your categories",body:"AI is good but not perfect. A quick review makes your forecast dramatically more accurate.",cta:"Next →",skip:null,isReviewPrompt:true,highlight:null}]:[]),
    ...(!isMobile?[{title:"Grouped or split by card?",body:"All accounts are combined by default. Use the toggle above the table to split by card.",cta:"Got it →",skip:null,isFinal:true,highlight:"view-toggle"}]:[{title:"That's your cash flow",body:"Swipe left for forecast weeks. Tap any number to explore.\n\nUse the sidebar to go to Insights or Review.",cta:"Got it →",skip:null,isFinal:true,highlight:null}]),
  ];

  const getHighlightRect = () => {
    if(!tourVisible||!currentStep?.highlight) return null;
    const els = document.querySelectorAll(`[data-tour="${currentStep.highlight}"]`);
    if(!els.length) return null;
    let top=Infinity, left=Infinity, right=-Infinity, bottom=-Infinity;
    els.forEach(el=>{const r=el.getBoundingClientRect();top=Math.min(top,r.top);left=Math.min(left,r.left);right=Math.max(right,r.right);bottom=Math.max(bottom,r.bottom);});
    // For column highlights (actual/forecast), span from Cash Balance (top) to last data row (bottom)
    if(currentStep.highlight==="actual"||currentStep.highlight==="forecast"){
      const cashBalEl=document.querySelector("[data-tour='cashbalance']");
      if(cashBalEl){const cr=cashBalEl.getBoundingClientRect(); top=Math.min(top,cr.top);}
      const rows=document.querySelectorAll("tbody tr");
      if(rows.length){const lr=rows[rows.length-1].getBoundingClientRect(); bottom=Math.max(bottom,lr.bottom);}
    }
    return {top:top-6, left:left-6, width:right-left+12, height:bottom-top+12};
  };
  

  function finishTour(){
    localStorage.setItem("cashFlowTourSeen_v2","1");
    setTourVisible(false);setTourStep(null);
    onTourFinish();
    setTimeout(triggerIncomeWizard,400);
  }
  function advanceTour(){
    const nextStep = tourStep===0 ? 1 : tourStep+1;
    if(tourStep>=TOUR_STEPS.length-1){finishTour();return;}
    setTourStep(nextStep);
    const target = TOUR_STEPS[nextStep]?.scrollTo;
    if(target){
      setTimeout(()=>{
        const el = target==="budget-cell"
          ? document.querySelector("tbody tr.abound-row td:last-child button, tbody tr.abound-row [data-budget-cell]")
          : document.querySelector(`[data-tour="${target}"]`);
        if(el){
          const tableDiv = document.querySelector("[data-tour-table]");
          if(tableDiv){
            const elRect = el.getBoundingClientRect();
            const tableRect = tableDiv.getBoundingClientRect();
            const targetTop = tableDiv.scrollTop + elRect.top - tableRect.top - tableRect.height/2 + elRect.height/2;
            tableDiv.scrollTo({top:Math.max(0,targetTop), behavior:"smooth"});
          } else {
            el.scrollIntoView({behavior:"smooth", block:"center"});
          }
        }
        setTimeout(()=>setTourHighlightTick(t=>t+1), 1000);
      }, 150);
    }
  }
  function closeTour(){
    localStorage.setItem("cashFlowTourSeen_v2","1");setTourVisible(false);setTourStep(null);
    setTimeout(triggerIncomeWizard,400);
  }
  function reopenTour(){setInvestigationOpen(false);setTourStep(0);setTourVisible(true);}

  // Lock body scroll during mobile tour
  useEffect(()=>{
    if(!isMobile) return;
    if(tourVisible){
      document.body.style.overflow="hidden";
      document.documentElement.style.overflow="hidden";
    } else {
      document.body.style.overflow="";
      document.documentElement.style.overflow="";
    }
    return()=>{document.body.style.overflow="";document.documentElement.style.overflow="";};
  },[tourVisible,isMobile]);

  // Auto-scroll table to show highlighted element during mobile tour
  useEffect(()=>{
    if(!isMobile||!tourVisible||tourStep===null) return;
    const step = TOUR_STEPS[tourStep];
    if(!step?.highlight) return;
    setTimeout(()=>{
      const els = document.querySelectorAll(`[data-tour="${step.highlight}"]`);
      if(!els.length) return;
      const tableDiv = document.querySelector("[data-tour-table]");
      if(!tableDiv) return;
      // Horizontal scroll: for forecast step scroll right, for actual scroll back left
      if(step.highlight==="forecast"){
        const fcstEl = els[0];
        const tableRect = tableDiv.getBoundingClientRect();
        tableDiv.scrollLeft = fcstEl.offsetLeft - tableRect.width / 2 + fcstEl.offsetWidth / 2;
      } else if(step.highlight==="actual"){
        tableDiv.scrollLeft = 0;
      }
      const el = els[0];
      const elRect = el.getBoundingClientRect();
      const tableRect = tableDiv.getBoundingClientRect();
      const targetScrollTop = tableDiv.scrollTop + elRect.top - tableRect.top - tableRect.height / 2 + elRect.height / 2;
      tableDiv.scrollTo({top: Math.max(0, targetScrollTop), behavior:"smooth"});
      setTimeout(()=>setTourHighlightTick(t=>t+1), 500);
    }, 300);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[tourStep, tourVisible, isMobile]);

  // Save current forecast once on mount so the next session can compare against it
  useEffect(()=>{
    const fwks = forecastWeeks; const fd = forecastData; const accts = accounts; const cats = categories;
    if (!fwks.length || !Object.keys(fd).length) return;
    const existing = loadLastForecast();
    if (existing?.savedAt?.slice(0,10) === new Date().toISOString().slice(0,10)) return;
    const spendCats = cats.filter(c=>c!=="Income"&&c!=="Card Repayment"&&c!=="Investments");
    const forecastByCategory = {};
    spendCats.forEach(cat=>{
      const vals = fwks.map((_,i)=>accts.reduce((s,acc)=>s+(fd[acc]?.[cat]?.[i]||0),0));
      if (vals.some(v=>v>0)) forecastByCategory[cat]=vals;
    });
    if (!Object.keys(forecastByCategory).length) return;
    saveLastForecast({
      savedAt: new Date().toISOString(),
      weekStartDates: fwks.map(w=>w.key),
      forecastByCategory,
      forecastCashBalance: combinedClosingBalances.forecast,
      forecastTotalSpend: totalForecastByWeek.reduce((a,b)=>a+b,0),
    });
  },[]);// eslint-disable-line react-hooks/exhaustive-deps

  const accounts = useMemo(()=>{const seen=new Set(),list=[];transactions.forEach(t=>{if(!seen.has(t.account)){seen.add(t.account);list.push(t.account);}});list.sort((a,b)=>a==="Main Account"?-1:b==="Main Account"?1:0);return list;},[transactions]);
  const singleAccount = accounts.length === 1;
  const netMovementTip = singleAccount
    ? "Income minus all spending including card repayments."
    : "Income minus spending. Card repayments excluded to avoid double-counting across accounts.";
  const mostRecentDate = useMemo(()=>transactions.reduce((max,t)=>t.date>max?t.date:max,new Date(0)),[transactions]);
  const actualWeeks = useMemo(()=>{const lastMonday=getWeekMonday(mostRecentDate);return Array.from({length:6},(_,i)=>{const mon=new Date(lastMonday);mon.setDate(mon.getDate()-(5-i)*7);return{key:mon.toISOString().slice(0,10),date:mon,sunday:getWeekSunday(mon)};});},[mostRecentDate]);
  const forecastWeeks = useMemo(()=>{if(!actualWeeks.length)return[];const last=actualWeeks[actualWeeks.length-1].date;return Array.from({length:12},(_,i)=>{const mon=new Date(last);mon.setDate(mon.getDate()+(i+1)*7);return{key:mon.toISOString().slice(0,10),date:mon,sunday:getWeekSunday(mon)};});},[actualWeeks]);
  const PREVIEW_COLS=3;
  const visibleForecastWeeks=forecastWeeks.slice(0,isPro?(forecastExpanded?forecastWeeks.length:6):(previewCollapsed||isMobile)?6:Math.min(6+PREVIEW_COLS,forecastWeeks.length));
  const weeklyByAccountCat = useMemo(()=>{const weekly={};transactions.forEach(t=>{const key=getWeekMonday(t.date).toISOString().slice(0,10);if(!weekly[key])weekly[key]={};if(!weekly[key][t.account])weekly[key][t.account]={};const cat=t.category==="Salary"?"Income":t.category;const amt=cat==="Income"?t.amount:-t.amount;weekly[key][t.account][cat]=(weekly[key][t.account][cat]||0)+amt;});return weekly;},[transactions]);
  const weekBalances = useMemo(()=>{const bal={};[...transactions].sort((a,b)=>a.date-b.date).forEach(t=>{if(t.balance===null)return;const key=getWeekMonday(t.date).toISOString().slice(0,10);if(!bal[key])bal[key]={};bal[key][t.account]=t.balance;});return bal;},[transactions]);

function getLastWorkingDay(year, month) {
    const d = new Date(year, month + 1, 0); // last calendar day
    while (d.getDay() === 0 || d.getDay() === 6) d.setDate(d.getDate() - 1);
    return d.getDate();
  }
  
  const detectedOutliers = useMemo(()=>{
    const ROLLING_DETECT=["Food","Travel","Other Payments",...categories.filter(c=>!DEFAULT_CATEGORIES.includes(c)&&c!=="Income"&&c!=="Card Repayment")];
    const result=[];
    ROLLING_DETECT.forEach(cat=>{
      const weekVals=actualWeeks.map(w=>({
        key:w.key,
        label:`${fmt(w.date)} – ${fmt(w.sunday)}`,
        val:accounts.reduce((s,acc)=>s+Math.abs(weeklyByAccountCat[w.key]?.[acc]?.[cat]||0),0),
      }));
      const nonZero=weekVals.filter(w=>w.val>0);
      if(nonZero.length<2) return;
      const sorted=[...nonZero].sort((a,b)=>a.val-b.val);
      const median=sorted[Math.floor(sorted.length/2)].val;
      if(median<20) return; // ignore tiny-spend categories
      nonZero.forEach(w=>{
        if(w.val>median*2) result.push({cat,weekKey:w.key,weekLabel:w.label,amount:w.val,typicalAmt:median});
      });
    });
    return result;
  },[actualWeeks,weeklyByAccountCat,accounts,categories]);

  const forecastData = useMemo(()=>{
    const out={};
    function getMonthlyDay(acc,cat){const days=[];transactions.forEach(t=>{if(t.account===acc&&t.category===cat)days.push(t.date.getDate());});if(!days.length)return null;const freq={};days.forEach(d=>freq[d]=(freq[d]||0)+1);return parseInt(Object.entries(freq).sort((a,b)=>b[1]-a[1])[0][0]);}
    function weekContainsDay(weekMon,weekSun,dayOfMonth){const d=new Date(weekMon);while(d<=weekSun){if(d.getDate()===dayOfMonth)return true;d.setDate(d.getDate()+1);}return false;}
    const MONTHLY_CATS=["Income"];
    const EXACT_CATS=["Rent","Memberships"];
    const ROLLING_CATS=["Food","Travel","Other Payments","Online Shopping","Healthcare"];
    const OCCURRENCE_CATS=["Transfers"]; // rolling mean over non-zero weeks only
    const NO_FORECAST_CATS=["Investments"]; // show actuals only, no forward projection
    const forecastCats=[...new Set([...categories, INTERCOMPANY_CATEGORY])];
    // Precompute non-recurring amounts by week/account/cat so rolling averages exclude one-offs
    const nrMap={};
    if(nonRecurring.size>0){transactions.forEach(t=>{if(!nonRecurring.has(t.narrative))return;const wk=getWeekMonday(t.date).toISOString().slice(0,10);if(!nrMap[wk])nrMap[wk]={};if(!nrMap[wk][t.account])nrMap[wk][t.account]={};nrMap[wk][t.account][t.category]=(nrMap[wk][t.account][t.category]||0)+Math.abs(t.amount);});}
    // First pass: all categories except Card Repayment
    accounts.forEach(acc=>{
      out[acc]={};
      forecastCats.filter(cat=>cat!=="Card Repayment").forEach(cat=>{
        if(NO_FORECAST_CATS.includes(cat)){out[acc][cat]=Array(forecastWeeks.length).fill(0);return;}
        const excl=excludedWeeks[cat]||new Set();
        const actualVals=actualWeeks.map(w=>{if(excl.has(w.key))return 0;const total=Math.abs(weeklyByAccountCat[w.key]?.[acc]?.[cat]||0);const nrAmt=nrMap[w.key]?.[acc]?.[cat]||0;return Math.max(0,total-nrAmt);});
        const avg=rollingAvg(actualVals);
        if(EXACT_CATS.includes(cat)){
          const catTxns=transactions.filter(t=>t.account===acc&&t.category===cat);
          const byNarrative={};
          catTxns.forEach(t=>{if(!byNarrative[t.narrative]||t.date>byNarrative[t.narrative].date)byNarrative[t.narrative]=t;});
          const result=Array(forecastWeeks.length).fill(0);
          Object.values(byNarrative).forEach(t=>{
            const dom=t.date.getDate();
            forecastWeeks.forEach((w,i)=>{
              const d=new Date(w.date);
              while(d<=w.sunday){if(d.getDate()===dom){result[i]+=t.amount;break;}d.setDate(d.getDate()+1);}
            });
          });
          out[acc][cat]=result;
        } else if(MONTHLY_CATS.includes(cat)){
          // Income: replicate the most-recent calendar month's exact payments (amount + day) in future months
          const catTxns=transactions.filter(t=>t.account===acc&&t.category===cat&&t.amount>0&&!/balance/i.test(t.narrative));
          if(!catTxns.length){out[acc][cat]=Array(forecastWeeks.length).fill(0);}
          else{
            // Find the most recent calendar month that had income
            const latestDate=catTxns.reduce((a,t)=>t.date>a?t.date:a, new Date(0));
            const latestMonth=latestDate.getMonth(), latestYear=latestDate.getFullYear();
            // All salary transactions in that same calendar month = our template
            const templateTxns=catTxns.filter(t=>t.date.getMonth()===latestMonth&&t.date.getFullYear()===latestYear);
            const result=Array(forecastWeeks.length).fill(0);
            const lastActWk=actualWeeks[actualWeeks.length-1];
            // Per-account cutoff: when did THIS account's data last update?
            const accCutoff=transactions.filter(t=>t.account===acc).reduce((max,t)=>t.date>max?t.date:max,new Date(0));
            templateTxns.forEach(t=>{
              const dom=t.date.getDate();
              // If salary's DOM falls in the last actual week but after this account's data cutoff, it's pending — add to forecast week 0
              if(lastActWk){
                const chk=new Date(accCutoff);chk.setDate(chk.getDate()+1);
                while(chk<=lastActWk.sunday){
                  if(chk.getDate()===dom){result[0]+=t.amount;break;}
                  chk.setDate(chk.getDate()+1);
                }
              }
              forecastWeeks.forEach((w,i)=>{
                const d=new Date(w.date);
                while(d<=w.sunday){if(d.getDate()===dom){result[i]+=t.amount;break;}d.setDate(d.getDate()+1);}
              });
            });
            out[acc][cat]=result;
          }
        } else if(ROLLING_CATS.includes(cat)){
          const buf=actualVals.slice(-6).map(Number);
          const result=[];
          for(let i=0;i<forecastWeeks.length;i++){
            const avg=buf.reduce((a,b)=>a+b,0)/Math.max(buf.length,1);
            result.push(Math.round(avg));
            buf.shift();
            buf.push(avg); // unrounded so next week's mean stays accurate
          }
          out[acc][cat]=result;
        } else if(OCCURRENCE_CATS.includes(cat)){
          // Transfers: rolling mean over non-zero weeks; show per-occurrence amount at actual frequency
          const last6=actualVals.slice(-6);
          const nonZero=last6.filter(v=>v>0);
          const forecastVal=nonZero.length?Math.round(nonZero.reduce((a,b)=>a+b,0)/nonZero.length):0;
          const n=nonZero.length, total=Math.max(last6.length,1), fw=Math.max(forecastWeeks.length,1);
          out[acc][cat]=forecastWeeks.map((_,i)=>{
            const slot=Math.floor(i*n/fw);
            const prevSlot=Math.floor((i-1)*n/fw);
            return (n>0&&slot>prevSlot)?forecastVal:0;
          });
        } else {
          // User-added or unlisted category: auto-detect monthly vs variable
          const catTxns=transactions.filter(t=>t.account===acc&&t.category===cat&&t.amount>0);
          let detectedDom=null;
          if(catTxns.length>=2){
            const doms=catTxns.map(t=>t.date.getDate());
            const freq={};doms.forEach(d=>{freq[d]=(freq[d]||0)+1;});
            const topDom=parseInt(Object.entries(freq).sort((a,b)=>b[1]-a[1])[0][0]);
            const clustered=doms.filter(d=>Math.abs(d-topDom)<=3).length;
            if(clustered/doms.length>=0.7&&catTxns.length>=2) detectedDom=topDom;
          }
          if(detectedDom!==null){
            // Monthly pattern: project on detected day-of-month like EXACT_CATS
            const byNarrative={};
            catTxns.forEach(t=>{if(!byNarrative[t.narrative]||t.date>byNarrative[t.narrative].date)byNarrative[t.narrative]=t;});
            const result=Array(forecastWeeks.length).fill(0);
            Object.values(byNarrative).forEach(t=>{
              const dom=t.date.getDate();
              forecastWeeks.forEach((w,i)=>{
                const d=new Date(w.date);
                while(d<=w.sunday){if(d.getDate()===dom){result[i]+=t.amount;break;}d.setDate(d.getDate()+1);}
              });
            });
            out[acc][cat]=result;
          } else {
            // Variable: rolling 6-week average (same as ROLLING_CATS)
            const buf=actualVals.slice(-6).map(Number);
            const result=[];
            for(let i=0;i<forecastWeeks.length;i++){
              const a=buf.reduce((x,y)=>x+y,0)/Math.max(buf.length,1);
              result.push(Math.round(a));
              buf.shift();buf.push(a);
            }
            out[acc][cat]=result;
          }
        }
      });
    });
    // Second pass: Card Repayment — amount = sum of CC spend over the 4 weeks up to repayment date
    const ccAccs=accounts.filter(a=>a!=="Main Account");
    const ccSpendCats=categories.filter(c=>c!=="Income"&&c!=="Card Repayment");
    accounts.forEach(acc=>{
      const catTxns=transactions.filter(t=>t.account===acc&&t.category==="Card Repayment");
      if(!catTxns.length){out[acc]["Card Repayment"]=Array(forecastWeeks.length).fill(0);return;}
      // Which accounts' spend contributes to this repayment?
      const spendAccs=acc==="Main Account"?ccAccs:[acc];
      // Precompute weekly CC spend: actual weeks + forecast weeks
      const spendActualByWeek=actualWeeks.map(w=>spendAccs.reduce((s,sa)=>ccSpendCats.reduce((s2,cat)=>s2+Math.abs(weeklyByAccountCat[w.key]?.[sa]?.[cat]||0),s),0));
      const spendFcstByWeek=forecastWeeks.map((_,i)=>spendAccs.reduce((s,sa)=>ccSpendCats.reduce((s2,cat)=>s2+(out[sa]?.[cat]?.[i]||0),s),0));
      // Get repayment day-of-month from most recent transaction per narrative
      const byNarrative={};
      catTxns.forEach(t=>{if(!byNarrative[t.narrative]||t.date>byNarrative[t.narrative].date)byNarrative[t.narrative]=t;});
      const result=Array(forecastWeeks.length).fill(0);
      Object.values(byNarrative).forEach(lastTxn=>{
        const dom=lastTxn.date.getDate();
        forecastWeeks.forEach((w,i)=>{
          const d=new Date(w.date);
          while(d<=w.sunday){
            if(d.getDate()===dom){
              // Sum 4 weeks of CC spend ending at this forecast week
              let sum=0;
              for(let off=0;off<4;off++){
                const fi=i-off;
                if(fi>=0) sum+=spendFcstByWeek[fi];
                else{const ai=actualWeeks.length+fi;if(ai>=0)sum+=spendActualByWeek[ai];}
              }
              result[i]=Math.round(Math.abs(sum));
              break;
            }
            d.setDate(d.getDate()+1);
          }
        });
      });
      out[acc]["Card Repayment"]=result;
    });
    // Third pass: user forecast overrides (salary changes, rent increases, etc.)
    const MONTHLY_OV_CATS=["Income","Rent","Memberships"];
    forecastOverrides.forEach(ov=>{
      const fromIdx=forecastWeeks.findIndex(w=>w.key>=ov.fromWeekKey);
      if(fromIdx<0) return;
      accounts.forEach(acc=>{
        if(!out[acc]?.[ov.cat]) return;
        const cur=out[acc][ov.cat];
        for(let i=fromIdx;i<forecastWeeks.length;i++){
          out[acc][ov.cat][i]=MONTHLY_OV_CATS.includes(ov.cat)?(cur[i]>0?ov.newAmt:0):ov.newAmt;
        }
      });
    });
    return out;
  },[accounts,categories,actualWeeks,forecastWeeks,weeklyByAccountCat,transactions,excludedWeeks,forecastOverrides,nonRecurring]);

  const incomeByFcstWeek=useMemo(()=>projectIncomeEvents(incomeEvents,forecastWeeks),[incomeEvents,forecastWeeks]);
  const incomeFcstTotalByWeek=useMemo(()=>incomeByFcstWeek.map(pills=>pills.filter(p=>!p.isGhost).reduce((s,p)=>s+(p.ev.receivedAmount??p.ev.amount),0)),[incomeByFcstWeek]);
  const overdueBanners=useMemo(()=>{const t=new Date();t.setHours(0,0,0,0);return incomeEvents.filter(ev=>ev.status==='expected'&&ev.expectedDate&&ev.expectedDate<t&&(!ev.dismissedUntil||Date.now()>ev.dismissedUntil));},[incomeEvents]);

  const spendCats=categories.filter(c=>c!=="Income"&&c!=="Salary"&&(singleAccount||c!=="Card Repayment")&&c!=="Investments");
  const totalActualByWeek=actualWeeks.map(w=>accounts.reduce((s,acc)=>spendCats.reduce((s2,c)=>s2+Math.abs(weeklyByAccountCat[w.key]?.[acc]?.[c]||0),s),0));
  const totalForecastByWeek=forecastWeeks.map((_,i)=>accounts.reduce((s,acc)=>spendCats.reduce((s2,c)=>s2+(forecastData[acc]?.[c]?.[i]||0),s),0));

  const combinedClosingBalances = useMemo(()=>{
    const mainAcc="Main Account";
    const mainSpendCats=[...new Set([...categories.filter(c=>c!=="Income"), INTERCOMPANY_CATEGORY])];
    const ccSpendCats=categories.filter(c=>c!=="Income"&&c!=="Card Repayment");
    const ccAccounts=accounts.filter(a=>a!==mainAcc);
    const mainActuals=actualWeeks.map(w=>mainSpendCats.reduce((s,c)=>s+Math.abs(weeklyByAccountCat[w.key]?.[mainAcc]?.[c]||0),0));
    const mainIncome=actualWeeks.map(w=>Math.abs(weeklyByAccountCat[w.key]?.[mainAcc]?.["Income"]||0));
    const mainNet=actualWeeks.map((_,i)=>mainIncome[i]-mainActuals[i]);
    const ccActuals=actualWeeks.map(w=>ccAccounts.reduce((s,acc)=>ccSpendCats.reduce((s2,c)=>s2+Math.abs(weeklyByAccountCat[w.key]?.[acc]?.[c]||0),s),0));
    const knownBals=actualWeeks.map(w=>weekBalances[w.key]?.[mainAcc]??null);
    // closingBals[i] = end-of-week main-account balance (post all transactions)
    const closingBals=Array(actualWeeks.length).fill(null);
    knownBals.forEach((b,i)=>{if(b!==null)closingBals[i]=b;});
    // Forward: closing[i+1] = closing[i] + net[i+1]
    for(let i=0;i<actualWeeks.length-1;i++){
      if(closingBals[i]!==null&&closingBals[i+1]===null)
        closingBals[i+1]=closingBals[i]+mainNet[i+1];
    }
    // Backward: closing[i-1] = closing[i] - net[i]
    for(let i=actualWeeks.length-1;i>0;i--){
      if(closingBals[i]!==null&&closingBals[i-1]===null)
        closingBals[i-1]=closingBals[i]-mainNet[i];
    }
    const actualClosing=closingBals.map((b,i)=>b!==null?b-ccActuals[i]:null);
    const lastActualBal=closingBals.filter(b=>b!==null).slice(-1)[0]??null;
    const mainFActuals=forecastWeeks.map((_,i)=>mainSpendCats.reduce((s,c)=>s+(forecastData[mainAcc]?.[c]?.[i]||0),0));
    const mainFIncome=incomeFcstTotalByWeek.length===forecastWeeks.length?incomeFcstTotalByWeek:forecastWeeks.map((_,i)=>forecastData[mainAcc]?.["Income"]?.[i]||0);
    const mainFNet=forecastWeeks.map((w,i)=>{
      const eventSpend=events.filter(ev=>ev.weekKey===w.key).reduce((s,ev)=>s+ev.amount,0);
      return mainFIncome[i]-mainFActuals[i]-eventSpend;
    });
    const ccFActuals=forecastWeeks.map((_,i)=>ccAccounts.reduce((s,acc)=>ccSpendCats.reduce((s2,c)=>s2+(forecastData[acc]?.[c]?.[i]||0),s),0));
    const forecastBals=Array(forecastWeeks.length).fill(null);
    if(lastActualBal!==null){forecastBals[0]=lastActualBal;for(let i=1;i<forecastWeeks.length;i++)forecastBals[i]=forecastBals[i-1]+mainFNet[i-1];}
    const forecastClosing=forecastBals.map((ob,i)=>ob!==null?ob+mainFNet[i]-ccFActuals[i]:null);
    return{actual:actualClosing,forecast:forecastClosing};
  },[accounts,categories,actualWeeks,forecastWeeks,weeklyByAccountCat,weekBalances,forecastData,events,incomeFcstTotalByWeek]);

  const insights=useMemo(()=>{
    const tips=[],totals={},weeklyTotals={};
    categories.forEach(cat=>{
      totals[cat]=actualWeeks.reduce((s,w)=>s+accounts.reduce((s2,acc)=>s2+Math.abs(weeklyByAccountCat[w.key]?.[acc]?.[cat]||0),0),0);
      weeklyTotals[cat]=actualWeeks.map(w=>accounts.reduce((s,acc)=>s+Math.abs(weeklyByAccountCat[w.key]?.[acc]?.[cat]||0),0));
    });

    // 1. Projected cash balance in 6 weeks
    const lastForecast=combinedClosingBalances.forecast[combinedClosingBalances.forecast.length-1];
    const lastActual=combinedClosingBalances.actual.filter(v=>v!==null).slice(-1)[0];
    if(lastForecast!==null&&lastForecast!==undefined&&lastActual!==null&&lastActual!==undefined){
      const diff=lastForecast-lastActual;
      const isUp=diff>=0;
      tips.push({
        icon:"chart",color:isUp?"#10b981":"#ef4444",
        title:`Cash in 6 weeks: £${Math.round(lastForecast).toLocaleString()}`,
        body:isUp?`Up £${Math.round(diff).toLocaleString()} from today's £${Math.round(lastActual).toLocaleString()}.`:`Down £${Math.round(Math.abs(diff)).toLocaleString()} from today's £${Math.round(lastActual).toLocaleString()}.`,
        detail:isUp?`Your forecast shows your cash position improving over the next 6 weeks. This assumes your spending stays in line with recent patterns and salary lands on its usual date.`:`Your cash position is forecast to drop over the next 6 weeks. If this continues, consider where you can reduce discretionary spend.`,
        trend:isUp?"up":"down"
      });
    }

    // 2. Biggest spend category with weekly breakdown
    const top=Object.entries(totals).filter(([c])=>c!=="Income"&&(singleAccount||c!=="Card Repayment")).sort((a,b)=>b[1]-a[1])[0];
    if(top){
      const weeklyAvg=Math.round(totals[top[0]]/Math.max(actualWeeks.length,1));
      tips.push({icon:"chart",color:PURPLE,title:`Top spend: ${top[0]}`,body:`£${weeklyAvg.toLocaleString()}/wk avg · £${Math.round(top[1]).toLocaleString()} total.`,detail:`${top[0]} is your biggest spending category at £${Math.round(top[1]).toLocaleString()} over ${actualWeeks.length} weeks — £${weeklyAvg.toLocaleString()} per week on average. Your forecast adds another £${Math.round((forecastData[accounts[0]]?.[top[0]]||[]).reduce((a,b)=>a+b,0)).toLocaleString()} over the next 6 weeks.`,trend:null});
    }

    // 3. Spending spikes
    categories.forEach(cat=>{
      if(cat==="Income"||(cat==="Card Repayment"&&!singleAccount))return;
      const vals=weeklyTotals[cat]||[];
      const avg=rollingAvg(vals),last=vals[vals.length-1];
      if(avg>0&&last>avg*1.6)tips.push({icon:"warn",color:"#f59e0b",title:`${cat} up ${Math.round((last/avg-1)*100)}% last week`,body:`£${Math.round(last).toLocaleString()} vs £${Math.round(avg).toLocaleString()} avg.`,detail:`Your ${cat} spending last week was £${Math.round(last).toLocaleString()}, which is ${Math.round((last/avg-1)*100)}% above your usual weekly average of £${Math.round(avg).toLocaleString()}. This could be a one-off or a new recurring cost — worth checking.`,trend:"warn"});
    });

    // 4. Months with big bills coming
    const nextBigWeek=combinedClosingBalances.forecast.reduce((worst,v,i)=>v!==null&&(worst===null||v<combinedClosingBalances.forecast[worst])?i:worst,null);
    if(nextBigWeek!==null&&combinedClosingBalances.forecast[nextBigWeek]!==null){
      const wk=forecastWeeks[nextBigWeek];
      const bal=combinedClosingBalances.forecast[nextBigWeek];
      if(bal<(lastActual||0)*0.7){
        tips.push({icon:"warn",color:"#f59e0b",title:`Low point: ${fmt(wk?.date||new Date())}`,body:`Balance drops to £${Math.round(bal).toLocaleString()} that week.`,detail:`Week of ${fmt(wk?.date||new Date())} is your tightest forecast point at £${Math.round(bal).toLocaleString()}. This is likely due to multiple bills landing at once. Worth making sure you have enough buffer going in.`,trend:"warn"});
      }
    }

    // 5. Stable fallback
    if(tips.length<3)tips.push({icon:"check",color:"#10b981",title:"Spending on track",body:"No unusual patterns in the last 6 weeks.",detail:"Your spending across all categories has been consistent week-on-week. No sudden spikes, no categories trending upward. You're in good shape.",trend:"up"});

    return tips.slice(0,5);
  },[transactions,categories,actualWeeks,accounts,weeklyByAccountCat,combinedClosingBalances,forecastWeeks,forecastData]);

const tdAmt=(color,isForecast,bold,forecastIdx,isOverBudget)=>({padding:"5px 10px",textAlign:"right",fontSize:12,fontWeight:bold?700:400,color:isOverBudget?"#ef4444":color||T.dimText,opacity:isForecast&&forecastIdx!=null?1-Math.min(forecastIdx,5)*0.07:1,background:isOverBudget?"rgba(239,68,68,0.08)":isForecast?"rgba(99,102,241,0.04)":"transparent",borderRight:isForecast?`1px dashed ${T.border2}`:`1px solid ${T.dimBorderMid}`,whiteSpace:"nowrap",fontVariantNumeric:"tabular-nums"});
  const tdTot=(isForecast)=>({padding:"7px 10px",textAlign:"right",fontSize:12,fontWeight:800,color:isForecast?"#818cf8":T.catText,background:isForecast?"rgba(99,102,241,0.12)":T.totBg,borderLeft:`2px solid ${T.border2}`,borderRight:`2px solid ${T.border2}`,whiteSpace:"nowrap",fontVariantNumeric:"tabular-nums"});
  const blurStyle=(i)=>{
    if(i<6||isPro) return {};
    const narrow={padding:'3px 2px',minWidth:0,width:52,maxWidth:52,overflow:'hidden'};
    const base={filter:"blur(4px)",opacity:0.5,userSelect:"none",pointerEvents:"none",...narrow};
    if(i===6) return{...base,WebkitMaskImage:"linear-gradient(to right,transparent 0%,black 55%)",maskImage:"linear-gradient(to right,transparent 0%,black 55%)"};
    return base;
  };

  function LabelCell({label,account}){
    const tip=ROW_TOOLTIPS[label];
    return(
      <td style={{padding:"5px 12px",fontSize:12,fontWeight:600,whiteSpace:"nowrap",position:"relative",cursor:tip?"help":"default",color:T.dimText}}
        onMouseEnter={e=>{if(tip){const r=e.currentTarget.getBoundingClientRect();setTooltip({text:tip,x:r.left,y:r.bottom+6});}}}
        onMouseLeave={()=>setTooltip(null)}>
        {label}
        {tip&&<span style={{marginLeft:4,fontSize:9,color:T.dimText,verticalAlign:"super"}}>ⓘ</span>}
      </td>
    );
  }

  function getForecastTip(cat, account) {
    const sym=getCurrencySymbol();
    const EXACT_CATS_L=["Rent","Memberships"];
    const MONTHLY_CATS_L=["Income"];
    const ROLLING_CATS_L=["Food","Travel","Other Payments","Online Shopping","Healthcare"];
    const OCCURRENCE_CATS_L=["Transfers"];
    if(cat==="Investments") return `Investment deposits are shown as actuals only — not projected forward.`;
    const vals=actualWeeks.map(w=>Math.abs(weeklyByAccountCat[w.key]?.[account]?.[cat]||0));
    const last6=vals.slice(-6);
    const nonZero=last6.filter(v=>v>0);
    const avg=Math.round(last6.reduce((a,b)=>a+b,0)/Math.max(last6.length,1));
    const valStr=last6.map(v=>`${sym}${Math.round(v)}`).join(' · ');
    if(EXACT_CATS_L.includes(cat)){
      const doms=transactions.filter(t=>t.account===account&&t.category===cat).map(t=>t.date.getDate());
      const freq={};doms.forEach(d=>{freq[d]=(freq[d]||0)+1;});
      const dom=doms.length?parseInt(Object.entries(freq).sort((a,b)=>b[1]-a[1])[0][0]):null;
      return `Fixed monthly — projected on the ${dom??'same'}th each month from last occurrence.`;
    } else if(MONTHLY_CATS_L.includes(cat)){
      return `Monthly pattern — repeats last month's payment schedule.`;
    } else if(ROLLING_CATS_L.includes(cat)){
      return `6-wk rolling avg: ${valStr} → ${sym}${avg}/wk`;
    } else if(OCCURRENCE_CATS_L.includes(cat)){
      return `Avg of ${nonZero.length} non-zero weeks → ${sym}${nonZero.length?Math.round(nonZero.reduce((a,b)=>a+b,0)/nonZero.length):0} projected.`;
    } else {
      return `Rolling avg: ${valStr} → ${sym}${avg}/wk`;
    }
  }

  function CatRow({cat,account}){
    const isIncome=cat==="Income"||(cat==="Card Repayment"&&account!=="Main Account");
    const isInvestments=cat==="Investments";
    const isRepayment=false;
    const key=`${account}::${cat}`;
    const hidden=hiddenCats.has(key);
    const actuals=actualWeeks.map(w=>Math.abs(weeklyByAccountCat[w.key]?.[account]?.[cat]||0));
    const forecasts=forecastData[account]?.[cat]||Array(6).fill(0);
    const totalAct=actuals.reduce((a,b)=>a+b,0);
    const totalFcst=forecasts.reduce((a,b)=>a+b,0);
    const rowColor=isIncome?"rgba(16,185,129,0.04)":isInvestments?"rgba(16,185,129,0.04)":isRepayment?"rgba(124,58,237,0.05)":"transparent";
    const textColor=isIncome?"#34d399":isInvestments?"#34d399":isRepayment?"#a78bfa":T.catText;
    return(
      <tr className="abound-row" style={{opacity:hidden?0.25:1,borderBottom:`1px solid ${T.catRowBorder}`,background:rowColor,cursor:"default"}}>
        <td data-sticky-label style={{padding:"5px 4px 5px 6px",fontSize:10,color:T.acctLabelColor,whiteSpace:"nowrap",minWidth:isMobile?26:undefined}}>{account==="Main Account"?"Main":account.replace("Credit Card","CC")}</td>
        <td data-sticky-label2 style={{padding:"5px 8px",fontSize:12,fontWeight:600,whiteSpace:"nowrap",color:textColor,cursor:"help",position:"relative"}}
          onMouseEnter={e=>{const tip=ROW_TOOLTIPS[cat];if(tip){const r=e.currentTarget.getBoundingClientRect();setTooltip({text:tip,x:r.left,y:r.bottom+6});}}}
          onMouseLeave={()=>setTooltip(null)}>
          {isIncome&&<span style={{fontSize:9,marginRight:4}}>▲</span>}
          {isInvestments&&<span style={{fontSize:9,marginRight:4}}>📈</span>}
          {isRepayment&&<span style={{fontSize:9,marginRight:4}}>↔</span>}
          {cat}
          <span style={{marginLeft:4,fontSize:9,color:T.dimText,verticalAlign:"super"}}>ⓘ</span>
        </td>
        {actuals.map((v,i)=>(
          <td key={i}
            style={{...tdAmt(v===0?T.dimBorder:isIncome?"#10b981":isInvestments?"#10b981":isRepayment?"#a78bfa":"#9ca3af",false),cursor:v>0?"pointer":"default",userSelect:"none"}}
            onClick={v>0?e=>openCtxMenu(e,account,cat,actualWeeks[i].key):undefined}
            onContextMenu={v>0?e=>openCtxMenu(e,account,cat,actualWeeks[i].key):undefined}>
            {v>0?<span style={{borderBottom:`1px dashed ${T.border2}`}}>{fmtMoney(v)}</span>:fmtMoney(v)}
          </td>
        ))}
        <td style={tdTot(false)}>{fmtMoney(totalAct)}</td>
        {visibleForecastWeeks.map((_,i)=>{
          const v=forecasts[i]||0;
          const wk=forecastWeeks[i];
          const isEditing=editingEvent?.weekKey===wk?.key&&editingEvent?.cat===cat&&editingEvent?.account===account;
          return(
            <td key={i} style={{...tdAmt(v===0?"#d1d5db":isRepayment?"#7c3aed":PURPLE,true,false,i,false),...blurStyle(i),outline:isEditing?"2px solid #6366f1":"none",outlineOffset:"-2px",cursor:i>=6&&!isPro?"default":"pointer"}}
              onClick={e=>{if(i>=6&&!isPro)return;if(!isEditing){const r=e.currentTarget.getBoundingClientRect();setEditingEvent({weekKey:wk?.key,cat,account,label:"",amount:"",x:Math.min(r.left,window.innerWidth-220),y:r.bottom+4});e.stopPropagation();}}}
              onMouseEnter={e=>{if(i>=6&&!isPro)return;const r=e.currentTarget.getBoundingClientRect();setTooltip({text:getForecastTip(cat,account),x:r.left,y:r.bottom+6});}}
              onMouseLeave={()=>setTooltip(null)}>
              {fmtMoney(v)}
            </td>
          );
        })}
        <td style={tdTot(true)}>{fmtMoney(totalFcst)}</td>
        <td style={{padding:"3px 6px",textAlign:"center"}}>
          <button onClick={()=>setHiddenCats(s=>{const n=new Set(s);n.has(key)?n.delete(key):n.add(key);return n;})} style={{fontSize:9,padding:"1px 6px",borderRadius:4,border:`1px solid ${hidden?T.dimText:T.border}`,background:hidden?"rgba(239,68,68,0.1)":"transparent",color:hidden?"#ef4444":T.dimText,cursor:"pointer"}}>
            {hidden?"show":"hide"}
          </button>
        </td>
      </tr>
    );
  }

  const inpStyle={padding:"4px 7px",background:T.budgetInputBg,border:`1px solid ${T.dimBorder}`,borderRadius:5,color:T.text,fontSize:11,outline:"none"};
  function IncomePill({pill}){
    return(
      <div
        onClick={e=>{if(!pill.isGhost){const r=e.currentTarget.getBoundingClientRect();openEditIncomeForm(pill.ev,Math.min(r.left,window.innerWidth-280),r.bottom+4);}}}
        style={{display:"inline-flex",alignItems:"center",gap:2,background:pill.isGhost?"transparent":pill.isReceived||pill.ev.status==="received"?"#22c55e":"#6366f1",opacity:pill.isGhost?0.25:pill.isReceived||pill.ev.status==="received"?1.0:0.8,border:pill.isGhost?"1px dashed #6366f1":"none",color:"#fff",fontSize:10,fontWeight:600,padding:"2px 5px",borderRadius:4,cursor:pill.isGhost?"default":"pointer",whiteSpace:"nowrap",maxWidth:130,overflow:"hidden",textOverflow:"ellipsis"}}>
        <span style={{overflow:"hidden",textOverflow:"ellipsis"}}>{pill.ev.label}</span>
        <span style={{opacity:0.8,flexShrink:0}}>{fmtMoney(pill.ev.receivedAmount??pill.ev.amount)}</span>
      </div>
    );
  }
  function IncomeFcstCells({pills,colIdx}){
    return(
      <td style={{...tdAmt(null,true,false,colIdx),padding:"3px 6px",verticalAlign:"top",minWidth:70,...blurStyle(colIdx)}}>
        <div style={{display:"flex",flexDirection:"column",gap:2}}>
          {pills.map((pill,j)=><IncomePill key={j} pill={pill}/>)}
        </div>
      </td>
    );
  }
  function IncomeAddRow(){
    const showArrow=incomeWizardSkipped&&incomeEvents.length===0;
    return(
      <tr className="abound-row" style={{borderBottom:`1px solid ${T.catRowBorder}`,background:"rgba(99,102,241,0.02)"}}>
        <td data-sticky-label style={{padding:"3px 4px 3px 6px",background:"rgba(99,102,241,0.02)"}}/>
        <td data-sticky-label2 style={{padding:"3px 10px",background:"rgba(99,102,241,0.02)"}}>
          <div style={{position:"relative",display:"inline-block"}}>
            {showArrow&&<span title="Add your income so your forecast is accurate" style={{position:"absolute",top:-16,left:"50%",transform:"translateX(-50%)",fontSize:13,color:"#818cf8",animation:"incomeArrowPulse 1.5s ease-in-out infinite",pointerEvents:"none",lineHeight:1,display:"block",textAlign:"center",width:"100%"}}>↑</span>}
            <span onClick={e=>{const r=e.currentTarget.getBoundingClientRect();openAddIncomeForm(r.left,r.bottom+4);}} style={{fontSize:10,color:"#6366f1",cursor:"pointer",fontWeight:600,opacity:0.7}} onMouseEnter={e=>e.currentTarget.style.opacity="1"} onMouseLeave={e=>e.currentTarget.style.opacity="0.7"}>+ Add income</span>
          </div>
        </td>
        {actualWeeks.map((_,i)=><td key={i} style={{borderRight:`1px solid ${T.catRowBorder}`}}/>)}
        <td style={{borderLeft:`2px solid ${T.dimBorder}`,borderRight:`2px solid ${T.dimBorder}`}}/>
        {visibleForecastWeeks.map((_,i)=><td key={i} style={{background:"rgba(99,102,241,0.04)",borderRight:i===visibleForecastWeeks.length-1?"none":`1px dashed ${T.border2}`,...blurStyle(i)}}/>)}
        <td style={{borderLeft:`2px solid ${T.border2}`}}/><td/>
      </tr>
    );
  }
  function IncomeForecastArea({totalFcst}){
    const empty=incomeEvents.length===0;
    if(empty) return(
      <>
        <td colSpan={visibleForecastWeeks.length} style={{background:"rgba(99,102,241,0.04)",padding:"5px 12px",cursor:"pointer",borderRight:`2px solid ${T.border2}`}}
          onClick={e=>{const r=e.currentTarget.getBoundingClientRect();openAddIncomeForm(Math.min(r.left,window.innerWidth-280),r.bottom+4);}}>
          <span style={{fontSize:11,color:"#818cf8"}}>When do you next expect to be paid?{" "}</span>
          <span style={{fontSize:11,color:"#6366f1",fontWeight:700}}>Add first income →</span>
        </td>
        <td style={tdTot(true)}>—</td>
      </>
    );
    return(
      <>
        {visibleForecastWeeks.map((_,i)=><IncomeFcstCells key={i} pills={incomeByFcstWeek[i]||[]} colIdx={i}/>)}
        <td style={tdTot(true)}>{fmtMoney(totalFcst)}</td>
      </>
    );
  }
  function IncomeEventsRow({account}){
    const actuals=actualWeeks.map(w=>Math.abs(weeklyByAccountCat[w.key]?.[account]?.["Income"]||0));
    const totalAct=actuals.reduce((a,b)=>a+b,0);
    const totalFcst=incomeFcstTotalByWeek.reduce((a,b)=>a+b,0);
    const empty=incomeEvents.length===0;
    return(<>
      <tr className="abound-row" style={{background:"rgba(16,185,129,0.04)",borderBottom:`1px solid ${T.catRowBorder}`}}>
        <td data-sticky-label style={{padding:"5px 4px 5px 6px",fontSize:10,color:T.acctLabelColor,whiteSpace:"nowrap",background:"rgba(16,185,129,0.04)"}}>{account==="Main Account"?"Main":account.replace("Credit Card","CC")}</td>
        <td data-sticky-label2 style={{padding:"5px 8px",fontSize:12,fontWeight:600,whiteSpace:"nowrap",color:"#34d399",background:"rgba(16,185,129,0.04)"}}>
          <span style={{fontSize:9,marginRight:4}}>▲</span>Income
        </td>
        {actuals.map((v,i)=>(<td key={i} style={{...tdAmt(v===0?T.dimBorder:"#10b981",false)}}>{fmtMoney(v)}</td>))}
        <td style={tdTot(false)}>{fmtMoney(totalAct)}</td>
        <IncomeForecastArea totalFcst={totalFcst}/>
        <td/>
      </tr>
      {!empty&&<IncomeAddRow/>}
    </>);
  }
  function IncomeEventsGroupedRow(){
    const salActuals=actualWeeks.map(w=>Math.abs(accounts.reduce((s,acc)=>s+(weeklyByAccountCat[w.key]?.[acc]?.["Income"]||0),0)));
    const totalAct=salActuals.reduce((a,b)=>a+b,0);
    const totalFcst=incomeFcstTotalByWeek.reduce((a,b)=>a+b,0);
    const empty=incomeEvents.length===0;
    return(<>
      <tr className="abound-row" style={{background:"rgba(16,185,129,0.04)",borderBottom:`1px solid ${T.catRowBorder}`}}>
        <td data-sticky-label style={{padding:0,background:"rgba(16,185,129,0.04)"}}/>
        <td data-sticky-label2 style={{padding:"5px 12px",fontSize:12,fontWeight:600,whiteSpace:"nowrap",color:"#34d399",background:"rgba(16,185,129,0.04)"}}>
          <span style={{fontSize:9,marginRight:4}}>▲</span>Income
        </td>
        {salActuals.map((v,i)=>(<td key={i} style={{...tdAmt(v===0?T.dimBorder:"#10b981",false)}}>{fmtMoney(v)}</td>))}
        <td style={tdTot(false)}>{fmtMoney(totalAct)}</td>
        <IncomeForecastArea totalFcst={totalFcst}/>
        <td/>
      </tr>
      {!empty&&<IncomeAddRow/>}
    </>);
  }

  function AccountSection({account}){
    const isMainAcc=account==="Main Account";
    const incomeCats=isMainAcc?categories.filter(c=>c==="Income"):categories.filter(c=>c==="Card Repayment");
    // For CC accounts Card Repayment is income, exclude from spend
    const allSpendCats=[...new Set([...categories.filter(c=>c!=="Income"&&c!=="Salary"&&c!=="Investments"&&(isMainAcc||c!=="Card Repayment")), ...(isMainAcc?[INTERCOMPANY_CATEGORY]:[])  ])];
    // Hide categories with <£5 total spend for this account (keeps table clean on accounts with few transactions)
    const spendCatsLocal=allSpendCats.filter(cat=>{
      const totalActual=actualWeeks.reduce((s,w)=>s+Math.abs(weeklyByAccountCat[w.key]?.[account]?.[cat]||0),0);
      const totalForecast=(forecastData[account]?.[cat]||[]).reduce((s,v)=>s+(v||0),0);
      return totalActual>=5||totalForecast>=5;
    });
    const netSpendCats=singleAccount?spendCatsLocal:spendCatsLocal.filter(c=>c!=="Card Repayment");
    const accActuals=actualWeeks.map(w=>netSpendCats.reduce((s,c)=>s+Math.abs(weeklyByAccountCat[w.key]?.[account]?.[c]||0),0));
    const accForecasts=forecastWeeks.map((_,i)=>netSpendCats.reduce((s,c)=>s+(forecastData[account]?.[c]?.[i]||0),0));
    const incomeCatList=isMainAcc?["Income"]:["Card Repayment"];
    const accIncome=actualWeeks.map(w=>incomeCatList.reduce((s,c)=>s+Math.abs(weeklyByAccountCat[w.key]?.[account]?.[c]||0),0));
    const accIncomeForecasts=forecastWeeks.map((_,i)=>isMainAcc?incomeFcstTotalByWeek[i]||0:incomeCatList.reduce((s,c)=>s+(forecastData[account]?.[c]?.[i]||0),0));
    const weeklyNetActual=actualWeeks.map((_,i)=>accIncome[i]-accActuals[i]);
    const weeklyNetForecast=forecastWeeks.map((_,i)=>accIncomeForecasts[i]-accForecasts[i]);
   const knownBalances=actualWeeks.map(w=>weekBalances[w.key]?.[account]??null);
    const closingBalances=Array(actualWeeks.length).fill(null);
    knownBalances.forEach((b,i)=>{if(b!==null)closingBalances[i]=b;});
    for(let i=0;i<actualWeeks.length-1;i++){
      if(closingBalances[i]!==null&&closingBalances[i+1]===null)
        closingBalances[i+1]=closingBalances[i]+weeklyNetActual[i+1];
    }
    for(let i=actualWeeks.length-1;i>0;i--){
      if(closingBalances[i]!==null&&closingBalances[i-1]===null)
        closingBalances[i-1]=closingBalances[i]-weeklyNetActual[i];
    }
    const lastActualBal=closingBalances.filter(b=>b!==null).slice(-1)[0]??null;
    const openingBalances=closingBalances.map((b,i)=>b!==null?b-weeklyNetActual[i]:null);
    const forecastBalances=Array(forecastWeeks.length).fill(null);
    if(lastActualBal!==null){forecastBalances[0]=lastActualBal;for(let i=1;i<forecastWeeks.length;i++)forecastBalances[i]=forecastBalances[i-1]+weeklyNetForecast[i-1];}
    const netFmt=v=>v===0?"-":v>0?`£${Math.round(v).toLocaleString()}`:`(£${Math.round(Math.abs(v)).toLocaleString()})`;
    return(
      <>
        <tr style={{background:isDark?"linear-gradient(90deg,#1a1740,#1e1b4b 40%,#231f5a)":"linear-gradient(90deg,#ede9fe,#e0e7ff 40%,#ddd6fe)"}}>
          <td colSpan={2} style={{padding:"10px 16px",fontSize:11,fontWeight:800,color:isDark?"#c7d2fe":"#4338ca",letterSpacing:"0.06em",textTransform:"uppercase"}}>
            <span style={{display:"inline-flex",alignItems:"center",gap:8}}>
              <span style={{width:3,height:14,borderRadius:2,background:"#6366f1",display:"inline-block"}}/>
              {account}
              {account!=="Main Account"&&(
                <button onClick={()=>setCollapsedAccounts(s=>{const n=new Set(s);n.has(account)?n.delete(account):n.add(account);return n;})}
                  style={{marginLeft:8,fontSize:9,padding:"2px 8px",borderRadius:4,border:"1px solid #4338ca",background:"rgba(99,102,241,0.15)",color:"#a5b4fc",cursor:"pointer",fontWeight:700,letterSpacing:"0.05em"}}>
                  {collapsedAccounts.has(account)?"▶ EXPAND":"▼ MINIMISE"}
                </button>
              )}
            </span>
          </td>
          {actualWeeks.map((_,i)=><td key={i} style={{background:"transparent",borderRight:`1px solid ${T.dimBorder}`}}/>)}
          <td style={{borderLeft:`2px solid ${T.dimBorder}`,borderRight:`2px solid ${T.dimBorder}`}}/>
          {visibleForecastWeeks.map((_,i)=><td key={i} style={{background:"rgba(99,102,241,0.1)",borderRight:`1px solid ${T.border2}`,...blurStyle(i)}}/>)}
          <td style={{background:"rgba(99,102,241,0.1)",borderLeft:`2px solid ${T.border2}`}}/><td/>
        </tr>
        {!collapsedAccounts.has(account)&&<tr className="abound-row" style={{background:T.summaryRow,borderBottom:`1px solid ${T.dimBorderMid}`}}>
          <td style={{padding:"5px 6px 5px 12px",fontSize:10,color:T.acctDotColor}}/>
          <td style={{padding:"5px 12px",fontSize:11,fontWeight:700,color:T.dimText,cursor:"help"}}
            onMouseEnter={e=>{const r=e.currentTarget.getBoundingClientRect();showTooltip(ROW_TOOLTIPS["Opening Balance"],r.left,r.bottom+6);}}
            onMouseLeave={()=>setTooltip(null)}>
            Opening Balance <span style={{fontSize:9,color:T.dimBorder,verticalAlign:"super"}}>ⓘ</span>
          </td>
          {openingBalances.map((bal,i)=><td key={i} style={{padding:"5px 10px",textAlign:"right",fontSize:12,color:bal===null?T.openBalNullColor:bal>=0?"#10b981":"#ef4444",borderRight:`1px solid ${T.dimBorderMid}`,fontVariantNumeric:"tabular-nums"}}>{bal!==null?fmtMoney(bal):"—"}</td>)}
          <td style={{borderLeft:`2px solid ${T.dimBorder}`,borderRight:`2px solid ${T.dimBorder}`}}/>
          {visibleForecastWeeks.map((_,i)=>{const bal=forecastBalances[i];return <td key={i} style={{padding:"5px 10px",textAlign:"right",fontSize:12,color:bal===null?T.openBalNullColor:bal>=0?"#10b981":"#ef4444",background:T.forecastCell,borderRight:`1px dashed ${T.dimBorder}`,fontVariantNumeric:"tabular-nums",...blurStyle(i)}}>{bal!==null?fmtMoney(bal):"—"}</td>;})}
          <td style={{borderLeft:`2px solid ${T.dimBorder}`}}/><td/>
        </tr>}
        {!collapsedAccounts.has(account)&&(isMainAcc?<IncomeEventsRow key="income-events" account={account}/>:incomeCats.map(cat=><CatRow key={cat} cat={cat} account={account}/>))}
        {!collapsedAccounts.has(account)&&spendCatsLocal.filter(c=>c!=="Card Repayment").map(cat=><CatRow key={cat} cat={cat} account={account}/>)}
        {!collapsedAccounts.has(account)&&isMainAcc&&<CatRow key="Card Repayment" cat="Card Repayment" account={account}/>}
        {events.filter(ev=>forecastWeeks.some(w=>w.key===ev.weekKey)).length>0&&(
          <tr className="abound-row" style={{background:"rgba(217,119,6,0.06)",borderBottom:"1px solid rgba(217,119,6,0.15)"}}>
            <td data-sticky-label style={{background:"rgba(217,119,6,0.06)"}}/>
            <td data-sticky-label2 style={{padding:"5px 12px",fontSize:11,fontWeight:700,color:"#d97706",background:"rgba(217,119,6,0.06)"}}>Planned expenses</td>
            {actualWeeks.map((_,i)=><td key={i} style={tdAmt("#d1d5db",false)}>—</td>)}
            <td style={tdTot(false)}>—</td>
            {visibleForecastWeeks.map((w,i)=>{
              const wkEvents=events.filter(ev=>ev.weekKey===w.key);
              const total=wkEvents.reduce((s,ev)=>s+ev.amount,0);
              return(
                <td key={i} style={{...tdAmt(total>0?"#d97706":"#d1d5db",true),...blurStyle(i),position:"relative"}}>
                  {total>0?(
                    <span title={wkEvents.map(e=>`${e.label}: £${e.amount}`).join("\n")} style={{cursor:"help"}}>
                      {fmtMoney(total)}
                      <button onClick={()=>setEvents(ev=>ev.filter(e=>e.weekKey!==w.key))} style={{marginLeft:4,fontSize:8,color:"#ef4444",border:"none",background:"none",cursor:"pointer",verticalAlign:"middle"}}>×</button>
                    </span>
                  ):"—"}
                </td>
              );
            })}
            <td style={tdTot(true)}>{fmtMoney(events.reduce((s,ev)=>s+ev.amount,0))}</td>
            <td/>
          </tr>
        )}
        <tr className="abound-row" style={{background:T.summaryRow,borderBottom:`2px solid ${T.border2}`}}>
          <td data-sticky-label style={{background:T.summaryRow}}/>
          <td data-sticky-label2 style={{padding:"7px 12px",fontSize:11,fontWeight:800,color:T.dimText,letterSpacing:"0.04em",cursor:"help",background:T.summaryRow}}
            onMouseEnter={e=>{const r=e.currentTarget.getBoundingClientRect();setTooltip({text:netMovementTip,x:r.left,y:r.bottom+6});}}
            onMouseLeave={()=>setTooltip(null)}>NET MOVEMENT <span style={{fontSize:9,color:T.dimText,verticalAlign:"super"}}>ⓘ</span></td>
          {weeklyNetActual.map((v,i)=><td key={i} style={{padding:"5px 10px",textAlign:"right",fontSize:12,fontWeight:700,color:v>=0?"#10b981":"#ef4444",borderRight:`1px solid ${T.dimBorderMid}`,fontVariantNumeric:"tabular-nums"}}>{netFmt(v)}</td>)}
          <td style={{...tdTot(false),color:weeklyNetActual.reduce((a,b)=>a+b,0)>=0?"#10b981":"#ef4444"}}>{netFmt(weeklyNetActual.reduce((a,b)=>a+b,0))}</td>
          {visibleForecastWeeks.map((_,i)=>{const v=weeklyNetForecast[i]||0;return <td key={i} style={{padding:"5px 10px",textAlign:"right",fontSize:12,fontWeight:700,color:v>=0?"#10b981":"#ef4444",background:"rgba(99,102,241,0.04)",borderRight:`1px dashed ${T.border2}`,fontVariantNumeric:"tabular-nums",...blurStyle(i)}}>{netFmt(v)}</td>;})}
          <td style={{...tdTot(true),color:weeklyNetForecast.reduce((a,b)=>a+b,0)>=0?"#10b981":"#ef4444"}}>{netFmt(weeklyNetForecast.reduce((a,b)=>a+b,0))}</td>
          <td/>
        </tr>
      </>
    );
  }

  function GroupedCatRow({cat}){
    const isIncome=cat==="Income";
    const isInvestments=cat==="Investments";
    const key=`g::${cat}`;
    const hidden=hiddenCats.has(key);
    const actuals=actualWeeks.map(w=>Math.abs(accounts.reduce((s,acc)=>s+(weeklyByAccountCat[w.key]?.[acc]?.[cat]||0),0)));
    const forecasts=forecastWeeks.map((_,i)=>accounts.reduce((s,acc)=>s+(forecastData[acc]?.[cat]?.[i]||0),0));
    const visibleForecasts=visibleForecastWeeks.map((_,i)=>forecasts[i]||0);
    const totalAct=actuals.reduce((a,b)=>a+b,0);
    const totalFcst=forecasts.reduce((a,b)=>a+b,0);
    const rowColor=isIncome?"rgba(16,185,129,0.04)":isInvestments?"rgba(16,185,129,0.04)":"transparent";
    const textColor=isIncome?"#34d399":isInvestments?"#34d399":T.catText;
    return(
      <tr className="abound-row" style={{opacity:hidden?0.25:1,borderBottom:`1px solid ${T.catRowBorder}`,background:rowColor,cursor:"default"}}>
        <td data-sticky-label style={{padding:0,minWidth:isMobile?26:undefined,background:(isIncome||isInvestments)?"rgba(16,185,129,0.04)":"transparent"}}/>
        <td data-sticky-label2 style={{padding:"5px 12px",fontSize:12,fontWeight:600,whiteSpace:"nowrap",color:textColor,cursor:"help",position:"relative",background:(isIncome||isInvestments)?"rgba(16,185,129,0.04)":T.tableBg}}
          onMouseEnter={e=>{const tip=ROW_TOOLTIPS[cat];if(tip){const r=e.currentTarget.getBoundingClientRect();setTooltip({text:tip,x:r.left,y:r.bottom+6});}}}
          onMouseLeave={()=>setTooltip(null)}>
          {isIncome&&<span style={{fontSize:9,marginRight:4}}>▲</span>}
          {isInvestments&&<span style={{fontSize:9,marginRight:4}}>📈</span>}
          {cat}
          <span style={{marginLeft:4,fontSize:9,color:T.dimText,verticalAlign:"super"}}>ⓘ</span>
        </td>
        {actuals.map((v,i)=>(
          <td key={i}
            style={{...tdAmt(v===0?T.dimBorder:isIncome?"#10b981":isInvestments?"#10b981":"#9ca3af",false),cursor:v>0?"pointer":"default",userSelect:"none"}}
            onClick={v>0?e=>openCtxMenu(e,"ALL",cat,actualWeeks[i].key):undefined}
            onContextMenu={v>0?e=>openCtxMenu(e,"ALL",cat,actualWeeks[i].key):undefined}>
            {v>0?<span style={{borderBottom:`1px dashed ${T.border2}`}}>{fmtMoney(v)}</span>:fmtMoney(v)}
          </td>
        ))}
        <td style={tdTot(false)}>{fmtMoney(totalAct)}</td>
        {visibleForecasts.map((v,i)=>{
          const wk=forecastWeeks[i];
          const isEditing=editingEvent?.weekKey===wk?.key&&editingEvent?.cat===cat&&editingEvent?.account==="ALL";
          return(
            <td key={i} style={{...tdAmt(v===0?"#d1d5db":PURPLE,true,false,i,false),...blurStyle(i),outline:isEditing?"2px solid #6366f1":"none",outlineOffset:"-2px",cursor:i>=6&&!isPro?"default":"pointer"}}
              onClick={e=>{if(i>=6&&!isPro)return;if(!isEditing){const r=e.currentTarget.getBoundingClientRect();setEditingEvent({weekKey:wk?.key,cat,account:"ALL",label:"",amount:"",x:Math.min(r.left,window.innerWidth-220),y:r.bottom+4});}}}>
              {fmtMoney(v)}
            </td>
          );
        })}
        <td style={tdTot(true)}>{fmtMoney(totalFcst)}</td>
        <td style={{padding:"3px 6px",textAlign:"center"}}>
          <button onClick={()=>setHiddenCats(s=>{const n=new Set(s);n.has(key)?n.delete(key):n.add(key);return n;})} style={{fontSize:9,padding:"1px 6px",borderRadius:4,border:`1px solid ${hidden?T.dimText:T.border}`,background:hidden?"rgba(239,68,68,0.1)":"transparent",color:hidden?"#ef4444":T.dimText,cursor:"pointer"}}>
            {hidden?"show":"hide"}
          </button>
        </td>
      </tr>
    );
  }

  function GroupedSection(){
    const spendCats=categories.filter(c=>c!=="Income"&&c!=="Salary").filter(cat=>{
      const totalActual=actualWeeks.reduce((s,w)=>s+Math.abs(accounts.reduce((s2,acc)=>s2+(weeklyByAccountCat[w.key]?.[acc]?.[cat]||0),0)),0);
      const totalForecast=forecastWeeks.reduce((s,_,i)=>s+accounts.reduce((s2,acc)=>s2+(forecastData[acc]?.[cat]?.[i]||0),0),0);
      return totalActual>=5||totalForecast>=5;
    });
    const netSpendCats=singleAccount?spendCats:spendCats.filter(c=>c!=="Card Repayment");
    const accActuals=actualWeeks.map(w=>netSpendCats.reduce((s,cat)=>s+Math.abs(accounts.reduce((s2,acc)=>s2+(weeklyByAccountCat[w.key]?.[acc]?.[cat]||0),0)),0));
    const accForecasts=forecastWeeks.map((_,i)=>netSpendCats.reduce((s,cat)=>s+accounts.reduce((s2,acc)=>s2+(forecastData[acc]?.[cat]?.[i]||0),0),0));
    const salaryActuals=actualWeeks.map(w=>Math.abs(accounts.reduce((s,acc)=>s+(weeklyByAccountCat[w.key]?.[acc]?.["Income"]||0),0)));
    const salaryForecasts=incomeFcstTotalByWeek;
    const weeklyNetActual=actualWeeks.map((_,i)=>salaryActuals[i]-accActuals[i]);
    const weeklyNetForecast=forecastWeeks.map((_,i)=>salaryForecasts[i]-accForecasts[i]);
    const netFmt=v=>v===0?"-":v>0?`£${Math.round(v).toLocaleString()}`:`(£${Math.round(Math.abs(v)).toLocaleString()})`;
    return(
      <>
        <IncomeEventsGroupedRow/>
        {spendCats.map(cat=><GroupedCatRow key={cat} cat={cat}/>)}
        {events.filter(ev=>forecastWeeks.some(w=>w.key===ev.weekKey)).length>0&&(
          <tr className="abound-row" style={{background:"rgba(217,119,6,0.06)",borderBottom:"1px solid rgba(217,119,6,0.15)"}}>
            <td data-sticky-label style={{background:"rgba(217,119,6,0.06)"}}/>
            <td data-sticky-label2 style={{padding:"5px 12px",fontSize:11,fontWeight:700,color:"#d97706",background:"rgba(217,119,6,0.06)"}}>Planned expenses</td>
            {actualWeeks.map((_,i)=><td key={i} style={tdAmt("#d1d5db",false)}>—</td>)}
            <td style={tdTot(false)}>—</td>
            {visibleForecastWeeks.map((w,i)=>{
              const wkEvents=events.filter(ev=>ev.weekKey===w.key);
              const total=wkEvents.reduce((s,ev)=>s+ev.amount,0);
              return(
                <td key={i} style={{...tdAmt(total>0?"#d97706":"#d1d5db",true),...blurStyle(i),position:"relative"}}>
                  {total>0?(
                    <span title={wkEvents.map(e=>`${e.label}: £${e.amount}`).join("\n")} style={{cursor:"help"}}>
                      {fmtMoney(total)}
                      <button onClick={()=>setEvents(ev=>ev.filter(e=>e.weekKey!==w.key))} style={{marginLeft:4,fontSize:8,color:"#ef4444",border:"none",background:"none",cursor:"pointer",verticalAlign:"middle"}}>×</button>
                    </span>
                  ):"—"}
                </td>
              );
            })}
            <td style={tdTot(true)}>{fmtMoney(events.reduce((s,ev)=>s+ev.amount,0))}</td>
            <td/>
          </tr>
        )}
        <tr className="abound-row" style={{background:T.summaryRow,borderBottom:`2px solid ${T.border2}`}}>
          <td data-sticky-label style={{background:T.summaryRow}}/>
          <td data-sticky-label2 style={{padding:"7px 12px",fontSize:11,fontWeight:800,color:T.dimText,letterSpacing:"0.04em",cursor:"help",background:T.summaryRow}}
            onMouseEnter={e=>{const r=e.currentTarget.getBoundingClientRect();setTooltip({text:netMovementTip,x:r.left,y:r.bottom+6});}}
            onMouseLeave={()=>setTooltip(null)}>NET MOVEMENT <span style={{fontSize:9,color:T.dimText,verticalAlign:"super"}}>ⓘ</span></td>
          {weeklyNetActual.map((v,i)=><td key={i} style={{padding:"5px 10px",textAlign:"right",fontSize:12,fontWeight:700,color:v>=0?"#10b981":"#ef4444",borderRight:`1px solid ${T.dimBorderMid}`,fontVariantNumeric:"tabular-nums"}}>{netFmt(v)}</td>)}
          <td style={{...tdTot(false),color:weeklyNetActual.reduce((a,b)=>a+b,0)>=0?"#10b981":"#ef4444"}}>{netFmt(weeklyNetActual.reduce((a,b)=>a+b,0))}</td>
          {visibleForecastWeeks.map((_,i)=>{const v=weeklyNetForecast[i]||0;return <td key={i} style={{padding:"5px 10px",textAlign:"right",fontSize:12,fontWeight:700,color:v>=0?"#10b981":"#ef4444",background:"rgba(99,102,241,0.04)",borderRight:`1px dashed ${T.border2}`,fontVariantNumeric:"tabular-nums",...blurStyle(i)}}>{netFmt(v)}</td>;})}
          <td style={{...tdTot(true),color:weeklyNetForecast.reduce((a,b)=>a+b,0)>=0?"#10b981":"#ef4444"}}>{netFmt(weeklyNetForecast.reduce((a,b)=>a+b,0))}</td>
          <td/>
        </tr>
      </>
    );
  }

  const currentStep = tourStep!==null ? TOUR_STEPS[tourStep] : null;

  return(
    <div style={{display:"flex",flex:1,overflow:"hidden",position:"relative",background:T.bg,transition:"background 0.25s"}}>
      <style>{GLOBAL_CSS}</style>
      {/* Subtle grid + radial glow — dark mode only */}
      {isDark&&<>
        <div style={{position:"absolute",inset:0,background:"radial-gradient(ellipse at 65% 20%,rgba(99,102,241,0.13) 0%,transparent 55%)",pointerEvents:"none",zIndex:0}}/>
        <div style={{position:"absolute",inset:0,backgroundImage:"linear-gradient(rgba(99,102,241,0.07) 1px,transparent 1px),linear-gradient(90deg,rgba(99,102,241,0.07) 1px,transparent 1px)",backgroundSize:"48px 48px",pointerEvents:"none",zIndex:0}}/>
      </>}

      {/* Income event form overlay */}
      {incomeFormState&&(
        <>
          <div style={{position:"fixed",inset:0,zIndex:9994}} onClick={()=>closeIncomeForm()}/>
          <div style={{position:"fixed",top:incomeFormState.y,left:incomeFormState.x,zIndex:9995,background:T.tooltipBg,border:"1px solid #6366f1",borderRadius:10,padding:"12px 14px",minWidth:270,boxShadow:"0 6px 28px rgba(0,0,0,0.35)",animation:"tooltipIn 0.12s ease both"}} onClick={e=>e.stopPropagation()}>
            <div style={{fontSize:10,color:"#6366f1",fontWeight:700,marginBottom:8,letterSpacing:"0.06em"}}>{incomeFormState.editId?"EDIT INCOME":"ADD INCOME"}</div>
            {!incomeFormState.editId&&salarySuggestion&&(
              <div style={{marginBottom:10,padding:"10px 12px",background:T.theadA,border:"1px solid rgba(99,102,241,0.5)",borderRadius:8}}>
                <div style={{fontSize:11,fontWeight:700,color:"#a5b4fc",marginBottom:5}}>⚡ Last big payment: £{Math.round(salarySuggestion.amount).toLocaleString()} on {fmt(salarySuggestion.date)}</div>
                <div onClick={()=>applySuggestion(salarySuggestion)} style={{fontSize:11,color:"#818cf8",cursor:"pointer",fontWeight:600}}>Use this as my monthly salary →</div>
              </div>
            )}
            <input autoFocus placeholder="Label (e.g. Nike project, Salary)" value={incomeFormState.data.label}
              onChange={e=>setIncomeFormState(s=>({...s,data:{...s.data,label:e.target.value}}))}
              onKeyDown={e=>{if(e.key==="Escape")closeIncomeForm(true);}}
              style={{...inpStyle,width:"100%",marginBottom:6,boxSizing:"border-box"}}/>
            <div style={{display:"flex",gap:5,marginBottom:6}}>
              <input type="number" placeholder="£ amount" min="0" value={incomeFormState.data.amount}
                onChange={e=>setIncomeFormState(s=>({...s,data:{...s.data,amount:e.target.value}}))}
                onKeyDown={e=>{if(e.key==="Enter")saveIncomeForm();if(e.key==="Escape")closeIncomeForm(true);}}
                style={{...inpStyle,flex:1}}/>
            </div>
            <div style={{fontSize:9,color:T.dimText,marginBottom:3}}>Expected payment date</div>
            <input type="date" value={incomeFormState.data.expectedDate}
              onChange={e=>setIncomeFormState(s=>({...s,data:{...s.data,expectedDate:e.target.value}}))}
              style={{...inpStyle,width:"100%",marginBottom:6,boxSizing:"border-box"}}/>
            <select value={incomeFormState.data.recurrence}
              onChange={e=>setIncomeFormState(s=>({...s,data:{...s.data,recurrence:e.target.value}}))}
              style={{...inpStyle,width:"100%",marginBottom:8,boxSizing:"border-box"}}>
              <option value="none">One-time</option>
              <option value="weekly">Weekly</option>
              <option value="biweekly">Bi-weekly</option>
              <option value="monthly">Monthly</option>
            </select>
            <div style={{display:"flex",gap:5}}>
              <button onClick={saveIncomeForm} style={{flex:1,padding:"5px 10px",background:"#6366f1",color:"#fff",border:"none",borderRadius:6,fontSize:11,fontWeight:700,cursor:"pointer"}}>Save</button>
              {incomeFormState.editId&&<button onClick={deleteIncomeEvent} style={{padding:"5px 10px",background:"rgba(239,68,68,0.15)",color:"#ef4444",border:"1px solid rgba(239,68,68,0.3)",borderRadius:6,fontSize:11,cursor:"pointer"}}>Delete</button>}
              <button onClick={()=>closeIncomeForm(true)} style={{padding:"5px 9px",background:"none",color:T.dimText,border:`1px solid ${T.dimBorder}`,borderRadius:6,fontSize:12,cursor:"pointer"}}>×</button>
            </div>
          </div>
        </>
      )}

      {/* Plan-a-purchase overlay — rendered here (not inside CatRow) so typing doesn't unmount it */}
      {editingEvent&&(
        <>
          <div style={{position:"fixed",inset:0,zIndex:9994}} onClick={()=>setEditingEvent(null)}/>
          <div style={{position:"fixed",top:editingEvent.y,left:editingEvent.x,zIndex:9995,background:T.tooltipBg,border:"1px solid #6366f1",borderRadius:10,padding:"10px 12px",minWidth:200,boxShadow:"0 6px 28px rgba(0,0,0,0.3)",animation:"tooltipIn 0.12s ease both"}}
            onClick={e=>e.stopPropagation()}>
            <div style={{fontSize:10,color:"#6366f1",fontWeight:700,marginBottom:7,letterSpacing:"0.06em"}}>ONE-OFF EXPENSE</div>
            <input autoFocus placeholder="What is it? (e.g. New phone)" value={editingEvent.label} onChange={e=>setEditingEvent(ev=>({...ev,label:e.target.value}))}
              onKeyDown={e=>{if(e.key==="Escape")setEditingEvent(null);}}
              style={{width:"100%",marginBottom:6,padding:"5px 8px",background:T.budgetInputBg,border:`1px solid ${T.dimBorder}`,borderRadius:6,color:T.text,fontSize:12,outline:"none"}}/>
            <div style={{display:"flex",gap:5}}>
              <input placeholder="£ amount" type="number" min="0" value={editingEvent.amount} onChange={e=>setEditingEvent(ev=>({...ev,amount:e.target.value}))}
                onKeyDown={e=>{if(e.key==="Enter"){const amt=parseFloat(editingEvent.amount);if(!isNaN(amt)&&amt>0&&editingEvent.label){setEvents(ev=>[...ev,{id:Date.now(),weekKey:editingEvent.weekKey,label:editingEvent.label,amount:amt}]);}setEditingEvent(null);}if(e.key==="Escape")setEditingEvent(null);}}
                style={{flex:1,padding:"5px 8px",background:T.budgetInputBg,border:`1px solid ${T.dimBorder}`,borderRadius:6,color:T.text,fontSize:12,outline:"none"}}/>
              <button onClick={()=>{const amt=parseFloat(editingEvent.amount);if(!isNaN(amt)&&amt>0&&editingEvent.label){setEvents(ev=>[...ev,{id:Date.now(),weekKey:editingEvent.weekKey,label:editingEvent.label,amount:amt}]);}setEditingEvent(null);}}
                style={{padding:"5px 12px",background:"#6366f1",color:"#fff",border:"none",borderRadius:6,fontSize:11,fontWeight:700,cursor:"pointer"}}>Add</button>
              <button onClick={()=>setEditingEvent(null)}
                style={{padding:"5px 9px",background:"none",color:T.dimText,border:`1px solid ${T.dimBorder}`,borderRadius:6,fontSize:12,cursor:"pointer"}}>×</button>
            </div>
          </div>
        </>
      )}


      {/* Right-click category menu */}
      {ctxMenu&&(()=>{
        const {txns, selectedKeys, cat, account, weekKey} = ctxMenu;
        const multi = txns.length > 1;
        const fmtDate = d => d.toLocaleDateString("en-GB",{weekday:"short",day:"numeric",month:"short"});
        const truncate = (s,n=28) => s.length>n?s.slice(0,n-1)+"…":s;
        const selCount = selectedKeys.size;
        // Position: clamp so menu stays on screen
        const menuW = 230;
        const left = Math.min(ctxMenu.x, window.innerWidth - menuW - 8);
        return(
          <>
            <div style={{position:"fixed",inset:0,zIndex:9990}} onClick={()=>setCtxMenu(null)}/>
            <div style={{position:"fixed",left:left,top:ctxMenu.y,zIndex:9991,background:T.tooltipBg,border:`1px solid ${T.tooltipBorder}`,borderRadius:10,padding:"6px 0",boxShadow:"0 8px 32px rgba(0,0,0,0.3)",width:menuW,animation:"tooltipIn 0.15s ease both"}}>

              {/* Transaction summary */}
              <div style={{padding:"8px 12px",borderBottom:`1px solid ${T.dimBorderMid}`}}>
                <div style={{fontSize:9,fontWeight:700,color:"#6366f1",letterSpacing:"0.08em",marginBottom:6}}>
                  {multi?`${txns.length} TRANSACTIONS IN THIS CELL`:"TRANSACTION"}
                </div>
                {txns.map(t=>{
                  const key=txnKey(t);
                  const checked=selectedKeys.has(key);
                  return(
                    <div key={key}
                      onClick={multi?()=>{
                        setCtxMenu(prev=>{
                          const next=new Set(prev.selectedKeys);
                          checked?next.delete(key):next.add(key);
                          return {...prev,selectedKeys:next};
                        });
                      }:undefined}
                      style={{display:"flex",alignItems:"flex-start",gap:7,padding:"4px 2px",borderRadius:5,cursor:multi?"pointer":"default",userSelect:"none",
                        background:multi&&checked?"rgba(99,102,241,0.08)":"none",marginBottom:2}}>
                      {multi&&(
                        <div style={{marginTop:2,width:13,height:13,borderRadius:3,border:`1.5px solid ${checked?"#6366f1":"#374151"}`,background:checked?"#6366f1":"none",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center"}}>
                          {checked&&<svg width="8" height="8" viewBox="0 0 10 10" fill="none"><path d="M2 5l2.5 2.5L8 3" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                        </div>
                      )}
                      <div style={{minWidth:0}}>
                        <div style={{fontSize:11,fontWeight:600,color:T.text,lineHeight:1.3,wordBreak:"break-word"}}>{t.narrative}</div>
                        <div style={{fontSize:10,color:"#6b7280",marginTop:1}}>
                          £{Math.abs(t.amount).toFixed(2)} · {fmtDate(t.date)}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Category list */}
              <div style={{padding:"4px 0 2px"}}>
                <div style={{padding:"5px 12px 6px",fontSize:9,fontWeight:700,color:"#6366f1",letterSpacing:"0.08em"}}>
                  {multi&&selCount<txns.length?`MOVE ${selCount} SELECTED TO`:"MOVE TO CATEGORY"}
                </div>
                {selCount===0&&(
                  <div style={{padding:"6px 12px",fontSize:11,color:"#6b7280",fontStyle:"italic"}}>Select at least one transaction</div>
                )}
                {selCount>0&&categories.filter(c=>c!==cat).map(c=>(
                  <button key={c} onClick={()=>{
                    if(onUpdateTxns){
                      onUpdateTxns(transactions.map(t=>selectedKeys.has(txnKey(t))?{...t,category:c}:t));
                    }
                    setCtxMenu(null);
                  }}
                  style={{display:"block",width:"100%",padding:"7px 14px",background:"none",border:"none",color:T.catText,fontSize:12,cursor:"pointer",textAlign:"left"}}
                  onMouseEnter={e=>e.currentTarget.style.background="rgba(99,102,241,0.12)"}
                  onMouseLeave={e=>e.currentTarget.style.background="none"}>
                    {c}
                  </button>
                ))}
              </div>
            </div>
          </>
        );
      })()}

      {/* Tooltip */}
      {tooltip&&(
        <div style={{position:"fixed",left:tooltip.x,top:tooltip.y,zIndex:9999,maxWidth:280,background:T.tooltipBg,border:`1px solid ${T.tooltipBorder}`,borderRadius:8,padding:"8px 12px",fontSize:11,color:T.tooltipColor,lineHeight:1.5,pointerEvents:"none",animation:"tooltipIn 0.15s ease both",boxShadow:"0 4px 20px rgba(0,0,0,0.15)"}}>
          {tooltip.text}
        </div>
      )}

      {/* Tour spotlight overlay */}
      {tourVisible&&currentStep&&(()=>{
        void tourHighlightTick;
        const hr=getHighlightRect();
        return(
          <div style={{position:"fixed",inset:0,zIndex:1000,pointerEvents:"none"}}>
            {/* Only show spotlight overlay on desktop — on mobile it blocks scroll */}
            {!isMobile&&(
              <svg style={{position:"absolute",inset:0,width:"100%",height:"100%",pointerEvents:"all"}} onClick={closeTour}>
                <defs>
                  <mask id="tour-mask">
                    <rect width="100%" height="100%" fill="white"/>
                    {hr&&<rect x={hr.left} y={hr.top} width={hr.width} height={hr.height} rx="6" fill="black"/>}
                  </mask>
                </defs>
                <rect width="100%" height="100%" fill="rgba(8,7,15,0.78)" mask="url(#tour-mask)"/>
              </svg>
            )}
            {/* Highlight border glow around target */}
            {hr&&(
              <div style={{position:"fixed",left:hr.left,top:hr.top,width:hr.width,height:hr.height,borderRadius:8,border:"2px solid #6366f1",boxShadow:"0 0 0 1px rgba(99,102,241,0.4),0 0 32px rgba(99,102,241,0.35)",pointerEvents:"none",zIndex:1001,animation:"glow 2s ease-in-out infinite"}}/>
            )}
            {/* Animated cursor demo */}
            {currentStep?.cursorTarget&&(
              <AnimatedCursor targetSelector={currentStep.cursorTarget}/>
            )}
            {/* Tour card */}
            {(()=>{const cardW=isMobile?Math.min(240,window.innerWidth*0.62):440;const cardR=isMobile?Math.max(4,Math.min(12,window.innerWidth*0.015)):28;const cardB=isMobile?Math.max(8,Math.min(20,window.innerHeight*0.02)):32;return(
            <div style={{position:"fixed",bottom:cardB,right:cardR,left:"auto",width:cardW,maxWidth:`${Math.min(92,Math.round(cardW/window.innerWidth*100)+2)}vw`,background:T.card,border:"1px solid #4338ca",borderLeft:"4px solid #6366f1",borderRadius:12,padding:isMobile?"10px 10px":"26px 28px",zIndex:1002,pointerEvents:"all",animation:"spotlightIn 0.35s cubic-bezier(0.16,1,0.3,1) both",boxShadow:"0 8px 40px rgba(0,0,0,0.6)"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:isMobile?4:14}}>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:isMobile?"clamp(7px,1.8vw,10px)":10,color:"#6366f1",fontWeight:700,letterSpacing:"0.1em",marginBottom:isMobile?3:7,textTransform:"uppercase"}}>{tourStep===0?"// Welcome":`Step ${tourStep} of ${TOUR_STEPS.length-1}`}</div>
                  <div style={{fontSize:isMobile?"clamp(12px,3.5vw,16px)":20,fontWeight:800,color:"#fff",lineHeight:1.2}}>{currentStep.title}</div>
                </div>
                <button onClick={closeTour} style={{fontSize:18,color:"#4b5563",border:"none",background:"none",cursor:"pointer",marginLeft:8,lineHeight:1,flexShrink:0,padding:4}}>×</button>
              </div>
              {currentStep.body.split('\n\n').map((para,i)=>(
                <p key={i} style={{fontSize:isMobile?"clamp(10px,2.8vw,13px)":14,color:T.dimText,lineHeight:isMobile?1.5:1.75,margin:i===0?"0 0 5px":"5px 0 0"}}>{para}</p>
              ))}
              {currentStep.isReviewPrompt&&(
                <div style={{margin:"14px 0 0",borderRadius:10,overflow:"hidden",border:`1px solid ${T.dimBorder}`,background:T.tableBg}}>
                  <div style={{padding:"7px 12px",background:T.theadA,fontSize:10,fontWeight:700,color:"#6366f1",letterSpacing:"0.08em",textTransform:"uppercase",borderBottom:`1px solid ${T.border}`}}>Review Categories</div>
                  {[
                    {name:"DELIVEROO*GH7K2",amt:"£24.50",cat:"Food",color:"#10b981",delay:0},
                    {name:"AMAZON MKTPLACE",amt:"£67.99",cat:"Online Shopping",color:"#6366f1",delay:80},
                    {name:"TFL TRAVEL CH",amt:"£38.20",cat:"Travel",color:"#06b6d4",delay:160},
                    {name:"SPECSAVERS LTD",amt:"£15.00",cat:"Healthcare",color:"#f59e0b",delay:240},
                    {name:"NETFLIX.COM",amt:"£10.99",cat:"Memberships",color:"#8b5cf6",delay:320},
                  ].map(row=>(
                    <div key={row.name} style={{display:"flex",alignItems:"center",padding:"7px 12px",borderBottom:`1px solid ${T.catRowBorder}`,gap:10,animation:`fadeUp 0.3s ease ${row.delay}ms both`}}>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{fontSize:11,color:T.catText,fontFamily:"monospace",letterSpacing:"-0.02em",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{row.name}</div>
                        <div style={{fontSize:10,color:"#4b5563"}}>{row.amt}</div>
                      </div>
                      <div style={{fontSize:10,fontWeight:700,color:row.color,background:`${row.color}18`,padding:"2px 8px",borderRadius:99,flexShrink:0,border:`1px solid ${row.color}33`}}>{row.cat}</div>
                    </div>
                  ))}
                </div>
              )}
              <div style={{display:"flex",gap:6,marginTop:isMobile?"0.8vh":16,flexWrap:"wrap"}}>
                <button onClick={advanceTour}
                  style={{flex:1,padding:isMobile?"clamp(5px,1.2vh,8px) 10px":"11px 16px",background:"linear-gradient(135deg,#6366f1,#4f46e5)",color:"#fff",border:"none",borderRadius:8,fontSize:isMobile?"clamp(9px,2.6vw,12px)":13,fontWeight:700,cursor:"pointer",transition:"all 0.15s",boxShadow:"0 4px 16px rgba(99,102,241,0.3)",whiteSpace:"nowrap"}}
                  onMouseEnter={e=>e.currentTarget.style.transform="translateY(-1px)"}
                  onMouseLeave={e=>e.currentTarget.style.transform=""}>
                  {currentStep.cta}
                </button>
                {currentStep.isReviewPrompt&&(
                  <button onClick={()=>{finishTour();if(onGoToReview)onGoToReview();}} style={{padding:isMobile?"clamp(5px,1.2vh,8px) 8px":"11px 14px",background:"none",color:"#6366f1",border:`1px solid ${T.dimBorder}`,borderRadius:8,fontSize:isMobile?"clamp(9px,2.6vw,12px)":13,cursor:"pointer",whiteSpace:"nowrap",fontWeight:600}}>Review now</button>
                )}
                {currentStep.skip&&!currentStep.isReviewPrompt&&<button onClick={closeTour} style={{padding:isMobile?"clamp(5px,1.2vh,8px) 8px":"11px 14px",background:"none",color:T.dimText,border:`1px solid ${T.dimBorder}`,borderRadius:8,fontSize:isMobile?"clamp(9px,2.6vw,12px)":13,cursor:"pointer",whiteSpace:"nowrap"}}>{currentStep.skip}</button>}
              </div>
              {tourStep>0&&(
                <div style={{display:"flex",gap:4,justifyContent:"center",marginTop:isMobile?"0.8vh":16}}>
                  {TOUR_STEPS.slice(1).map((_,i)=>(
                    <div key={i} onClick={()=>setTourStep(i+1)} style={{width:5,height:5,borderRadius:"50%",background:i===tourStep-1?"#6366f1":T.dimBorder,transition:"background 0.2s",cursor:"pointer"}}/>
                  ))}
                </div>
              )}
            </div>
            );})()}
          </div>
        );
      })()}


     {/* Main table area */}
      <div style={{flex:1,overflow:"auto",display:isMobile?"block":"flex",flexDirection:"column",padding:isMobile?"8px 0 0":"20px 24px",background:"transparent",transition:"background 0.25s",zoom:isMobile?"0.6":undefined,position:"relative",zIndex:1}}>
        {(()=>{
          const totalSpent=Math.round(totalActualByWeek.reduce((a,b)=>a+b,0));
          const totalForecastSpend=Math.round(totalForecastByWeek.reduce((a,b)=>a+b,0));
          const weeklyAvg=Math.round(totalSpent/Math.max(actualWeeks.length,1));
          const lastActualBal=combinedClosingBalances.actual.filter(v=>v!==null).slice(-1)[0];
          const forecastEndBal=combinedClosingBalances.forecast[combinedClosingBalances.forecast.length-1];
          const balDiff=forecastEndBal!==null&&forecastEndBal!==undefined&&lastActualBal!==null&&lastActualBal!==undefined?forecastEndBal-lastActualBal:null;
          const cards=[
            {
              label:"Cash today",
              value:lastActualBal!=null?`£${Math.round(lastActualBal).toLocaleString()}`:"—",
              sub:"current balance",
              color:"#f8fafc",
              accent:"#6b7280",
              valColor:isDark?"#e0e7ff":"#1e1b4b",
              icon:<svg width="14" height="14" viewBox="0 0 20 20" fill="none"><rect x="2" y="5" width="16" height="11" rx="2" stroke="#9ca3af" strokeWidth="1.5"/><path d="M2 9h16" stroke="#9ca3af" strokeWidth="1.5"/><circle cx="6" cy="13" r="1" fill="#9ca3af"/></svg>
            },
            {
              label:"In 6 weeks",
              value:forecastEndBal!=null?`£${Math.round(forecastEndBal).toLocaleString()}`:"—",
              sub:balDiff!=null?(balDiff>=0?`+£${Math.round(balDiff).toLocaleString()} projected`:`−£${Math.round(Math.abs(balDiff)).toLocaleString()} projected`):"forecast balance",
              color:"#f8fafc",
              accent:balDiff!=null&&balDiff>=0?"#10b981":"#ef4444",
              valColor:balDiff!=null&&balDiff>=0?"#059669":"#ef4444",
              icon:<svg width="14" height="14" viewBox="0 0 20 20" fill="none"><path d="M3 15l4-6 4 3 4-8" stroke={balDiff!=null&&balDiff>=0?"#10b981":"#ef4444"} strokeWidth="1.5" strokeLinecap="round"/></svg>
            },
            {
              label:"Avg weekly spend",
              value:`£${weeklyAvg.toLocaleString()}`,
              sub:`over ${actualWeeks.length} weeks`,
              color:"#f8fafc",
              accent:PURPLE,
              valColor:"#6366f1",
              icon:<svg width="14" height="14" viewBox="0 0 20 20" fill="none"><rect x="3" y="10" width="3" height="7" rx="1" fill="#6366f1" opacity="0.5"/><rect x="8" y="6" width="3" height="11" rx="1" fill="#6366f1" opacity="0.7"/><rect x="13" y="3" width="3" height="14" rx="1" fill="#6366f1"/></svg>
            },
            {
              label:"Forecast spend",
              value:`£${totalForecastSpend.toLocaleString()}`,
              sub:"next 6 weeks",
              color:"#f8fafc",
              accent:totalForecastSpend>totalSpent?"#f59e0b":"#10b981",
              valColor:totalForecastSpend>totalSpent?"#d97706":"#059669",
              icon:<svg width="14" height="14" viewBox="0 0 20 20" fill="none"><path d="M3 10h14M13 6l4 4-4 4" stroke={totalForecastSpend>totalSpent?"#f59e0b":"#10b981"} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            },
          ];
          // Mobile: skip summary strip entirely — grid fills the screen
          if(isMobile){ return null; }
          return(
            <div style={{display:"flex",gap:8,marginBottom:20,alignItems:"flex-start"}}>
              {cards.map((c,i)=>(
                <div key={i} style={{flex:1,background:T.card,borderRadius:10,padding:"12px 14px",border:`1px solid ${T.border}`,boxShadow:"0 4px 20px rgba(0,0,0,0.15)",transition:"border-color 0.15s"}}
                  onMouseEnter={e=>e.currentTarget.style.borderColor=T.border2}
                  onMouseLeave={e=>e.currentTarget.style.borderColor=T.border}>
                  <div style={{fontSize:10,fontWeight:600,color:"#6b7280",letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:6}}>{c.label}</div>
                  <div style={{fontSize:21,fontWeight:700,color:c.valColor,fontVariantNumeric:"tabular-nums",letterSpacing:"-0.025em",marginBottom:2,fontFamily:"'Inter',system-ui,sans-serif"}}>{c.value}</div>
                  <div style={{fontSize:10,color:c.sub.startsWith("+")||c.sub.startsWith("−")?c.valColor:"#6b7280",fontWeight:500}}>{c.sub}</div>
                </div>
              ))}
              {/* Currency picker */}
              <div style={{position:"relative",flexShrink:0,display:"flex",flexDirection:"column",alignItems:"center",gap:3}}>
                <div style={{fontSize:9,fontWeight:700,color:T.dimText,letterSpacing:"0.06em",textTransform:"uppercase"}}>Currency</div>
                <button onClick={()=>setShowCurrencyPicker(p=>!p)}
                  style={{height:34,padding:"0 10px",borderRadius:8,border:`1px solid ${T.border}`,background:T.card,color:"#a5b4fc",cursor:"pointer",fontSize:13,fontWeight:700,display:"flex",alignItems:"center",gap:4}}>
                  {currency} <svg width="9" height="9" viewBox="0 0 10 10" fill="none"><path d="M2 3.5l3 3 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
                </button>
                {showCurrencyPicker&&(
                  <>
                    <div style={{position:"fixed",inset:0,zIndex:9990}} onClick={()=>setShowCurrencyPicker(false)}/>
                    <div style={{position:"absolute",top:"calc(100% + 6px)",right:0,zIndex:9991,background:T.tooltipBg,border:`1px solid ${T.border2}`,borderRadius:10,padding:"6px",minWidth:100,boxShadow:"0 8px 24px rgba(0,0,0,0.4)",display:"grid",gridTemplateColumns:"1fr 1fr",gap:2}}>
                      {CURRENCIES.map(c=>(
                        <button key={c.code} onClick={()=>{setCurrencySymbol(c.symbol);setCurrency(c.symbol);setShowCurrencyPicker(false);}}
                          style={{padding:"5px 8px",borderRadius:6,border:"none",background:currency===c.symbol?"rgba(99,102,241,0.2)":"transparent",color:currency===c.symbol?"#a5b4fc":T.dimText,fontSize:11,fontWeight:600,cursor:"pointer",textAlign:"left",whiteSpace:"nowrap"}}>
                          {c.symbol} {c.code}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
              <div style={{position:"relative",flexShrink:0,display:"flex",flexDirection:"column",alignItems:"center",gap:3}}>
                <div style={{fontSize:9,fontWeight:700,color:T.dimText,letterSpacing:"0.06em",textTransform:"uppercase",whiteSpace:"nowrap"}}>{isDark?"Light mode":"Dark mode"}</div>
                <button onClick={()=>{setIsDark(d=>!d);setShowThemeTip(false);localStorage.setItem("themeTipSeen","1");}} title={isDark?"Switch to light mode":"Switch to dark mode"}
                  style={{width:34,height:34,borderRadius:8,border:`1px solid ${T.border}`,background:T.card,color:isDark?"#a5b4fc":"#6366f1",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",transition:"all 0.2s"}}>
                  {isDark
                    ? <svg width="15" height="15" viewBox="0 0 20 20" fill="none"><path d="M10 2v2M10 16v2M2 10h2M16 10h2M4.93 4.93l1.41 1.41M13.66 13.66l1.41 1.41M4.93 15.07l1.41-1.41M13.66 6.34l1.41-1.41" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><circle cx="10" cy="10" r="3" stroke="currentColor" strokeWidth="1.5"/></svg>
                    : <svg width="15" height="15" viewBox="0 0 20 20" fill="none"><path d="M17 10.5A7 7 0 1 1 9.5 3c-.5 2.5.5 6 3.5 7.5 2 1 3.5.5 4 0z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  }
                </button>
                {showThemeTip&&(
                  <div style={{position:"absolute",top:"calc(100% + 8px)",right:0,whiteSpace:"nowrap",background:"#6366f1",color:"#fff",fontSize:11,fontWeight:600,padding:"5px 10px",borderRadius:7,boxShadow:"0 4px 16px rgba(99,102,241,0.4)",animation:"tooltipIn 0.2s ease both",pointerEvents:"none",zIndex:9999}}>
                    Toggle light / dark mode
                    <div style={{position:"absolute",top:-4,right:11,width:8,height:8,background:"#6366f1",transform:"rotate(45deg)"}}/>
                  </div>
                )}
              </div>
            </div>
          );
        })()}
        {/* Cash balance sparkline — between summary cards and grid */}
        {(()=>{
          const actVals=combinedClosingBalances.actual;
          const fcstVals=combinedClosingBalances.forecast.slice(0,visibleForecastWeeks.length);
          const allVals=[...actVals,...fcstVals];
          const validVals=allVals.filter(v=>v!=null);
          if(validVals.length<2) return null;
          const H=isMobile?48:80;
          const W=1000;
          const padT=isMobile?4:10,padB=isMobile?4:10,padL=2,padR=2;
          const innerH=H-padT-padB, innerW=W-padL-padR;
          const mn=Math.min(...validVals,0), mx=Math.max(...validVals), range=mx-mn||1;
          const toX=i=>padL+(i/Math.max(allVals.length-1,1))*innerW;
          const toY=v=>padT+innerH-((v-mn)/range)*innerH;
          const actN=actVals.length;
          const lastActV=actVals.filter(v=>v!=null).slice(-1)[0];
          const lastFcstV=fcstVals.filter(v=>v!=null).slice(-1)[0];
          const fcstIsUp=lastFcstV!=null&&lastActV!=null&&lastFcstV>=lastActV;
          const fcstColor=fcstIsUp?"#22c55e":"#ef4444";
          const todayPct=(actN-1)/Math.max(allVals.length-1,1)*100;
          const zeroY=toY(0);
          const showZeroLine=mn<0||mx>0;
          // Build act path
          const actPts=actVals.map((v,i)=>v!=null?`${toX(i).toFixed(1)},${toY(v).toFixed(1)}`:null).filter(Boolean);
          // Build forecast path — starts at last actual point
          const fcstPts=[
            lastActV!=null?`${toX(actN-1).toFixed(1)},${toY(lastActV).toFixed(1)}`:null,
            ...fcstVals.map((v,i)=>v!=null?`${toX(actN+i).toFixed(1)},${toY(v).toFixed(1)}`:null)
          ].filter(Boolean);
          // Act fill area path
          const actFill=actPts.length>1?`M ${toX(0).toFixed(1)} ${H-padB} L ${actPts.join(' L ')} L ${toX(actN-1).toFixed(1)} ${H-padB} Z`:'';
          // Forecast fill area
          const fcstFill=fcstPts.length>1?`M ${toX(actN-1).toFixed(1)} ${H-padB} L ${fcstPts.join(' L ')} L ${toX(allVals.length-1).toFixed(1)} ${H-padB} Z`:'';
          // Zero crossing in forecast
          let zeroCrossX=null;
          for(let i=0;i<fcstVals.length-1;i++){
            const a=fcstVals[i],b=fcstVals[i+1];
            if(a!=null&&b!=null&&((a>0&&b<=0)||(a<0&&b>=0))){
              zeroCrossX=toX(actN+i+a/(a-b));
              break;
            }
          }
          return(
            <div style={{position:"relative",marginBottom:isMobile?4:10,borderRadius:6,overflow:"hidden",background:"rgba(99,102,241,0.03)",borderBottom:`1px solid ${T.border}`,flexShrink:0}}>
              <svg viewBox={`0 0 ${W} ${H}`} fill="none" preserveAspectRatio="none"
                style={{width:"100%",height:H,display:"block",cursor:isMobile?"default":"crosshair"}}
                onMouseMove={!isMobile?e=>{const r=e.currentTarget.getBoundingClientRect();const xPct=(e.clientX-r.left)/r.width;setSparkHoverIdx(Math.max(0,Math.min(Math.round(xPct*(allVals.length-1)),allVals.length-1)));}:undefined}
                onMouseLeave={!isMobile?()=>setSparkHoverIdx(null):undefined}>
                <defs>
                  <linearGradient id="spActFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#6366f1" stopOpacity="0.15"/><stop offset="100%" stopColor="#6366f1" stopOpacity="0"/></linearGradient>
                  <linearGradient id="spFcstFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={fcstColor} stopOpacity="0.08"/><stop offset="100%" stopColor={fcstColor} stopOpacity="0"/></linearGradient>
                </defs>
                {/* Zero line */}
                {showZeroLine&&zeroY>=padT&&zeroY<=H-padB&&<line x1={padL} y1={zeroY.toFixed(1)} x2={W-padR} y2={zeroY.toFixed(1)} stroke="rgba(239,68,68,0.3)" strokeWidth="1" strokeDasharray="6,4"/>}
                {/* Fills — desktop only */}
                {!isMobile&&actFill&&<path d={actFill} fill="url(#spActFill)"/>}
                {!isMobile&&fcstFill&&<path d={fcstFill} fill="url(#spFcstFill)"/>}
                {/* Lines */}
                {actPts.length>1&&<polyline points={actPts.join(' ')} stroke="#6366f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>}
                {fcstPts.length>1&&<polyline points={fcstPts.join(' ')} stroke={fcstColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" strokeDasharray={!isMobile?"7,4":undefined}/>}
                {/* Today divider line */}
                {!isMobile&&<line x1={toX(actN-1).toFixed(1)} y1={padT} x2={toX(actN-1).toFixed(1)} y2={H-padB} stroke="rgba(255,255,255,0.18)" strokeWidth="1" strokeDasharray="3,3"/>}
                {/* Zero crossing dot */}
                {zeroCrossX!=null&&!isMobile&&zeroY>=padT&&zeroY<=H-padB&&(
                  <>
                    <circle cx={zeroCrossX.toFixed(1)} cy={zeroY.toFixed(1)} r="5" fill="#ef4444" opacity="0.85"/>
                    <circle cx={zeroCrossX.toFixed(1)} cy={zeroY.toFixed(1)} r="8" fill="none" stroke="#ef4444" strokeWidth="1" opacity="0.35"/>
                  </>
                )}
                {/* Hover dot */}
                {sparkHoverIdx!=null&&!isMobile&&allVals[sparkHoverIdx]!=null&&(()=>{
                  const hx=toX(sparkHoverIdx), hy=toY(allVals[sparkHoverIdx]);
                  return(<>
                    <line x1={hx.toFixed(1)} y1={padT} x2={hx.toFixed(1)} y2={H-padB} stroke="rgba(255,255,255,0.15)" strokeWidth="1"/>
                    <circle cx={hx.toFixed(1)} cy={hy.toFixed(1)} r="3.5" fill={sparkHoverIdx<actN?"#6366f1":fcstColor} stroke="#fff" strokeWidth="1.5"/>
                  </>);
                })()}
              </svg>
              {/* Today label */}
              {!isMobile&&<div style={{position:"absolute",top:3,left:`calc(${todayPct.toFixed(1)}% + 4px)`,fontSize:9,color:"rgba(255,255,255,0.3)",pointerEvents:"none",lineHeight:1,fontFamily:"Inter,system-ui"}}>Today</div>}
              {/* Zero cross tooltip */}
              {zeroCrossX!=null&&!isMobile&&zeroY>=padT&&zeroY<=H-padB&&(()=>{
                const crossWeekIdx=fcstVals.findIndex((a,i)=>a!=null&&fcstVals[i+1]!=null&&((a>0&&fcstVals[i+1]<=0)||(a<0&&fcstVals[i+1]>=0)));
                const wk=crossWeekIdx>=0?forecastWeeks[crossWeekIdx]:null;
                return wk?(
                  <div style={{position:"absolute",bottom:4,left:`calc(${(zeroCrossX/W*100).toFixed(1)}% - 56px)`,background:"rgba(239,68,68,0.15)",border:"1px solid rgba(239,68,68,0.4)",borderRadius:5,padding:"2px 7px",fontSize:9,color:"#fca5a5",pointerEvents:"none",whiteSpace:"nowrap"}}>Balance hits £0 · w/c {fmt(wk.date)}</div>
                ):null;
              })()}
              {/* Hover tooltip */}
              {sparkHoverIdx!=null&&!isMobile&&allVals[sparkHoverIdx]!=null&&(()=>{
                const v=allVals[sparkHoverIdx];
                const isAct=sparkHoverIdx<actN;
                const wk=isAct?actualWeeks[sparkHoverIdx]:forecastWeeks[sparkHoverIdx-actN];
                const pct=(sparkHoverIdx/Math.max(allVals.length-1,1))*100;
                return(
                  <div style={{position:"absolute",top:4,left:`clamp(4px, calc(${pct.toFixed(1)}% - 52px), calc(100% - 112px))`,background:"rgba(13,12,30,0.92)",border:"1px solid rgba(99,102,241,0.4)",borderRadius:6,padding:"3px 8px",fontSize:10,color:"#e0e7ff",pointerEvents:"none",whiteSpace:"nowrap",zIndex:10}}>
                    {wk?<span style={{color:"#6b7280",marginRight:5}}>{fmt(wk.date)}</span>:null}
                    <span style={{color:v>=0?"#10b981":"#ef4444",fontWeight:700}}>{fmtMoney(v)}</span>
                  </div>
                );
              })()}
            </div>
          );
        })()}
        {/* Grouped / By card toggle — desktop inline, mobile via fixed right bar */}
        {!isMobile&&(
          <div data-tour="view-toggle" style={{display:"flex",flexDirection:"column",alignItems:"flex-end",marginBottom:8,gap:4}}>
            <div style={{display:"flex",alignItems:"center",gap:10}}>
              {prevAccuracyData?.overallAccuracy!=null&&(
                <button onClick={()=>setShowAccuracyModal(true)}
                  style={{display:"flex",alignItems:"center",gap:5,padding:"4px 10px",height:28,background:"rgba(99,102,241,0.08)",border:"1px solid rgba(99,102,241,0.2)",borderRadius:8,fontSize:11,fontWeight:600,color:"#818cf8",cursor:"pointer",flexShrink:0,whiteSpace:"nowrap"}}>
                  <svg width="11" height="11" viewBox="0 0 20 20" fill="none"><path d="M3 15l4-6 4 3 4-8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  Last forecast: {prevAccuracyData.overallAccuracy}% accurate
                </button>
              )}
              <button onClick={openStocks} style={{display:"flex",alignItems:"center",gap:6,padding:"5px 12px",height:30,background:stocks.length?"rgba(16,185,129,0.12)":"rgba(99,102,241,0.1)",border:`1px solid ${stocks.length?"rgba(16,185,129,0.35)":"rgba(99,102,241,0.3)"}`,borderRadius:8,fontSize:11,fontWeight:700,color:stocks.length?"#10b981":"#818cf8",cursor:"pointer",flexShrink:0}}>
                <svg width="13" height="13" viewBox="0 0 20 20" fill="none"><path d="M3 13l4-5 3 3 3-4 4 3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
                {stocks.length?`Stocks (${stocks.length})`:"+ Stocks"}
              </button>
              {(()=>{const bc=Object.values(monthlyBudgets).filter(Boolean).length;return(
              <button data-tour="budget" onClick={()=>setShowBudgetPanel(true)} style={{display:"flex",alignItems:"center",gap:6,padding:"5px 12px",height:30,background:bc?"rgba(99,102,241,0.18)":"rgba(99,102,241,0.07)",border:`1px solid ${bc?"rgba(99,102,241,0.5)":"rgba(99,102,241,0.25)"}`,borderRadius:8,fontSize:11,fontWeight:700,color:bc?"#e0e7ff":"#818cf8",cursor:"pointer",flexShrink:0}}>
                <svg width="12" height="12" viewBox="0 0 20 20" fill="none"><rect x="2" y="4" width="16" height="12" rx="2" stroke="currentColor" strokeWidth="1.8"/><path d="M6 10h8M6 14h5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
                {bc?`Budget (${bc})`:"Budget"}
              </button>
              );})()}
              <span style={{fontSize:11,color:T.dimText,fontWeight:500}}>{splitByCard?"Split by card":"All accounts grouped"}</span>
              <button onClick={()=>setSplitByCard(s=>!s)} style={{position:"relative",width:44,height:24,borderRadius:12,border:"none",background:splitByCard?"#6366f1":"#374151",cursor:"pointer",padding:0,transition:"background 0.2s",flexShrink:0}}>
                <span style={{position:"absolute",top:3,left:splitByCard?22:3,width:18,height:18,borderRadius:9,background:"#fff",transition:"left 0.2s",boxShadow:"0 1px 4px rgba(0,0,0,0.25)",display:"block"}}/>
              </button>
            </div>
            {onAddAccount&&(
              <span onClick={onAddAccount} style={{fontSize:11,color:"rgba(255,255,255,0.45)",cursor:"pointer",lineHeight:1}} onMouseEnter={e=>e.currentTarget.style.color="rgba(255,255,255,0.75)"} onMouseLeave={e=>e.currentTarget.style.color="rgba(255,255,255,0.45)"}>+ Add another card or account</span>
            )}
          </div>
        )}
       {overdueBanners.length>0&&(
          <div style={{marginBottom:12}}>
            {overdueBanners.map(ev=>{
              const rs=reconcileState[ev.id];
              return(
                <div key={ev.id} style={{background:"rgba(245,158,11,0.08)",border:"1px solid rgba(245,158,11,0.25)",borderLeft:"4px solid #f59e0b",borderRadius:8,padding:"8px 12px",marginBottom:6,display:"flex",alignItems:"center",gap:10,flexWrap:"wrap"}}>
                  <div style={{flex:1,minWidth:0}}>
                    <span style={{fontSize:12,fontWeight:600,color:"#fbbf24"}}>Did <strong>{ev.label}</strong> arrive?</span>
                    <span style={{fontSize:11,color:"#9ca3af",marginLeft:8}}>Expected {ev.expectedDate?.toLocaleDateString("en-GB",{day:"numeric",month:"short"})}</span>
                  </div>
                  {rs?.mode==='receiving'?(
                    <div style={{display:"flex",gap:5,alignItems:"center",flexWrap:"wrap"}}>
                      <input type="number" placeholder="Amount" value={rs.amount||''} onChange={e=>setReconcileState(s=>({...s,[ev.id]:{...s[ev.id],amount:e.target.value}}))} style={{...inpStyle,width:90}}/>
                      <input type="date" value={rs.date||''} onChange={e=>setReconcileState(s=>({...s,[ev.id]:{...s[ev.id],date:e.target.value}}))} style={inpStyle}/>
                      <button onClick={()=>{const amt=parseFloat(rs.amount);setIncomeEvents(evs=>evs.map(e=>e.id===ev.id?{...e,status:'received',receivedAmount:!isNaN(amt)?amt:e.amount,receivedDate:rs.date?new Date(rs.date):new Date()}:e));setReconcileState(s=>({...s,[ev.id]:null}));}} style={{padding:"4px 10px",background:"#22c55e",color:"#fff",border:"none",borderRadius:5,fontSize:11,fontWeight:700,cursor:"pointer"}}>✓ Confirm</button>
                      <button onClick={()=>setReconcileState(s=>({...s,[ev.id]:null}))} style={{padding:"4px 8px",background:"none",color:T.dimText,border:`1px solid ${T.dimBorder}`,borderRadius:5,fontSize:11,cursor:"pointer"}}>✕</button>
                    </div>
                  ):rs?.mode==='delaying'?(
                    <div style={{display:"flex",gap:5,alignItems:"center"}}>
                      <input type="date" value={rs.date||''} onChange={e=>setReconcileState(s=>({...s,[ev.id]:{...s[ev.id],date:e.target.value}}))} style={inpStyle}/>
                      <button onClick={()=>{if(!rs.date)return;setIncomeEvents(evs=>evs.map(e=>e.id===ev.id?{...e,expectedDate:new Date(rs.date)}:e));setReconcileState(s=>({...s,[ev.id]:null}));}} style={{padding:"4px 10px",background:"#6366f1",color:"#fff",border:"none",borderRadius:5,fontSize:11,fontWeight:700,cursor:"pointer"}}>Update date</button>
                      <button onClick={()=>setReconcileState(s=>({...s,[ev.id]:null}))} style={{padding:"4px 8px",background:"none",color:T.dimText,border:`1px solid ${T.dimBorder}`,borderRadius:5,fontSize:11,cursor:"pointer"}}>✕</button>
                    </div>
                  ):(
                    <div style={{display:"flex",gap:5}}>
                      <button onClick={()=>setReconcileState(s=>({...s,[ev.id]:{mode:'receiving',amount:String(ev.amount),date:new Date().toISOString().slice(0,10)}}))} style={{padding:"4px 10px",background:"#22c55e",color:"#fff",border:"none",borderRadius:5,fontSize:11,fontWeight:700,cursor:"pointer"}}>✓ Mark received</button>
                      <button onClick={()=>setReconcileState(s=>({...s,[ev.id]:{mode:'delaying',date:new Date(Date.now()+7*86400000).toISOString().slice(0,10)}}))} style={{padding:"4px 9px",background:"none",color:"#fbbf24",border:"1px solid rgba(245,158,11,0.4)",borderRadius:5,fontSize:11,cursor:"pointer"}}>↻ Delay</button>
                      <button onClick={()=>setIncomeEvents(evs=>evs.map(e=>e.id===ev.id?{...e,dismissedUntil:Date.now()+48*3600*1000}:e))} style={{padding:"4px 9px",background:"none",color:T.dimText,border:`1px solid ${T.dimBorder}`,borderRadius:5,fontSize:11,cursor:"pointer"}}>✕ Dismiss</button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
       <div data-tour-table style={{background:T.tableBg,borderRadius:10,border:`1px solid ${T.border}`,overflow:"auto",WebkitOverflowScrolling:"touch",boxShadow:"0 4px 32px rgba(0,0,0,0.2)",flexShrink:0,...(isMobile?{maxHeight:`calc(100vh / 0.6)`}:{})}}>
          <table style={{width:"max-content",minWidth:"1100px",borderCollapse:"collapse"}}>
            <thead ref={theadRef} style={{position:"sticky",top:0,zIndex:5}}>
              <tr style={{background:T.theadB}}>
                <th data-sticky-hdr style={{padding:isMobile?"10px 6px":"10px 12px",textAlign:"left",position:"sticky",left:0,top:0,zIndex:6,background:T.theadA,whiteSpace:"nowrap",overflow:"hidden",maxWidth:isMobile?108:130}}>
                  {!isMobile&&<img src={logo} alt="" style={{height:20,verticalAlign:"middle",marginRight:6,mixBlendMode:"screen"}}/>}
                  <span style={{fontSize:12,fontWeight:800,color:T.text,verticalAlign:"middle"}}>Cash Flow</span>
                </th>
                <th style={{background:T.theadA,borderRight:`1px solid ${T.border2}`,width:0,padding:0}}/>
                {actualWeeks.map(w=><th key={w.key} data-tour="actual" style={{padding:"8px 10px",fontSize:11,fontWeight:700,color:T.actualHdrText,textAlign:"right",background:T.actualHdrBg,borderRight:`1px solid ${T.actualHdrBorder}`,whiteSpace:"nowrap"}}><span style={{fontSize:8,fontWeight:400,opacity:0.6}}>w/c </span>{fmt(w.date)}</th>)}
                <th style={{padding:"8px 10px",fontSize:10,fontWeight:700,color:T.dimText,textAlign:"right",background:T.totBg,borderLeft:T.borderLeft4,borderRight:T.borderLeft4,whiteSpace:"nowrap"}}>WK AVG{!isPro&&!isMobile&&<button onClick={togglePreview} title={previewCollapsed?"Expand forecast preview":"Collapse forecast preview"} style={{marginLeft:4,verticalAlign:"middle",background:"none",border:"none",cursor:"pointer",color:"rgba(99,102,241,0.65)",fontSize:15,lineHeight:1,padding:"0 1px"}}>{previewCollapsed?"›":"‹"}</button>}</th>
                {visibleForecastWeeks.map((w,i)=>{
                  const isPreview=!isPro&&i>=6;
                  const op=Math.max(0.45,1-i*0.11);
                  const isLast=i===visibleForecastWeeks.length-1;
                  return<th key={w.key} data-tour="forecast" style={{padding:isPreview?"4px 0":"8px 10px",fontSize:11,fontWeight:700,color:`rgba(99,102,241,${op})`,textAlign:"right",background:T.forecastArea,borderRight:isLast?"none":`1px solid ${T.border2}`,whiteSpace:"nowrap",...(isPreview?{width:52,maxWidth:52}:{}),...blurStyle(i)}}>
                    {!isPreview&&<><span style={{fontSize:8,fontWeight:400,opacity:0.55}}>w/c </span>{fmt(w.date)}</>}
                  </th>;
                })}
                <th style={{padding:"8px 10px",fontSize:10,fontWeight:700,color:"rgba(99,102,241,0.5)",textAlign:"right",background:T.totBg,borderLeft:T.borderLeft4,borderRight:T.borderLeft4,whiteSpace:"nowrap"}}>
                  {isPro&&!isMobile
                    ?<button onClick={toggleForecastExpanded} style={{padding:"2px 8px",fontSize:11,fontWeight:700,background:"none",border:"1px solid rgba(99,102,241,0.4)",borderRadius:8,color:"#e0e7ff",cursor:"pointer",lineHeight:1.7,letterSpacing:"0.01em",whiteSpace:"nowrap"}}>
                        {forecastExpanded?"⤡ 6 weeks":"⤢ 12 weeks"}
                      </button>
                    :!isPro&&!isMobile&&previewCollapsed
                      ?<span onClick={togglePreview} style={{cursor:"pointer",fontSize:9,color:"#818cf8",fontWeight:700,background:"rgba(99,102,241,0.1)",border:"1px solid rgba(99,102,241,0.25)",borderRadius:8,padding:"1px 6px",display:"inline-block",lineHeight:1.6}}>＋12 wks · Unlock →</span>
                      :"FCST"
                  }
                </th>
                <th style={{background:T.theadA}}/>
              </tr>
              <tr style={{background:T.theadD,borderBottom:`1px solid ${T.border2}`}}>
                <th style={{padding:"3px 12px",position:"sticky",left:0,zIndex:3,background:T.theadD,maxWidth:130,fontSize:9,fontWeight:700,color:T.dimText,textAlign:"left"}}>↑ Mon&nbsp;&nbsp;&nbsp;Sun ↑</th><th style={{background:T.theadD,width:0,padding:0}}/>
                {actualWeeks.map(w=><th key={w.key} data-tour="actual" style={{padding:"2px 10px 5px",fontSize:10,fontWeight:400,color:T.dimText,textAlign:"right",borderRight:`1px solid ${T.border}`,whiteSpace:"nowrap"}}>→ {fmt(w.sunday)}</th>)}
                <th style={{background:T.theadD,borderLeft:`2px solid ${T.border2}`,borderRight:`2px solid ${T.border2}`}}/>
                {visibleForecastWeeks.map((w,i)=>{
                  const isPreview=!isPro&&i>=6;
                  const op=Math.max(0.35,1-i*0.11);
                  const isLast=i===visibleForecastWeeks.length-1;
                  return<th key={w.key} data-tour="forecast" style={{padding:isPreview?"2px 0":"2px 10px 5px",fontSize:10,fontWeight:400,color:`rgba(99,102,241,${op*0.7})`,textAlign:"right",background:T.forecastCell,borderRight:isLast?"none":`1px dashed ${T.border2}`,whiteSpace:"nowrap",...blurStyle(i)}}>
                    {!isPreview&&<>→ {fmt(w.sunday)}</>}
                  </th>;
                })}
                <th style={{background:T.theadD,borderLeft:`2px solid ${T.border2}`,borderRight:`2px solid ${T.border2}`}}/>
                <th style={{background:T.theadD}}/>
              </tr>
              {!isPro&&!isMobile&&!previewCollapsed&&(
                <tr style={{background:"rgba(99,102,241,0.06)",borderBottom:"1px solid rgba(99,102,241,0.18)"}}>
                  <th colSpan={2+actualWeeks.length+1+6} style={{padding:0,background:"transparent"}}/>
                  <th colSpan={PREVIEW_COLS} style={{padding:"5px 10px",background:"linear-gradient(135deg,rgba(99,102,241,0.15),rgba(139,92,246,0.1))",borderLeft:"1px solid rgba(99,102,241,0.25)",borderRight:"1px solid rgba(99,102,241,0.25)"}}>
                    <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:8,whiteSpace:"nowrap"}}>
                      <span style={{fontSize:10,fontWeight:700,color:"#a5b4fc",letterSpacing:"0.02em"}}>See 12 weeks ahead</span>
                      <button onClick={()=>setShowPremiumGate(true)} style={{padding:"3px 10px",fontSize:10,fontWeight:700,background:"linear-gradient(135deg,#6366f1,#7c3aed)",color:"#fff",border:"none",borderRadius:5,cursor:"pointer",letterSpacing:"0.04em",boxShadow:"0 2px 8px rgba(99,102,241,0.4)"}}>✦ Unlock Premium</button>
                    </div>
                  </th>
                  <th colSpan={3} style={{padding:0,background:"transparent"}}/>
                </tr>
              )}
            </thead>
            <tbody>
              {/* Cash Balance — pinned as first sticky row */}
              {(()=>{
                const cbg="rgba(99,102,241,0.08)";
                const currentBal=combinedClosingBalances.actual.filter(v=>v!==null).slice(-1)[0];
                const weeklySpend=totalActualByWeek.reduce((a,b)=>a+b,0)/Math.max(actualWeeks.length,1);
                const runway=currentBal!=null&&weeklySpend>0?Math.round(currentBal/weeklySpend):null;
                return(
                  <tr data-tour="cashbalance" style={{position:"sticky",top:theadH,zIndex:3,background:cbg,borderBottom:"1px solid rgba(99,102,241,0.25)",transition:"box-shadow 0.3s",animation:highlightCashBal?"cashBalPulse 1.2s ease-in-out 2":"none"}}>
                    <td data-sticky-label colSpan={2} style={{padding:"8px 12px",fontSize:12,fontWeight:700,color:"#818cf8",cursor:"help",background:cbg,whiteSpace:"nowrap"}}
                      onMouseEnter={e=>{const r=e.currentTarget.getBoundingClientRect();setTooltip({text:ROW_TOOLTIPS["Cash Balance"],x:r.left,y:r.bottom+6});}}
                      onMouseLeave={()=>setTooltip(null)}>
                      CASH BALANCE <span style={{fontSize:9,color:"#4338ca",verticalAlign:"super"}}>ⓘ</span>
                    </td>
                    {combinedClosingBalances.actual.map((v,i)=>(
                      <td key={i} style={{padding:"8px 10px",textAlign:"right",fontSize:12,fontWeight:700,color:v===null?"#374151":v>=0?"#10b981":"#ef4444",borderRight:`1px solid ${T.border}`,fontVariantNumeric:"tabular-nums",background:v!==null&&v>=0?"rgba(16,185,129,0.04)":v!==null?"rgba(239,68,68,0.04)":"transparent"}}>
                        {v===null?"—":fmtMoney(v)}
                      </td>
                    ))}
                    <td style={{padding:"4px 8px",background:cbg,borderLeft:`2px solid ${T.border2}`,borderRight:`2px solid ${T.border2}`,textAlign:"right",verticalAlign:"middle"}}>
                      {runway!=null&&runway>0&&<div style={{fontSize:10,color:"rgba(255,255,255,0.45)",whiteSpace:"nowrap"}}>{`~${runway} wk${runway!==1?"s":""} runway`}</div>}
                    </td>
                    {visibleForecastWeeks.map((_,i)=>{const v=combinedClosingBalances.forecast[i];return(
                      <td key={i} style={{padding:"8px 10px",textAlign:"right",fontSize:12,fontWeight:700,color:v===null?"#4b5563":v>=0?"#10b981":"#ef4444",background:v!==null&&v>=0?"rgba(16,185,129,0.06)":"rgba(239,68,68,0.06)",borderRight:`1px solid ${T.border2}`,fontVariantNumeric:"tabular-nums",...blurStyle(i)}}>
                        {v===null?"—":fmtMoney(v)}
                      </td>
                    );})}
                    <td style={{background:cbg,borderLeft:`2px solid ${T.border2}`}}/>
                    <td style={{background:"rgba(99,102,241,0.04)"}}/>
                  </tr>
                );
              })()}
              {splitByCard ? accounts.map(acc=><AccountSection key={acc} account={acc}/>) : <GroupedSection/>}
              {/* Inline stocks prompt when no portfolio added */}
              {stocks.length===0&&(
                <tr className="abound-row" style={{borderBottom:`1px solid ${T.catRowBorder}`,background:"rgba(16,185,129,0.02)"}}>
                  <td data-sticky-label style={{padding:"3px 4px 3px 6px",background:"rgba(16,185,129,0.02)"}}/>
                  <td data-sticky-label2 style={{padding:"3px 10px",background:"rgba(16,185,129,0.02)"}}>
                    <div style={{position:"relative",display:"inline-block"}}>
                      {showStocksTooltip&&(
                        <div style={{position:"absolute",bottom:"calc(100% + 6px)",left:"50%",transform:"translateX(-50%)",background:"#1e1b38",border:"1px solid #4338ca",borderRadius:6,padding:"5px 10px",fontSize:10,color:"#c7d2fe",whiteSpace:"nowrap",pointerEvents:"none",animation:"slideInUp 0.25s ease both",zIndex:20}}>
                          See your portfolio value alongside your forecast
                          <div style={{position:"absolute",top:"100%",left:"50%",transform:"translateX(-50%)",borderLeft:"5px solid transparent",borderRight:"5px solid transparent",borderTop:"5px solid #4338ca"}}/>
                        </div>
                      )}
                      <span onClick={openStocks} style={{fontSize:10,color:"#10b981",cursor:"pointer",fontWeight:600,opacity:0.7}} onMouseEnter={e=>e.currentTarget.style.opacity="1"} onMouseLeave={e=>e.currentTarget.style.opacity="0.7"}>+ Add your portfolio</span>
                    </div>
                  </td>
                  {actualWeeks.map((_,i)=><td key={i} style={{borderRight:`1px solid ${T.catRowBorder}`}}/>)}
                  <td style={{borderLeft:`2px solid ${T.dimBorder}`,borderRight:`2px solid ${T.dimBorder}`}}/>
                  {visibleForecastWeeks.map((_,i)=><td key={i} style={{background:"rgba(16,185,129,0.04)",borderRight:i===visibleForecastWeeks.length-1?"none":`1px dashed ${T.border2}`,...blurStyle(i)}}/>)}
                  <td style={{borderLeft:`2px solid ${T.border2}`}}/><td/>
                </tr>
              )}
              {/* Stock portfolio rows */}
              {stocks.length>0&&stocks.some(s=>stockData[s.ticker])&&(()=>{
                const visibleStocks=stocks.filter(s=>stockData[s.ticker]?.currentPrice);
                if(!visibleStocks.length) return null;
                return(<>
                  <tr style={{background:"rgba(16,185,129,0.04)",borderTop:"2px solid rgba(16,185,129,0.25)"}}>
                    <td colSpan={2} style={{padding:"6px 12px",fontSize:10,fontWeight:700,color:"#10b981",letterSpacing:"0.1em",textTransform:"uppercase"}}>STOCK PORTFOLIO</td>
                    {actualWeeks.map((_,i)=><td key={i} style={{borderRight:`1px solid ${T.border}`,background:"rgba(16,185,129,0.04)"}}/>)}
                    <td style={{background:T.theadD,borderLeft:`2px solid ${T.border2}`,borderRight:`2px solid ${T.border2}`}}/>
                    {visibleForecastWeeks.map((_,i)=><td key={i} style={{background:"rgba(16,185,129,0.06)",borderRight:`1px solid ${T.border2}`,...blurStyle(i)}}/>)}
                    <td style={{background:"rgba(99,102,241,0.12)",borderLeft:`2px solid ${T.border2}`}}/><td style={{background:T.bg}}/>
                  </tr>
                  {visibleStocks.map(stock=>{
                    const sd=stockData[stock.ticker];
                    const {currentPrice,history=[]}=sd;
                    const currentVal=stock.currentValue||0;
                    const actualVals=actualWeeks.map(w=>{
                      if(!history.length) return null;
                      const wDate=new Date(w.key);
                      const closest=history.reduce((a,b)=>Math.abs(new Date(a.date)-wDate)<Math.abs(new Date(b.date)-wDate)?a:b);
                      return closest?currentVal*(closest.close/currentPrice):null;
                    });
                    const recentCloses=history.slice(-5).map(h=>h.close);
                    const weeklyDrift=recentCloses.length>1?(recentCloses[recentCloses.length-1]-recentCloses[0])/(recentCloses.length-1):0;
                    const lastClose=recentCloses[recentCloses.length-1]||currentPrice;
                    const forecastVals=visibleForecastWeeks.map((_,i)=>{
                      const projPrice=lastClose+weeklyDrift*(i+1);
                      return currentVal*(projPrice/currentPrice);
                    });
                    return(
                      <tr key={stock.ticker} className="abound-row" style={{background:"rgba(16,185,129,0.02)",borderBottom:`1px solid rgba(16,185,129,0.1)`}}>
                        <td style={{padding:"7px 8px 7px 12px",fontSize:11,fontWeight:700,color:"#10b981",whiteSpace:"nowrap"}}>{stock.ticker}</td>
                        <td style={{padding:"7px 8px",fontSize:11,color:"#6ee7b7",whiteSpace:"nowrap",maxWidth:100,overflow:"hidden",textOverflow:"ellipsis"}}>{stock.name||sd.name||""}</td>
                        {actualVals.map((v,i)=>(
                          <td key={i} style={{padding:"7px 10px",textAlign:"right",fontSize:12,fontWeight:600,color:"#10b981",fontVariantNumeric:"tabular-nums",borderRight:`1px solid ${T.border}`}}>
                            {v!==null?fmtMoney(v):"—"}
                          </td>
                        ))}
                        <td style={{background:T.theadD,borderLeft:`2px solid ${T.border2}`,borderRight:`2px solid ${T.border2}`}}/>
                        {forecastVals.map((v,i)=>(
                          <td key={i} style={{padding:"7px 10px",textAlign:"right",fontSize:12,fontWeight:600,color:"rgba(16,185,129,0.7)",background:"rgba(16,185,129,0.06)",fontVariantNumeric:"tabular-nums",borderRight:`1px solid ${T.border2}`,...blurStyle(i)}}>
                            {fmtMoney(v)}
                          </td>
                        ))}
                        <td style={{background:"rgba(99,102,241,0.12)",borderLeft:`2px solid ${T.border2}`}}/><td style={{background:T.bg}}/>
                      </tr>
                    );
                  })}
                </>);
              })()}
            </tbody>
          </table>
        </div>

        {/* "So what" summary bar — desktop only */}
        {!isMobile&&(()=>{
          const lastActual = combinedClosingBalances.actual.filter(v=>v!==null).slice(-1)[0];
          const forecastEnd = combinedClosingBalances.forecast[combinedClosingBalances.forecast.length-1];
          const topSpendCat = categories
            .filter(c=>c!=="Income"&&(singleAccount||c!=="Card Repayment"))
            .map(c=>({c, total:actualWeeks.reduce((s,w)=>s+accounts.reduce((s2,acc)=>s2+Math.abs(weeklyByAccountCat[w.key]?.[acc]?.[c]||0),0),0)}))
            .sort((a,b)=>b.total-a.total)[0];
          const weeklyTopSpend = topSpendCat ? Math.round(topSpendCat.total / Math.max(actualWeeks.length,1)) : 0;
          if(forecastEnd===null||forecastEnd===undefined||lastActual===null||lastActual===undefined) return null;
          const diff = forecastEnd - lastActual;
          const isUp = diff >= 0;
          const portfolioValue = stocks.reduce((s,st)=>{
            const sd=stockData[st.ticker];
            const cv=st.currentValue||0;
            if(!sd?.currentPrice||!cv) return s+cv;
            return s+cv;
          },0);
          const netWorth = lastActual + portfolioValue;
          return(
            <div style={{margin:"14px 0 0",background:isUp?"rgba(16,185,129,0.05)":"rgba(239,68,68,0.05)",border:`1px solid ${isUp?"rgba(16,185,129,0.15)":"rgba(239,68,68,0.15)"}`,borderRadius:12,padding:"14px 18px",display:"flex",alignItems:"center",gap:16,flexWrap:"wrap"}}>
              <div style={{display:"flex",alignItems:"center",gap:8,flexShrink:0}}>
                <div style={{width:8,height:8,borderRadius:"50%",background:isUp?"#10b981":"#ef4444",boxShadow:`0 0 8px ${isUp?"#10b981":"#ef4444"}`}}/>
                <span style={{fontSize:13,fontWeight:800,color:isUp?"#059669":"#ef4444",fontVariantNumeric:"tabular-nums"}}>
                  {isUp?"+":"-"}£{Math.round(Math.abs(diff)).toLocaleString()} in 6 weeks
                </span>
              </div>
              <span style={{fontSize:12,color:"#6b7280",flex:1}}>
                {isUp
                  ? `You're on track to have £${Math.round(forecastEnd).toLocaleString()} in 6 weeks.${topSpendCat?` Your biggest controllable cost is ${topSpendCat.c} at £${weeklyTopSpend.toLocaleString()}/wk.`:""}`
                  : `Your balance is forecast to drop by £${Math.round(Math.abs(diff)).toLocaleString()} over 6 weeks.${topSpendCat?` Reducing ${topSpendCat.c} (£${weeklyTopSpend.toLocaleString()}/wk) would have the biggest impact.`:""}`
                }
              </span>
              {portfolioValue>0&&(
                <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",flexShrink:0,paddingLeft:16,borderLeft:"1px solid rgba(99,102,241,0.2)"}}>
                  <span style={{fontSize:9,fontWeight:700,color:"#6b7280",letterSpacing:"0.08em",textTransform:"uppercase"}}>Net Worth</span>
                  <span style={{fontSize:14,fontWeight:800,color:"#a5b4fc",fontVariantNumeric:"tabular-nums"}}>£{Math.round(netWorth).toLocaleString()}</span>
                  <span style={{fontSize:9,color:"#4b5563"}}>cash + £{Math.round(portfolioValue).toLocaleString()} portfolio</span>
                </div>
              )}
            </div>
          );
        })()}


      </div>

      
      {isMobile&&(
        <button onClick={onFeedback} title="Leave a review"
          style={{position:"fixed",bottom:16,right:102,width:36,height:36,borderRadius:"50%",background:"rgba(30,27,56,0.92)",border:"1px solid rgba(99,102,241,0.4)",color:"#a5b4fc",cursor:"pointer",boxShadow:"0 4px 16px rgba(0,0,0,0.4)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:500}}>
          <svg width="15" height="15" viewBox="0 0 20 20" fill="none"><path d="M10 2l2.4 4.9L18 7.6l-4 3.9.9 5.5L10 14.4 5.1 17l.9-5.5L2 7.6l5.6-.7L10 2z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/></svg>
        </button>
      )}
      {isMobile&&(
        <button onClick={()=>setShowHomeScreenGuide(true)} title="Add to Home Screen"
          style={{position:"fixed",bottom:16,right:62,width:36,height:36,borderRadius:"50%",background:"rgba(30,27,56,0.92)",border:"1px solid #4338ca",color:"#a5b4fc",cursor:"pointer",boxShadow:"0 4px 16px rgba(0,0,0,0.4)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:500}}>
          <svg width="15" height="15" viewBox="0 0 20 20" fill="none"><rect x="3" y="3" width="14" height="14" rx="3" stroke="currentColor" strokeWidth="1.6"/><path d="M10 7v6M7 10h6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>
        </button>
      )}

      {/* Add to Home Screen guide */}
      {showHomeScreenGuide&&(
        <div style={{position:"fixed",inset:0,zIndex:9998,display:"flex",alignItems:"center",justifyContent:"center",background:"rgba(5,4,20,0.75)",backdropFilter:"blur(6px)"}} onClick={()=>setShowHomeScreenGuide(false)}>
          <div style={{background:"linear-gradient(145deg,#13112b,#1a1830)",border:"1px solid #3730a3",borderRadius:16,padding:"24px 24px 20px",maxWidth:340,width:"90%",boxShadow:"0 20px 60px rgba(0,0,0,0.6)",position:"relative",zoom:isMobile?0.9:1}} onClick={e=>e.stopPropagation()}>
            <button onClick={()=>setShowHomeScreenGuide(false)} style={{position:"absolute",top:12,right:12,background:"none",border:"none",color:"#6b7280",fontSize:18,cursor:"pointer",lineHeight:1}}>×</button>
            <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:18}}>
              <div style={{width:36,height:36,borderRadius:9,background:"linear-gradient(135deg,#6366f1,#8b5cf6)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                <svg width="18" height="18" viewBox="0 0 20 20" fill="none"><rect x="3" y="3" width="14" height="14" rx="3" stroke="#fff" strokeWidth="1.6"/><path d="M10 7v6M7 10h6" stroke="#fff" strokeWidth="1.6" strokeLinecap="round"/></svg>
              </div>
              <div>
                <div style={{fontSize:15,fontWeight:800,color:"#e0e7ff"}}>Add to Home Screen</div>
                <div style={{fontSize:11,color:"#818cf8"}}>Use Abound like a native app</div>
              </div>
            </div>
            <div style={{marginBottom:14}}>
              <div style={{fontSize:11,fontWeight:700,color:"#6366f1",letterSpacing:"0.08em",marginBottom:8}}>iOS (Safari)</div>
              {[
                {n:1,t:'Open Abound in Safari (not Chrome)'},
                {n:2,t:'Tap the Share button',sub:'The box with an arrow pointing up at the bottom of the screen'},
                {n:3,t:'Scroll down and tap "Add to Home Screen"'},
                {n:4,t:'Tap "Add" in the top-right corner'},
              ].map(s=>(
                <div key={s.n} style={{display:"flex",gap:10,marginBottom:8,alignItems:"flex-start"}}>
                  <div style={{minWidth:20,height:20,borderRadius:10,background:"rgba(99,102,241,0.2)",border:"1px solid #4338ca",display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:700,color:"#a5b4fc",flexShrink:0}}>{s.n}</div>
                  <div>
                    <div style={{fontSize:12,color:"#c7d2fe",fontWeight:500,lineHeight:1.4}}>{s.t}</div>
                    {s.sub&&<div style={{fontSize:10,color:"#6b7280",marginTop:1}}>{s.sub}</div>}
                  </div>
                </div>
              ))}
            </div>
            <div style={{borderTop:"1px solid #1f1d3a",paddingTop:14}}>
              <div style={{fontSize:11,fontWeight:700,color:"#8b5cf6",letterSpacing:"0.08em",marginBottom:8}}>Android (Chrome)</div>
              {[
                {n:1,t:'Tap the three-dot menu ⋮ in the top-right'},
                {n:2,t:'Tap "Add to Home screen"'},
                {n:3,t:'Tap "Add" to confirm'},
              ].map(s=>(
                <div key={s.n} style={{display:"flex",gap:10,marginBottom:8,alignItems:"flex-start"}}>
                  <div style={{minWidth:20,height:20,borderRadius:10,background:"rgba(139,92,246,0.2)",border:"1px solid #6d28d9",display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:700,color:"#c4b5fd",flexShrink:0}}>{s.n}</div>
                  <div style={{fontSize:12,color:"#c7d2fe",fontWeight:500,lineHeight:1.4}}>{s.t}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      {/* Premium gate modal */}
      {showPremiumGate&&<UpgradeModal runsUsed={getAiRunsUsed()} onUpgrade={redirectToCheckout} onDismiss={()=>setShowPremiumGate(false)}/>}

      {/* Income wizard modal */}
      {showIncomeWizard&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.75)",zIndex:900,display:"flex",alignItems:"center",justifyContent:"center",padding:16}}>
          <div style={{background:"#0d0c1e",border:"1px solid #2d2a6e",borderRadius:16,padding:28,maxWidth:440,width:"100%",boxShadow:"0 24px 80px rgba(0,0,0,0.6)"}}>
            <div style={{marginBottom:20}}>
              <div style={{fontSize:10,fontWeight:700,color:"#6366f1",letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:6}}>Income Setup</div>
              <div style={{fontSize:18,fontWeight:700,color:"#e0e7ff",marginBottom:6}}>When do you next get paid?</div>
              <div style={{fontSize:13,color:"#9ca3af"}}>Set up your income so we can forecast your cash flow accurately.</div>
            </div>
            {incomeWizardStep==="suggest"&&wizardSuggestion?(
              <>
                <div style={{background:"rgba(99,102,241,0.12)",border:"1px solid rgba(99,102,241,0.3)",borderRadius:10,padding:"14px 16px",marginBottom:16}}>
                  <div style={{fontSize:12,color:"#a5b4fc",fontWeight:700,marginBottom:4}}>⚡ We spotted a payment of £{Math.round(wizardSuggestion.amount).toLocaleString()} on {fmt(wizardSuggestion.date)}</div>
                  <div style={{fontSize:12,color:"#9ca3af"}}>Use this as your monthly income?</div>
                </div>
                <div style={{display:"flex",gap:10,marginBottom:16}}>
                  <button onClick={()=>applyWizardSuggestion(wizardSuggestion)} style={{flex:1,padding:"10px 14px",background:"#6366f1",border:"none",borderRadius:8,color:"#fff",fontWeight:700,fontSize:13,cursor:"pointer"}}>Yes, use £{Math.round(wizardSuggestion.amount).toLocaleString()}/month</button>
                  <button onClick={switchWizardToManual} style={{padding:"10px 14px",background:"none",border:"1px solid #2d2a6e",borderRadius:8,color:"#a5b4fc",fontSize:13,cursor:"pointer"}}>Enter manually</button>
                </div>
                <div style={{textAlign:"center"}}>
                  <button onClick={skipIncomeWizard} style={{background:"none",border:"none",color:"#4b5563",fontSize:11,cursor:"pointer",textDecoration:"underline"}}>Skip — I'll add this later</button>
                </div>
              </>
            ):(
              <>
                <div style={{display:"flex",flexDirection:"column",gap:10,marginBottom:16}}>
                  <input placeholder="Label (Salary, freelance, etc.)" value={wizardForm.label} onChange={e=>setWizardForm(f=>({...f,label:e.target.value}))} style={{padding:"9px 12px",background:"#0f0e1a",border:"1px solid #2d2a6e",borderRadius:8,color:"#e0e7ff",fontSize:13,outline:"none"}}/>
                  <input type="number" placeholder="Amount (£)" value={wizardForm.amount} onChange={e=>setWizardForm(f=>({...f,amount:e.target.value}))} style={{padding:"9px 12px",background:"#0f0e1a",border:"1px solid #2d2a6e",borderRadius:8,color:"#e0e7ff",fontSize:13,outline:"none"}}/>
                  <input type="date" value={wizardForm.expectedDate} onChange={e=>setWizardForm(f=>({...f,expectedDate:e.target.value}))} style={{padding:"9px 12px",background:"#0f0e1a",border:"1px solid #2d2a6e",borderRadius:8,color:"#e0e7ff",fontSize:13,outline:"none"}}/>
                  <select value={wizardForm.recurrence} onChange={e=>setWizardForm(f=>({...f,recurrence:e.target.value}))} style={{padding:"9px 12px",background:"#0f0e1a",border:"1px solid #2d2a6e",borderRadius:8,color:"#e0e7ff",fontSize:13,outline:"none"}}>
                    <option value="none">One-off</option>
                    <option value="weekly">Weekly</option>
                    <option value="biweekly">Every 2 weeks</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>
                <button onClick={saveWizardForm} style={{width:"100%",padding:"10px 14px",background:"#6366f1",border:"none",borderRadius:8,color:"#fff",fontWeight:700,fontSize:13,cursor:"pointer",marginBottom:12}}>Save income</button>
                <div style={{textAlign:"center"}}>
                  <button onClick={skipIncomeWizard} style={{background:"none",border:"none",color:"#4b5563",fontSize:11,cursor:"pointer",textDecoration:"underline"}}>Skip — I'll add this later</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Stock setup prompt */}
      {showStockSetup&&<StockSetupModal stocks={stocks} onSave={(s)=>{saveStocks(s);setShowStockSetup(false);setTimeout(triggerIncomeWizard,400);}} onDismiss={()=>{setShowStockSetup(false);setTimeout(triggerIncomeWizard,400);}} onStockDataFetched={(d)=>setStockData(prev=>({...prev,...d}))}/>}

      {/* Budget slide-over panel */}
      {showBudgetPanel&&(()=>{
        const today=new Date();
        const day=today.getDate();
        const bMonth=day<21?today.getMonth():(today.getMonth()+1)%12;
        const bYear=day<21?today.getFullYear():(today.getMonth()===11?today.getFullYear()+1:today.getFullYear());
        const bMonthName=new Date(bYear,bMonth,1).toLocaleString("en-GB",{month:"long"});
        const panelTitle=day<21?`Budget — rest of ${bMonthName}`:`Budget — ${bMonthName}`;
        const bActWeeks=actualWeeks.filter(w=>w.date.getMonth()===bMonth&&w.date.getFullYear()===bYear);
        const bFcstIdxs=forecastWeeks.reduce((arr,w,i)=>{if(w.date.getMonth()===bMonth&&w.date.getFullYear()===bYear)arr.push(i);return arr;},[]);
        const spendCats=categories.filter(c=>c!=="Income"&&(singleAccount||c!=="Card Repayment")).filter(cat=>{
          const ta=actualWeeks.reduce((s,w)=>s+Math.abs(accounts.reduce((s2,acc)=>s2+(weeklyByAccountCat[w.key]?.[acc]?.[cat]||0),0)),0);
          const tf=forecastWeeks.reduce((s,_,i)=>s+accounts.reduce((s2,acc)=>s2+(forecastData[acc]?.[cat]?.[i]||0),0),0);
          return ta>=5||tf>=5;
        });
        const catRows=spendCats.map(cat=>{
          const spent=bActWeeks.reduce((s,w)=>s+Math.abs(accounts.reduce((s2,acc)=>s2+(weeklyByAccountCat[w.key]?.[acc]?.[cat]||0),0)),0);
          const fcst=bFcstIdxs.reduce((s,i)=>s+accounts.reduce((s2,acc)=>s2+(forecastData[acc]?.[cat]?.[i]||0),0),0);
          return{cat,spent,projected:spent+fcst};
        }).filter(d=>d.projected>0||monthlyBudgets[d.cat]).sort((a,b)=>b.projected-a.projected);
        const totalProjected=catRows.reduce((s,d)=>s+d.projected,0);
        const totalBudget=catRows.reduce((s,d)=>s+(monthlyBudgets[d.cat]||0),0);
        const budgetSet=catRows.filter(d=>monthlyBudgets[d.cat]).length;
        const quickWins=catRows.filter(d=>!monthlyBudgets[d.cat]||d.projected>monthlyBudgets[d.cat]).slice(0,3);
        function applyToForecast(){
          const newOvs=forecastOverrides.filter(ov=>!ov.fromBudget);
          spendCats.forEach(cat=>{
            const budget=monthlyBudgets[cat];
            if(!budget||!bFcstIdxs.length)return;
            const startWeek=forecastWeeks[bFcstIdxs[0]];
            if(!startWeek)return;
            newOvs.push({fromWeekKey:startWeek.key,cat,newAmt:budget/(bFcstIdxs.length||1),fromBudget:true});
          });
          setForecastOverrides(newOvs);
        }
        function resetAll(){setMonthlyBudgets({});setForecastOverrides(prev=>prev.filter(ov=>!ov.fromBudget));}
        return(
          <>
            <div onClick={()=>setShowBudgetPanel(false)} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.45)",zIndex:900}}/>
            <div style={{position:"fixed",top:0,right:0,bottom:0,width:isMobile?"100%":390,background:"#0a0918",borderLeft:"1px solid #1e1d35",zIndex:901,display:"flex",flexDirection:"column",overflow:"hidden",boxShadow:"-8px 0 40px rgba(0,0,0,0.5)"}}>
              <div style={{padding:"18px 20px 14px",borderBottom:"1px solid #1e1d35",display:"flex",justifyContent:"space-between",alignItems:"flex-start",flexShrink:0}}>
                <div>
                  <div style={{fontSize:16,fontWeight:800,color:"#e0e7ff"}}>{panelTitle}</div>
                  <div style={{fontSize:11,color:"rgba(255,255,255,0.35)",marginTop:3}}>{bFcstIdxs.length} forecast week{bFcstIdxs.length!==1?"s":""}{bActWeeks.length>0?` · ${bActWeeks.length} actual`:""}  in period</div>
                </div>
                <button onClick={()=>setShowBudgetPanel(false)} style={{background:"none",border:"none",color:"rgba(255,255,255,0.4)",fontSize:22,cursor:"pointer",padding:"0 4px",lineHeight:1,marginTop:-2}}>✕</button>
              </div>
              <div style={{flex:1,overflowY:"auto",padding:"8px 0"}}>
                {catRows.map(({cat,spent,projected})=>{
                  const budget=monthlyBudgets[cat]||0;
                  const pct=budget>0?(projected/budget)*100:0;
                  const over=budget>0&&projected>budget;
                  const barColor=pct>100?"#ef4444":pct>80?"#f59e0b":"#10b981";
                  const maxSlider=Math.max(Math.round(projected*2.5/10)*10,100);
                  return(
                    <div key={cat} style={{padding:"10px 20px",borderBottom:"1px solid rgba(255,255,255,0.04)"}}>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",marginBottom:5}}>
                        <span style={{fontSize:13,fontWeight:600,color:"#c7d2fe"}}>{cat}</span>
                        <div>
                          <span style={{fontSize:12,fontWeight:700,color:over?"#ef4444":"#e0e7ff"}}>{fmtMoney(projected)}</span>
                          <span style={{fontSize:10,color:"rgba(255,255,255,0.3)",marginLeft:4}}>proj.</span>
                        </div>
                      </div>
                      {budget>0&&(
                        <div style={{marginBottom:6}}>
                          <div style={{height:3,background:"rgba(255,255,255,0.07)",borderRadius:99,overflow:"hidden",marginBottom:3}}>
                            <div style={{height:"100%",width:`${Math.min(pct,100)}%`,background:barColor,borderRadius:99}}/>
                          </div>
                          <div style={{display:"flex",justifyContent:"space-between",fontSize:10,color:"rgba(255,255,255,0.35)"}}>
                            <span style={{color:over?"#ef4444":"#10b981",fontWeight:700}}>
                              {over?`▲ ${fmtMoney(projected-budget)} over`:`▼ ${fmtMoney(budget-projected)} under`}
                            </span>
                            <span>of {fmtMoney(budget)}</span>
                          </div>
                        </div>
                      )}
                      <div style={{display:"flex",alignItems:"center",gap:8,marginTop:4}}>
                        <input type="range" min={0} max={maxSlider} step={10}
                          value={budget}
                          onChange={e=>{const v=Number(e.target.value);setMonthlyBudgets(b=>({...b,[cat]:v>0?v:undefined}));}}
                          style={{flex:1,accentColor:"#6366f1",cursor:"pointer"}}/>
                        <input type="number" min={0} step={10}
                          value={budget||""}
                          placeholder="No limit"
                          onChange={e=>{const v=Number(e.target.value);setMonthlyBudgets(b=>({...b,[cat]:v>0?v:undefined}));}}
                          style={{width:78,padding:"3px 7px",background:"rgba(99,102,241,0.1)",border:"1px solid rgba(99,102,241,0.3)",borderRadius:5,color:"#e0e7ff",fontSize:11,outline:"none"}}/>
                      </div>
                    </div>
                  );
                })}
                {quickWins.length>0&&(
                  <div style={{padding:"14px 20px 4px"}}>
                    <div style={{fontSize:10,fontWeight:700,color:"rgba(255,255,255,0.3)",letterSpacing:"0.1em",marginBottom:8}}>QUICK WINS</div>
                    {quickWins.map(({cat,projected})=>(
                      <div key={cat} onClick={()=>setMonthlyBudgets(b=>({...b,[cat]:Math.max(Math.round(projected*0.8/10)*10,10)}))}
                        style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 12px",marginBottom:5,background:"rgba(99,102,241,0.06)",border:"1px solid rgba(99,102,241,0.15)",borderRadius:8,cursor:"pointer"}}
                        onMouseEnter={e=>e.currentTarget.style.background="rgba(99,102,241,0.12)"}
                        onMouseLeave={e=>e.currentTarget.style.background="rgba(99,102,241,0.06)"}>
                        <span style={{fontSize:12,color:"#c7d2fe"}}>{cat}</span>
                        <span style={{fontSize:11,color:"#10b981",fontWeight:600}}>Cut 20% → save {fmtMoney(Math.round(projected*0.2))}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div style={{padding:"14px 20px",borderTop:"1px solid #1e1d35",background:"#080716",flexShrink:0}}>
                {totalBudget>0&&(
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:10,fontSize:12}}>
                    <span style={{color:"rgba(255,255,255,0.45)"}}>Total projected vs budget</span>
                    <span style={{color:totalProjected>totalBudget?"#ef4444":"#10b981",fontWeight:700}}>{fmtMoney(totalProjected)} / {fmtMoney(totalBudget)}</span>
                  </div>
                )}
                <div style={{display:"flex",gap:8}}>
                  <button onClick={applyToForecast} disabled={budgetSet===0||bFcstIdxs.length===0}
                    style={{flex:1,padding:"10px",background:"linear-gradient(135deg,#6366f1,#4f46e5)",color:"#fff",border:"none",borderRadius:8,fontSize:12,fontWeight:700,cursor:budgetSet===0||bFcstIdxs.length===0?"not-allowed":"pointer",opacity:budgetSet===0||bFcstIdxs.length===0?0.45:1}}>
                    Apply to forecast
                  </button>
                  <button onClick={resetAll}
                    style={{padding:"10px 14px",background:"none",color:"rgba(255,255,255,0.35)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:8,fontSize:12,cursor:"pointer"}}>
                    Reset
                  </button>
                </div>
              </div>
            </div>
          </>
        );
      })()}

      {/* Mobile floating sidebar */}
      {isMobile&&(
        <div style={{position:'fixed',right:0,top:'50%',transform:'translateY(-50%)',zIndex:810,display:'flex',flexDirection:'column',alignItems:'flex-end',gap:4}}>
          {/* Review */}
          <button onClick={onGoToReview} data-tour='view-toggle'
            style={{position:'relative',background:'linear-gradient(180deg,#6366f1,#4f46e5)',color:'#fff',border:'none',borderRadius:'8px 0 0 8px',padding:'13px 8px',fontSize:10,fontWeight:800,cursor:'pointer',letterSpacing:'0.07em',boxShadow:'-3px 0 14px rgba(99,102,241,0.45)',writingMode:'vertical-rl'}}>
            {showReviewPrompt&&<span style={{position:'absolute',top:6,right:6,width:7,height:7,borderRadius:'50%',background:'#ef4444',flexShrink:0,display:'block'}}/>}
            Review
          </button>
          {/* Insights */}
          <button onClick={onGoToInsights}
            style={{background:'rgba(30,27,56,0.95)',color:'#818cf8',border:'1px solid rgba(99,102,241,0.3)',borderRight:'none',borderRadius:'8px 0 0 8px',padding:'13px 8px',fontSize:10,fontWeight:700,cursor:'pointer',letterSpacing:'0.07em',boxShadow:'-3px 0 10px rgba(0,0,0,0.35)',writingMode:'vertical-rl'}}>
            Insights
          </button>
          {/* Grouped toggle */}
          <button onClick={()=>setSplitByCard(s=>!s)}
            style={{background:'rgba(30,27,56,0.95)',border:'1px solid rgba(99,102,241,0.2)',borderRight:'none',borderRadius:'8px 0 0 8px',padding:'8px 9px',display:'flex',flexDirection:'column',alignItems:'center',gap:4,boxShadow:'-2px 0 8px rgba(0,0,0,0.3)',cursor:'pointer'}}>
            <span style={{fontSize:8,color:'#6b7280',fontWeight:600,writingMode:'vertical-rl',letterSpacing:'0.06em',lineHeight:1}}>{splitByCard?'By card':'Grouped'}</span>
            <div style={{position:'relative',width:20,height:11,borderRadius:6,background:splitByCard?'#6366f1':'#374151',transition:'background 0.2s',flexShrink:0}}>
              <span style={{position:'absolute',top:2,left:splitByCard?11:2,width:7,height:7,borderRadius:'50%',background:'#fff',transition:'left 0.2s',display:'block'}}/>
            </div>
          </button>
          {/* Stocks */}
          <button onClick={openStocks}
            style={{background:stocks.length?'rgba(16,185,129,0.12)':'rgba(30,27,56,0.95)',color:stocks.length?'#10b981':'#6b7280',border:`1px solid ${stocks.length?'rgba(16,185,129,0.35)':'rgba(99,102,241,0.2)'}`,borderRight:'none',borderRadius:'8px 0 0 8px',padding:'12px 7px',fontSize:10,fontWeight:700,cursor:'pointer',writingMode:'vertical-rl',boxShadow:'-2px 0 8px rgba(0,0,0,0.3)'}}>
            {stocks.length?`Stocks(${stocks.length})`:'Stocks'}
          </button>
          {/* Free / Premium badge */}
          {(()=>{const pro=isPremium();return(
            <div onClick={pro?undefined:()=>setShowPremiumGate(true)}
              style={{background:pro?'rgba(16,185,129,0.12)':'rgba(99,102,241,0.1)',border:`1px solid ${pro?'rgba(16,185,129,0.3)':'rgba(99,102,241,0.2)'}`,borderRight:'none',borderRadius:'8px 0 0 8px',padding:'7px 5px',cursor:pro?'default':'pointer',boxShadow:'-2px 0 6px rgba(0,0,0,0.25)'}}>
              <div style={{writingMode:'vertical-rl',fontSize:8,fontWeight:800,color:pro?'#10b981':'#818cf8',letterSpacing:'0.08em',whiteSpace:'nowrap'}}>{pro?'Premium':'Free'}</div>
            </div>
          );})()}
        </div>
      )}

      {/* Tour reopen button */}
      {(()=>{
        const tourSeen = !!localStorage.getItem("cashFlowTourSeen_v2");
        return(
          <button onClick={reopenTour} title="Tour & tips"
            style={{position:"fixed",bottom:isMobile?16:28,right:isMobile?16:28,height:isMobile?36:46,borderRadius:isMobile?18:23,background:"#6366f1",border:"none",color:"#fff",cursor:"pointer",boxShadow:"0 4px 18px rgba(99,102,241,0.55)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:500,transition:"all 0.2s",padding:isMobile?"0 12px":"0 20px",gap:6,fontWeight:700,animation:tourSeen?"none":"tourBtnPulse 2.5s ease-in-out 3"}}>
            <span style={{fontSize:isMobile?16:18,lineHeight:1}}>?</span>
            {!isMobile&&<span style={{fontSize:14,letterSpacing:"0.02em"}}>Tour</span>}
          </button>
        );
      })()}

      {/* Forecast accuracy modal — triggered by badge */}
      {showAccuracyModal&&prevAccuracyData&&(
        <ForecastAccuracyScreen precomputed={prevAccuracyData} onContinue={()=>setShowAccuracyModal(false)}/>
      )}
    </div>
  );
}

// ─── Root ─────────────────────────────────────────────────────────────────────
async function fetchStockData(ticker) {
  const res = await fetch('/api/stock-data', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ticker}) });
  if (!res.ok) throw new Error('Ticker not found');
  return res.json();
}

function StockSetupModal({stocks, onSave, onDismiss, onStockDataFetched}) {
  const [mode, setMode] = useState(stocks?.length ? 'summary' : null); // null | 'summary' | 'manual' | 'screenshot'
  const [ticker, setTicker] = useState('');
  const [valueInput, setValueInput] = useState('');
  const [localStocks, setLocalStocks] = useState(stocks||[]);
  const [editingTicker, setEditingTicker] = useState(null);
  const [editVal, setEditVal] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [screenshotLoading, setScreenshotLoading] = useState(false);
  const fileRef = useRef(null);

  async function addManual() {
    if(!ticker.trim()) return;
    setLoading(true); setError('');
    try {
      const data = await fetchStockData(ticker.trim());
      onStockDataFetched({[data.ticker]: data});
      const val = parseFloat(valueInput) || null;
      setLocalStocks(s=>[...s.filter(x=>x.ticker!==data.ticker), {ticker:data.ticker, name:data.name, currentValue:val, currency:data.currency}]);
      setTicker(''); setValueInput('');
    } catch(e) { setError('Ticker not found — try e.g. AAPL, TSLA, BARC.L for UK stocks'); }
    setLoading(false);
  }

  async function handleScreenshot(e) {
    const file = e.target.files?.[0];
    if(!file) return;
    setScreenshotLoading(true); setError('');
    try {
      const base64 = await new Promise((res,rej)=>{const r=new FileReader();r.onload=()=>res(r.result.split(',')[1]);r.onerror=rej;r.readAsDataURL(file);});
      const extracted = await fetch('/api/extract-stocks',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({imageBase64:base64,mediaType:file.type})}).then(r=>r.json());
      if(!extracted.length){setError('No stocks detected — try the manual entry instead.');setScreenshotLoading(false);return;}
      const results = await Promise.allSettled(extracted.map(s=>fetchStockData(s.ticker)));
      const newStocks = [];
      results.forEach((r,i)=>{
        if(r.status==='fulfilled'){
          onStockDataFetched({[r.value.ticker]:r.value});
          newStocks.push({ticker:r.value.ticker, name:r.value.name, currentValue:extracted[i].value||null, currency:r.value.currency});
        }
      });
      setLocalStocks(s=>{const map=new Map(s.map(x=>[x.ticker,x]));newStocks.forEach(x=>map.set(x.ticker,x));return [...map.values()];});
    } catch(e){setError('Could not read screenshot — please try manual entry.');}
    setScreenshotLoading(false);
  }

  return(
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.75)",zIndex:9998,display:"flex",alignItems:"center",justifyContent:"center",padding:24,backdropFilter:"blur(6px)"}}>
      <div style={{background:"linear-gradient(135deg,#1a1830,#0f0e1f)",border:"1px solid #4338ca",borderRadius:20,padding:"32px 28px",maxWidth:480,width:"100%",boxShadow:"0 24px 80px rgba(0,0,0,0.7)"}}>
        {mode===null&&(<>
          <div style={{textAlign:"center",marginBottom:24}}>
            <div style={{width:52,height:52,borderRadius:14,background:"linear-gradient(135deg,#10b981,#059669)",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 16px"}}>
              <svg width="26" height="26" viewBox="0 0 20 20" fill="none"><path d="M3 13l4-5 3 3 3-4 4 3" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </div>
            <h2 style={{fontSize:22,fontWeight:800,color:"#e0e7ff",margin:"0 0 8px"}}>Do you hold any stocks?</h2>
            <p style={{fontSize:13,color:"#818cf8",margin:0,lineHeight:1.6}}>Add your holdings to see your portfolio value alongside your cash flow — actuals for the last 6 weeks and a 6-week forecast.</p>
          </div>
          <div style={{display:"flex",gap:10,marginBottom:14}}>
            <button onClick={()=>setMode('screenshot')} style={{flex:1,padding:"14px",background:"rgba(99,102,241,0.1)",border:"1px solid rgba(99,102,241,0.3)",borderRadius:12,color:"#a5b4fc",fontSize:13,fontWeight:700,cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:8}}>
              <svg width="22" height="22" viewBox="0 0 20 20" fill="none"><rect x="2" y="4" width="16" height="12" rx="2" stroke="#a5b4fc" strokeWidth="1.5"/><circle cx="10" cy="10" r="3" stroke="#a5b4fc" strokeWidth="1.5"/></svg>
              Upload screenshot
              <span style={{fontSize:10,color:"#6366f1",fontWeight:500}}>Fastest — AI reads it automatically</span>
            </button>
            <button onClick={()=>setMode('manual')} style={{flex:1,padding:"14px",background:"rgba(99,102,241,0.1)",border:"1px solid rgba(99,102,241,0.3)",borderRadius:12,color:"#a5b4fc",fontSize:13,fontWeight:700,cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:8}}>
              <svg width="22" height="22" viewBox="0 0 20 20" fill="none"><path d="M4 8h12M4 12h8" stroke="#a5b4fc" strokeWidth="1.5" strokeLinecap="round"/></svg>
              Enter manually
              <span style={{fontSize:10,color:"#6366f1",fontWeight:500}}>Type ticker + value</span>
            </button>
          </div>
          <button onClick={onDismiss} style={{width:"100%",padding:"10px",background:"none",color:"#4b5563",border:"1px solid #1f1d35",borderRadius:10,fontSize:12,cursor:"pointer"}}>No thanks, I don't hold stocks</button>
        </>)}

        {mode==='summary'&&(<>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:20}}>
            <div style={{display:"flex",alignItems:"center",gap:10}}>
              <div style={{width:36,height:36,borderRadius:10,background:"linear-gradient(135deg,#10b981,#059669)",display:"flex",alignItems:"center",justifyContent:"center"}}>
                <svg width="18" height="18" viewBox="0 0 20 20" fill="none"><path d="M3 13l4-5 3 3 3-4 4 3" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </div>
              <div>
                <div style={{fontSize:16,fontWeight:800,color:"#e0e7ff"}}>Your Portfolio</div>
                <div style={{fontSize:11,color:"#6b7280"}}>{localStocks.length} holding{localStocks.length!==1?"s":""}</div>
              </div>
            </div>
            <button onClick={onDismiss} style={{width:28,height:28,borderRadius:8,border:"1px solid #1f1d35",background:"none",color:"#6b7280",fontSize:18,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",lineHeight:1}}>×</button>
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:6,marginBottom:16}}>
            {localStocks.map(s=>(
              <div key={s.ticker} style={{padding:"10px 14px",background:"rgba(16,185,129,0.07)",border:"1px solid rgba(16,185,129,0.18)",borderRadius:10,display:"flex",alignItems:"center",gap:10}}>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:13,fontWeight:700,color:"#10b981"}}>{s.ticker} <span style={{fontSize:11,color:"#6b7280",fontWeight:400}}>{s.name||""}</span></div>
                  {editingTicker===s.ticker
                    ? <div style={{display:"flex",gap:6,marginTop:6}}>
                        <input value={editVal} onChange={e=>setEditVal(e.target.value)} placeholder="New value £" autoFocus style={{flex:1,padding:"5px 8px",background:"rgba(255,255,255,0.05)",border:"1px solid #4338ca",borderRadius:6,color:"#e0e7ff",fontSize:12,outline:"none"}}/>
                        <button onClick={()=>{setLocalStocks(l=>l.map(x=>x.ticker===s.ticker?{...x,currentValue:parseFloat(editVal)||x.currentValue}:x));setEditingTicker(null);}} style={{padding:"5px 10px",background:"#6366f1",color:"#fff",border:"none",borderRadius:6,fontSize:11,fontWeight:700,cursor:"pointer"}}>Save</button>
                        <button onClick={()=>setEditingTicker(null)} style={{padding:"5px 8px",background:"none",border:"1px solid #374151",color:"#6b7280",borderRadius:6,fontSize:11,cursor:"pointer"}}>✕</button>
                      </div>
                    : <div style={{fontSize:12,color:"#6ee7b7",marginTop:2}}>{s.currentValue?`£${Number(s.currentValue).toLocaleString()}`:"No value set"} <button onClick={()=>{setEditingTicker(s.ticker);setEditVal(s.currentValue||"");}} style={{background:"none",border:"none",color:"#6366f1",fontSize:11,cursor:"pointer",padding:"0 4px"}}>edit</button></div>
                  }
                </div>
                <button onClick={()=>setLocalStocks(l=>l.filter(x=>x.ticker!==s.ticker))} style={{background:"none",border:"none",color:"#ef4444",cursor:"pointer",fontSize:18,padding:"0 2px",flexShrink:0,lineHeight:1}}>×</button>
              </div>
            ))}
          </div>
          <button onClick={()=>setMode('manual')} style={{width:"100%",padding:"10px",background:"rgba(99,102,241,0.1)",border:"1px dashed rgba(99,102,241,0.4)",borderRadius:10,fontSize:13,color:"#818cf8",fontWeight:600,cursor:"pointer",marginBottom:10}}>+ Add another holding</button>
          <button onClick={()=>onSave(localStocks)} style={{width:"100%",padding:"12px",background:"linear-gradient(135deg,#6366f1,#4f46e5)",color:"#fff",border:"none",borderRadius:10,fontSize:14,fontWeight:700,cursor:"pointer"}}>Save changes →</button>
        </>)}

        {mode==='screenshot'&&(<>
          <button onClick={()=>setMode(null)} style={{background:"none",border:"none",color:"#6b7280",fontSize:12,cursor:"pointer",marginBottom:16,padding:0}}>← Back</button>
          <h3 style={{fontSize:18,fontWeight:800,color:"#e0e7ff",margin:"0 0 8px"}}>Upload a screenshot of your holdings</h3>
          <p style={{fontSize:12,color:"#818cf8",marginBottom:16,lineHeight:1.5}}>Any brokerage app screenshot showing ticker symbols and values. The AI will extract your holdings automatically.</p>
          <input ref={fileRef} type="file" accept="image/*" style={{display:"none"}} onChange={handleScreenshot}/>
          <button onClick={()=>fileRef.current?.click()} disabled={screenshotLoading} style={{width:"100%",padding:"14px",background:"rgba(99,102,241,0.12)",border:"2px dashed rgba(99,102,241,0.4)",borderRadius:12,color:"#a5b4fc",fontSize:13,fontWeight:600,cursor:"pointer",marginBottom:12}}>
            {screenshotLoading?"Analysing with AI...":"Choose screenshot"}
          </button>
          {error&&<p style={{color:"#ef4444",fontSize:12,marginBottom:12}}>{error}</p>}
          {localStocks.length>0&&(<>
            <div style={{marginBottom:12}}>{localStocks.map(s=><div key={s.ticker} style={{display:"flex",justifyContent:"space-between",padding:"8px 12px",background:"rgba(16,185,129,0.08)",borderRadius:8,marginBottom:6,fontSize:13}}><span style={{color:"#e0e7ff",fontWeight:700}}>{s.ticker}</span><span style={{color:"#10b981"}}>{s.currentValue?`£${s.currentValue.toLocaleString()}`:s.name}</span></div>)}</div>
            <button onClick={()=>onSave(localStocks)} style={{width:"100%",padding:"12px",background:"linear-gradient(135deg,#6366f1,#4f46e5)",color:"#fff",border:"none",borderRadius:10,fontSize:14,fontWeight:700,cursor:"pointer"}}>Add to cash flow →</button>
          </>)}
        </>)}

        {mode==='manual'&&(<>
          <button onClick={()=>setMode(stocks?.length?'summary':null)} style={{background:"none",border:"none",color:"#6b7280",fontSize:12,cursor:"pointer",marginBottom:16,padding:0}}>← Back</button>
          <h3 style={{fontSize:18,fontWeight:800,color:"#e0e7ff",margin:"0 0 16px"}}>Add your holdings</h3>
          <div style={{display:"flex",gap:8,marginBottom:8}}>
            <input value={ticker} onChange={e=>setTicker(e.target.value.toUpperCase())} onKeyDown={e=>e.key==='Enter'&&addManual()} placeholder="Ticker (e.g. AAPL, BARC.L)" style={{flex:1,padding:"10px 12px",background:"rgba(255,255,255,0.05)",border:"1px solid #4338ca",borderRadius:8,color:"#e0e7ff",fontSize:13,outline:"none"}}/>
            <input value={valueInput} onChange={e=>setValueInput(e.target.value)} placeholder="Value £ (optional)" style={{width:140,padding:"10px 12px",background:"rgba(255,255,255,0.05)",border:"1px solid #4338ca",borderRadius:8,color:"#e0e7ff",fontSize:13,outline:"none"}}/>
            <button onClick={addManual} disabled={loading} style={{padding:"10px 16px",background:"linear-gradient(135deg,#6366f1,#4f46e5)",color:"#fff",border:"none",borderRadius:8,fontSize:13,fontWeight:700,cursor:"pointer"}}>{loading?"...":"Add"}</button>
          </div>
          {error&&<p style={{color:"#ef4444",fontSize:12,marginBottom:8}}>{error}</p>}
          {localStocks.length>0&&(<>
            <div style={{marginBottom:12}}>{localStocks.map(s=><div key={s.ticker} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 12px",background:"rgba(16,185,129,0.08)",borderRadius:8,marginBottom:6,fontSize:13}}><span style={{color:"#e0e7ff",fontWeight:700}}>{s.ticker} <span style={{color:"#6b7280",fontWeight:400,fontSize:11}}>{s.name}</span></span><div style={{display:"flex",alignItems:"center",gap:8}}>{s.currentValue&&<span style={{color:"#10b981"}}>£{s.currentValue.toLocaleString()}</span>}<button onClick={()=>setLocalStocks(l=>l.filter(x=>x.ticker!==s.ticker))} style={{background:"none",border:"none",color:"#ef4444",cursor:"pointer",fontSize:14,padding:"0 2px"}}>×</button></div></div>)}</div>
            <button onClick={()=>setMode('summary')} style={{width:"100%",padding:"12px",background:"linear-gradient(135deg,#6366f1,#4f46e5)",color:"#fff",border:"none",borderRadius:10,fontSize:14,fontWeight:700,cursor:"pointer"}}>Done →</button>
          </>)}
        </>)}
      </div>
    </div>
  );
}

function UpgradeModal({runsUsed, onUpgrade, onDismiss}) {
  const mob = useIsMobile();
  return(
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.75)",zIndex:9999,display:"flex",alignItems:"center",justifyContent:"center",padding:mob?12:24,backdropFilter:"blur(6px)"}}>
      <div style={{background:"linear-gradient(135deg,#1a1830,#0f0e1f)",border:"1px solid #4338ca",borderRadius:mob?14:20,padding:mob?"16px 18px":"36px 32px",maxWidth:460,width:"100%",boxShadow:"0 24px 80px rgba(0,0,0,0.7)",textAlign:"center"}}>
        {!mob&&<div style={{width:56,height:56,borderRadius:16,background:"linear-gradient(135deg,#6366f1,#8b5cf6)",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 20px"}}>
          <svg width="28" height="28" viewBox="0 0 20 20" fill="none"><path d="M10 2l2.4 4.8 5.3.8-3.85 3.75.91 5.3L10 14.27l-4.76 2.38.91-5.3L2.3 7.6l5.3-.8L10 2z" fill="#fff"/></svg>
        </div>}
        <div style={{fontSize:mob?9:11,fontWeight:700,color:"#6366f1",letterSpacing:"0.12em",textTransform:"uppercase",marginBottom:mob?4:8}}>You've used your {FREE_AI_RUNS} free AI runs</div>
        <h2 style={{fontSize:mob?16:24,fontWeight:800,color:"#e0e7ff",margin:mob?"0 0 6px":"0 0 12px",lineHeight:1.2}}>Upgrade to keep the AI magic</h2>
        <p style={{fontSize:mob?11:14,color:"#818cf8",lineHeight:1.5,margin:mob?"0 0 12px":"0 0 28px"}}>
          Upgrade for <strong style={{color:"#a5b4fc"}}>£5/month</strong> — unlimited AI runs, Financial Analysis, budgets &amp; stock tracker.
        </p>
        <div style={{background:"rgba(99,102,241,0.08)",border:"1px solid rgba(99,102,241,0.2)",borderRadius:mob?8:12,padding:mob?"8px 12px":"14px 16px",marginBottom:mob?12:24,textAlign:"left"}}>
          {["Unlimited AI categorisation","6-week cash flow forecast","Financial Analysis & goals","Budget tracking per category","Stock tracker (coming soon)"].map((f,i)=>(
            <div key={i} style={{display:"flex",alignItems:"center",gap:8,padding:mob?"2px 0":"4px 0",fontSize:mob?11:13,color:"#c7d2fe"}}>
              <svg width="12" height="12" viewBox="0 0 20 20" fill="none" style={{flexShrink:0}}><path d="M4 10l5 5 7-8" stroke="#10b981" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              {f}
            </div>
          ))}
        </div>
        <button onClick={onUpgrade} style={{width:"100%",padding:mob?"10px":"14px",background:"linear-gradient(135deg,#6366f1,#4f46e5)",color:"#fff",border:"none",borderRadius:mob?9:12,fontSize:mob?13:15,fontWeight:800,cursor:"pointer",boxShadow:"0 8px 24px rgba(99,102,241,0.4)",marginBottom:mob?6:10,letterSpacing:"0.02em"}}>
          Upgrade for £5/month →
        </button>
        <button onClick={onDismiss} style={{width:"100%",padding:mob?"7px":"11px",background:"none",color:"#4b5563",border:"1px solid #1f1d35",borderRadius:mob?9:12,fontSize:mob?11:13,cursor:"pointer"}}>
          Continue free (rule-based only)
        </button>
        {!mob&&<p style={{fontSize:11,color:"#374151",marginTop:12}}>Cancel anytime · Secure payment via Stripe</p>}
      </div>
    </div>
  );
}

function ContinueToast({toast, onDismiss}) {
  useEffect(()=>{const t=setTimeout(onDismiss,3000);return()=>clearTimeout(t);},[]);
  return(
    <div style={{position:"fixed",bottom:72,left:"50%",transform:"translateX(-50%)",zIndex:9999,background:"rgba(16,185,129,0.92)",backdropFilter:"blur(8px)",borderRadius:10,padding:"11px 20px",display:"flex",alignItems:"center",gap:10,boxShadow:"0 4px 20px rgba(0,0,0,0.4)",whiteSpace:"nowrap",animation:"fadeUp 0.35s ease both"}}>
      <div style={{width:7,height:7,borderRadius:"50%",background:"#fff",opacity:0.8,flexShrink:0}}/>
      <span style={{fontSize:13,fontWeight:700,color:"#fff"}}>{toast.newCount} new transaction{toast.newCount!==1?"s":""} added</span>
      <span style={{fontSize:12,color:"rgba(255,255,255,0.7)"}}>·</span>
      <span style={{fontSize:12,color:"rgba(255,255,255,0.8)"}}>{toast.carriedCount} carried forward</span>
    </div>
  );
}

function AppInner() {
  const [screen, setScreen] = useState("hero");
  const [premium, setPremiumState] = useState(isPremium);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  useEffect(()=>{
    // Handle return from Stripe Checkout + secret admin override
    const params = new URLSearchParams(window.location.search);
    if(params.get("upgraded")==="true"){
      setPremium();
      setPremiumState(true);
      window.history.replaceState({},"",window.location.pathname);
    }
    if(params.get("admin")==="ab7888" || window.location.hash==="#admin=ab7888"){
      setPremium();
      setPremiumState(true);
      window.history.replaceState({},"",window.location.pathname);
    }
    // Fix viewport to prevent zoom on input focus (iOS)
    let meta = document.querySelector('meta[name="viewport"]');
    if(!meta){meta=document.createElement('meta');meta.name="viewport";document.head.appendChild(meta);}
    meta.content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no";

    // Auto-fullscreen on mobile to hide browser chrome/tabs
    const isMob = window.innerWidth<768;
    if(isMob && document.documentElement.requestFullscreen){
      const tryFull = ()=>{
        document.documentElement.requestFullscreen().catch(()=>{});
        document.removeEventListener('touchstart', tryFull);
      };
      document.addEventListener('touchstart', tryFull, {once:true});
    }
  },[]);
  const [rawTransactions, setRawTransactions] = useState([]);
  const [multipleAccounts, setMultipleAccounts] = useState(false);
  const [categorisedTransactions, setCategorisedTransactions] = useState([]);
  const [sortedTransactions, setSortedTransactions] = useState([]);
  const [finalCategories, setFinalCategories] = useState([]);
  const [prevForecast, setPrevForecast] = useState(null);
  const [mergeMode, setMergeMode] = useState(false);
  const [continueMode, setContinueMode] = useState(false);
  const [continuePrevSession, setContinuePrevSession] = useState(null); // full previous session for merge
  const [continueToast, setContinueToast] = useState(null); // {newCount, carriedCount}
  const [noNewInfo, setNoNewInfo] = useState(null); // {lastDate} when diff finds 0 new txns

  function handleResume() {
    const s = loadSession();
    if (!s) return;
    setSortedTransactions(s.transactions);
    setFinalCategories(s.categories);
    setScreen("main");
  }

  function handleAddAccount() {
    setMergeMode(true);
    setScreen("upload");
  }

  function handleSortDone(txns, cats) {
    const isMerge = mergeMode;
    const isContinue = continueMode;
    let merged = txns;
    let mergedCats = cats;
    if (isMerge) {
      // Merge: dedup by date+narrative+amount key; existing transactions win for category
      const existingKeys = new Set(sortedTransactions.map(t=>`${t.date?.toISOString?.()??t.date}|${t.narrative}|${t.amount}`));
      const newOnly = txns.filter(t=>!existingKeys.has(`${t.date?.toISOString?.()??t.date}|${t.narrative}|${t.amount}`));
      merged = [...sortedTransactions, ...newOnly];
      mergedCats = [...new Set([...finalCategories, ...cats])];
      setMergeMode(false);
    } else if (isContinue && continuePrevSession) {
      // Continue session: merge new categorised txns with full previous session history
      merged = [...continuePrevSession.transactions, ...txns];
      mergedCats = [...new Set([...continuePrevSession.categories, ...cats])];
      setContinueToast({newCount: txns.length, carriedCount: continuePrevSession.transactions.length});
      setContinueMode(false);
      setContinuePrevSession(null);
    }
    setSortedTransactions(merged);
    setFinalCategories(mergedCats);
    saveSession(merged, mergedCats);
    if (isMerge) { setScreen("main"); return; }
    if (isContinue) { setScreen("main"); return; }
    // Check if the saved forecast from a previous session overlaps with new actual data
    const saved = loadLastForecast();
    if (saved?.weekStartDates?.length) {
      const result = computeAccuracy(saved, txns);
      if (result) {
        try { localStorage.setItem(FORECAST_ACCURACY_KEY, JSON.stringify(result)); } catch {}
        setPrevForecast(saved);
        setScreen("forecast-accuracy");
        return;
      }
    }
    setScreen("main");
  }

  function handleStartOver() {
    clearSession();
    setScreen("feedback");
  }

  return (
    <div style={{fontFamily:"'Inter',system-ui,sans-serif",background:"#08070f",minHeight:"100vh",minWidth:"100vw",position:"relative"}}>
      <style>{GLOBAL_CSS}</style>
      {screen==="hero"&&<HeroScreen onEnter={()=>setScreen("upload")} onResume={handleResume}/>}
      {screen==="upload"&&(noNewInfo?(
        <div style={{minHeight:"100vh",background:"#08070f",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"40px 24px"}}>
          <style>{GLOBAL_CSS}</style>
          <div style={{maxWidth:400,width:"100%",textAlign:"center",animation:"fadeUp 0.5s ease both"}}>
            <div style={{width:56,height:56,borderRadius:14,background:"rgba(99,102,241,0.12)",border:"1px solid rgba(99,102,241,0.3)",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 20px"}}>
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none"><path d="M9 12l2 2 4-4" stroke="#818cf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><circle cx="12" cy="12" r="9" stroke="#818cf8" strokeWidth="1.5"/></svg>
            </div>
            <div style={{fontSize:18,fontWeight:800,color:"#fff",marginBottom:8,letterSpacing:"-0.02em"}}>No new transactions found</div>
            <div style={{fontSize:13,color:"#52525b",marginBottom:28,lineHeight:1.6}}>
              Everything in this file was already in your last session{noNewInfo.lastDate?` (up to ${new Date(noNewInfo.lastDate).toLocaleDateString("en-GB",{day:"numeric",month:"long"})})`:""}.
              Try uploading a more recent statement, or start fresh.
            </div>
            <div style={{display:"flex",gap:10,justifyContent:"center",flexWrap:"wrap"}}>
              <button onClick={()=>setNoNewInfo(null)}
                style={{padding:"10px 20px",background:"linear-gradient(135deg,#6366f1,#4f46e5)",color:"#fff",border:"none",borderRadius:10,fontSize:13,fontWeight:700,cursor:"pointer"}}>
                Upload different file
              </button>
              <button onClick={()=>{setNoNewInfo(null);setContinueMode(false);setContinuePrevSession(null);}}
                style={{padding:"10px 20px",background:"transparent",color:"#52525b",border:"1px solid #2d2a6e",borderRadius:10,fontSize:13,fontWeight:500,cursor:"pointer"}}>
                Start fresh
              </button>
            </div>
          </div>
        </div>
      ):<UploadScreen onAddAccount={mergeMode?undefined:handleAddAccount} onDone={(txns,multi,isContinue)=>{
        if(isContinue){
          const sess = loadSession();
          if(sess && sess.transactions.length > 0){
            const mkKey = t => `${t.date instanceof Date ? t.date.toISOString() : t.date}|${t.narrative}|${t.amount}`;
            const existingKeys = new Set(sess.transactions.map(mkKey));
            const genuinelyNew = txns.filter(t => !existingKeys.has(mkKey(t)));
            if(genuinelyNew.length === 0){
              setNoNewInfo({lastDate: sess.lastTxnDate});
              return;
            }
            setRawTransactions(genuinelyNew);
            setContinuePrevSession(sess);
            setContinueMode(true);
          } else {
            setRawTransactions(txns);
            setContinueMode(false);
          }
        } else {
          setRawTransactions(txns);
          setContinueMode(false);
          setContinuePrevSession(null);
        }
        setMultipleAccounts(multi);
        if(!premium && getAiRunsUsed()>=FREE_AI_RUNS){
          setShowUpgradeModal(true);
        } else {
          incrementAiRuns();
          setScreen("categorise");
        }
      }}/>)}
      {screen==="categorise"&&<CategoriseScreen transactions={rawTransactions} multipleAccounts={multipleAccounts} onDone={(txns,cats)=>{setCategorisedTransactions(txns);setFinalCategories(cats);setScreen("sort");}}/>}
      {showUpgradeModal&&<UpgradeModal runsUsed={getAiRunsUsed()} onUpgrade={redirectToCheckout} onDismiss={()=>{setShowUpgradeModal(false);incrementAiRuns();setScreen("categorise");}}/>}
      {screen==="sort"&&<SortScreen transactions={categorisedTransactions} categories={finalCategories} onDone={handleSortDone} continueSince={continueMode&&continuePrevSession?.lastTxnDate?continuePrevSession.lastTxnDate:undefined}/>}
      {screen==="forecast-accuracy"&&prevForecast&&(
        <ForecastAccuracyScreen savedForecast={prevForecast} transactions={sortedTransactions} categories={finalCategories} onContinue={()=>setScreen("main")}/>
      )}
      {screen==="main"&&<MainScreen transactions={sortedTransactions} categories={finalCategories} onStartOver={handleStartOver} onFeedback={()=>setScreen("feedback")} onAddAccount={handleAddAccount}/>}
      {screen==="main"&&continueToast&&<ContinueToast toast={continueToast} onDismiss={()=>setContinueToast(null)}/>}
      {screen==="feedback"&&<FeedbackScreen txnCount={sortedTransactions.length} onDone={()=>setScreen("session-complete")}/>}
      {screen==="session-complete"&&<SessionCompleteScreen txnCount={sortedTransactions.length} onRestart={()=>{setScreen("hero");setRawTransactions([]);setSortedTransactions([]);setCategorisedTransactions([]);setFinalCategories([]);}}/>}
      <div style={{position:"fixed",bottom:0,left:0,right:0,padding:"6px 16px",display:(screen==="main"&&typeof window!=="undefined"&&window.innerWidth<768)?"none":"flex",justifyContent:"center",gap:16,pointerEvents:"none",zIndex:1}}>
        <a href="https://www.iubenda.com/privacy-policy/95322623" target="_blank" rel="noopener noreferrer" style={{fontSize:10,color:"#6b7280",textDecoration:"none",pointerEvents:"all"}}>Privacy Policy</a>
        <a href="https://www.iubenda.com/privacy-policy/95322623/cookie-policy" target="_blank" rel="noopener noreferrer" style={{fontSize:10,color:"#6b7280",textDecoration:"none",pointerEvents:"all"}}>Cookie Policy</a>
      </div>
    </div>
  );
}

export default function App(){
  return <ErrorBoundary><AppInner/></ErrorBoundary>;
}
