import { useState, useEffect, useMemo, useRef } from "react";
import * as XLSX from "xlsx";
import logo from "./logo.png";

const DEFAULT_CATEGORIES = ["Food", "Travel", "Rent", "Memberships", "Salary", "Other Payments"];
const INTERCOMPANY_CATEGORY = "Card Repayment";
const PURPLE = "#6366f1";
const CATEGORY_COLORS = ["#10b981","#3b82f6","#f59e0b","#8b5cf6","#059669","#6366f1","#ec4899","#14b8a6","#f97316","#ef4444"];
const ACCOUNT_LABELS = { 0:"Main Account", 1:"Credit Card 1", 2:"Credit Card 2", 3:"Credit Card 3" };

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
    "eden","jimmys","patty","shake shack","five guys","byron","honest"
  ],
  Travel: [
    "tfl","transport for london","oyster","citymapper",
    "uber","bolt","ola","free now","addison lee","black cab",
    "trainline","lner","gwr","avanti","southeastern","southern","thameslink","c2c","chiltern",
    "eurostar","national rail","rail","greater anglia","crosscountry","transpennine","northern",
    "ryanair","easyjet","british airways","ba.com","lufthansa","klm","air france","wizz",
    "jet2","virgin atlantic","emirates","qatar","turkish airlines","norwegian",
    "heathrow express","gatwick express","stansted express","luton",
    "enterprise","hertz","avis","budget","zipcar","enterprise car","sixt",
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
    "storage","big yellow","safestore","access storage","shurgard","thames water","severn trent","anglian water","yorkshire water","united utilities","southern water",
"british gas","eon","e.on","edf","octopus","bulb","ovo","npower","scottish power","sse",
"virgin media","bt ","sky ","talktalk","vodafone","o2 ","three ","ee ",
"council tax","rates","water rates","tv licence","broadband"
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

  // Excel serial number
  if (typeof val === "number") {
    const excelEpoch = new Date(1899, 11, 30);
    const d = new Date(excelEpoch.getTime() + val * 86400000);
    if (d.getFullYear() >= 2000) return d;
    return null;
  }

  if (val instanceof Date) {
    if (!isNaN(val) && val.getFullYear() >= 2000) return val;
    return null;
  }

  const s = String(val).trim();

  const mo = {
    Jan:0,Feb:1,Mar:2,Apr:3,May:4,Jun:5,
    Jul:6,Aug:7,Sep:8,Oct:9,Nov:10,Dec:11
  };

  const m1 = s.match(/^(\d{1,2})-([A-Za-z]{3})-(\d{2})$/);
  if (m1) return new Date(2000 + parseInt(m1[3]), mo[m1[2]], parseInt(m1[1]));

  const m2 = s.match(/^(\d{1,2})-([A-Za-z]{3})-(\d{4})$/);
  if (m2) return new Date(parseInt(m2[3]), mo[m2[2]], parseInt(m2[1]));

  const m3 = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (m3) return new Date(parseInt(m3[3]), parseInt(m3[2]) - 1, parseInt(m3[1]));

  const m4 = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (m4) return new Date(parseInt(m4[1]), parseInt(m4[2]) - 1, parseInt(m4[3]));

  const m5 = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2})$/);
  if (m5) return new Date(2000 + parseInt(m5[3]), parseInt(m5[2]) - 1, parseInt(m5[1]));

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
function fmtMoney(v){if(v===0 || v===null || v===undefined) return "-";const n = Math.round(v);if(n < 0){return `(${Math.abs(n).toLocaleString()})`;}return n.toLocaleString();
}
function rollingAvg(vals) { const nz=vals.filter(v=>v>0); return nz.length?Math.round(nz.reduce((a,b)=>a+b,0)/nz.length):0; }

function readExcelFile(file) {
  return new Promise(resolve => {
    const reader = new FileReader();
    const ext = file.name.split('.').pop().toLowerCase();

    reader.onload = e => {
      try {
        // Read workbook
        const wb = ext === "csv"
          ? XLSX.read(e.target.result, { type: "string" })
          : XLSX.read(e.target.result, { type: "array" });

        const sheet = wb.Sheets[wb.SheetNames[0]];
        const allRows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "", raw: true });

        // Look for header row
        let headerRowIndex = 0;
        const headerKeywords = {
          date: /date/i,
          description: /(description|narrative|reference|details|merchant|payee)/i,
          amount: /(amount|value|debit|credit|trans)/i
        };

        for (let i = 0; i < Math.min(allRows.length, 15); i++) {
          const row = allRows[i];
          const matches = {
            date: row.some(c => headerKeywords.date.test(String(c))),
            description: row.some(c => headerKeywords.description.test(String(c))),
            amount: row.some(c => headerKeywords.amount.test(String(c)))
          };
          if (matches.date && matches.description && matches.amount) {
            headerRowIndex = i;
            break;
          }
        }

        const headerRow = allRows[headerRowIndex].map(h => String(h).trim());
        let dateKey, descKey, amtKey;
        headerRow.forEach((h,i) => {
          if (!dateKey && headerKeywords.date.test(h)) dateKey = h;
          if (!descKey && headerKeywords.description.test(h)) descKey = h;
          if (!amtKey && headerKeywords.amount.test(h)) amtKey = h;
        });

        if (!dateKey || !descKey || !amtKey) {
          console.warn("Could not find all required columns (Date/Description/Amount)");
          resolve([]);
          return;
        }

        // Build objects
        const dataRows = allRows.slice(headerRowIndex + 1)
          .filter(r => r.some(c => c !== "" && c !== null))
          .map(r => {
            return {
              [dateKey]: r[headerRow.indexOf(dateKey)],
              [descKey]: r[headerRow.indexOf(descKey)],
              [amtKey]: r[headerRow.indexOf(amtKey)]
            };
          });

        resolve(dataRows);

      } catch (err) {
        console.error("Error reading file:", err);
        resolve([]);
      }
    };

    if (ext === "csv") reader.readAsText(file);
    else reader.readAsArrayBuffer(file);
  });
}

function normaliseRows(rows, accountLabel) {
  if (!rows.length) return [];

  const keys = Object.keys(rows[0]);
  const isMainAccount = accountLabel === "Main Account";

  const dateKey = keys.find(k => /^date$/i.test(k.trim())) || keys.find(k => /date/i.test(k));
  const narKey = keys.find(k => /^description$/i.test(k.trim())) || keys.find(k => /^narrative$/i.test(k.trim())) || keys.find(k => /desc|narr|merchant|payee|detail|ref/i.test(k));
  const amtKey = keys.find(k => /^amount$/i.test(k.trim())) || keys.find(k => /^value$/i.test(k.trim())) || keys.find(k => /^trans$/i.test(k.trim())) || keys.find(k => /amount|value|trans|spend|debit/i.test(k) && !/balance|date|extended|statement/i.test(k));
  const balKey = keys.find(k => /^balance$/i.test(k.trim()));

  if (!dateKey || !narKey || !amtKey) {
    console.error(`[${accountLabel}] Missing columns`);
    return [];
  }

  return rows.map(row => {
    const date = parseDate(row[dateKey]);
    const rawAmt = Number(String(row[amtKey]).replace(/[£,]/g,"")) || 0;
    const amount = Math.abs(rawAmt);
    const narrative = String(row[narKey] || "").replace(/\r\n|\r|\n/g," ").trim();
    const balance = balKey ? (Number(String(row[balKey]).replace(/[£,]/g,"")) || null) : null;

    if (!date || !narrative || rawAmt === 0) return null;

    let isIncome = false;
    let spendAmt = amount;

    if (isMainAccount) {
  isIncome = rawAmt > 0;
} else {
  // Credit card: negative = repayment (treat as income), positive = spend
  isIncome = rawAmt < 0;
  spendAmt = Math.abs(rawAmt);
}

    return {
      date,
      narrative,
      amount: spendAmt,
      isIncome,
      balance,
      account: accountLabel,
      category: null
    };
  }).filter(Boolean);
}

async function smartCategorise(transactions, userCategories, multipleAccounts, onProgress) {
  const allCats = multipleAccounts
    ? [...userCategories.filter(c=>c!==INTERCOMPANY_CATEGORY), INTERCOMPANY_CATEGORY]
    : userCategories;
  const withLookup = transactions.map(t => {
    if (t.isIncome && t.account === "Main Account") {
  return {...t, category: "Salary"};
}
if (t.isIncome && t.account !== "Main Account") {
  return {...t, category: "Card Repayment"};
}
    const cat = merchantLookup(t.narrative);
    return {...t, category: cat || null};
  });
  const known = withLookup.filter(t => t.category !== null);
  const unknown = withLookup.filter(t => t.category === null);
  onProgress({type:"lookup_done", known:known.length, unknown:unknown.length, pct:30});
  if (unknown.length === 0) { onProgress({type:"done"}); return withLookup; }
  const apiKey = import.meta.env.VITE_ANTHROPIC_KEY;
  if (!apiKey||!apiKey.startsWith("sk-")) {
    onProgress({type:"done"});
    return withLookup.map(t=>({...t, category: t.category||"Other Payments"}));
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
    console.log("Sending to Claude:", lines.slice(0, 500));
    const prompt = `You are a UK personal finance assistant categorising bank transactions. You are expert at reading raw bank narrative strings which contain merchant names, location codes, currency info, and transaction type codes.

Transaction type codes you may see: CD = card purchase, DD = direct debit, SO = standing order, POS = card purchase, FP/BACS = incoming payment, BGC = bank giro credit, ATM = cash withdrawal, CHG = charge/fee, INT = interest.

Categories available: ${cats}

Rules:
- Identify the merchant or purpose in the narrative (ignore dates, amounts, currency codes, location codes, reference numbers)
- TFL, Transport for London, TFL.GOV.UK, Oyster, Citymapper, Uber, Bolt, Ola, Trainline, National Rail, any airline, any train operator, parking, fuel/petrol station = "Travel"
- Any supermarket, grocery store, restaurant, cafe, pub, takeaway, food delivery service = "Food"
- Albert Heijn, Jumbo, Tesco, Sainsbury, Waitrose, Lidl, Aldi, Carrefour, Rewe, Edeka, Mercadona = "Food"
- Netflix, Spotify, Apple, Amazon Prime, Disney+, any gym, any streaming service, any recurring subscription = "Memberships"
- Direct debits to energy/water/broadband/phone/council tax providers = "Rent"
- Rent payments, mortgage payments = "Rent"
- Salary, wages, payroll, income credits, BACS credits = "Salary"
- ATM or cash withdrawals = "Other Payments"
- Standing orders or direct debits with no identifiable merchant = "Other Payments"
${multipleAccounts ? `- Payments referencing credit card names or account repayments = "${INTERCOMPANY_CATEGORY}"` : ""}
- When unsure, pick the most likely category based on the merchant name alone

Transactions to categorise (index: full narrative | amount):
${lines}

Respond ONLY with a JSON array of ${batch.length} category strings in order. No explanation, no markdown, just the array.`;
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
      claudeResults.push(...batch.map((t,j)=>({...t, category: allCats.includes(parsed[j])?parsed[j]:"Other Payments"})));
    } catch(err) {
      console.error("Claude batch failed:", err.message);
      claudeResults.push(...batch.map(t=>({...t,category:"Other Payments"})));
    }
  }
  onProgress({type:"done"});
  const claudeMap = new Map(claudeResults.map(t=>[t.narrative+t.date+t.amount, t.category]));
  return withLookup.map(t=>{
    if (t.category !== null) return t;
    return {...t, category: claudeMap.get(t.narrative+t.date+t.amount)||"Other Payments"};
  });
}

function LoadingScreen({pct, message, done}) {
  return (
    <div style={{minHeight:"100vh",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",background:"#0f0e1a",padding:40}}>
      <img src={logo} alt="Abound" style={{height:64,marginBottom:40}}/>
      {done?(
        <div style={{textAlign:"center"}}>
          <div style={{fontSize:48,marginBottom:16}}>✅</div>
          <div style={{fontSize:22,fontWeight:800,color:"#fff",marginBottom:8}}>All categorised.</div>
          <div style={{fontSize:14,color:"#6b7280"}}>Review your spending breakdown...</div>
        </div>
      ):(
        <div style={{width:"100%",maxWidth:420,textAlign:"center"}}>
          <div style={{fontSize:18,fontWeight:700,color:"#fff",marginBottom:8}}>{message||"Analysing your transactions..."}</div>
          <div style={{fontSize:13,color:"#4b5563",marginBottom:32}}>Smart lookup first, then Claude handles the rest</div>
          <div style={{height:6,background:"#1f1d35",borderRadius:999,overflow:"hidden",marginBottom:12}}>
            <div style={{height:"100%",width:`${pct}%`,background:"linear-gradient(90deg,#6366f1,#8b5cf6,#06b6d4)",borderRadius:999,transition:"width 0.6s ease"}}/>
          </div>
          <div style={{fontSize:12,color:"#6366f1",fontWeight:700}}>{pct}%</div>
          <div style={{marginTop:40,display:"flex",gap:6,justifyContent:"center"}}>
            {[0,1,2].map(i=>(
              <div key={i} style={{width:8,height:8,borderRadius:"50%",background:"#6366f1",opacity:0.3+(i*0.25),animation:`pulse 1.4s ease-in-out ${i*0.2}s infinite`}}/>
            ))}
          </div>
        </div>
      )}
      <style>{`@keyframes pulse{0%,100%{transform:scale(1);opacity:0.3}50%{transform:scale(1.4);opacity:1}}`}</style>
    </div>
  );
}

function UploadScreen({ onDone }) {
  const [accounts, setAccounts] = useState([{ id: 1, file: null, name: "" }]);
  const [loading, setLoading] = useState(false);

  const addCard = () =>
    setAccounts(a => [...a, { id: Date.now(), file: null, name: "" }]);

  const removeAccount = id =>
    setAccounts(a => a.filter(acc => acc.id !== id));

  const handleFile = async (id, file) => {
    setAccounts(a =>
      a.map(acc => (acc.id === id ? { ...acc, file, name: file.name } : acc))
    );
  };

  const handleContinue = async () => {
    setLoading(true);
    const allRows = [];
    let mainAssigned = false;

    for (const acc of accounts) {
      if (!acc.file) continue;
      const rows = await readExcelFile(acc.file);
      const ccIndex = accounts.filter(a => a.file).indexOf(acc);
const label = !mainAssigned ? "Main Account" : ccIndex === 1 ? "Credit Card" : `Credit Card ${ccIndex}`;
      mainAssigned = true;
      allRows.push(...normaliseRows(rows, label));
    }

    setLoading(false);
    onDone(allRows, accounts.length > 1);
  };

  const DropZone = ({ account, index }) => {
    const [dragging, setDragging] = useState(false);
    const loaded = !!account.file;

    const onDrop = e => {
      e.preventDefault();
      setDragging(false);
      const file = e.dataTransfer?.files?.[0] || e.target.files?.[0];
      if (file) handleFile(account.id, file);
    };

    const labelText = index === 0 ? "Main Account" : `Credit Card ${index}`;

    return (
      <label
        onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        style={{
          display: "block",
          border: loaded ? `2px solid ${PURPLE}` : `2px dashed ${dragging ? PURPLE : "#374151"}`,
          borderRadius: 12,
          padding: "22px 20px",
          cursor: "pointer",
          background: loaded ? "rgba(99,102,241,0.08)" : dragging ? "rgba(99,102,241,0.04)" : "rgba(255,255,255,0.03)",
          transition: "all 0.2s"
        }}
      >
        <input type="file" accept=".xlsx,.xls,.csv" onChange={onDrop} style={{ display: "none" }} />
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 24, marginBottom: 8 }}>{loaded ? "✅" : "📂"}</div>
          <div style={{ fontSize: 13, fontWeight: 700, color: loaded ? "#a5b4fc" : "#e5e7eb" }}>
            {loaded ? account.name : `Drop ${labelText} statement here`}
          </div>
          <div style={{ fontSize: 11, color: "#6b7280", marginTop: 4 }}>
            {loaded ? "Ready to go" : "Excel or CSV · drag & drop or click"}
          </div>
        </div>
      </label>
    );
  };

  const hasMainFile = !!accounts[0].file;

  return (
    <div style={{ minHeight: "100vh", background: "#0f0e1a", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 24px" }}>
      <div style={{ width: "100%", maxWidth: 480 }}>
        {accounts.map((acc, i) => (
          <DropZone key={acc.id} account={acc} index={i} />
        ))}
        <button onClick={addCard} style={{ marginTop: 12, width: "100%", padding: "11px", border: "1.5px dashed #374151", borderRadius: 10, background: "none", color: "#6b7280", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
          + Add a credit card
        </button>
        <button
          onClick={handleContinue}
          disabled={!hasMainFile || loading}
          style={{
            marginTop: 12,
            width: "100%",
            padding: "14px",
            background: hasMainFile ? "linear-gradient(135deg,#10b981,#059669)" : "#1f1d35",
            color: hasMainFile ? "#fff" : "#374151",
            border: "none",
            borderRadius: 12,
            fontSize: 15,
            fontWeight: 800,
            cursor: hasMainFile ? "pointer" : "not-allowed",
            transition: "all 0.3s",
            boxShadow: hasMainFile ? "0 4px 20px rgba(16,185,129,0.3)" : "none"
          }}
        >
          {loading ? "Reading files..." : "Continue →"}
        </button>
      </div>
    </div>
  );
}

function CategoriseScreen({ transactions, multipleAccounts, onDone }) {
  const [pct, setPct] = useState(5);
  const [message, setMessage] = useState("Matching merchants...");
  const [done, setDone] = useState(false);
  const [categorised, setCategorised] = useState([]);
  const baseCats = multipleAccounts ? [...DEFAULT_CATEGORIES.filter(c => c !== INTERCOMPANY_CATEGORY), INTERCOMPANY_CATEGORY] : DEFAULT_CATEGORIES;
  const [categories, setCategories] = useState(baseCats);
  const [newCat, setNewCat] = useState("");
  const [editingCat, setEditingCat] = useState(null);
  const [editVal, setEditVal] = useState("");
  const [step, setStep] = useState("loading");

  useEffect(() => {
    (async () => {
      const result = await smartCategorise(transactions, DEFAULT_CATEGORIES, multipleAccounts, update => {
        if (update?.type === "lookup_done") {
          setPct(30);
          setMessage(`Matched ${update.known} transactions — asking Claude about ${update.unknown} more...`);
        } else if (update?.type === "progress") {
          setPct(update.pct);
          setMessage(`Claude is reading batch ${update.batchNum} of ${update.totalBatches}...`);
        } else if (update?.type === "done") {
          setPct(100);
          setMessage("All done ✓");
        }
      });
      setCategorised(result);
      setDone(true);
      setTimeout(() => setStep("review"), 1200);
    })();
  }, [transactions, multipleAccounts]);

  const summary = useMemo(() => {
    const totals = {};
    categories.forEach(c => { totals[c] = 0; });
    const now = new Date();
    const cutoff = new Date(now);
    cutoff.setDate(now.getDate() - 30);
    const recent = categorised.filter(t => t.date >= cutoff);
    const use = recent.length > 20 ? recent : categorised;
    use.forEach(t => { totals[t.category] = (totals[t.category] || 0) + t.amount; });
    return totals;
  }, [categorised, categories]);

  const addCategory = () => {
    const trimmed = newCat.trim();
    if (!trimmed || categories.includes(trimmed)) return;
    setCategories(c => [...c, trimmed]);
    setNewCat("");
  };

  const removeCategory = cat => {
    if (baseCats.includes(cat)) return;
    setCategories(c => c.filter(x => x !== cat));
    setCategorised(t => t.map(tx => tx.category === cat ? { ...tx, category: "Other Payments" } : tx));
  };

  const saveRename = () => {
    if (!editVal.trim()) return;
    const old = editingCat;
    setCategories(c => c.map(x => x === old ? editVal : x));
    setCategorised(t => t.map(tx => tx.category === old ? { ...tx, category: editVal } : tx));
    setEditingCat(null);
  };

  if (step === "loading") return <LoadingScreen pct={pct} message={message} done={done} />;

  return (
    <div style={{ maxWidth: 680, margin: "40px auto", padding: "0 24px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 28 }}>
        <img src={logo} alt="Abound" style={{ height: 44 }} />
        <div>
          <div style={{ fontSize: 22, fontWeight: 800, color: "#111827" }}>Your spending breakdown</div>
          <div style={{ fontSize: 13, color: "#6b7280" }}>{categorised.length} transactions categorised · tweak anything below</div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 28 }}>
        {categories.map((cat, i) => (
          <div key={cat} style={{ background: "#fff", borderRadius: 12, padding: "14px 16px", border: "1px solid #e5e7eb", borderLeft: `4px solid ${CATEGORY_COLORS[i % CATEGORY_COLORS.length]}` }}>
            <div style={{ fontSize: 11, color: "#6b7280", fontWeight: 600, marginBottom: 4 }}>{cat}</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: summary[cat] === 0 ? "#d1d5db" : "#111827" }}>
              {summary[cat] === 0 ? "£0" : `£${Math.round(summary[cat]).toLocaleString()}`}
            </div>
            <div style={{ fontSize: 10, color: "#9ca3af", marginTop: 2 }}>last 30 days</div>
          </div>
        ))}
      </div>

      <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e5e7eb", overflow: "hidden", marginBottom: 20 }}>
        <div style={{ padding: "12px 16px", borderBottom: "1px solid #f3f4f6", fontSize: 11, fontWeight: 700, color: "#9ca3af", letterSpacing: 1 }}>CATEGORIES</div>
        {categories.map((cat, i) => (
          <div key={cat} style={{ display: "flex", alignItems: "center", padding: "10px 16px", borderBottom: "1px solid #f3f4f6", gap: 10 }}>
            <span style={{ width: 10, height: 10, borderRadius: "50%", background: CATEGORY_COLORS[i % CATEGORY_COLORS.length], flexShrink: 0 }} />
            {editingCat === cat ? (
              <input
                autoFocus
                value={editVal}
                onChange={e => setEditVal(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") saveRename(); if (e.key === "Escape") setEditingCat(null); }}
                style={{ flex: 1, fontSize: 13, border: `1px solid ${PURPLE}`, borderRadius: 6, padding: "3px 8px" }}
              />
            ) : (
              <span style={{ flex: 1, fontSize: 13, fontWeight: 600 }}>{cat}</span>
            )}
            {editingCat === cat ? (
              <button onClick={saveRename} style={{ fontSize: 11, color: PURPLE, border: "none", background: "none", cursor: "pointer", fontWeight: 700 }}>Save</button>
            ) : (
              <button onClick={() => { setEditingCat(cat); setEditVal(cat); }} style={{ fontSize: 11, color: "#9ca3af", border: "none", background: "none", cursor: "pointer" }}>rename</button>
            )}
            <button
              onClick={() => removeCategory(cat)}
              style={{ fontSize: 18, color: baseCats.includes(cat) ? "#e5e7eb" : "#9ca3af", border: "none", background: "none", cursor: baseCats.includes(cat) ? "not-allowed" : "pointer" }}
            >−</button>
          </div>
        ))}
        <div style={{ display: "flex", gap: 8, padding: "10px 16px" }}>
          <input
            value={newCat}
            onChange={e => setNewCat(e.target.value)}
            onKeyDown={e => e.key === "Enter" && addCategory()}
            placeholder="Add a custom category..."
            style={{ flex: 1, fontSize: 13, border: "1px solid #e5e7eb", borderRadius: 8, padding: "7px 12px" }}
          />
          <button onClick={addCategory} style={{ padding: "7px 16px", background: PURPLE, color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>+</button>
        </div>
      </div>

      <button onClick={() => onDone(categorised, categories)} style={{ width: "100%", padding: "14px", background: PURPLE, color: "#fff", border: "none", borderRadius: 12, fontSize: 15, fontWeight: 800, cursor: "pointer" }}>
        Sort remaining transactions →
      </button>
    </div>
  );
}

// ─── SCREEN 3: Drag & Drop Sort ─────────────────────────────────────────────
function SortScreen({transactions, categories: initialCategories, onDone}) {
  const allItems = useMemo(()=>
    transactions
      .filter(t=>t.category==="Other Payments")
      .reduce((acc,t)=>{
        const ex=acc.find(x=>x.narrative===t.narrative);
        if(ex){ex.total+=t.amount;ex.count+=1;}
        else acc.push({narrative:t.narrative,total:t.amount,count:1,category:"Other Payments"});
        return acc;
      },[])
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
  useEffect(()=>{
    const handler=()=>setWindowWidth(window.innerWidth);
    window.addEventListener("resize",handler);
    return ()=>window.removeEventListener("resize",handler);
  },[]);
  const isMobileView = windowWidth < 768;

  const VISIBLE = 5;
  const unsorted = items.filter(i=>i.category==="Other Payments");
  const sorted   = items.filter(i=>i.category!=="Other Payments"&&i.category!=="Skip");
  const skipped  = items.filter(i=>i.category==="Skip");
  const visible  = unsorted.slice(0, VISIBLE);
  const spendCats = categories.filter(c=>c!=="Salary"&&c!=="Other Payments");
  const allBuckets = [...spendCats, "Skip"];

  const CAT_COLORS = {"Food":"#10b981","Travel":"#3b82f6","Rent":"#f59e0b","Memberships":"#8b5cf6","Card Repayment":"#ec4899"};
  function catColor(cat,i){ return CAT_COLORS[cat]||CATEGORY_COLORS[i%CATEGORY_COLORS.length]||"#6366f1"; }

  function assignItem(narrative, cat) {
    if (cat!=="Skip") setBucketCounts(p=>({...p,[cat]:(p[cat]||0)+1}));
    setItems(p=>p.map(x=>x.narrative===narrative?{...x,category:cat}:x));
    setSwipeOffset(0); setSwipeTarget(null);
  }

  function dropIntoCat(cat) {
    const narrative = dragRef.current;
    if (!narrative) return;
    assignItem(narrative, cat);
    dragRef.current = null;
    setHoveredCat(null);
  }

  function undoItem(narrative, fromCat) {
    if (fromCat!=="Skip") setBucketCounts(p=>({...p,[fromCat]:Math.max(0,(p[fromCat]||1)-1)}));
    setItems(p=>p.map(x=>x.narrative===narrative?{...x,category:"Other Payments"}:x));
  }

  function addCategory() {
    const t=newCat.trim(); if(!t||categories.includes(t)) return;
    setCategories(c=>[...c,t]); setNewCat(""); setShowAddCat(false);
  }

  function removeCategory(cat) {
    if(DEFAULT_CATEGORIES.includes(cat)) return;
    setCategories(c=>c.filter(x=>x!==cat));
    setItems(p=>p.map(x=>x.category===cat?{...x,category:"Other Payments"}:x));
    setBucketCounts(p=>{const n={...p};delete n[cat];return n;});
  }

  function handleConfirm() {
    const map={};
    items.forEach(i=>{map[i.narrative]=i.category==="Skip"?"Other Payments":i.category;});
    onDone(transactions.map(t=>t.category==="Other Payments"&&map[t.narrative]?{...t,category:map[t.narrative]}:t), categories);
  }

  const pct = allItems.length ? Math.round(((sorted.length+skipped.length)/allItems.length)*100) : 100;

  const txnCountByCat = useMemo(()=>{
    const counts={};
    transactions.forEach(t=>{if(t.category&&t.category!=="Other Payments") counts[t.category]=(counts[t.category]||0)+1;});
    return counts;
  },[transactions,items]);

  const SWIPE_THRESHOLD = 80;
  const CATS_PER_PAGE = 4;
  const totalPages = Math.ceil(allBuckets.length/CATS_PER_PAGE);
  const visibleMobileCats = allBuckets.slice(mobileCatPage*CATS_PER_PAGE,(mobileCatPage+1)*CATS_PER_PAGE);

  function onTouchStart(e){touchStartX.current=e.touches[0].clientX;touchStartY.current=e.touches[0].clientY;}
  function onTouchMove(e){
    if(touchStartX.current===null) return;
    const dx=e.touches[0].clientX-touchStartX.current, dy=e.touches[0].clientY-touchStartY.current;
    if(Math.abs(dy)>Math.abs(dx)+10) return;
    e.preventDefault(); setSwipeOffset(dx);
    if(dx>SWIPE_THRESHOLD&&visibleMobileCats[0]) setSwipeTarget(visibleMobileCats[0]);
    else if(dx<-SWIPE_THRESHOLD&&visibleMobileCats[1]) setSwipeTarget(visibleMobileCats[1]);
    else setSwipeTarget(null);
  }
  function onTouchEnd(){
    if(touchStartX.current===null) return;
    const topItem=unsorted[0];
    if(topItem&&swipeTarget) assignItem(topItem.narrative,swipeTarget);
    else {setSwipeOffset(0);setSwipeTarget(null);}
    touchStartX.current=null; touchStartY.current=null;
  }

  const DesktopSort = () => (
    <div style={{flex:1,display:"flex",minHeight:0,overflow:"hidden"}}>
      <div style={{width:300,flexShrink:0,padding:"20px 16px",borderRight:"1px solid #1f1d35",display:"flex",flexDirection:"column",gap:8,overflowY:"auto"}}>
        <div style={{fontSize:11,fontWeight:700,color:"#4b5563",letterSpacing:1,marginBottom:4}}>DRAG INTO A BUCKET →</div>

        {unsorted.length===0&&(
          <div style={{textAlign:"center",padding:"40px 0"}}>
            <div style={{fontSize:32,marginBottom:8}}>🎉</div>
            <div style={{fontSize:14,fontWeight:700,color:"#fff",marginBottom:16}}>All sorted!</div>
            <button onClick={handleConfirm} style={{padding:"10px 24px",background:"#6366f1",color:"#fff",border:"none",borderRadius:8,fontSize:13,fontWeight:700,cursor:"pointer"}}>Show cash flow →</button>
          </div>
        )}

        {visible.map((item,idx)=>{
          const isTop=idx===0;
          return (
            <div key={item.narrative} draggable={isTop}
              onDragStart={()=>{ dragRef.current=item.narrative; }}
              onDragEnd={()=>{ dragRef.current=null; setHoveredCat(null); }}
              style={{background:isTop?"#1e1b38":`rgba(20,18,42,${1-idx*0.12})`,border:`1px solid ${isTop?"#4338ca":"#2d2a6e"}`,borderRadius:12,padding:isTop?"16px":"10px 16px",cursor:isTop?"grab":"default",opacity:isTop?1:1-idx*0.18,transform:`translateY(${idx*-3}px) scale(${1-idx*0.015})`,transformOrigin:"top center",transition:"all 0.2s",userSelect:"none",flexShrink:0}}
            >
              <div style={{fontSize:12,fontWeight:600,color:isTop?"#c7d2fe":"#6b7280",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{item.narrative}</div>
              {isTop&&(
                <div style={{display:"flex",alignItems:"center",gap:8,marginTop:6}}>
                  <span style={{fontSize:16,fontWeight:800,color:"#a5b4fc"}}>£{Math.round(item.total).toLocaleString()}</span>
                  <span style={{fontSize:11,color:"#4b5563"}}>{item.count} txn{item.count>1?"s":""}</span>
                  <span style={{fontSize:10,color:"#4b5563",marginLeft:"auto"}}>drag →</span>
                </div>
              )}
            </div>
          );
        })}

        {unsorted.length>VISIBLE&&<div style={{fontSize:11,color:"#4b5563",textAlign:"center",paddingTop:4}}>+{unsorted.length-VISIBLE} more</div>}

        {(sorted.length>0||skipped.length>0)&&(
          <div style={{marginTop:16}}>
            <div style={{fontSize:11,fontWeight:700,color:"#4b5563",letterSpacing:1,marginBottom:8}}>SORTED ✓</div>
            {[...sorted,...skipped].map(item=>(
              <div key={item.narrative} style={{display:"flex",alignItems:"center",gap:8,padding:"6px 10px",background:"rgba(255,255,255,0.02)",borderRadius:8,border:"1px solid #1f1d35",marginBottom:4}}>
                <div style={{width:7,height:7,borderRadius:"50%",background:item.category==="Skip"?"#4b5563":catColor(item.category,spendCats.indexOf(item.category)),flexShrink:0}}/>
                <div style={{flex:1,fontSize:11,color:"#6b7280",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{item.narrative}</div>
                <div style={{fontSize:10,color:"#4b5563",flexShrink:0}}>{item.category==="Skip"?"?":item.category}</div>
                <button onClick={()=>undoItem(item.narrative,item.category)} style={{fontSize:10,color:"#4b5563",border:"none",background:"none",cursor:"pointer",padding:"1px 4px"}}>undo</button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{flex:1,padding:"20px 24px",overflowY:"auto"}}>
        <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:16,flexWrap:"wrap"}}>
          <div style={{fontSize:11,fontWeight:700,color:"#4b5563",letterSpacing:1}}>CATEGORIES</div>
          <div style={{flex:1}}/>
          {showAddCat?(
            <div style={{display:"flex",gap:8}}>
              <input autoFocus value={newCat} onChange={e=>setNewCat(e.target.value)}
                onKeyDown={e=>{if(e.key==="Enter")addCategory();if(e.key==="Escape")setShowAddCat(false);}}
                placeholder="Category name..."
                style={{padding:"6px 12px",background:"#1e1b38",border:"1px solid #4338ca",borderRadius:8,color:"#fff",fontSize:13,width:180}}/>
              <button onClick={addCategory} style={{padding:"6px 14px",background:"#6366f1",color:"#fff",border:"none",borderRadius:8,fontSize:13,fontWeight:700,cursor:"pointer"}}>Add</button>
              <button onClick={()=>setShowAddCat(false)} style={{padding:"6px 10px",background:"none",border:"1px solid #374151",borderRadius:8,color:"#6b7280",fontSize:13,cursor:"pointer"}}>×</button>
            </div>
          ):(
            <button onClick={()=>setShowAddCat(true)} style={{padding:"5px 14px",background:"rgba(99,102,241,0.15)",border:"1px dashed #6366f1",borderRadius:8,color:"#6366f1",fontSize:12,fontWeight:700,cursor:"pointer"}}>+ Add category</button>
          )}
        </div>

        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(150px,1fr))",gap:14}}>
          {spendCats.map((cat,i)=>{
            const color=catColor(cat,i);
            const isHovered=hoveredCat===cat;
            const newlySorted=bucketCounts[cat]||0;
            const totalCount=(txnCountByCat[cat]||0)+newlySorted;
            const isDefault=DEFAULT_CATEGORIES.includes(cat);
            return (
              <div key={cat}
                onDragOver={e=>{e.preventDefault();setHoveredCat(cat);}}
                onDragLeave={e=>{if(!e.currentTarget.contains(e.relatedTarget))setHoveredCat(null);}}
                onDrop={e=>{e.preventDefault();dropIntoCat(cat);}}
                style={{border:`2px ${isHovered?"solid":"dashed"} ${color}`,borderRadius:14,padding:"16px 12px 12px",background:isHovered?`${color}22`:"rgba(255,255,255,0.02)",transition:"all 0.15s",cursor:"default",minHeight:110,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"space-between",gap:8,position:"relative"}}
              >
                {!isDefault&&(
                  <button onClick={()=>removeCategory(cat)} style={{position:"absolute",top:4,right:6,fontSize:12,color:"#374151",border:"none",background:"none",cursor:"pointer",lineHeight:1}}>×</button>
                )}
                <div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:6}}>
                  <div style={{fontSize:13,fontWeight:700,color:isHovered?"#fff":color,textAlign:"center",lineHeight:1.3}}>{cat}</div>
                  {isHovered&&<div style={{fontSize:11,color:"rgba(255,255,255,0.6)"}}>drop here</div>}
                </div>
                <div style={{width:"100%",borderTop:`1px solid ${color}44`,paddingTop:8,textAlign:"center",fontSize:11,color:totalCount>0?color:"#374151",fontWeight:700}}>
                  {totalCount>0?`${totalCount} transaction${totalCount>1?"s":""}`:newlySorted>0?`${newlySorted} added`:"0 transactions"}
                </div>
              </div>
            );
          })}

          {(()=>{
            const isHovered=hoveredCat==="Skip";
            const count=skipped.length;
            return (
              <div
                onDragOver={e=>{e.preventDefault();setHoveredCat("Skip");}}
                onDragLeave={e=>{if(!e.currentTarget.contains(e.relatedTarget))setHoveredCat(null);}}
                onDrop={e=>{e.preventDefault();dropIntoCat("Skip");}}
                style={{border:`2px dashed ${isHovered?"#6b7280":"#2d2a6e"}`,borderRadius:14,padding:"16px 12px 12px",background:isHovered?"rgba(107,114,128,0.15)":"rgba(255,255,255,0.01)",transition:"all 0.15s",cursor:"default",minHeight:110,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"space-between"}}
              >
                <div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:6}}>
                  <div style={{fontSize:13,fontWeight:700,color:isHovered?"#9ca3af":"#4b5563",textAlign:"center"}}>Not sure</div>
                  <div style={{fontSize:11,color:"#374151",textAlign:"center"}}>leave in Other</div>
                </div>
                <div style={{width:"100%",borderTop:"1px solid #2d2a6e",paddingTop:8,textAlign:"center",fontSize:11,color:count>0?"#6b7280":"#374151",fontWeight:700}}>
                  {count>0?`${count} transaction${count>1?"s":""}`:count===0?"0 transactions":""}
                </div>
              </div>
            );
          })()}
        </div>
      </div>
    </div>
  );

  const MobileSort = () => {
    const topItem=unsorted[0];
    const swipeRight=visibleMobileCats[0], swipeLeft=visibleMobileCats[1];
    const swipeRightColor=swipeRight==="Skip"?"#6b7280":catColor(swipeRight,spendCats.indexOf(swipeRight));
    const swipeLeftColor=swipeLeft==="Skip"?"#6b7280":catColor(swipeLeft,spendCats.indexOf(swipeLeft));
    const swipeProgress=Math.min(Math.abs(swipeOffset)/SWIPE_THRESHOLD,1);
    const swipingRight=swipeOffset>20, swipingLeft=swipeOffset<-20;
    return (
      <div style={{flex:1,display:"flex",flexDirection:"column",padding:"12px 16px",gap:12,overflow:"hidden"}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <div style={{flex:1,height:4,background:"#1f1d35",borderRadius:999,overflow:"hidden"}}>
            <div style={{height:"100%",width:`${pct}%`,background:"linear-gradient(90deg,#6366f1,#10b981)",transition:"width 0.4s"}}/>
          </div>
          <span style={{fontSize:12,color:"#6366f1",fontWeight:700,flexShrink:0}}>{pct}% sorted</span>
        </div>
        {topItem&&(
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:3,opacity:swipingLeft?1:0.35,transition:"opacity 0.2s"}}>
              <div style={{fontSize:20,color:swipeLeftColor}}>←</div>
              <div style={{fontSize:10,fontWeight:700,color:swipeLeftColor,maxWidth:70,textAlign:"center"}}>{swipeLeft==="Skip"?"Not sure":swipeLeft||"—"}</div>
            </div>
            <div style={{fontSize:11,color:"#4b5563",fontWeight:600}}>swipe to sort</div>
            <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:3,opacity:swipingRight?1:0.35,transition:"opacity 0.2s"}}>
              <div style={{fontSize:20,color:swipeRightColor}}>→</div>
              <div style={{fontSize:10,fontWeight:700,color:swipeRightColor,maxWidth:70,textAlign:"center"}}>{swipeRight==="Skip"?"Not sure":swipeRight||"—"}</div>
            </div>
          </div>
        )}
        <div style={{position:"relative",height:150,flexShrink:0}}>
          {unsorted.length===0?(
            <div style={{textAlign:"center",padding:"30px 0"}}>
              <div style={{fontSize:32,marginBottom:8}}>🎉</div>
              <div style={{fontSize:14,fontWeight:700,color:"#fff",marginBottom:12}}>All sorted!</div>
              <button onClick={handleConfirm} style={{padding:"10px 24px",background:"#6366f1",color:"#fff",border:"none",borderRadius:8,fontSize:13,fontWeight:700,cursor:"pointer"}}>Show cash flow →</button>
            </div>
          ):(
            <>
              {visible.slice(1,3).map((item,idx)=>(
                <div key={item.narrative} style={{position:"absolute",top:0,left:0,right:0,background:`rgba(20,18,42,${1-(idx+1)*0.15})`,border:"1px solid #2d2a6e",borderRadius:16,padding:"16px",transform:`translateY(${(idx+1)*6}px) scale(${1-(idx+1)*0.03})`,transformOrigin:"top center",zIndex:1-idx}}/>
              ))}
              {topItem&&(
                <div onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}
                  style={{position:"absolute",top:0,left:0,right:0,background:swipingRight?`linear-gradient(135deg,${swipeRightColor}33,#1e1b38)`:swipingLeft?`linear-gradient(225deg,${swipeLeftColor}33,#1e1b38)`:"#1e1b38",border:`2px solid ${swipeTarget?(swipingRight?swipeRightColor:swipeLeftColor):"#4338ca"}`,borderRadius:16,padding:"20px",transform:`translateX(${swipeOffset}px) rotate(${swipeOffset*0.03}deg)`,transition:swipeOffset===0?"transform 0.3s":"none",zIndex:10,touchAction:"pan-y",userSelect:"none"}}>
                  {swipeTarget&&(
                    <div style={{position:"absolute",top:12,right:swipingRight?12:undefined,left:swipingLeft?12:undefined,background:swipingRight?swipeRightColor:swipeLeftColor,color:"#fff",fontSize:11,fontWeight:800,padding:"3px 10px",borderRadius:20,opacity:swipeProgress}}>
                      {swipeTarget==="Skip"?"NOT SURE":swipeTarget.toUpperCase()}
                    </div>
                  )}
                  <div style={{fontSize:13,fontWeight:600,color:"#c7d2fe",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",marginBottom:8}}>{topItem.narrative}</div>
                  <div style={{display:"flex",alignItems:"center",gap:10}}>
                    <span style={{fontSize:22,fontWeight:800,color:"#a5b4fc"}}>£{Math.round(topItem.total).toLocaleString()}</span>
                    <span style={{fontSize:12,color:"#4b5563"}}>{topItem.count} txn{topItem.count>1?"s":""}</span>
                  </div>
                  <div style={{fontSize:10,color:"#374151",marginTop:6}}>{unsorted.length} left</div>
                </div>
              )}
            </>
          )}
        </div>
        <div style={{fontSize:11,fontWeight:700,color:"#4b5563",letterSpacing:1}}>TAP TO ASSIGN</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
          {visibleMobileCats.map((cat)=>{
            const isSkip=cat==="Skip";
            const color=isSkip?"#6b7280":catColor(cat,spendCats.indexOf(cat));
            const count=isSkip?skipped.length:(txnCountByCat[cat]||0)+(bucketCounts[cat]||0);
            return (
              <button key={cat} onClick={()=>{if(unsorted[0])assignItem(unsorted[0].narrative,cat);}}
                style={{padding:"12px 10px",background:`${color}18`,border:`2px solid ${color}`,borderRadius:12,color,fontWeight:700,fontSize:13,cursor:"pointer",textAlign:"center",display:"flex",flexDirection:"column",gap:3,alignItems:"center"}}>
                <span>{isSkip?"Not sure":cat}</span>
                {count>0&&<span style={{fontSize:10,fontWeight:400,opacity:0.7}}>{count} txn{count>1?"s":""}</span>}
              </button>
            );
          })}
        </div>
        {totalPages>1&&(
          <div style={{display:"flex",justifyContent:"center",gap:8,alignItems:"center"}}>
            <button onClick={()=>setMobileCatPage(p=>Math.max(0,p-1))} disabled={mobileCatPage===0} style={{fontSize:16,background:"none",border:"none",color:mobileCatPage===0?"#2d2a6e":"#6366f1",cursor:"pointer"}}>‹</button>
            {Array.from({length:totalPages}).map((_,i)=>(<div key={i} onClick={()=>setMobileCatPage(i)} style={{width:6,height:6,borderRadius:"50%",background:i===mobileCatPage?"#6366f1":"#2d2a6e",cursor:"pointer"}}/>))}
            <button onClick={()=>setMobileCatPage(p=>Math.min(totalPages-1,p+1))} disabled={mobileCatPage===totalPages-1} style={{fontSize:16,background:"none",border:"none",color:mobileCatPage===totalPages-1?"#2d2a6e":"#6366f1",cursor:"pointer"}}>›</button>
          </div>
        )}
        {(sorted.length>0||skipped.length>0)&&(
          <div style={{flex:1,overflowY:"auto"}}>
            <div style={{fontSize:11,fontWeight:700,color:"#4b5563",letterSpacing:1,marginBottom:8}}>SORTED ✓</div>
            {[...sorted,...skipped].slice(-6).map(item=>(
              <div key={item.narrative} style={{display:"flex",alignItems:"center",gap:8,padding:"6px 10px",background:"rgba(255,255,255,0.02)",borderRadius:8,border:"1px solid #1f1d35",marginBottom:4}}>
                <div style={{width:7,height:7,borderRadius:"50%",background:item.category==="Skip"?"#4b5563":catColor(item.category,spendCats.indexOf(item.category)),flexShrink:0}}/>
                <div style={{flex:1,fontSize:11,color:"#6b7280",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{item.narrative}</div>
                <div style={{fontSize:10,color:"#4b5563",flexShrink:0}}>{item.category==="Skip"?"?":item.category}</div>
                <button onClick={()=>undoItem(item.narrative,item.category)} style={{fontSize:10,color:"#4b5563",border:"none",background:"none",cursor:"pointer",padding:"1px 4px"}}>undo</button>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div style={{minHeight:"100vh",background:"#0f0e1a",display:"flex",flexDirection:"column",fontFamily:"'Inter',system-ui,sans-serif"}}>
      <div style={{padding:"14px 24px",background:"#0f0e1a",borderBottom:"1px solid #1f1d35",display:"flex",alignItems:"center",gap:16,flexShrink:0,flexWrap:"wrap"}}>
        <img src={logo} alt="Abound" style={{height:30}}/>
        <span style={{fontSize:15,fontWeight:800,color:"#fff"}}>Sort transactions</span>
        <span style={{fontSize:13,color:"#4b5563"}}>{unsorted.length>0?`${unsorted.length} left · ${sorted.length+skipped.length} done`:"All sorted!"}</span>
        <div style={{flex:1,height:4,background:"#1f1d35",borderRadius:999,overflow:"hidden",maxWidth:200}}>
          <div style={{height:"100%",width:`${pct}%`,background:"linear-gradient(90deg,#6366f1,#10b981)",transition:"width 0.4s"}}/>
        </div>
        <span style={{fontSize:12,color:"#6366f1",fontWeight:700}}>{pct}%</span>
        <button onClick={handleConfirm} style={{padding:"8px 18px",background:"#6366f1",color:"#fff",border:"none",borderRadius:8,fontSize:13,fontWeight:700,cursor:"pointer",marginLeft:"auto"}}>Done →</button>
      </div>
      {isMobileView ? <MobileSort/> : <DesktopSort/>}
    </div>
  );
}

function CashFlowScreen({transactions, categories}) {
   // ---- DEBUG START ----
  console.log("---- DEBUG: Transactions ----");
  console.table(transactions);   // Shows all transactions in a table
  console.log("---- DEBUG: Accounts ----");
  const accountsDebug = [];
  const seenDebug = new Set();
  transactions.forEach(t => {
    if (!seenDebug.has(t.account)) {
      seenDebug.add(t.account);
      accountsDebug.push(t.account);
    }
  });
  console.log(accountsDebug); // Shows all unique accounts
  // ---- DEBUG END ----
  const [hiddenCats, setHiddenCats] = useState(new Set());
  const [budgets, setBudgets] = useState({});
  const [editingBudget, setEditingBudget] = useState(null);
  const [aiOpen, setAiOpen] = useState(true);
  const accounts = useMemo(() => {
  const seen = new Set();
  const list = [];
  transactions.forEach(t => {
    if (!seen.has(t.account)) {
      seen.add(t.account);
      list.push(t.account);
    }
  });
  // ensure "Main Account" comes first
  list.sort((a, b) => a === "Main Account" ? -1 : b === "Main Account" ? 1 : 0);
  return list;
}, [transactions]);
  const mostRecentDate = useMemo(()=>transactions.reduce((max,t)=>t.date>max?t.date:max,new Date(0)),[transactions]);
  const actualWeeks = useMemo(()=>{
    const lastMonday=getWeekMonday(mostRecentDate);
    return Array.from({length:6},(_,i)=>{const mon=new Date(lastMonday);mon.setDate(mon.getDate()-(5-i)*7);return {key:mon.toISOString().slice(0,10),date:mon,sunday:getWeekSunday(mon)};});
  },[mostRecentDate]);
  const forecastWeeks = useMemo(()=>{
    if(!actualWeeks.length) return [];
    const last=actualWeeks[actualWeeks.length-1].date;
    return Array.from({length:6},(_,i)=>{const mon=new Date(last);mon.setDate(mon.getDate()+(i+1)*7);return {key:mon.toISOString().slice(0,10),date:mon,sunday:getWeekSunday(mon)};});
  },[actualWeeks]);
  const weeklyByAccountCat = useMemo(()=>{
    const weekly={};
    transactions.forEach(t=>{
      const key=getWeekMonday(t.date).toISOString().slice(0,10);
      if(!weekly[key]) weekly[key]={};
      if(!weekly[key][t.account]) weekly[key][t.account]={};
      const amt=t.category==="Salary"?t.amount:-t.amount;
      weekly[key][t.account][t.category]=(weekly[key][t.account][t.category]||0)+amt;
    });
    return weekly;
  },[transactions]);
  const weekBalances = useMemo(()=>{
    const bal={};
    [...transactions].sort((a,b)=>a.date-b.date).forEach(t=>{
      if(t.balance===null) return;
      const key=getWeekMonday(t.date).toISOString().slice(0,10);
      if(!bal[key]) bal[key]={};
      bal[key][t.account]=t.balance;
    });
    return bal;
  },[transactions]);
 const forecastData = useMemo(()=>{
  const out={};

  // Helper: find the most common day-of-month a category transacts
  function getMonthlyDay(acc, cat) {
    const days = [];
    transactions.forEach(t => {
      if (t.account===acc && t.category===cat) days.push(t.date.getDate());
    });
    if (!days.length) return null;
    const freq = {};
    days.forEach(d => freq[d]=(freq[d]||0)+1);
    return parseInt(Object.entries(freq).sort((a,b)=>b[1]-a[1])[0][0]);
  }

  // Helper: does a week (mon to sun) contain a given day-of-month?
  function weekContainsDay(weekMon, weekSun, dayOfMonth) {
    const d = new Date(weekMon);
    while (d <= weekSun) {
      if (d.getDate() === dayOfMonth) return true;
      d.setDate(d.getDate()+1);
    }
    return false;
  }

  const MONTHLY_CATS = ["Salary","Rent","Memberships","Card Repayment"];
  const ROLLING_CATS = ["Food","Travel","Other Payments"];

  accounts.forEach(acc=>{
    out[acc]={};
    categories.forEach(cat=>{
      const actualVals = actualWeeks.map(w=>Math.abs(weeklyByAccountCat[w.key]?.[acc]?.[cat]||0));
      const avg = rollingAvg(actualVals);

      if (MONTHLY_CATS.includes(cat)) {
        const dayOfMonth = getMonthlyDay(acc, cat);
        if (!dayOfMonth || avg===0) {
          out[acc][cat] = Array(forecastWeeks.length).fill(0);
        } else {
          out[acc][cat] = forecastWeeks.map(w =>
            weekContainsDay(w.date, w.sunday, dayOfMonth) ? avg : 0
          );
        }
      } else if (ROLLING_CATS.includes(cat)) {
        // Sliding 6-week rolling avg — window moves right including prior forecast values
        const window = [...actualVals]; // starts as 6 actual weeks
        const result = [];
        for (let i=0; i<forecastWeeks.length; i++) {
          const last6 = window.slice(-6);
const forecastVal = Math.round(last6.reduce((a,b)=>a+b,0) / 6);
          result.push(forecastVal);
          window.push(forecastVal); // include this forecast in next window
        }
        out[acc][cat] = result;
      } else {
        out[acc][cat] = Array(forecastWeeks.length).fill(avg);
      }
    });
  });
  return out;
},[accounts,categories,actualWeeks,forecastWeeks,weeklyByAccountCat,transactions]);
  const spendCats=categories.filter(c=>c!=="Salary"&&c!=="Card Repayment");
  const totalActualByWeek=actualWeeks.map(w=>accounts.reduce((s,acc)=>spendCats.reduce((s2,c)=>s2+Math.abs(weeklyByAccountCat[w.key]?.[acc]?.[c]||0),s),0));
  const totalForecastByWeek=forecastWeeks.map((_,i)=>accounts.reduce((s,acc)=>spendCats.reduce((s2,c)=>s2+(forecastData[acc]?.[c]?.[i]||0),s),0));
  const insights=useMemo(()=>{
    const tips=[],totals={};
    categories.forEach(cat=>{totals[cat]=actualWeeks.reduce((s,w)=>s+accounts.reduce((s2,acc)=>s2+Math.abs(weeklyByAccountCat[w.key]?.[acc]?.[cat]||0),0),0);});
    const top=Object.entries(totals).filter(([c])=>c!=="Salary").sort((a,b)=>b[1]-a[1])[0];
    if(top) tips.push({icon:"📊",color:PURPLE,title:`Biggest: ${top[0]}`,body:`£${Math.round(top[1]).toLocaleString()} over ${actualWeeks.length} weeks.`});
    categories.forEach(cat=>{
      if(cat==="Salary") return;
      const vals=actualWeeks.map(w=>accounts.reduce((s,acc)=>s+Math.abs(weeklyByAccountCat[w.key]?.[acc]?.[cat]||0),0));
      const avg=rollingAvg(vals),last=vals[vals.length-1];
      if(avg>0&&last>avg*1.8) tips.push({icon:"⚠️",color:"#f59e0b",title:`${cat} spike`,body:`Last week £${Math.round(last)} vs avg £${Math.round(avg)}.`});
    });
    if(tips.length<2) tips.push({icon:"✅",color:"#10b981",title:"Looks stable",body:"No major anomalies detected."});
    return tips.slice(0,4);
  },[transactions,categories,actualWeeks,accounts,weeklyByAccountCat]);
  const tdAmt=(color,isForecast,bold)=>({padding:"5px 10px",textAlign:"right",fontSize:12,fontWeight:bold?700:400,color:color||"#374151",background:isForecast?"rgba(99,102,241,0.03)":undefined,borderRight:"1px solid #f0f0f0",whiteSpace:"nowrap"});
  const tdTot=(isForecast)=>({padding:"5px 10px",textAlign:"right",fontSize:12,fontWeight:700,color:isForecast?PURPLE:"#111827",background:isForecast?"rgba(99,102,241,0.06)":"#f9fafb",borderLeft:"2px solid #e5e7eb",borderRight:"2px solid #e5e7eb",whiteSpace:"nowrap"});
  function CatRow({cat,account}) {
    const isIncome=cat==="Salary";
    const key=`${account}::${cat}`;
    const hidden=hiddenCats.has(key);
    const actuals=actualWeeks.map(w=>Math.abs(weeklyByAccountCat[w.key]?.[account]?.[cat]||0));
    const forecasts=forecastData[account]?.[cat]||Array(6).fill(0);
    const totalAct=actuals.reduce((a,b)=>a+b,0);
    const totalFcst=forecasts.reduce((a,b)=>a+b,0);
    const budget=budgets[key];
    return (
      <tr style={{opacity:hidden?0.35:1,borderBottom:"1px solid #f3f4f6",background:isIncome?"#f0fdf4":"#fff"}}>
        <td style={{padding:"5px 6px 5px 12px",fontSize:10,color:"#9ca3af",whiteSpace:"nowrap"}}>{account === "Main Account" ? "Main" : account}</td>
        <td style={{padding:"5px 12px",fontSize:12,fontWeight:600,whiteSpace:"nowrap",color:isIncome?"#059669":"#111827"}}>{isIncome&&<span style={{fontSize:9,marginRight:4}}>▲</span>}{cat}</td>
        {actuals.map((v,i)=><td key={i} style={tdAmt(v===0?"#d1d5db":isIncome?"#059669":"#374151",false)}>{fmtMoney(v)}</td>)}
        <td style={tdTot(false)}>{fmtMoney(totalAct)}</td>
        {forecasts.map((v,i)=>{const over=budget&&v>budget;return <td key={i} style={tdAmt(over?"#ef4444":v===0?"#d1d5db":PURPLE,true)}>{fmtMoney(v)}{over&&<span style={{fontSize:8}}>↑</span>}</td>;})}
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
function AccountSection({ account, categories, actualWeeks, forecastWeeks, weeklyByAccountCat, forecastData, weekBalances, budgets, setBudgets, hiddenCats, setHiddenCats }) {
  const isMainAcc = account === "Main Account";
const incomeCats = isMainAcc ? categories.filter(c => c === "Salary") : [];
const spendCatsLocal = categories.filter(c => c !== "Salary" && c !== "Card Repayment");

  // Safe actuals and forecasts per category
  const accActuals = actualWeeks.map(w => {
    const weeklyData = weeklyByAccountCat[w.key]?.[account] || {};
    return spendCatsLocal.reduce((sum, cat) => sum + Math.abs(weeklyData[cat] || 0), 0);
  });
  const accForecasts = forecastWeeks.map((_, i) => {
    const forecastForAcc = forecastData[account] || {};
    return spendCatsLocal.reduce((sum, cat) => sum + (forecastForAcc[cat]?.[i] || 0), 0);
  });

  const accIncome = actualWeeks.map(w => {
    const weeklyData = weeklyByAccountCat[w.key]?.[account] || {};
    return incomeCats.reduce((sum, cat) => sum + Math.abs(weeklyData[cat] || 0), 0);
  });
  const accIncomeForecasts = forecastWeeks.map((_, i) => {
    const forecastForAcc = forecastData[account] || {};
    return incomeCats.reduce((sum, cat) => sum + (forecastForAcc[cat]?.[i] || 0), 0);
  });

  // Compute running opening balance per week safely
  const weeklyNetActual = actualWeeks.map((w, i) => accIncome[i] - accActuals[i]);
  const weeklyNetForecast = forecastWeeks.map((_, i) => accIncomeForecasts[i] - accForecasts[i]);

  const knownBalances = actualWeeks.map(w => weekBalances[w.key]?.[account] ?? null);
  const runningBalances = Array(actualWeeks.length).fill(null);
  const firstKnownIdx = knownBalances.findIndex(b => b !== null);
  if (firstKnownIdx !== -1) {
    runningBalances[firstKnownIdx] = knownBalances[firstKnownIdx];
    for (let i = firstKnownIdx + 1; i < actualWeeks.length; i++) {
      runningBalances[i] = runningBalances[i - 1] !== null ? runningBalances[i - 1] + weeklyNetActual[i - 1] : null;
    }
    for (let i = firstKnownIdx - 1; i >= 0; i--) {
      runningBalances[i] = runningBalances[i + 1] !== null ? runningBalances[i + 1] - weeklyNetActual[i] : null;
    }
  }

  const lastActualBal = runningBalances.filter(b => b !== null).slice(-1)[0] ?? null;
  const forecastBalances = Array(forecastWeeks.length).fill(null);
  if (lastActualBal !== null) {
    forecastBalances[0] = lastActualBal + weeklyNetActual[actualWeeks.length - 1];
    for (let i = 1; i < forecastWeeks.length; i++) {
      forecastBalances[i] = forecastBalances[i - 1] + weeklyNetForecast[i - 1];
    }
  }

  return (
    <>
      {/* Account Header */}
      <tr style={{ background: "#1e1b4b" }}>
        <td colSpan={2} style={{ padding: "7px 12px", fontSize: 12, fontWeight: 800, color: "#e0e7ff" }}>{account}</td>
        {actualWeeks.map((_, i) => <td key={i} style={{ background: "#1e1b4b", borderRight: "1px solid #2d2a6e" }} />)}
        <td style={{ background: "#1e1b4b", borderLeft: "2px solid #2d2a6e", borderRight: "2px solid #2d2a6e" }} />
        {forecastWeeks.map((_, i) => <td key={i} style={{ background: "#312e81", borderRight: "1px solid #3730a3" }} />)}
        <td style={{ background: "#312e81", borderLeft: "2px solid #3730a3" }} />
        <td style={{ background: "#1e1b4b" }} colSpan={2} />
      </tr>

      {/* Opening Balance */}
      <tr style={{ background: "#f8fafc", borderBottom: "1px solid #eef0f3" }}>
        <td style={{ padding: "5px 6px 5px 12px", fontSize: 10, color: "#9ca3af" }} />
        <td style={{ padding: "5px 12px", fontSize: 11, fontWeight: 700, color: "#374151" }}>Opening Balance</td>
        {runningBalances.map((bal, i) => <td key={i} style={{ padding: "5px 10px", textAlign: "right", fontSize: 12, fontWeight: 400, color: bal === null ? "#d1d5db" : bal >= 0 ? "#059669" : "#ef4444" }}>{bal !== null ? fmtMoney(bal) : "—"}</td>)}
        <td style={{ borderLeft: "2px solid #e5e7eb", borderRight: "2px solid #e5e7eb", background: "#f9fafb" }} />
        {forecastBalances.map((bal, i) => <td key={i} style={{ padding: "5px 10px", textAlign: "right", fontSize: 12, fontWeight: 400, color: bal === null ? "#d1d5db" : bal >= 0 ? "#059669" : "#ef4444", background: "rgba(99,102,241,0.03)" }}>{bal !== null ? fmtMoney(bal) : "—"}</td>)}
        <td style={{ borderLeft: "2px solid #e5e7eb", background: "rgba(99,102,241,0.02)" }} /><td /><td />
      </tr>

      {/* Income Categories */}
      {incomeCats.map(cat => <CatRow key={`${account}::${cat}`} cat={cat} account={account} budgets={budgets} setBudgets={setBudgets} hiddenCats={hiddenCats} />)}
{spendCatsLocal.map(cat => <CatRow key={`${account}::${cat}`} cat={cat} account={account} budgets={budgets} setBudgets={setBudgets} hiddenCats={hiddenCats} />)}
<CatRow key={`${account}::Card Repayment`} cat="Card Repayment" account={account} budgets={budgets} setBudgets={setBudgets} hiddenCats={hiddenCats} />

      {/* Total Spend */}
      <tr style={{ background: "#f3f4f6", borderBottom: "1px solid #e5e7eb" }}>
        <td /><td style={{ padding: "6px 12px", fontSize: 11, fontWeight: 800, color: "#374151" }}>Total Spend</td>
        {accActuals.map((v, i) => <td key={i} style={{ padding: "5px 10px", textAlign: "right", fontSize: 12, fontWeight: 700, color: "#111827" }}>{fmtMoney(v)}</td>)}
        <td style={{ padding: "5px 10px", textAlign: "right", fontSize: 12, fontWeight: 700, color: "#111827", borderLeft: "2px solid #e5e7eb", borderRight: "2px solid #e5e7eb" }}>{fmtMoney(accActuals.reduce((a, b) => a + b, 0))}</td>
        {accForecasts.map((v, i) => <td key={i} style={{ padding: "5px 10px", textAlign: "right", fontSize: 12, fontWeight: 700, color: PURPLE, background: "rgba(99,102,241,0.06)" }}>{fmtMoney(v)}</td>)}
        <td style={{ padding: "5px 10px", textAlign: "right", fontSize: 12, fontWeight: 700, color: PURPLE, borderLeft: "2px solid #e5e7eb", borderRight: "2px solid #e5e7eb" }}>{fmtMoney(accForecasts.reduce((a, b) => a + b, 0))}</td>
        <td /><td />
      </tr>

      {/* Net Movement */}
      <tr style={{ background: "#fff", borderTop: "2px solid #000", borderBottom: "2px solid #000", fontWeight: 700 }}>
        <td /><td style={{ padding: "6px 12px", fontSize: 11, fontWeight: 800, color: "#374151" }}>Net Movement</td>
        {weeklyNetActual.map((v, i) => <td key={i} style={{ padding: "5px 10px", textAlign: "right", fontSize: 12, fontWeight: 700, color: v >= 0 ? "#059669" : "#ef4444" }}>{v === 0 ? "-" : v > 0 ? `£${Math.round(v).toLocaleString()}` : `(£${Math.round(Math.abs(v)).toLocaleString()})`}</td>)}
        <td style={{ padding: "5px 10px", textAlign: "right", fontSize: 12, fontWeight: 700, color: weeklyNetActual.reduce((a, b) => a + b, 0) >= 0 ? "#059669" : "#ef4444" }}>
          {weeklyNetActual.reduce((a, b) => a + b, 0) >= 0 ? `£${Math.round(weeklyNetActual.reduce((a, b) => a + b, 0)).toLocaleString()}` : `(£${Math.round(Math.abs(weeklyNetActual.reduce((a, b) => a + b, 0))).toLocaleString()})`}
        </td>
        {weeklyNetForecast.map((v, i) => <td key={i} style={{ padding: "5px 10px", textAlign: "right", fontSize: 12, fontWeight: 700, color: v >= 0 ? "#059669" : "#ef4444" }}>{v === 0 ? "-" : v > 0 ? `£${Math.round(v).toLocaleString()}` : `(£${Math.round(Math.abs(v)).toLocaleString()})`}</td>)}
        <td style={{ padding: "5px 10px", textAlign: "right", fontSize: 12, fontWeight: 700, color: weeklyNetForecast.reduce((a, b) => a + b, 0) >= 0 ? "#059669" : "#ef4444" }}>
          {weeklyNetForecast.reduce((a, b) => a + b, 0) >= 0 ? `£${Math.round(weeklyNetForecast.reduce((a, b) => a + b, 0)).toLocaleString()}` : `(£${Math.round(Math.abs(weeklyNetForecast.reduce((a, b) => a + b, 0))).toLocaleString()})`}
          <tr style={{ height: 8 }}><td colSpan={20} /></tr>
        </td>
        <td /><td />
      </tr>
    </>
  );
}
  return (
    <div style={{display:"flex",height:"calc(100vh - 57px)"}}>
      <div style={{flex:1,overflow:"auto",padding:"20px 24px"}}>
        <div style={{display:"flex",gap:12,marginBottom:20}}>
          {[
            {label:"Transactions",value:transactions.length,sub:`${accounts.length} account${accounts.length>1?"s":""}`,icon:"🧾",color:PURPLE},
            {label:"6-Wk Actual Spend",value:`£${Math.round(totalActualByWeek.reduce((a,b)=>a+b,0)).toLocaleString()}`,sub:"all accounts",icon:"📉",color:"#10b981"},
            {label:"6-Wk Forecast",value:`£${Math.round(totalForecastByWeek.reduce((a,b)=>a+b,0)).toLocaleString()}`,sub:"rolling avg",icon:"🔮",color:PURPLE},
            {label:"Avg Weekly",value:`£${Math.round(totalActualByWeek.reduce((a,b)=>a+b,0)/Math.max(actualWeeks.length,1)).toLocaleString()}`,sub:"last 6 weeks",icon:"📆",color:"#f59e0b"},
          ].map((c,i)=>(
            <div key={i} style={{flex:1,background:"#fff",borderRadius:12,padding:"14px 18px",border:"1px solid #e5e7eb"}}>
              <div style={{display:"flex",justifyContent:"space-between"}}>
                <div style={{fontSize:11,fontWeight:600,color:"#9ca3af",marginBottom:6}}>{c.label}</div>
                <span style={{fontSize:18}}>{c.icon}</span>
              </div>
              <div style={{fontSize:22,fontWeight:800,color:c.color}}>{c.value}</div>
              <div style={{fontSize:11,color:"#9ca3af",marginTop:3}}>{c.sub}</div>
            </div>
          ))}
        </div>
        <div style={{background:"#fff",borderRadius:14,border:"1px solid #e5e7eb",overflow:"auto"}}>
          <table style={{width:"100%",borderCollapse:"collapse"}}>
            <thead>
              <tr style={{background:"#1e1b4b"}}>
                <th colSpan={2} style={{padding:"10px 12px",textAlign:"left"}}>
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
                <th colSpan={2} style={{padding:"5px 12px"}}/>
                {actualWeeks.map(w=><th key={w.key} style={{padding:"5px 10px",fontSize:11,fontWeight:700,color:"#374151",textAlign:"right",borderRight:"1px solid #efefef",whiteSpace:"nowrap"}}>{fmt(w.date)}</th>)}
                <th style={{background:"#f3f4f6",borderLeft:"2px solid #e5e7eb",borderRight:"2px solid #e5e7eb"}}/>
                {forecastWeeks.map(w=><th key={w.key} style={{padding:"5px 10px",fontSize:11,fontWeight:700,color:PURPLE,textAlign:"right",background:"rgba(99,102,241,0.05)",borderRight:"1px solid #e8e8f0",whiteSpace:"nowrap"}}>{fmt(w.date)}</th>)}
                <th style={{background:"rgba(99,102,241,0.05)",borderLeft:"2px solid #e5e7eb"}}/>
                <th style={{padding:"5px 8px",fontSize:10,fontWeight:700,color:"#9ca3af",textAlign:"center",whiteSpace:"nowrap"}}>BUDGET</th>
                <th/>
              </tr>
              <tr style={{background:"#f8fafc",borderBottom:"2px solid #e5e7eb"}}>
                <th colSpan={2} style={{padding:"2px 12px"}}/>
                {actualWeeks.map(w=><th key={w.key} style={{padding:"2px 10px 6px",fontSize:10,fontWeight:400,color:"#9ca3af",textAlign:"right",borderRight:"1px solid #efefef",whiteSpace:"nowrap"}}>{fmt(w.sunday)}</th>)}
                <th style={{background:"#f3f4f6",borderLeft:"2px solid #e5e7eb",borderRight:"2px solid #e5e7eb"}}/>
                {forecastWeeks.map(w=><th key={w.key} style={{padding:"2px 10px 6px",fontSize:10,fontWeight:400,color:"#9ca3af",textAlign:"right",background:"rgba(99,102,241,0.05)",borderRight:"1px solid #e8e8f0",whiteSpace:"nowrap"}}>{fmt(w.sunday)}</th>)}
                <th style={{background:"rgba(99,102,241,0.05)",borderLeft:"2px solid #e5e7eb"}}/><th/><th/>
              </tr>
            </thead>
            <tbody>
              {accounts.map(acc => (  <AccountSection
    key={acc}
    account={acc}
    categories={categories}
    actualWeeks={actualWeeks}
    forecastWeeks={forecastWeeks}
    weeklyByAccountCat={weeklyByAccountCat}
    forecastData={forecastData}
    weekBalances={weekBalances}
    budgets={budgets}
    setBudgets={setBudgets}
    hiddenCats={hiddenCats}
    setHiddenCats={setHiddenCats}
  />
))}
              <tr style={{background:"#111827",borderTop:"2px solid #374151"}}>
                <td colSpan={2} style={{padding:"9px 12px",fontSize:13,fontWeight:800,color:"#fff"}}>TOTAL SPEND</td>
                {totalActualByWeek.map((v,i)=><td key={i} style={{padding:"7px 10px",textAlign:"right",fontSize:12,fontWeight:700,color:"#f3f4f6",borderRight:"1px solid #374151"}}>{fmtMoney(v)}</td>)}
                <td style={{padding:"7px 10px",textAlign:"right",fontSize:12,fontWeight:800,color:"#fff",background:"#0f0e1a",borderLeft:"2px solid #374151",borderRight:"2px solid #374151"}}>{fmtMoney(totalActualByWeek.reduce((a,b)=>a+b,0))}</td>
                {totalForecastByWeek.map((v,i)=><td key={i} style={{padding:"7px 10px",textAlign:"right",fontSize:12,fontWeight:700,color:"#a5b4fc",background:"rgba(99,102,241,0.15)",borderRight:"1px solid #374151"}}>{fmtMoney(v)}</td>)}
                <td style={{padding:"7px 10px",textAlign:"right",fontSize:12,fontWeight:800,color:"#a5b4fc",background:"rgba(99,102,241,0.2)",borderLeft:"2px solid #374151"}}>{fmtMoney(totalForecastByWeek.reduce((a,b)=>a+b,0))}</td>
                <td style={{background:"#111827"}} colSpan={2}/>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      <div style={{width:aiOpen?280:42,flexShrink:0,background:"#fff",borderLeft:"1px solid #e5e7eb",transition:"width 0.3s",overflow:"hidden",display:"flex",flexDirection:"column"}}>
        <button onClick={()=>setAiOpen(p=>!p)} style={{display:"flex",alignItems:"center",gap:8,padding:"16px 14px",border:"none",background:"none",cursor:"pointer",borderBottom:"1px solid #f3f4f6",color:PURPLE,fontWeight:700,fontSize:13,whiteSpace:"nowrap"}}>
          <span style={{fontSize:16}}>🤖</span>
          {aiOpen&&"AI Advisor"}
          <span style={{marginLeft:"auto",fontSize:11}}>{aiOpen?"›":"‹"}</span>
        </button>
        {aiOpen&&(
          <div style={{padding:14,display:"flex",flexDirection:"column",gap:12,overflow:"auto"}}>
            <div style={{fontSize:11,color:"#9ca3af",fontWeight:600,letterSpacing:0.5}}>INSIGHTS</div>
            {insights.map((ins,i)=>(
              <div key={i} style={{background:"#fafafa",borderRadius:10,padding:"12px 14px",borderLeft:`3px solid ${ins.color}`}}>
                <div style={{display:"flex",gap:7,alignItems:"center",marginBottom:5}}>
                  <span style={{fontSize:14}}>{ins.icon}</span>
                  <span style={{fontSize:12,fontWeight:700}}>{ins.title}</span>
                </div>
                <p style={{fontSize:11,color:"#6b7280",margin:0,lineHeight:1.5}}>{ins.body}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function App() {
  const [screen, setScreen] = useState("upload");
  const [rawTransactions, setRawTransactions] = useState([]);
  const [multipleAccounts, setMultipleAccounts] = useState(false);
  const [categorisedTransactions, setCategorisedTransactions] = useState([]);
  const [sortedTransactions, setSortedTransactions] = useState([]);
  const [finalCategories, setFinalCategories] = useState([]);
  return (
    <div style={{fontFamily:"'Inter',system-ui,sans-serif",background:"#f8fafc",minHeight:"100vh"}}>
      {screen==="cashflow"&&(
        <div style={{background:"#fff",borderBottom:"1px solid #e5e7eb",padding:"0 24px",display:"flex",alignItems:"center",height:57}}>
          <img src={logo} alt="Abound" style={{height:36}}/>
          <button onClick={()=>setScreen("upload")} style={{marginLeft:24,fontSize:12,color:"#6b7280",border:"none",background:"none",cursor:"pointer"}}>← Start over</button>
        </div>
      )}
      {screen==="upload"&&<UploadScreen onDone={(txns,multi)=>{setRawTransactions(txns);setMultipleAccounts(multi);setScreen("categorise");}}/>}
      {screen==="categorise"&&<CategoriseScreen transactions={rawTransactions} multipleAccounts={multipleAccounts} onDone={(txns,cats)=>{setCategorisedTransactions(txns);setFinalCategories(cats);setScreen("sort");}}/>}
      {screen==="sort"&&<SortScreen transactions={categorisedTransactions} categories={finalCategories} onDone={(txns,cats)=>{setSortedTransactions(txns);setFinalCategories(cats);setScreen("cashflow");}}/>}
      {screen==="cashflow"&&<CashFlowScreen transactions={sortedTransactions} categories={finalCategories}/>}
    </div>
  );
}