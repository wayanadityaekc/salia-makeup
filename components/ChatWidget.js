"use client";

import { useEffect, useRef, useState } from "react";
import { MessageCircle, X, Send, Loader2, Check, ArrowLeft } from "lucide-react";
import { site } from "@/lib/config";
import { getSettings, sendMessage } from "@/lib/storage";
import { waLink, normalizeWa } from "@/lib/utils";

// Floating chat launcher with TWO options:
//  1. WhatsApp  -> opens wa.me (owner replies in WhatsApp)
//  2. Chat di web -> a short message form that lands in the dashboard inbox
//     (and fires the owner's push notification). Owner replies via WhatsApp.
export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [view, setView] = useState("menu"); // menu | form | done
  const [wa, setWa] = useState(site.whatsapp || "");
  const [form, setForm] = useState({ nama: "", telepon: "", pesan: "" });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const panelRef = useRef(null);

  useEffect(() => {
    getSettings()
      .then((s) => s?.whatsapp && setWa(s.whatsapp))
      .catch(() => {});
  }, []);

  // Close on outside click / Escape when open.
  useEffect(() => {
    if (!open) return;
    const onClick = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const waHref = waLink(
    normalizeWa(wa || site.whatsapp),
    `Halo ${site.brand}, saya mau tanya soal layanan make up / nail art.`
  );

  const submit = async (e) => {
    e.preventDefault();
    if (!form.nama.trim() || !form.pesan.trim()) {
      setErr("Nama dan pesan wajib diisi.");
      return;
    }
    setBusy(true);
    setErr("");
    try {
      await sendMessage(form);
      setView("done");
      setForm({ nama: "", telepon: "", pesan: "" });
    } catch {
      setErr("Gagal mengirim. Coba lagi atau pakai WhatsApp.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div ref={panelRef}>
      {open && (
        <div
          className="fixed bottom-24 right-5 z-50 w-[min(92vw,340px)] overflow-hidden rounded-2xl border border-rose-line bg-white shadow-xl"
          style={{ marginBottom: "env(safe-area-inset-bottom)" }}
        >
          {/* Header */}
          <div className="flex items-center justify-between bg-rose px-4 py-3 text-white">
            <div className="flex items-center gap-2">
              {view === "form" && (
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

          {/* Menu: two options */}
          {view === "menu" && (
            <div className="p-4">
              <p className="text-sm text-muted">Mau tanya-tanya? Pilih cara ngobrol:</p>
              <div className="mt-3 grid gap-2">
                <a
                  href={waHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 rounded-xl border border-rose-line px-4 py-3 text-left hover:bg-rose-soft"
                >
                  <MessageCircle size={20} className="shrink-0 text-rose" />
                  <span>
                    <span className="block text-sm font-semibold text-ink">WhatsApp</span>
                    <span className="block text-xs text-muted">Chat langsung di WhatsApp</span>
                  </span>
                </a>
                <button
                  onClick={() => setView("form")}
                  className="flex items-center gap-3 rounded-xl border border-rose-line px-4 py-3 text-left hover:bg-rose-soft"
                >
                  <Send size={20} className="shrink-0 text-rose" />
                  <span>
                    <span className="block text-sm font-semibold text-ink">Chat di web</span>
                    <span className="block text-xs text-muted">Tinggalkan pesan, kami balas via WA</span>
                  </span>
                </button>
              </div>
            </div>
          )}

          {/* Web chat form */}
          {view === "form" && (
            <form onSubmit={submit} className="space-y-3 p-4">
              <input
                className="field"
                placeholder="Nama"
                value={form.nama}
                onChange={(e) => setForm({ ...form, nama: e.target.value })}
              />
              <input
                className="field"
                placeholder="No. WhatsApp (opsional)"
                inputMode="tel"
                value={form.telepon}
                onChange={(e) => setForm({ ...form, telepon: e.target.value })}
              />
              <textarea
                className="field min-h-[90px] resize-none"
                placeholder="Tulis pesan…"
                value={form.pesan}
                onChange={(e) => setForm({ ...form, pesan: e.target.value })}
              />
              {err && <p className="text-xs text-rose">{err}</p>}
              <button
                type="submit"
                disabled={busy}
                className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-rose px-4 py-2.5 text-sm font-semibold text-white hover:bg-rose-deep disabled:opacity-60"
              >
                {busy ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />} Kirim pesan
              </button>
            </form>
          )}

          {/* Sent */}
          {view === "done" && (
            <div className="p-6 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-rose-soft text-rose">
                <Check size={24} />
              </div>
              <p className="mt-3 text-sm font-semibold text-ink">Pesan terkirim!</p>
              <p className="mt-1 text-xs text-muted">Kami balas secepatnya lewat WhatsApp ya.</p>
              <button
                onClick={() => setView("menu")}
                className="mt-4 text-sm font-medium text-rose hover:underline"
              >
                Selesai
              </button>
            </div>
          )}
        </div>
      )}

      {/* Launcher */}
      <button
        onClick={() => {
          setOpen((v) => !v);
          setView("menu");
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
