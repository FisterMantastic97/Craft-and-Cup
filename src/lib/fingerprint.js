// Palate fingerprint aggregation: the spine of the profile overhaul.
//
// This is the primitive the whole feature set composes from: the fingerprint UI
// draws it, "taste match" compares two of them, "palate evolution" runs it over
// time-sliced beans, and the "origin passport" uses its origins slice. Keep it
// pure (no React, no side effects) so every surface can reuse it.
//
// Works on either the app's in-memory bean objects OR the public-activity
// item_data snapshots, both of which expose flavorData.mappings, origin, roast.

import { FLAVOR_TAXONOMY, flavorTopKey } from "./flavorWheel.js";

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

// Origin passport: which of the guide's origins this palate has visited.
// Reframes the hobby as exploration. No points, no badges, no streaks: a
// visited origin simply lights up, and the unvisited ones sit quietly as an
// invitation rather than a scolding.
//
// Bean origin strings are free text ("Ethiopia", "Ethiopia Yirgacheffe",
// "Colombia Huila"), so match a guide country if its name appears anywhere in
// the string. Origins outside the guide are counted separately rather than
// dropped, so the number a person sees always reflects everything they logged.
//
// The guide is INJECTED rather than imported: src/data/guideData.js carries JSX
// components, and importing it here would both break this module's purity and
// pull guide UI into the lean standalone public profile bundle. Callers pass
// ORIGINS_GUIDE (or any [{ country, region, color, icon, tagline }] list).
export function computePassport(beans, originsGuide) {
  const guide = Array.isArray(originsGuide) ? originsGuide : [];
  const list = Array.isArray(beans) ? beans : [];
  const logged = list.map((b) => String(b?.origin || "").trim()).filter(Boolean);

  const counts = {}; // guide country -> beans logged
  const matchedRaw = new Set();
  for (const raw of logged) {
    const lower = raw.toLowerCase();
    for (const o of guide) {
      if (lower.includes(o.country.toLowerCase())) {
        counts[o.country] = (counts[o.country] || 0) + 1;
        matchedRaw.add(raw);
        break;
      }
    }
  }

  const beyondGuide = [...new Set(logged.filter((r) => !matchedRaw.has(r)))];

  // Preserve the guide's own ordering inside each region.
  const regions = [];
  for (const o of guide) {
    let bucket = regions.find((r) => r.region === o.region);
    if (!bucket) {
      bucket = { region: o.region, origins: [], visitedCount: 0 };
      regions.push(bucket);
    }
    const count = counts[o.country] || 0;
    bucket.origins.push({
      country: o.country,
      color: o.color,
      icon: o.icon,
      tagline: o.tagline,
      count,
      visited: count > 0,
    });
    if (count > 0) bucket.visitedCount += 1;
  }

  const visitedCount = Object.keys(counts).length;
  return {
    regions, // [{ region, origins: [{ country, color, icon, tagline, count, visited }], visitedCount }]
    visitedCount,
    totalCount: guide.length,
    beyondGuide, // origin strings logged that the guide does not cover
    regionsVisited: regions.filter((r) => r.visitedCount > 0).length,
    totalRegions: regions.length,
  };
}

// Palate evolution: the flavor-family distribution bucketed by calendar month,
// so a person can see how their taste actually moved over time.
//
// Only months that contain flavor-mapped beans become periods, so a gap in
// journaling does not render as an empty column. Needs two periods to say
// anything honest, hence hasEnoughData: below that the UI shows an early state
// instead of implying a trend from a single month.
export function computeEvolution(beans, options) {
  const maxPeriods = options?.maxPeriods || 6;
  const list = Array.isArray(beans) ? beans : [];

  const byMonth = {};
  for (const b of list) {
    if (!b?.flavorData?.mappings?.length) continue;
    const t = new Date(b?.createdAt).getTime();
    if (isNaN(t)) continue;
    const d = new Date(t);
    const key = d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0");
    (byMonth[key] = byMonth[key] || []).push(b);
  }

  const keys = Object.keys(byMonth).sort().slice(-maxPeriods);
  const periods = keys.map((key) => {
    const monthBeans = byMonth[key];
    const fp = computeFingerprint(monthBeans);
    const [y, m] = key.split("-");
    const label = new Date(Number(y), Number(m) - 1, 1).toLocaleString("en-US", {
      month: "short",
      year: "2-digit",
    });
    return {
      key,
      label, // e.g. "Mar 26"
      beanCount: monthBeans.length,
      families: fp.families, // [{ key, weight, color, pct }] desc
      dominant: fp.dominant,
    };
  });

  const first = periods[0];
  const last = periods[periods.length - 1];
  const shifted = Boolean(
    first && last && first.dominant && last.dominant && first.dominant.key !== last.dominant.key
  );

  return {
    periods, // oldest to newest
    hasEnoughData: periods.length >= 2,
    shifted, // dominant family changed between first and last period
    from: first?.dominant?.key || null,
    to: last?.dominant?.key || null,
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
