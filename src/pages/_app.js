import "../styles/globals.css";
import "../styles/app.css";
import { useEffect } from "react";
import Head from "next/head";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";

export default function App({ Component, pageProps }) {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
  }, []);

  return (
    <>
      {/* Default title, managed by next/head so pages can override it and it is
          restored on client-side navigation. It must NOT live in _document.js,
          where the head manager cannot see it (that left an empty tab title
          after navigating away from a page that set its own). */}
      <Head>
        <title>Craft &amp; Cup - AI Coffee Journal &amp; Brew Tool</title>
      </Head>
      <Component {...pageProps} />
      <Analytics />
      <SpeedInsights />
    </>
  );
}
