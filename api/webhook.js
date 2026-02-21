import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2024-06-20",
});

export const config = {
  api: {
    bodyParser: false,
  },
};

async function getRawBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  return Buffer.concat(chunks);
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).send("Method Not Allowed");
  }

  try {
    const sig = req.headers["stripe-signature"];
    if (!sig) return res.status(400).send("Missing stripe-signature header");
    if (!process.env.STRIPE_WEBHOOK_SECRET) return res.status(500).send("Missing STRIPE_WEBHOOK_SECRET");

    const rawBody = await getRawBody(req);
    const event = stripe.webhooks.constructEvent(rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET);

    // ✅ Handle successful payment
    if (event.type === "checkout.session.completed") {
      const session = event.data.object;

      // Here is where you would:
      // - save the order to a database
      // - notify yourself by email/whatsapp
      // - trigger fulfillment workflow

      console.log("✅ Payment completed:", {
        id: session.id,
        amount_total: session.amount_total,
        currency: session.currency,
        customer_details: session.customer_details,
      });
    }

    return res.status(200).send("ok");
  } catch (err) {
    console.error("Webhook error:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }
}