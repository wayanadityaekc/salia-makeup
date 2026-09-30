"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Lock, ShieldCheck, CalendarCheck, MessageCircle, Send, Copy, Check, Upload,
  Loader2, CheckCircle2, Minus, Plus, Download, ArrowLeft, Clock,
} from "lucide-react";
import Select from "@/components/ui/Select";
import { site } from "@/lib/config";
import { formatRupiah, formatTanggal, waLink, normalizeWa } from "@/lib/utils";
import {
  getBookingToken, saveCartBooking, uploadProof, uploadReceipt,
  sendReceiptToChat, emailReceipt,
} from "@/lib/storage";
import { compressImage } from "@/lib/image";
import { makeReceiptPdf } from "@/lib/receipt";
import { CART_KEY } from "@/components/store/CartProvider";
import { chatCidFor } from "@/lib/chat";
import { useUser } from "@/components/auth/UserProvider";

const timeOptions = (() => {
  const out = [];
  for (let h = 6; h <= 21; h++) for (const m of [0, 30]) {
    const t = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
    out.push({ value: t, label: t });
  }
  return out;
})();

export default function BookingPage({ settings }) {
  const search = useSearchParams();
  const token = search.get("token") || "";
  const { user } = useUser();

  const [cart, setCart] = useState({ items: [], orang: 1 });
  const [tok, setTok] = useState({ status: "checking" }); // checking|valid|invalid
  const [step, setStep] = useState("form"); // form|done
  const [doneReceipt, setDoneReceipt] = useState(null);

  // Read the persisted cart (client only).
  useEffect(() => {
    try {
      const v = JSON.parse(localStorage.getItem(CART_KEY) || "{}");
      const items = [v?.sel?.makeup, v?.sel?.hairdo, v?.sel?.nail].filter(Boolean);
      setCart({ items, orang: v?.orang || 1 });
    } catch {}
  }, []);

  // Validate the magic-link token (the whole form is locked without one).
  useEffect(() => {
    let alive = true;
    if (!token) { setTok({ status: "invalid", reason: "missing" }); return; }
    getBookingToken(token).then((r) => {
      if (!alive) return;
      setTok(r?.valid ? { status: "valid", tanggal: r.tanggal } : { status: "invalid", reason: r?.reason || "invalid" });
    });
    return () => { alive = false; };
  }, [token]);

  const areas = settings?.areas || [];
  const subtotal = cart.items.reduce((a, b) => a + (b.base || 0), 0);

  if (step === "done") {
    return <DonePanel receipt={doneReceipt} user={user} />;
  }

  return (
    <div className="container-x py-8 sm:py-12">
      <div className="mx-auto max-w-lg">
        <Link href="/" className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted hover:text-rose">
          <ArrowLeft size={16} /> Kembali
        </Link>
        <h1 className="text-2xl font-bold text-ink">Booking</h1>

        {cart.items.length === 0 ? (
          <div className="mt-6 rounded-2xl border border-dashed border-rose-line bg-white p-8 text-center">
            <p className="text-sm text-muted">Belum ada layanan dipilih.</p>
            <Link href="/#pilih" className="btn-primary mt-4 inline-flex">Pilih layanan</Link>
          </div>
        ) : (
          <>
            {/* Selected items summary */}
            <div className="mt-5 rounded-2xl border border-rose-line bg-white p-5">
              <div className="text-xs font-semibold uppercase tracking-wider text-rose">Layanan dipilih</div>
              <ul className="mt-3 space-y-2">
                {cart.items.map((i) => (
                  <li key={i.id} className="flex items-center justify-between text-sm">
                    <span className="text-ink">{i.nama}</span>
                    <span className="font-semibold text-ink">{formatRupiah(i.base)}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-3 flex items-center justify-between border-t border-rose-line pt-3 text-sm">
                <span className="text-muted">Perkiraan / orang</span>
                <span className="font-bold text-rose">{formatRupiah(subtotal)}</span>
              </div>
              <p className="mt-1 text-[11px] text-muted">Total final dihitung otomatis (× jumlah orang + ongkir) di langkah berikutnya.</p>
            </div>

            {tok.status === "valid" ? (
              <UnlockedForm
                cart={cart}
                areas={areas}
                settings={settings}
                token={token}
                tanggal={tok.tanggal}
                user={user}
                onDone={(r) => { setDoneReceipt(r); setStep("done"); }}
              />
            ) : (
              <LockedPanel status={tok.status} reason={tok.reason} cart={cart} settings={settings} />
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ---- Locked: no valid token -> check availability via WhatsApp ---------------
function LockedPanel({ status, reason, cart, settings }) {
  const wa = normalizeWa(settings?.whatsapp || site.whatsapp);
  const list = cart.items.map((i) => `- ${i.nama}`).join("\n");
  const msg =
    `Halo ${site.brand}, saya mau cek ketersediaan tanggal untuk booking:\n${list}\n` +
    `Jumlah orang: ${cart.orang}\n\nTanggal yang saya inginkan: ____\nMohon info ketersediaannya ya 🙏`;
  const href = waLink(wa, msg);

  const expired = reason === "expired";
  const used = reason === "used";

  return (
    <div className="relative mt-5">
      {/* The form, shown locked behind a frosted overlay. */}
      <div aria-hidden className="pointer-events-none select-none rounded-2xl border border-rose-line bg-white p-5 opacity-40 blur-[1px]">
        <div className="grid grid-cols-2 gap-3">
          {["Nama", "No. WhatsApp", "Email", "Jumlah orang", "Tanggal", "Jam ready"].map((l) => (
            <div key={l}>
              <div className="mb-1 text-xs text-muted">{l}</div>
              <div className="h-9 rounded-xl border border-rose-line bg-rose-soft/40" />
            </div>
          ))}
        </div>
        <div className="mt-3 h-20 rounded-xl border border-rose-line bg-rose-soft/40" />
      </div>

      {/* Overlay */}
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="w-full max-w-sm rounded-2xl border border-rose-line bg-white p-6 text-center shadow-lg">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-rose-soft">
            <Lock className="text-rose" size={22} />
          </div>
          <h2 className="mt-4 text-lg font-bold text-ink">
            {expired ? "Link sudah kedaluwarsa" : used ? "Link sudah dipakai" : "Cek ketersediaan dulu"}
          </h2>
          <p className="mt-2 text-sm text-muted">
            {expired
              ? "Link booking ini sudah lewat masa berlakunya. Chat admin lagi untuk link baru."
              : used
              ? "Link booking ini sudah dipakai. Kalau perlu booking lagi, chat admin untuk link baru."
              : "Booking dibuka setelah admin konfirmasi tanggalnya available. Chat admin untuk cek, nanti kamu dikirim link untuk lanjut booking."}
          </p>
          <a href={href} target="_blank" rel="noopener noreferrer" className="btn-primary mt-5 w-full justify-center">
            <MessageCircle size={18} /> Cek ketersediaan via WhatsApp
          </a>
          <p className="mt-3 text-[11px] text-muted">Tanpa biaya. Admin balas dengan tanggal yang tersedia + link booking.</p>
        </div>
      </div>
    </div>
  );
}

// ---- Unlocked: valid token -> real form + payment ---------------------------
function UnlockedForm({ cart, areas, settings, token, tanggal, user, onDone }) {
  const [form, setForm] = useState({
    nama: "", telepon: "", email: "", instagram: "",
    areaId: areas[0]?.id || "dalam-kota", jam: "", lokasi: "", catatan: "",
  });
  const [orang, setOrang] = useState(cart.orang || 1);
  const [proofUrl, setProofUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadErr, setUploadErr] = useState("");
  const [pct, setPct] = useState(0);
  const [copied, setCopied] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const fileRef = useRef(null);

  useEffect(() => {
    if (user) setForm((f) => ({ ...f, nama: f.nama || user.nama || "", email: f.email || user.email || "", telepon: f.telepon || user.telepon || "" }));
  }, [user]);

  const area = areas.find((a) => a.id === form.areaId) || areas[0] || { fee: 0, nama: "" };
  const subtotal = cart.items.reduce((a, b) => a + (b.base || 0), 0);
  const total = subtotal * orang + (area.fee || 0);
  const dpPercent = settings?.dpPercent || 50;
  const dp = Math.round((total * dpPercent) / 100);
  const bank = settings?.bank || {};
  function set(k, v) { setForm((f) => ({ ...f, [k]: v })); }
  const areaOptions = areas.map((a) => ({ value: a.id, label: `${a.nama} ${a.fee > 0 ? `(+ ${formatRupiah(a.fee)})` : "(Gratis)"}` }));

  async function copy(key, text) { try { await navigator.clipboard.writeText(text); setCopied(key); setTimeout(() => setCopied(""), 1500); } catch {} }

  async function onPickProof(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true); setUploadErr(""); setPct(0);
    try {
      const compressed = await compressImage(file);
      const url = await uploadProof(compressed, (p) => setPct(p));
      setProofUrl(url);
    } catch (e2) {
      setUploadErr(e2?.data?.error === "uploads_not_configured" ? "Upload belum aktif, kirim bukti via WhatsApp saja." : "Gagal upload. Coba lagi / kirim via WhatsApp.");
    } finally { setUploading(false); setPct(0); if (fileRef.current) fileRef.current.value = ""; }
  }

  async function submit(e) {
    e.preventDefault();
    if (!form.nama.trim() || !form.telepon.trim()) return setErr("Nama & No. WhatsApp wajib diisi.");
    if (!/^[0-9+]{9,15}$/.test(form.telepon.trim())) return setErr("Nomor WhatsApp tidak valid.");
    if (!form.jam) return setErr("Pilih jam ready.");
    if (!form.lokasi.trim()) return setErr("Alamat wajib diisi.");
    setErr(""); setBusy(true);
    let saved;
    try {
      saved = await saveCartBooking({
        nama: form.nama, telepon: form.telepon, instagram: form.instagram, email: form.email,
        items: cart.items.map((i) => i.id), orang,
        areaId: form.areaId, jam: form.jam, lokasi: form.lokasi, catatan: form.catatan,
        token, proofUrl,
      });
    } catch (e2) {
      setBusy(false);
      return setErr(e2?.data?.error === "invalid_token" ? "Link booking sudah tidak berlaku. Chat admin untuk link baru." : "Gagal menyimpan booking. Coba lagi atau chat admin.");
    }
    // Best-effort receipt: PDF -> chat (+ email if logged in). Never blocks done.
    const ref = saved?.id ? `SALIA-${saved.id}` : "";
    let receipt = null;
    try {
      const pdf = await makeReceiptPdf({
        ref, nama: form.nama, telepon: form.telepon,
        items: cart.items.map((i) => ({ nama: i.nama, base: i.base })), orang,
        areaNama: area.nama, areaFee: area.fee || 0, tanggal, jam: form.jam,
        total: saved?.total ?? total, dpPercent, brand: site.brand,
      });
      receipt = { blob: pdf.blob, filename: pdf.filename };
      const cid = chatCidFor(user);
      const file = new File([pdf.blob], pdf.filename, { type: "application/pdf" });
      let url = ""; try { url = await uploadReceipt(file); } catch {}
      if (url) await sendReceiptToChat(cid, { nama: form.nama, telepon: form.telepon, ref, url }).catch(() => {});
      if (user) await emailReceipt({ ref, filename: pdf.filename, pdfBase64: pdf.base64 }).catch(() => {});
    } catch {}
    setBusy(false);
    onDone(receipt);
  }

  function Row({ label, value, copyKey }) {
    return (
      <div className="flex items-center justify-between gap-3 border-b border-rose-line py-2.5 last:border-0">
        <div><div className="text-xs text-muted">{label}</div><div className="font-semibold text-ink">{value}</div></div>
        {copyKey && (
          <button type="button" onClick={() => copy(copyKey, value)} className="inline-flex items-center gap-1 rounded-lg border border-rose-line px-2.5 py-1.5 text-xs font-medium text-rose hover:bg-rose-soft">
            {copied === copyKey ? <><Check size={13} /> Tersalin</> : <><Copy size={13} /> Salin</>}
          </button>
        )}
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="mt-5 space-y-4">
      {/* Approved date banner */}
      <div className="flex items-center gap-3 rounded-2xl border border-green-200 bg-green-50 p-4">
        <CalendarCheck className="shrink-0 text-green-600" size={20} />
        <div className="text-sm">
          <div className="font-semibold text-ink">Tanggal tersedia & terkunci</div>
          <div className="text-muted">{formatTanggal(tanggal)}</div>
        </div>
      </div>

      <div className="rounded-2xl border border-rose-line bg-white p-5 space-y-3">
        <div className="grid grid-cols-2 gap-2.5">
          <div><label className="label">Nama</label><input className="field" value={form.nama} onChange={(e) => set("nama", e.target.value)} placeholder="Nama kamu" /></div>
          <div><label className="label">No. WhatsApp</label><input className="field" inputMode="numeric" value={form.telepon} onChange={(e) => set("telepon", e.target.value)} placeholder="08xxxx" /></div>
        </div>
        <div className="grid grid-cols-2 gap-2.5">
          <div><label className="label">Email {user ? "" : "(opsional)"}</label><input className="field" type="email" value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="email@kamu.com" /></div>
          <div><label className="label">Instagram</label><input className="field" value={form.instagram} onChange={(e) => set("instagram", e.target.value)} placeholder="@username" /></div>
        </div>
        <div className="grid grid-cols-2 items-end gap-2.5">
          <div>
            <label className="label">Jumlah orang</label>
            <div className="flex items-center justify-between rounded-xl border border-rose-line px-2 py-1">
              <button type="button" onClick={() => setOrang(Math.max(1, orang - 1))} className="flex h-8 w-8 items-center justify-center rounded-full text-rose hover:bg-rose-soft"><Minus size={16} /></button>
              <span className="text-base font-bold text-ink">{orang}</span>
              <button type="button" onClick={() => setOrang(Math.min(50, orang + 1))} className="flex h-8 w-8 items-center justify-center rounded-full text-rose hover:bg-rose-soft"><Plus size={16} /></button>
            </div>
          </div>
          <div><label className="label">Jam ready</label><Select value={form.jam} onChange={(v) => set("jam", v)} options={timeOptions} placeholder="Pilih jam ready" /></div>
        </div>
        <div><label className="label">Area</label><Select value={form.areaId} onChange={(v) => set("areaId", v)} options={areaOptions} placeholder="Pilih area" /></div>
        <div><label className="label">Alamat lengkap</label><textarea rows={3} className="field resize-none" value={form.lokasi} onChange={(e) => set("lokasi", e.target.value)} placeholder="Nama jalan, no. rumah, patokan, kecamatan…" /></div>
        <div><label className="label">Catatan (opsional)</label><input className="field" value={form.catatan} onChange={(e) => set("catatan", e.target.value)} placeholder="Referensi look, tema acara, dll." /></div>
      </div>

      {/* Total + DP */}
      <div className="flex items-center justify-between rounded-xl bg-rose-soft px-4 py-3">
        <div><div className="text-xs text-muted">Total ({orang} orang{area.fee > 0 ? " + ongkir" : ""})</div><div className="text-xl font-bold text-rose">{formatRupiah(total)}</div></div>
        <div className="text-right text-[11px] leading-tight text-muted">DP {dpPercent}%<br />{formatRupiah(dp)}</div>
      </div>

      {/* Payment */}
      <div className="rounded-2xl border border-rose-line bg-white p-5">
        <div className="text-xs font-semibold uppercase tracking-wider text-rose">Bayar DP untuk kunci jadwal</div>
        <div className="mt-3 rounded-xl border border-rose-line p-4">
          {bank.number ? (
            <><Row label="Bank" value={bank.name || "-"} /><Row label="No. Rekening" value={bank.number} copyKey="rek" /><Row label="Atas Nama" value={bank.holder || "-"} /><Row label={`DP ${dpPercent}%`} value={formatRupiah(dp)} copyKey="dp" /></>
          ) : (
            <p className="text-sm text-muted">Nomor rekening belum diatur. Chat admin untuk detail pembayaran.</p>
          )}
        </div>
        <div className="mt-3">
          <label className="label">Bukti transfer</label>
          <input ref={fileRef} type="file" accept="image/*" hidden onChange={onPickProof} />
          {proofUrl ? (
            <div className="flex items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={proofUrl} alt="Bukti transfer" className="h-16 w-16 rounded-lg border border-rose-line object-cover" />
              <button type="button" onClick={() => fileRef.current?.click()} className="text-sm text-rose hover:underline">Ganti</button>
            </div>
          ) : (
            <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading} className="inline-flex items-center gap-2 rounded-lg border border-rose-line px-4 py-2.5 text-sm font-medium text-ink hover:bg-rose-soft disabled:opacity-60">
              <Upload size={16} /> {uploading ? `Mengupload… ${pct}%` : "Upload bukti transfer"}
            </button>
          )}
          {uploadErr && <p className="mt-1 text-xs text-rose">{uploadErr}</p>}
        </div>
      </div>

      {err && <p className="text-sm text-rose">{err}</p>}
      <button type="submit" disabled={busy} className="btn-primary w-full justify-center disabled:opacity-60">
        {busy ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />} Kirim booking
      </button>
      <p className="flex items-center justify-center gap-1.5 text-center text-[11px] text-muted">
        <ShieldCheck size={13} /> Booking diproses setelah admin cek bukti transfer.
      </p>
    </form>
  );
}

// ---- Done -------------------------------------------------------------------
function DonePanel({ receipt, user }) {
  function download() {
    if (!receipt) return;
    const url = URL.createObjectURL(receipt.blob);
    const a = document.createElement("a");
    a.href = url; a.download = receipt.filename; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
  }
  return (
    <div className="container-x py-16">
      <div className="mx-auto max-w-md rounded-2xl border border-rose-line bg-white p-8 text-center">
        <CheckCircle2 className="mx-auto text-rose" size={44} />
        <h1 className="mt-4 text-xl font-bold text-ink">Terima kasih! 🎉</h1>
        <p className="mx-auto mt-2 max-w-xs text-sm text-muted">
          Booking kamu tercatat & sedang diproses admin. Struk sudah dikirim ke <b>chat</b>{user ? " & email kamu" : ""}.
          Setelah dikonfirmasi, kamu bisa download struk final dari beranda.
        </p>
        <div className="mt-6 flex flex-col gap-2">
          <button onClick={download} disabled={!receipt} className="btn-primary w-full justify-center disabled:opacity-60"><Download size={18} /> Download struk</button>
          <Link href="/" className="btn-outline w-full justify-center">Kembali ke beranda</Link>
        </div>
      </div>
    </div>
  );
}
