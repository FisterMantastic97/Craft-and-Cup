import { Html, Head, Main, NextScript } from "next/document";
export default function Document() {
  return (
    <Html lang="en">
      <Head>
        {/* Primary Meta Tags */}
        <title>Craft &amp; Cup - AI Coffee Journal &amp; Brew Tool</title>
        <meta
          name="description"
          content="Craft & Cup - the AI-powered coffee journal. Log beans, map flavors to a wheel with AI, dial in brew ratios, and share with friends. Free to use."
        />
        <meta
          name="keywords"
          content="coffee journal, flavor wheel, coffee app, brew calculator, pour over, espresso, tasting notes, coffee tracker, AI coffee, specialty coffee, coffee community"
        />
        <meta name="author" content="Craft & Cup" />

        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://mycraftcup.com/" />
        <meta property="og:title" content="Craft & Cup - AI Coffee Journal & Brew Tool" />
        <meta
          property="og:description"
          content="Log any coffee bean and AI maps your tasting notes to a flavor wheel. Track what you love, dial in your brew, and share with friends."
        />
        <meta property="og:image" content="https://mycraftcup.com/og-image.png" />
        <meta property="og:site_name" content="Craft & Cup" />

        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:url" content="https://mycraftcup.com/" />
        <meta name="twitter:title" content="Craft & Cup - AI Coffee Journal & Brew Tool" />
        <meta
          name="twitter:description"
          content="Log any coffee bean and AI maps your tasting notes to a flavor wheel. Track what you love, dial in your brew, and share with friends."
        />
        <meta name="twitter:image" content="https://mycraftcup.com/og-image.png" />

        {/* Canonical */}
        <link rel="canonical" href="https://mycraftcup.com/" />

        {/* PWA */}
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#0e0e0e" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Craft & Cup" />
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
        <link rel="apple-touch-icon" sizes="76x76" href="/icons/icon-76.png" />
        <link rel="apple-touch-icon" sizes="120x120" href="/icons/icon-120.png" />
        <link rel="apple-touch-icon" sizes="152x152" href="/icons/icon-152.png" />
        <link rel="apple-touch-icon" sizes="167x167" href="/icons/icon-167.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/icons/icon-180.png" />
        <link rel="icon" type="image/png" href="/icons/favicon.png" />

        {/* Fonts */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;600&family=Jost:wght@300;400;500&display=swap"
          rel="stylesheet"
        />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
