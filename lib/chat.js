// Shared chat identity so the widget and checkout post into the SAME thread.
const CID_KEY = "salia_chat_id";

export function newCid() {
  try {
    if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  } catch (e) {}
  return `c-${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
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
  } catch (e) {
    return newCid();
  }
}

// The conversation id to use right now, given the current user (may be null).
export function chatCidFor(user) {
  return user?.chatCid || ensureGuestCid();
}

export const OPEN_CHAT_EVENT = "salia:open-chat";
// view: "menu" (from the navbar) or "chat" (straight into the thread, e.g. after a booking).
export function openChat(view = "menu") {
  if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent(OPEN_CHAT_EVENT, { detail: { view } }));
}
