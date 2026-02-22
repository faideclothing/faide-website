export default async function handler(req, res) {
  try {
    if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

    const { total, currency } = req.body || {};
    const amount = Number(total || 0).toFixed(2);

    if (!amount || Number(amount) <= 0) {
      return res.status(400).json({ error: "Invalid total" });
    }

    const clientId = process.env.PAYPAL_CLIENT_ID;
    const clientSecret = process.env.PAYPAL_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      return res.status(500).json({ error: "Missing PAYPAL env vars" });
    }

    // Get access token
    const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

    const tokenRes = await fetch("https://api-m.paypal.com/v1/oauth2/token", {
      method: "POST",
      headers: {
        Authorization: `Basic ${basicAuth}`,
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: "grant_type=client_credentials"
    });

    const tokenData = await tokenRes.json();
    if (!tokenRes.ok) return res.status(500).json({ error: tokenData?.error_description || "Token error" });

    const accessToken = tokenData.access_token;

    // Create order
    const orderRes = await fetch("https://api-m.paypal.com/v2/checkout/orders", {
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
              currency_code: currency || "ZAR",
              value: amount
            }
          }
        ]
      })
    });

    const orderData = await orderRes.json();
    if (!orderRes.ok) return res.status(500).json({ error: orderData?.message || "Order create error" });

    return res.status(200).json({ id: orderData.id });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
}