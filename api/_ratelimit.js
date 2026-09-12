// Shared in-memory rate limiting — survives within a warm Vercel instance, resets on cold
// start. Good enough for abuse prevention on a personal-finance app's AI endpoints.
// To upgrade to persistent limits: install @vercel/kv, swap in kv.incr / kv.expire below.

const sessionCounts = new Map(); // sessionId → count
const ipWindows    = new Map(); // ip → { count, windowStart }

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function checkSession(id, limit) {
  if (!id || !UUID_RE.test(id)) return false; // malformed → don't count, don't block
  const current = sessionCounts.get(id) || 0;
  if (current >= limit) return true; // already over limit
  sessionCounts.set(id, current + 1);
  return false;
}

export function checkIP(raw, limit, windowMs) {
  if (!raw) return false;
  const ip = String(raw).split(",")[0].trim();
  const now = Date.now();
  const entry = ipWindows.get(ip) || { count: 0, windowStart: now };
  if (now - entry.windowStart > windowMs) { entry.count = 0; entry.windowStart = now; }
  if (entry.count >= limit) return true;
  entry.count++;
  ipWindows.set(ip, entry);
  return false;
}
