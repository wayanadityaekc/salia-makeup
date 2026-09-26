"use client";

import { useEffect, useRef, useState } from "react";
import { Send, Loader2, Trash2, ArrowLeft, MessageSquare } from "lucide-react";
import { formatTanggal } from "@/lib/utils";
import {
  getConversations,
  getThread,
  sendReply,
  deleteConversation,
  UnauthorizedError,
} from "@/lib/storage";

const timeShort = (iso) => {
  try {
    return new Date(iso).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "";
  }
};

// Live chat inbox for the owner. Conversation list + thread, both polled while the
// tab is open (owner also gets a push on new messages when the app is closed).
export default function ChatManager({ onUnauthorized }) {
  const [convos, setConvos] = useState([]);
  const [activeCid, setActiveCid] = useState(null);
  const [thread, setThread] = useState(null); // { conversation, messages }
  const [reply, setReply] = useState("");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  const fail = (e) => {
    if (e instanceof UnauthorizedError) onUnauthorized?.();
  };

  const loadConvos = async () => {
    try {
      setConvos(await getConversations());
    } catch (e) {
      fail(e);
    }
  };

  const loadThread = async (cid) => {
    try {
      setThread(await getThread(cid));
    } catch (e) {
      fail(e);
    }
  };

  // Poll the conversation list every 5s.
  useEffect(() => {
    setLoading(true);
    loadConvos().finally(() => setLoading(false));
    const t = setInterval(loadConvos, 5000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Poll the open thread every 3s.
  useEffect(() => {
    if (!activeCid) return;
    loadThread(activeCid);
    const t = setInterval(() => loadThread(activeCid), 3000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeCid]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [thread]);

  const open = (cid) => {
    setActiveCid(cid);
    setThread(null);
    // optimistically clear the unread badge
    setConvos((prev) => prev.map((c) => (c.id === cid ? { ...c, ownerUnread: 0 } : c)));
  };

  const send = async (e) => {
    e.preventDefault();
    const body = reply.trim();
    if (!body || !activeCid) return;
    setBusy(true);
    try {
      const msg = await sendReply(activeCid, body);
      setReply("");
      if (msg) setThread((t) => (t ? { ...t, messages: [...t.messages, msg] } : t));
      loadConvos();
    } catch (e) {
      fail(e);
    } finally {
      setBusy(false);
    }
  };

  const hapus = async (cid) => {
    if (!confirm("Hapus percakapan ini?")) return;
    try {
      await deleteConversation(cid);
      if (activeCid === cid) {
        setActiveCid(null);
        setThread(null);
      }
      loadConvos();
    } catch (e) {
      fail(e);
    }
  };

  const active = convos.find((c) => c.id === activeCid);

  return (
    <div>
      <h2 className="text-lg font-bold text-ink">Live chat</h2>
      <div className="mt-4 flex h-[70vh] overflow-hidden rounded-2xl border border-rose-line bg-white">
        {/* Conversation list */}
        <div
          className={`w-full shrink-0 overflow-y-auto border-rose-line md:w-72 md:border-r ${
            activeCid ? "hidden md:block" : "block"
          }`}
        >
          {loading && convos.length === 0 && (
            <p className="p-6 text-center text-sm text-muted">Memuat…</p>
          )}
          {!loading && convos.length === 0 && (
            <p className="p-6 text-center text-sm text-muted">Belum ada percakapan.</p>
          )}
          {convos.map((c) => (
            <button
              key={c.id}
              onClick={() => open(c.id)}
              className={`flex w-full items-start gap-2 border-b border-rose-line px-4 py-3 text-left hover:bg-rose-soft ${
                activeCid === c.id ? "bg-rose-soft" : ""
              }`}
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate font-semibold text-ink">{c.nama || "Tamu"}</span>
                  <span className="shrink-0 text-[11px] text-muted">{timeShort(c.lastAt)}</span>
                </div>
                <p className="mt-0.5 truncate text-sm text-muted">
                  {c.lastSender === "owner" ? "Kamu: " : ""}
                  {c.lastBody}
                </p>
              </div>
              {c.ownerUnread > 0 && (
                <span className="mt-1 shrink-0 rounded-full bg-rose px-2 py-0.5 text-[11px] font-semibold text-white">
                  {c.ownerUnread}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Thread */}
        <div className={`flex-1 flex-col ${activeCid ? "flex" : "hidden md:flex"}`}>
          {!activeCid ? (
            <div className="flex flex-1 flex-col items-center justify-center text-muted">
              <MessageSquare size={28} className="opacity-40" />
              <p className="mt-2 text-sm">Pilih percakapan.</p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between gap-2 border-b border-rose-line px-4 py-3">
                <div className="flex items-center gap-2">
                  <button onClick={() => setActiveCid(null)} className="md:hidden" aria-label="Kembali">
                    <ArrowLeft size={18} className="text-muted" />
                  </button>
                  <div>
                    <div className="font-semibold text-ink">{active?.nama || "Tamu"}</div>
                    {active?.telepon && <div className="text-xs text-muted">{active.telepon}</div>}
                  </div>
                </div>
                <button
                  onClick={() => hapus(activeCid)}
                  aria-label="Hapus"
                  className="rounded-lg p-2 text-muted hover:text-rose"
                >
                  <Trash2 size={16} />
                </button>
              </div>

              <div className="flex-1 space-y-2 overflow-y-auto bg-rose-soft/30 p-4">
                {!thread && <p className="py-6 text-center text-sm text-muted">Memuat…</p>}
                {thread?.messages?.map((m) => (
                  <div key={m.id} className={`flex ${m.sender === "owner" ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-[75%] whitespace-pre-wrap rounded-2xl px-3 py-2 text-sm ${
                        m.sender === "owner" ? "bg-rose text-white" : "border border-rose-line bg-white text-ink"
                      }`}
                    >
                      {m.body}
                      <span className={`mt-0.5 block text-[10px] ${m.sender === "owner" ? "text-white/70" : "text-muted"}`}>
                        {timeShort(m.createdAt)}
                      </span>
                    </div>
                  </div>
                ))}
                <div ref={bottomRef} />
              </div>

              <form onSubmit={send} className="flex items-end gap-2 border-t border-rose-line p-3">
                <textarea
                  className="field max-h-24 min-h-[42px] flex-1 resize-none py-2.5"
                  placeholder="Balas…"
                  rows={1}
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      send(e);
                    }
                  }}
                />
                <button
                  type="submit"
                  disabled={busy || !reply.trim()}
                  aria-label="Kirim"
                  className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-full bg-rose text-white hover:bg-rose-deep disabled:opacity-50"
                >
                  {busy ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
