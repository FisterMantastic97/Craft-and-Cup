// Coffee agent helpers: turn a palate into a compact, safe payload, hash it for
// caching, and validate what the model sends back.
//
// Pure (no React, no side effects, no network) so the API route and the UI can
// both use it. The PROMPT deliberately lives server-side in
// src/pages/api/recommend.js: the client sends structured palate data, never
// prompt text, so the endpoint cannot be driven as a general-purpose LLM.
//
// See COFFEE_AGENT.md for the locked design.

// Bean origins, roasts, and methods are free text the user typed. They are
// interpolated into a prompt, so treat them as untrusted: collapse whitespace,
// drop control characters, and cap length. This blunts prompt injection smuggled
// into a bean name and keeps the payload small.
function clean(value, maxLen) {
  return String(value == null ? "" : value)
    .replace(/[\u0000-\u001f\u007f]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLen || 60);
}

export const LOW_DATA_MIN_BEANS = 3;

// Compact payload from the existing fingerprint/stats aggregates plus a few
// recent beans for texture. Everything is sanitized and length-capped.
export function buildRecommendPayload(fingerprint, stats, beans) {
  const list = Array.isArray(beans) ? beans : [];

  const recent = list
    .filter((b) => b?.flavorData?.mappings?.length)
    .slice(-5)
    .map((b) => ({
      origin: clean(b?.origin, 40),
      roast: clean(b?.roast, 20),
      notes: clean(b?.flavorData?.notes || b?.notes, 90),
    }))
    .filter((b) => b.origin || b.notes);

  return {
    families: (fingerprint?.families || []).slice(0, 6).map((f) => ({
      key: clean(f?.key, 20),
      pct: Math.round((f?.pct || 0) * 100),
    })),
    dominant: clean(fingerprint?.dominant?.key, 20) || null,
    topOrigins: (fingerprint?.topOrigins || []).slice(0, 4).map((o) => ({
      key: clean(o?.key, 40),
      count: Number(o?.count) || 0,
    })),
    roastProfile: clean(fingerprint?.roastProfile, 20) || null,
    topMethod: clean(fingerprint?.topMethod, 30) || null,
    beanCount: Number(stats?.beanCount) || 0,
    avgScore: stats?.avgScore == null ? null : Number(stats.avgScore),
    flavoredCount: Number(fingerprint?.flavoredCount) || 0,
    recent,
  };
}

// True when there is too little logged to say anything honest. Checked on the
// server BEFORE any AI call, so a sparse palate never spends a credit.
export function isLowData(payload) {
  return (Number(payload?.flavoredCount) || 0) < LOW_DATA_MIN_BEANS;
}

// Stable stringify (keys sorted) so the hash only changes when the palate does,
// not when object key order happens to differ.
function stableStringify(value) {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return "[" + value.map(stableStringify).join(",") + "]";
  const keys = Object.keys(value).sort();
  return "{" + keys.map((k) => JSON.stringify(k) + ":" + stableStringify(value[k])).join(",") + "}";
}

// Small non-cryptographic hash (FNV-1a). Only used as a cache key to answer
// "has this palate changed since the last recommendation?", never for security.
export function fingerprintHash(payload) {
  const str = stableStringify(payload);
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(16);
}

// Model output is untrusted. Accept it only if it is exactly the shape the UI
// renders: 2 comfort picks then 1 stretch pick, each with usable fields.
// Returns { ok, recommendations } or { ok: false, reason }.
export function validateRecommendations(parsed) {
  const recs = parsed?.recommendations;
  if (!Array.isArray(recs) || recs.length !== 3) {
    return { ok: false, reason: "expected exactly 3 recommendations" };
  }

  const out = [];
  for (const r of recs) {
    const kind = r?.kind === "stretch" ? "stretch" : r?.kind === "comfort" ? "comfort" : null;
    const title = clean(r?.title, 80);
    const why = clean(r?.why, 300);
    if (!kind || !title || !why) {
      return { ok: false, reason: "a recommendation is missing kind, title, or why" };
    }
    out.push({
      kind,
      title,
      seek: {
        origin: clean(r?.seek?.origin, 40),
        process: clean(r?.seek?.process, 30),
        roast: clean(r?.seek?.roast, 20),
      },
      notes: (Array.isArray(r?.notes) ? r.notes : [])
        .slice(0, 4)
        .map((n) => clean(n, 40))
        .filter(Boolean),
      why,
    });
  }

  const comfort = out.filter((r) => r.kind === "comfort").length;
  const stretch = out.filter((r) => r.kind === "stretch").length;
  if (comfort !== 2 || stretch !== 1) {
    return { ok: false, reason: "expected 2 comfort picks and 1 stretch pick" };
  }

  // Comfort first, stretch last, regardless of the order the model used.
  out.sort((a, b) => (a.kind === "stretch" ? 1 : 0) - (b.kind === "stretch" ? 1 : 0));
  return { ok: true, recommendations: out };
}

// Models often wrap JSON in markdown fences despite being told not to.
export function parseModelJson(text) {
  const cleaned = String(text || "")
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    return null;
  }
}
