"use client";

import { useEffect, useRef, useState } from "react";
import { X, Loader2, Mail, ArrowLeft } from "lucide-react";
import { useUser } from "./UserProvider";
import useBodyLock from "@/lib/useBodyLock";

// Passwordless login: a 6-digit code is emailed, and the account is created on first verify.
export default function AuthModal({ onClose }) {
  const { requestCode, verifyCode } = useUser();
  // Step: email | code
  const [step, setStep] = useState("email");
  const [email, setEmail] = useState("");
  const [nama, setNama] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [note, setNote] = useState("");
  const codeRef = useRef(null);
  // Mounted only while open, so it locks for its whole life.
  useBodyLock(true);

  useEffect(() => {
    function onKey(e) { if (e.key === "Escape") onClose(); }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function send(e) {
    e?.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return setErr("Masukkan email yang valid.");
    setErr(""); setBusy(true);
    try {
      const result = await requestCode(email.trim());
      setNote(result?.delivered === false ? "Kode dibuat. (Pengiriman email belum aktif, hubungi admin.)" : `Kode dikirim ke ${email.trim()}. Cek inbox / spam.`);
      setStep("code");
      setTimeout(() => codeRef.current?.focus(), 50);
    } catch (e) {
      setErr("Gagal mengirim kode. Coba lagi.");
    } finally { setBusy(false); }
  }

  async function verify(e) {
    e?.preventDefault();
    if (!/^\d{6}$/.test(code.trim())) return setErr("Kode terdiri dari 6 angka.");
    setErr(""); setBusy(true);
    try {
      await verifyCode(email.trim(), code.trim(), nama.trim() || undefined);
      onClose();
    } catch (e) {
      setErr("Kode salah atau kedaluwarsa.");
    } finally { setBusy(false); }
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center bg-ink/50 p-0 sm:items-center sm:p-4" onClick={onClose}>
      <div
        className="w-full max-w-sm overflow-hidden rounded-t-3xl bg-white sm:rounded-3xl"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-rose-line px-5 py-3">
          <h2 className="flex items-center gap-2 font-bold text-ink">
            {step === "code" && (
              <button onClick={() => { setStep("email"); setErr(""); }} aria-label="Kembali" className="rounded-full p-0.5 text-muted hover:text-rose"><ArrowLeft size={18} /></button>
            )}
            {step === "email" ? "Masuk / Daftar" : "Masukkan kode"}
          </h2>
          <button onClick={onClose} aria-label="Tutup" className="rounded-full p-1.5 text-muted hover:bg-rose-soft hover:text-rose"><X size={18} /></button>
        </div>

        {step === "email" ? (
          <form onSubmit={send} className="space-y-3 p-5">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-rose-soft">
              <Mail className="text-rose" size={22} />
            </div>
            <p className="text-center text-sm text-muted">Masuk pakai email, kami kirim kode 6 angka tanpa password.</p>
            <div>
              <label className="label">Email</label>
              <input className="field" type="email" autoFocus value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@kamu.com" />
            </div>
            {err && <p className="text-sm text-rose">{err}</p>}
            <button type="submit" disabled={busy} className="btn-primary w-full justify-center disabled:opacity-60">
              {busy ? <Loader2 size={18} className="animate-spin" /> : <Mail size={18} />} Kirim kode
            </button>
          </form>
        ) : (
          <form onSubmit={verify} className="space-y-3 p-5">
            {note && <p className="rounded-lg bg-rose-soft/60 px-3 py-2 text-xs text-ink">{note}</p>}
            <div>
              <label className="label">Kode 6 angka</label>
              <input
                ref={codeRef}
                className="field text-center text-lg tracking-[0.4em]"
                inputMode="numeric"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="••••••"
              />
            </div>
            <div>
              <label className="label">Nama (untuk akun baru)</label>
              <input className="field" value={nama} onChange={(e) => setNama(e.target.value)} placeholder="Nama kamu (opsional)" />
            </div>
            {err && <p className="text-sm text-rose">{err}</p>}
            <button type="submit" disabled={busy} className="btn-primary w-full justify-center disabled:opacity-60">
              {busy ? <Loader2 size={18} className="animate-spin" /> : null} Masuk
            </button>
            <p className="text-center text-sm text-muted">
              Tidak menerima kode?{" "}
              <button type="button" onClick={send} className="font-semibold text-rose hover:underline">Kirim ulang</button>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
