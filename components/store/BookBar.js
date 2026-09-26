"use client";

import { useState } from "react";
import { X, ShoppingBag, ArrowRight } from "lucide-react";
import { formatRupiah } from "@/lib/utils";
import { useCart } from "./CartProvider";
import Checkout from "./Checkout";

// Sticky bottom bar that appears once something is picked. Shows the selected
// items + running subtotal and a Book button that opens the checkout.
export default function BookBar({ data, settings }) {
  const { items, subtotal, remove } = useCart();
  const [open, setOpen] = useState(false);
  if (items.length === 0) return null;

  return (
    <>
      <div
        className="fixed inset-x-0 bottom-0 z-40 border-t-2 border-rose-deep bg-rose text-white shadow-[0_-10px_30px_-8px_rgba(107,44,62,0.5)]"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className="container-x flex items-center gap-2.5 py-3 pr-[62px] sm:gap-3 sm:pr-24">
          <div className="relative shrink-0">
            <ShoppingBag size={22} />
            <span className="absolute -right-2 -top-2 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-white px-1 text-[11px] font-bold text-rose">
              {items.length}
            </span>
          </div>
          {/* Desktop: chips. Mobile: a compact "N item dipilih" + spacer. */}
          <div className="hidden min-w-0 flex-1 flex-wrap gap-1.5 sm:flex">
            {items.map((i) => (
              <span key={i.id} className="inline-flex items-center gap-1 rounded-full bg-white/20 px-2.5 py-1 text-xs font-semibold text-white">
                {i.nama}
                <button onClick={() => remove(i.kind)} aria-label={`Hapus ${i.nama}`} className="text-white/80 hover:text-white">
                  <X size={13} />
                </button>
              </span>
            ))}
          </div>
          <span className="flex-1 truncate text-sm font-medium text-white/90 sm:hidden">
            {items.length} item
          </span>
          <div className="shrink-0 text-right">
            <div className="text-[10px] leading-none text-white/70">Subtotal</div>
            <div className="text-sm font-bold text-white sm:text-base">{formatRupiah(subtotal)}</div>
          </div>
          <button
            onClick={() => setOpen(true)}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-white px-5 py-2.5 text-sm font-bold text-rose shadow-sm transition hover:bg-rose-soft sm:px-6"
          >
            Book <ArrowRight size={16} />
          </button>
        </div>
      </div>

      {open && <Checkout data={data} settings={settings} onClose={() => setOpen(false)} />}
    </>
  );
}
