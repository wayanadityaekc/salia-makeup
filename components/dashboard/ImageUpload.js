"use client";

import { useRef, useState } from "react";
import { Upload } from "lucide-react";
import { uploadImage, UnauthorizedError } from "@/lib/storage";
import { compressImage } from "@/lib/image";

// Upload button with a real progress bar. Phases: compressing → uploading (%) →
// processing (server/Cloudinary) → done.
export default function ImageUpload({ onUploaded, onUnauthorized, label = "Upload foto" }) {
  const ref = useRef(null);
  const [busy, setBusy] = useState(false);
  const [phase, setPhase] = useState(""); // "compress" | "upload" | "process"
  const [pct, setPct] = useState(0);
  const [err, setErr] = useState("");

  const onChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    setErr("");
    setPhase("compress");
    setPct(0);
    try {
      const compressed = await compressImage(file);
      setPhase("upload");
      const url = await uploadImage(compressed, (p) => {
        setPct(p);
        if (p >= 100) setPhase("process");
      });
      onUploaded(url);
    } catch (e2) {
      if (e2 instanceof UnauthorizedError) onUnauthorized?.();
      else setErr(e2?.data?.error === "uploads_not_configured" ? "Upload belum aktif (set Cloudinary di server)." : "Gagal upload foto.");
    } finally {
      setBusy(false);
      setPhase("");
      setPct(0);
      if (ref.current) ref.current.value = "";
    }
  };

  const phaseLabel = phase === "compress" ? "Menyiapkan foto…" : phase === "process" ? "Memproses…" : `Mengupload… ${pct}%`;
  const barPct = phase === "compress" ? 8 : phase === "process" ? 100 : pct;

  return (
    <div>
      <input ref={ref} type="file" accept="image/*" hidden onChange={onChange} />
      <button
        type="button"
        onClick={() => ref.current?.click()}
        disabled={busy}
        className="inline-flex items-center gap-1.5 rounded-lg border border-rose-line px-3 py-1.5 text-xs font-medium text-ink hover:bg-rose-soft disabled:opacity-60"
      >
        <Upload size={14} /> {busy ? phaseLabel : label}
      </button>
      {busy && (
        <div className="mt-2 h-1.5 w-full max-w-[220px] overflow-hidden rounded-full bg-rose-line">
          <div className="h-full rounded-full bg-rose transition-[width] duration-200" style={{ width: `${barPct}%` }} />
        </div>
      )}
      {err && <p className="mt-1 text-xs text-rose">{err}</p>}
    </div>
  );
}
