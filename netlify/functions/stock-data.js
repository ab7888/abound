exports.handler = async (event) => {
  const { ticker } = JSON.parse(event.body || '{}');
  if (!ticker) return { statusCode: 400, body: JSON.stringify({ error: 'Missing ticker' }) };

  try {
    const sym = encodeURIComponent(ticker.toUpperCase());
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${sym}?interval=1wk&range=3mo&includePrePost=false`;
    const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    const data = await res.json();

    const result = data.chart?.result?.[0];
    if (!result) return { statusCode: 404, body: JSON.stringify({ error: 'Ticker not found' }) };

    const timestamps = result.timestamp || [];
    const closes = result.indicators?.quote?.[0]?.close || [];
    const currency = result.meta?.currency || 'USD';
    const currentPrice = result.meta?.regularMarketPrice;
    const name = result.meta?.longName || result.meta?.shortName || ticker;

    const history = timestamps
      .map((ts, i) => ({ date: new Date(ts * 1000).toISOString().slice(0, 10), close: closes[i] }))
      .filter(h => h.close != null);

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ ticker: ticker.toUpperCase(), name, currency, currentPrice, history }),
    };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
