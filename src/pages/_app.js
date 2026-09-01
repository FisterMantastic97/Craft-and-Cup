import "../styles/globals.css";
import "../styles/app.css";
import { useEffect } from "react";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import ErrorBoundary from "../components/ErrorBoundary";
import { installGlobalErrorHandlers } from "../lib/reportError";

export default function App({ Component, pageProps }) {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
    // Covers what the boundary cannot: async callbacks, event handlers, and
    // rejected promises.
    installGlobalErrorHandlers();
  }, []);

  return (
    <ErrorBoundary>
      <Component {...pageProps} />
      <Analytics />
      <SpeedInsights />
    </ErrorBoundary>
  );
}
