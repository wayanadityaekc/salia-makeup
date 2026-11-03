'use client';

import { useEffect, useRef, useState } from 'react';
import { Send, Loader2, Trash2, ArrowLeft, MessageSquare } from 'lucide-react';
import { formatTanggal } from '@/lib/utils';
import { fetchConversations, fetchThread, sendReply, deleteConversation, UnauthorizedError } from '@/lib/storage';

function timeShort(iso) {
  try {
    return new Date(iso).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
}

const CONVERSATIONS_POLL_MS = 5000;
const THREAD_POLL_MS = 3000;

export default function ChatManager({ onUnauthorized }) {
  const [conversations, setConversations] = useState([]);
  const [activeCid, setActiveCid] = useState(null);
  const [thread, setThread] = useState(null);
  const [reply, setReply] = useState('');
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  function handleRequestError(requestError) {
    if (requestError instanceof UnauthorizedError) onUnauthorized?.();
  }

  async function loadConversations() {
    try {
      setConversations(await fetchConversations());
    } catch (e) {
      handleRequestError(e);
    }
  }

  async function loadThread(cid) {
    try {
      setThread(await fetchThread(cid));
    } catch (e) {
      handleRequestError(e);
    }
  }

  useEffect(() => {
    async function loadFirstConversations() {
      setLoading(true);
      try {
        await loadConversations();
      } catch (e) {
        handleRequestError(e);
      } finally {
        setLoading(false);
      }
    }
    loadFirstConversations();
    const intervalId = setInterval(loadConversations, CONVERSATIONS_POLL_MS);
    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    if (!activeCid) return;
    loadThread(activeCid);
    const intervalId = setInterval(() => loadThread(activeCid), THREAD_POLL_MS);
    return () => clearInterval(intervalId);
  }, [activeCid]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: 'end' });
  }, [thread]);

  function open(cid) {
    setActiveCid(cid);
    setThread(null);
    setConversations((prev) =>
      prev.map((conversation) => (conversation.id === cid ? { ...conversation, ownerUnread: 0 } : conversation)),
    );
  }

  async function handleSend(event) {
    event.preventDefault();
    const body = reply.trim();
    if (!body || !activeCid) return;
    setBusy(true);
    try {
      const message = await sendReply(activeCid, body);
      setReply('');
      if (message)
        setThread((current) => (current ? { ...current, messages: [...current.messages, message] } : current));
      loadConversations();
    } catch (e) {
      handleRequestError(e);
    } finally {
      setBusy(false);
    }
  }

  async function hapus(cid) {
    if (!confirm('Hapus percakapan ini?')) return;
    try {
      await deleteConversation(cid);
      if (activeCid === cid) {
        setActiveCid(null);
        setThread(null);
      }
      loadConversations();
    } catch (e) {
      handleRequestError(e);
    }
  }

  const active = conversations.find((convo) => convo.id === activeCid);

  return (
    <div className="flex h-full flex-col">
      <h2 className="shrink-0 text-lg font-bold text-ink">Live chat</h2>
      <div className="mt-4 flex min-h-0 flex-1 overflow-hidden rounded-2xl border border-rose-line bg-white">
        <div
          className={`w-full shrink-0 overflow-y-auto border-rose-line md:w-72 md:border-r ${
            activeCid ? 'hidden md:block' : 'block'
          }`}
        >
          {loading && conversations.length === 0 && <p className="p-6 text-center text-sm text-muted">Memuat…</p>}
          {!loading && conversations.length === 0 && (
            <p className="p-6 text-center text-sm text-muted">Belum ada percakapan.</p>
          )}
          {conversations.map((convo) => (
            <button
              key={convo.id}
              onClick={() => open(convo.id)}
              className={`flex w-full items-start gap-2 border-b border-rose-line px-4 py-3 text-left hover:bg-rose-soft ${
                activeCid === convo.id ? 'bg-rose-soft' : ''
              }`}
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate font-semibold text-ink">{convo.nama || 'Tamu'}</span>
                  <span className="shrink-0 text-[11px] text-muted">{timeShort(convo.lastAt)}</span>
                </div>
                <p className="mt-0.5 truncate text-sm text-muted">
                  {convo.lastSender === 'owner' ? 'Kamu: ' : ''}
                  {convo.lastBody}
                </p>
              </div>
              {convo.ownerUnread > 0 && (
                <span className="mt-1 shrink-0 rounded-full bg-rose px-2 py-0.5 text-[11px] font-semibold text-white">
                  {convo.ownerUnread}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className={`flex-1 flex-col ${activeCid ? 'flex' : 'hidden md:flex'}`}>
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
                    <div className="font-semibold text-ink">{active?.nama || 'Tamu'}</div>
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
                {thread?.messages?.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.sender === 'owner' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[75%] whitespace-pre-wrap rounded-2xl px-3 py-2 text-sm ${
                        message.sender === 'owner' ? 'bg-rose text-white' : 'border border-rose-line bg-white text-ink'
                      }`}
                    >
                      {message.body}
                      <span
                        className={`mt-0.5 block text-[10px] ${message.sender === 'owner' ? 'text-white/70' : 'text-muted'}`}
                      >
                        {timeShort(message.createdAt)}
                      </span>
                    </div>
                  </div>
                ))}
                <div ref={bottomRef} />
              </div>

              <form onSubmit={handleSend} className="flex items-end gap-2 border-t border-rose-line p-3">
                <textarea
                  className="field max-h-24 min-h-[42px] flex-1 resize-none py-2.5"
                  placeholder="Balas…"
                  rows={1}
                  value={reply}
                  onChange={(event) => setReply(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' && !event.shiftKey) {
                      event.preventDefault();
                      handleSend(event);
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
