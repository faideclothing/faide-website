export default async function handler(req, res) {
  try {
    if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

    const { orderID } = req.body || {};
    if (!orderID) return res.status(400).json({ error: "Missing orderID" });

    const clientId = process.env.PAYPAL_CLIENT_ID;
    const clientSecret = process.env.PAYPAL_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      return res.status(500).json({ error: "Missing PAYPAL env vars" });
    }

    const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

    // Get access token
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

    // Capture order
    const capRes = await fetch(`https://api-m.paypal.com/v2/checkout/orders/${orderID}/capture`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json"
      }
    });

    const capData = await capRes.json();
    if (!capRes.ok) return res.status(500).json({ error: capData?.message || "Capture error" });

    return res.status(200).json(capData);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
}