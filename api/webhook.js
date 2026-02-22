const Stripe = require("stripe");

module.exports = async (req, res) => {
  const secret = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!secret) return res.status(500).send("Missing STRIPE_SECRET_KEY");
  if (!webhookSecret) return res.status(500).send("Missing STRIPE_WEBHOOK_SECRET");

  const stripe = new Stripe(secret, { apiVersion: "2024-06-20" });

  let event;

  try {
    // Vercel gives raw body in req.body sometimes, but often parsed.
    // Best effort:
    const sig = req.headers["stripe-signature"];
    const rawBody = req.body && typeof req.body === "string"
      ? req.body
      : JSON.stringify(req.body || {});

    event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
  } catch (err) {
    console.error("Webhook signature check failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      console.log("✅ Payment completed:", session.id);
      // You can store orders in a database later if you want.
    }

    return res.json({ received: true });
  } catch (err) {
    console.error("Webhook handler failed:", err);
    return res.status(500).send("Webhook handler failed");
  }
};