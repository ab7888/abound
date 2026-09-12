import { checkSession, checkIP } from "./_ratelimit.js";

// Unlike categorise.js this endpoint had no rate limiting at all — an anonymous caller could
// POST arbitrary images in an unbounded loop and run up Abound's own Anthropic bill. Same
// limits as categorise.js.
const SESSION_LIMIT = 50;
const IP_LIMIT       = 200;
const IP_WINDOW_MS   = 60 * 60 * 1000;

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const sessionId = req.headers["x-session-id"] || "";
  const ip        = req.headers["x-forwarded-for"] || req.socket?.remoteAddress || "";
  if (checkSession(sessionId, SESSION_LIMIT)) {
    return res.status(429).json({ error: "limit_reached", message: "Limit reached for this session." });
  }
  if (checkIP(ip, IP_LIMIT, IP_WINDOW_MS)) {
    return res.status(429).json({ error: "limit_reached", message: "Too many requests from this location. Please try again in an hour." });
  }

  const apiKey = process.env.ANTHROPIC_KEY || process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return res.status(500).json({ error: "ANTHROPIC_KEY not set" });

  const { imageBase64, mediaType } = req.body || {};
  if (!imageBase64) return res.status(400).json({ error: "imageBase64 required" });

  const validType = ["image/jpeg", "image/png", "image/gif", "image/webp"].includes(mediaType)
    ? mediaType
    : "image/jpeg";

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 512,
        messages: [{
          role: "user",
          content: [
            {
              type: "image",
              source: { type: "base64", media_type: validType, data: imageBase64 },
            },
            {
              type: "text",
              text: `Extract all stock/crypto/ETF holdings from this screenshot. Return ONLY a JSON array, no other text.
Each item: {"ticker": "SYMBOL", "value": number_or_null}
- ticker: the symbol without $ or currency prefix (e.g. GOOGL, BTC-USD, AAPL)
- value: the monetary value of the holding in the account currency if shown, otherwise null
- Ignore currency conversion rows, totals, or non-security items
- If the numbers shown are share quantities not values, set value to null
Example: [{"ticker":"AAPL","value":1250.50},{"ticker":"BTC-USD","value":null}]`,
            },
          ],
        }],
      }),
    });

    const data = await response.json();
    if (!response.ok) return res.status(response.status).json({ error: data?.error?.message || "API error" });

    const text = data.content?.[0]?.text?.trim() || "";
    const match = text.match(/\[[\s\S]*\]/);
    if (!match) return res.status(200).json([]);

    const parsed = JSON.parse(match[0]);
    if (!Array.isArray(parsed)) return res.status(200).json([]);

    const stocks = parsed
      .filter(s => s && typeof s.ticker === "string" && s.ticker.trim())
      .map(s => ({ ticker: s.ticker.trim().toUpperCase().replace(/^\$/, ""), value: typeof s.value === "number" ? s.value : null }));

    res.status(200).json(stocks);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
