// Client-side error reporting.
//
// Errors go to our own database through the log_client_error() SECURITY DEFINER
// function, not to a third party. That choice is deliberate: a hosted reporter
// means shipping vendor JavaScript that can read the whole page (tasting notes,
// bios, anything in the DOM) and loosening the CSP to let it phone home. Keeping
// it in-house costs us grouping-as-a-service and buys us not handing user
// content to anyone.
//
// Two rules govern everything here:
//   1. This must NEVER throw. A reporter that crashes while reporting a crash
//      turns one bad render into an infinite loop. Every path swallows.
//   2. This must never flood. The server rate-limits per user per hour, but a
//      render loop can fire thousands of times in seconds and would burn the
//      whole hourly budget in one bad second, hiding every later error. The
//      local dedupe below is the first line of defence; the server cap is the
//      second.

import { supabase } from "./supabase";

// Which deploy an error came from. Vercel exposes the commit SHA at build time;
// next.config.js forwards it. Without this a stack trace cannot be matched to
// the source it came from.
const RELEASE = process.env.NEXT_PUBLIC_RELEASE || "dev";

// Remember what we have already sent so a repeating error reports once, not
// once per frame. Keyed by message + component, cleared on an interval so a
// genuinely recurring problem is still visible over time.
const seen = new Map();
const DEDUPE_MS = 60_000;
const MAX_TRACKED = 200;

function shouldSend(key) {
  const now = Date.now();
  const last = seen.get(key);
  if (last && now - last < DEDUPE_MS) return false;
  // Bound the map so a page generating endless distinct errors cannot grow it
  // without limit.
  if (seen.size > MAX_TRACKED) seen.clear();
  seen.set(key, now);
  return true;
}

// Strip personal data before an error leaves the browser.
//
// Error messages routinely embed the value that caused them: a Postgres error
// quotes the offending row, a validation error quotes the input. Without this,
// a bean name, a tasting note fragment, or an email address ends up sitting in
// error_group.message for 90 days. The table is admin-read-only, so this is
// about not accumulating personal data we never intended to collect rather than
// about exposure to other users.
//
// Deliberately conservative: it redacts shapes that are almost always personal
// (emails, long digit runs, UUIDs, bearer tokens, quoted strings) and leaves
// everything else, because an over-aggressive scrubber produces errors nobody
// can debug, which defeats the point of collecting them.
function scrub(text) {
  if (!text) return text;
  return (
    String(text)
      .replace(/[\w.+-]+@[\w-]+\.[\w.]+/g, "[email]")
      .replace(/\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/gi, "[uuid]")
      .replace(/\b(bearer|token|apikey|api_key|password|secret)\b[=:\s"']+\S+/gi, "$1=[redacted]")
      .replace(/\beyJ[\w-]+\.[\w-]+\.[\w-]+/g, "[jwt]")
      .replace(/\b\d{7,}\b/g, "[number]")
      // Postgres and validation errors quote the offending value; that quoted
      // span is the single likeliest place for user content to appear.
      .replace(/"[^"]{3,}"/g, '"[value]"')
      .replace(/\([^)]{40,}\)/g, "([value])")
  );
}

export function reportError(error, component) {
  try {
    const message = (error && (error.message || String(error))) || "Unknown error";
    const stack = error && error.stack ? String(error.stack) : null;
    const key = `${message}|${component || ""}`;
    if (!shouldSend(key)) return;

    // Fire and forget. Never await, never surface a failure: if reporting is
    // broken the user should still get a working app.
    supabase
      .rpc("log_client_error", {
        p_message: scrub(message),
        p_stack: scrub(stack),
        p_component: component || null,
        p_url: typeof window !== "undefined" ? window.location.pathname : null,
        p_release: RELEASE,
      })
      .then(() => {})
      .catch(() => {});
  } catch {
    // Reporting must not be able to break anything.
  }
}

// Catches everything React's error boundary cannot see: async callbacks, event
// handlers, and rejected promises.
export function installGlobalErrorHandlers() {
  if (typeof window === "undefined" || window.__ccErrorHandlersInstalled) return;
  window.__ccErrorHandlersInstalled = true;

  window.addEventListener("error", (e) => {
    // Failed <img>/<script> loads also raise "error" but carry no Error object.
    // They are noise here, so only report real exceptions.
    if (e && e.error) reportError(e.error, "window.onerror");
  });

  window.addEventListener("unhandledrejection", (e) => {
    const reason = e && e.reason;
    if (reason) reportError(reason, "unhandledrejection");
  });
}
