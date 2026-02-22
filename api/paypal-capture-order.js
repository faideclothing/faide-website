export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { orderID } = req.body || {};
    if (!orderID) return res.status(400).json({ error: "Missing orderID" });

    const clientId = process.env.PAYPAL_CLIENT_ID;
    const clientSecret = process.env.PAYPAL_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      return res.status(500).json({ error: "Missing PAYPAL_CLIENT_ID or PAYPAL_CLIENT_SECRET" });
    }

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

    // Capture
    const captureResp = await fetch(`${baseUrl}/v2/checkout/orders/${orderID}/capture`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json"
      }
    });

    const captureData = await captureResp.json();
    if (!captureResp.ok) {
      return res.status(500).json({ error: "PayPal capture error", details: captureData });
    }

    return res.status(200).json({ status: "captured", capture: captureData });
  } catch (err) {
    return res.status(500).json({ error: "Server error", details: String(err) });
  }
}