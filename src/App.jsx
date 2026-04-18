import { useState, useEffect, useMemo, useRef } from "react";
import * as XLSX from "xlsx";
import logo from "./logo.png";

// ─── Constants ────────────────────────────────────────────────────────────────
const DEFAULT_CATEGORIES = ["Food", "Travel", "Rent", "Memberships", "Salary", "Other Payments"];
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
  .dark-screen { font-family: 'DM Sans', system-ui, sans-serif; }
  button, select, input { touch-action: manipulation; }
  @keyframes pulse { 0%,100%{transform:scale(1);opacity:0.3} 50%{transform:scale(1.4);opacity:1} }
  @keyframes fadeUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
  @keyframes fadeIn { from{opacity:0} to{opacity:1} }
  @keyframes heroText { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
  @keyframes scanline { from{opacity:0;transform:translateY(-4px)} to{opacity:1;transform:translateY(0)} }
  @keyframes glow { 0%,100%{box-shadow:0 0 8px rgba(99,102,241,0.3)} 50%{box-shadow:0 0 28px rgba(99,102,241,0.7)} }
  @keyframes slideInUp { from{opacity:0;transform:translateY(24px)} to{opacity:1;transform:translateY(0)} }
  @keyframes typingDot { 0%,60%,100%{transform:translateY(0);opacity:0.3} 30%{transform:translateY(-4px);opacity:1} }
  @keyframes tooltipIn { from{opacity:0;transform:translateY(4px)} to{opacity:1;transform:translateY(0)} }
  @keyframes spotlightIn { from{opacity:0;transform:tr@keyframes spotlightIn { from{opacity:0;transform:translateY(12px) scale(0.97)} to{opacity:1;transform:translateY(0) scale(1)} }
  @keyframes cursorFloat { 0%,100%{transform:translate(0,0)} 40%{transform:translate(4px,6px)} 60%{transform:translate(4px,6px) scale(0.9)} 80%{transform:translate(4px,6px) scale(1)} }
  @keyframes cursorClick { 0%,100%{transform:scale(1)} 50%{transform:scale(0.82)} }
  @keyframes ripple { 0%{transform:scale(0.5);opacity:0.8} 100%{transform:scale(2.5);opacity:0} }
  @keyframes cursorFadeIn { from{opacity:0;transform:translate(-8px,-8px)} to{opacity:1;transform:translate(0,0)} }
  @keyframes logoWipe { from{width:0} to{width:100%} }
  @keyframes logoBgFade { from{opacity:0} to{opacity:1} }
  .abound-row:hover td { background: rgba(99,102,241,0.07) !important; transition: background 0.1s; }anslateY(12px) scale(0.97)} to{opacity:1;transform:translateY(0) scale(1)} }
  .abound-row:hover td { background: rgba(99,102,241,0.07) !important; transition: background 0.1s; }
`;

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(typeof window!=="undefined"?window.innerWidth<768:false);
  useEffect(()=>{
    const handler=()=>setIsMobile(window.innerWidth<768);
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
    "booking.com","hotels.com","expedia","airbnb","hostelworld",
    "national express","megabus","flixbus","coach",
    "p&o","carnival","cruise","ferry","hovercraft",
    "lime","bird","scooter","voi","tier","dott","e-scooter"
  ],
  Memberships: [
    "netflix","spotify","apple","itunes","icloud","apple.com","appstore",
    "amazon prime","amazon","prime video","disney","disney+","disneyplus",
    "hbo","hulu","paramount","peacock","britbox","mubi","curzon","odeon","vue",
    "gymbox","puregym","virgin active","david lloyd","anytime fitness","planet fitness",
    "gym","fitness","crossfit","pilates","yoga","barry's","f45","orangetheory",
    "audible","kindle","scribd","newspaper","times","guardian","ft.com","financial times",
    "sky","now tv","nowtv","bt sport","dazn","eurosport","discovery+",
    "google","youtube","youtube premium","twitch","patreon",
    "adobe","microsoft","office","dropbox","notion","slack","zoom","lastpass","1password",
    "linkedin","indeed","cv-library","reed","totaljobs",
    "duolingo","masterclass","coursera","udemy","skillshare",
    "paypal","paypal *","venmo","klarna","clearpay","laybuy",
    "dating","hinge","tinder","bumble","match","eharmony",
    "headspace","calm","meditation","therapy","betterhelp","nhs app"
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
  Salary: [
    "salary","payroll","wages","pay","income","bacs","faster payment received",
    "standing order in","transfer in","payment received","credit","refund"
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
  "american express","amex","nw world","mastercard","visa","credit card","card repayment",
  "card payment","creditcard","barclaycard","natwest card","hsbc card","lloyds card",
  "capital one","aqua","vanquis","newday","fluid","aquis"
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
  const mo = {Jan:0,Feb:1,Mar:2,Apr:3,May:4,Jun:5,Jul:6,Aug:7,Sep:8,Oct:9,Nov:10,Dec:11};
  const m1 = s.match(/^(\d{1,2})-([A-Za-z]{3})-(\d{2})$/);
  if (m1) return new Date(2000+parseInt(m1[3]), mo[m1[2]], parseInt(m1[1]));
  const m2 = s.match(/^(\d{1,2})-([A-Za-z]{3})-(\d{4})$/);
  if (m2) return new Date(parseInt(m2[3]), mo[m2[2]], parseInt(m2[1]));
  const m3 = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (m3) return new Date(parseInt(m3[3]), parseInt(m3[2])-1, parseInt(m3[1]));
  const m4 = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (m4) return new Date(parseInt(m4[1]), parseInt(m4[2])-1, parseInt(m4[3]));
  const m5 = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2})$/);
  if (m5) return new Date(2000+parseInt(m5[3]), parseInt(m5[2])-1, parseInt(m5[1]));
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
function fmtMoney(v) {
  if (v===0||v===null||v===undefined) return "-";
  const n = Math.round(v);
  if (n < 0) return `(${Math.abs(n).toLocaleString()})`;
  return n.toLocaleString();
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
        const dateRx = /^date$/i;
        const descRx = /^(description|narrative|details|merchant|payee|reference)$/i;
        const amtRx  = /^(amount|value|debit|credit|trans)$/i;
        let headerRowIndex = -1;
        let dateKey, descKey, amtKey;
        for (let i = 0; i < Math.min(allRows.length, 20); i++) {
          const row = allRows[i].map(c => String(c).trim());
          const dIdx = row.findIndex(c => dateRx.test(c));
          const nIdx = row.findIndex(c => descRx.test(c));
          const aIdx = row.findIndex(c => amtRx.test(c));
          if (dIdx !== -1 && nIdx !== -1 && aIdx !== -1) {
            headerRowIndex = i;
            dateKey = row[dIdx]; descKey = row[nIdx]; amtKey = row[aIdx];
            break;
          }
        }
        if (headerRowIndex === -1) { resolve([]); return; }
        const headers = allRows[headerRowIndex].map(h => String(h).trim());
        const dataRows = allRows.slice(headerRowIndex + 1)
          .filter(r => r.some(c => c !== "" && c !== null && c !== undefined))
          .map(r => { const obj = {}; headers.forEach((h, i) => { if (h) obj[h] = r[i] ?? ""; }); return obj; });
        resolve(dataRows);
      } catch(err) { console.error("Error reading file:", err); resolve([]); }
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

  // Matches dates at start of text: dd/mm/yy, dd-mm-yyyy, dd Jan 24, 01-Jan-2024, etc.
  const dateRx = /^(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}|\d{1,2}[\/\-][A-Za-z]{3}[\/\-]\d{2,4}|\d{1,2}\s+[A-Za-z]{3}\s*\d{2,4})/;
  // Matches plain money values: 1,234.56 or -1234.56 (strip £ before testing)
  const moneyRx = /^-?[\d,]+\.\d{2}$/;
  const TRANSACTION_TYPES = /^(D\/D|S\/O|BACS|DPC|CHQ|TFR|ATM|FP|BGC|OTH|CR|DR|VIS|MAE|C\/L|BP|CHAPS|DD|SO|BAC|TF|FPS|STO|CPT|TFI|INT)$/i;
  const rows = [];

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
      // Handles: "Paid in / Paid out", "Money in / Money out", "Credit / Debit", "In / Out"
      const hasCredit = lower.includes('paid in') || lower.includes('money in') || lower.includes('credit') || /\bin\b/.test(lower);
      const hasDebit  = lower.includes('paid out') || lower.includes('money out') || lower.includes('debit') || /\bout\b/.test(lower);
      if (hasCredit && hasDebit) {
        let cX = null, dX = null;
        const joinedItems = lineItems.map((it, i) => ({...it, next: lineItems[i+1]?.text.toLowerCase()||'', prev: lineItems[i-1]?.text.toLowerCase()||''}));
        for (const it of joinedItems) {
          const t = it.text.toLowerCase();
          if (t === 'paid in' || t === 'money in' || (t === 'in' && (it.prev === 'paid' || it.prev === 'money')))  cX = it.x;
          if (t === 'paid out' || t === 'money out' || (t === 'out' && (it.prev === 'paid' || it.prev === 'money'))) dX = it.x;
          if (t === 'paid' && it.next === 'in')  cX = it.x;
          if (t === 'paid' && it.next === 'out') dX = it.x;
          if (t === 'money' && it.next === 'in')  cX = it.x;
          if (t === 'money' && it.next === 'out') dX = it.x;
          if (t === 'credit' && (lower.includes('debit') || lower.includes('out'))) cX = it.x;
          if (t === 'debit'  && (lower.includes('credit') || lower.includes('in'))) dX = it.x;
        }
        if (cX !== null) creditX = cX;
        if (dX !== null) debitX = dX;
        continue;
      }

      // Skip lines that don't start with a date-like token
      if (!dateRx.test(lineText.trimStart())) continue;
      const dateMatch = lineText.match(dateRx);
      if (!dateMatch) continue;
      const dateStr = dateMatch[0];

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

function normaliseRows(rows, accountLabel) {
  if (!rows.length) return [];
  const keys = Object.keys(rows[0]);
  const isMainAccount = accountLabel === "Main Account";
  const dateKey = keys.find(k=>/^date$/i.test(k.trim()))||keys.find(k=>/date/i.test(k));
  const narKey = keys.find(k=>/^description$/i.test(k.trim()))||keys.find(k=>/^narrative$/i.test(k.trim()))||keys.find(k=>/desc|narr|merchant|payee|detail|ref/i.test(k));
  const amtKey = keys.find(k=>/^amount$/i.test(k.trim()))||keys.find(k=>/^value$/i.test(k.trim()))||keys.find(k=>/^trans$/i.test(k.trim()))||keys.find(k=>/amount|value|trans|spend|debit/i.test(k)&&!/balance|date|extended|statement/i.test(k));
  const balKey = keys.find(k=>/^balance$/i.test(k.trim()));
  if (!dateKey||!narKey||!amtKey) { console.error(`[${accountLabel}] Missing columns`); return []; }
  return rows.map(row=>{
    const date = parseDate(row[dateKey]);
    const rawAmt = Number(String(row[amtKey]).replace(/[£,]/g,""))||0;
    const amount = Math.abs(rawAmt);
    const narrative = String(row[narKey]||"").replace(/\r\n|\r|\n/g," ").trim();
    const balance = balKey?(Number(String(row[balKey]).replace(/[£,]/g,""))||null):null;
    if (!date||!narrative||rawAmt===0) return null;
    const isIncome = isMainAccount ? rawAmt>0 : rawAmt<0;
    return {date, narrative, amount, isIncome, balance, account:accountLabel, category:null};
  }).filter(Boolean);
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

async function smartCategorise(transactions, userCategories, multipleAccounts, onProgress) {
  const allCats = multipleAccounts
    ? [...userCategories.filter(c=>c!==INTERCOMPANY_CATEGORY), INTERCOMPANY_CATEGORY]
    : userCategories;
  const spendCats = allCats.filter(c=>c!=="Salary"&&c!=="Card Repayment");

  // Step 1: income routing only — reliable, no ambiguity
  const withIncome = transactions.map(t => {
    if (t.isIncome && t.account==="Main Account") return {...t, category:"Salary"};
    if (t.isIncome && t.account!=="Main Account") return {...t, category:"Card Repayment"};
    return {...t, category:null};
  });
  const toClassify = withIncome.filter(t=>t.category===null);
  onProgress({type:"lookup_done", known:withIncome.length-toClassify.length, unknown:toClassify.length, pct:10});
  if (toClassify.length===0) { onProgress({type:"done"}); return withIncome; }

  const apiKey = localStorage.getItem("anthropic_api_key") || import.meta.env.VITE_ANTHROPIC_KEY;
  const results = new Map();

  if (apiKey) {
    // Claude first for every spend transaction
    const BATCH = 30;
    const batches = Array.from({length:Math.ceil(toClassify.length/BATCH)},(_,i)=>toClassify.slice(i*BATCH,(i+1)*BATCH));
    for (let bi=0; bi<batches.length; bi++) {
      const batch = batches[bi];
      onProgress({type:"progress", pct:10+Math.round(((bi+1)/batches.length)*85), batchNum:bi+1, totalBatches:batches.length});
      try {
        const prompt = `You are categorising UK bank transactions. You MUST assign every transaction to exactly one of these categories: ${spendCats.join(", ")}.

Category rules:
- Food: supermarkets (Tesco, Sainsbury's, Aldi, Lidl, Waitrose, M&S Food, Asda, Morrisons, Co-op), restaurants, cafes, coffee shops, takeaways, Deliveroo, Just Eat, Uber Eats, any food/drink purchase
- Travel: TfL, Oyster, Uber, Bolt, trains (Trainline, National Rail, Avanti, GWR, etc.), flights (EasyJet, Ryanair, BA, etc.), parking, petrol stations, fuel
- Rent: rent payments, mortgage, letting agents, property management
- Memberships: Netflix, Spotify, Apple Music, Amazon Prime, Disney+, gym memberships, any recurring subscription, software, apps, iCloud, Google One
- Other Payments: everything else — shops, health (Specsavers, dentist, pharmacy, Boots), clothing, electronics, ATM withdrawals, transfers, anything not fitting the above

Every transaction MUST get a category. Never return null or unknown. If unsure, use Other Payments.
Respond with ONLY a valid JSON array of strings, one category per transaction, same order as input.

Transactions:
${batch.map((t,i)=>`${i+1}. "${t.narrative}" £${Math.abs(t.amount).toFixed(2)}`).join("\n")}`;

        const res = await fetch("https://api.anthropic.com/v1/messages",{
          method:"POST",
          headers:{"x-api-key":apiKey,"anthropic-version":"2023-06-01","content-type":"application/json","anthropic-dangerous-direct-browser-access":"true"},
          body:JSON.stringify({model:"claude-haiku-4-5-20251001",max_tokens:800,messages:[{role:"user",content:prompt}]})
        });
        if (!res.ok) throw new Error(`${res.status}`);
        const data = await res.json();
        const text = data.content[0].text.trim();
        const match = text.match(/\[[\s\S]*\]/);
        if (!match) throw new Error("no json");
        const cats = JSON.parse(match[0]);
        batch.forEach((t,i)=>{
          const cat = cats[i];
          // Valid category from Claude → use it; otherwise fall back to local rules
          results.set(t.narrative+t.date+t.amount, allCats.includes(cat)?cat : merchantLookup(t.narrative)||ruleBasedCat(t.narrative,allCats));
        });
      } catch(_) {
        // Claude failed for this batch — local rules as safety net
        batch.forEach(t=>results.set(t.narrative+t.date+t.amount, merchantLookup(t.narrative)||ruleBasedCat(t.narrative,allCats)));
      }
    }
  } else {
    // No API key — merchant lookup then keyword rules
    toClassify.forEach(t=>results.set(t.narrative+t.date+t.amount, merchantLookup(t.narrative)||ruleBasedCat(t.narrative,allCats)));
  }

  onProgress({type:"done"});
  return withIncome.map(t=>{
    if (t.category!==null) return t;
    return {...t, category:results.get(t.narrative+t.date+t.amount)||"Other Payments"};
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
    case "Salary": return <svg viewBox="0 0 20 20" style={s}><path {...p} d="M10 2v16M6 5.5C6 4.1 7.8 3 10 3s4 1.1 4 2.5S12.2 8 10 8s-4 1.1-4 2.5S7.8 13 10 13s4-1.1 4-2.5"/></svg>;
    case "Card Repayment": return <svg viewBox="0 0 20 20" style={s}><rect {...p} x="2" y="5" width="16" height="11" rx="2"/><path {...p} d="M2 9h16"/><path {...p} d="M14 13.5l2-1.5-2-1.5"/><path {...p} d="M16 12H9"/></svg>;
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

// ─── Session persistence ──────────────────────────────────────────────────────
const SESSION_KEY = "abound_session_v1";

function saveSession(transactions, categories) {
  try {
    const payload = {
      savedAt: new Date().toISOString(),
      txnCount: transactions.length,
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

// ─── SCREEN 0: Hero ───────────────────────────────────────────────────────────
function HeroScreen({onEnter, onResume}) {
  const [phase, setPhase] = useState(0);
  const [leaving, setLeaving] = useState(false);
  const [session, setSession] = useState(null);
  useEffect(()=>{
    const t1=setTimeout(()=>setPhase(1),500);
    const t2=setTimeout(()=>setPhase(2),1200);
    setSession(loadSession());
    return ()=>{clearTimeout(t1);clearTimeout(t2);};
  },[]);
  function handleEnter(){setLeaving(true);setTimeout(onEnter,500);}
  function handleResume(){setLeaving(true);setTimeout(onResume,500);}
  const features=[
    {dot:"#10b981",text:"No bank logins. Ever."},
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
              <img src={logo} alt="Abound" style={{height:52,display:"block",minWidth:"100%"}}/>
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
        </div>
      </div>
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
          <img src={logo} alt="Abound" style={{height:30,opacity:0.95}}/>
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

// ─── Loading Screen ───────────────────────────────────────────────────────────
function LoadingScreen({pct, message, done, logLines=[]}) {
  return (
    <div style={{minHeight:"100vh",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",background:"#08070f",padding:40}}>
      <style>{GLOBAL_CSS}</style>
      <img src={logo} alt="Abound" style={{height:40,marginBottom:48,opacity:0.9}}/>
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
function UploadScreen({onDone}) {
  const [accounts, setAccounts] = useState([{id:1,file:null,name:""}]);
  const [loading, setLoading] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(true);
  const [step, setStep] = useState("upload"); // "upload" | "balance"
  const [parsedTxns, setParsedTxns] = useState([]);
  const [multipleAccounts, setMultipleAccounts] = useState(false);
  const [missingBalanceAccounts, setMissingBalanceAccounts] = useState([]); // [{label, value}]
  const [balanceInputs, setBalanceInputs] = useState({});
  const hasMainFile = !!accounts[0].file;
  useEffect(()=>{const t=setTimeout(()=>setShowPrivacy(false),3200);return()=>clearTimeout(t);},[]);
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
      const rows=ext==="pdf"?await readPdfFile(acc.file):await readExcelFile(acc.file);
      const isFirst=acc.id===accounts[0].id;
      let label;
      if(isFirst)label="Main Account";
      else if(ccIndex===1){label="Credit Card";ccIndex++;}
      else{label=`Credit Card ${ccIndex}`;ccIndex++;}
      const txns=normaliseRows(rows,label);
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
      onDone(allRows, accounts.filter(a=>a.file).length>1);
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
    onDone(injected, multipleAccounts);
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
      {/* Privacy pulse */}
      <div style={{position:"fixed",top:0,left:0,right:0,zIndex:100,display:"flex",justifyContent:"center",padding:"10px",background:"rgba(16,185,129,0.07)",borderBottom:"1px solid rgba(16,185,129,0.12)",opacity:showPrivacy?1:0,transform:showPrivacy?"translateY(0)":"translateY(-100%)",transition:"all 0.5s ease"}}>
        <div style={{width:6,height:6,borderRadius:"50%",background:"#10b981",marginRight:8,boxShadow:"0 0 6px #10b981",flexShrink:0,alignSelf:"center"}}/>
        <span style={{fontSize:12,color:"#6ee7b7",fontWeight:500}}>Your statement never leaves your device.</span>
      </div>
      <div style={{width:"100%",maxWidth:420,position:"relative",zIndex:1,animation:"fadeUp 0.6s ease both"}}>
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
        <div style={{marginBottom:24}}>
          <h2 style={{fontSize:21,fontWeight:800,color:"#fff",marginBottom:6,letterSpacing:"-0.02em"}}>Upload your statements</h2>
          <p style={{fontSize:13,color:"#52525b",margin:0}}>Drop in your bank exports. We'll handle the rest.</p>
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
  const [logLines, setLogLines] = useState([{text:"Starting merchant lookup...",done:false,active:true}]);
  const [suggestions, setSuggestions] = useState([]);
  const [dismissedSuggestions, setDismissedSuggestions] = useState(new Set());
  useEffect(()=>{
    (async()=>{
      const result = await smartCategorise(transactions, DEFAULT_CATEGORIES, multipleAccounts, update=>{
        if(update?.type==="lookup_done"){
          setPct(30); setMessage(`Matched ${update.known} via lookup`);
          setLogLines([
            {text:`Matched ${update.known} transactions via merchant lookup`,done:true,active:false},
            {text:`Sending ${update.unknown} to Claude for analysis...`,done:false,active:true},
          ]);
        } else if(update?.type==="progress"){
          setPct(update.pct);
          setLogLines(l=>[...l.slice(0,-1),{...l[l.length-1],done:true,active:false},{text:`Processing batch ${update.batchNum} of ${update.totalBatches}...`,done:false,active:true}]);
        } else if(update?.type==="done"){
          setPct(100);
          setLogLines(l=>[...l.map(x=>({...x,done:true,active:false})),{text:"All categorised ✓",done:true,active:false}]);
        }
      });
      setCategorised(result);
      setDone(true);
      const apiKey = localStorage.getItem("anthropic_api_key") || import.meta.env.VITE_ANTHROPIC_KEY;
      const sugg = await computeCategorySuggestions(result, baseCats, apiKey);
      setSuggestions(sugg);
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
  function addCategory(){const t=newCat.trim();if(!t||categories.includes(t))return;setCategories(c=>[...c,t]);setNewCat("");}
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

        {/* Header */}
        <div style={{display:"flex",alignItems:"center",gap:14,marginBottom:32,animation:"fadeUp 0.5s ease both"}}>
          <img src={logo} alt="Abound" style={{height:isMobile?28:34,opacity:0.95}}/>
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

        {/* Smart suggestions */}
        {suggestions.filter(s=>!dismissedSuggestions.has(s.name)&&!categories.includes(s.name)).length>0&&(
          <div style={{background:"rgba(99,102,241,0.07)",border:"1px solid rgba(99,102,241,0.2)",borderRadius:14,padding:"14px 16px",marginBottom:16,animation:"fadeUp 0.5s ease 0.12s both"}}>
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
              <svg width="14" height="14" viewBox="0 0 20 20" fill="none"><path d="M10 2a6 6 0 00-3 11.2V15h6v-1.8A6 6 0 0010 2z" stroke="#a5b4fc" strokeWidth="1.5"/><path d="M8 17h4M9 15v2M11 15v2" stroke="#a5b4fc" strokeWidth="1.5" strokeLinecap="round"/></svg>
              <span style={{fontSize:12,fontWeight:700,color:"#a5b4fc",letterSpacing:"0.04em"}}>SUGGESTED CATEGORIES</span>
              <span style={{fontSize:11,color:"#52525b",marginLeft:4}}>Abound spotted recurring patterns in your transactions</span>
            </div>
            <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
              {suggestions.filter(s=>!dismissedSuggestions.has(s.name)&&!categories.includes(s.name)).map(s=>(
                <div key={s.name} style={{display:"flex",alignItems:"center",gap:0,background:"rgba(99,102,241,0.1)",border:"1px solid rgba(99,102,241,0.3)",borderRadius:20,overflow:"hidden"}}>
                  <button onClick={()=>{setCategories(c=>[...c,s.name]);setDismissedSuggestions(d=>new Set([...d,s.name]));}}
                    style={{padding:"6px 12px",background:"none",border:"none",color:"#c7d2fe",fontSize:12,fontWeight:600,cursor:"pointer",display:"flex",alignItems:"center",gap:6}}>
                    <span style={{color:"#6366f1",fontSize:14,fontWeight:400}}>+</span>
                    {s.name}
                    <span style={{fontSize:10,color:"#6366f1",background:"rgba(99,102,241,0.15)",borderRadius:10,padding:"1px 6px"}}>{s.count} txns</span>
                  </button>
                  <button onClick={()=>setDismissedSuggestions(d=>new Set([...d,s.name]))}
                    style={{padding:"6px 8px",background:"none",border:"none",borderLeft:"1px solid rgba(99,102,241,0.2)",color:"#4b5563",fontSize:13,cursor:"pointer",lineHeight:1}}>×</button>
                </div>
              ))}
            </div>
          </div>
        )}

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
function SortScreen({transactions, categories: initialCategories, onDone}) {
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
  const spendCats=categories.filter(c=>c!=="Salary"&&c!=="Other Payments"&&c!=="Card Repayment");
  const catRepaymentInCats=categories.includes("Card Repayment");
  const allBuckets=[...spendCats,catRepaymentInCats?"Card Repayment":null,"Skip"].filter(Boolean);
  const CAT_COLORS={"Food":"#10b981","Travel":"#3b82f6","Rent":"#f59e0b","Memberships":"#8b5cf6","Card Repayment":"#ec4899"};
  function catColor(cat,i){return CAT_COLORS[cat]||CATEGORY_COLORS[i%CATEGORY_COLORS.length]||"#6366f1";}
  function assignItem(narrative,cat){if(cat!=="Skip")setBucketCounts(p=>({...p,[cat]:(p[cat]||0)+1}));setItems(p=>p.map(x=>x.narrative===narrative?{...x,category:cat}:x));setSwipeOffset(0);setSwipeTarget(null);}
  function dropIntoCat(cat){const n=dragRef.current;if(!n)return;assignItem(n,cat);dragRef.current=null;setHoveredCat(null);}
  function undoItem(narrative,fromCat){if(fromCat!=="Skip")setBucketCounts(p=>({...p,[fromCat]:Math.max(0,(p[fromCat]||1)-1)}));setItems(p=>p.map(x=>x.narrative===narrative?{...x,category:"Other Payments"}:x));}
  function addCategory(){const t=newCat.trim();if(!t||categories.includes(t))return;setCategories(c=>[...c,t]);setNewCat("");setShowAddCat(false);}
  function removeCategory(cat){if(DEFAULT_CATEGORIES.includes(cat))return;setCategories(c=>c.filter(x=>x!==cat));setItems(p=>p.map(x=>x.category===cat?{...x,category:"Other Payments"}:x));setBucketCounts(p=>{const n={...p};delete n[cat];return n;});}
  function handleConfirm(){const map={};items.forEach(i=>{map[i.narrative]=i.category==="Skip"?"Other Payments":i.category;});onDone(transactions.map(t=>t.category==="Other Payments"&&map[t.narrative]?{...t,category:map[t.narrative]}:t),categories);}
  const pct=allItems.length?Math.round(((sorted.length+skipped.length)/allItems.length)*100):100;
  const txnCountByCat=useMemo(()=>{const counts={};transactions.forEach(t=>{if(t.category&&t.category!=="Other Payments")counts[t.category]=(counts[t.category]||0)+1;});return counts;},[transactions,items]);
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
              <div key={item.narrative} draggable={isTop} onDragStart={()=>{dragRef.current=item.narrative;}} onDragEnd={()=>{dragRef.current=null;setHoveredCat(null);}}
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
              <div key={cat} onDragOver={e=>{e.preventDefault();setHoveredCat(cat);}} onDragLeave={e=>{if(!e.currentTarget.contains(e.relatedTarget))setHoveredCat(null);}} onDrop={e=>{e.preventDefault();dropIntoCat(cat);}}
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
          {(()=>{const isHovered=hoveredCat==="Skip",count=skipped.length;return(
            <div onDragOver={e=>{e.preventDefault();setHoveredCat("Skip");}} onDragLeave={e=>{if(!e.currentTarget.contains(e.relatedTarget))setHoveredCat(null);}} onDrop={e=>{e.preventDefault();dropIntoCat("Skip");}}
              style={{border:`2px dashed ${isHovered?"#6b7280":"#2d2a6e"}`,borderRadius:14,padding:"14px 12px 12px",background:isHovered?"rgba(107,114,128,0.12)":"rgba(255,255,255,0.01)",transition:"all 0.15s",cursor:"default",display:"flex",flexDirection:"column",alignItems:"center",gap:8}}>
              <div style={{display:"flex",alignItems:"center",justifyContent:"center",width:30,height:30,opacity:isHovered?1:0.35,marginTop:2}}><svg viewBox="0 0 20 20" width="24" height="24" fill="none"><path stroke={isHovered?"#9ca3af":"#374151"} strokeWidth="1.5" strokeLinecap="round" d="M6 8c0-2.2 1.8-4 4-4s4 1.8 4 4c0 1.5-.8 2.8-2 3.5V13H8v-1.5C6.8 10.8 6 9.5 6 8z"/><path stroke={isHovered?"#9ca3af":"#374151"} strokeWidth="1.5" strokeLinecap="round" d="M8 16h4"/></svg></div>
              <div style={{fontSize:13,fontWeight:700,color:isHovered?"#9ca3af":"#374151",textAlign:"center",lineHeight:1.3}}>Not sure</div>
              <div style={{fontSize:10,fontWeight:600,color:count>0?"#6b7280":"#2d2a6e",background:"rgba(255,255,255,0.03)",borderRadius:20,padding:"2px 10px",border:"1px solid #1f1d35"}}>
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
        <div style={{padding:"12px 16px 8px",display:"flex",alignItems:"center",gap:10,flexShrink:0}}>
          <div style={{flex:1,height:3,background:"#1f1d35",borderRadius:999,overflow:"hidden"}}>
            <div style={{height:"100%",width:`${pct}%`,background:"linear-gradient(90deg,#6366f1,#10b981)",transition:"width 0.4s"}}/>
          </div>
          <span style={{fontSize:11,color:pct===100?"#10b981":"#6366f1",fontWeight:700,flexShrink:0,fontVariantNumeric:"tabular-nums"}}>{sorted.length+skipped.length}/{allItems.length}</span>
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
                const color=isSkip?"#6b7280":catColor(cat,spendCats.indexOf(cat));
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
        <img src={logo} alt="Abound" style={{height:28}}/>
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
function ReviewScreen({transactions, categories, onUpdate, onGoToCashFlow}) {
  const [editCount, setEditCount] = useState(0);
  const [showUpdatedBanner, setShowUpdatedBanner] = useState(false);
  const [filterCat, setFilterCat] = useState("All");
  const [filterAccount, setFilterAccount] = useState("All");
  const [search, setSearch] = useState("");
  const isMobile = useIsMobile();
  const accounts = useMemo(()=>{const seen=new Set(),list=[];transactions.forEach(t=>{if(!seen.has(t.account)){seen.add(t.account);list.push(t.account);}});return list;},[transactions]);
  const sortedTxns = useMemo(()=>[...transactions].sort((a,b)=>b.date-a.date),[transactions]);
  const filtered = useMemo(()=>sortedTxns.filter(t=>{if(filterCat!=="All"&&t.category!==filterCat)return false;if(filterAccount!=="All"&&t.account!==filterAccount)return false;if(search&&!t.narrative.toLowerCase().includes(search.toLowerCase()))return false;return true;}),[sortedTxns,filterCat,filterAccount,search]);
  function changeCategory(txn,newCat){const updated=transactions.map(t=>t.narrative===txn.narrative&&t.date===txn.date&&t.amount===txn.amount?{...t,category:newCat}:t);onUpdate(updated);setEditCount(c=>c+1);if(editCount>=2)setShowUpdatedBanner(true);}
  const catColors={};categories.forEach((c,i)=>{catColors[c]=CATEGORY_COLORS[i%CATEGORY_COLORS.length];});
  const inputStyle={padding:"7px 12px",border:"1px solid #1f1d35",borderRadius:8,fontSize:13,background:"#0f0e1a",color:"#e0e7ff",outline:"none",cursor:"pointer"};
  return(
    <div style={{flex:1,overflow:"auto",background:"#08070f"}}>
      <style>{GLOBAL_CSS}</style>
      {showUpdatedBanner&&(
        <div style={{background:"rgba(16,185,129,0.1)",borderBottom:"1px solid rgba(16,185,129,0.2)",padding:"12px 24px",display:"flex",alignItems:"center",gap:16}}>
          <div style={{width:8,height:8,borderRadius:"50%",background:"#10b981",boxShadow:"0 0 8px #10b981",flexShrink:0}}/>
          <div style={{flex:1}}>
            <div style={{fontWeight:700,color:"#6ee7b7",fontSize:13}}>Cash flow updated</div>
            <div style={{color:"#4b5563",fontSize:12}}>Your corrections have been applied.</div>
          </div>
          <button onClick={onGoToCashFlow} style={{padding:"7px 16px",background:"rgba(16,185,129,0.15)",color:"#10b981",border:"1px solid rgba(16,185,129,0.3)",borderRadius:8,fontSize:13,fontWeight:700,cursor:"pointer"}}>View Cash Flow →</button>
          <button onClick={()=>setShowUpdatedBanner(false)} style={{fontSize:18,color:"#374151",background:"none",border:"none",cursor:"pointer"}}>×</button>
        </div>
      )}
      <div style={{padding:isMobile?"12px 16px":"20px 24px"}}>
        {/* Header */}
        <div style={{marginBottom:20}}>
          <h2 style={{fontSize:20,fontWeight:800,color:"#fff",marginBottom:4,letterSpacing:"-0.02em"}}>Review Transactions</h2>
          <p style={{fontSize:13,color:"#52525b",margin:0}}>Fix any miscategorised transactions to sharpen your forecast.</p>
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
          <div style={{marginLeft:"auto",fontSize:12,color:"#4b5563",whiteSpace:"nowrap"}}>
            {filtered.length} transaction{filtered.length!==1?"s":""}
            {editCount>0&&<span style={{marginLeft:8,color:"#10b981",fontWeight:600}}>· {editCount} edited</span>}
          </div>
        </div>
        {/* Table */}
        <div style={{background:"#0a0919",borderRadius:12,border:"1px solid #1f1d35",overflow:"hidden",boxShadow:"0 4px 24px rgba(0,0,0,0.3)"}}>
          {!isMobile&&(
            <div style={{display:"grid",gridTemplateColumns:"110px 1fr 110px 180px",background:"linear-gradient(90deg,#1e1b4b,#1a1738)",padding:"10px 16px",borderBottom:"1px solid #2d2a6e"}}>
              <div style={{fontSize:10,fontWeight:700,color:"#6366f1",letterSpacing:"0.1em"}}>DATE</div>
              <div style={{fontSize:10,fontWeight:700,color:"#6366f1",letterSpacing:"0.1em"}}>DESCRIPTION</div>
              <div style={{fontSize:10,fontWeight:700,color:"#6366f1",letterSpacing:"0.1em",textAlign:"right"}}>AMOUNT</div>
              <div style={{fontSize:10,fontWeight:700,color:"#6366f1",letterSpacing:"0.1em",paddingLeft:16}}>CATEGORY</div>
            </div>
          )}
          {filtered.map((t,i)=>{
            const rowBg=i%2===0?"rgba(255,255,255,0.012)":"rgba(255,255,255,0.005)";
            const hoverBg="rgba(99,102,241,0.06)";
            const amtColor=t.isIncome?"#10b981":"#e0e7ff";
            const pillBg=`${catColors[t.category]||"#6366f1"}22`;
            return isMobile ? (
              <div key={i} style={{padding:"13px 16px",borderBottom:"1px solid #1a1830",background:rowBg}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
                  <span style={{fontSize:11,color:"#4b5563"}}>{fmtDate(t.date)} · <span style={{color:"#374151"}}>{t.account==="Main Account"?"Main":t.account.replace("Credit Card","CC")}</span></span>
                  <span style={{fontSize:13,fontWeight:700,color:amtColor,fontVariantNumeric:"tabular-nums"}}>
                    {t.isIncome?"+":""}{`£${t.amount.toLocaleString(undefined,{maximumFractionDigits:2})}`}
                  </span>
                </div>
                <div style={{fontSize:13,color:"#c7d2fe",marginBottom:10,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{t.narrative}</div>
                <select value={t.category||""} onChange={e=>changeCategory(t,e.target.value)}
                  style={{padding:"6px 12px",borderRadius:20,border:`1.5px solid ${catColors[t.category]||"#6366f1"}`,background:pillBg,color:catColors[t.category]||"#a5b4fc",fontSize:12,fontWeight:700,cursor:"pointer",outline:"none",width:"100%"}}>
                  {categories.map(c=><option key={c} value={c} style={{background:"#0f0e1a",color:"#e0e7ff"}}>{c}</option>)}
                </select>
              </div>
            ) : (
              <div key={i} style={{display:"grid",gridTemplateColumns:"110px 1fr 110px 180px",padding:"9px 16px",borderBottom:"1px solid #13112a",background:rowBg,alignItems:"center",transition:"background 0.1s",cursor:"default"}}
                onMouseEnter={e=>e.currentTarget.style.background=hoverBg}
                onMouseLeave={e=>e.currentTarget.style.background=rowBg}>
                <div style={{fontSize:11,color:"#4b5563",fontVariantNumeric:"tabular-nums"}}>{fmtDate(t.date)}</div>
                <div style={{fontSize:12,color:"#c7d2fe",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",paddingRight:12}}>
                  <span style={{fontSize:10,color:"#374151",marginRight:6,display:"inline-block",background:"rgba(255,255,255,0.04)",borderRadius:4,padding:"1px 5px"}}>{t.account==="Main Account"?"Main":t.account.replace("Credit Card","CC")}</span>
                  {t.narrative}
                </div>
                <div style={{fontSize:12,fontWeight:600,color:amtColor,textAlign:"right",fontVariantNumeric:"tabular-nums"}}>
                  {t.isIncome?"+":""}{`£${t.amount.toLocaleString(undefined,{maximumFractionDigits:2})}`}
                </div>
                <div style={{paddingLeft:16}}>
                  <select value={t.category||""} onChange={e=>changeCategory(t,e.target.value)}
                    style={{padding:"4px 10px",borderRadius:20,border:`1.5px solid ${catColors[t.category]||"#6366f1"}`,background:pillBg,color:catColors[t.category]||"#a5b4fc",fontSize:11,fontWeight:700,cursor:"pointer",outline:"none",width:"100%",maxWidth:160}}>
                    {categories.map(c=><option key={c} value={c} style={{background:"#0f0e1a",color:"#e0e7ff"}}>{c}</option>)}
                  </select>
                </div>
              </div>
            );
          })}
          {filtered.length===0&&(
            <div style={{padding:"56px 24px",textAlign:"center"}}>
              <div style={{fontSize:32,marginBottom:12,opacity:0.3}}>🔍</div>
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
        <div style={{fontSize:22,fontWeight:800,color:"#fff",marginBottom:12,letterSpacing:"-0.02em"}}>Rotate your phone</div>
        <div style={{fontSize:14,color:"#52525b",lineHeight:1.6,marginBottom:32}}>The cash flow table needs a bit more space. Turn your phone to landscape mode to see all 12 weeks at once.</div>
        <div style={{display:"flex",alignItems:"center",gap:8,justifyContent:"center"}}>
          <div style={{width:6,height:6,borderRadius:"50%",background:"#6366f1",animation:"pulse 1.5s ease-in-out infinite"}}/>
          <span style={{fontSize:12,color:"#374151"}}>Waiting for rotation...</span>
        </div>
      </div>
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
function MainScreen({transactions: initialTransactions, categories, onStartOver, onFeedback}) {
  const [transactions, setTransactions] = useState(initialTransactions);
  const [activeTab, setActiveTab] = useState("cashflow");
  const [showReviewPrompt, setShowReviewPrompt] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState(()=>localStorage.getItem("anthropic_api_key")||"");
  const [apiKeySaved, setApiKeySaved] = useState(false);
  const isMobile = useIsMobile();
  function goToReview(){setActiveTab("review");setShowReviewPrompt(false);}
  function saveApiKey(){
    const k=apiKeyInput.trim();
    if(k){localStorage.setItem("anthropic_api_key",k);}else{localStorage.removeItem("anthropic_api_key");}
    setApiKeySaved(true);setTimeout(()=>setApiKeySaved(false),2000);
  }
  const hasKey=!!localStorage.getItem("anthropic_api_key");
  return(
    <div style={{display:"flex",flexDirection:"column",height:"100vh",fontFamily:"'Inter',system-ui,sans-serif"}}>
      <style>{GLOBAL_CSS}</style>

      {/* Settings modal */}
      {showSettings&&(
        <>
          <div style={{position:"fixed",inset:0,zIndex:9000,background:"rgba(8,7,15,0.7)",backdropFilter:"blur(4px)"}} onClick={()=>setShowSettings(false)}/>
          <div style={{position:"fixed",top:"50%",left:"50%",transform:"translate(-50%,-50%)",zIndex:9001,background:"#13112a",border:"1px solid #2d2a6e",borderRadius:16,padding:"28px 28px 24px",width:420,maxWidth:"90vw",boxShadow:"0 24px 80px rgba(0,0,0,0.6)",animation:"tooltipIn 0.2s ease both"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
              <div style={{fontSize:16,fontWeight:800,color:"#fff"}}>Settings</div>
              <button onClick={()=>setShowSettings(false)} style={{fontSize:20,color:"#4b5563",background:"none",border:"none",cursor:"pointer",lineHeight:1}}>×</button>
            </div>
            <div style={{marginBottom:6,fontSize:11,fontWeight:700,color:"#6366f1",letterSpacing:"0.08em",textTransform:"uppercase"}}>Anthropic API Key</div>
            <div style={{fontSize:12,color:"#6b7280",marginBottom:12,lineHeight:1.6}}>
              Used for AI-powered transaction categorisation. Get yours at{" "}
              <span style={{color:"#818cf8"}}>console.anthropic.com</span>.
              {hasKey&&<span style={{marginLeft:6,color:"#10b981",fontWeight:600}}>✓ Key saved</span>}
            </div>
            <div style={{display:"flex",gap:8,marginBottom:8}}>
              <input
                type="password"
                placeholder="sk-ant-api03-..."
                value={apiKeyInput}
                onChange={e=>setApiKeyInput(e.target.value)}
                onKeyDown={e=>{if(e.key==="Enter")saveApiKey();}}
                style={{flex:1,padding:"9px 12px",background:"#0a0919",border:"1px solid #2d2a6e",borderRadius:8,color:"#e0e7ff",fontSize:13,outline:"none",fontFamily:"monospace"}}
              />
              <button onClick={saveApiKey} style={{padding:"9px 16px",background:"linear-gradient(135deg,#6366f1,#4f46e5)",color:"#fff",border:"none",borderRadius:8,fontSize:13,fontWeight:700,cursor:"pointer",whiteSpace:"nowrap"}}>
                {apiKeySaved?"Saved ✓":"Save"}
              </button>
            </div>
            {apiKeyInput&&<button onClick={()=>{setApiKeyInput("");localStorage.removeItem("anthropic_api_key");}} style={{fontSize:11,color:"#4b5563",background:"none",border:"none",cursor:"pointer",padding:0}}>Remove key</button>}
            <div style={{marginTop:20,padding:"12px 14px",background:"rgba(16,185,129,0.05)",border:"1px solid rgba(16,185,129,0.15)",borderRadius:8}}>
              <div style={{fontSize:11,color:"#6ee7b7",fontWeight:600,marginBottom:4}}>Your key never leaves your device</div>
              <div style={{fontSize:11,color:"#374151",lineHeight:1.5}}>Stored only in your browser's localStorage. Sent directly to Anthropic — never to any server.</div>
            </div>
          </div>
        </>
      )}

      <div style={{background:"#09081a",borderBottom:"1px solid #1f1d35",padding:"0 24px",display:"flex",alignItems:"center",height:57,flexShrink:0}}>
        <img src={logo} alt="Abound" style={{height:36,marginRight:24}}/>
        <button onClick={()=>setActiveTab("cashflow")} style={{padding:"0 18px",height:"100%",border:"none",borderBottom:activeTab==="cashflow"?`2px solid ${PURPLE}`:"2px solid transparent",background:"none",fontSize:13,fontWeight:activeTab==="cashflow"?700:500,color:activeTab==="cashflow"?"#a5b4fc":"#52525b",cursor:"pointer",transition:"all 0.2s",display:"flex",alignItems:"center",gap:5}}>
          <svg width="13" height="13" viewBox="0 0 20 20" fill="none"><path stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" d="M3 15l4-6 4 3 4-8"/></svg>Cash Flow
        </button>
        <button onClick={goToReview} style={{padding:"0 18px",height:"100%",border:"none",borderBottom:activeTab==="review"?`2px solid ${PURPLE}`:"2px solid transparent",background:"none",fontSize:13,fontWeight:activeTab==="review"?700:500,color:activeTab==="review"?"#a5b4fc":"#52525b",cursor:"pointer",transition:"all 0.2s",display:"flex",alignItems:"center",gap:6}}>
          <svg width="13" height="13" viewBox="0 0 20 20" fill="none"><circle cx="9" cy="9" r="5" stroke="currentColor" strokeWidth="1.8"/><path d="M14 14l3 3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>Review Transactions
          {showReviewPrompt&&<span style={{background:"#ef4444",color:"#fff",borderRadius:10,fontSize:10,fontWeight:700,padding:"1px 6px",lineHeight:1.4}}>!</span>}
        </button>
        <button onClick={onFeedback} style={{marginLeft:"auto",padding:isMobile?"8px 10px":"6px 16px",height:36,background:"linear-gradient(135deg,#6366f1,#4f46e5)",color:"#fff",border:"none",borderRadius:8,fontSize:isMobile?11:13,fontWeight:700,cursor:"pointer",boxShadow:"0 2px 8px rgba(99,102,241,0.35)",display:"flex",alignItems:"center",gap:4,flexShrink:0}}>
          {isMobile?"⭐":"⭐ Leave a review"}
        </button>
        <button onClick={()=>setShowSettings(true)} title="Settings" style={{marginLeft:8,width:32,height:32,borderRadius:7,border:`1px solid ${hasKey?"#10b981":"#1f1d35"}`,background:hasKey?"rgba(16,185,129,0.08)":"none",color:hasKey?"#10b981":"#374151",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
          <svg width="14" height="14" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="2.5" stroke="currentColor" strokeWidth="1.5"/><path d="M10 2v2M10 16v2M2 10h2M16 10h2M4.1 4.1l1.4 1.4M14.5 14.5l1.4 1.4M4.1 15.9l1.4-1.4M14.5 5.5l1.4-1.4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
        </button>
        {!isMobile&&<button onClick={onStartOver} style={{marginLeft:6,fontSize:12,color:"#374151",border:"none",background:"none",cursor:"pointer",opacity:0.5}}>← Start over</button>}
      </div>
      {activeTab==="cashflow"&&showReviewPrompt&&!isMobile&&(
        <div style={{background:"linear-gradient(135deg,rgba(99,102,241,0.18),rgba(139,92,246,0.14))",borderBottom:"1px solid rgba(99,102,241,0.25)",padding:"10px 24px",display:"flex",alignItems:"center",gap:16,flexShrink:0}}>
          <svg width="18" height="18" viewBox="0 0 20 20" fill="none" flexShrink="0"><circle cx="9" cy="9" r="5" stroke="#a5b4fc" strokeWidth="1.8"/><path d="M14 14l3 3" stroke="#a5b4fc" strokeWidth="1.8" strokeLinecap="round"/></svg>
          <div style={{flex:1}}>
            <div style={{fontWeight:700,color:"#e0e7ff",fontSize:13}}>Double-check your categories</div>
            <div style={{color:"#818cf8",fontSize:12}}>A quick review makes your forecast dramatically more accurate.</div>
          </div>
          <button onClick={goToReview} style={{padding:"7px 16px",background:"rgba(99,102,241,0.25)",color:"#a5b4fc",border:"1px solid rgba(99,102,241,0.4)",borderRadius:8,fontSize:13,fontWeight:700,cursor:"pointer",flexShrink:0}}>Review now →</button>
          <button onClick={()=>setShowReviewPrompt(false)} style={{fontSize:18,color:"#4b5563",background:"none",border:"none",cursor:"pointer",flexShrink:0}}>×</button>
        </div>
      )}
      {activeTab==="cashflow"&&<OrientationGate><CashFlowScreen transactions={transactions} categories={categories} onGoToReview={goToReview} onUpdateTxns={setTransactions}/></OrientationGate>}
      {activeTab==="review"&&<ReviewScreen transactions={transactions} categories={categories} onUpdate={setTransactions} onGoToCashFlow={()=>setActiveTab("cashflow")}/>}
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
        const rows = document.querySelectorAll("tbody tr.abound-row");
        let matchCount=0;
        for(const row of rows){
          const tds = [...row.querySelectorAll("td")];
          let candidate=null;
          for(let idx=9;idx<=14;idx++){
            const td=tds[idx];
            if(!td) continue;
            const txt=td.textContent?.trim();
            if(txt && txt!=="-" && /^\d/.test(txt)){candidate=td;break;}
          }
          if(candidate){
            matchCount++;
            if(matchCount===4){el=candidate;break;} // skip 3, use 4th
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

// ─── Cash Flow Screen ─────────────────────────────────────────────────────────
function CashFlowScreen({transactions, categories, onGoToReview, onUpdateTxns}) {
  const isMobile = useIsMobile();
  const [hiddenCats, setHiddenCats] = useState(new Set());
  const [collapsedAccounts, setCollapsedAccounts] = useState(new Set());
  const [budgets, setBudgets] = useState({});
  const [editingBudget, setEditingBudget] = useState(null);
  const [aiOpen, setAiOpen] = useState(false);
  const [aiTyping, setAiTyping] = useState(true);
  const [aiExpanded, setAiExpanded] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  function toggleFullscreen(){
    const isIOS=/iphone|ipad|ipod/i.test(navigator.userAgent);
    if(isIOS){
      // iOS doesn't support Fullscreen API — scroll to hide browser chrome
      if(!isFullscreen){
        window.scrollTo(0,1);
        try{screen.orientation?.lock("landscape");}catch(e){}
        setIsFullscreen(true);
      } else {
        window.scrollTo(0,0);
        setIsFullscreen(false);
      }
      return;
    }
    if(!document.fullscreenElement){
      document.documentElement.requestFullscreen?.().then(()=>setIsFullscreen(true)).catch(()=>{});
    } else {
      document.exitFullscreen?.().then(()=>setIsFullscreen(false)).catch(()=>{});
    }
  }
  useEffect(()=>{
    const handler=()=>setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange",handler);
    return()=>document.removeEventListener("fullscreenchange",handler);
  },[]);
 const [tourStep, setTourStep] = useState(null);
  const [tourVisible, setTourVisible] = useState(false);
  const [tooltip, setTooltip] = useState(null);
  const tooltipTimer = useRef(null);
  function showTooltip(text, x, y) {
    if(tooltipTimer.current) clearTimeout(tooltipTimer.current);
    setTooltip({text, x, y});
    tooltipTimer.current = setTimeout(()=>setTooltip(null), 3000);
  }
  const [events, setEvents] = useState([]);
  const [editingEvent, setEditingEvent] = useState(null);
  const [ctxMenu, setCtxMenu] = useState(null);
  const [excludedWeeks, setExcludedWeeks] = useState({}); // {[cat]: Set<weekKey>}
  const [outlierPromptDone, setOutlierPromptDone] = useState(false);
  const [isDark, setIsDark] = useState(true);
  const [showThemeTip, setShowThemeTip] = useState(()=>!localStorage.getItem("themeTipSeen"));
  useEffect(()=>{
    if(!showThemeTip)return;
    const t=setTimeout(()=>{setShowThemeTip(false);localStorage.setItem("themeTipSeen","1");},4000);
    return()=>clearTimeout(t);
  },[showThemeTip]);
  const T = isDark ? {
    bg:"#08070f",card:"#0d0c1e",border:"#1f1d35",border2:"#2d2a6e",
    tableBg:"#0a0919",theadA:"#1e1b4b",theadB:"#0f0c2e",theadC:"#080712",theadD:"#060611",
    text:"#fff",dimText:"#9ca3af",sidebar:"#09081a",summaryRow:"rgba(255,255,255,0.015)",
    cashBalRow:"#111827",forecastArea:"#1e1b5e",forecastCell:"rgba(99,102,241,0.06)",
    borderLeft4:"2px solid #374151",totBg:"#111827",
  } : {
    bg:"#f0f4f8",card:"#ffffff",border:"#e2e8f0",border2:"#c7d2fe",
    tableBg:"#ffffff",theadA:"#ede9fe",theadB:"#f5f3ff",theadC:"#f8f7ff",theadD:"#f1f5f9",
    text:"#1e1b4b",dimText:"#6b7280",sidebar:"#f8fafc",summaryRow:"rgba(0,0,0,0.018)",
    cashBalRow:"#f0f4f8",forecastArea:"#ede9fe",forecastCell:"rgba(99,102,241,0.04)",
    borderLeft4:"2px solid #c7d2fe",totBg:"#f5f3ff",
  };

  useEffect(()=>{
    if(cashFlowTourShown) return;
    cashFlowTourShown = true;
    const t=setTimeout(()=>{setTourStep(0);setTourVisible(true);},1500);
    return()=>clearTimeout(t);
  },[]);
  useEffect(()=>{if(!aiOpen)return;setAiTyping(true);const t=setTimeout(()=>setAiTyping(false),1100);return()=>clearTimeout(t);},[aiOpen]);

  const ROW_TOOLTIPS = {
    "Opening Balance":"Your account balance at the start of each week, walked forward and backward from your actual balance data.",
    "Salary":"Money in — wages, BACS credits, and transfers into your main account.",
    "Food":"Groceries, restaurants, cafes, takeaways, and food delivery.",
    "Travel":"TfL, trains, flights, Uber, Bolt, parking — anything transport.",
    "Rent":"Rent, mortgage, and utilities like energy, broadband and water.",
    "Memberships":"Subscriptions — streaming, gym, apps, and recurring services.",
    "Other Payments":"Transactions that didn't fit a specific category.",
    "Card Repayment":"Money moved to pay your credit card. Excluded from Total Spend — it's not new spending.",
    "Total Spend":"Sum of all real spend including Card Repayments — money that left this account.",
    "Net Movement":"Income minus spend. Green = you kept money. Red = net cost week.",
    "Cash Balance":"Your predicted end-of-week cash position across all accounts. Green = positive, red = dipping negative.",
  };

  const TOUR_STEPS = [
    {title:"Welcome to your Cash Flow 👋",body:"This is your financial command centre. Every transaction you uploaded has been mapped into a weekly grid — actual history on the left, AI-powered forecast on the right.\n\nTake a 60-second tour to understand what you're looking at.",cta:"Show me around →",skip:"Skip tour",highlight:null},
    {title:"Your actual spending",body:"These white columns show your real transactions, grouped by week and category. Everything you actually spent is captured here — nothing estimated.\n\nClick any number cell to instantly move that week's transactions to a different category.",cta:"Next →",highlight:"actual"},
    {title:"Your 6-week forecast",body:"These purple columns predict what's coming based on your real patterns. Monthly bills land on their usual date. Daily spend like food uses a rolling average of your last 6 weeks.",cta:"Next →",highlight:"forecast"},
    {title:"Plan a purchase",body:"Click any cell in the forecast columns to add a one-off planned expense — a new phone, a holiday, a car repair. It gets added to that week and automatically reduces your cash balance from that point forward.",cta:"Next →",highlight:null,cursorTarget:"forecast-cell"},
    {title:"Cash Balance",body:"The most important row. Your predicted cash position at the end of each week, combining all your accounts.\n\nGreen = you're in the clear. Red = you're heading negative.",cta:"Next →",highlight:"cashbalance",scrollTo:"cashbalance"},
    {title:"Set a budget",body:"Click 'set' on any spend row to enter a weekly budget. Abound turns forecast cells red when you're on track to exceed it.",cta:"Next →",highlight:"budget",scrollTo:"budget-cell"},
    {title:"Check your categories",body:"AI categorisation is good but not perfect. Two minutes in the Review tab fixing any mistakes will make your forecast dramatically more accurate.",cta:"Review categories →",skip:null,isFinal:true,highlight:null},
  ];

  const getHighlightRect = () => {
    if(!tourVisible||!currentStep?.highlight) return null;
    const el = document.querySelector(`[data-tour="${currentStep.highlight}"]`);
    if(!el) return null;
    const r = el.getBoundingClientRect();
    return {top:r.top-6, left:r.left-6, width:r.width+12, height:r.height+12};
  };
  

  function advanceTour(){
    const nextStep = tourStep===0 ? 1 : tourStep+1;
    if(tourStep>=TOUR_STEPS.length-1){setTourVisible(false);setTourStep(null);if(onGoToReview)onGoToReview();return;}
    setTourStep(nextStep);
    const target = TOUR_STEPS[nextStep]?.scrollTo;
    if(target){
      setTimeout(()=>{
        const el = target==="budget-cell"
          ? document.querySelector("tbody tr.abound-row td:last-child button, tbody tr.abound-row [data-budget-cell]")
          : document.querySelector(`[data-tour="${target}"]`);
        el?.scrollIntoView({behavior:"smooth", block:"center"});
      }, 200);
    }
  }
  function closeTour(){setTourVisible(false);setTourStep(null);}
  function reopenTour(){setTourStep(0);setTourVisible(true);}

  const accounts = useMemo(()=>{const seen=new Set(),list=[];transactions.forEach(t=>{if(!seen.has(t.account)){seen.add(t.account);list.push(t.account);}});list.sort((a,b)=>a==="Main Account"?-1:b==="Main Account"?1:0);return list;},[transactions]);
  const mostRecentDate = useMemo(()=>transactions.reduce((max,t)=>t.date>max?t.date:max,new Date(0)),[transactions]);
  const actualWeeks = useMemo(()=>{const lastMonday=getWeekMonday(mostRecentDate);return Array.from({length:6},(_,i)=>{const mon=new Date(lastMonday);mon.setDate(mon.getDate()-(5-i)*7);return{key:mon.toISOString().slice(0,10),date:mon,sunday:getWeekSunday(mon)};});},[mostRecentDate]);
  const forecastWeeks = useMemo(()=>{if(!actualWeeks.length)return[];const last=actualWeeks[actualWeeks.length-1].date;return Array.from({length:6},(_,i)=>{const mon=new Date(last);mon.setDate(mon.getDate()+(i+1)*7);return{key:mon.toISOString().slice(0,10),date:mon,sunday:getWeekSunday(mon)};});},[actualWeeks]);
  const weeklyByAccountCat = useMemo(()=>{const weekly={};transactions.forEach(t=>{const key=getWeekMonday(t.date).toISOString().slice(0,10);if(!weekly[key])weekly[key]={};if(!weekly[key][t.account])weekly[key][t.account]={};const amt=t.category==="Salary"?t.amount:-t.amount;weekly[key][t.account][t.category]=(weekly[key][t.account][t.category]||0)+amt;});return weekly;},[transactions]);
  const weekBalances = useMemo(()=>{const bal={};[...transactions].sort((a,b)=>a.date-b.date).forEach(t=>{if(t.balance===null)return;const key=getWeekMonday(t.date).toISOString().slice(0,10);if(!bal[key])bal[key]={};bal[key][t.account]=t.balance;});return bal;},[transactions]);

function getLastWorkingDay(year, month) {
    const d = new Date(year, month + 1, 0); // last calendar day
    while (d.getDay() === 0 || d.getDay() === 6) d.setDate(d.getDate() - 1);
    return d.getDate();
  }
  
  const detectedOutliers = useMemo(()=>{
    const ROLLING_DETECT=["Food","Travel","Other Payments",...categories.filter(c=>!DEFAULT_CATEGORIES.includes(c)&&c!=="Salary"&&c!=="Card Repayment")];
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
    const MONTHLY_CATS=["Salary"];
    const EXACT_CATS=["Rent","Memberships","Card Repayment"];
    const ROLLING_CATS=["Food","Travel","Other Payments"];
    const forecastCats=[...new Set([...categories, INTERCOMPANY_CATEGORY])];
    accounts.forEach(acc=>{
      out[acc]={};
      forecastCats.forEach(cat=>{
        const excl=excludedWeeks[cat]||new Set();
        const actualVals=actualWeeks.map(w=>excl.has(w.key)?0:Math.abs(weeklyByAccountCat[w.key]?.[acc]?.[cat]||0));
        const avg=rollingAvg(actualVals);
        if(EXACT_CATS.includes(cat)){
          // Project each unique recurring transaction to the same day-of-month in future weeks
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
          if(avg===0){out[acc][cat]=Array(forecastWeeks.length).fill(0);}
          else{
            out[acc][cat]=forecastWeeks.map(w=>{
              // Check every day in the week — does it contain the last working day of its month?
              const d=new Date(w.date);
              while(d<=w.sunday){
                const lwd=getLastWorkingDay(d.getFullYear(),d.getMonth());
                if(d.getDate()===lwd) return avg;
                d.setDate(d.getDate()+1);
              }
              return 0;
            });
          }
        } else if(ROLLING_CATS.includes(cat)){
          const last6=actualVals.slice(-6);
          const forecastVal=last6.reduce((a,b)=>a+b,0)/6;
          out[acc][cat]=Array(forecastWeeks.length).fill(forecastVal);
        } else {
          // Custom categories: mean of last 6 actual weeks (blanks count as 0)
          const last6=actualVals.slice(-6);
          const forecastVal=last6.reduce((a,b)=>a+b,0)/Math.max(last6.length,1);
          out[acc][cat]=Array(forecastWeeks.length).fill(forecastVal);
        }
      });
    });
    return out;
  },[accounts,categories,actualWeeks,forecastWeeks,weeklyByAccountCat,transactions,excludedWeeks]);

  const spendCats=categories.filter(c=>c!=="Salary"&&c!=="Card Repayment");
  const totalActualByWeek=actualWeeks.map(w=>accounts.reduce((s,acc)=>spendCats.reduce((s2,c)=>s2+Math.abs(weeklyByAccountCat[w.key]?.[acc]?.[c]||0),s),0));
  const totalForecastByWeek=forecastWeeks.map((_,i)=>accounts.reduce((s,acc)=>spendCats.reduce((s2,c)=>s2+(forecastData[acc]?.[c]?.[i]||0),s),0));

  const combinedClosingBalances = useMemo(()=>{
    const mainAcc="Main Account";
    const mainSpendCats=[...new Set([...categories.filter(c=>c!=="Salary"), INTERCOMPANY_CATEGORY])];
    const ccSpendCats=categories.filter(c=>c!=="Salary"&&c!=="Card Repayment");
    const ccAccounts=accounts.filter(a=>a!==mainAcc);
    const mainActuals=actualWeeks.map(w=>mainSpendCats.reduce((s,c)=>s+Math.abs(weeklyByAccountCat[w.key]?.[mainAcc]?.[c]||0),0));
    const mainIncome=actualWeeks.map(w=>Math.abs(weeklyByAccountCat[w.key]?.[mainAcc]?.["Salary"]||0));
    const mainNet=actualWeeks.map((_,i)=>mainIncome[i]-mainActuals[i]);
    const ccActuals=actualWeeks.map(w=>ccAccounts.reduce((s,acc)=>ccSpendCats.reduce((s2,c)=>s2+Math.abs(weeklyByAccountCat[w.key]?.[acc]?.[c]||0),s),0));
    const knownBals=actualWeeks.map(w=>weekBalances[w.key]?.[mainAcc]??null);
    const runningBals=Array(actualWeeks.length).fill(null);
    knownBals.forEach((b,i)=>{if(b!==null)runningBals[i]=b;});
    for(let i=0;i<actualWeeks.length-1;i++){
      if(runningBals[i]!==null&&runningBals[i+1]===null)
        runningBals[i+1]=runningBals[i]+mainNet[i];
    }
    for(let i=actualWeeks.length-1;i>0;i--){
      if(runningBals[i]!==null&&runningBals[i-1]===null)
        runningBals[i-1]=runningBals[i]-mainNet[i-1];
    }
    const actualClosing=runningBals.map((ob,i)=>ob!==null?ob+mainNet[i]-ccActuals[i]:null);
    const lastActualBal=runningBals.filter(b=>b!==null).slice(-1)[0]??null;
    const mainFActuals=forecastWeeks.map((_,i)=>mainSpendCats.reduce((s,c)=>s+(forecastData[mainAcc]?.[c]?.[i]||0),0));
    const mainFIncome=forecastWeeks.map((_,i)=>forecastData[mainAcc]?.["Salary"]?.[i]||0);
    const mainFNet=forecastWeeks.map((w,i)=>{
      const eventSpend=events.filter(ev=>ev.weekKey===w.key).reduce((s,ev)=>s+ev.amount,0);
      return mainFIncome[i]-mainFActuals[i]-eventSpend;
    });
    const ccFActuals=forecastWeeks.map((_,i)=>ccAccounts.reduce((s,acc)=>ccSpendCats.reduce((s2,c)=>s2+(forecastData[acc]?.[c]?.[i]||0),s),0));
    const forecastBals=Array(forecastWeeks.length).fill(null);
    if(lastActualBal!==null){forecastBals[0]=lastActualBal+mainNet[actualWeeks.length-1];for(let i=1;i<forecastWeeks.length;i++)forecastBals[i]=forecastBals[i-1]+mainFNet[i-1];}
    const forecastClosing=forecastBals.map((ob,i)=>ob!==null?ob+mainFNet[i]-ccFActuals[i]:null);
    return{actual:actualClosing,forecast:forecastClosing};
  },[accounts,categories,actualWeeks,forecastWeeks,weeklyByAccountCat,weekBalances,forecastData,events]);

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
    const top=Object.entries(totals).filter(([c])=>c!=="Salary"&&c!=="Card Repayment").sort((a,b)=>b[1]-a[1])[0];
    if(top){
      const weeklyAvg=Math.round(totals[top[0]]/Math.max(actualWeeks.length,1));
      tips.push({icon:"chart",color:PURPLE,title:`Top spend: ${top[0]}`,body:`£${weeklyAvg.toLocaleString()}/wk avg · £${Math.round(top[1]).toLocaleString()} total.`,detail:`${top[0]} is your biggest spending category at £${Math.round(top[1]).toLocaleString()} over ${actualWeeks.length} weeks — £${weeklyAvg.toLocaleString()} per week on average. Your forecast adds another £${Math.round((forecastData[accounts[0]]?.[top[0]]||[]).reduce((a,b)=>a+b,0)).toLocaleString()} over the next 6 weeks.`,trend:null});
    }

    // 3. Spending spikes
    categories.forEach(cat=>{
      if(cat==="Salary"||cat==="Card Repayment")return;
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

const tdAmt=(color,isForecast,bold,forecastIdx,isOverBudget)=>({padding:"5px 10px",textAlign:"right",fontSize:12,fontWeight:bold?700:400,color:isOverBudget?"#ef4444":color||"#9ca3af",opacity:isForecast&&forecastIdx!=null?1-forecastIdx*0.07:1,background:isOverBudget?"rgba(239,68,68,0.08)":isForecast?"rgba(99,102,241,0.04)":"transparent",borderRight:isForecast?"1px dashed #2d2a6e":"1px solid #1a1830",whiteSpace:"nowrap",fontVariantNumeric:"tabular-nums"});
  const tdTot=(isForecast)=>({padding:"7px 10px",textAlign:"right",fontSize:12,fontWeight:800,color:isForecast?"#818cf8":"#c7d2fe",background:isForecast?"rgba(99,102,241,0.12)":"rgba(255,255,255,0.04)",borderLeft:"2px solid #2d2a6e",borderRight:"2px solid #2d2a6e",whiteSpace:"nowrap",fontVariantNumeric:"tabular-nums"});

  function LabelCell({label,account}){
    const tip=ROW_TOOLTIPS[label];
    return(
      <td style={{padding:"5px 12px",fontSize:12,fontWeight:600,whiteSpace:"nowrap",position:"relative",cursor:tip?"help":"default",color:"#9ca3af"}}
        onMouseEnter={e=>{if(tip){const r=e.currentTarget.getBoundingClientRect();setTooltip({text:tip,x:r.left,y:r.bottom+6});}}}
        onMouseLeave={()=>setTooltip(null)}>
        {label}
        {tip&&<span style={{marginLeft:4,fontSize:9,color:"#374151",verticalAlign:"super"}}>?</span>}
      </td>
    );
  }

  function CatRow({cat,account}){
    const isIncome=cat==="Salary";
    const isRepayment=cat==="Card Repayment";
    const key=`${account}::${cat}`;
    const hidden=hiddenCats.has(key);
    const actuals=actualWeeks.map(w=>Math.abs(weeklyByAccountCat[w.key]?.[account]?.[cat]||0));
    const forecasts=forecastData[account]?.[cat]||Array(6).fill(0);
    const totalAct=actuals.reduce((a,b)=>a+b,0);
    const totalFcst=forecasts.reduce((a,b)=>a+b,0);
    const budget=budgets[key];
    const rowColor=isIncome?"rgba(16,185,129,0.04)":isRepayment?"rgba(124,58,237,0.05)":"transparent";
    const textColor=isIncome?"#34d399":isRepayment?"#a78bfa":"#c7d2fe";
    return(
      <tr className="abound-row" style={{opacity:hidden?0.25:1,borderBottom:"1px solid #13112a",background:rowColor,cursor:"default"}}>
        <td style={{padding:"5px 6px 5px 12px",fontSize:10,color:"#374151",whiteSpace:"nowrap"}}>{account==="Main Account"?"Main":account.replace("Credit Card","CC")}</td>
        <td style={{padding:"5px 12px",fontSize:12,fontWeight:600,whiteSpace:"nowrap",color:textColor,cursor:"help",position:"relative"}}
          onMouseEnter={e=>{const tip=ROW_TOOLTIPS[cat];if(tip){const r=e.currentTarget.getBoundingClientRect();setTooltip({text:tip,x:r.left,y:r.bottom+6});}}}
          onMouseLeave={()=>setTooltip(null)}>
          {isIncome&&<span style={{fontSize:9,marginRight:4}}>▲</span>}
          {isRepayment&&<span style={{fontSize:9,marginRight:4}}>↔</span>}
          {cat}
          <span style={{marginLeft:4,fontSize:9,color:"#c4c4cc",verticalAlign:"super"}}>?</span>
        </td>
        {actuals.map((v,i)=>(
          <td key={i}
            style={{...tdAmt(v===0?"#2d2a6e":isIncome?"#10b981":isRepayment?"#a78bfa":"#9ca3af",false),cursor:v>0?"pointer":"default",userSelect:"none"}}
            onClick={v>0?e=>{e.preventDefault();setCtxMenu({x:e.clientX,y:e.clientY,account,cat,weekKey:actualWeeks[i].key});}:undefined}
            onContextMenu={v>0?e=>{e.preventDefault();setCtxMenu({x:e.clientX,y:e.clientY,account,cat,weekKey:actualWeeks[i].key});}:undefined}>
            {v>0?<span style={{borderBottom:"1px dashed #2d2a6e"}}>{fmtMoney(v)}</span>:fmtMoney(v)}
          </td>
        ))}
        <td style={tdTot(false)}>{fmtMoney(totalAct)}</td>
        {forecasts.map((v,i)=>{
          const over=budget&&v>0&&v>budget;
          const wk=forecastWeeks[i];
          const isEditing=editingEvent?.weekKey===wk?.key&&editingEvent?.cat===cat&&editingEvent?.account===account;
          return(
            <td key={i} style={{...tdAmt(over?"#ef4444":v===0?"#d1d5db":isRepayment?"#7c3aed":PURPLE,true,false,i,over),outline:isEditing?"2px solid #6366f1":"none",outlineOffset:"-2px",cursor:"pointer"}}
              onClick={e=>{if(!isEditing){const r=e.currentTarget.getBoundingClientRect();setEditingEvent({weekKey:wk?.key,cat,account,label:"",amount:"",x:Math.min(r.left,window.innerWidth-220),y:r.bottom+4});}}}>
              {fmtMoney(v)}{over&&<span style={{fontSize:8}}>↑</span>}
            </td>
          );
        })}
        <td style={tdTot(true)}>{fmtMoney(totalFcst)}</td>
        <td style={{padding:"3px 6px",minWidth:96}}>
          {isIncome ? null : editingBudget===key
            ?<input autoFocus type="number" defaultValue={budget||""} placeholder="£/wk" onBlur={e=>{const v=+e.target.value;setBudgets(b=>({...b,[key]:v>0?v:undefined}));setEditingBudget(null);}}
               onKeyDown={e=>{if(e.key==="Enter"){const v=+e.target.value;setBudgets(b=>({...b,[key]:v>0?v:undefined}));setEditingBudget(null);}if(e.key==="Escape")setEditingBudget(null);}}
               style={{width:"100%",fontSize:12,border:`1px solid ${PURPLE}`,borderRadius:5,padding:"3px 6px",outline:"none",background:"#0f0e1a",color:"#e0e7ff"}}/>
            : budget ? (()=>{
                const avgAct=totalAct/Math.max(actualWeeks.length,1);
                const pct=Math.min((avgAct/budget)*100,120);
                const over=avgAct>budget;
                const diff=Math.abs(avgAct-budget);
                return(
                  <div onClick={()=>setEditingBudget(key)} style={{cursor:"pointer",padding:"2px 4px"}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",marginBottom:3}}>
                      <span style={{fontSize:10,fontWeight:700,color:over?"#ef4444":"#10b981"}}>{over?"▲":"▼"} £{Math.round(avgAct)}/wk</span>
                      <span style={{fontSize:9,color:"#6366f1",opacity:0.8}}>£{budget}</span>
                    </div>
                    <div style={{height:3,background:"rgba(255,255,255,0.07)",borderRadius:99,overflow:"hidden"}}>
                      <div style={{height:"100%",width:`${Math.min(pct,100)}%`,background:over?"#ef4444":"#10b981",borderRadius:99,transition:"width 0.3s"}}/>
                    </div>
                    <div style={{fontSize:9,color:over?"#ef4444":"#6b7280",marginTop:2,textAlign:"right"}}>
                      {over?`£${Math.round(diff)}/wk over`:`£${Math.round(diff)}/wk left`}
                    </div>
                  </div>
                );
              })()
            :<button data-budget-cell onClick={()=>setEditingBudget(key)} style={{width:"100%",padding:"4px 0",fontSize:10,color:"#4b5563",border:"1px dashed #2d2a6e",borderRadius:5,background:"none",cursor:"pointer",letterSpacing:"0.04em"}}>+ set budget</button>
          }
        </td>
        <td style={{padding:"3px 6px",textAlign:"center"}}>
          <button onClick={()=>setHiddenCats(s=>{const n=new Set(s);n.has(key)?n.delete(key):n.add(key);return n;})} style={{fontSize:9,padding:"1px 6px",borderRadius:4,border:`1px solid ${hidden?"#374151":"#1f1d35"}`,background:hidden?"rgba(239,68,68,0.1)":"rgba(255,255,255,0.03)",color:hidden?"#ef4444":"#374151",cursor:"pointer"}}>
            {hidden?"show":"hide"}
          </button>
        </td>
      </tr>
    );
  }

  function AccountSection({account}){
    const isMainAcc=account==="Main Account";
    const incomeCats=isMainAcc?categories.filter(c=>c==="Salary"):[];
    // Always include Card Repayment in spend, even if not in categories (single account case)
    const spendCatsLocal=[...new Set([...categories.filter(c=>c!=="Salary"), INTERCOMPANY_CATEGORY])];
    const accActuals=actualWeeks.map(w=>spendCatsLocal.reduce((s,c)=>s+Math.abs(weeklyByAccountCat[w.key]?.[account]?.[c]||0),0));
    const accForecasts=forecastWeeks.map((_,i)=>spendCatsLocal.reduce((s,c)=>s+(forecastData[account]?.[c]?.[i]||0),0));
    const accIncome=actualWeeks.map(w=>categories.filter(c=>c==="Salary").reduce((s,c)=>s+Math.abs(weeklyByAccountCat[w.key]?.[account]?.[c]||0),0));
    const accIncomeForecasts=forecastWeeks.map((_,i)=>categories.filter(c=>c==="Salary").reduce((s,c)=>s+(forecastData[account]?.[c]?.[i]||0),0));
    const weeklyNetActual=actualWeeks.map((_,i)=>accIncome[i]-accActuals[i]);
    const weeklyNetForecast=forecastWeeks.map((_,i)=>accIncomeForecasts[i]-accForecasts[i]);
   const knownBalances=actualWeeks.map(w=>weekBalances[w.key]?.[account]??null);
    const runningBalances=Array(actualWeeks.length).fill(null);
    // Pin every week that has a real balance from the statement
    knownBalances.forEach((b,i)=>{if(b!==null)runningBalances[i]=b;});
    // Walk forward between pins (or from first pin to end)
    for(let i=0;i<actualWeeks.length-1;i++){
      if(runningBalances[i]!==null&&runningBalances[i+1]===null)
        runningBalances[i+1]=runningBalances[i]+weeklyNetActual[i];
    }
    // Walk backward for any gaps before the first pin
    for(let i=actualWeeks.length-1;i>0;i--){
      if(runningBalances[i]!==null&&runningBalances[i-1]===null)
        runningBalances[i-1]=runningBalances[i]-weeklyNetActual[i-1];
    }
    const lastActualBal=runningBalances.filter(b=>b!==null).slice(-1)[0]??null;
    const forecastBalances=Array(forecastWeeks.length).fill(null);
    if(lastActualBal!==null){forecastBalances[0]=lastActualBal+weeklyNetActual[actualWeeks.length-1];for(let i=1;i<forecastWeeks.length;i++)forecastBalances[i]=forecastBalances[i-1]+weeklyNetForecast[i-1];}
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
          {actualWeeks.map((_,i)=><td key={i} style={{background:"transparent",borderRight:"1px solid #2d2a6e"}}/>)}
          <td style={{borderLeft:"2px solid #2d2a6e",borderRight:"2px solid #2d2a6e"}}/>
          {forecastWeeks.map((_,i)=><td key={i} style={{background:"rgba(99,102,241,0.15)",borderRight:"1px solid #3730a3"}}/>)}
          <td style={{background:"rgba(99,102,241,0.15)",borderLeft:"2px solid #3730a3"}}/><td colSpan={2}/>
        </tr>
        {!collapsedAccounts.has(account)&&<tr className="abound-row" style={{background:"rgba(255,255,255,0.018)",borderBottom:"1px solid #1a1830"}}>
          <td style={{padding:"5px 6px 5px 12px",fontSize:10,color:"#2d2a6e"}}/>
          <td style={{padding:"5px 12px",fontSize:11,fontWeight:700,color:"#6b7280",cursor:"help"}}
            onMouseEnter={e=>{const r=e.currentTarget.getBoundingClientRect();showTooltip(ROW_TOOLTIPS["Opening Balance"],r.left,r.bottom+6);}}
            onMouseLeave={()=>setTooltip(null)}>
            Opening Balance <span style={{fontSize:9,color:"#2d2a6e",verticalAlign:"super"}}>?</span>
          </td>
          {runningBalances.map((bal,i)=><td key={i} style={{padding:"5px 10px",textAlign:"right",fontSize:12,color:bal===null?"#2d2a6e":bal>=0?"#10b981":"#ef4444",borderRight:"1px solid #1a1830",fontVariantNumeric:"tabular-nums"}}>{bal!==null?fmtMoney(bal):"—"}</td>)}
          <td style={{borderLeft:"2px solid #2d2a6e",borderRight:"2px solid #2d2a6e"}}/>
          {forecastBalances.map((bal,i)=><td key={i} style={{padding:"5px 10px",textAlign:"right",fontSize:12,color:bal===null?"#2d2a6e":bal>=0?"#10b981":"#ef4444",background:"rgba(99,102,241,0.04)",borderRight:"1px dashed #2d2a6e",fontVariantNumeric:"tabular-nums"}}>{bal!==null?fmtMoney(bal):"—"}</td>)}
          <td style={{borderLeft:"2px solid #2d2a6e"}}/><td/><td/>
        </tr>}
        {!collapsedAccounts.has(account)&&incomeCats.map(cat=><CatRow key={cat} cat={cat} account={account}/>)}
        {!collapsedAccounts.has(account)&&spendCatsLocal.filter(c=>c!=="Card Repayment").map(cat=><CatRow key={cat} cat={cat} account={account}/>)}
        {!collapsedAccounts.has(account)&&<CatRow key="Card Repayment" cat="Card Repayment" account={account}/>}
        {events.filter(ev=>forecastWeeks.some(w=>w.key===ev.weekKey)).length>0&&(
          <tr className="abound-row" style={{background:"rgba(217,119,6,0.06)",borderBottom:"1px solid rgba(217,119,6,0.15)"}}>
            <td/><td style={{padding:"5px 12px",fontSize:11,fontWeight:700,color:"#d97706"}}>Planned expenses</td>
            {actualWeeks.map((_,i)=><td key={i} style={tdAmt("#d1d5db",false)}>—</td>)}
            <td style={tdTot(false)}>—</td>
            {forecastWeeks.map((w,i)=>{
              const wkEvents=events.filter(ev=>ev.weekKey===w.key);
              const total=wkEvents.reduce((s,ev)=>s+ev.amount,0);
              return(
                <td key={i} style={{...tdAmt(total>0?"#d97706":"#d1d5db",true),position:"relative"}}>
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
            <td/><td/>
          </tr>
        )}
        <tr className="abound-row" data-tour="totalspend" style={{background:"rgba(255,255,255,0.03)",borderBottom:"1px solid #2d2a6e"}}>
          <td/><td style={{padding:"8px 12px",fontSize:11,fontWeight:800,color:"#9ca3af",letterSpacing:"0.04em",cursor:"help"}}
            onMouseEnter={e=>{const r=e.currentTarget.getBoundingClientRect();setTooltip({text:ROW_TOOLTIPS["Total Spend"],x:r.left,y:r.bottom+6});}}
            onMouseLeave={()=>setTooltip(null)}>TOTAL SPEND <span style={{fontSize:9,color:"#374151",verticalAlign:"super"}}>?</span></td>
          {accActuals.map((v,i)=><td key={i} style={tdAmt("#c7d2fe",false,true)}>{fmtMoney(v)}</td>)}
          <td style={tdTot(false)}>{fmtMoney(accActuals.reduce((a,b)=>a+b,0))}</td>
          {accForecasts.map((v,i)=><td key={i} style={tdAmt(PURPLE,true,true)}>{fmtMoney(v)}</td>)}
          <td style={tdTot(true)}>{fmtMoney(accForecasts.reduce((a,b)=>a+b,0))}</td>
          <td/><td/>
        </tr>
        <tr className="abound-row" style={{background:"rgba(255,255,255,0.015)",borderBottom:"2px solid #2d2a6e"}}>
          <td/><td style={{padding:"7px 12px",fontSize:11,fontWeight:800,color:"#6b7280",letterSpacing:"0.04em",cursor:"help"}}
            onMouseEnter={e=>{const r=e.currentTarget.getBoundingClientRect();setTooltip({text:ROW_TOOLTIPS["Net Movement"],x:r.left,y:r.bottom+6});}}
            onMouseLeave={()=>setTooltip(null)}>NET MOVEMENT <span style={{fontSize:9,color:"#374151",verticalAlign:"super"}}>?</span></td>
          {weeklyNetActual.map((v,i)=><td key={i} style={{padding:"5px 10px",textAlign:"right",fontSize:12,fontWeight:700,color:v>=0?"#10b981":"#ef4444",borderRight:"1px solid #1a1830",fontVariantNumeric:"tabular-nums"}}>{netFmt(v)}</td>)}
          <td style={{...tdTot(false),color:weeklyNetActual.reduce((a,b)=>a+b,0)>=0?"#10b981":"#ef4444"}}>{netFmt(weeklyNetActual.reduce((a,b)=>a+b,0))}</td>
          {weeklyNetForecast.map((v,i)=><td key={i} style={{padding:"5px 10px",textAlign:"right",fontSize:12,fontWeight:700,color:v>=0?"#10b981":"#ef4444",background:"rgba(99,102,241,0.04)",borderRight:"1px dashed #2d2a6e",fontVariantNumeric:"tabular-nums"}}>{netFmt(v)}</td>)}
          <td style={{...tdTot(true),color:weeklyNetForecast.reduce((a,b)=>a+b,0)>=0?"#10b981":"#ef4444"}}>{netFmt(weeklyNetForecast.reduce((a,b)=>a+b,0))}</td>
          <td/><td/>
        </tr>
      </>
    );
  }

  const currentStep = tourStep!==null ? TOUR_STEPS[tourStep] : null;

  return(
    <div style={{display:"flex",flex:1,overflow:"hidden",position:"relative",background:T.bg,transition:"background 0.25s"}}>
      <style>{GLOBAL_CSS}</style>

      {/* Plan-a-purchase overlay — rendered here (not inside CatRow) so typing doesn't unmount it */}
      {editingEvent&&(
        <>
          <div style={{position:"fixed",inset:0,zIndex:9994}} onClick={()=>setEditingEvent(null)}/>
          <div style={{position:"fixed",top:editingEvent.y,left:editingEvent.x,zIndex:9995,background:"#1e1b38",border:"1px solid #6366f1",borderRadius:10,padding:"10px 12px",minWidth:200,boxShadow:"0 6px 28px rgba(0,0,0,0.6)",animation:"tooltipIn 0.12s ease both"}}
            onClick={e=>e.stopPropagation()}>
            <div style={{fontSize:10,color:"#6366f1",fontWeight:700,marginBottom:7,letterSpacing:"0.06em"}}>ONE-OFF EXPENSE</div>
            <input autoFocus placeholder="What is it? (e.g. New phone)" value={editingEvent.label} onChange={e=>setEditingEvent(ev=>({...ev,label:e.target.value}))}
              onKeyDown={e=>{if(e.key==="Escape")setEditingEvent(null);}}
              style={{width:"100%",marginBottom:6,padding:"5px 8px",background:"#0f0e1a",border:"1px solid #2d2a6e",borderRadius:6,color:"#fff",fontSize:12,outline:"none"}}/>
            <div style={{display:"flex",gap:5}}>
              <input placeholder="£ amount" type="number" min="0" value={editingEvent.amount} onChange={e=>setEditingEvent(ev=>({...ev,amount:e.target.value}))}
                onKeyDown={e=>{if(e.key==="Enter"){const amt=parseFloat(editingEvent.amount);if(!isNaN(amt)&&amt>0&&editingEvent.label){setEvents(ev=>[...ev,{id:Date.now(),weekKey:editingEvent.weekKey,label:editingEvent.label,amount:amt}]);}setEditingEvent(null);}if(e.key==="Escape")setEditingEvent(null);}}
                style={{flex:1,padding:"5px 8px",background:"#0f0e1a",border:"1px solid #2d2a6e",borderRadius:6,color:"#fff",fontSize:12,outline:"none"}}/>
              <button onClick={()=>{const amt=parseFloat(editingEvent.amount);if(!isNaN(amt)&&amt>0&&editingEvent.label){setEvents(ev=>[...ev,{id:Date.now(),weekKey:editingEvent.weekKey,label:editingEvent.label,amount:amt}]);}setEditingEvent(null);}}
                style={{padding:"5px 12px",background:"#6366f1",color:"#fff",border:"none",borderRadius:6,fontSize:11,fontWeight:700,cursor:"pointer"}}>Add</button>
              <button onClick={()=>setEditingEvent(null)}
                style={{padding:"5px 9px",background:"none",color:"#6b7280",border:"1px solid #2d2a6e",borderRadius:6,fontSize:12,cursor:"pointer"}}>×</button>
            </div>
          </div>
        </>
      )}

      {/* Outlier week detection card */}
      {!outlierPromptDone&&detectedOutliers.length>0&&(
        <div style={{position:"fixed",bottom:24,right:24,zIndex:900,background:"#1a1830",border:"1px solid #4338ca",borderLeft:"4px solid #6366f1",borderRadius:14,padding:"16px 18px",maxWidth:340,boxShadow:"0 8px 40px rgba(0,0,0,0.5)",animation:"slideInUp 0.35s cubic-bezier(0.16,1,0.3,1) both"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10}}>
            <div style={{fontSize:13,fontWeight:700,color:"#fff",lineHeight:1.3}}>Looks like you've had an expensive period</div>
            <button onClick={()=>setOutlierPromptDone(true)} style={{fontSize:16,color:"#4b5563",border:"none",background:"none",cursor:"pointer",marginLeft:10,lineHeight:1,flexShrink:0}}>×</button>
          </div>
          <p style={{fontSize:12,color:"#9ca3af",marginBottom:12,lineHeight:1.5}}>These weeks look unusually high — possibly a holiday or one-off. Excluding them gives you a more accurate forecast.</p>
          <div style={{display:"flex",flexDirection:"column",gap:6,marginBottom:14}}>
            {detectedOutliers.map((o,i)=>{
              const isExcluded=excludedWeeks[o.cat]?.has(o.weekKey);
              return(
                <div key={i} style={{display:"flex",alignItems:"center",gap:8,padding:"6px 8px",background:"rgba(99,102,241,0.06)",borderRadius:7,border:`1px solid ${isExcluded?"#6366f1":"#2d2a6e"}`}}>
                  <div style={{flex:1}}>
                    <span style={{fontSize:11,fontWeight:600,color:isExcluded?"#a5b4fc":"#c7d2fe"}}>{o.cat}</span>
                    <span style={{fontSize:10,color:"#6b7280",marginLeft:6}}>{o.weekLabel}</span>
                    <div style={{fontSize:10,color:"#6b7280",marginTop:1}}>£{Math.round(o.amount).toLocaleString()} <span style={{color:"#4b5563"}}>vs typical £{Math.round(o.typicalAmt).toLocaleString()}</span></div>
                  </div>
                  <button onClick={()=>setExcludedWeeks(prev=>{const next={...prev};const s=new Set(next[o.cat]||[]);if(isExcluded){s.delete(o.weekKey);}else{s.add(o.weekKey);}next[o.cat]=s;return next;})}
                    style={{fontSize:10,fontWeight:700,padding:"3px 8px",borderRadius:5,border:`1px solid ${isExcluded?"#6366f1":"#374151"}`,background:isExcluded?"rgba(99,102,241,0.2)":"transparent",color:isExcluded?"#a5b4fc":"#6b7280",cursor:"pointer",whiteSpace:"nowrap"}}>
                    {isExcluded?"Excluded ✓":"Exclude"}
                  </button>
                </div>
              );
            })}
          </div>
          <div style={{display:"flex",gap:8}}>
            <button onClick={()=>{setExcludedWeeks(prev=>{const next={...prev};detectedOutliers.forEach(o=>{const s=new Set(next[o.cat]||[]);s.add(o.weekKey);next[o.cat]=s;});return next;});setOutlierPromptDone(true);}}
              style={{flex:1,padding:"8px 12px",background:"linear-gradient(135deg,#6366f1,#4f46e5)",color:"#fff",border:"none",borderRadius:8,fontSize:12,fontWeight:700,cursor:"pointer"}}>Exclude all</button>
            <button onClick={()=>setOutlierPromptDone(true)}
              style={{padding:"8px 12px",background:"none",color:"#6b7280",border:"1px solid #2d2a6e",borderRadius:8,fontSize:12,cursor:"pointer"}}>Keep as-is</button>
          </div>
        </div>
      )}

      {/* Right-click category menu */}
      {ctxMenu&&(
        <>
          <div style={{position:"fixed",inset:0,zIndex:9990}} onClick={()=>setCtxMenu(null)}/>
          <div style={{position:"fixed",left:ctxMenu.x,top:ctxMenu.y,zIndex:9991,background:"#1e1b38",border:"1px solid #4338ca",borderRadius:10,padding:"6px 0",boxShadow:"0 8px 32px rgba(0,0,0,0.5)",minWidth:190,animation:"tooltipIn 0.15s ease both"}}>
            <div style={{padding:"7px 14px 8px",fontSize:10,fontWeight:700,color:"#6366f1",letterSpacing:"0.08em",borderBottom:"1px solid #2d2a6e"}}>MOVE TO CATEGORY</div>
            {categories.filter(c=>c!==ctxMenu.cat).map(c=>(
              <button key={c} onClick={()=>{
                if(onUpdateTxns){
                  onUpdateTxns(transactions.map(t=>{
                    const wk=getWeekMonday(t.date).toISOString().slice(0,10);
                    return(t.account===ctxMenu.account&&t.category===ctxMenu.cat&&wk===ctxMenu.weekKey)?{...t,category:c}:t;
                  }));
                }
                setCtxMenu(null);
              }}
              style={{display:"block",width:"100%",padding:"8px 14px",background:"none",border:"none",color:"#c7d2fe",fontSize:12,cursor:"pointer",textAlign:"left"}}
              onMouseEnter={e=>e.currentTarget.style.background="rgba(99,102,241,0.12)"}
              onMouseLeave={e=>e.currentTarget.style.background="none"}>
                {c}
              </button>
            ))}
          </div>
        </>
      )}

      {/* Tooltip */}
      {tooltip&&(
        <div style={{position:"fixed",left:tooltip.x,top:tooltip.y,zIndex:9999,maxWidth:280,background:"#1e1b38",border:"1px solid #4338ca",borderRadius:8,padding:"8px 12px",fontSize:11,color:"#c7d2fe",lineHeight:1.5,pointerEvents:"none",animation:"tooltipIn 0.15s ease both",boxShadow:"0 4px 20px rgba(0,0,0,0.4)"}}>
          {tooltip.text}
        </div>
      )}

      {/* Tour spotlight overlay */}
      {tourVisible&&currentStep&&(()=>{
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
            <div style={{position:"fixed",bottom:isMobile?0:32,right:isMobile?0:28,left:isMobile?0:"auto",width:isMobile?"100%":360,background:"#1a1830",border:"1px solid #4338ca",borderLeft:isMobile?"none":"4px solid #6366f1",borderTop:isMobile?"4px solid #6366f1":"none",borderRadius:isMobile?"16px 16px 0 0":16,padding:isMobile?"18px 20px 28px":"22px 24px",zIndex:1002,pointerEvents:"all",animation:"spotlightIn 0.35s cubic-bezier(0.16,1,0.3,1) both",boxShadow:"0 -8px 40px rgba(0,0,0,0.5)"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:12}}>
                <div>
                  <div style={{fontSize:10,color:"#6366f1",fontWeight:700,letterSpacing:"0.1em",marginBottom:6,textTransform:"uppercase"}}>{tourStep===0?"✨ Welcome":`Step ${tourStep} of ${TOUR_STEPS.length-1}`}</div>
                  <div style={{fontSize:18,fontWeight:800,color:"#fff",lineHeight:1.2}}>{currentStep.title}</div>
                </div>
                <button onClick={closeTour} style={{fontSize:18,color:"#4b5563",border:"none",background:"none",cursor:"pointer",marginLeft:12,lineHeight:1,flexShrink:0,padding:4}}>×</button>
              </div>
              {currentStep.body.split('\n\n').map((para,i)=>(
                <p key={i} style={{fontSize:13,color:"#a1a1aa",lineHeight:1.7,margin:i===0?"0 0 10px":"10px 0 0"}}>{para}</p>
              ))}
              <div style={{display:"flex",gap:8,marginTop:20}}>
                <button onClick={advanceTour}
                  style={{flex:1,padding:"11px 16px",background:"linear-gradient(135deg,#6366f1,#4f46e5)",color:"#fff",border:"none",borderRadius:10,fontSize:13,fontWeight:700,cursor:"pointer",transition:"all 0.15s",boxShadow:"0 4px 16px rgba(99,102,241,0.3)"}}
                  onMouseEnter={e=>e.currentTarget.style.transform="translateY(-1px)"}
                  onMouseLeave={e=>e.currentTarget.style.transform=""}>
                  {currentStep.cta}
                </button>
                {currentStep.skip&&<button onClick={closeTour} style={{padding:"11px 14px",background:"none",color:"#4b5563",border:"1px solid #2d2a6e",borderRadius:10,fontSize:13,cursor:"pointer",whiteSpace:"nowrap"}}>{currentStep.skip}</button>}
              </div>
              {tourStep>0&&(
                <div style={{display:"flex",gap:5,justifyContent:"center",marginTop:16}}>
                  {TOUR_STEPS.slice(1).map((_,i)=>(
                    <div key={i} onClick={()=>setTourStep(i+1)} style={{width:6,height:6,borderRadius:"50%",background:i===tourStep-1?"#6366f1":"#2d2a6e",transition:"background 0.2s",cursor:"pointer"}}/>
                  ))}
                </div>
              )}
            </div>
          </div>
        );
      })()}

     {/* Main table area */}
      <div style={{flex:1,overflow:"auto",padding:"20px 24px",background:T.bg,transition:"background 0.25s"}}>
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
              valColor:"#e0e7ff",
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
          return(
            <div style={{display:"flex",gap:8,marginBottom:20,alignItems:"flex-start"}}>
              {cards.map((c,i)=>(
                <div key={i} style={{flex:1,background:T.card,borderRadius:10,padding:"12px 14px",border:`1px solid ${T.border}`,boxShadow:"0 4px 20px rgba(0,0,0,0.15)",transition:"border-color 0.15s"}}
                  onMouseEnter={e=>e.currentTarget.style.borderColor=T.border2}
                  onMouseLeave={e=>e.currentTarget.style.borderColor=T.border}>
                  <div style={{fontSize:10,fontWeight:600,color:"#6b7280",letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:6}}>{c.label}</div>
                  <div style={{fontSize:isMobile?17:21,fontWeight:700,color:c.valColor,fontVariantNumeric:"tabular-nums",letterSpacing:"-0.025em",marginBottom:2,fontFamily:"'Inter',system-ui,sans-serif"}}>{c.value}</div>
                  <div style={{fontSize:10,color:c.sub.startsWith("+")||c.sub.startsWith("−")?c.valColor:"#6b7280",fontWeight:500}}>{c.sub}</div>
                </div>
              ))}
              <div style={{position:"relative",flexShrink:0}}>
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
       <div style={{background:T.tableBg,borderRadius:10,border:`1px solid ${T.border}`,overflow:"auto",WebkitOverflowScrolling:"touch",boxShadow:"0 4px 32px rgba(0,0,0,0.2)"}}>
          <table style={{width:isMobile?"max-content":"100%",minWidth:isMobile?"900px":undefined,borderCollapse:"collapse"}}>
            <thead>
              <tr data-tour="actual" style={{background:T.theadB}}>
                <th style={{padding:"10px 12px",textAlign:"left",position:"sticky",left:0,zIndex:3,background:T.theadA,whiteSpace:"nowrap",overflow:"hidden",maxWidth:130}}>
                  <img src={logo} alt="" style={{height:20,verticalAlign:"middle",marginRight:6}}/>
                  <span style={{fontSize:12,fontWeight:800,color:T.text,verticalAlign:"middle"}}>Cash Flow</span>
                </th>
                <th style={{background:T.theadA,borderRight:`1px solid ${T.border2}`,width:0,padding:0}}/>
                {actualWeeks.map(w=><th key={w.key} style={{padding:"8px 10px",fontSize:11,fontWeight:700,color:"#c7d2fe",textAlign:"right",background:"#1e1b4b",borderRight:"1px solid #2d2a6e",whiteSpace:"nowrap"}}>{fmt(w.date)}</th>)}
                <th style={{padding:"8px 10px",fontSize:10,fontWeight:700,color:T.dimText,textAlign:"right",background:T.totBg,borderLeft:T.borderLeft4,borderRight:T.borderLeft4,whiteSpace:"nowrap"}}>AVG</th>
                {forecastWeeks.map((w,i)=>{
                  const op=Math.max(0.45,1-i*0.11);
                  const isLast=i===forecastWeeks.length-1;
                  return<th key={w.key} style={{padding:"8px 10px",fontSize:11,fontWeight:700,color:`rgba(99,102,241,${op})`,textAlign:"right",background:T.forecastArea,borderRight:isLast?"none":`1px solid ${T.border2}`,whiteSpace:"nowrap"}}>
                    {fmt(w.date)}
                  </th>;
                })}
                <th style={{padding:"8px 10px",fontSize:10,fontWeight:700,color:"rgba(99,102,241,0.5)",textAlign:"right",background:T.totBg,borderLeft:T.borderLeft4,borderRight:T.borderLeft4,whiteSpace:"nowrap"}}>FCST</th>
                <th style={{background:T.theadA}} colSpan={2}/>
              </tr>
              <tr data-tour="forecast" style={{background:T.theadD,borderBottom:`1px solid ${T.border2}`}}>
                <th style={{padding:"3px 12px",position:"sticky",left:0,zIndex:3,background:T.theadD,maxWidth:130,fontSize:9,fontWeight:700,color:T.dimText,textAlign:"left"}}>↑ Mon&nbsp;&nbsp;&nbsp;Sun ↑</th><th style={{background:T.theadD,width:0,padding:0}}/>
                {actualWeeks.map(w=><th key={w.key} style={{padding:"2px 10px 5px",fontSize:10,fontWeight:400,color:T.dimText,textAlign:"right",borderRight:`1px solid ${T.border}`,whiteSpace:"nowrap"}}>→ {fmt(w.sunday)}</th>)}
                <th style={{background:T.theadD,borderLeft:`2px solid ${T.border2}`,borderRight:`2px solid ${T.border2}`}}/>
                {forecastWeeks.map((w,i)=>{
                  const op=Math.max(0.35,1-i*0.11);
                  const isLast=i===forecastWeeks.length-1;
                  return<th key={w.key} style={{padding:"2px 10px 5px",fontSize:10,fontWeight:400,color:`rgba(99,102,241,${op*0.7})`,textAlign:"right",background:T.forecastCell,borderRight:isLast?"none":`1px dashed ${T.border2}`,whiteSpace:"nowrap"}}>→ {fmt(w.sunday)}</th>;
                })}
                <th style={{background:T.theadD,borderLeft:`2px solid ${T.border2}`,borderRight:`2px solid ${T.border2}`}}/>
                <th data-tour="budget" style={{padding:"3px 8px",fontSize:10,fontWeight:700,color:T.dimText,textAlign:"center",whiteSpace:"nowrap",background:T.theadD}}>BUDGET</th>
                <th style={{background:T.theadD}}/>
              </tr>
            </thead>
            <tbody>
              {accounts.map(acc=><AccountSection key={acc} account={acc}/>)}
              {/* Cash Balance row */}
              <tr data-tour="cashbalance" style={{background:T.cashBalRow,borderTop:"2px solid #6366f1"}}>
                <td colSpan={2} style={{padding:"9px 12px",fontSize:13,fontWeight:800,color:"#6366f1",cursor:"help"}}
                  onMouseEnter={e=>{const r=e.currentTarget.getBoundingClientRect();setTooltip({text:ROW_TOOLTIPS["Cash Balance"],x:r.left,y:r.bottom+6});}}
                  onMouseLeave={()=>setTooltip(null)}>
                  CASH BALANCE <span style={{fontSize:9,color:"#4338ca",verticalAlign:"super"}}>?</span>
                </td>
                {combinedClosingBalances.actual.map((v,i)=>(
                  <td key={i} style={{padding:"9px 10px",textAlign:"right",fontSize:13,fontWeight:800,color:v===null?"#374151":v>=0?"#10b981":"#ef4444",borderRight:`1px solid ${T.border}`,fontVariantNumeric:"tabular-nums",background:v!==null&&v>=0?"rgba(16,185,129,0.07)":v!==null?"rgba(239,68,68,0.07)":"transparent"}}>
                    {v===null?"—":fmtMoney(v)}
                  </td>
                ))}
                <td style={{padding:"9px 10px",background:T.theadD,borderLeft:`2px solid ${T.border2}`,borderRight:`2px solid ${T.border2}`}}/>
                {combinedClosingBalances.forecast.map((v,i)=>(
                  <td key={i} style={{padding:"9px 10px",textAlign:"right",fontSize:13,fontWeight:800,color:v===null?"#4b5563":v>=0?"#10b981":"#ef4444",background:v!==null&&v>=0?"rgba(16,185,129,0.1)":"rgba(99,102,241,0.12)",borderRight:`1px solid ${T.border2}`,fontVariantNumeric:"tabular-nums"}}>
                    {v===null?"—":fmtMoney(v)}
                  </td>
                ))}
                <td style={{background:"rgba(99,102,241,0.12)",borderLeft:`2px solid ${T.border2}`}}/>
                <td style={{background:T.bg}} colSpan={2}/>
              </tr>
            </tbody>
          </table>
        </div>

        {/* "So what" summary bar */}
        {(()=>{
          const lastActual = combinedClosingBalances.actual.filter(v=>v!==null).slice(-1)[0];
          const forecastEnd = combinedClosingBalances.forecast[combinedClosingBalances.forecast.length-1];
          const topSpendCat = categories
            .filter(c=>c!=="Salary"&&c!=="Card Repayment")
            .map(c=>({c, total:actualWeeks.reduce((s,w)=>s+accounts.reduce((s2,acc)=>s2+Math.abs(weeklyByAccountCat[w.key]?.[acc]?.[c]||0),0),0)}))
            .sort((a,b)=>b.total-a.total)[0];
          const weeklyTopSpend = topSpendCat ? Math.round(topSpendCat.total / Math.max(actualWeeks.length,1)) : 0;
          if(forecastEnd===null||forecastEnd===undefined||lastActual===null||lastActual===undefined) return null;
          const diff = forecastEnd - lastActual;
          const isUp = diff >= 0;
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
            </div>
          );
        })()}
      </div>

      {/* AI Advisor sidebar */}
      <div style={{width:aiOpen?300:44,flexShrink:0,background:T.sidebar,borderLeft:`1px solid ${T.border}`,transition:"width 0.3s cubic-bezier(0.16,1,0.3,1)",overflow:"hidden",display:"flex",flexDirection:"column",position:"relative"}}>
        <div style={{position:"absolute",top:0,left:0,right:0,height:1,background:"linear-gradient(90deg,#6366f1,#8b5cf6,#06b6d4)",pointerEvents:"none"}}/>
        <button onClick={()=>setAiOpen(p=>!p)} style={{display:"flex",alignItems:"center",gap:8,padding:"13px 14px",border:"none",background:"none",cursor:"pointer",borderBottom:"1px solid #1f1d35",whiteSpace:"nowrap",flexShrink:0}}>
          <svg width="16" height="16" viewBox="0 0 20 20" fill="none"><rect x="3" y="7" width="14" height="10" rx="3" stroke={PURPLE} strokeWidth="1.6"/><path d="M7 7V5a3 3 0 016 0v2" stroke={PURPLE} strokeWidth="1.6"/><circle cx="8" cy="12" r="1.2" fill={PURPLE}/><circle cx="12" cy="12" r="1.2" fill={PURPLE}/></svg>
          {aiOpen&&<span style={{flex:1,textAlign:"left",fontSize:13,fontWeight:700,color:"#c7d2fe"}}>Insights</span>}
          <svg width="12" height="12" viewBox="0 0 20 20" fill="none"><path d={aiOpen?"M14 8l-4 4-4-4":"M6 12l4-4 4 4"} stroke="#4b5563" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </button>
        {aiOpen&&(
          <div style={{padding:"12px",display:"flex",flexDirection:"column",gap:8,overflow:"auto",flex:1}}>
            {aiTyping?(
              <div style={{display:"flex",gap:5,padding:"16px",background:"rgba(99,102,241,0.06)",borderRadius:10,alignItems:"center",border:"1px solid #2d2a6e"}}>
                <span style={{fontSize:11,color:"#6366f1",marginRight:4}}>Analysing your data</span>
                {[0,1,2].map(i=>(
                  <div key={i} style={{width:5,height:5,borderRadius:"50%",background:"#6366f1",animation:`typingDot 1.2s ease-in-out ${i*180}ms infinite`}}/>
                ))}
              </div>
            ):(
              insights.map((ins,i)=>(
                <div key={i} style={{background:"#0d0c1e",borderRadius:10,border:"1px solid #1f1d35",borderLeft:`3px solid ${ins.color}`,overflow:"hidden",transition:"border-color 0.2s",animation:`fadeUp 0.4s ease ${i*100}ms both`}}
                  onMouseEnter={e=>e.currentTarget.style.borderColor=`${ins.color}88`}
                  onMouseLeave={e=>e.currentTarget.style.borderColor="#1f1d35"}>
                  <div style={{padding:"11px 13px",cursor:"pointer",display:"flex",gap:8,alignItems:"flex-start"}} onClick={()=>setAiExpanded(aiExpanded===i?null:i)}>
                    <div style={{marginTop:1,flexShrink:0}}><InsightIcon type={ins.icon} color={ins.color}/></div>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:12,fontWeight:700,color:"#e0e7ff",marginBottom:2,lineHeight:1.3}}>{ins.title}</div>
                      <div style={{fontSize:11,color:"#6b7280",lineHeight:1.5}}>{ins.body}</div>
                    </div>
                    <svg width="10" height="10" viewBox="0 0 20 20" fill="none" style={{flexShrink:0,marginTop:2}}><path d={aiExpanded===i?"M5 13l5-5 5 5":"M5 8l5 5 5-5"} stroke="#374151" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </div>
                  {aiExpanded===i&&ins.detail&&(
                    <div style={{padding:"10px 13px 12px",borderTop:"1px solid #1a1830"}}>
                      <p style={{fontSize:11,color:"#6b7280",margin:0,lineHeight:1.7}}>{ins.detail}</p>
                    </div>
                  )}
                </div>
              ))
            )}
            <div style={{marginTop:4,padding:"10px 12px",background:"rgba(255,255,255,0.02)",borderRadius:8,border:"1px solid #13112a",fontSize:10,color:"#2d2a6e",lineHeight:1.5,textAlign:"center"}}>
              Insights update automatically as you edit categories
            </div>
          </div>
        )}
      </div>
      
      {isMobile&&(
        <button onClick={toggleFullscreen} title={isFullscreen?"Exit fullscreen":"Go fullscreen"}
          style={{position:"fixed",bottom:isMobile?16:24,right:isMobile?62:72,width:36,height:36,borderRadius:"50%",background:"rgba(30,27,56,0.92)",border:"1px solid #4338ca",color:"#a5b4fc",cursor:"pointer",boxShadow:"0 4px 16px rgba(0,0,0,0.4)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:500}}>
          {isFullscreen
            ?<svg width="14" height="14" viewBox="0 0 20 20" fill="none"><path d="M7 3H3v4M17 3h-4v4M7 17H3v-4M17 17h-4v-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
            :<svg width="14" height="14" viewBox="0 0 20 20" fill="none"><path d="M3 8V3h5M17 8V3h-5M3 12v5h5M17 12v5h-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
          }
        </button>
      )}
      {/* Tour reopen button */}
      <button onClick={reopenTour}
        title="Tour & tips"
        style={{position:"fixed",bottom:isMobile?16:24,right:isMobile?16:24,width:isMobile?36:40,height:isMobile?36:40,borderRadius:"50%",background:"#6366f1",border:"none",color:"#fff",fontSize:16,cursor:"pointer",boxShadow:"0 4px 16px rgba(99,102,241,0.4)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:500,transition:"all 0.2s"}}
        onMouseEnter={e=>{e.target.style.transform="scale(1.1)";e.target.style.boxShadow="0 6px 24px rgba(99,102,241,0.6)";}}
        onMouseLeave={e=>{e.target.style.transform="";e.target.style.boxShadow="0 4px 16px rgba(99,102,241,0.4)";}}>
        ?
      </button>
    </div>
  );
}

// ─── Root ─────────────────────────────────────────────────────────────────────
export default function App() {
  const [screen, setScreen] = useState("hero");

  useEffect(()=>{
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

  function handleResume() {
    const s = loadSession();
    if (!s) return;
    setSortedTransactions(s.transactions);
    setFinalCategories(s.categories);
    setScreen("main");
  }

  function handleSortDone(txns, cats) {
    setSortedTransactions(txns);
    setFinalCategories(cats);
    saveSession(txns, cats);
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
      {screen==="upload"&&<UploadScreen onDone={(txns,multi)=>{setRawTransactions(txns);setMultipleAccounts(multi);setScreen("categorise");}}/>}
      {screen==="categorise"&&<CategoriseScreen transactions={rawTransactions} multipleAccounts={multipleAccounts} onDone={(txns,cats)=>{setCategorisedTransactions(txns);setFinalCategories(cats);setScreen("sort");}}/>}
      {screen==="sort"&&<SortScreen transactions={categorisedTransactions} categories={finalCategories} onDone={handleSortDone}/>}
      {screen==="main"&&<MainScreen transactions={sortedTransactions} categories={finalCategories} onStartOver={handleStartOver} onFeedback={()=>setScreen("feedback")}/>}
      {screen==="feedback"&&<FeedbackScreen txnCount={sortedTransactions.length} onDone={()=>setScreen("session-complete")}/>}
      {screen==="session-complete"&&<SessionCompleteScreen txnCount={sortedTransactions.length} onRestart={()=>{setScreen("hero");setRawTransactions([]);setSortedTransactions([]);setCategorisedTransactions([]);setFinalCategories([]);}}/>}
    </div>
  );
}
