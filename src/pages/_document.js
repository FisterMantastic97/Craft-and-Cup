import { Html, Head, Main, NextScript } from "next/document";
export default function Document() {
  return (
    <Html lang="en">
      <Head>
        {/* Primary Meta Tags */}
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover" />
        <meta name="description" content="Log your beans, dial in your brews, and connect with friends. Craft & Cup is your personal coffee companion with AI-powered flavor wheels, brew calculators, and a community of coffee lovers." />
        <meta name="keywords" content="coffee, specialty coffee, coffee journal, brew calculator, flavor wheel, pour over, espresso, coffee app, coffee community" />
        <meta name="author" content="Craft & Cup" />

        {/* Open Graph / Facebook / Discord / iMessage */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://mycraftcup.com/" />
        <meta property="og:title" content="Craft & Cup — Your Personal Coffee Companion" />
        <meta property="og:description" content="Log your beans, dial in your brews, and connect with friends. AI-powered flavor wheels, precision brew calculators, and a community of coffee lovers." />
        <meta property="og:image" content="https://mycraftcup.com/og-image.png" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:site_name" content="Craft & Cup" />

        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Craft & Cup — Your Personal Coffee Companion" />
        <meta name="twitter:description" content="Log your beans, dial in your brews, and connect with friends. AI-powered flavor wheels, precision brew calculators, and a community of coffee lovers." />
        <meta name="twitter:image" content="https://mycraftcup.com/og-image.png" />

        {/* PWA */}
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#0e0e0e" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Craft & Cup" />

        {/* Icons */}
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
        <link rel="apple-touch-icon" sizes="76x76" href="/icons/icon-76.png" />
        <link rel="apple-touch-icon" sizes="120x120" href="/icons/icon-120.png" />
        <link rel="apple-touch-icon" sizes="152x152" href="/icons/icon-152.png" />
        <link rel="apple-touch-icon" sizes="167x167" href="/icons/icon-167.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/icons/icon-180.png" />
        <link rel="icon" type="image/png" href="/icons/favicon.png" />

        {/* Canonical */}
        <link rel="canonical" href="https://mycraftcup.com/" />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
