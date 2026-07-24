// Shared date formatting.
//
// Several screens showed relative timestamps, and the exact rules had drifted
// into a handful of near-identical copies. This keeps the ONE canonical
// relative format in a single place. The deliberately different formats (an
// absolute short date, and the longer variant that falls back to a full date
// after a week) intentionally stay with their own screens; they are different
// on purpose, not by accident, so they are not merged in here.

// "just now" / "5m ago" / "3h ago" / "2d ago".
// Used by comments, notifications, and the activity feeds.
export function formatRelative(d) {
  const diff = Date.now() - new Date(d).getTime();
  if (diff < 60000) return "just now";
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return `${Math.floor(diff / 86400000)}d ago`;
}
