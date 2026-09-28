"use client";

import { useEffect, useState } from "react";
import { Save, Mail, Loader2, Send } from "lucide-react";
import { formatRupiah } from "@/lib/utils";
import { getSettings, updateSettings, getEmailPreview, sendTestEmail, UnauthorizedError } from "@/lib/storage";
import ImageUpload from "./ImageUpload";

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

  const setContent = (k, v) => { setForm((f) => ({ ...f, content: { ...(f.content || {}), [k]: v } })); setSaved(false); };
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
        whatsapp: form.whatsapp || "",
        content: form.content || {},
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

      {/* Konten Beranda */}
      <section className="rounded-2xl border border-rose-line bg-white p-5">
        <h3 className="font-semibold text-ink">Konten Beranda</h3>
        <p className="mt-1 text-sm text-muted">Logo, judul & foto hero. Kosongkan untuk pakai bawaan.</p>

        <div className="mt-4 grid gap-5 sm:grid-cols-2">
          {/* Logo */}
          <div>
            <label className="label">Logo</label>
            <div className="mt-1 flex items-center gap-3">
              <div className="flex h-14 w-32 items-center justify-center overflow-hidden rounded-xl border border-rose-line bg-rose-soft/40">
                {form.content?.logo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={form.content.logo} alt="Logo" className="max-h-12 max-w-full object-contain" />
                ) : (
                  <span className="text-xs font-bold text-rose">Salia Makeup</span>
                )}
              </div>
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <ImageUpload onUploaded={(url) => setContent("logo", url)} onUnauthorized={onUnauthorized} label={form.content?.logo ? "Ganti" : "Upload"} />
              {form.content?.logo && (
                <button type="button" onClick={() => setContent("logo", "")} className="text-xs text-muted hover:text-rose">Hapus</button>
              )}
            </div>
          </div>

          {/* Hero photo */}
          <div>
            <label className="label">Foto hero</label>
            <div className="mt-1 aspect-[4/3] w-full overflow-hidden rounded-xl border border-rose-line bg-rose-soft/40">
              {form.content?.heroPhoto ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={form.content.heroPhoto} alt="Hero" className="h-full w-full object-cover" />
              ) : (
                <div className="foto-ph h-full w-full text-xs">Belum ada foto</div>
              )}
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <ImageUpload onUploaded={(url) => setContent("heroPhoto", url)} onUnauthorized={onUnauthorized} label={form.content?.heroPhoto ? "Ganti" : "Upload"} />
              {form.content?.heroPhoto && (
                <button type="button" onClick={() => setContent("heroPhoto", "")} className="text-xs text-muted hover:text-rose">Hapus</button>
              )}
            </div>
          </div>
        </div>

        <div className="mt-4 grid gap-3">
          <div>
            <label className="label">Kicker (teks kecil di atas judul)</label>
            <input className="field" placeholder="Make Up & Nail Art Artist" value={form.content?.heroKicker || ""} onChange={(e) => setContent("heroKicker", e.target.value)} />
          </div>
          <div>
            <label className="label">Judul hero (H1)</label>
            <input className="field" placeholder="Cantik di hari spesialmu." value={form.content?.heroTitle || ""} onChange={(e) => setContent("heroTitle", e.target.value)} />
          </div>
        </div>
      </section>

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

      {/* WhatsApp */}
      <section className="rounded-2xl border border-rose-line bg-white p-5">
        <h3 className="font-semibold text-ink">Nomor WhatsApp</h3>
        <p className="mt-1 text-sm text-muted">Dipakai untuk booking, tombol chat, & halaman /links. Format: 62… (tanpa + / 0 depan).</p>
        <input className="field mt-3 sm:w-72" placeholder="6281234567890"
          value={form.whatsapp || ""} onChange={(e) => { setForm((f) => ({ ...f, whatsapp: e.target.value })); setSaved(false); }} />
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
        <div className="mt-3 grid gap-4 sm:grid-cols-2">
          {form.areas.map((a) => (
            <div key={a.id}>
              <label className="label">{a.nama}</label>
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted">Rp</span>
                <input
                  type="number"
                  min="0"
                  inputMode="numeric"
                  className="field pl-9 text-right"
                  value={a.fee}
                  onChange={(e) => setAreaFee(a.id, e.target.value)}
                />
              </div>
              <p className="mt-1 text-right text-xs text-muted">{Number(a.fee) > 0 ? formatRupiah(Number(a.fee)) : "Gratis"}</p>
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

      {/* Email pelanggan (preview) */}
      <EmailPreview onUnauthorized={onUnauthorized} />

      <div className="flex items-center gap-3">
        <button onClick={save} disabled={busy} className="btn-primary px-5 disabled:opacity-60">
          <Save size={16} /> {saved ? "Tersimpan" : busy ? "Menyimpan…" : "Simpan pengaturan"}
        </button>
      </div>
    </div>
  );
}

// Customer email design + preview. Renders the server-built HTML in a sandboxed
// iframe, and can send a test to any inbox to check it for real.
function EmailPreview({ onUnauthorized }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [to, setTo] = useState("");
  const [sending, setSending] = useState(false);
  const [msg, setMsg] = useState("");

  const load = async () => {
    setLoading(true); setMsg("");
    try { setData(await getEmailPreview()); }
    catch (e) { if (e instanceof UnauthorizedError) onUnauthorized?.(); else setMsg("Gagal memuat preview."); }
    finally { setLoading(false); }
  };

  const test = async () => {
    if (!to.trim()) return setMsg("Isi email tujuan dulu.");
    setSending(true); setMsg("");
    try {
      const r = await sendTestEmail(to.trim());
      if (r?.ok) setMsg("Email tes terkirim ✓");
      else if (r?.skipped) setMsg("Resend belum diaktifkan (set RESEND_API_KEY + RESEND_FROM). Preview tetap bisa dilihat.");
      else setMsg(`Gagal kirim: ${r?.error || "coba lagi"}`);
    } catch (e) {
      if (e instanceof UnauthorizedError) onUnauthorized?.(); else setMsg("Gagal kirim email tes.");
    } finally { setSending(false); }
  };

  return (
    <section className="rounded-2xl border border-rose-line bg-white p-5">
      <h3 className="flex items-center gap-2 font-semibold text-ink"><Mail size={17} className="text-rose" /> Email pelanggan</h3>
      <p className="mt-1 text-sm text-muted">Struk + kebijakan + persiapan H-1. Lihat desainnya dulu sebelum diaktifkan.</p>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button type="button" onClick={load} disabled={loading} className="btn-outline px-4 py-2 text-sm disabled:opacity-60">
          {loading ? <Loader2 size={15} className="animate-spin" /> : <Mail size={15} />} {data ? "Muat ulang preview" : "Lihat preview"}
        </button>
        {data && (
          <span className={`text-xs ${data.emailConfigured ? "text-green-600" : "text-muted"}`}>
            {data.emailConfigured ? "Resend aktif" : "Resend belum aktif"}
          </span>
        )}
      </div>

      {data && (
        <>
          <div className="mt-3 text-xs text-muted">Subject: <span className="font-medium text-ink">{data.subject}</span></div>
          <iframe title="Preview email" srcDoc={data.html} className="mt-2 h-[520px] w-full rounded-xl border border-rose-line bg-white" />
          <div className="mt-3 flex flex-wrap items-end gap-2">
            <div className="flex-1 min-w-[200px]">
              <label className="label">Kirim tes ke email</label>
              <input className="field" type="email" placeholder="email@kamu.com" value={to} onChange={(e) => setTo(e.target.value)} />
            </div>
            <button type="button" onClick={test} disabled={sending} className="btn-primary px-4 py-2.5 text-sm disabled:opacity-60">
              {sending ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />} Kirim tes
            </button>
          </div>
        </>
      )}
      {msg && <p className="mt-2 text-xs text-ink/70">{msg}</p>}
    </section>
  );
}
