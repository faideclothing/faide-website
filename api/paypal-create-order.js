export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { cart, currency = "ZAR" } = req.body || {};

    if (!Array.isArray(cart) || cart.length === 0) {
      return res.status(400).json({ error: "Cart is empty" });
    }

    const total = cart.reduce((sum, item) => {
      const price = Number(item.price || 0);
      const qty = Math.max(1, Number(item.quantity || 1));
      return sum + price * qty;
    }, 0);

    const totalStr = total.toFixed(2);

    const clientId = process.env.PAYPAL_CLIENT_ID;
    const clientSecret = process.env.PAYPAL_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      return res.status(500).json({ error: "Missing PAYPAL_CLIENT_ID or PAYPAL_CLIENT_SECRET" });
    }

    // Optional env: PAYPAL_ENV = "sandbox" or "live"
    const env = (process.env.PAYPAL_ENV || "live").toLowerCase();
    const baseUrl = env === "sandbox" ? "https://api-m.sandbox.paypal.com" : "https://api-m.paypal.com";

    const auth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

    // Access token
    const tokenResp = await fetch(`${baseUrl}/v1/oauth2/token`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: "grant_type=client_credentials"
    });

    const tokenData = await tokenResp.json();
    if (!tokenResp.ok) {
      return res.status(500).json({ error: "PayPal token error", details: tokenData });
    }

    const accessToken = tokenData.access_token;

    // Create Order
    const orderResp = await fetch(`${baseUrl}/v2/checkout/orders`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        intent: "CAPTURE",
        purchase_units: [
          {
            amount: {
              currency_code: currency,
              value: totalStr
            }
          }
        ]
      })
    });

    const orderData = await orderResp.json();
    if (!orderResp.ok) {
      return res.status(500).json({ error: "PayPal order error", details: orderData });
    }

    return res.status(200).json({ id: orderData.id });
  } catch (err) {
    return res.status(500).json({ error: "Server error", details: String(err) });
  }
}