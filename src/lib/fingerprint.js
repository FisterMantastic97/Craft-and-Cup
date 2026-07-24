// Palate fingerprint aggregation: the spine of the profile overhaul.
//
// This is the primitive the whole feature set composes from: the fingerprint UI
// draws it, "taste match" compares two of them, "palate evolution" runs it over
// time-sliced beans, and the "origin passport" uses its origins slice. Keep it
// pure (no React, no side effects) so every surface can reuse it.
//
// Works on either the app's in-memory bean objects OR the public-activity
// item_data snapshots, both of which expose flavorData.mappings, origin, roast.

import { FLAVOR_TAXONOMY, flavorTopKey } from "./flavorWheel";

export function familyColor(key) {
  return FLAVOR_TAXONOMY[key]?.color || "#8a8a8a";
}

// Weighted distribution of top flavor families across all of a person's beans.
// Returns families sorted most-logged first, plus origin/roast/method leanings.
export function computeFingerprint(beans) {
  const list = Array.isArray(beans) ? beans : [];

  const familyWeights = {};
  let totalWeight = 0;
  for (const b of list) {
    const mappings = b?.flavorData?.mappings;
    if (!mappings?.length) continue;
    for (const m of mappings) {
      const key = flavorTopKey(m);
      if (!key) continue;
      const w = m.weight || 1;
      familyWeights[key] = (familyWeights[key] || 0) + w;
      totalWeight += w;
    }
  }

  const families = Object.entries(familyWeights)
    .map(([key, weight]) => ({
      key,
      weight,
      color: familyColor(key),
      pct: totalWeight ? weight / totalWeight : 0,
    }))
    .sort((a, b) => b.weight - a.weight);

  const originCounts = countBy(list, (b) => b?.origin);
  const roastCounts = countBy(list, (b) => b?.roast);
  const methodCounts = countBy(list, (b) => b?.brewMethod);

  return {
    families, // [{ key, weight, color, pct }] desc
    dominant: families[0] || null,
    topOrigins: topEntries(originCounts, 4), // [{ key, count }]
    roastProfile: topEntries(roastCounts, 1)[0]?.key || null,
    topMethod: topEntries(methodCounts, 1)[0]?.key || null,
    flavoredCount: list.filter((b) => b?.flavorData?.mappings?.length).length,
  };
}

// Core at-a-glance stats. Framed as reflection, not a scoreboard.
export function computeStats(beans) {
  const list = Array.isArray(beans) ? beans : [];
  const originCounts = countBy(list, (b) => b?.origin);

  // Average tasting score: each attribute is 0-10, a bean's score is their mean.
  const perBean = [];
  for (const b of list) {
    const s = b?.scores;
    if (s && typeof s === "object") {
      const vals = Object.values(s)
        .map(Number)
        .filter((v) => !isNaN(v));
      if (vals.length) perBean.push(vals.reduce((a, v) => a + v, 0) / vals.length);
    }
  }
  const avgScore = perBean.length
    ? Math.round((perBean.reduce((a, v) => a + v, 0) / perBean.length) * 10) / 10
    : null;

  // Months journaling, from the earliest log.
  const times = list
    .map((b) => b?.createdAt)
    .filter(Boolean)
    .map((d) => new Date(d).getTime())
    .filter((t) => !isNaN(t));
  let monthsJournaling = null;
  if (times.length) {
    const months = (Date.now() - Math.min(...times)) / (1000 * 60 * 60 * 24 * 30.44);
    monthsJournaling = Math.max(1, Math.round(months));
  }

  return {
    beanCount: list.length,
    distinctOrigins: Object.keys(originCounts).length,
    favoriteOrigin: topEntries(originCounts, 1)[0]?.key || null,
    avgScore, // 0-10 or null
    monthsJournaling, // integer months or null
  };
}

function countBy(list, fn) {
  const out = {};
  for (const x of list) {
    const k = fn(x);
    if (k == null || k === "") continue;
    out[k] = (out[k] || 0) + 1;
  }
  return out;
}

function topEntries(counts, n) {
  return Object.entries(counts)
    .map(([key, count]) => ({ key, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, n);
}
