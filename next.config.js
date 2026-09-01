/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: {
    ignoreDuringBuilds: true,
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
            // Content Security Policy. Shipped REPORT-ONLY first: a wrong CSP
            // silently breaks a live app, so violations get collected before
            // anything is enforced. Flip the key below to
            // "Content-Security-Policy" once the console is clean.
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
            key: "Content-Security-Policy-Report-Only",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline'",
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
