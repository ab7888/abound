const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

async function getYahooCrumb() {
  // Step 1: hit the consent page to get session cookies
  const cookieRes = await fetch('https://fc.yahoo.com', {
    headers: { 'User-Agent': UA },
    redirect: 'follow',
  });
  const rawCookies = cookieRes.headers.get('set-cookie') || '';
  // Extract A3 cookie value (the important one)
  const cookie = rawCookies.split(',').map(c => c.split(';')[0].trim()).join('; ');

  // Step 2: exchange cookie for a crumb
  const crumbRes = await fetch('https://query1.finance.yahoo.com/v1/test/getcrumb', {
    headers: { 'User-Agent': UA, 'Cookie': cookie },
  });
  const crumb = await crumbRes.text();
  if (!crumb || crumb.includes('<')) throw new Error('crumb-failed');
  return { crumb, cookie };
}

exports.handler = async (event) => {
  const { ticker } = JSON.parse(event.body || '{}');
  if (!ticker) return { statusCode: 400, body: JSON.stringify({ error: 'Missing ticker' }) };

  const sym = encodeURIComponent(ticker.toUpperCase());

  try {
    const { crumb, cookie } = await getYahooCrumb();
    const url = `https://query2.finance.yahoo.com/v8/finance/chart/${sym}?interval=1wk&range=3mo&includePrePost=false&crumb=${encodeURIComponent(crumb)}`;
    const res = await fetch(url, {
      headers: { 'User-Agent': UA, 'Cookie': cookie },
    });
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
