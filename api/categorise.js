import { verifyToken } from "./_token.js";
import { checkSession, checkIP } from "./_ratelimit.js";

const SESSION_LIMIT  = 50;
const IP_LIMIT       = 200;
const IP_WINDOW_MS   = 60 * 60 * 1000;

// The client only ever sends one model and a small max_tokens, but nothing stopped a direct
// API call from requesting a pricier model or a huge completion on Abound's own Anthropic key.
// Allowlist the model and hard-cap tokens server-side regardless of what's asked for.
const ALLOWED_MODELS = new Set(["claude-haiku-4-5-20251001"]);
const MAX_TOKENS_CAP = 1024;

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const sessionId    = req.headers["x-session-id"] || "";
  const ip           = req.headers["x-forwarded-for"] || req.socket?.remoteAddress || "";
  const premiumToken = req.headers["x-premium-token"] || "";

  // A verified server-signed premium token bypasses free-tier rate limits.
  // verifyToken checks the HMAC signature and expiry — client cannot forge this.
  const isPremiumUser = !!verifyToken(premiumToken);

  if (!isPremiumUser && checkSession(sessionId, SESSION_LIMIT)) {
    return res.status(429).json({ error: "limit_reached", message: "Categorisation limit reached for this session." });
  }
  if (!isPremiumUser && checkIP(ip, IP_LIMIT, IP_WINDOW_MS)) {
    return res.status(429).json({ error: "limit_reached", message: "Too many requests from this location. Please try again in an hour." });
  }

  const apiKey = process.env.ANTHROPIC_KEY || process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return res.status(500).json({ error: "ANTHROPIC_KEY environment variable is not set" });

  const { messages, max_tokens, model } = req.body;
  if (!messages || !model) return res.status(400).json({ error: "messages and model are required" });
  if (!ALLOWED_MODELS.has(model)) return res.status(400).json({ error: "Unsupported model" });
  const safeMaxTokens = Math.min(Number(max_tokens) || 0, MAX_TOKENS_CAP) || MAX_TOKENS_CAP;

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({ model, max_tokens: safeMaxTokens, messages }),
    });

    const data = await response.json();
    res.status(response.status).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
