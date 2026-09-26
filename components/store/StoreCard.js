"use client";

import { Check, Plus } from "lucide-react";
import { formatRupiah } from "@/lib/utils";
import { useCart } from "./CartProvider";

// One service = one card (title, description, details, price, "Pilih" toggle).
export default function StoreCard({ item }) {
  const { pick, isSelected } = useCart();
  const selected = isSelected(item.id);
  const desc = item.deskripsi || item.ringkas || "";
  const details = String(item.detail || "")
    .split("\n")
    .map((s) => s.trim().replace(/^[-•]\s*/, ""))
    .filter(Boolean);

  return (
    <div
      className={`flex flex-col overflow-hidden rounded-2xl border bg-white transition ${
        selected ? "border-rose ring-2 ring-rose" : "border-rose-line hover:shadow-[0_12px_40px_-18px_rgba(107,44,62,0.3)]"
      }`}
    >
      {item.foto ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={item.foto} alt={item.nama} loading="lazy" className="aspect-[4/3] w-full object-cover" />
      ) : (
        <div className="foto-ph aspect-[4/3] text-xs">Foto {item.nama}</div>
      )}

      <div className="flex flex-1 flex-col p-3 sm:p-4">
        <h3 className="text-sm font-semibold leading-snug text-ink sm:text-base">{item.nama}</h3>
        {desc && <p className="mt-1 line-clamp-3 text-xs leading-relaxed text-muted sm:text-sm">{desc}</p>}

        {details.length > 0 && (
          <ul className="mt-2 space-y-1">
            {details.slice(0, 4).map((d, i) => (
              <li key={i} className="flex gap-1.5 text-[11px] leading-snug text-ink/70 sm:text-xs">
                <Check size={12} className="mt-0.5 shrink-0 text-rose" />
                <span>{d}</span>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-3 flex-1" />
        <div className="text-base font-bold text-rose sm:text-lg">{formatRupiah(item.base)}</div>
        <button
          onClick={() => pick(item)}
          className={`mt-2 inline-flex w-full items-center justify-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold transition ${
            selected ? "bg-rose-soft text-rose" : "bg-rose text-white hover:bg-rose-deep"
          }`}
        >
          {selected ? (
            <><Check size={16} /> Dipilih</>
          ) : (
            <><Plus size={16} /> Pilih</>
          )}
        </button>
      </div>
    </div>
  );
}
