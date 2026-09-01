import { Html, Head, Main, NextScript } from "next/document";
export default function Document() {
  return (
    <Html lang="en">
      <Head>
        {/* Site-wide only. Page-level title, description, canonical, og:url and
            og/twitter title+description live in src/components/PageMeta.jsx. */}
        <meta
          name="keywords"
          content="coffee journal, flavor wheel, coffee app, brew calculator, pour over, espresso, tasting notes, coffee tracker, AI coffee, specialty coffee, coffee community"
        />
        <meta name="author" content="Craft & Cup" />

        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="Craft & Cup" />

        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />

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
          href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;0,700;1,300;1,400;1,600&family=Jost:wght@300;400;500;600;700&display=swap"
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
