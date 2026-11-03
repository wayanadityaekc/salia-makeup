'use client';

import { useRef, useState } from 'react';
import { Upload } from 'lucide-react';
import { uploadImage, UnauthorizedError } from '@/lib/storage';
import { compressImage } from '@/lib/image';

export default function ImageUpload({ onUploaded, onUnauthorized, label = 'Upload foto' }) {
  const ref = useRef(null);
  const [busy, setBusy] = useState(false);
  const [phase, setPhase] = useState('');
  const [uploadPercent, setUploadPercent] = useState(0);
  const [error, setError] = useState('');

  async function handleFileChange(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    setBusy(true);
    setError('');
    setPhase('compress');
    setUploadPercent(0);
    try {
      const compressed = await compressImage(file);
      setPhase('upload');
      const url = await uploadImage(compressed, (percent) => {
        setUploadPercent(percent);
        if (percent >= 100) setPhase('process');
      });
      onUploaded(url);
    } catch (e) {
      if (e instanceof UnauthorizedError) onUnauthorized?.();
      else
        setError(
          e?.data?.error === 'uploads_not_configured'
            ? 'Upload belum aktif (set Cloudinary di server).'
            : 'Gagal upload foto.',
        );
    } finally {
      setBusy(false);
      setPhase('');
      setUploadPercent(0);
      if (ref.current) ref.current.value = '';
    }
  }

  const phaseLabel =
    phase === 'compress' ? 'Menyiapkan foto…' : phase === 'process' ? 'Memproses…' : `Mengupload… ${uploadPercent}%`;
  const barPct = phase === 'compress' ? 8 : phase === 'process' ? 100 : uploadPercent;

  return (
    <div>
      <input ref={ref} type="file" accept="image/*" hidden onChange={handleFileChange} />
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
          <div
            className="h-full rounded-full bg-rose transition-[width] duration-200"
            style={{ width: `${barPct}%` }}
          />
        </div>
      )}
      {error && <p className="mt-1 text-xs text-rose">{error}</p>}
    </div>
  );
}
