"use client";

import { useEffect, useState } from "react";
import { LinkIcon, Copy, Check, Loader2, Plus } from "lucide-react";
import { formatTanggal } from "@/lib/utils";
import { createBookingToken, listBookingTokens, UnauthorizedError } from "@/lib/storage";
import DatePicker from "@/components/ui/DatePicker";

// Admin: after confirming a date is free on WhatsApp, mint a single-use booking
// link bound to that date and send it to the customer.
export default function BookingLinks({ onUnauthorized }) {
  const [tanggal, setTanggal] = useState("");
  const [days, setDays] = useState(3);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [list, setList] = useState([]);
  const [copied, setCopied] = useState("");

  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const fullUrl = (u) => (u?.startsWith("http") ? u : `${origin}${u || ""}`);

  const load = async () => {
    try { setList(await listBookingTokens()); }
    catch (e) { if (e instanceof UnauthorizedError) onUnauthorized?.(); }
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);

  const create = async () => {
    if (!tanggal) return setErr("Pilih tanggal yang disetujui.");
    setErr(""); setBusy(true);
    try {
      await createBookingToken({ tanggal, days: Number(days) || 3 });
      setTanggal("");
      await load();
    } catch (e) {
      if (e instanceof UnauthorizedError) onUnauthorized?.();
      else setErr("Gagal membuat link. Coba lagi.");
    } finally { setBusy(false); }
  };

  const copy = async (key, text) => { try { await navigator.clipboard.writeText(text); setCopied(key); setTimeout(() => setCopied(""), 1500); } catch {} };

  const state = (t) => {
    if (t.used_at) return { label: "Terpakai", cls: "bg-ink/10 text-ink" };
    if (new Date(t.expires_at) < new Date()) return { label: "Kedaluwarsa", cls: "bg-rose-soft text-rose" };
    return { label: "Aktif", cls: "bg-green-100 text-green-700" };
  };

  return (
    <section className="rounded-2xl border border-rose-line bg-white p-5">
      <h3 className="flex items-center gap-2 font-semibold text-ink"><LinkIcon size={17} className="text-rose" /> Link booking (magic link)</h3>
      <p className="mt-1 text-sm text-muted">Setelah cek tanggal available di WhatsApp, buat link ini & kirim ke pelanggan. Sekali pakai, terkunci ke tanggalnya.</p>

      <div className="mt-4 flex flex-wrap items-end gap-3">
        <div className="min-w-[180px]">
          <label className="label">Tanggal disetujui</label>
          <DatePicker value={tanggal} onChange={setTanggal} />
        </div>
        <div className="w-28">
          <label className="label">Berlaku (hari)</label>
          <input type="number" min="1" max="30" className="field" value={days} onChange={(e) => setDays(e.target.value)} />
        </div>
        <button onClick={create} disabled={busy} className="btn-primary px-4 py-2.5 text-sm disabled:opacity-60">
          {busy ? <Loader2 size={15} className="animate-spin" /> : <Plus size={15} />} Buat link
        </button>
      </div>
      {err && <p className="mt-2 text-sm text-rose">{err}</p>}

      {list.length > 0 && (
        <div className="mt-5 space-y-2">
          {list.map((t) => {
            const s = state(t);
            const url = fullUrl(`/booking?token=${t.token}`);
            return (
              <div key={t.token} className="flex flex-wrap items-center gap-2 rounded-xl border border-rose-line px-3 py-2.5">
                <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${s.cls}`}>{s.label}</span>
                <span className="text-sm font-medium text-ink">{formatTanggal(t.tanggal)}</span>
                <span className="text-xs text-muted">exp {formatTanggal(t.expires_at)}</span>
                <button onClick={() => copy(t.token, url)} disabled={t.used_at || new Date(t.expires_at) < new Date()} className="ml-auto inline-flex items-center gap-1 rounded-lg border border-rose-line px-2.5 py-1.5 text-xs font-medium text-rose hover:bg-rose-soft disabled:opacity-40">
                  {copied === t.token ? <><Check size={13} /> Tersalin</> : <><Copy size={13} /> Salin link</>}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
