export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const { ticker } = req.body;
  if (!ticker) return res.status(400).json({ error: "ticker required" });

  const symbol = ticker.trim().toUpperCase();
  const url = `https://query1.finance.yahoo.com/v8/finance/quote?symbols=${encodeURIComponent(symbol)}&fields=regularMarketPrice,longName,shortName,currency`;

  try {
    const r = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; Abound/1.0)" },
    });
    if (!r.ok) return res.status(404).json({ error: "Ticker not found" });

    const data = await r.json();
    const quote = data?.quoteResponse?.result?.[0];
    if (!quote) return res.status(404).json({ error: "Ticker not found" });

    res.status(200).json({
      ticker: quote.symbol,
      name: quote.longName || quote.shortName || quote.symbol,
      currency: quote.currency || "USD",
      price: quote.regularMarketPrice ?? null,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
