import React from "react";
import { reportError } from "../lib/reportError";

// Catches render-time crashes anywhere below it and shows a recoverable screen
// instead of React unmounting the tree and leaving a blank page.
//
// This has to be a class: componentDidCatch has no hook equivalent. It only
// sees errors thrown during render, lifecycle, and constructors. Async code,
// event handlers, and rejected promises never reach it, which is why
// installGlobalErrorHandlers() exists alongside it.
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    // componentStack points at the component that actually blew up, which is
    // far more useful than a minified JS stack alone.
    const where = info?.componentStack?.trim().split("\n")[0]?.trim() || "unknown";
    reportError(error, `render: ${where}`);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div
        style={{
          minHeight: "100vh",
          background: "var(--bg, #0e0e0e)",
          color: "var(--text, #ede5d8)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "40px 20px",
          textAlign: "center",
          fontFamily: "'Jost', sans-serif",
        }}
      >
        <div
          style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: 28,
            color: "#c9a84c",
            letterSpacing: 4,
            marginBottom: 8,
            fontWeight: 500,
          }}
        >
          Craft &amp; Cup
        </div>
        <div
          style={{
            height: 1,
            width: 80,
            background: "linear-gradient(90deg, transparent, #c9a84c, transparent)",
            marginBottom: 32,
          }}
        />

        <h1
          style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: 30,
            fontWeight: 400,
            margin: "0 0 12px",
          }}
        >
          Something spilled.
        </h1>
        <p
          style={{
            fontSize: 14,
            color: "#a89880",
            maxWidth: 380,
            lineHeight: 1.6,
            margin: "0 0 32px",
          }}
        >
          This screen hit an error and stopped. Your journal is safe. We&apos;ve been told about it
          automatically.
        </p>

        <button
          type="button"
          onClick={() => window.location.reload()}
          style={{
            padding: "14px 32px",
            background: "transparent",
            border: "1px solid #c9a84c",
            color: "#c9a84c",
            fontSize: 12,
            letterSpacing: 2,
            textTransform: "uppercase",
            fontFamily: "'Jost', sans-serif",
            cursor: "pointer",
            minHeight: 44,
            lineHeight: 1.6,
          }}
        >
          Reload the page
        </button>
      </div>
    );
  }
}
