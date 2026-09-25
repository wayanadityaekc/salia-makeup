"use client";

import { useRef, useState } from "react";
import { Upload } from "lucide-react";
import { uploadImage, UnauthorizedError } from "@/lib/storage";
import { compressImage } from "@/lib/image";

// Small upload button. Sends the file to the API (Cloudinary) and calls
// onUploaded(url) with the hosted URL.
export default function ImageUpload({ onUploaded, onUnauthorized, label = "Upload foto" }) {
  const ref = useRef(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const onChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    setErr("");
    try {
      const compressed = await compressImage(file);
      const url = await uploadImage(compressed);
      onUploaded(url);
    } catch (e2) {
      if (e2 instanceof UnauthorizedError) onUnauthorized?.();
      else setErr(e2?.data?.error === "uploads_not_configured" ? "Upload belum aktif (set Cloudinary di server)." : "Gagal upload foto.");
    } finally {
      setBusy(false);
      if (ref.current) ref.current.value = "";
    }
  };

  return (
    <div className="inline-flex items-center gap-2">
      <input ref={ref} type="file" accept="image/*" hidden onChange={onChange} />
      <button
        type="button"
        onClick={() => ref.current?.click()}
        disabled={busy}
        className="inline-flex items-center gap-1.5 rounded-lg border border-rose-line px-3 py-1.5 text-xs font-medium text-ink hover:bg-rose-soft disabled:opacity-60"
      >
        <Upload size={14} /> {busy ? "Mengupload…" : label}
      </button>
      {err && <span className="text-xs text-rose">{err}</span>}
    </div>
  );
}
