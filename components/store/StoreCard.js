"use client";

import { useEffect, useState } from "react";
import { Check, Plus, X } from "lucide-react";
import { formatRupiah } from "@/lib/utils";
import { useCart } from "./CartProvider";

// One service = one card. Clicking the card opens a detail popup (photo,
// description, details, price) with the Pilih button.
export default function StoreCard({ item, big = false }) {
  const { pick, isSelected } = useCart();
  const [open, setOpen] = useState(false);
  const selected = isSelected(item.id);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const desc = item.deskripsi || item.ringkas || "";
  const details = String(item.detail || "")
    .split("\n")
    .map((s) => s.trim().replace(/^[-•]\s*/, ""))
    .filter(Boolean);

  return (
    <>
      {/* Card */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`group relative flex w-full flex-col overflow-hidden rounded-2xl border bg-white text-left transition ${
          selected ? "border-rose ring-2 ring-rose" : "border-rose-line hover:shadow-[0_12px_40px_-18px_rgba(107,44,62,0.3)]"
        }`}
      >
        {selected && (
          <span className="absolute right-2 top-2 z-10 inline-flex items-center gap-1 rounded-full bg-rose px-2 py-1 text-[11px] font-semibold text-white">
            <Check size={12} /> Dipilih
          </span>
        )}
        {item.foto ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={item.foto} alt={item.nama} loading="lazy" className={`w-full object-cover ${big ? "aspect-square" : "aspect-[4/3]"}`} />
        ) : (
          <div className={`foto-ph ${big ? "aspect-square text-sm" : "aspect-[4/3] text-xs"}`}>Foto {item.nama}</div>
        )}
        <div className={`flex flex-1 flex-col ${big ? "p-4 sm:p-5" : "p-3 sm:p-4"}`}>
          <h3 className={`font-semibold leading-snug text-ink ${big ? "text-base sm:text-lg" : "text-sm sm:text-base"}`}>{item.nama}</h3>
          {desc && <p className={`mt-1 leading-relaxed text-muted ${big ? "text-sm" : "line-clamp-2 text-xs sm:text-sm"}`}>{desc}</p>}
          <div className="mt-3 flex-1" />
          <div className={`font-bold text-rose ${big ? "text-xl" : "text-base sm:text-lg"}`}>{formatRupiah(item.base)}</div>
          <span className={`mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-full bg-rose-soft font-semibold text-rose ${big ? "px-4 py-2.5 text-sm" : "px-4 py-2 text-sm"}`}>
            Lihat detail
          </span>
        </div>
      </button>

      {/* Detail popup */}
      {open && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center bg-ink/50 p-0 sm:items-center sm:p-4" onClick={() => setOpen(false)}>
          <div
            className="flex max-h-[92vh] w-full max-w-md flex-col overflow-hidden rounded-t-3xl bg-white sm:rounded-3xl"
            style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative">
              {item.foto ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={item.foto} alt={item.nama} className="aspect-[4/3] w-full object-cover" />
              ) : (
                <div className="foto-ph aspect-[4/3] text-sm">Foto {item.nama}</div>
              )}
              <button
                onClick={() => setOpen(false)}
                aria-label="Tutup"
                className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-ink shadow hover:bg-white"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5">
              <div className="flex items-start justify-between gap-3">
                <h3 className="text-lg font-bold text-ink">{item.nama}</h3>
                <div className="shrink-0 text-lg font-bold text-rose">{formatRupiah(item.base)}</div>
              </div>
              {desc && <p className="mt-2 text-sm leading-relaxed text-muted">{desc}</p>}
              {details.length > 0 && (
                <ul className="mt-4 space-y-2">
                  {details.map((d, i) => (
                    <li key={i} className="flex gap-2 text-sm leading-snug text-ink/80">
                      <Check size={15} className="mt-0.5 shrink-0 text-rose" />
                      <span>{d}</span>
                    </li>
                  ))}
                </ul>
              )}
              {item.info && (
                <div className="mt-4 border-t border-rose-line pt-4">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-rose">Detail produk</h4>
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-ink/80">{item.info}</p>
                </div>
              )}
            </div>

            <div className="border-t border-rose-line p-4">
              <button
                onClick={() => { pick(item); setOpen(false); }}
                className={`inline-flex w-full items-center justify-center gap-2 rounded-full px-4 py-3 text-sm font-semibold transition ${
                  selected ? "bg-rose-soft text-rose" : "bg-rose text-white hover:bg-rose-deep"
                }`}
              >
                {selected ? (<><Check size={18} /> Batalkan pilihan</>) : (<><Plus size={18} /> Pilih layanan ini</>)}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
