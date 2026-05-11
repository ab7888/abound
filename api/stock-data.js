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
        catch (e) { resolve({ status: res.statusCode, body: null }); }
      });
    });
    req.on("error", reject);
    req.setTimeout(10000, () => { req.destroy(); reject(new Error("Timeout")); });
  });
}

async function fetchChartData(symbol) {
  // Fetch 6 months of weekly data — covers actual weeks + gives forecast trend
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=6mo&interval=1wk`;
  const { status, body } = await httpsGet(url);
  if (status !== 200 || !body) return null;

  const result = body?.chart?.result?.[0];
  if (!result) return null;

  const meta = result.meta;
  if (!meta || meta.regularMarketPrice == null) return null;

  const timestamps = result.timestamp || [];
  const closes = result.indicators?.quote?.[0]?.close || [];

  const history = timestamps
    .map((ts, i) => ({ date: new Date(ts * 1000).toISOString().slice(0, 10), close: closes[i] }))
    .filter(h => h.close != null);

  const price = meta.regularMarketPrice;
  const prev = meta.previousClose ?? meta.chartPreviousClose ?? price;

  return {
    ticker: meta.symbol || symbol,
    name: meta.longName || meta.shortName || symbol,
    currency: meta.currency || "USD",
    price,
    change: price - prev,
    changePct: prev ? ((price - prev) / prev) * 100 : null,
    history,
  };
}

async function fetchQuoteOnly(symbol) {
  const url = `https://query1.finance.yahoo.com/v8/finance/quote?symbols=${encodeURIComponent(symbol)}&fields=regularMarketPrice,longName,shortName,currency,regularMarketChange,regularMarketChangePercent,previousClose`;
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
    history: [],
  };
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const { ticker } = req.body || {};
  if (!ticker) return res.status(400).json({ error: "ticker required" });

  const symbol = ticker.trim().toUpperCase();

  try {
    // Chart API gives us both current price and history — preferred
    const result = await fetchChartData(symbol) || await fetchQuoteOnly(symbol);
    if (!result) return res.status(404).json({ error: `Ticker "${symbol}" not found` });
    res.status(200).json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
