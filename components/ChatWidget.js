"use client";

import { useEffect, useRef, useState } from "react";
import { MessageCircle, X, Send, Loader2, ArrowLeft } from "lucide-react";
import { site } from "@/lib/config";
import { getSettings, sendChatMessage, pollChatMessages } from "@/lib/storage";
import { waLink, normalizeWa } from "@/lib/utils";

const CID_KEY = "salia_chat_id";
const NAMA_KEY = "salia_chat_nama";

function newCid() {
  try {
    if (crypto?.randomUUID) return crypto.randomUUID();
  } catch {}
  return "c-" + Math.random().toString(36).slice(2) + Date.now().toString(36);
}

// Floating live chat. Two ways in: WhatsApp, or a real two-way thread on the site
// (messages land in the dashboard + push the owner; owner replies show up here via
// polling every few seconds while the chat is open).
export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [view, setView] = useState("menu"); // menu | chat
  const [wa, setWa] = useState(site.whatsapp || "");
  const [cid, setCid] = useState(null);
  const [nama, setNama] = useState("");
  const [msgs, setMsgs] = useState([]);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const lastId = useRef(0);
  const panelRef = useRef(null);
  const bottomRef = useRef(null);

  // Load WA number + any existing conversation id/name.
  useEffect(() => {
    getSettings().then((s) => s?.whatsapp && setWa(s.whatsapp)).catch(() => {});
    try {
      setCid(localStorage.getItem(CID_KEY));
      setNama(localStorage.getItem(NAMA_KEY) || "");
    } catch {}
  }, []);

  // Close on outside click / Escape.
  useEffect(() => {
    if (!open) return;
    const onClick = (e) => panelRef.current && !panelRef.current.contains(e.target) && setOpen(false);
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const mergeNew = (incoming) => {
    if (!incoming.length) return;
    setMsgs((prev) => {
      const seen = new Set(prev.map((m) => m.id));
      const add = incoming.filter((m) => !seen.has(m.id));
      if (!add.length) return prev;
      const next = [...prev, ...add];
      lastId.current = Math.max(lastId.current, ...next.map((m) => m.id));
      return next;
    });
  };

  // Poll for new messages while the chat thread is open.
  useEffect(() => {
    if (!open || view !== "chat" || !cid) return;
    let alive = true;
    const tick = async () => {
      try {
        const rows = await pollChatMessages(cid, lastId.current);
        if (alive) mergeNew(rows);
      } catch {}
    };
    tick();
    const t = setInterval(tick, 3000);
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, [open, view, cid]);

  // Auto-scroll to newest.
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [msgs, view]);

  const openChat = () => {
    setView("chat");
    lastId.current = 0;
    setMsgs([]);
  };

  const send = async (e) => {
    e.preventDefault();
    const body = text.trim();
    if (!body) return;
    setErr("");
    setBusy(true);
    let id = cid;
    try {
      if (!id) {
        id = newCid();
        localStorage.setItem(CID_KEY, id);
        setCid(id);
      }
      if (nama) localStorage.setItem(NAMA_KEY, nama);
      const msg = await sendChatMessage(id, { nama, body });
      setText("");
      if (msg) mergeNew([msg]);
    } catch {
      setErr("Gagal mengirim. Coba lagi.");
    } finally {
      setBusy(false);
    }
  };

  const waHref = waLink(
    normalizeWa(wa || site.whatsapp),
    `Halo ${site.brand}, saya mau tanya soal layanan make up / nail art.`
  );

  return (
    <div ref={panelRef}>
      {open && (
        <div
          className="fixed bottom-24 right-5 z-50 flex w-[min(92vw,360px)] flex-col overflow-hidden rounded-2xl border border-rose-line bg-white shadow-xl"
          style={{ marginBottom: "env(safe-area-inset-bottom)", maxHeight: "min(70vh, 560px)" }}
        >
          {/* Header */}
          <div className="flex items-center justify-between bg-rose px-4 py-3 text-white">
            <div className="flex items-center gap-2">
              {view === "chat" && (
                <button onClick={() => setView("menu")} aria-label="Kembali" className="rounded-full p-0.5 hover:bg-white/15">
                  <ArrowLeft size={18} />
                </button>
              )}
              <span className="font-semibold">Chat {site.brand}</span>
            </div>
            <button onClick={() => setOpen(false)} aria-label="Tutup" className="rounded-full p-0.5 hover:bg-white/15">
              <X size={18} />
            </button>
          </div>

          {/* Menu */}
          {view === "menu" && (
            <div className="p-4">
              <p className="text-sm text-muted">Mau tanya-tanya? Pilih cara ngobrol:</p>
              <div className="mt-3 grid gap-2">
                <button
                  onClick={openChat}
                  className="flex items-center gap-3 rounded-xl border border-rose-line px-4 py-3 text-left hover:bg-rose-soft"
                >
                  <Send size={20} className="shrink-0 text-rose" />
                  <span>
                    <span className="block text-sm font-semibold text-ink">Chat langsung di web</span>
                    <span className="block text-xs text-muted">Ngobrol real-time, dibalas di sini</span>
                  </span>
                </button>
                <a
                  href={waHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 rounded-xl border border-rose-line px-4 py-3 text-left hover:bg-rose-soft"
                >
                  <MessageCircle size={20} className="shrink-0 text-rose" />
                  <span>
                    <span className="block text-sm font-semibold text-ink">WhatsApp</span>
                    <span className="block text-xs text-muted">Lanjut ngobrol di WhatsApp</span>
                  </span>
                </a>
              </div>
            </div>
          )}

          {/* Live thread */}
          {view === "chat" && (
            <>
              <div className="flex-1 space-y-2 overflow-y-auto bg-rose-soft/40 p-4">
                {msgs.length === 0 && (
                  <p className="py-6 text-center text-xs text-muted">
                    Tulis pesanmu, kami balas secepatnya. 💬
                  </p>
                )}
                {msgs.map((m) => (
                  <div key={m.id} className={`flex ${m.sender === "guest" ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-[80%] whitespace-pre-wrap rounded-2xl px-3 py-2 text-sm ${
                        m.sender === "guest" ? "bg-rose text-white" : "border border-rose-line bg-white text-ink"
                      }`}
                    >
                      {m.body}
                    </div>
                  </div>
                ))}
                <div ref={bottomRef} />
              </div>

              <form onSubmit={send} className="border-t border-rose-line p-3">
                {!nama && msgs.length === 0 && (
                  <input
                    className="field mb-2"
                    placeholder="Nama (opsional)"
                    value={nama}
                    onChange={(e) => setNama(e.target.value)}
                  />
                )}
                {err && <p className="mb-2 text-xs text-rose">{err}</p>}
                <div className="flex items-end gap-2">
                  <textarea
                    className="field max-h-24 min-h-[42px] flex-1 resize-none py-2.5"
                    placeholder="Tulis pesan…"
                    rows={1}
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        send(e);
                      }
                    }}
                  />
                  <button
                    type="submit"
                    disabled={busy || !text.trim()}
                    aria-label="Kirim"
                    className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-full bg-rose text-white hover:bg-rose-deep disabled:opacity-50"
                  >
                    {busy ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      )}

      {/* Launcher */}
      <button
        onClick={() => {
          setOpen((v) => !v);
          if (!open) setView("menu");
        }}
        aria-label="Chat"
        className="fixed bottom-5 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-rose text-white shadow-lg transition hover:bg-rose-deep"
        style={{ marginBottom: "env(safe-area-inset-bottom)" }}
      >
        {open ? <X size={26} /> : <MessageCircle size={26} />}
      </button>
    </div>
  );
}
