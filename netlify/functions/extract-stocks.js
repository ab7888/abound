exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' };
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return { statusCode: 500, body: JSON.stringify({ error: 'API key not configured' }) };

  try {
    const { imageBase64, mediaType } = JSON.parse(event.body || '{}');
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-opus-4-7',
        max_tokens: 600,
        messages: [{
          role: 'user',
          content: [
            { type: 'image', source: { type: 'base64', media_type: mediaType, data: imageBase64 } },
            { type: 'text', text: 'Extract all stock/ETF holdings shown. Return ONLY a JSON array like: [{"ticker":"AAPL","value":1234.56,"shares":10,"name":"Apple Inc"}]. Use standard ticker symbols (e.g. AAPL, TSLA, BARC.L for UK). If shares not visible omit the shares field. If value not visible omit value field. Return [] if no stocks found.' },
          ],
        }],
      }),
    });
    const data = await response.json();
    const text = data.content?.[0]?.text?.trim() || '[]';
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    const stocks = jsonMatch ? JSON.parse(jsonMatch[0]) : [];
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(stocks),
    };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
