// api/create-checkout-session.js
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Helper: build absolute site url
function getBaseUrl(req) {
  const envUrl = process.env.SITE_URL;
  if (envUrl) return envUrl.replace(/\/$/, "");

  // fallback for Vercel
  const proto = req.headers["x-forwarded-proto"] || "https";
  const host = req.headers["x-forwarded-host"] || req.headers.host;
  return `${proto}://${host}`.replace(/\/$/, "");
}

export default async function handler(req, res) {
  // Allow only POST
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { cart } = req.body || {};
    if (!Array.isArray(cart) || cart.length === 0) {
      return res.status(400).json({ error: "Cart is empty" });
    }

    // Build line items for Stripe
    const line_items = cart.map((item) => {
      const name = String(item?.name || "Item");
      const currency = String(item?.currency || "zar").toLowerCase();
      const unit_amount = Number(item?.unit_amount || 0);
      const quantity = Number(item?.quantity || 1);

      if (!unit_amount || unit_amount < 50) {
        // Stripe usually needs >= 0.50 in smallest unit (for many currencies)
        throw new Error("Invalid price");
      }

      const size = String(item?.size || "");
      const color = String(item?.color || "");
      const meta = [size && `Size: ${size}`, color && `Color: ${color}`].filter(Boolean).join(" • ");

      return {
        price_data: {
          currency,
          product_data: {
            name,
            description: meta || undefined,
            images: item?.image ? [String(item.image)] : undefined
          },
          unit_amount
        },
        quantity: Math.max(1, quantity)
      };
    });

    const baseUrl = getBaseUrl(req);

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items,
      success_url: `${baseUrl}/?success=1`,
      cancel_url: `${baseUrl}/?canceled=1`,
      // optional: collects email on Stripe checkout
      // customer_email: ...
      // optional: shipping address collection
      shipping_address_collection: { allowed_countries: ["ZA"] }
    });

    return res.status(200).json({ url: session.url });
  } catch (err) {
    console.error("Stripe checkout error:", err);
    return res.status(500).json({
      error: "Checkout session creation failed",
      message: err?.message || "Unknown error"
    });
  }
}