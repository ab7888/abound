// Validates a promo code (server-side) and returns a signed premium token.
// Promo codes are stored in PROMO_CODES env var as a comma-separated list.
import { signPremiumToken } from "./_token.js";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const { code } = req.body || {};
  if (!code || typeof code !== "string") {
    return res.status(400).json({ error: "code required" });
  }

  const rawCodes = process.env.PROMO_CODES || "";
  const validCodes = rawCodes
    .split(",")
    .map(c => c.trim().toLowerCase())
    .filter(Boolean);

  if (validCodes.length === 0) {
    return res.status(503).json({ error: "No promo codes configured" });
  }

  if (!validCodes.includes(code.trim().toLowerCase())) {
    return res.status(403).json({ error: "Invalid code" });
  }

  try {
    const token = signPremiumToken();
    return res.status(200).json({ token });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
