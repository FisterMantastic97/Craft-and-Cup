// Server-side proxy to Anthropic for AI flavor mapping.
// Keeps ANTHROPIC_API_KEY off the client (a direct browser call to
// api.anthropic.com fails CORS and would expose the key). The client
// POSTs { prompt }; this route adds the key + version headers server-side
// and returns Anthropic's raw response so the client parsing is unchanged.
//
// Requires ANTHROPIC_API_KEY to be set in the deployment environment (Vercel).

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(503).json({ error: "AI is not configured on the server." });
  }

  const { prompt } = req.body || {};
  if (!prompt || typeof prompt !== "string") {
    return res.status(400).json({ error: "Missing or invalid prompt." });
  }
  // Defensive upper bound so a huge body can't be forwarded.
  if (prompt.length > 12000) {
    return res.status(413).json({ error: "Prompt too long." });
  }

  try {
    const upstream = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1000,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!upstream.ok) {
      const detail = await upstream.text().catch(() => "");
      return res.status(upstream.status === 401 ? 502 : upstream.status).json({
        error: `AI service error (${upstream.status})`,
        detail: detail.slice(0, 300),
      });
    }

    const data = await upstream.json();
    return res.status(200).json(data);
  } catch {
    return res.status(502).json({ error: "Could not reach the AI service." });
  }
}
