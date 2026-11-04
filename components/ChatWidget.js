'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, m } from 'motion/react';
import { backdropMotion, sheetMotion } from '@/lib/motion';
import useBodyLock from '@/lib/useBodyLock';
import { MessageCircle, X, Send, Loader2, ArrowLeft, Download } from 'lucide-react';
import { site } from '@/lib/config';
import { fetchSettings, sendChatMessage, fetchChatMessages } from '@/lib/storage';
import { waLink, normalizeWa } from '@/lib/utils';
import { chatCidFor, OPEN_CHAT_EVENT } from '@/lib/chat';
import { useUser } from '@/components/auth/UserProvider';

const URL_SPLIT_RE = /(https?:\/\/[^\s]+)/g;
const URL_PART_RE = /^https?:\/\/[^\s]+$/;
function isReceipt(url) {
  return /\/receipt\/|struk-|\.pdf($|\?)/i.test(url);
}

function Body({ text = '', mine = false }) {
  const parts = String(text).split(URL_SPLIT_RE);
  return (
    <span className="whitespace-pre-wrap">
      {parts.map((part, index) =>
        URL_PART_RE.test(part) ? (
          <a
            key={index}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            className={`inline-flex items-center gap-1 underline ${mine ? 'text-white' : 'text-rose'}`}
          >
            {isReceipt(part) ? (
              <>
                <Download size={13} /> Download struk
              </>
            ) : (
              part
            )}
          </a>
        ) : (
          <span key={index}>{part}</span>
        ),
      )}
    </span>
  );
}

export default function ChatWidget() {
  const { user } = useUser();
  const [open, setOpen] = useState(false);
  useBodyLock(open);
  const [view, setView] = useState('menu');
  const [whatsapp, setWhatsapp] = useState(site.whatsapp || '');
  const [nama, setNama] = useState('');
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const lastId = useRef(0);
  const panelRef = useRef(null);
  const bottomRef = useRef(null);

  const cid = useMemo(() => chatCidFor(user), [user]);

  useEffect(() => {
    async function loadWhatsapp() {
      try {
        const settings = await fetchSettings();
        if (settings?.whatsapp) setWhatsapp(settings.whatsapp);
      } catch (e) {}
    }
    loadWhatsapp();
  }, []);
  useEffect(() => {
    if (user?.nama) setNama(user.nama);
  }, [user]);

  useEffect(() => {
    lastId.current = 0;
    setMessages([]);
  }, [cid]);

  useEffect(() => {
    function handleOpenRequest(event) {
      setOpen(true);
      setView(event?.detail?.view || 'menu');
    }
    window.addEventListener(OPEN_CHAT_EVENT, handleOpenRequest);
    return () => window.removeEventListener(OPEN_CHAT_EVENT, handleOpenRequest);
  }, []);

  useEffect(() => {
    if (!open) return;
    function handleOutsideClick(event) {
      if (panelRef.current && !panelRef.current.contains(event.target)) setOpen(false);
    }
    function handleKeyDown(event) {
      if (event.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  function mergeNew(incoming) {
    if (!incoming.length) return;
    setMessages((prev) => {
      const seen = new Set(prev.map((message) => message.id));
      const add = incoming.filter((message) => !seen.has(message.id));
      if (!add.length) return prev;
      const next = [...prev, ...add];
      lastId.current = Math.max(lastId.current, ...next.map((message) => message.id));
      return next;
    });
  }

  useEffect(() => {
    if (!open || view !== 'chat' || !cid) return;
    let alive = true;
    async function tick() {
      try {
        const rows = await fetchChatMessages(cid, lastId.current);
        if (alive) mergeNew(rows);
      } catch (e) {}
    }
    tick();
    const timer = setInterval(tick, 3000);
    return () => {
      alive = false;
      clearInterval(timer);
    };
  }, [open, view, cid]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: 'end' });
  }, [messages, view]);

  async function handleSend(event) {
    event.preventDefault();
    const body = text.trim();
    if (!body || !cid) return;
    setError('');
    setBusy(true);
    try {
      const message = await sendChatMessage(cid, { nama, telepon: user?.telepon, body });
      setText('');
      if (message) mergeNew([message]);
    } catch (e) {
      setError('Gagal mengirim. Coba lagi.');
    } finally {
      setBusy(false);
    }
  }

  const waHref = waLink(
    normalizeWa(whatsapp || site.whatsapp),
    `Halo ${site.brand}, saya mau tanya soal layanan make up / nail art.`,
  );

  return (
    <AnimatePresence>
      {open && (
        <m.div
          key="chat-backdrop"
          {...backdropMotion}
          className="fixed inset-0 z-60 bg-ink/40"
          onClick={() => setOpen(false)}
          aria-hidden
        />
      )}
      {open && (
        <m.div key="chat-panel" {...sheetMotion} className="fixed inset-x-0 bottom-0 z-61 flex justify-center">
          <div
            ref={panelRef}
            className={`flex w-full max-w-lg flex-col overflow-hidden rounded-t-3xl border border-rose-line bg-white shadow-xl ${view === 'chat' ? 'h-[80dvh]' : ''}`}
            style={{ paddingBottom: 'env(safe-area-inset-bottom)', maxHeight: 'min(85dvh, 640px)' }}
          >
            <div className="flex items-center justify-between bg-rose px-4 py-3 text-white">
              <div className="flex items-center gap-2">
                {view === 'chat' && (
                  <button
                    onClick={() => setView('menu')}
                    aria-label="Kembali"
                    className="rounded-full p-0.5 hover:bg-white/15"
                  >
                    <ArrowLeft size={18} />
                  </button>
                )}
                <span className="font-semibold">Chat {site.brand}</span>
              </div>
              <button
                onClick={() => setOpen(false)}
                aria-label="Tutup"
                className="rounded-full p-0.5 hover:bg-white/15"
              >
                <X size={18} />
              </button>
            </div>

            {view === 'menu' && (
              <div className="p-4">
                <p className="text-sm text-muted">Mau tanya-tanya? Pilih cara ngobrol:</p>
                <div className="mt-3 grid gap-2">
                  <button
                    onClick={() => setView('chat')}
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

            {view === 'chat' && (
              <>
                <div className="min-h-0 flex-1 space-y-2 overflow-y-auto bg-rose-soft/40 p-4">
                  {messages.length === 0 && (
                    <p className="py-6 text-center text-xs text-muted">Tulis pesanmu, kami balas secepatnya. 💬</p>
                  )}
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.sender === 'guest' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${message.sender === 'guest' ? 'bg-rose text-white' : 'border border-rose-line bg-white text-ink'}`}
                      >
                        <Body text={message.body} mine={message.sender === 'guest'} />
                      </div>
                    </div>
                  ))}
                  <div ref={bottomRef} />
                </div>

                <form onSubmit={handleSend} className="border-t border-rose-line p-3">
                  {!nama && messages.length === 0 && (
                    <input
                      className="field mb-2"
                      placeholder="Nama (opsional)"
                      value={nama}
                      onChange={(event) => setNama(event.target.value)}
                    />
                  )}
                  {error && <p className="mb-2 text-xs text-rose">{error}</p>}
                  <div className="flex items-end gap-2">
                    <textarea
                      className="field max-h-24 min-h-[42px] flex-1 resize-none py-2.5"
                      placeholder="Tulis pesan…"
                      rows={1}
                      value={text}
                      onChange={(event) => setText(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' && !event.shiftKey) {
                          event.preventDefault();
                          handleSend(event);
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
        </m.div>
      )}
    </AnimatePresence>
  );
}
