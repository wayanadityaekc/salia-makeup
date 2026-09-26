// Shared chat identity so the widget and checkout post into the SAME thread.
// Logged-in users use their account's chat_cid; guests get a random id kept in
// localStorage.
const CID_KEY = "salia_chat_id";

export function newCid() {
  try {
    if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  } catch {}
  return "c-" + Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export function ensureGuestCid() {
  if (typeof window === "undefined") return null;
  try {
    let id = localStorage.getItem(CID_KEY);
    if (!id) {
      id = newCid();
      localStorage.setItem(CID_KEY, id);
    }
    return id;
  } catch {
    return newCid();
  }
}

// The conversation id to use right now, given the current user (may be null).
export function chatCidFor(user) {
  return user?.chatCid || ensureGuestCid();
}

export const OPEN_CHAT_EVENT = "salia:open-chat";
export function openChat() {
  if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent(OPEN_CHAT_EVENT));
}
