import Link from "next/link";
import Head from "next/head";
import { useEffect } from "react";

// Shared chrome for the static legal pages (/terms, /privacy). Keeps both pages
// from duplicating the masthead, theme handling, typography, and footer.
// Styling uses the app's design tokens (var(--bg)/var(--text)/var(--gold)) so it
// tracks light/dark automatically; the effect below also honors a manual theme
// choice saved by the main app.
export default function LegalPage({ title, lastUpdated, description, children }) {
  useEffect(() => {
    try {
      const theme = localStorage.getItem("craft_and_cup_theme") || "system";
      const root = document.documentElement;
      root.classList.remove("theme-dark", "theme-light");
      if (theme !== "system") root.classList.add("theme-" + theme);
    } catch { /* localStorage unavailable - fall back to prefers-color-scheme */ }
  }, []);

  return (
    <>
      <Head>
        <title>{`${title} - Craft & Cup`}</title>
        {description ? <meta name="description" content={description} /> : null}
      </Head>

      <div className="legal-root">
        <div className="legal-wrap">
          <header className="legal-masthead">
            <Link href="/" className="legal-brand">Craft &amp; Cup</Link>
            <div className="legal-rule" />
          </header>

          <h1 className="legal-title">{title}</h1>
          <div className="legal-updated">Last updated: {lastUpdated}</div>

          <main className="legal-body">{children}</main>

          <div className="legal-foot-rule" />
          <nav className="legal-foot" aria-label="Legal">
            <Link href="/" className="legal-foot-home">&larr; Back to Craft &amp; Cup</Link>
            <Link href="/terms" className="legal-foot-link">Terms of Service</Link>
            <Link href="/privacy" className="legal-foot-link">Privacy Policy</Link>
          </nav>
        </div>
      </div>

      <style jsx global>{`
        .legal-root {
          min-height: 100dvh;
          background: var(--bg, #0e0e0e);
          color: var(--text, #ede5d8);
          font-family: 'Jost', sans-serif;
        }
        .legal-wrap { max-width: 760px; margin: 0 auto; padding: 48px 24px 80px; }
        .legal-masthead { text-align: center; margin-bottom: 40px; }
        .legal-brand {
          font-family: 'Cormorant Garamond', serif; font-size: 26px;
          color: var(--gold); letter-spacing: 4px; font-weight: 500; text-decoration: none;
        }
        .legal-rule {
          height: 1px; width: 80px; margin: 16px auto 0;
          background: linear-gradient(90deg, transparent, var(--gold), transparent);
        }
        .legal-title {
          font-family: 'Cormorant Garamond', serif; font-size: 40px; font-weight: 600;
          color: var(--text); margin-bottom: 6px; text-wrap: balance;
        }
        .legal-updated {
          font-size: 11px; letter-spacing: 1.5px; text-transform: uppercase;
          color: var(--muted3); margin-bottom: 36px;
        }
        .legal-body h2 {
          font-family: 'Cormorant Garamond', serif; font-size: 24px; font-weight: 600;
          color: var(--gold); margin: 38px 0 12px;
        }
        .legal-body h3 {
          font-family: 'Jost', sans-serif; font-size: 13px; font-weight: 500;
          letter-spacing: 1px; text-transform: uppercase; color: var(--text2);
          margin: 22px 0 8px;
        }
        .legal-body p { font-size: 15px; line-height: 1.7; color: var(--text2); margin-bottom: 14px; text-wrap: pretty; }
        .legal-body ul { margin: 0 0 14px 22px; }
        .legal-body li { font-size: 15px; line-height: 1.7; color: var(--text2); margin-bottom: 6px; }
        .legal-body a { color: var(--gold); }
        .legal-body strong { color: var(--text); font-weight: 600; }
        .legal-body .ph {
          background: color-mix(in srgb, var(--gold) 22%, transparent);
          color: var(--text); padding: 0 5px; border-radius: 3px; font-style: italic;
          white-space: nowrap;
        }
        .legal-foot-rule { height: 1px; width: 100%; background: var(--border); margin: 48px 0 20px; }
        .legal-foot { display: flex; gap: 22px; flex-wrap: wrap; font-size: 13px; }
        .legal-foot-home { color: var(--gold); text-decoration: none; }
        .legal-foot-link { color: var(--muted2); text-decoration: none; }
        .legal-foot-home:hover, .legal-foot-link:hover { text-decoration: underline; }
      `}</style>
    </>
  );
}
