// Alias route. The full Craft & Cup app is defined once, in src/pages/index.jsx.
// This page re-exports it so /u renders the exact same app as / . That keeps a
// single source of truth and ends the "every fix has to be applied twice" problem.
//
// This file was previously a ~7,900-line drifted duplicate of the main app. It was
// an orphan route (nothing in the app ever linked to bare /u; public profiles use
// /u/[screenname], a separate file), and the main app is a strict superset of it,
// so collapsing it here loses no functionality and upgrades /u to the current app.
export { default } from "../index";
