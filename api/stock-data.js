import https from "https";

function httpsGet(url) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Accept": "application/json",
      },
    }, (res) => {
      let data = "";
      res.on("data", chunk => { data += chunk; });
      res.on("end", () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(data) }); }
        catch (e) { reject(new Error("Invalid JSON")); }
      });
    });
    req.on("error", reject);
    req.setTimeout(8000, () => { req.destroy(); reject(new Error("Timeout")); });
  });
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const { ticker } = req.body || {};
  if (!ticker) return res.status(400).json({ error: "ticker required" });

  const symbol = ticker.trim().toUpperCase();
  const url = `https://query2.finance.yahoo.com/v8/finance/quote?symbols=${encodeURIComponent(symbol)}&fields=regularMarketPrice,longName,shortName,currency,regularMarketChange,regularMarketChangePercent`;

  try {
    const { status, body } = await httpsGet(url);
    if (status !== 200) return res.status(404).json({ error: "Ticker not found" });

    const quote = body?.quoteResponse?.result?.[0];
    if (!quote) return res.status(404).json({ error: "Ticker not found" });

    res.status(200).json({
      ticker: quote.symbol,
      name: quote.longName || quote.shortName || quote.symbol,
      currency: quote.currency || "USD",
      price: quote.regularMarketPrice ?? null,
      change: quote.regularMarketChange ?? null,
      changePct: quote.regularMarketChangePercent ?? null,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
