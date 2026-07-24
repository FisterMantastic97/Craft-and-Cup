// Shared friend-request logic.
//
// A friendship row can exist in EITHER direction (I requested them, or they
// requested me), so every lookup has to check both. This "either-direction"
// query and the accept / reactivate / insert branching used to be copy-pasted
// in three places (the Profile page's add-by-code flow, the in-app public
// profile, and the standalone /u/[screenname] route). Keeping them in sync by
// hand caused real bugs, so the fragile part now lives here once. Each caller
// still owns its own UI: messages, notifications, and state.

import { supabase } from "./supabase";

// Find the most relevant friendship row between two users, looking in both
// directions. Prefer an accepted row, then a pending one, else whatever exists.
// Returns the row ({ id, status, requester_id, receiver_id }) or null.
export async function resolveFriendship(myId, theirId) {
  const { data } = await supabase
    .from("friendships")
    .select("id, status, requester_id, receiver_id")
    .or(
      `and(requester_id.eq.${myId},receiver_id.eq.${theirId}),and(requester_id.eq.${theirId},receiver_id.eq.${myId})`
    );
  if (!data || !data.length) return null;
  return (
    data.find((r) => r.status === "accepted") || data.find((r) => r.status === "pending") || data[0]
  );
}

// The friendship status string for a status check, or null if none exists.
export async function friendshipStatus(myId, theirId) {
  const rel = await resolveFriendship(myId, theirId);
  return rel ? rel.status : null;
}

// Attempt to add theirId as a friend. Performs the DB mutation and returns a
// plain result the caller acts on; it does NOT touch notifications or UI state.
//   outcome: "already_friends" | "already_sent" | "accepted" | "sent" | "error"
//   notify:  "friend_accepted" | "friend_request" | null
//     -> what, if anything, the caller should notify theirId about.
//   error:   the Supabase error (only present when outcome === "error").
export async function requestFriendship(myId, theirId) {
  const rel = await resolveFriendship(myId, theirId);

  if (rel) {
    if (rel.status === "accepted") {
      return { outcome: "already_friends", notify: null };
    }
    if (rel.status === "pending") {
      if (rel.receiver_id === myId) {
        // They already requested me: accept it instead of creating a second row.
        await supabase.from("friendships").update({ status: "accepted" }).eq("id", rel.id);
        return { outcome: "accepted", notify: "friend_accepted" };
      }
      return { outcome: "already_sent", notify: null };
    }
    // A previously declined row exists: reactivate it in the current direction.
    await supabase
      .from("friendships")
      .update({ status: "pending", requester_id: myId, receiver_id: theirId })
      .eq("id", rel.id);
    return { outcome: "sent", notify: "friend_request" };
  }

  const { error } = await supabase
    .from("friendships")
    .insert({ requester_id: myId, receiver_id: theirId });
  if (error) return { outcome: "error", notify: null, error };
  return { outcome: "sent", notify: "friend_request" };
}
