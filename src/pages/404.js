import Link from 'next/link';

export default function Custom404() {
  return (
    <div style={{
      minHeight: "100vh",
      background: "var(--bg, #0e0e0e)",
      color: "var(--text, #ede5d8)",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "40px 20px",
      fontFamily: "'Jost', sans-serif",
      textAlign: "center",
    }}>
      <div style={{
        fontFamily: "'Cormorant Garamond', serif",
        fontSize: 28,
        color: "#c9a84c",
        letterSpacing: 4,
        marginBottom: 8,
        fontWeight: 500,
      }}>
        Craft &amp; Cup
      </div>
      <div style={{
        height: 1,
        width: 80,
        background: "linear-gradient(90deg, transparent, #c9a84c, transparent)",
        marginBottom: 40,
      }} />

      <div style={{
        fontFamily: "'Cormorant Garamond', serif",
        fontSize: 96,
        color: "#c9a84c",
        lineHeight: 1,
        marginBottom: 16,
        fontWeight: 300,
      }}>
        404
      </div>

      <h1 style={{
        fontFamily: "'Cormorant Garamond', serif",
        fontSize: 32,
        fontWeight: 400,
        margin: "0 0 12px",
        color: "#ede5d8",
      }}>
        This cup ran dry.
      </h1>

      <p style={{
        fontSize: 14,
        color: "#a89880",
        maxWidth: 380,
        lineHeight: 1.6,
        margin: "0 0 32px",
      }}>
        The page you&apos;re looking for doesn&apos;t exist or has moved. Let&apos;s get you back to brewing.
      </p>

      <Link href="/" style={{
        display: "inline-block",
        padding: "14px 32px",
        background: "transparent",
        border: "1px solid #c9a84c",
        color: "#c9a84c",
        textDecoration: "none",
        fontSize: 12,
        letterSpacing: 2,
        textTransform: "uppercase",
        fontFamily: "'Jost', sans-serif",
        transition: "all 0.18s",
        minHeight: 44,
        boxSizing: "border-box",
        lineHeight: 1.6,
      }}>
        ← Back to Craft &amp; Cup
      </Link>

      <div style={{
        marginTop: 60,
        fontSize: 10,
        color: "#605040",
        letterSpacing: 1.5,
        textTransform: "uppercase",
      }}>
        For the curious cup
      </div>
    </div>
  );
}
