import Head from "next/head";

// Per-page SEO tags.
//
// Why this exists: title, canonical, og:url, and the og/twitter title and
// description used to live in _document.js, which renders on EVERY page. That
// meant /privacy, /terms, /signin and every /u/[screenname] profile all declared
// themselves canonically the homepage, which invites search engines to treat
// them as duplicates, and every shared link previewed as the homepage. Those
// tags belong at the page level; _document keeps only the genuinely site-wide
// ones (og:type, og:site_name, default og:image, icons, PWA, fonts).
//
// `path` should start with a slash. Pass noindex for pages that should never
// appear in search results (auth screens, callbacks).

export const SITE_URL = "https://mycraftcup.com";
export const SITE_NAME = "Craft & Cup";
const DEFAULT_IMAGE = `${SITE_URL}/og-image.png`;

export default function PageMeta({ title, description, path = "/", image, noindex = false }) {
  const url = `${SITE_URL}${path}`;
  const img = image || DEFAULT_IMAGE;

  return (
    <Head>
      <title>{title}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={url} />
      {noindex && <meta name="robots" content="noindex, nofollow" />}

      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={url} />
      <meta property="og:image" content={img} />

      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:url" content={url} />
      <meta name="twitter:image" content={img} />
    </Head>
  );
}
