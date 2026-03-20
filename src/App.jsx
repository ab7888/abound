import { useState, useEffect, useMemo, useRef } from "react";
import * as XLSX from "xlsx";
import logo from "./logo.png";

// ─── Constants ────────────────────────────────────────────────────────────────
const DEFAULT_CATEGORIES = ["Food", "Travel", "Rent", "Memberships", "Salary", "Other Payments"];
const INTERCOMPANY_CATEGORY = "Card Repayment";
const PURPLE = "#6366f1";
const CATEGORY_COLORS = ["#10b981","#3b82f6","#f59e0b","#8b5cf6","#059669","#6366f1","#ec4899","#14b8a6","#f97316","#ef4444"];
const ACCOUNT_LABELS = { 0:"Main Account", 1:"Credit Card", 2:"Credit Card 2", 3:"Credit Card 3" };

const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
  *, *::before, *::after { box-sizing: border-box; }
  body { -webkit-font-smoothing: antialiased; }
  html { -webkit-text-size-adjust: 100%; }
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
  @keyframes spotlightIn { from{opacity:0;transform:translateY(12px) scale(0.97)} to{opacity:1;transform:translateY(0) scale(1)} }
  .abound-row:hover td { background: rgba(99,102,241,0.03) !important; transition: background 0.1s; }
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
  const allLines = [];

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const textContent = await page.getTextContent();

    // Group text items by approximate y-position (same line = within 4 units)
    const items = textContent.items
      .map(item => ({
        text: item.str.trim(),
        x: Math.round(item.transform[4]),
        y: Math.round(item.transform[5] / 4) * 4,
      }))
      .filter(i => i.text.length > 0);

    const lineMap = {};
    items.forEach(item => {
      if (!lineMap[item.y]) lineMap[item.y] = [];
      lineMap[item.y].push(item);
    });

    // Sort top-to-bottom (higher y = higher on page in PDF coords)
    const lines = Object.entries(lineMap)
      .sort((a, b) => parseFloat(b[0]) - parseFloat(a[0]))
      .map(([, items]) =>
        items.sort((a, b) => a.x - b.x).map(i => i.text).join(' ')
      );

    allLines.push(...lines);
  }

  // Parse lines into transaction rows
  // Match common UK bank date formats: 01/02/2026, 01-Feb-26, 1 Feb 2026
  const dateRx = /^(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}|\d{1,2}[\/\-][A-Za-z]{3}[\/\-]\d{2,4}|\d{1,2}\s+[A-Za-z]{3}\s+\d{2,4})/;
  const amountRx = /-?[\d,]+\.\d{2}/g;
  const rows = [];

  allLines.forEach(line => {
    const dateMatch = line.match(dateRx);
    if (!dateMatch) return;
    const dateStr = dateMatch[0];
    const amounts = line.match(amountRx);
    if (!amounts || amounts.length === 0) return;

    // Last amount = balance, second-to-last = transaction; if only one, it's the transaction
    const txnAmt = amounts.length >= 2 ? amounts[amounts.length - 2] : amounts[0];
    const bal    = amounts.length >= 2 ? amounts[amounts.length - 1] : '';

    // Description sits between the date and the first amount
    const firstAmtIdx = line.indexOf(amounts[0]);
    const description = line.slice(dateStr.length, firstAmtIdx).replace(/\s+/g, ' ').trim();
    if (!description || description.length < 2) return;

    rows.push({
      Date:        dateStr,
      Description: description,
      Amount:      txnAmt.replace(/,/g, ''),
      Balance:     bal.replace(/,/g, ''),
    });
  });

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

// ─── AI Categorisation ────────────────────────────────────────────────────────
async function smartCategorise(transactions, userCategories, multipleAccounts, onProgress) {
  const allCats = multipleAccounts
    ? [...userCategories.filter(c=>c!==INTERCOMPANY_CATEGORY), INTERCOMPANY_CATEGORY]
    : userCategories;
  const withLookup = transactions.map(t => {
    if (t.isIncome && t.account==="Main Account") return {...t, category:"Salary"};
    if (t.isIncome && t.account!=="Main Account") return {...t, category:"Card Repayment"};
    const cat = merchantLookup(t.narrative);
    return {...t, category: cat||null};
  });
  const known = withLookup.filter(t=>t.category!==null);
  const unknown = withLookup.filter(t=>t.category===null);
  onProgress({type:"lookup_done", known:known.length, unknown:unknown.length, pct:30});
  if (unknown.length===0) { onProgress({type:"done"}); return withLookup; }
  const apiKey = import.meta.env.VITE_ANTHROPIC_KEY;
  if (!apiKey||!apiKey.startsWith("sk-")) {
    onProgress({type:"done"});
    return withLookup.map(t=>({...t, category:t.category||"Other Payments"}));
  }
  const cats = allCats.join(", ");
  const batchSize = 80;
  const claudeResults = [];
  const totalBatches = Math.ceil(unknown.length/batchSize);
  for (let i=0; i<unknown.length; i+=batchSize) {
    const batchNum = Math.floor(i/batchSize)+1;
    onProgress({type:"progress", batchNum, totalBatches, pct:30+Math.round((batchNum/totalBatches)*65)});
    const batch = unknown.slice(i, i+batchSize);
    const lines = batch.map((t,j)=>`${j}: ${t.narrative} | £${t.amount.toFixed(2)}`).join("\n");
    const prompt = `You are a UK personal finance assistant categorising bank transactions.

Categories available: ${cats}

Rules:
- TFL, Transport for London, TFL.GOV.UK, Oyster, Citymapper, Uber, Bolt, Trainline, National Rail, any airline, parking = "Travel"
- Any supermarket, grocery, restaurant, cafe, pub, takeaway, food delivery = "Food"
- Netflix, Spotify, Apple, Amazon Prime, Disney+, any gym, streaming, subscription = "Memberships"
- Energy, water, broadband, phone, council tax DDs = "Rent"
- Rent payments, mortgage = "Rent"
- Salary, wages, payroll, BACS credits = "Salary"
- ATM or cash withdrawals = "Other Payments"
${multipleAccounts ? `- Credit card repayments = "${INTERCOMPANY_CATEGORY}"` : ""}
- When unsure, pick the most likely category

Transactions (index: narrative | amount):
${lines}

Respond ONLY with a JSON array of ${batch.length} category strings. No explanation, no markdown.`;
    try {
      const controller = new AbortController();
      const timer = setTimeout(()=>controller.abort(), 13000);
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method:"POST", signal:controller.signal,
        headers:{"Content-Type":"application/json","x-api-key":apiKey,"anthropic-version":"2023-06-01","anthropic-dangerous-direct-browser-access":"true"},
        body:JSON.stringify({model:"claude-haiku-4-5-20251001",max_tokens:600,messages:[{role:"user",content:prompt}]})
      });
      clearTimeout(timer);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const text = data.content?.[0]?.text||"[]";
      const parsed = JSON.parse(text.replace(/```json|```/g,"").trim());
      claudeResults.push(...batch.map((t,j)=>({...t, category:allCats.includes(parsed[j])?parsed[j]:"Other Payments"})));
    } catch(err) {
      console.error("Claude batch failed:", err.message);
      claudeResults.push(...batch.map(t=>({...t,category:"Other Payments"})));
    }
  }
  onProgress({type:"done"});
  const claudeMap = new Map(claudeResults.map(t=>[t.narrative+t.date+t.amount, t.category]));
  return withLookup.map(t=>{
    if (t.category!==null) return t;
    return {...t, category:claudeMap.get(t.narrative+t.date+t.amount)||"Other Payments"};
  });
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

// ─── SCREEN 0: Hero ───────────────────────────────────────────────────────────
function HeroScreen({onEnter}) {
  const [phase, setPhase] = useState(0);
  const [leaving, setLeaving] = useState(false);
  useEffect(()=>{
    const t1=setTimeout(()=>setPhase(1),500);
    const t2=setTimeout(()=>setPhase(2),1200);
    return ()=>{clearTimeout(t1);clearTimeout(t2);};
  },[]);
  function handleEnter(){setLeaving(true);setTimeout(onEnter,500);}
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
        <div style={{marginBottom:24,animation:"fadeIn 0.6s ease both"}}>
          <img src={logo} alt="Abound" style={{height:44,opacity:0.95}}/>
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
          <button onClick={handleEnter}
            style={{padding:"14px 40px",background:"linear-gradient(135deg,#6366f1,#4f46e5)",color:"#fff",border:"none",borderRadius:12,fontSize:15,fontWeight:700,cursor:"pointer",letterSpacing:"-0.01em",boxShadow:"0 0 0 1px rgba(99,102,241,0.4),0 8px 32px rgba(99,102,241,0.3)",transition:"all 0.2s",animation:"glow 3s ease-in-out 2s infinite"}}
            onMouseEnter={e=>{e.target.style.transform="translateY(-2px)";e.target.style.boxShadow="0 0 0 1px rgba(99,102,241,0.6),0 12px 40px rgba(99,102,241,0.4)";}}
            onMouseLeave={e=>{e.target.style.transform="";e.target.style.boxShadow="0 0 0 1px rgba(99,102,241,0.4),0 8px 32px rgba(99,102,241,0.3)";}}>
            Get started →
          </button>
          <div style={{marginTop:14,fontSize:11,color:"#3f3f46",letterSpacing:"0.08em"}}>FREE · NO ACCOUNT REQUIRED</div>
        </div>
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
  const hasMainFile = !!accounts[0].file;
  useEffect(()=>{const t=setTimeout(()=>setShowPrivacy(false),3200);return()=>clearTimeout(t);},[]);
  function addCard(){setAccounts(a=>[...a,{id:Date.now(),file:null,name:""}]);}
  function removeAccount(id){setAccounts(a=>a.filter(x=>x.id!==id));}
  async function handleFile(id,file){setAccounts(a=>a.map(x=>x.id===id?{...x,file,name:file.name}:x));}
  async function handleContinue(){
    setLoading(true);
    const allRows=[];let ccIndex=1;
    for(const acc of accounts){
      if(!acc.file)continue;
      const ext=acc.file.name.split('.').pop().toLowerCase();
      const rows=ext==="pdf" ? await readPdfFile(acc.file) : await readExcelFile(acc.file);
      const isFirst=acc.id===accounts[0].id;
      let label;
      if(isFirst)label="Main Account";
      else if(ccIndex===1){label="Credit Card";ccIndex++;}
      else{label=`Credit Card ${ccIndex}`;ccIndex++;}
      allRows.push(...normaliseRows(rows,label));
    }
    setLoading(false);
    onDone(allRows,accounts.length>1);
  }
  function DropZone({account,index}){
    const [dragging,setDragging]=useState(false);
    const loaded=!!account.file;
    function onDrop(e){e.preventDefault();setDragging(false);const file=e.dataTransfer?.files?.[0]||e.target.files?.[0];if(file)handleFile(account.id,file);}
    const labelText=index===0?"Main Account":index===1?"Credit Card":`Credit Card ${index}`;
    return(
      <label onDragOver={e=>{e.preventDefault();setDragging(true);}} onDragLeave={()=>setDragging(false)} onDrop={onDrop}
        style={{display:"block",position:"relative",border:loaded?"1px solid #4338ca":dragging?"1px solid #6366f1":"1px dashed #2d2a6e",borderRadius:12,padding:"18px",cursor:"pointer",background:loaded?"rgba(99,102,241,0.06)":dragging?"rgba(99,102,241,0.04)":"rgba(255,255,255,0.02)",transition:"all 0.2s",marginBottom:10,boxShadow:loaded?"0 0 0 1px rgba(99,102,241,0.15)":"none"}}>
        <input type="file" accept=".xlsx,.xls,.csv,.pdf" onChange={onDrop} style={{position:"absolute",top:0,left:0,width:"100%",height:"100%",opacity:0,cursor:"pointer",zIndex:2}}/>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          <div style={{width:34,height:34,borderRadius:8,background:loaded?"rgba(99,102,241,0.15)":"rgba(255,255,255,0.04)",border:`1px solid ${loaded?"#4338ca":"#2d2a6e"}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,flexShrink:0,color:loaded?"#a5b4fc":"#52525b"}}>
            {loaded?"✓":"📄"}
          </div>
          <div style={{flex:1,minWidth:0}}>
            <div style={{fontSize:13,fontWeight:600,color:loaded?"#a5b4fc":"#71717a",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{loaded?account.name:`Drop ${labelText} statement here`}</div>
            <div style={{fontSize:11,color:"#3f3f46",marginTop:2}}>{loaded?"Ready · Excel, CSV or PDF":"Excel, CSV or PDF · drag & drop or click"}</div>
          </div>
          {loaded&&<div style={{width:7,height:7,borderRadius:"50%",background:"#10b981",flexShrink:0,boxShadow:"0 0 6px #10b981"}}/>}
        </div>
      </label>
    );
  }
  return(
    <div style={{minHeight:"100vh",background:"#08070f",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"40px 24px",position:"relative",overflow:"hidden"}}>
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
      setCategorised(result); setDone(true); setTimeout(()=>setStep("review"),1200);
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
  return (
    <div style={{maxWidth:680,margin:"0 auto",padding:isMobile?"16px":"40px 24px"}}>
      <style>{GLOBAL_CSS}</style>
      <div style={{display:"flex",alignItems:"center",gap:16,marginBottom:28}}>
        <img src={logo} alt="Abound" style={{height:isMobile?32:44}}/>
        <div>
          <div style={{fontSize:isMobile?18:22,fontWeight:800,color:"#111827"}}>Your spending breakdown</div>
          <div style={{fontSize:13,color:"#6b7280"}}>{categorised.length} transactions categorised · tweak anything below</div>
        </div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr 1fr":"repeat(auto-fill,minmax(180px,1fr))",gap:10,marginBottom:28}}>
        {categories.map((cat,i)=>{
          const total=summary[cat]||0;
          return (
            <div key={cat} style={{background:"#fff",borderRadius:12,padding:"14px 16px",border:"1px solid #e5e7eb",borderLeft:`4px solid ${CATEGORY_COLORS[i%CATEGORY_COLORS.length]}`}}>
              <div style={{fontSize:11,color:"#6b7280",fontWeight:600,marginBottom:4}}>{cat}</div>
              <div style={{fontSize:20,fontWeight:800,color:total===0?"#d1d5db":"#111827",fontVariantNumeric:"tabular-nums"}}>{total===0?"£0":`£${Math.round(total).toLocaleString()}`}</div>
              <div style={{fontSize:10,color:"#9ca3af",marginTop:2}}>last 30 days</div>
            </div>
          );
        })}
      </div>
      <div style={{background:"#fff",borderRadius:12,border:"1px solid #e5e7eb",overflow:"hidden",marginBottom:20}}>
        <div style={{padding:"12px 16px",borderBottom:"1px solid #f3f4f6",fontSize:11,fontWeight:700,color:"#9ca3af",letterSpacing:1}}>CATEGORIES</div>
        {categories.map((cat,i)=>(
          <div key={cat} style={{display:"flex",alignItems:"center",padding:"10px 16px",borderBottom:`1px solid ${CATEGORY_COLORS[i%CATEGORY_COLORS.length]}22`,borderLeft:`3px solid ${CATEGORY_COLORS[i%CATEGORY_COLORS.length]}`,gap:10}}>
            <span style={{width:10,height:10,borderRadius:"50%",background:CATEGORY_COLORS[i%CATEGORY_COLORS.length],flexShrink:0}}/>
            {editingCat===cat
              ?<input autoFocus value={editVal} onChange={e=>setEditVal(e.target.value)} onKeyDown={e=>{if(e.key==="Enter")saveRename();if(e.key==="Escape")setEditingCat(null);}} style={{flex:1,fontSize:13,border:`1px solid ${PURPLE}`,borderRadius:6,padding:"3px 8px"}}/>
              :<span style={{flex:1,fontSize:13,fontWeight:600}}>{cat}</span>
            }
            {editingCat===cat
              ?<button onClick={saveRename} style={{fontSize:11,color:PURPLE,border:"none",background:"none",cursor:"pointer",fontWeight:700}}>Save</button>
              :<button onClick={()=>{setEditingCat(cat);setEditVal(cat);}} style={{fontSize:11,color:"#9ca3af",border:"none",background:"none",cursor:"pointer"}}>rename</button>
            }
            <button onClick={()=>removeCategory(cat)} style={{fontSize:18,color:baseCats.includes(cat)?"#e5e7eb":"#9ca3af",border:"none",background:"none",cursor:baseCats.includes(cat)?"not-allowed":"pointer"}}>−</button>
          </div>
        ))}
        <div style={{display:"flex",gap:8,padding:"10px 16px"}}>
          <input value={newCat} onChange={e=>setNewCat(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addCategory()} placeholder="Add a custom category..." style={{flex:1,fontSize:13,border:"1px solid #e5e7eb",borderRadius:8,padding:"7px 12px"}}/>
          <button onClick={addCategory} style={{padding:"7px 16px",background:PURPLE,color:"#fff",border:"none",borderRadius:8,fontSize:13,fontWeight:700,cursor:"pointer"}}>+</button>
        </div>
      </div>
      <div style={{position:"sticky",bottom:0,background:"linear-gradient(to top,#f8fafc 80%,transparent)",paddingTop:16,paddingBottom:16}}>
        <button onClick={()=>onDone(categorised,categories)} style={{width:"100%",padding:"14px",background:PURPLE,color:"#fff",border:"none",borderRadius:12,fontSize:15,fontWeight:800,cursor:"pointer",boxShadow:"0 4px 20px rgba(99,102,241,0.4)"}}>
          Sort remaining transactions →
        </button>
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
  const spendCats=categories.filter(c=>c!=="Salary"&&c!=="Other Payments");
  const allBuckets=[...spendCats,"Skip"];
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
  const CAT_EMOJI={"Food":"🍔","Travel":"✈️","Rent":"🏠","Memberships":"📱","Salary":"💰","Other Payments":"💳","Card Repayment":"🔄"};
  function getBucketEmoji(cat){return CAT_EMOJI[cat]||"📂";}

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
        <div style={{flex:1,padding:"16px 20px",overflow:"auto",display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(180px,1fr))",gap:14,alignContent:"start"}}>
          {spendCats.map((cat,i)=>{
            const color=catColor(cat,i),isHovered=hoveredCat===cat;
            const totalCount=(txnCountByCat[cat]||0)+(bucketCounts[cat]||0);
            const isDefault=DEFAULT_CATEGORIES.includes(cat);
            return(
              <div key={cat} onDragOver={e=>{e.preventDefault();setHoveredCat(cat);}} onDragLeave={e=>{if(!e.currentTarget.contains(e.relatedTarget))setHoveredCat(null);}} onDrop={e=>{e.preventDefault();dropIntoCat(cat);}}
                style={{border:`2px ${isHovered?"solid":"dashed"} ${isHovered?color:`${color}66`}`,borderRadius:16,padding:"20px 16px 16px",background:isHovered?`${color}1a`:"rgba(255,255,255,0.015)",transition:"all 0.15s",cursor:"default",minHeight:140,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"space-between",position:"relative",boxShadow:isHovered?`0 0 28px ${color}33`:"none"}}>
                {!isDefault&&<button onClick={()=>removeCategory(cat)} style={{position:"absolute",top:8,right:10,fontSize:12,color:"#374151",border:"none",background:"none",cursor:"pointer",lineHeight:1,opacity:0.6}}>×</button>}
                <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:8,flex:1,justifyContent:"center"}}>
                  <div style={{fontSize:28,lineHeight:1}}>{getBucketEmoji(cat)}</div>
                  <div style={{fontSize:15,fontWeight:700,color:isHovered?"#fff":color,textAlign:"center"}}>{cat}</div>
                  {isHovered&&<div style={{fontSize:11,color:"rgba(255,255,255,0.5)"}}>drop here</div>}
                </div>
                <div style={{width:"100%",borderTop:`1px solid ${color}33`,paddingTop:10,textAlign:"center",fontSize:11,fontWeight:700,color:totalCount>0?color:"#2d2a6e"}}>
                  {totalCount>0?`${totalCount} transaction${totalCount>1?"s":""}`:isHovered?"drop here →":"empty"}
                </div>
              </div>
            );
          })}
          {(()=>{const isHovered=hoveredCat==="Skip",count=skipped.length;return(
            <div onDragOver={e=>{e.preventDefault();setHoveredCat("Skip");}} onDragLeave={e=>{if(!e.currentTarget.contains(e.relatedTarget))setHoveredCat(null);}} onDrop={e=>{e.preventDefault();dropIntoCat("Skip");}}
              style={{border:`2px dashed ${isHovered?"#6b7280":"#2d2a6e"}`,borderRadius:16,padding:"20px 16px 16px",background:isHovered?"rgba(107,114,128,0.12)":"rgba(255,255,255,0.01)",transition:"all 0.15s",cursor:"default",minHeight:140,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"space-between"}}>
              <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:8,flex:1,justifyContent:"center"}}>
                <div style={{fontSize:28,lineHeight:1,opacity:isHovered?1:0.4}}>🤷</div>
                <div style={{fontSize:15,fontWeight:700,color:isHovered?"#9ca3af":"#374151",textAlign:"center"}}>Not sure</div>
                <div style={{fontSize:11,color:"#2d2a6e",textAlign:"center"}}>stays in Other Payments</div>
              </div>
              <div style={{width:"100%",borderTop:"1px solid #1f1d35",paddingTop:10,textAlign:"center",fontSize:11,fontWeight:700,color:count>0?"#6b7280":"#2d2a6e"}}>
                {count>0?`${count} transaction${count>1?"s":""}`:isHovered?"drop here →":"empty"}
              </div>
            </div>
          );})()}
        </div>
      </div>
    </div>
  );

  const MobileSort=()=>{
    const topItem=unsorted[0];
    const swipeRight=visibleMobileCats[0],swipeLeft=visibleMobileCats[1];
    const swipeRightColor=swipeRight==="Skip"?"#6b7280":catColor(swipeRight,spendCats.indexOf(swipeRight));
    const swipeLeftColor=swipeLeft==="Skip"?"#6b7280":catColor(swipeLeft,spendCats.indexOf(swipeLeft));
    const swipeProgress=Math.min(Math.abs(swipeOffset)/SWIPE_THRESHOLD,1);
    const swipingRight=swipeOffset>20,swipingLeft=swipeOffset<-20;
    return(
      <div style={{flex:1,display:"flex",flexDirection:"column",padding:"12px 16px",gap:12,overflow:"hidden"}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <div style={{flex:1,height:4,background:"#1f1d35",borderRadius:999,overflow:"hidden"}}>
            <div style={{height:"100%",width:`${pct}%`,background:"linear-gradient(90deg,#6366f1,#10b981)",transition:"width 0.4s"}}/>
          </div>
          <span style={{fontSize:12,color:"#6366f1",fontWeight:700,flexShrink:0,fontVariantNumeric:"tabular-nums"}}>{pct}% sorted</span>
        </div>
        <div style={{position:"relative",height:150,flexShrink:0}}>
          {unsorted.length===0?(
            <div style={{textAlign:"center",padding:"30px 0"}}>
              <div style={{fontSize:32,marginBottom:8}}>🎉</div>
              <div style={{fontSize:14,fontWeight:700,color:"#fff",marginBottom:12}}>All sorted!</div>
              <button onClick={handleConfirm} style={{padding:"10px 24px",background:"#6366f1",color:"#fff",border:"none",borderRadius:8,fontSize:13,fontWeight:700,cursor:"pointer"}}>Show cash flow →</button>
            </div>
          ):(
            <>
              {visible.slice(1,3).map((item,idx)=>(<div key={item.narrative} style={{position:"absolute",top:0,left:0,right:0,background:`rgba(20,18,42,${1-(idx+1)*0.15})`,border:"1px solid #2d2a6e",borderRadius:16,padding:"16px",transform:`translateY(${(idx+1)*6}px) scale(${1-(idx+1)*0.03})`,transformOrigin:"top center",zIndex:1-idx}}/>))}
              {topItem&&(
                <div onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}
                  style={{position:"absolute",top:0,left:0,right:0,background:swipingRight?`linear-gradient(135deg,${swipeRightColor}33,#1e1b38)`:swipingLeft?`linear-gradient(225deg,${swipeLeftColor}33,#1e1b38)`:"#1e1b38",border:`2px solid ${swipeTarget?(swipingRight?swipeRightColor:swipeLeftColor):"#4338ca"}`,borderRadius:16,padding:"20px",transform:`translateX(${swipeOffset}px) rotate(${swipeOffset*0.03}deg)`,transition:swipeOffset===0?"transform 0.3s":"none",zIndex:10,touchAction:"none",userSelect:"none"}}>
                  {swipeTarget&&(<div style={{position:"absolute",top:12,right:swipingRight?12:undefined,left:swipingLeft?12:undefined,background:swipingRight?swipeRightColor:swipeLeftColor,color:"#fff",fontSize:11,fontWeight:800,padding:"3px 10px",borderRadius:20,opacity:swipeProgress}}>{swipeTarget==="Skip"?"NOT SURE":swipeTarget.toUpperCase()}</div>)}
                  <div style={{fontSize:13,fontWeight:600,color:"#c7d2fe",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",marginBottom:8}}>{topItem.narrative}</div>
                  <div style={{display:"flex",alignItems:"center",gap:10}}>
                    <span style={{fontSize:22,fontWeight:800,color:"#a5b4fc",fontVariantNumeric:"tabular-nums"}}>£{Math.round(topItem.total).toLocaleString()}</span>
                    <span style={{fontSize:12,color:"#4b5563"}}>{topItem.count} txn{topItem.count>1?"s":""}</span>
                  </div>
                  <div style={{fontSize:10,color:"#374151",marginTop:6}}>{unsorted.length} left</div>
                </div>
              )}
            </>
          )}
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
          {visibleMobileCats.map(cat=>{
            const isSkip=cat==="Skip",color=isSkip?"#6b7280":catColor(cat,spendCats.indexOf(cat));
            const count=isSkip?skipped.length:(txnCountByCat[cat]||0)+(bucketCounts[cat]||0);
            return(<button key={cat} onClick={()=>{if(unsorted[0])assignItem(unsorted[0].narrative,cat);}} style={{padding:"12px 10px",background:`${color}18`,border:`2px solid ${color}`,borderRadius:12,color,fontWeight:700,fontSize:13,cursor:"pointer",textAlign:"center",display:"flex",flexDirection:"column",gap:3,alignItems:"center"}}>
              <span>{isSkip?"Not sure":cat}</span>
              {count>0&&<span style={{fontSize:10,fontWeight:400,opacity:0.7}}>{count} txn{count>1?"s":""}</span>}
            </button>);
          })}
        </div>
        {totalPages>1&&(
          <div style={{display:"flex",justifyContent:"center",gap:8,alignItems:"center"}}>
            <button onClick={()=>setMobileCatPage(p=>Math.max(0,p-1))} disabled={mobileCatPage===0} style={{fontSize:16,background:"none",border:"none",color:mobileCatPage===0?"#2d2a6e":"#6366f1",cursor:"pointer"}}>‹</button>
            {Array.from({length:totalPages}).map((_,i)=>(<div key={i} onClick={()=>setMobileCatPage(i)} style={{width:6,height:6,borderRadius:"50%",background:i===mobileCatPage?"#6366f1":"#2d2a6e",cursor:"pointer"}}/>))}
            <button onClick={()=>setMobileCatPage(p=>Math.min(totalPages-1,p+1))} disabled={mobileCatPage===totalPages-1} style={{fontSize:16,background:"none",border:"none",color:mobileCatPage===totalPages-1?"#2d2a6e":"#6366f1",cursor:"pointer"}}>›</button>
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
  return(
    <div style={{flex:1,overflow:"auto",background:"#f8fafc"}}>
      <style>{GLOBAL_CSS}</style>
      {showUpdatedBanner&&(
        <div style={{background:"linear-gradient(135deg,#10b981,#059669)",padding:"14px 24px",display:"flex",alignItems:"center",gap:16}}>
          <span style={{fontSize:18}}>✅</span>
          <div style={{flex:1}}>
            <div style={{fontWeight:700,color:"#fff",fontSize:14}}>Cash flow updated!</div>
            <div style={{color:"rgba(255,255,255,0.8)",fontSize:12}}>Your corrections have been applied — head back to see the updated numbers.</div>
          </div>
          <button onClick={onGoToCashFlow} style={{padding:"8px 18px",background:"#fff",color:"#059669",border:"none",borderRadius:8,fontSize:13,fontWeight:700,cursor:"pointer"}}>View Cash Flow →</button>
          <button onClick={()=>setShowUpdatedBanner(false)} style={{fontSize:18,color:"rgba(255,255,255,0.7)",background:"none",border:"none",cursor:"pointer"}}>×</button>
        </div>
      )}
      <div style={{padding:isMobile?"12px 16px":"20px 24px"}}>
        <div style={{display:"flex",gap:8,marginBottom:16,flexWrap:"wrap",alignItems:"center"}}>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search transactions..." style={{padding:"8px 14px",border:"1px solid #e5e7eb",borderRadius:8,fontSize:13,width:isMobile?"100%":220,outline:"none"}}/>
          <select value={filterAccount} onChange={e=>setFilterAccount(e.target.value)} style={{padding:"8px 14px",border:"1px solid #e5e7eb",borderRadius:8,fontSize:13,cursor:"pointer",background:"#fff"}}>
            <option value="All">All accounts</option>
            {accounts.map(a=><option key={a} value={a}>{a}</option>)}
          </select>
          <select value={filterCat} onChange={e=>setFilterCat(e.target.value)} style={{padding:"8px 14px",border:"1px solid #e5e7eb",borderRadius:8,fontSize:13,cursor:"pointer",background:"#fff"}}>
            <option value="All">All categories</option>
            {categories.map(c=><option key={c} value={c}>{c}</option>)}
          </select>
          <div style={{marginLeft:"auto",fontSize:13,color:"#6b7280"}}>
            {filtered.length} transaction{filtered.length!==1?"s":""}
            {editCount>0&&<span style={{marginLeft:8,color:"#10b981",fontWeight:600}}>· {editCount} edited</span>}
          </div>
        </div>
        <div style={{background:"#fff",borderRadius:12,border:"1px solid #e5e7eb",overflow:"hidden"}}>
          {!isMobile&&(
            <div style={{display:"grid",gridTemplateColumns:"110px 1fr 100px 180px",background:"#1e1b4b",padding:"10px 16px"}}>
              <div style={{fontSize:11,fontWeight:700,color:"#c7d2fe",letterSpacing:0.5}}>DATE</div>
              <div style={{fontSize:11,fontWeight:700,color:"#c7d2fe",letterSpacing:0.5}}>DESCRIPTION</div>
              <div style={{fontSize:11,fontWeight:700,color:"#c7d2fe",letterSpacing:0.5,textAlign:"right"}}>AMOUNT</div>
              <div style={{fontSize:11,fontWeight:700,color:"#c7d2fe",letterSpacing:0.5,paddingLeft:16}}>CATEGORY</div>
            </div>
          )}
          {filtered.map((t,i)=>(
            isMobile ? (
              <div key={i} style={{padding:"12px 16px",borderBottom:"1px solid #f3f4f6",background:i%2===0?"#fff":"#fafafa"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
                  <span style={{fontSize:11,color:"#9ca3af"}}>{fmtDate(t.date)} · {t.account==="Main Account"?"Main":t.account.replace("Credit Card","CC")}</span>
                  <span style={{fontSize:13,fontWeight:700,color:t.isIncome?"#059669":"#111827",fontVariantNumeric:"tabular-nums"}}>
                    {t.isIncome?"+":""}{`£${t.amount.toLocaleString(undefined,{maximumFractionDigits:2})}`}
                  </span>
                </div>
                <div style={{fontSize:13,color:"#111827",marginBottom:8,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{t.narrative}</div>
                <select value={t.category||""} onChange={e=>changeCategory(t,e.target.value)}
                  style={{padding:"6px 12px",borderRadius:20,border:`1.5px solid ${catColors[t.category]||"#e5e7eb"}`,background:`${catColors[t.category]||"#e5e7eb"}18`,color:catColors[t.category]||"#374151",fontSize:12,fontWeight:700,cursor:"pointer",outline:"none",width:"100%"}}>
                  {categories.map(c=><option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            ) : (
              <div key={i} style={{display:"grid",gridTemplateColumns:"110px 1fr 100px 180px",padding:"9px 16px",borderBottom:"1px solid #f3f4f6",background:i%2===0?"#fff":"#fafafa",alignItems:"center",transition:"background 0.1s"}}
                onMouseEnter={e=>e.currentTarget.style.background="#f0f7ff"}
                onMouseLeave={e=>e.currentTarget.style.background=i%2===0?"#fff":"#fafafa"}>
                <div style={{fontSize:12,color:"#6b7280"}}>{fmtDate(t.date)}</div>
                <div style={{fontSize:12,color:"#111827",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",paddingRight:12}}>
                  <span style={{fontSize:10,color:"#9ca3af",marginRight:6}}>{t.account==="Main Account"?"Main":t.account.replace("Credit Card","CC")}</span>
                  {t.narrative}
                </div>
                <div style={{fontSize:12,fontWeight:600,color:t.isIncome?"#059669":"#111827",textAlign:"right",fontVariantNumeric:"tabular-nums"}}>
                  {t.isIncome?"+":""}{`£${t.amount.toLocaleString(undefined,{maximumFractionDigits:2})}`}
                </div>
                <div style={{paddingLeft:16}}>
                  <select value={t.category||""} onChange={e=>changeCategory(t,e.target.value)}
                    style={{padding:"4px 10px",borderRadius:20,border:`1.5px solid ${catColors[t.category]||"#e5e7eb"}`,background:`${catColors[t.category]||"#e5e7eb"}18`,color:catColors[t.category]||"#374151",fontSize:11,fontWeight:700,cursor:"pointer",outline:"none",width:"100%",maxWidth:160}}>
                    {categories.map(c=><option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
            )
          ))}
          {filtered.length===0&&<div style={{padding:"40px",textAlign:"center",color:"#9ca3af",fontSize:13}}>No transactions match your filters.</div>}
        </div>
      </div>
    </div>
  );
}

// ─── Main Shell ───────────────────────────────────────────────────────────────
function MainScreen({transactions: initialTransactions, categories, onStartOver}) {
  const [transactions, setTransactions] = useState(initialTransactions);
  const [activeTab, setActiveTab] = useState("cashflow");
  const [showReviewPrompt, setShowReviewPrompt] = useState(true);
  function goToReview(){setActiveTab("review");setShowReviewPrompt(false);}
  return(
    <div style={{display:"flex",flexDirection:"column",height:"100vh",fontFamily:"'Inter',system-ui,sans-serif"}}>
      <style>{GLOBAL_CSS}</style>
      <div style={{background:"#fff",borderBottom:"1px solid #e5e7eb",padding:"0 24px",display:"flex",alignItems:"center",height:57,flexShrink:0}}>
        <img src={logo} alt="Abound" style={{height:36,marginRight:24}}/>
        <button onClick={()=>setActiveTab("cashflow")} style={{padding:"0 18px",height:"100%",border:"none",borderBottom:activeTab==="cashflow"?`3px solid ${PURPLE}`:"3px solid transparent",background:"none",fontSize:13,fontWeight:activeTab==="cashflow"?700:500,color:activeTab==="cashflow"?PURPLE:"#6b7280",cursor:"pointer",transition:"all 0.2s"}}>
          📊 Cash Flow
        </button>
        <button onClick={goToReview} style={{padding:"0 18px",height:"100%",border:"none",borderBottom:activeTab==="review"?`3px solid ${PURPLE}`:"3px solid transparent",background:"none",fontSize:13,fontWeight:activeTab==="review"?700:500,color:activeTab==="review"?PURPLE:"#6b7280",cursor:"pointer",transition:"all 0.2s",display:"flex",alignItems:"center",gap:6}}>
          🔍 Review Transactions
          {showReviewPrompt&&<span style={{background:"#ef4444",color:"#fff",borderRadius:10,fontSize:10,fontWeight:700,padding:"1px 6px"}}>!</span>}
        </button>
        <button onClick={onStartOver} style={{marginLeft:"auto",fontSize:12,color:"#6b7280",border:"none",background:"none",cursor:"pointer"}}>← Start over</button>
      </div>
      {activeTab==="cashflow"&&showReviewPrompt&&(
        <div style={{background:"linear-gradient(135deg,#6366f1,#8b5cf6)",padding:"12px 24px",display:"flex",alignItems:"center",gap:16,flexShrink:0}}>
          <span style={{fontSize:20}}>🔍</span>
          <div style={{flex:1}}>
            <div style={{fontWeight:700,color:"#fff",fontSize:13}}>Double-check your categories</div>
            <div style={{color:"rgba(255,255,255,0.8)",fontSize:12}}>AI isn't perfect — a quick review makes your cash flow much more accurate.</div>
          </div>
          <button onClick={goToReview} style={{padding:"8px 18px",background:"#fff",color:PURPLE,border:"none",borderRadius:8,fontSize:13,fontWeight:700,cursor:"pointer",flexShrink:0}}>Review now →</button>
          <button onClick={()=>setShowReviewPrompt(false)} style={{fontSize:18,color:"rgba(255,255,255,0.7)",background:"none",border:"none",cursor:"pointer",flexShrink:0}}>×</button>
        </div>
      )}
      {activeTab==="cashflow"&&<CashFlowScreen transactions={transactions} categories={categories} onGoToReview={goToReview}/>}
      {activeTab==="review"&&<ReviewScreen transactions={transactions} categories={categories} onUpdate={setTransactions} onGoToCashFlow={()=>setActiveTab("cashflow")}/>}
    </div>
  );
}

// ─── Cash Flow Screen ─────────────────────────────────────────────────────────
function CashFlowScreen({transactions, categories, onGoToReview}) {
  const isMobile = useIsMobile();
  const [hiddenCats, setHiddenCats] = useState(new Set());
  const [budgets, setBudgets] = useState({});
  const [editingBudget, setEditingBudget] = useState(null);
  const [aiOpen, setAiOpen] = useState(typeof window!=="undefined"?window.innerWidth>=768:true);
  const [aiTyping, setAiTyping] = useState(true);
  const [aiExpanded, setAiExpanded] = useState(null);
  const [tourStep, setTourStep] = useState(null);
  const [tourVisible, setTourVisible] = useState(false);
  const [tooltip, setTooltip] = useState(null); // {text, x, y}

  useEffect(()=>{const t=setTimeout(()=>{setTourStep(0);setTourVisible(true);},1500);return()=>clearTimeout(t);},[]);
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
    "Total Spend":"Sum of all real spend, excluding Card Repayments.",
    "Net Movement":"Income minus spend. Green = you kept money. Red = net cost week.",
    "Closing Balance":"Your predicted end-of-week cash position across all accounts. Green = positive, red = dipping negative.",
  };

  const TOUR_STEPS = [
    {title:"Welcome to your Cash Flow",body:"Want a 60-second tour? We'll explain exactly what you're looking at.",cta:"Show me around",skip:"Skip",highlight:null},
    {title:"Your actual spending",body:"The left columns show real transactions grouped by week. Each row is a spending category.",cta:"Next →",highlight:null},
    {title:"Your forecast",body:"The purple columns predict your spending ahead, based on your real patterns — monthly bills on their usual date, rolling average for daily spend.",cta:"Next →",highlight:null},
    {title:"Total Spend",body:"Card repayments are excluded — that money was already counted when you spent it. This is your honest real spend.",cta:"Next →",highlight:null},
    {title:"Closing Balance",body:"The most important row. Your predicted cash position at the end of each week, combining all accounts.",cta:"Next →",highlight:null},
    {title:"Set a budget",body:"Click 'set' next to any category. Abound flags in red when your forecast is about to exceed it.",cta:"Next →",highlight:null},
    {title:"Check your categories",body:"AI isn't perfect. Two minutes reviewing your categories makes your forecast dramatically more accurate.",cta:"Review categories →",skip:null,isFinal:true},
  ];

  function advanceTour(){
    if(tourStep===0){setTourStep(1);return;}
    if(tourStep>=TOUR_STEPS.length-1){setTourVisible(false);setTourStep(null);if(onGoToReview)onGoToReview();return;}
    setTourStep(s=>s+1);
  }
  function closeTour(){setTourVisible(false);setTourStep(null);}
  function reopenTour(){setTourStep(0);setTourVisible(true);}

  const accounts = useMemo(()=>{const seen=new Set(),list=[];transactions.forEach(t=>{if(!seen.has(t.account)){seen.add(t.account);list.push(t.account);}});list.sort((a,b)=>a==="Main Account"?-1:b==="Main Account"?1:0);return list;},[transactions]);
  const mostRecentDate = useMemo(()=>transactions.reduce((max,t)=>t.date>max?t.date:max,new Date(0)),[transactions]);
  const actualWeeks = useMemo(()=>{const lastMonday=getWeekMonday(mostRecentDate);return Array.from({length:6},(_,i)=>{const mon=new Date(lastMonday);mon.setDate(mon.getDate()-(5-i)*7);return{key:mon.toISOString().slice(0,10),date:mon,sunday:getWeekSunday(mon)};});},[mostRecentDate]);
  const forecastWeeks = useMemo(()=>{if(!actualWeeks.length)return[];const last=actualWeeks[actualWeeks.length-1].date;return Array.from({length:6},(_,i)=>{const mon=new Date(last);mon.setDate(mon.getDate()+(i+1)*7);return{key:mon.toISOString().slice(0,10),date:mon,sunday:getWeekSunday(mon)};});},[actualWeeks]);
  const weeklyByAccountCat = useMemo(()=>{const weekly={};transactions.forEach(t=>{const key=getWeekMonday(t.date).toISOString().slice(0,10);if(!weekly[key])weekly[key]={};if(!weekly[key][t.account])weekly[key][t.account]={};const amt=t.category==="Salary"?t.amount:-t.amount;weekly[key][t.account][t.category]=(weekly[key][t.account][t.category]||0)+amt;});return weekly;},[transactions]);
  const weekBalances = useMemo(()=>{const bal={};[...transactions].sort((a,b)=>a.date-b.date).forEach(t=>{if(t.balance===null)return;const key=getWeekMonday(t.date).toISOString().slice(0,10);if(!bal[key])bal[key]={};bal[key][t.account]=t.balance;});return bal;},[transactions]);

  const forecastData = useMemo(()=>{
    const out={};
    function getMonthlyDay(acc,cat){const days=[];transactions.forEach(t=>{if(t.account===acc&&t.category===cat)days.push(t.date.getDate());});if(!days.length)return null;const freq={};days.forEach(d=>freq[d]=(freq[d]||0)+1);return parseInt(Object.entries(freq).sort((a,b)=>b[1]-a[1])[0][0]);}
    function weekContainsDay(weekMon,weekSun,dayOfMonth){const d=new Date(weekMon);while(d<=weekSun){if(d.getDate()===dayOfMonth)return true;d.setDate(d.getDate()+1);}return false;}
    const MONTHLY_CATS=["Salary","Rent","Memberships","Card Repayment"];
    const ROLLING_CATS=["Food","Travel","Other Payments"];
    accounts.forEach(acc=>{
      out[acc]={};
      categories.forEach(cat=>{
        const actualVals=actualWeeks.map(w=>Math.abs(weeklyByAccountCat[w.key]?.[acc]?.[cat]||0));
        const avg=rollingAvg(actualVals);
        if(MONTHLY_CATS.includes(cat)){
          const dayOfMonth=getMonthlyDay(acc,cat);
          if(!dayOfMonth||avg===0){out[acc][cat]=Array(forecastWeeks.length).fill(0);}
          else{out[acc][cat]=forecastWeeks.map(w=>weekContainsDay(w.date,w.sunday,dayOfMonth)?avg:0);}
        } else if(ROLLING_CATS.includes(cat)){
          const window=[...actualVals];const result=[];
          for(let i=0;i<forecastWeeks.length;i++){const last6=window.slice(-6);const forecastVal=Math.round(last6.reduce((a,b)=>a+b,0)/6);result.push(forecastVal);window.push(forecastVal);}
          out[acc][cat]=result;
        } else {out[acc][cat]=Array(forecastWeeks.length).fill(avg);}
      });
    });
    return out;
  },[accounts,categories,actualWeeks,forecastWeeks,weeklyByAccountCat,transactions]);

  const spendCats=categories.filter(c=>c!=="Salary"&&c!=="Card Repayment");
  const totalActualByWeek=actualWeeks.map(w=>accounts.reduce((s,acc)=>spendCats.reduce((s2,c)=>s2+Math.abs(weeklyByAccountCat[w.key]?.[acc]?.[c]||0),s),0));
  const totalForecastByWeek=forecastWeeks.map((_,i)=>accounts.reduce((s,acc)=>spendCats.reduce((s2,c)=>s2+(forecastData[acc]?.[c]?.[i]||0),s),0));

  const combinedClosingBalances = useMemo(()=>{
    const mainAcc="Main Account";
    const spendCatsLocal=categories.filter(c=>c!=="Salary"&&c!=="Card Repayment");
    const ccAccounts=accounts.filter(a=>a!==mainAcc);
    const mainActuals=actualWeeks.map(w=>spendCatsLocal.reduce((s,c)=>s+Math.abs(weeklyByAccountCat[w.key]?.[mainAcc]?.[c]||0),0));
    const mainIncome=actualWeeks.map(w=>Math.abs(weeklyByAccountCat[w.key]?.[mainAcc]?.["Salary"]||0));
    const mainNet=actualWeeks.map((_,i)=>mainIncome[i]-mainActuals[i]);
    const ccActuals=actualWeeks.map(w=>ccAccounts.reduce((s,acc)=>spendCatsLocal.reduce((s2,c)=>s2+Math.abs(weeklyByAccountCat[w.key]?.[acc]?.[c]||0),s),0));
    const knownBals=actualWeeks.map(w=>weekBalances[w.key]?.[mainAcc]??null);
    const runningBals=Array(actualWeeks.length).fill(null);
    const firstKnown=knownBals.findIndex(b=>b!==null);
    if(firstKnown!==-1){runningBals[firstKnown]=knownBals[firstKnown];for(let i=firstKnown+1;i<actualWeeks.length;i++)runningBals[i]=runningBals[i-1]!==null?runningBals[i-1]+mainNet[i-1]:null;for(let i=firstKnown-1;i>=0;i--)runningBals[i]=runningBals[i+1]!==null?runningBals[i+1]-mainNet[i]:null;}
    const actualClosing=runningBals.map((ob,i)=>ob!==null?ob+mainNet[i]-ccActuals[i]:null);
    const lastActualBal=runningBals.filter(b=>b!==null).slice(-1)[0]??null;
    const mainFActuals=forecastWeeks.map((_,i)=>spendCatsLocal.reduce((s,c)=>s+(forecastData[mainAcc]?.[c]?.[i]||0),0));
    const mainFIncome=forecastWeeks.map((_,i)=>forecastData[mainAcc]?.["Salary"]?.[i]||0);
    const mainFNet=forecastWeeks.map((_,i)=>mainFIncome[i]-mainFActuals[i]);
    const ccFActuals=forecastWeeks.map((_,i)=>ccAccounts.reduce((s,acc)=>spendCatsLocal.reduce((s2,c)=>s2+(forecastData[acc]?.[c]?.[i]||0),s),0));
    const forecastBals=Array(forecastWeeks.length).fill(null);
    if(lastActualBal!==null){forecastBals[0]=lastActualBal+mainNet[actualWeeks.length-1];for(let i=1;i<forecastWeeks.length;i++)forecastBals[i]=forecastBals[i-1]+mainFNet[i-1];}
    const forecastClosing=forecastBals.map((ob,i)=>ob!==null?ob+mainFNet[i]-ccFActuals[i]:null);
    return{actual:actualClosing,forecast:forecastClosing};
  },[accounts,categories,actualWeeks,forecastWeeks,weeklyByAccountCat,weekBalances,forecastData]);

  const insights=useMemo(()=>{
    const tips=[],totals={};
    categories.forEach(cat=>{totals[cat]=actualWeeks.reduce((s,w)=>s+accounts.reduce((s2,acc)=>s2+Math.abs(weeklyByAccountCat[w.key]?.[acc]?.[cat]||0),0),0);});
    const top=Object.entries(totals).filter(([c])=>c!=="Salary"&&c!=="Card Repayment").sort((a,b)=>b[1]-a[1])[0];
    if(top)tips.push({icon:"📊",color:PURPLE,title:`Biggest: ${top[0]}`,body:`£${Math.round(top[1]).toLocaleString()} over ${actualWeeks.length} weeks.`,detail:`Your highest spend category is ${top[0]} at £${Math.round(top[1]).toLocaleString()} total over the past 6 weeks. That's roughly £${Math.round(top[1]/6).toLocaleString()} per week on average.`});
    categories.forEach(cat=>{if(cat==="Salary"||cat==="Card Repayment")return;const vals=actualWeeks.map(w=>accounts.reduce((s,acc)=>s+Math.abs(weeklyByAccountCat[w.key]?.[acc]?.[cat]||0),0));const avg=rollingAvg(vals),last=vals[vals.length-1];if(avg>0&&last>avg*1.8)tips.push({icon:"⚠️",color:"#f59e0b",title:`${cat} spike`,body:`Last week £${Math.round(last)} vs avg £${Math.round(avg)}.`,detail:`Your ${cat} spending last week (£${Math.round(last)}) was ${Math.round((last/avg-1)*100)}% above your 6-week average of £${Math.round(avg)}. Worth checking if there was a one-off purchase.`});});
    if(tips.length<2)tips.push({icon:"✅",color:"#10b981",title:"Looks stable",body:"No major anomalies detected.",detail:"Your spending patterns look consistent week-on-week. No unusual spikes or sudden changes in any category."});
    return tips.slice(0,4);
  },[transactions,categories,actualWeeks,accounts,weeklyByAccountCat]);

const tdAmt=(color,isForecast,bold)=>({padding:"7px 10px",textAlign:"right",fontSize:12,fontWeight:bold?700:400,color:color||"#374151",background:isForecast?"rgba(99,102,241,0.025)":undefined,borderRight:`1px solid ${isForecast?"#ebebf8":"#f0f0f0"}`,whiteSpace:"nowrap",fontVariantNumeric:"tabular-nums"});
  const tdTot=(isForecast)=>({padding:"7px 10px",textAlign:"right",fontSize:12,fontWeight:800,color:isForecast?"#6366f1":"#111827",background:isForecast?"rgba(99,102,241,0.08)":"#f4f4f8",borderLeft:"2px solid #e0e0f0",borderRight:"2px solid #e0e0f0",whiteSpace:"nowrap",fontVariantNumeric:"tabular-nums"});

  function LabelCell({label,account}){
    const tip=ROW_TOOLTIPS[label];
    return(
      <td style={{padding:"5px 12px",fontSize:12,fontWeight:600,whiteSpace:"nowrap",position:"relative",cursor:tip?"help":"default"}}
        onMouseEnter={e=>{if(tip){const r=e.currentTarget.getBoundingClientRect();setTooltip({text:tip,x:r.left,y:r.bottom+6});}}}
        onMouseLeave={()=>setTooltip(null)}>
        {label}
        {tip&&<span style={{marginLeft:4,fontSize:9,color:"#9ca3af",verticalAlign:"super"}}>?</span>}
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
    const rowColor=isIncome?"#f0fdf4":isRepayment?"#faf5ff":"#fff";
    const textColor=isIncome?"#059669":isRepayment?"#7c3aed":"#111827";
    return(
      <tr className="abound-row" style={{opacity:hidden?0.3:1,borderBottom:"1px solid #f3f4f6",background:rowColor,cursor:"default"}}>
        <td style={{padding:"5px 6px 5px 12px",fontSize:10,color:"#9ca3af",whiteSpace:"nowrap"}}>{account==="Main Account"?"Main":account.replace("Credit Card","CC")}</td>
        <td style={{padding:"5px 12px",fontSize:12,fontWeight:600,whiteSpace:"nowrap",color:textColor,cursor:"help",position:"relative"}}
          onMouseEnter={e=>{const tip=ROW_TOOLTIPS[cat];if(tip){const r=e.currentTarget.getBoundingClientRect();setTooltip({text:tip,x:r.left,y:r.bottom+6});}}}
          onMouseLeave={()=>setTooltip(null)}>
          {isIncome&&<span style={{fontSize:9,marginRight:4}}>▲</span>}
          {isRepayment&&<span style={{fontSize:9,marginRight:4}}>↔</span>}
          {cat}
          <span style={{marginLeft:4,fontSize:9,color:"#c4c4cc",verticalAlign:"super"}}>?</span>
        </td>
        {actuals.map((v,i)=><td key={i} style={tdAmt(v===0?"#d1d5db":isIncome?"#059669":isRepayment?"#7c3aed":"#374151",false)}>{fmtMoney(v)}</td>)}
        <td style={tdTot(false)}>{fmtMoney(totalAct)}</td>
        {forecasts.map((v,i)=>{const over=budget&&v>budget;return<td key={i} style={tdAmt(over?"#ef4444":v===0?"#d1d5db":isRepayment?"#7c3aed":PURPLE,true)}>{fmtMoney(v)}{over&&<span style={{fontSize:8}}>↑</span>}</td>;})}
        <td style={tdTot(true)}>{fmtMoney(totalFcst)}</td>
        <td style={{padding:"4px 8px",textAlign:"center"}}>
          {editingBudget===key
            ?<input autoFocus type="number" defaultValue={budget||""} onBlur={e=>{setBudgets(b=>({...b,[key]:+e.target.value}));setEditingBudget(null);}} style={{width:58,fontSize:11,border:`1px solid ${PURPLE}`,borderRadius:4,padding:"1px 4px"}}/>
            :<span onClick={()=>setEditingBudget(key)} style={{cursor:"pointer",fontSize:11,color:budget?PURPLE:"#d1d5db",borderBottom:"1px dashed currentColor"}}>{budget?`£${budget}`:"set"}</span>
          }
        </td>
        <td style={{padding:"3px 6px",textAlign:"center"}}>
          <button onClick={()=>setHiddenCats(s=>{const n=new Set(s);n.has(key)?n.delete(key):n.add(key);return n;})} style={{fontSize:9,padding:"1px 6px",borderRadius:4,border:"1px solid #e5e7eb",background:hidden?"#fef2f2":"#f9fafb",color:hidden?"#ef4444":"#9ca3af",cursor:"pointer"}}>
            {hidden?"show":"hide"}
          </button>
        </td>
      </tr>
    );
  }

  function AccountSection({account}){
    const isMainAcc=account==="Main Account";
    const incomeCats=isMainAcc?categories.filter(c=>c==="Salary"):[];
    const spendCatsLocal=categories.filter(c=>c!=="Salary"&&c!=="Card Repayment");
    const accActuals=actualWeeks.map(w=>spendCatsLocal.reduce((s,c)=>s+Math.abs(weeklyByAccountCat[w.key]?.[account]?.[c]||0),0));
    const accForecasts=forecastWeeks.map((_,i)=>spendCatsLocal.reduce((s,c)=>s+(forecastData[account]?.[c]?.[i]||0),0));
    const accIncome=actualWeeks.map(w=>categories.filter(c=>c==="Salary").reduce((s,c)=>s+Math.abs(weeklyByAccountCat[w.key]?.[account]?.[c]||0),0));
    const accIncomeForecasts=forecastWeeks.map((_,i)=>categories.filter(c=>c==="Salary").reduce((s,c)=>s+(forecastData[account]?.[c]?.[i]||0),0));
    const weeklyNetActual=actualWeeks.map((_,i)=>accIncome[i]-accActuals[i]);
    const weeklyNetForecast=forecastWeeks.map((_,i)=>accIncomeForecasts[i]-accForecasts[i]);
    const knownBalances=actualWeeks.map(w=>weekBalances[w.key]?.[account]??null);
    const runningBalances=Array(actualWeeks.length).fill(null);
    const firstKnownIdx=knownBalances.findIndex(b=>b!==null);
    if(firstKnownIdx!==-1){runningBalances[firstKnownIdx]=knownBalances[firstKnownIdx];for(let i=firstKnownIdx+1;i<actualWeeks.length;i++)runningBalances[i]=runningBalances[i-1]!==null?runningBalances[i-1]+weeklyNetActual[i-1]:null;for(let i=firstKnownIdx-1;i>=0;i--)runningBalances[i]=runningBalances[i+1]!==null?runningBalances[i+1]-weeklyNetActual[i]:null;}
    const lastActualBal=runningBalances.filter(b=>b!==null).slice(-1)[0]??null;
    const forecastBalances=Array(forecastWeeks.length).fill(null);
    if(lastActualBal!==null){forecastBalances[0]=lastActualBal+weeklyNetActual[actualWeeks.length-1];for(let i=1;i<forecastWeeks.length;i++)forecastBalances[i]=forecastBalances[i-1]+weeklyNetForecast[i-1];}
    const netFmt=v=>v===0?"-":v>0?`£${Math.round(v).toLocaleString()}`:`(£${Math.round(Math.abs(v)).toLocaleString()})`;
    return(
      <>
        <tr style={{background:"linear-gradient(90deg,#1a1740,#1e1b4b 40%,#231f5a)"}}>
          <td colSpan={2} style={{padding:"10px 16px",fontSize:11,fontWeight:800,color:"#c7d2fe",letterSpacing:"0.06em",textTransform:"uppercase"}}>
            <span style={{display:"inline-flex",alignItems:"center",gap:8}}>
              <span style={{width:3,height:14,borderRadius:2,background:"#6366f1",display:"inline-block"}}/>
              {account}
            </span>
          </td>
          {actualWeeks.map((_,i)=><td key={i} style={{background:"transparent",borderRight:"1px solid #2d2a6e"}}/>)}
          <td style={{borderLeft:"2px solid #2d2a6e",borderRight:"2px solid #2d2a6e"}}/>
          {forecastWeeks.map((_,i)=><td key={i} style={{background:"rgba(99,102,241,0.15)",borderRight:"1px solid #3730a3"}}/>)}
          <td style={{background:"rgba(99,102,241,0.15)",borderLeft:"2px solid #3730a3"}}/><td colSpan={2}/>
        </tr>
        <tr className="abound-row" style={{background:"#fafafe",borderBottom:"1px solid #ececf8"}}>
          <td style={{padding:"5px 6px 5px 12px",fontSize:10,color:"#9ca3af"}}/>
          <td style={{padding:"5px 12px",fontSize:11,fontWeight:700,color:"#374151",cursor:"help"}}
            onMouseEnter={e=>{const r=e.currentTarget.getBoundingClientRect();setTooltip({text:ROW_TOOLTIPS["Opening Balance"],x:r.left,y:r.bottom+6});}}
            onMouseLeave={()=>setTooltip(null)}>
            Opening Balance <span style={{fontSize:9,color:"#c4c4cc",verticalAlign:"super"}}>?</span>
          </td>
          {runningBalances.map((bal,i)=><td key={i} style={{padding:"5px 10px",textAlign:"right",fontSize:12,color:bal===null?"#d1d5db":bal>=0?"#059669":"#ef4444",fontVariantNumeric:"tabular-nums"}}>{bal!==null?fmtMoney(bal):"—"}</td>)}
          <td style={{borderLeft:"2px solid #e5e7eb",borderRight:"2px solid #e5e7eb",background:"#f9fafb"}}/>
          {forecastBalances.map((bal,i)=><td key={i} style={{padding:"5px 10px",textAlign:"right",fontSize:12,color:bal===null?"#d1d5db":bal>=0?"#059669":"#ef4444",background:"rgba(99,102,241,0.03)",fontVariantNumeric:"tabular-nums"}}>{bal!==null?fmtMoney(bal):"—"}</td>)}
          <td style={{borderLeft:"2px solid #e5e7eb",background:"rgba(99,102,241,0.02)"}}/><td/><td/>
        </tr>
        {incomeCats.map(cat=><CatRow key={cat} cat={cat} account={account}/>)}
        {spendCatsLocal.map(cat=><CatRow key={cat} cat={cat} account={account}/>)}
        <CatRow key="Card Repayment" cat="Card Repayment" account={account}/>
        <tr className="abound-row" style={{background:"#f0f0f8",borderBottom:"1px solid #ddddf0"}}>
          <td/><td style={{padding:"8px 12px",fontSize:11,fontWeight:800,color:"#374151",letterSpacing:"0.02em",cursor:"help"}}
            onMouseEnter={e=>{const r=e.currentTarget.getBoundingClientRect();setTooltip({text:ROW_TOOLTIPS["Total Spend"],x:r.left,y:r.bottom+6});}}
            onMouseLeave={()=>setTooltip(null)}>TOTAL SPEND <span style={{fontSize:9,color:"#c4c4cc",verticalAlign:"super"}}>?</span></td>
          {accActuals.map((v,i)=><td key={i} style={tdAmt("#111827",false,true)}>{fmtMoney(v)}</td>)}
          <td style={tdTot(false)}>{fmtMoney(accActuals.reduce((a,b)=>a+b,0))}</td>
          {accForecasts.map((v,i)=><td key={i} style={tdAmt(PURPLE,true,true)}>{fmtMoney(v)}</td>)}
          <td style={tdTot(true)}>{fmtMoney(accForecasts.reduce((a,b)=>a+b,0))}</td>
          <td/><td/>
        </tr>
        <tr className="abound-row" style={{background:"#f7f7fb",borderBottom:"2px solid #e2e2ef"}}>
          <td/><td style={{padding:"7px 12px",fontSize:11,fontWeight:800,color:"#6b7280",letterSpacing:"0.02em",cursor:"help"}}
            onMouseEnter={e=>{const r=e.currentTarget.getBoundingClientRect();setTooltip({text:ROW_TOOLTIPS["Net Movement"],x:r.left,y:r.bottom+6});}}
            onMouseLeave={()=>setTooltip(null)}>NET MOVEMENT <span style={{fontSize:9,color:"#c4c4cc",verticalAlign:"super"}}>?</span></td>
          {weeklyNetActual.map((v,i)=><td key={i} style={{padding:"5px 10px",textAlign:"right",fontSize:12,fontWeight:700,color:v>=0?"#059669":"#ef4444",fontVariantNumeric:"tabular-nums"}}>{netFmt(v)}</td>)}
          <td style={{...tdTot(false),color:weeklyNetActual.reduce((a,b)=>a+b,0)>=0?"#059669":"#ef4444"}}>{netFmt(weeklyNetActual.reduce((a,b)=>a+b,0))}</td>
          {weeklyNetForecast.map((v,i)=><td key={i} style={{padding:"5px 10px",textAlign:"right",fontSize:12,fontWeight:700,color:v>=0?"#059669":"#ef4444",background:"rgba(99,102,241,0.03)",fontVariantNumeric:"tabular-nums"}}>{netFmt(v)}</td>)}
          <td style={{...tdTot(true),color:weeklyNetForecast.reduce((a,b)=>a+b,0)>=0?"#059669":"#ef4444"}}>{netFmt(weeklyNetForecast.reduce((a,b)=>a+b,0))}</td>
          <td/><td/>
        </tr>
      </>
    );
  }

  const currentStep = tourStep!==null ? TOUR_STEPS[tourStep] : null;

  return(
    <div style={{display:"flex",flex:1,overflow:"hidden",position:"relative"}}>
      <style>{GLOBAL_CSS}</style>

      {/* Tooltip */}
      {tooltip&&(
        <div style={{position:"fixed",left:tooltip.x,top:tooltip.y,zIndex:9999,maxWidth:280,background:"#1e1b38",border:"1px solid #4338ca",borderRadius:8,padding:"8px 12px",fontSize:11,color:"#c7d2fe",lineHeight:1.5,pointerEvents:"none",animation:"tooltipIn 0.15s ease both",boxShadow:"0 4px 20px rgba(0,0,0,0.4)"}}>
          {tooltip.text}
        </div>
      )}

      {/* Tour spotlight overlay */}
      {tourVisible&&currentStep&&(
        <div style={{position:"fixed",inset:0,zIndex:1000,pointerEvents:"none"}}>
          <div style={{position:"absolute",inset:0,background:"rgba(8,7,15,0.55)",pointerEvents:"all"}} onClick={closeTour}/>
          {/* Tour card */}
          <div style={{position:"fixed",bottom:80,right:24,width:300,background:"#1e1b38",border:"1px solid #4338ca",borderLeft:"4px solid #6366f1",borderRadius:14,padding:"18px 20px",zIndex:1001,pointerEvents:"all",animation:"spotlightIn 0.35s cubic-bezier(0.16,1,0.3,1) both",boxShadow:"0 8px 40px rgba(0,0,0,0.5)"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10}}>
              <div>
                <div style={{fontSize:10,color:"#6366f1",fontWeight:700,letterSpacing:"0.08em",marginBottom:4}}>{tourStep===0?"✨ WELCOME":`STEP ${tourStep} OF ${TOUR_STEPS.length-1}`}</div>
                <div style={{fontSize:14,fontWeight:700,color:"#fff"}}>{currentStep.title}</div>
              </div>
              <button onClick={closeTour} style={{fontSize:16,color:"#4b5563",border:"none",background:"none",cursor:"pointer",marginLeft:8,lineHeight:1,flexShrink:0}}>×</button>
            </div>
            <p style={{fontSize:12,color:"#a1a1aa",lineHeight:1.6,margin:"0 0 16px"}}>{currentStep.body}</p>
            <div style={{display:"flex",gap:8}}>
              <button onClick={advanceTour}
                style={{flex:1,padding:"9px 14px",background:"#6366f1",color:"#fff",border:"none",borderRadius:8,fontSize:12,fontWeight:700,cursor:"pointer",transition:"all 0.15s"}}
                onMouseEnter={e=>e.target.style.background="#4f46e5"}
                onMouseLeave={e=>e.target.style.background="#6366f1"}>
                {currentStep.cta}
              </button>
              {currentStep.skip&&<button onClick={closeTour} style={{padding:"9px 12px",background:"none",color:"#4b5563",border:"1px solid #2d2a6e",borderRadius:8,fontSize:12,cursor:"pointer"}}>{currentStep.skip}</button>}
            </div>
            {/* Step dots */}
            {tourStep>0&&(
              <div style={{display:"flex",gap:4,justifyContent:"center",marginTop:12}}>
                {TOUR_STEPS.slice(1).map((_,i)=>(
                  <div key={i} style={{width:5,height:5,borderRadius:"50%",background:i===tourStep-1?"#6366f1":"#2d2a6e",transition:"background 0.2s"}}/>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Main table area */}
      <div style={{flex:1,overflow:"auto",padding:isMobile?"12px 16px":"20px 24px"}}>
        <div style={{display:isMobile?"grid":"flex",gridTemplateColumns:isMobile?"1fr 1fr":undefined,gap:isMobile?8:12,marginBottom:16,overflowX:isMobile?"auto":undefined}}>
          {[
            {label:"Transactions",value:transactions.length.toLocaleString(),sub:`${accounts.length} account${accounts.length>1?"s":""}`,color:PURPLE,accent:"#6366f1"},
            {label:"6-Wk Actual",value:`£${Math.round(totalActualByWeek.reduce((a,b)=>a+b,0)).toLocaleString()}`,sub:"real spend",color:"#10b981",accent:"#10b981"},
            {label:"6-Wk Forecast",value:`£${Math.round(totalForecastByWeek.reduce((a,b)=>a+b,0)).toLocaleString()}`,sub:"predicted ahead",color:"#6366f1",accent:"#6366f1"},
            {label:"Avg Weekly",value:`£${Math.round(totalActualByWeek.reduce((a,b)=>a+b,0)/Math.max(actualWeeks.length,1)).toLocaleString()}`,sub:"last 6 weeks",color:"#f59e0b",accent:"#f59e0b"},
          ].map((c,i)=>(
            <div key={i} style={{flex:1,background:"#fff",borderRadius:12,padding:"14px 18px",border:"1px solid #ebebf4",borderLeft:`3px solid ${c.accent}`,boxShadow:"0 1px 4px rgba(0,0,0,0.04)"}}>
              <div style={{fontSize:10,fontWeight:700,color:"#9ca3af",letterSpacing:"0.07em",marginBottom:6,textTransform:"uppercase"}}>{c.label}</div>
              <div style={{fontSize:24,fontWeight:800,color:c.color,fontVariantNumeric:"tabular-nums",letterSpacing:"-0.02em"}}>{c.value}</div>
              <div style={{fontSize:11,color:"#b0b0c0",marginTop:4}}>{c.sub}</div>
            </div>
          ))}
        </div>
        <div style={{background:"#fff",borderRadius:14,border:"1px solid #e5e7eb",overflow:"auto",WebkitOverflowScrolling:"touch"}}>
          <table style={{width:isMobile?"max-content":"100%",minWidth:isMobile?"900px":undefined,borderCollapse:"collapse"}}>
            <thead>
              <tr style={{background:"#1e1b4b"}}>
                 <th colSpan={2} style={{padding:"10px 12px",textAlign:"left",position:"sticky",left:0,zIndex:3,background:"#1e1b4b"}}>
                  <img src={logo} alt="" style={{height:22,verticalAlign:"middle",marginRight:8}}/>
                  <span style={{fontSize:13,fontWeight:800,color:"#fff",verticalAlign:"middle"}}>Cash Flow</span>
                </th>
                {actualWeeks.map(w=><th key={w.key} style={{padding:"8px 10px",fontSize:11,fontWeight:700,color:"#c7d2fe",textAlign:"right",background:"#1e1b4b",borderRight:"1px solid #2d2a6e",whiteSpace:"nowrap"}}>Actual</th>)}
                <th style={{padding:"8px 10px",fontSize:10,fontWeight:700,color:"#9ca3af",textAlign:"right",background:"#111827",borderLeft:"2px solid #374151",borderRight:"2px solid #374151",whiteSpace:"nowrap"}}>6WK</th>
                {forecastWeeks.map(w=><th key={w.key} style={{padding:"8px 10px",fontSize:11,fontWeight:700,color:"#a5b4fc",textAlign:"right",background:"#312e81",borderRight:"1px solid #3730a3",whiteSpace:"nowrap"}}>Forecast</th>)}
                <th style={{padding:"8px 10px",fontSize:10,fontWeight:700,color:"#a5b4fc",textAlign:"right",background:"#312e81",borderLeft:"2px solid #3730a3",whiteSpace:"nowrap"}}>FCST</th>
                <th style={{background:"#1e1b4b"}} colSpan={2}/>
              </tr>
              <tr style={{background:"#f8fafc"}}>
                <th colSpan={2} style={{padding:"5px 12px",position:"sticky",left:0,zIndex:3,background:"#f8fafc"}}/>
                {actualWeeks.map(w=><th key={w.key} style={{padding:"5px 10px",fontSize:11,fontWeight:700,color:"#374151",textAlign:"right",borderRight:"1px solid #efefef",whiteSpace:"nowrap"}}>{fmt(w.date)}</th>)}
                <th style={{background:"#f3f4f6",borderLeft:"2px solid #e5e7eb",borderRight:"2px solid #e5e7eb"}}/>
                {forecastWeeks.map(w=><th key={w.key} style={{padding:"5px 10px",fontSize:11,fontWeight:700,color:PURPLE,textAlign:"right",background:"rgba(99,102,241,0.05)",borderRight:"1px solid #e8e8f0",whiteSpace:"nowrap"}}>{fmt(w.date)}</th>)}
                <th style={{background:"rgba(99,102,241,0.05)",borderLeft:"2px solid #e5e7eb"}}/>
                <th style={{padding:"5px 8px",fontSize:10,fontWeight:700,color:"#9ca3af",textAlign:"center",whiteSpace:"nowrap"}}>BUDGET</th>
                <th/>
              </tr>
              <tr style={{background:"#f8fafc",borderBottom:"2px solid #e5e7eb"}}>
                <th colSpan={2} style={{padding:"2px 12px",position:"sticky",left:0,zIndex:3,background:"#f8fafc"}}/>
                {actualWeeks.map(w=><th key={w.key} style={{padding:"2px 10px 6px",fontSize:10,fontWeight:400,color:"#9ca3af",textAlign:"right",borderRight:"1px solid #efefef",whiteSpace:"nowrap"}}>{fmt(w.sunday)}</th>)}
                <th style={{background:"#f3f4f6",borderLeft:"2px solid #e5e7eb",borderRight:"2px solid #e5e7eb"}}/>
                {forecastWeeks.map(w=><th key={w.key} style={{padding:"2px 10px 6px",fontSize:10,fontWeight:400,color:"#9ca3af",textAlign:"right",background:"rgba(99,102,241,0.05)",borderRight:"1px solid #e8e8f0",whiteSpace:"nowrap"}}>{fmt(w.sunday)}</th>)}
                <th style={{background:"rgba(99,102,241,0.05)",borderLeft:"2px solid #e5e7eb"}}/><th/><th/>
              </tr>
            </thead>
            <tbody>
              {accounts.map(acc=><AccountSection key={acc} account={acc}/>)}
              {/* Closing Balance row */}
              <tr style={{background:"linear-gradient(90deg,#0f0e1a,#111827 40%,#0f0e1a)"}}>
                <td colSpan={2} style={{padding:"11px 16px",fontSize:12,fontWeight:800,color:"#6366f1",letterSpacing:"0.04em",cursor:"help"}}
                  onMouseEnter={e=>{const r=e.currentTarget.getBoundingClientRect();setTooltip({text:ROW_TOOLTIPS["Closing Balance"],x:r.left,y:r.bottom+6});}}
                  onMouseLeave={()=>setTooltip(null)}>
                  CLOSING BALANCE <span style={{fontSize:9,color:"#4338ca",verticalAlign:"super",marginLeft:2}}>?</span>
                </td>
                {combinedClosingBalances.actual.map((v,i)=>(
                  <td key={i} style={{padding:"9px 10px",textAlign:"right",fontSize:13,fontWeight:800,color:v===null?"#374151":v>=0?"#10b981":"#ef4444",borderRight:"1px solid #1f1d35",fontVariantNumeric:"tabular-nums",background:v!==null&&v>=0?"rgba(16,185,129,0.07)":v!==null?"rgba(239,68,68,0.07)":"transparent"}}>
                    {v===null?"—":fmtMoney(v)}
                  </td>
                ))}
                <td style={{padding:"9px 10px",background:"#080712",borderLeft:"2px solid #2d2a6e",borderRight:"2px solid #2d2a6e"}}/>
                {combinedClosingBalances.forecast.map((v,i)=>(
                  <td key={i} style={{padding:"9px 10px",textAlign:"right",fontSize:13,fontWeight:800,color:v===null?"#4b5563":v>=0?"#10b981":"#ef4444",background:v!==null&&v>=0?"rgba(16,185,129,0.1)":"rgba(99,102,241,0.12)",borderRight:"1px solid #2d2a6e",fontVariantNumeric:"tabular-nums"}}>
                    {v===null?"—":fmtMoney(v)}
                  </td>
                ))}
                <td style={{background:"rgba(99,102,241,0.12)",borderLeft:"2px solid #2d2a6e"}}/>
                <td style={{background:"#0f0e1a"}} colSpan={2}/>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* AI Advisor sidebar */}
      <div style={{width:aiOpen?288:44,flexShrink:0,background:"#fff",borderLeft:"1px solid #e5e7eb",transition:"width 0.3s cubic-bezier(0.16,1,0.3,1)",overflow:"hidden",display:"flex",flexDirection:"column",position:"relative"}}>
        {/* Gradient top border */}
        <div style={{position:"absolute",top:0,left:0,right:0,height:1,background:"linear-gradient(90deg,#6366f1,#8b5cf6,transparent)",pointerEvents:"none"}}/>
        <button onClick={()=>setAiOpen(p=>!p)} style={{display:"flex",alignItems:"center",gap:8,padding:"14px",border:"none",background:"none",cursor:"pointer",borderBottom:"1px solid #f3f4f6",color:PURPLE,fontWeight:700,fontSize:13,whiteSpace:"nowrap",flexShrink:0}}>
          <span style={{fontSize:15}}>🤖</span>
          {aiOpen&&<span style={{flex:1,textAlign:"left"}}>AI Advisor</span>}
          <span style={{fontSize:10,color:"#9ca3af"}}>{aiOpen?"›":"‹"}</span>
        </button>
        {aiOpen&&(
          <div style={{padding:14,display:"flex",flexDirection:"column",gap:10,overflow:"auto",flex:1}}>
            <div style={{fontSize:10,color:"#9ca3af",fontWeight:700,letterSpacing:0.8}}>INSIGHTS</div>
            {aiTyping?(
              <div style={{display:"flex",gap:5,padding:"12px 14px",background:"#fafafa",borderRadius:10,alignItems:"center"}}>
                {[0,1,2].map(i=>(
                  <div key={i} style={{width:6,height:6,borderRadius:"50%",background:"#6366f1",animation:`typingDot 1.2s ease-in-out ${i*180}ms infinite`}}/>
                ))}
              </div>
            ):(
              insights.map((ins,i)=>(
                <div key={i} style={{background:"#fafafa",borderRadius:10,borderLeft:`3px solid ${ins.color}`,overflow:"hidden",transition:"all 0.2s",animation:`fadeUp 0.4s ease ${i*120}ms both`}}>
                  <div style={{padding:"11px 14px",cursor:"pointer",display:"flex",gap:7,alignItems:"center"}} onClick={()=>setAiExpanded(aiExpanded===i?null:i)}>
                    <span style={{fontSize:14}}>{ins.icon}</span>
                    <span style={{fontSize:12,fontWeight:700,flex:1}}>{ins.title}</span>
                    <span style={{fontSize:10,color:"#9ca3af"}}>{aiExpanded===i?"▲":"▼"}</span>
                  </div>
                  <div style={{padding:aiExpanded===i?"0 14px 12px":"0 14px",maxHeight:aiExpanded===i?200:40,overflow:"hidden",transition:"all 0.3s ease"}}>
                    <p style={{fontSize:11,color:"#6b7280",margin:0,lineHeight:1.6}}>{ins.body}</p>
                    {aiExpanded===i&&ins.detail&&<p style={{fontSize:11,color:"#9ca3af",margin:"8px 0 0",lineHeight:1.6,borderTop:"1px solid #f3f4f6",paddingTop:8}}>{ins.detail}</p>}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

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
  const [rawTransactions, setRawTransactions] = useState([]);
  const [multipleAccounts, setMultipleAccounts] = useState(false);
  const [categorisedTransactions, setCategorisedTransactions] = useState([]);
  const [sortedTransactions, setSortedTransactions] = useState([]);
  const [finalCategories, setFinalCategories] = useState([]);
  const bg = screen==="hero"||screen==="upload"||screen==="sort"||screen==="session-complete" ? "#08070f" : "#f8fafc";
  return (
    <div style={{fontFamily:"'Inter',system-ui,sans-serif",background:bg,minHeight:"100vh"}}>
      <style>{GLOBAL_CSS}</style>
      {screen==="hero"&&<HeroScreen onEnter={()=>setScreen("upload")}/>}
      {screen==="upload"&&<UploadScreen onDone={(txns,multi)=>{setRawTransactions(txns);setMultipleAccounts(multi);setScreen("categorise");}}/>}
      {screen==="categorise"&&<CategoriseScreen transactions={rawTransactions} multipleAccounts={multipleAccounts} onDone={(txns,cats)=>{setCategorisedTransactions(txns);setFinalCategories(cats);setScreen("sort");}}/>}
      {screen==="sort"&&<SortScreen transactions={categorisedTransactions} categories={finalCategories} onDone={(txns,cats)=>{setSortedTransactions(txns);setFinalCategories(cats);setScreen("main");}}/>}
      {screen==="main"&&<MainScreen transactions={sortedTransactions} categories={finalCategories} onStartOver={()=>setScreen("session-complete")}/>}
      {screen==="session-complete"&&<SessionCompleteScreen txnCount={sortedTransactions.length} onRestart={()=>{setScreen("hero");setRawTransactions([]);setSortedTransactions([]);setCategorisedTransactions([]);setFinalCategories([]);}}/>}
    </div>
  );
}
