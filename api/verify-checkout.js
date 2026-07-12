// Verifies a Stripe Checkout session server-side and returns a signed premium token.
// Called by the client after Stripe redirects back with ?session_id=...
import Stripe from "stripe";
import { signPremiumToken } from "./_token.js";

const EXPECTED_PRICE_ID = "price_1TPlZvPcKkSmNBEQXzjOGBqB";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const { sessionId } = req.body || {};
  if (!sessionId || typeof sessionId !== "string") {
    return res.status(400).json({ error: "sessionId required" });
  }

  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) return res.status(500).json({ error: "STRIPE_SECRET_KEY not set" });

  try {
    const stripe = new Stripe(secretKey);
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["line_items"],
    });

    if (session.payment_status !== "paid") {
      return res.status(402).json({ error: "Payment not completed" });
    }

    const priceMatch = session.line_items?.data?.some(
      item => item.price?.id === EXPECTED_PRICE_ID
    );
    if (!priceMatch) {
      return res.status(403).json({ error: "Invalid product" });
    }

    const token = signPremiumToken();
    return res.status(200).json({ token });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
