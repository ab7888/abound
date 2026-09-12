import Stripe from 'stripe';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) return res.status(500).json({ error: 'STRIPE_SECRET_KEY not set' });

  const stripe = new Stripe(secretKey);
  // origin/referer are attacker-controlled headers. Used unvalidated, a crafted request could
  // point Stripe's post-payment redirect at an arbitrary domain — an open redirect off a real
  // payment flow. Only ever redirect back to a domain Abound actually serves from.
  const ALLOWED_ORIGINS = [
    'https://tryabound.app',
    'https://abound-umber.vercel.app',
    'http://localhost:5173',
  ];
  const requested = req.headers.origin || req.headers.referer || '';
  const origin = ALLOWED_ORIGINS.find(o => requested.startsWith(o)) || 'https://tryabound.app';

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'subscription',
      line_items: [{ price: 'price_1TPlZvPcKkSmNBEQXzjOGBqB', quantity: 1 }],
      success_url: `${origin}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}?upgraded=false`,
      allow_promotion_codes: true,
    });

    res.status(200).json({ url: session.url });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
