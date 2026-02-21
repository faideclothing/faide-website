import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2024-06-20",
});

function safeJson(res, status, data) {
  res.status(status).setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(data));
}

function isValidCartItem(item) {
  if (!item) return false;
  if (typeof item.id !== "string" || item.id.length < 1) return false;
  if (typeof item.name !== "string" || item.name.length < 1) return false;
  if (typeof item.currency !== "string" || item.currency.length < 3) return false;
  if (typeof item.unit_amount !== "number" || !Number.isFinite(item.unit_amount) || item.unit_amount < 1) return false;
  if (typeof item.quantity !== "number" || !Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 20)
    return false;
  if (typeof item.size !== "string" || item.size.length < 1) return false;
  if (typeof item.color !== "string" || item.color.length < 1) return false;
  if (item.image && typeof item.image !== "string") return false;
  return true;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return safeJson(res, 405, { error: "Method not allowed" });
  }

  try {
    if (!process.env.STRIPE_SECRET_KEY) {
      return safeJson(res, 500, { error: "Stripe secret key not set on server." });
    }

    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    const cart = body?.cart;

    if (!Array.isArray(cart) || cart.length === 0) {
      return safeJson(res, 400, { error: "Cart is empty." });
    }

    const invalid = cart.find((x) => !isValidCartItem(x));
    if (invalid) {
      return safeJson(res, 400, { error: "Invalid cart item.", invalid });
    }

    const origin =
      req.headers["x-forwarded-proto"] && req.headers["x-forwarded-host"]
        ? `${req.headers["x-forwarded-proto"]}://${req.headers["x-forwarded-host"]}`
        : (req.headers.origin || "https://faideclothing.com");

    const line_items = cart.map((item) => ({
      quantity: item.quantity,
      price_data: {
        currency: item.currency.toLowerCase(),
        unit_amount: item.unit_amount,
        product_data: {
          name: item.name,
          images: item.image ? [new URL(item.image, origin).toString()] : [],
          metadata: {
            product_id: item.id,
            size: item.size,
            color: item.color
          }
        }
      }
    }));

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items,
      success_url: `${origin}/success.html?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/cancel.html`,
      billing_address_collection: "required",
      shipping_address_collection: {
        allowed_countries: ["ZA"]
      },
      phone_number_collection: { enabled: true },
      allow_promotion_codes: true,
      metadata: {
        brand: "FAIDE",
        cart_items: String(cart.length)
      }
    });

    return safeJson(res, 200, { url: session.url });
  } catch (err) {
    console.error(err);
    return safeJson(res, 500, { error: "Server error creating Stripe session." });
  }
}