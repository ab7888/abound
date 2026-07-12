// Shared HMAC-signed premium token utilities.
// Format: <base64url-payload>.<base64url-sig>
// Payload: { sub: "premium", exp: <epoch_ms> }
// Secret: PREMIUM_TOKEN_SECRET env var — must be set on Vercel.
import crypto from "crypto";

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

function getSecret() {
  const s = process.env.PREMIUM_TOKEN_SECRET;
  if (!s) throw new Error("PREMIUM_TOKEN_SECRET env var is not set");
  return s;
}

export function signPremiumToken() {
  const payload = { sub: "premium", exp: Date.now() + THIRTY_DAYS_MS };
  const data = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const sig = crypto.createHmac("sha256", getSecret()).update(data).digest("base64url");
  return `${data}.${sig}`;
}

// Returns the payload object if the token is valid and unexpired, or null.
export function verifyToken(token) {
  if (!token) return null;
  let secret;
  try { secret = getSecret(); } catch { return null; }
  const dot = token.lastIndexOf(".");
  if (dot < 1) return null;
  const data = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  let expected;
  try {
    expected = crypto.createHmac("sha256", secret).update(data).digest("base64url");
  } catch { return null; }
  // Constant-time compare — both must be the same byte length
  const sigBuf = Buffer.from(sig, "base64url");
  const expBuf = Buffer.from(expected, "base64url");
  if (sigBuf.length !== expBuf.length) return null;
  try {
    if (!crypto.timingSafeEqual(sigBuf, expBuf)) return null;
  } catch { return null; }
  try {
    const payload = JSON.parse(Buffer.from(data, "base64url").toString("utf8"));
    if (typeof payload.exp !== "number" || payload.exp < Date.now()) return null;
    return payload;
  } catch { return null; }
}
