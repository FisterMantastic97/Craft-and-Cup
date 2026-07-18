import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import { supabase } from "../../lib/supabase";

const FLAVOR_COLORS = {
  Fruity: "#e05c5c", Floral: "#c47ec4", Sweet: "#d4a520",
  Nutty: "#a07840", Cocoa: "#7c5040", Spicy: "#c87840",
  Roasty: "#806050", Vegetal: "#608060", Sour: "#98b840",
  Fermented: "#8878a0", Earthy: "#887060", Other: "#888888",
};

export default function PublicProfilePage() {
  const router = useRouter();
  const { screenname } = router.query;

  const [profile, setProfile] = useState(null);
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [session, setSession] = useState(null);
  const [friendStatus, setFriendStatus] = useState(null);
  const [addMsg, setAddMsg] = useState("");
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => setSession(session));
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!screenname) return;
    const fetch = async () => {
      setLoading(true);
      const { data: p } = await supabase
        .from("profiles")
        .select("id, screenname, bio, is_public, friend_code")
        .eq("screenname", screenname)
        .single();

      if (!p || (!p.is_public)) {
        setNotFound(true);
        setLoading(false);
        return;
      }
      setProfile(p);

      const { data: acts } = await supabase
        .from("activity")
        .select("*, reactions(id, user_id, reaction)")
        .eq("user_id", p.id)
        .eq("is_public", true)
        .order("created_at", { ascending: false })
        .limit(20);
      if (acts) setActivity(acts);
      setLoading(false);
    };
    fetch();
  }, [screenname]);

  useEffect(() => {
    if (!session || !profile) return;
    const checkFriendship = async () => {
      const { data } = await supabase
        .from("friendships")
        .select("status")
        .or(`and(requester_id.eq.${session.user.id},receiver_id.eq.${profile.id}),and(requester_id.eq.${profile.id},receiver_id.eq.${session.user.id})`)
        .single();
      if (data) setFriendStatus(data.status);
    };
    checkFriendship();
  }, [session, profile]);

  const handleAddFriend = async () => {
    if (!session || !profile || adding) return;
    setAdding(true);
    const { error } = await supabase.from("friendships").insert({
      requester_id: session.user.id,
      receiver_id: profile.id,
    });
    if (error) {
      setAddMsg(error.code === "23505" ? "Request already sent." : "We couldn't send that request. Please try again.");
    } else {
      // Send notification
      const { data: myProfile } = await supabase.from("profiles").select("screenname").eq("id", session.user.id).single();
      await supabase.from("notifications").insert({
        user_id: profile.id,
        type: "friend_request",
        actor_id: session.user.id,
        reference_id: session.user.id,
        message: `@${myProfile?.screenname} sent you a friend request`,
      });
      setFriendStatus("pending");
      setAddMsg("Friend request sent.");
    }
    setAdding(false);
    setTimeout(() => setAddMsg(""), 3000);
  };

  const formatDate = (d) => {
    const diff = Date.now() - new Date(d).getTime();
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return `${Math.floor(diff / 86400000)}d ago`;
  };

  const isOwn = session?.user?.id === profile?.id;

  return (
    <>
      <Head>
        <title>{profile ? `@${profile.screenname} — Craft & Cup` : "Craft & Cup"}</title>
        <meta name="theme-color" content="#0e0e0e" />
        <meta name="description" content={profile?.bio || `${screenname}'s coffee profile on Craft & Cup`} />
        <meta property="og:title" content={`@${screenname} on Craft & Cup`} />
        <meta property="og:description" content={profile?.bio || "Check out their beans and recipes on Craft & Cup."} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;1,300;1,400&family=Jost:wght@300;400;500&display=swap" rel="stylesheet" />
        <style>{`
          *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
          :root {
            color-scheme: dark;
            --bg: #0e0e0e; --bg2: #141414; --bg3: #1a1a1a;
            --text: #e8e0d0; --muted2: #b8a898; --muted3: #786858; --muted4: #504038;
            --border: #2a2218; --border2: #3a3228;
            --gold: #c9a84c; --gold-dim: #c9a84c18;
            --green: #6a9a6a; --red: #c06060;
          }
          body { background: var(--bg); color: var(--text); font-family: 'Jost', sans-serif; min-height: 100vh; }
          a { color: var(--gold); text-decoration: none; }
          a:hover { text-decoration: underline; }
          .btn { padding: 10px 20px; border: 1px solid var(--gold); background: none; color: var(--gold); cursor: pointer; font-family: 'Jost', sans-serif; font-size: 12px; letter-spacing: 1.5px; text-transform: uppercase; transition: all 0.15s; }
          .btn:hover { background: var(--gold-dim); }
          .btn-ghost { border-color: var(--border2); color: var(--muted3); }
          .btn-ghost:hover { border-color: var(--muted3); color: var(--text); background: var(--bg3); }
        `}</style>
      </Head>

      <div style={{ maxWidth: 640, margin: "0 auto", padding: "40px 20px" }}>

        {/* Nav bar */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 40, borderBottom: "1px solid var(--border)", paddingBottom: 20 }}>
          <a href="/" style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, color: "var(--gold)", letterSpacing: 2 }}>
            Craft & Cup
          </a>
          <a href="/" style={{ fontSize: 11, color: "var(--muted3)", letterSpacing: 1.5, textTransform: "uppercase" }}>
            Open App →
          </a>
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: "60px 0", fontSize: 13, color: "var(--muted3)" }}>Loading…</div>
        ) : notFound ? (
          <div style={{ textAlign: "center", padding: "60px 0" }}>
            <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 32, color: "var(--text)", marginBottom: 12, margin: "0 0 12px", fontWeight: "inherit" }}>Profile not found</h1>
            <div style={{ fontSize: 13, color: "var(--muted3)", marginBottom: 24 }}>This profile is either private or doesn't exist.</div>
            <a href="/" className="btn">Go to Craft & Cup</a>
          </div>
        ) : (
          <>
            {/* Profile header */}
            <div style={{ display: "flex", alignItems: "center", gap: 20, marginBottom: 32, padding: 24, border: "1px solid var(--border)" }}>
              <div style={{ width: 64, height: 64, borderRadius: "50%", background: "var(--gold-dim)", border: "2px solid var(--gold)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, color: "var(--gold)", fontFamily: "'Cormorant Garamond', serif", flexShrink: 0 }}>
                {profile.screenname?.[0]?.toUpperCase()}
              </div>
              <div style={{ flex: 1 }}>
                <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 30, color: "var(--text)", lineHeight: 1, margin: 0, fontWeight: "inherit" }}>@{profile.screenname}</h1>
                {profile.bio && <div style={{ fontSize: 13, color: "var(--muted2)", marginTop: 6, fontStyle: "italic", lineHeight: 1.5 }}>{profile.bio}</div>}
              </div>
              <div style={{ flexShrink: 0 }}>
                <div aria-live="polite">
                  {isOwn ? (
                    <a href="/" className="btn btn-ghost" style={{ fontSize: 10 }}>Edit Profile</a>
                  ) : session ? (
                    friendStatus === "accepted" ? (
                      <span style={{ fontSize: 11, color: "var(--green)", letterSpacing: 1 }}>FRIENDS</span>
                    ) : friendStatus === "pending" ? (
                      <span style={{ fontSize: 11, color: "var(--muted3)", letterSpacing: 1 }}>PENDING</span>
                    ) : (
                      <button className="btn" onClick={handleAddFriend} disabled={adding} style={{ opacity: adding ? 0.6 : 1 }}>
                        + Add Friend
                      </button>
                    )
                  ) : (
                    <a href="/" className="btn" style={{ display: "block", textAlign: "center" }}>Sign in to add friend</a>
                  )}
                </div>
                {addMsg && <div role="status" style={{ fontSize: 11, color: "var(--green)", marginTop: 8, textAlign: "center" }}>{addMsg}</div>}
              </div>
            </div>

            {/* Public activity */}
            <h2 style={{ fontSize: 10, color: "var(--muted3)", letterSpacing: 2, textTransform: "uppercase", marginBottom: 16, margin: "0 0 16px", fontWeight: "inherit", fontFamily: "inherit" }}>
              Public Posts ({activity.length})
            </h2>

            {activity.length === 0 ? (
              <div style={{ fontSize: 13, color: "var(--muted3)", fontStyle: "italic", padding: "40px 0", textAlign: "center" }}>
                No public posts yet.
              </div>
            ) : (
              activity.map(item => (
                <div key={item.id} style={{ border: "1px solid var(--border)", padding: 20, marginBottom: 8 }}>
                  <div style={{ fontSize: 10, color: "var(--muted3)", marginBottom: 10, letterSpacing: 1 }}>
                    {item.type === "logged_bean" ? "Bean" : "Recipe"} · {formatDate(item.created_at)}
                  </div>

                  {item.type === "logged_bean" && (
                    <div style={{ borderLeft: "3px solid var(--gold-dim)", paddingLeft: 14 }}>
                      {item.item_data?.brand && (
                        <div style={{ fontSize: 10, color: "var(--muted3)", letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 2 }}>
                          {item.item_data.brand}
                        </div>
                      )}
                      <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 24, color: "var(--text)", lineHeight: 1.1 }}>
                        {item.item_data?.name || item.item_data?.origin || "Unnamed Bean"}
                      </div>
                      {item.item_data?.origin && (
                        <div style={{ fontSize: 11, color: "var(--muted3)", marginTop: 4 }}>
                          {item.item_data.origin}{item.item_data?.roast ? ` · ${item.item_data.roast}` : ""}
                        </div>
                      )}
                      {item.item_data?.flavorData?.mappings?.length > 0 && (
                        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 10 }}>
                          {[...new Set(item.item_data.flavorData.mappings.map(m => m.top))].slice(0, 5).map(top => {
                            const color = FLAVOR_COLORS[top] || "#888";
                            return (
                              <span key={top} style={{ fontSize: 10, padding: "2px 8px", border: `1px solid ${color}55`, color: "var(--text)", background: color + "12" }}>
                                {top}
                              </span>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}

                  {item.type === "logged_recipe" && (
                    <div style={{ borderLeft: "3px solid #6ab0d4", paddingLeft: 14 }}>
                      <div style={{ fontSize: 10, color: "#6ab0d4", letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 2 }}>
                        {item.item_data?.type || "Recipe"}{item.item_data?.temp ? ` · ${item.item_data.temp}` : ""}
                      </div>
                      <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 24, color: "var(--text)" }}>
                        {item.item_data?.name || "Unnamed Recipe"}
                      </div>
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8 }}>
                        {item.item_data?.milkType && (
                          <span style={{ fontSize: 10, padding: "2px 8px", border: "1px solid var(--border2)", color: "var(--muted2)" }}>
                            {item.item_data.milkType}
                          </span>
                        )}
                        {item.item_data?.rating > 0 && (
                          <span style={{ fontSize: 10, padding: "2px 8px", border: "1px solid var(--border2)", color: "var(--gold)" }}>
                            {item.item_data.rating}/10
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {item.reactions?.length > 0 && (
                    <div style={{ fontSize: 11, color: "var(--muted3)", marginTop: 12 }}>
                      {item.reactions.length} reaction{item.reactions.length !== 1 ? "s" : ""}
                    </div>
                  )}
                </div>
              ))
            )}

            {/* Footer */}
            <div style={{ marginTop: 48, paddingTop: 24, borderTop: "1px solid var(--border)", textAlign: "center" }}>
              <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 18, color: "var(--gold)", marginBottom: 8 }}>Craft & Cup</div>
              <div style={{ fontSize: 12, color: "var(--muted3)", marginBottom: 16 }}>Track your beans, dial in your brews, share the experience.</div>
              <a href="/" className="btn">Open the App</a>
            </div>
          </>
        )}
      </div>
    </>
  );
}