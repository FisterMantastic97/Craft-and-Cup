/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Readable stack traces in the error log. Normally this is a tradeoff, since
  // source maps expose your source; this repo is already public, so it costs
  // nothing and turns minified traces into something debuggable.
  productionBrowserSourceMaps: true,
  env: {
    // Stamps every error with the deploy it came from. Vercel sets
    // VERCEL_GIT_COMMIT_SHA at build time; without forwarding it here the
    // client cannot see it, and a stack trace cannot be tied to its source.
    NEXT_PUBLIC_RELEASE: (process.env.VERCEL_GIT_COMMIT_SHA || "dev").slice(0, 7),
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "X-DNS-Prefetch-Control",
            value: "on",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
          },
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
          {
            // Content Security Policy. Shipped report-only first, then enforced
            // on 2026-09-01 after testing every source type the app uses
            // against the live policy: inline styles, styled-jsx, data: images
            // from the canvas share cards, Supabase storage and REST, Google
            // Fonts CSS and gstatic font files, both OAuth avatar CDNs, the
            // service worker, the PWA manifest, and the same-origin API routes.
            // All passed; a deliberate off-origin probe correctly violated,
            // which confirmed the policy was actually being evaluated.
            //
            // TO REVERT: change the key back to
            // "Content-Security-Policy-Report-Only". That disables enforcement
            // without touching the policy itself.
            //
            // Why each source is here:
            //   script-src  'unsafe-inline' is required by the Pages Router:
            //               Next inlines hydration data, and there is no nonce
            //               without middleware. Vercel Analytics and Speed
            //               Insights serve from this origin, so 'self' covers
            //               them.
            //   style-src   the app sets inline style props on hundreds of
            //               elements and styled-jsx emits <style> tags, so
            //               'unsafe-inline' is unavoidable here. Google Fonts
            //               serves the stylesheet.
            //   img-src     data: and blob: are for the canvas share cards
            //               (toDataURL); Supabase storage serves bean and
            //               recipe photos; the two CDNs are OAuth avatars from
            //               Discord and Google.
            //   connect-src Supabase REST plus realtime websockets, and the
            //               Vercel analytics beacon.
            //   frame-ancestors 'none' duplicates X-Frame-Options DENY for
            //               browsers that prefer CSP.
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              // No 'unsafe-inline'. Verified against the production build: every
              // executable script is external and same-origin. The only inline
              // <script> elements Next emits are application/json data blocks
              // (__NEXT_DATA__ and our JSON-LD), which browsers never execute
              // and CSP therefore never blocks. No 'unsafe-eval' either: the
              // production bundle contains no eval or Function constructor.
              //
              // This deliberately avoids the nonce approach. Nonces would work
              // but force per-request rendering, losing static HTML caching, and
              // buy nothing here because there is no inline script to bless.
              "script-src 'self'",
              // style-src keeps 'unsafe-inline' as a known limitation: nonces
              // apply to <style> elements, not to style="..." attributes, and
              // the app sets inline style props on hundreds of elements.
              // Removing it needs a full conversion to classes. Inline style
              // injection is also a far weaker vector than script injection.
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com data:",
              "img-src 'self' data: blob: https://*.supabase.co https://cdn.discordapp.com https://lh3.googleusercontent.com",
              "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://vitals.vercel-insights.com",
              "frame-ancestors 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              "object-src 'none'",
            ].join("; "),
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
