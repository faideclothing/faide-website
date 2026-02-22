const Stripe = require("stripe");

function getBaseUrl(req) {
  // Works on Vercel/Proxy
  const proto = req.headers["x-forwarded-proto"] || "https";
  const host = req.headers["x-forwarded-host"] || req.headers.host;
  return `${proto}://${host}`;
}

module.exports = async (req, res) => {
  try {
    if (req.method !== "POST") {
      res.setHeader("Allow", "POST");
      return res.status(405).json({ error: "Method not allowed" });
    }

    const secret = process.env.STRIPE_SECRET_KEY;
    if (!secret) return res.status(500).json({ error: "Missing STRIPE_SECRET_KEY env var" });

    const stripe = new Stripe(secret, { apiVersion: "2024-06-20" });

    const body = req.body || {};
    const cart = Array.isArray(body.cart) ? body.cart : [];

    if (!cart.length) return res.status(400).json({ error: "Cart is empty" });

    // currency must be lowercase for Stripe
    const currency = String(cart[0]?.currency || "ZAR").toLowerCase();

    const line_items = cart.map((item) => {
      const unit_amount = Number(item.unit_amount || 0);
      const quantity = Math.max(1, Number(item.quantity || 1));

      return {
        quantity,
        price_data: {
          currency,
          unit_amount,
          product_data: {
            name: String(item.name || "Item"),
            images: item.image ? [String(item.image)] : [],
            metadata: {
              id: String(item.id || ""),
              size: String(item.size || ""),
              color: String(item.color || "")
            }
          }
        }
      };
    });

    const baseUrl = getBaseUrl(req);

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items,
      success_url: `${baseUrl}/success.html`,
      cancel_url: `${baseUrl}/cancel.html`,
      billing_address_collection: "auto",
      shipping_address_collection: { allowed_countries: ["ZA"] },
      phone_number_collection: { enabled: true },
      metadata: {
        source: "faide-site"
      }
    });

    return res.status(200).json({ url: session.url });
  } catch (err) {
    console.error("create-checkout-session error:", err);
    return res.status(500).json({ error: "Server error" });
  }
};