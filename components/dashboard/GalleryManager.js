"use client";

import { useEffect, useState } from "react";
import { Trash2 } from "lucide-react";
import {
  getGallery,
  createGalleryItem,
  deleteGalleryItem,
  UnauthorizedError,
} from "@/lib/storage";
import ImageUpload from "./ImageUpload";

export default function GalleryManager({ onUnauthorized }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const guard = (e) => {
    if (e instanceof UnauthorizedError) onUnauthorized?.();
    else setErr("Terjadi kesalahan. Coba lagi.");
  };

  const refresh = async () => {
    setLoading(true);
    setErr("");
    try {
      setItems(await getGallery());
    } catch (e) {
      guard(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onUploaded = async (url) => {
    try {
      await createGalleryItem({ url });
      refresh();
    } catch (e) {
      guard(e);
    }
  };

  const remove = async (id) => {
    if (!confirm("Hapus foto ini?")) return;
    try {
      await deleteGalleryItem(id);
      refresh();
    } catch (e) {
      guard(e);
    }
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted">Foto yang tampil di halaman Galeri & Nail Art.</p>
        <ImageUpload onUploaded={onUploaded} onUnauthorized={onUnauthorized} label="Tambah foto" />
      </div>

      {err && <p className="mt-3 text-sm text-rose">{err}</p>}

      {items.length === 0 && !loading ? (
        <div className="mt-6 rounded-2xl border border-dashed border-rose-line bg-white py-16 text-center text-sm text-muted">
          Belum ada foto. Klik “Tambah foto”.
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {items.map((g) => (
            <div key={g.id} className="group relative overflow-hidden rounded-xl border border-rose-line">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={g.url} alt={g.caption || "Foto"} className="aspect-square w-full object-cover" />
              <button
                onClick={() => remove(g.id)}
                className="absolute right-2 top-2 inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-rose shadow hover:bg-white"
                aria-label="Hapus foto"
              >
                <Trash2 size={15} />
              </button>
            </div>
          ))}
        </div>
      )}
      {loading && <p className="mt-4 text-sm text-muted">Memuat…</p>}
    </div>
  );
}
