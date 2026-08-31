// Server-side proxy to Anthropic for palate-grounded coffee recommendations.
// Mirrors /api/analyze layer for layer:
//   1. POST only.
//   2. Requires a valid Supabase session (Bearer token).
//   3. Monthly per-user quota via consume_rec_credit() (see supabase-rec-quota.sql),
//      with a lightweight in-memory limiter as a FALLBACK if that RPC is absent.
//   4. Server-side low-data short circuit BEFORE any AI call, so a sparse palate
//      never spends a credit.
//   5. Same env-gated AI Gateway or direct Anthropic routing as /api/analyze.
//   6. Guarded parse and shape validation; never leaks a raw exception.
//
// The client sends STRUCTURED palate data, never prompt text. The prompt is
// assembled here so this endpoint cannot be driven as a general-purpose LLM.
//
// Requires NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, and
// ANTHROPIC_API_KEY and/or AI_GATEWAY_API_KEY. Optional: AI_GATEWAY_MODEL.

import { createClient } from "@supabase/supabase-js";
import { isLowData, parseModelJson, validateRecommendations } from "../../lib/recommend";

// --- In-memory per-user rate limit (fallback only) --------------------------
// Per-instance and reset on cold start, exactly like /api/analyze. A speed bump
// against a runaway loop, not an airtight quota.
const RL_WINDOW_MS = 60 * 60 * 1000; // 1 hour
const RL_MAX = 10; // recommendations are heavier and rarer than flavor maps
const rlHits = new Map();

function isRateLimited(userId, now) {
  const recent = (rlHits.get(userId) || []).filter((t) => now - t < RL_WINDOW_MS);
  recent.push(now);
  rlHits.set(userId, recent);
  if (rlHits.size > 5000) {
    for (const [k, v] of rlHits) {
      if (!v.some((t) => now - t < RL_WINDOW_MS)) rlHits.delete(k);
    }
  }
  return recent.length > RL_MAX;
}

const SYSTEM_PROMPT = [
  "You are the tasting advisor inside Craft & Cup, a coffee journal.",
  "You receive one user's aggregated palate data.",
  "Recommend coffee STYLES to seek out. Never name specific products, brands,",
  "roasters, shops, or links: you cannot verify what is in stock anywhere, and",
  "inventing a product would mislead the user.",
  'Give exactly 2 picks with kind "comfort" that extend what they already love,',
  'and exactly 1 pick with kind "stretch" that sits just outside their pattern.',
  'Every "why" must reference their actual logged data in warm, plain language.',
  "Flavor vocabulary should align with SCA tasting terms.",
  "Respond with ONLY a JSON object matching this schema, no preamble, no markdown:",
  '{"recommendations":[{"kind":"comfort","title":"...","seek":{"origin":"...","process":"...","roast":"..."},"notes":["...","..."],"why":"..."}]}',
].join("\n");

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  const gatewayKey = process.env.AI_GATEWAY_API_KEY;
  if (!apiKey && !gatewayKey) {
    return res.status(503).json({ error: "AI is not configured on the server." });
  }

  // --- Require a valid Supabase session --------------------------------------
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : "";
  if (!token) {
    return res.status(401).json({ error: "Please sign in to get recommendations." });
  }
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!supabaseUrl || !supabaseKey) {
    return res.status(503).json({ error: "Auth is not configured on the server." });
  }

  let userId;
  let quota = null;
  try {
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data?.user) {
      return res.status(401).json({ error: "Your session has expired. Please sign in again." });
    }
    userId = data.user.id;

    try {
      const { data: q, error: qErr } = await supabase.rpc("consume_rec_credit");
      if (qErr) throw qErr;
      quota = q;
    } catch {
      quota = null;
    }
  } catch {
    return res.status(401).json({ error: "Could not verify your session. Please sign in again." });
  }

  // --- Payload + low-data short circuit (before spending anything) -----------
  const { payload } = req.body || {};
  if (!payload || typeof payload !== "object") {
    return res.status(400).json({ error: "Missing or invalid palate data." });
  }
  if (isLowData(payload)) {
    return res.status(200).json({ lowData: true, recommendations: [] });
  }

  // --- Quota / rate limit ----------------------------------------------------
  if (quota) {
    if (!quota.allowed) {
      if (quota.reason === "limit_reached") {
        return res.status(429).json({
          error: `You've used all ${quota.limit} of your recommendations this month. Your quota resets at the start of next month.`,
        });
      }
      return res
        .status(403)
        .json({ error: "Recommendations aren't available on your account right now." });
    }
  } else if (isRateLimited(userId, Date.now())) {
    return res.status(429).json({
      error: "You've reached the recommendation limit for now. Please try again in a little while.",
    });
  }

  // --- Upstream: AI Gateway when configured, direct Anthropic otherwise ------
  const useGateway = Boolean(gatewayKey);
  const upstreamUrl = useGateway
    ? "https://ai-gateway.vercel.sh/v1/messages"
    : "https://api.anthropic.com/v1/messages";
  const upstreamKey = useGateway ? gatewayKey : apiKey;
  const model = useGateway
    ? process.env.AI_GATEWAY_MODEL || "anthropic/claude-haiku-4.5"
    : "claude-haiku-4-5";

  try {
    const upstream = await fetch(upstreamUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": upstreamKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model,
        max_tokens: 1000,
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: JSON.stringify(payload) }],
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
    const text = (data?.content || [])
      .filter((c) => c?.type === "text")
      .map((c) => c.text)
      .join("");
    if (!text) {
      return res
        .status(502)
        .json({ error: "The recommendation came back empty. Please try again." });
    }

    const parsed = parseModelJson(text);
    if (!parsed) {
      return res
        .status(502)
        .json({ error: "We couldn't read that recommendation. Please try again." });
    }

    const check = validateRecommendations(parsed);
    if (!check.ok) {
      return res
        .status(502)
        .json({ error: "That recommendation came back malformed. Please try again." });
    }

    return res.status(200).json({
      lowData: false,
      recommendations: check.recommendations,
      quota: quota ? { used: quota.used, limit: quota.limit } : null,
    });
  } catch {
    return res.status(502).json({ error: "Could not reach the AI service." });
  }
}
