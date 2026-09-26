"use client";

import { useRef, useState } from "react";
import { X, Send, Copy, Check, Upload, CheckCircle2, Minus, Plus, Loader2 } from "lucide-react";
import Select from "@/components/ui/Select";
import DatePicker from "@/components/ui/DatePicker";
import { site } from "@/lib/config";
import { formatRupiah, formatTanggal, waLink, normalizeWa } from "@/lib/utils";
import { saveCartBooking, uploadProof } from "@/lib/storage";
import { compressImage } from "@/lib/image";
import { useCart } from "./CartProvider";

const timeOptions = (() => {
  const out = [];
  for (let h = 6; h <= 21; h++) for (const m of [0, 30]) {
    const t = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
    out.push({ value: t, label: t });
  }
  return out;
})();

export default function Checkout({ data, settings, onClose }) {
  const { items, subtotal, orang, setOrang, clear } = useCart();
  const areas = data.areas || [];
  const [step, setStep] = useState("form"); // form | pay | done
  const [form, setForm] = useState({ nama: "", telepon: "", instagram: "", areaId: areas[0]?.id || "dalam-kota", tanggal: "", jam: "", lokasi: "", catatan: "" });
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [booked, setBooked] = useState(null);

  const area = areas.find((a) => a.id === form.areaId) || areas[0] || { fee: 0, nama: "" };
  const total = subtotal * orang + (area.fee || 0);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const areaOptions = areas.map((a) => ({
    value: a.id,
    label: `${a.nama} ${a.fee > 0 ? `(+ ${formatRupiah(a.fee)})` : "(Gratis)"}`,
  }));

  const submit = async (e) => {
    e.preventDefault();
    if (!form.nama.trim() || !form.telepon.trim()) return setErr("Nama & No. WhatsApp wajib diisi.");
    if (!/^[0-9+]{9,15}$/.test(form.telepon.trim())) return setErr("Nomor WhatsApp tidak valid.");
    if (!form.tanggal) return setErr("Pilih tanggal.");
    if (!form.jam) return setErr("Pilih jam ready.");
    if (!form.lokasi.trim()) return setErr("Alamat wajib diisi.");
    setErr("");
    setBusy(true);
    let saved;
    try {
      saved = await saveCartBooking({
        nama: form.nama, telepon: form.telepon, instagram: form.instagram,
        items: items.map((i) => i.id), orang,
        areaId: form.areaId, tanggal: form.tanggal, jam: form.jam, lokasi: form.lokasi, catatan: form.catatan,
      });
    } catch {
      setBusy(false);
      return setErr("Gagal menyimpan booking. Coba lagi atau hubungi via WhatsApp.");
    }
    setBooked({
      ...form,
      instagram: form.instagram,
      itemsList: items.map((i) => i.nama),
      areaNama: area.nama,
      orang,
      total: saved?.total ?? total,
    });
    setBusy(false);
    setStep("pay");
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-ink/40 p-0 sm:items-center sm:p-4" onClick={onClose}>
      <div
        className="flex max-h-[92vh] w-full max-w-md flex-col overflow-hidden rounded-t-3xl bg-white sm:rounded-3xl"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-rose-line px-5 py-3">
          <h2 className="font-bold text-ink">{step === "pay" ? "Bayar DP" : step === "done" ? "Selesai" : "Checkout"}</h2>
          <button onClick={onClose} aria-label="Tutup" className="rounded-full p-1.5 text-muted hover:bg-rose-soft hover:text-rose">
            <X size={18} />
          </button>
        </div>

        <div className="overflow-y-auto p-4">
          {step === "form" && (
            <form onSubmit={submit} className="space-y-2.5">
              {/* Ringkasan pilihan — ringkas */}
              <div className="rounded-lg bg-rose-soft/60 px-3 py-2 text-xs text-ink">
                {items.map((i, idx) => (
                  <span key={i.id}>
                    {idx > 0 && <span className="text-muted"> · </span>}
                    {i.nama}
                  </span>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="label">Nama</label>
                  <input className="field" value={form.nama} onChange={(e) => set("nama", e.target.value)} placeholder="Nama kamu" />
                </div>
                <div>
                  <label className="label">No. WhatsApp</label>
                  <input className="field" inputMode="numeric" value={form.telepon} onChange={(e) => set("telepon", e.target.value)} placeholder="08xxxx" />
                </div>
              </div>

              <div className="grid grid-cols-2 items-end gap-2.5">
                <div>
                  <label className="label">Instagram</label>
                  <input className="field" value={form.instagram} onChange={(e) => set("instagram", e.target.value)} placeholder="@username" />
                </div>
                <div>
                  <label className="label">Jumlah orang</label>
                  <div className="flex items-center justify-between rounded-xl border border-rose-line px-2 py-1">
                    <button type="button" onClick={() => setOrang(Math.max(1, orang - 1))} className="flex h-8 w-8 items-center justify-center rounded-full text-rose hover:bg-rose-soft">
                      <Minus size={16} />
                    </button>
                    <span className="text-base font-bold text-ink">{orang}</span>
                    <button type="button" onClick={() => setOrang(Math.min(50, orang + 1))} className="flex h-8 w-8 items-center justify-center rounded-full text-rose hover:bg-rose-soft">
                      <Plus size={16} />
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="label">Tanggal</label>
                  <DatePicker value={form.tanggal} onChange={(v) => set("tanggal", v)} />
                </div>
                <div>
                  <label className="label">Jam ready</label>
                  <Select value={form.jam} onChange={(v) => set("jam", v)} options={timeOptions} placeholder="— Jam ready —" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="label">Area</label>
                  <Select value={form.areaId} onChange={(v) => set("areaId", v)} options={areaOptions} placeholder="Pilih area" />
                </div>
                <div>
                  <label className="label">Alamat</label>
                  <input className="field" value={form.lokasi} onChange={(e) => set("lokasi", e.target.value)} placeholder="Alamat lengkap" />
                </div>
              </div>

              <div>
                <label className="label">Catatan (opsional)</label>
                <input className="field" value={form.catatan} onChange={(e) => set("catatan", e.target.value)} placeholder="Referensi look, tema acara, dll." />
              </div>

              <div className="flex items-center justify-between rounded-xl bg-rose-soft px-4 py-3">
                <div>
                  <div className="text-xs text-muted">Total ({orang} orang{area.fee > 0 ? " + ongkir" : ""})</div>
                  <div className="text-xl font-bold text-rose">{formatRupiah(total)}</div>
                </div>
                <div className="text-right text-[11px] leading-tight text-muted">DP {settings.dpPercent || 50}%<br />kunci jadwal</div>
              </div>

              {err && <p className="text-sm text-rose">{err}</p>}
              <button type="submit" disabled={busy} className="btn-primary w-full disabled:opacity-60">
                {busy ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />} Book & lanjut bayar DP
              </button>
            </form>
          )}

          {step === "pay" && booked && (
            <PayStep booked={booked} settings={settings} onSent={() => setStep("done")} />
          )}

          {step === "done" && (
            <div className="py-6 text-center">
              <CheckCircle2 className="mx-auto text-rose" size={44} />
              <h3 className="mt-4 text-xl font-bold text-ink">Booking terkirim!</h3>
              <p className="mx-auto mt-2 max-w-xs text-sm text-muted">
                Kami sudah mengarahkanmu ke WhatsApp untuk konfirmasi. Kalau belum terbuka, hubungi kami langsung ya.
              </p>
              <button
                onClick={() => { clear(); onClose(); }}
                className="btn-outline mt-6"
              >
                Selesai
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function PayStep({ booked, settings, onSent }) {
  const dpAmount = Math.round((booked.total * (settings.dpPercent || 50)) / 100);
  const bank = settings.bank || {};
  const [proofUrl, setProofUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadErr, setUploadErr] = useState("");
  const [phase, setPhase] = useState("");
  const [pct, setPct] = useState(0);
  const [copied, setCopied] = useState("");
  const fileRef = useRef(null);

  const copy = async (label, text) => {
    try { await navigator.clipboard.writeText(text); setCopied(label); setTimeout(() => setCopied(""), 1500); } catch {}
  };

  const onPickProof = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true); setUploadErr(""); setPhase("compress"); setPct(0);
    try {
      const compressed = await compressImage(file);
      setPhase("upload");
      const url = await uploadProof(compressed, (p) => { setPct(p); if (p >= 100) setPhase("process"); });
      setProofUrl(url);
    } catch (e2) {
      setUploadErr(e2?.data?.error === "uploads_not_configured" ? "Upload belum aktif — kirim bukti via WhatsApp saja." : "Gagal upload. Kirim bukti via WhatsApp.");
    } finally {
      setUploading(false); setPhase(""); setPct(0);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const sendWa = () => {
    const b = booked;
    const pesan =
      `Halo ${site.brand}, saya mau booking:\n\n` +
      `Nama: ${b.nama}\n` +
      `No. HP: ${b.telepon}\n` +
      (b.instagram ? `Instagram: @${String(b.instagram).replace(/^@/, "")}\n` : ``) +
      `Layanan: ${b.itemsList.join(", ")}\n` +
      `Jumlah orang: ${b.orang}\n` +
      `Area: ${b.areaNama}\n` +
      `Tanggal: ${formatTanggal(b.tanggal)}\n` +
      `Jam ready: ${b.jam}\n` +
      (b.lokasi ? `Lokasi: ${b.lokasi}\n` : ``) +
      (b.catatan ? `Catatan: ${b.catatan}\n` : ``) +
      `\nTotal: ${formatRupiah(b.total)}\n` +
      `DP ${settings.dpPercent || 50}%: ${formatRupiah(dpAmount)}\n` +
      (proofUrl ? `\nBukti transfer: ${proofUrl}` : `\n(Bukti transfer menyusul)`);
    window.open(waLink(normalizeWa(settings.whatsapp || site.whatsapp), pesan), "_blank");
    onSent();
  };

  const Row = ({ label, value, copyKey }) => (
    <div className="flex items-center justify-between gap-3 border-b border-rose-line py-2.5 last:border-0">
      <div>
        <div className="text-xs text-muted">{label}</div>
        <div className="font-semibold text-ink">{value}</div>
      </div>
      {copyKey && (
        <button type="button" onClick={() => copy(copyKey, value)} className="inline-flex items-center gap-1 rounded-lg border border-rose-line px-2.5 py-1.5 text-xs font-medium text-rose hover:bg-rose-soft">
          {copied === copyKey ? <><Check size={13} /> Tersalin</> : <><Copy size={13} /> Salin</>}
        </button>
      )}
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="rounded-xl bg-rose-soft p-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs text-muted">DP {settings.dpPercent || 50}% dari {formatRupiah(booked.total)}</div>
            <div className="mt-0.5 text-2xl font-bold text-rose">{formatRupiah(dpAmount)}</div>
          </div>
          <button type="button" onClick={() => copy("dp", String(dpAmount))} className="inline-flex items-center gap-1 rounded-lg border border-rose-line bg-white px-3 py-2 text-xs font-medium text-rose hover:bg-rose-soft">
            {copied === "dp" ? <><Check size={14} /> Tersalin</> : <><Copy size={14} /> Salin</>}
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-rose-line p-4">
        {bank.number ? (
          <>
            <Row label="Bank" value={bank.name || "-"} />
            <Row label="No. Rekening" value={bank.number} copyKey="rek" />
            <Row label="Atas Nama" value={bank.holder || "-"} />
          </>
        ) : (
          <p className="text-sm text-muted">Nomor rekening belum diatur. Lanjut ke WhatsApp, admin kirim detail pembayaran.</p>
        )}
      </div>

      <div>
        <label className="label">Bukti transfer (opsional)</label>
        <input ref={fileRef} type="file" accept="image/*" hidden onChange={onPickProof} />
        {proofUrl ? (
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={proofUrl} alt="Bukti transfer" className="h-16 w-16 rounded-lg border border-rose-line object-cover" />
            <button type="button" onClick={() => fileRef.current?.click()} className="text-sm text-rose hover:underline">Ganti</button>
          </div>
        ) : (
          <div>
            <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading} className="inline-flex items-center gap-2 rounded-lg border border-rose-line px-4 py-2.5 text-sm font-medium text-ink hover:bg-rose-soft disabled:opacity-60">
              <Upload size={16} /> {uploading ? (phase === "compress" ? "Menyiapkan…" : phase === "process" ? "Memproses…" : `Mengupload… ${pct}%`) : "Upload bukti transfer"}
            </button>
            {uploading && (
              <div className="mt-2 h-1.5 w-full max-w-[260px] overflow-hidden rounded-full bg-rose-line">
                <div className="h-full rounded-full bg-rose transition-[width] duration-200" style={{ width: `${phase === "compress" ? 8 : phase === "process" ? 100 : pct}%` }} />
              </div>
            )}
          </div>
        )}
        {uploadErr && <p className="mt-1 text-xs text-rose">{uploadErr}</p>}
      </div>

      <button onClick={sendWa} className="btn-primary w-full">
        {proofUrl ? "Kirim booking + bukti ke WhatsApp" : "Lanjut ke WhatsApp"} <Send size={18} />
      </button>
    </div>
  );
}
