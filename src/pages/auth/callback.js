import { useEffect } from "react";
import { supabase } from "../../lib/supabase";

export default function AuthCallback() {
  useEffect(() => {
    // Exchange the code for a session
    supabase.auth.getSession().then(() => {
      // Close the popup - the main window will detect the session change
      if (window.opener) {
        window.close();
      } else {
        // If somehow not a popup, redirect to home
        window.location.href = "/";
      }
    });
  }, []);

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        height: "100vh",
        background: "#0e0e0e",
        color: "#c9a84c",
        fontFamily: "'Jost', sans-serif",
        fontSize: 13,
        letterSpacing: 1,
        flexDirection: "column",
        gap: 12,
      }}
    >
      <div style={{ fontSize: 22, fontFamily: "'Cormorant Garamond', serif" }}>Craft & Cup</div>
      <div style={{ color: "#786858", fontSize: 11, letterSpacing: 2, textTransform: "uppercase" }}>
        Signing you in...
      </div>
    </div>
  );
}
