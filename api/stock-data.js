import https from "https";

function httpsGet(url) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "application/json, text/plain, */*",
        "Accept-Language": "en-US,en;q=0.9",
        "Referer": "https://finance.yahoo.com/",
        "Origin": "https://finance.yahoo.com",
      },
    }, (res) => {
      let data = "";
      res.on("data", chunk => { data += chunk; });
      res.on("end", () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(data) }); }
        catch (e) { resolve({ status: res.statusCode, body: null, raw: data.slice(0, 200) }); }
      });
    });
    req.on("error", reject);
    req.setTimeout(10000, () => { req.destroy(); reject(new Error("Timeout")); });
  });
}

// Try the v8 quote endpoint
async function tryQuoteApi(symbol) {
  const url = `https://query1.finance.yahoo.com/v8/finance/quote?symbols=${encodeURIComponent(symbol)}&fields=regularMarketPrice,longName,shortName,currency,regularMarketChange,regularMarketChangePercent`;
  const { status, body } = await httpsGet(url);
  if (status !== 200 || !body) return null;
  const quote = body?.quoteResponse?.result?.[0];
  if (!quote || quote.regularMarketPrice == null) return null;
  return {
    ticker: quote.symbol,
    name: quote.longName || quote.shortName || quote.symbol,
    currency: quote.currency || "USD",
    price: quote.regularMarketPrice,
    change: quote.regularMarketChange ?? null,
    changePct: quote.regularMarketChangePercent ?? null,
  };
}

// Fallback: chart API (more permissive, different structure)
async function tryChartApi(symbol) {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=1d&interval=1d`;
  const { status, body } = await httpsGet(url);
  if (status !== 200 || !body) return null;
  const meta = body?.chart?.result?.[0]?.meta;
  if (!meta || meta.regularMarketPrice == null) return null;
  return {
    ticker: meta.symbol || symbol,
    name: meta.longName || meta.shortName || meta.symbol || symbol,
    currency: meta.currency || "USD",
    price: meta.regularMarketPrice,
    change: meta.regularMarketPrice - (meta.previousClose ?? meta.chartPreviousClose ?? meta.regularMarketPrice),
    changePct: meta.previousClose
      ? ((meta.regularMarketPrice - meta.previousClose) / meta.previousClose) * 100
      : null,
  };
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const { ticker } = req.body || {};
  if (!ticker) return res.status(400).json({ error: "ticker required" });

  const symbol = ticker.trim().toUpperCase();

  try {
    const result = await tryQuoteApi(symbol) || await tryChartApi(symbol);
    if (!result) return res.status(404).json({ error: `Ticker "${symbol}" not found` });
    res.status(200).json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
