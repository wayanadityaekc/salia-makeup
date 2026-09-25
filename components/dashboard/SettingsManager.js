"use client";

import { useEffect, useState } from "react";
import { Save } from "lucide-react";
import { formatRupiah } from "@/lib/utils";
import { getSettings, updateSettings, UnauthorizedError } from "@/lib/storage";

export default function SettingsManager({ onUnauthorized }) {
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    getSettings()
      .then((s) => setForm(s))
      .catch(() => setErr("Gagal memuat pengaturan."))
      .finally(() => setLoading(false));
  }, []);

  if (loading || !form) return <p className="text-sm text-muted">Memuat…</p>;

  const setBank = (k, v) => { setForm((f) => ({ ...f, bank: { ...f.bank, [k]: v } })); setSaved(false); };
  const setSocial = (k, v) => { setForm((f) => ({ ...f, social: { ...f.social, [k]: v } })); setSaved(false); };
  const setAreaFee = (id, fee) => {
    setForm((f) => ({ ...f, areas: f.areas.map((a) => (a.id === id ? { ...a, fee } : a)) }));
    setSaved(false);
  };

  const save = async () => {
    setBusy(true);
    setErr("");
    try {
      const s = await updateSettings({
        dpPercent: Number(form.dpPercent) || 0,
        bank: form.bank,
        areas: form.areas.map((a) => ({ ...a, fee: Number(a.fee) || 0 })),
        social: form.social,
      });
      setForm(s);
      setSaved(true);
    } catch (e) {
      if (e instanceof UnauthorizedError) onUnauthorized?.();
      else setErr("Gagal menyimpan. Coba lagi.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="max-w-2xl space-y-6">
      {err && <p className="text-sm text-rose">{err}</p>}

      {/* DP */}
      <section className="rounded-2xl border border-rose-line bg-white p-5">
        <h3 className="font-semibold text-ink">Uang Muka (DP)</h3>
        <p className="mt-1 text-sm text-muted">Persentase DP yang diminta untuk kunci jadwal.</p>
        <div className="mt-3 flex items-center gap-2">
          <input type="number" min="0" max="100" className="field w-28"
            value={form.dpPercent} onChange={(e) => { setForm((f) => ({ ...f, dpPercent: e.target.value })); setSaved(false); }} />
          <span className="text-sm text-ink">% dari total</span>
        </div>
      </section>

      {/* Bank */}
      <section className="rounded-2xl border border-rose-line bg-white p-5">
        <h3 className="font-semibold text-ink">Rekening Pembayaran</h3>
        <p className="mt-1 text-sm text-muted">Ditampilkan ke tamu saat bayar DP.</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          <div>
            <label className="label">Nama bank</label>
            <input className="field" placeholder="BCA" value={form.bank.name} onChange={(e) => setBank("name", e.target.value)} />
          </div>
          <div>
            <label className="label">No. rekening</label>
            <input className="field" placeholder="1234567890" value={form.bank.number} onChange={(e) => setBank("number", e.target.value)} />
          </div>
          <div>
            <label className="label">Atas nama</label>
            <input className="field" placeholder="Salia" value={form.bank.holder} onChange={(e) => setBank("holder", e.target.value)} />
          </div>
        </div>
      </section>

      {/* Ongkir per area */}
      <section className="rounded-2xl border border-rose-line bg-white p-5">
        <h3 className="font-semibold text-ink">Ongkir per Area</h3>
        <p className="mt-1 text-sm text-muted">Biaya tambahan sesuai jarak. Isi 0 untuk gratis.</p>
        <div className="mt-3 space-y-3">
          {form.areas.map((a) => (
            <div key={a.id} className="flex items-center justify-between gap-3">
              <span className="text-sm text-ink">{a.nama}</span>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted">Rp</span>
                <input type="number" min="0" className="field w-36 text-right"
                  value={a.fee} onChange={(e) => setAreaFee(a.id, e.target.value)} />
                <span className="w-28 text-right text-xs text-muted">{formatRupiah(Number(a.fee) || 0)}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Social */}
      <section className="rounded-2xl border border-rose-line bg-white p-5">
        <h3 className="font-semibold text-ink">Link Sosial Media</h3>
        <p className="mt-1 text-sm text-muted">Muncul sebagai ikon di footer. Kosongkan untuk sembunyikan.</p>
        <div className="mt-3 grid gap-3">
          <div>
            <label className="label">Instagram (URL)</label>
            <input className="field" placeholder="https://instagram.com/saliamakeup" value={form.social.instagram} onChange={(e) => setSocial("instagram", e.target.value)} />
          </div>
          <div>
            <label className="label">TikTok (URL)</label>
            <input className="field" placeholder="https://tiktok.com/@saliamakeup" value={form.social.tiktok} onChange={(e) => setSocial("tiktok", e.target.value)} />
          </div>
          <div>
            <label className="label">Google Business Profile (URL)</label>
            <input className="field" placeholder="https://g.page/..." value={form.social.google} onChange={(e) => setSocial("google", e.target.value)} />
          </div>
        </div>
      </section>

      <div className="flex items-center gap-3">
        <button onClick={save} disabled={busy} className="btn-primary px-5 disabled:opacity-60">
          <Save size={16} /> {saved ? "Tersimpan" : busy ? "Menyimpan…" : "Simpan pengaturan"}
        </button>
      </div>
    </div>
  );
}
