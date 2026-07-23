// Server-side proxy to Anthropic for AI flavor mapping.
// Keeps ANTHROPIC_API_KEY off the client AND gates the endpoint so it can't be
// abused to drain prepaid credits:
//   1. Requires a valid Supabase session (Bearer token) - blocks anonymous scripts.
//   2. A lightweight in-memory per-user rate limit (temporary).
//
// NOTE (future / freemium): replace the in-memory limiter below with a
// Supabase-backed MONTHLY quota once tiers land - free users get N AI maps per
// month, paid users get more. The limiter is already keyed by userId, so the
// swap is: read the user's plan + this month's usage from a table, compare to
// the plan's quota, and increment. The client/endpoint contract stays the same.
//
// Requires ANTHROPIC_API_KEY, NEXT_PUBLIC_SUPABASE_URL, and
// NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY in the deployment environment (Vercel).

import { createClient } from "@supabase/supabase-js";

// --- In-memory per-user rate limit -----------------------------------------
// Temporary: this Map lives in the serverless instance, so it resets on cold
// start and is per-instance (not shared across concurrent instances). It's a
// real speed-bump against a runaway loop, not an airtight quota - that's what
// the Supabase-backed monthly quota above will provide.
const RL_WINDOW_MS = 60 * 60 * 1000; // 1 hour
const RL_MAX = 40; // generous for real logging; far below what abuse looks like
const rlHits = new Map(); // userId -> number[] (request timestamps)

function isRateLimited(userId, now) {
  const recent = (rlHits.get(userId) || []).filter((t) => now - t < RL_WINDOW_MS);
  recent.push(now);
  rlHits.set(userId, recent);
  // Bound memory: occasionally drop users with no recent activity.
  if (rlHits.size > 5000) {
    for (const [k, v] of rlHits) {
      if (!v.some((t) => now - t < RL_WINDOW_MS)) rlHits.delete(k);
    }
  }
  return recent.length > RL_MAX;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(503).json({ error: "AI is not configured on the server." });
  }

  // --- Require a valid Supabase session -------------------------------------
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : "";
  if (!token) {
    return res.status(401).json({ error: "Please sign in to use AI flavor mapping." });
  }
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!supabaseUrl || !supabaseKey) {
    return res.status(503).json({ error: "Auth is not configured on the server." });
  }
  let userId;
  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data?.user) {
      return res.status(401).json({ error: "Your session has expired. Please sign in again." });
    }
    userId = data.user.id;
  } catch {
    return res.status(401).json({ error: "Could not verify your session. Please sign in again." });
  }

  // --- Rate limit -----------------------------------------------------------
  if (isRateLimited(userId, Date.now())) {
    return res.status(429).json({ error: "You've reached the AI limit for now. Please try again in a little while." });
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
        model: "claude-haiku-4-5",
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
