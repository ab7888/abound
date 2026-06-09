// In-memory rate limiting — survives within a warm Vercel instance, resets on cold start.
// Good enough for abuse prevention on a personal-finance app.
// To upgrade to persistent limits: install @vercel/kv, swap in kv.incr / kv.expire below.
const sessionCounts = new Map(); // sessionId → count
const ipWindows    = new Map(); // ip → { count, windowStart }

const SESSION_LIMIT  = 50;
const IP_LIMIT       = 200;
const IP_WINDOW_MS   = 60 * 60 * 1000;
const UUID_RE        = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function checkSession(id) {
  if (!id || !UUID_RE.test(id)) return false; // malformed → don't count, don't block
  const current = sessionCounts.get(id) || 0;
  if (current >= SESSION_LIMIT) return true;  // already over limit
  sessionCounts.set(id, current + 1);
  return false;
}

function checkIP(raw) {
  if (!raw) return false;
  const ip = String(raw).split(",")[0].trim();
  const now = Date.now();
  const entry = ipWindows.get(ip) || { count: 0, windowStart: now };
  if (now - entry.windowStart > IP_WINDOW_MS) { entry.count = 0; entry.windowStart = now; }
  if (entry.count >= IP_LIMIT) return true;
  entry.count++;
  ipWindows.set(ip, entry);
  return false;
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const sessionId = req.headers["x-session-id"] || "";
  const ip        = req.headers["x-forwarded-for"] || req.socket?.remoteAddress || "";

  if (checkSession(sessionId)) {
    return res.status(429).json({ error: "limit_reached", message: "Categorisation limit reached for this session." });
  }
  if (checkIP(ip)) {
    return res.status(429).json({ error: "limit_reached", message: "Too many requests from this location. Please try again in an hour." });
  }

  const apiKey = process.env.ANTHROPIC_KEY || process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return res.status(500).json({ error: "ANTHROPIC_KEY environment variable is not set" });

  const { messages, max_tokens, model } = req.body;
  if (!messages || !model) return res.status(400).json({ error: "messages and model are required" });

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({ model, max_tokens, messages }),
    });

    const data = await response.json();
    res.status(response.status).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
