"use client";

import { useEffect, useState } from "react";
import { X, Loader2 } from "lucide-react";
import { useUser } from "./UserProvider";

// Login / register popup. Register needs a name + password + at least one of
// email / WhatsApp. Login accepts either email or WhatsApp as the identifier.
export default function AuthModal({ onClose }) {
  const { login, register } = useUser();
  const [mode, setMode] = useState("login"); // login | register
  const [form, setForm] = useState({ nama: "", identifier: "", email: "", telepon: "", password: "" });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const submit = async (e) => {
    e.preventDefault();
    setErr("");
    setBusy(true);
    try {
      if (mode === "login") {
        if (!form.identifier.trim() || !form.password) throw new Error("isi");
        await login(form.identifier.trim(), form.password);
      } else {
        if (!form.nama.trim()) throw new Error("Nama wajib diisi.");
        if (!form.email.trim() && !form.telepon.trim()) throw new Error("Isi email atau No. WhatsApp.");
        if (form.password.length < 6) throw new Error("Password minimal 6 karakter.");
        await register({ nama: form.nama, email: form.email || null, telepon: form.telepon || null, password: form.password });
      }
      onClose();
    } catch (e2) {
      const code = e2?.message;
      setErr(
        code === "account_exists" ? "Email / No. WhatsApp sudah terdaftar."
          : code === "wrong_credentials" ? "Email/No. WA atau password salah."
          : code && code.length < 60 && !/^request_failed/.test(code) ? code
          : "Gagal. Coba lagi."
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center bg-ink/50 p-0 sm:items-center sm:p-4" onClick={onClose}>
      <div
        className="w-full max-w-sm overflow-hidden rounded-t-3xl bg-white sm:rounded-3xl"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-rose-line px-5 py-3">
          <h2 className="font-bold text-ink">{mode === "login" ? "Masuk" : "Daftar akun"}</h2>
          <button onClick={onClose} aria-label="Tutup" className="rounded-full p-1.5 text-muted hover:bg-rose-soft hover:text-rose">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={submit} className="space-y-3 p-5">
          {mode === "register" && (
            <>
              <div>
                <label className="label">Nama</label>
                <input className="field" value={form.nama} onChange={(e) => set("nama", e.target.value)} placeholder="Nama kamu" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Email</label>
                  <input className="field" type="email" value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="opsional" />
                </div>
                <div>
                  <label className="label">No. WhatsApp</label>
                  <input className="field" inputMode="numeric" value={form.telepon} onChange={(e) => set("telepon", e.target.value)} placeholder="opsional" />
                </div>
              </div>
              <p className="text-xs text-muted">Isi salah satu: email atau No. WhatsApp.</p>
            </>
          )}

          {mode === "login" && (
            <div>
              <label className="label">Email atau No. WhatsApp</label>
              <input className="field" value={form.identifier} onChange={(e) => set("identifier", e.target.value)} placeholder="email / 08xxxx" />
            </div>
          )}

          <div>
            <label className="label">Password</label>
            <input className="field" type="password" value={form.password} onChange={(e) => set("password", e.target.value)} placeholder="Password" />
          </div>

          {err && <p className="text-sm text-rose">{err}</p>}

          <button type="submit" disabled={busy} className="btn-primary w-full disabled:opacity-60">
            {busy ? <Loader2 size={18} className="animate-spin" /> : null} {mode === "login" ? "Masuk" : "Daftar"}
          </button>

          <p className="text-center text-sm text-muted">
            {mode === "login" ? "Belum punya akun? " : "Sudah punya akun? "}
            <button type="button" onClick={() => { setMode(mode === "login" ? "register" : "login"); setErr(""); }} className="font-semibold text-rose hover:underline">
              {mode === "login" ? "Daftar" : "Masuk"}
            </button>
          </p>
        </form>
      </div>
    </div>
  );
}
