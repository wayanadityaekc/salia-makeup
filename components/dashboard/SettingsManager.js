'use client';

import { useEffect, useState } from 'react';
import { Save, Mail, Loader2, Send } from 'lucide-react';
import { formatRupiah } from '@/lib/utils';
import { fetchSettings, updateSettings, fetchEmailPreview, sendTestEmail, UnauthorizedError } from '@/lib/storage';
import ImageUpload from './ImageUpload';

export default function SettingsManager({ onUnauthorized }) {
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadSettings() {
      try {
        setForm(await fetchSettings());
      } catch (e) {
        setError('Gagal memuat pengaturan.');
      } finally {
        setLoading(false);
      }
    }
    loadSettings();
  }, []);

  if (loading || !form) return <p className="text-sm text-muted">Memuat…</p>;

  function setContent(field, value) {
    setForm((current) => ({ ...current, content: { ...(current.content || {}), [field]: value } }));
    setSaved(false);
  }
  function setBank(field, value) {
    setForm((current) => ({ ...current, bank: { ...current.bank, [field]: value } }));
    setSaved(false);
  }
  function setSocial(field, value) {
    setForm((current) => ({ ...current, social: { ...current.social, [field]: value } }));
    setSaved(false);
  }
  function setAreaFee(id, fee) {
    setForm((current) => ({
      ...current,
      areas: current.areas.map((area) => (area.id === id ? { ...area, fee } : area)),
    }));
    setSaved(false);
  }

  async function save() {
    setBusy(true);
    setError('');
    try {
      const savedSettings = await updateSettings({
        dpPercent: Number(form.dpPercent) || 0,
        bank: form.bank,
        areas: form.areas.map((area) => ({ ...area, fee: Number(area.fee) || 0 })),
        social: form.social,
        whatsapp: form.whatsapp || '',
        content: form.content || {},
      });
      setForm(savedSettings);
      setSaved(true);
    } catch (e) {
      if (e instanceof UnauthorizedError) onUnauthorized?.();
      else setError('Gagal menyimpan. Coba lagi.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="max-w-2xl space-y-6">
      {error && <p className="text-sm text-rose">{error}</p>}

      <section className="rounded-2xl border border-rose-line bg-white p-5">
        <h3 className="font-semibold text-ink">Konten Beranda</h3>
        <p className="mt-1 text-sm text-muted">Logo, judul & foto hero. Kosongkan untuk pakai bawaan.</p>

        <div className="mt-4 grid gap-5 sm:grid-cols-2">
          <div>
            <label className="label">Logo</label>
            <div className="mt-1 flex items-center gap-3">
              <div className="flex h-14 w-32 items-center justify-center overflow-hidden rounded-xl border border-rose-line bg-rose-soft/40">
                {form.content?.logo ? (
                  <img src={form.content.logo} alt="Logo" className="max-h-12 max-w-full object-contain" />
                ) : (
                  <span className="text-xs font-bold text-rose">Salia Makeup</span>
                )}
              </div>
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <ImageUpload
                onUploaded={(url) => setContent('logo', url)}
                onUnauthorized={onUnauthorized}
                label={form.content?.logo ? 'Ganti' : 'Upload'}
              />
              {form.content?.logo && (
                <button
                  type="button"
                  onClick={() => setContent('logo', '')}
                  className="text-xs text-muted hover:text-rose"
                >
                  Hapus
                </button>
              )}
            </div>
          </div>

          <div>
            <label className="label">Foto hero</label>
            <div className="mt-1 aspect-[4/3] w-full overflow-hidden rounded-xl border border-rose-line bg-rose-soft/40">
              {form.content?.heroPhoto ? (
                <img src={form.content.heroPhoto} alt="Hero" className="h-full w-full object-cover" />
              ) : (
                <div className="foto-ph h-full w-full text-xs">Belum ada foto</div>
              )}
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <ImageUpload
                onUploaded={(url) => setContent('heroPhoto', url)}
                onUnauthorized={onUnauthorized}
                label={form.content?.heroPhoto ? 'Ganti' : 'Upload'}
              />
              {form.content?.heroPhoto && (
                <button
                  type="button"
                  onClick={() => setContent('heroPhoto', '')}
                  className="text-xs text-muted hover:text-rose"
                >
                  Hapus
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="mt-4 grid gap-3">
          <div>
            <label className="label">Kicker (teks kecil di atas judul)</label>
            <input
              className="field"
              placeholder="Make Up & Nail Art Artist"
              value={form.content?.heroKicker || ''}
              onChange={(event) => setContent('heroKicker', event.target.value)}
            />
          </div>
          <div>
            <label className="label">Judul hero (H1)</label>
            <input
              className="field"
              placeholder="Cantik di hari spesialmu."
              value={form.content?.heroTitle || ''}
              onChange={(event) => setContent('heroTitle', event.target.value)}
            />
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-rose-line bg-white p-5">
        <h3 className="font-semibold text-ink">Uang Muka (DP)</h3>
        <p className="mt-1 text-sm text-muted">Persentase DP yang diminta untuk kunci jadwal.</p>
        <div className="mt-3 flex items-center gap-2">
          <input
            type="number"
            min="0"
            max="100"
            className="field w-28"
            value={form.dpPercent}
            onChange={(event) => {
              setForm((current) => ({ ...current, dpPercent: event.target.value }));
              setSaved(false);
            }}
          />
          <span className="text-sm text-ink">% dari total</span>
        </div>
      </section>

      <section className="rounded-2xl border border-rose-line bg-white p-5">
        <h3 className="font-semibold text-ink">Nomor WhatsApp</h3>
        <p className="mt-1 text-sm text-muted">
          Dipakai untuk booking, tombol chat, & halaman /links. Format: 62… (tanpa + / 0 depan).
        </p>
        <input
          className="field mt-3 sm:w-72"
          placeholder="6281234567890"
          value={form.whatsapp || ''}
          onChange={(event) => {
            setForm((current) => ({ ...current, whatsapp: event.target.value }));
            setSaved(false);
          }}
        />
      </section>

      <section className="rounded-2xl border border-rose-line bg-white p-5">
        <h3 className="font-semibold text-ink">Rekening Pembayaran</h3>
        <p className="mt-1 text-sm text-muted">Ditampilkan ke tamu saat bayar DP.</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          <div>
            <label className="label">Nama bank</label>
            <input
              className="field"
              placeholder="BCA"
              value={form.bank.name}
              onChange={(event) => setBank('name', event.target.value)}
            />
          </div>
          <div>
            <label className="label">No. rekening</label>
            <input
              className="field"
              placeholder="1234567890"
              value={form.bank.number}
              onChange={(event) => setBank('number', event.target.value)}
            />
          </div>
          <div>
            <label className="label">Atas nama</label>
            <input
              className="field"
              placeholder="Salia"
              value={form.bank.holder}
              onChange={(event) => setBank('holder', event.target.value)}
            />
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-rose-line bg-white p-5">
        <h3 className="font-semibold text-ink">Ongkir per Area</h3>
        <p className="mt-1 text-sm text-muted">Biaya tambahan sesuai jarak. Isi 0 untuk gratis.</p>
        <div className="mt-3 grid gap-4 sm:grid-cols-2">
          {form.areas.map((area) => (
            <div key={area.id}>
              <label className="label">{area.nama}</label>
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted">
                  Rp
                </span>
                <input
                  type="number"
                  min="0"
                  inputMode="numeric"
                  className="field pl-9 text-right"
                  value={area.fee}
                  onChange={(event) => setAreaFee(area.id, event.target.value)}
                />
              </div>
              <p className="mt-1 text-right text-xs text-muted">
                {Number(area.fee) > 0 ? formatRupiah(Number(area.fee)) : 'Gratis'}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-rose-line bg-white p-5">
        <h3 className="font-semibold text-ink">Link Sosial Media</h3>
        <p className="mt-1 text-sm text-muted">Muncul sebagai ikon di footer. Kosongkan untuk sembunyikan.</p>
        <div className="mt-3 grid gap-3">
          <div>
            <label className="label">Instagram (URL)</label>
            <input
              className="field"
              placeholder="https://instagram.com/saliamakeup"
              value={form.social.instagram}
              onChange={(event) => setSocial('instagram', event.target.value)}
            />
          </div>
          <div>
            <label className="label">TikTok (URL)</label>
            <input
              className="field"
              placeholder="https://tiktok.com/@saliamakeup"
              value={form.social.tiktok}
              onChange={(event) => setSocial('tiktok', event.target.value)}
            />
          </div>
          <div>
            <label className="label">Google Business Profile (URL)</label>
            <input
              className="field"
              placeholder="https://g.page/..."
              value={form.social.google}
              onChange={(event) => setSocial('google', event.target.value)}
            />
          </div>
        </div>
      </section>

      <EmailPreview onUnauthorized={onUnauthorized} />

      <div className="flex items-center gap-3">
        <button onClick={save} disabled={busy} className="btn-primary px-5 disabled:opacity-60">
          <Save size={16} /> {saved ? 'Tersimpan' : busy ? 'Menyimpan…' : 'Simpan pengaturan'}
        </button>
      </div>
    </div>
  );
}

function EmailPreview({ onUnauthorized }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [recipient, setRecipient] = useState('');
  const [sending, setSending] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  async function loadEmailPreview() {
    setLoading(true);
    setStatusMessage('');
    try {
      setData(await fetchEmailPreview());
    } catch (e) {
      if (e instanceof UnauthorizedError) onUnauthorized?.();
      else setStatusMessage('Gagal memuat preview.');
    } finally {
      setLoading(false);
    }
  }

  async function test() {
    if (!recipient.trim()) return setStatusMessage('Isi email tujuan dulu.');
    setSending(true);
    setStatusMessage('');
    try {
      const result = await sendTestEmail(recipient.trim());
      if (result?.ok) setStatusMessage('Email tes terkirim ✓');
      else if (result?.skipped)
        setStatusMessage('Resend belum diaktifkan (set RESEND_API_KEY + RESEND_FROM). Preview tetap bisa dilihat.');
      else setStatusMessage(`Gagal kirim: ${result?.error || 'coba lagi'}`);
    } catch (e) {
      if (e instanceof UnauthorizedError) onUnauthorized?.();
      else setStatusMessage('Gagal kirim email tes.');
    } finally {
      setSending(false);
    }
  }

  return (
    <section className="rounded-2xl border border-rose-line bg-white p-5">
      <h3 className="flex items-center gap-2 font-semibold text-ink">
        <Mail size={17} className="text-rose" /> Email pelanggan
      </h3>
      <p className="mt-1 text-sm text-muted">
        Struk + kebijakan + persiapan H-1. Lihat desainnya dulu sebelum diaktifkan.
      </p>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={loadEmailPreview}
          disabled={loading}
          className="btn-outline px-4 py-2 text-sm disabled:opacity-60"
        >
          {loading ? <Loader2 size={15} className="animate-spin" /> : <Mail size={15} />}{' '}
          {data ? 'Muat ulang preview' : 'Lihat preview'}
        </button>
        {data && (
          <span className={`text-xs ${data.emailConfigured ? 'text-green-600' : 'text-muted'}`}>
            {data.emailConfigured ? 'Resend aktif' : 'Resend belum aktif'}
          </span>
        )}
      </div>

      {data && (
        <>
          <div className="mt-3 text-xs text-muted">
            Subject: <span className="font-medium text-ink">{data.subject}</span>
          </div>
          <iframe
            title="Preview email"
            srcDoc={data.html}
            className="mt-2 h-[520px] w-full rounded-xl border border-rose-line bg-white"
          />
          <div className="mt-3 flex flex-wrap items-end gap-2">
            <div className="flex-1 min-w-[200px]">
              <label className="label">Kirim tes ke email</label>
              <input
                className="field"
                type="email"
                placeholder="email@kamu.com"
                value={recipient}
                onChange={(event) => setRecipient(event.target.value)}
              />
            </div>
            <button
              type="button"
              onClick={test}
              disabled={sending}
              className="btn-primary px-4 py-2.5 text-sm disabled:opacity-60"
            >
              {sending ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />} Kirim tes
            </button>
          </div>
        </>
      )}
      {statusMessage && <p className="mt-2 text-xs text-ink/70">{statusMessage}</p>}
    </section>
  );
}
