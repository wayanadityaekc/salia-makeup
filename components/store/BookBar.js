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
        <div className="container-x flex items-center gap-3 py-3.5 pr-[68px] sm:pr-24">
          <div className="relative hidden shrink-0 sm:block">
            <ShoppingBag size={24} />
            <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-white text-[11px] font-bold text-rose">
              {items.length}
            </span>
          </div>
          <div className="flex min-w-0 flex-1 flex-wrap gap-1.5">
            {items.map((i) => (
              <span key={i.id} className="inline-flex items-center gap-1 rounded-full bg-white/20 px-2.5 py-1 text-xs font-semibold text-white">
                {i.nama}
                <button onClick={() => remove(i.kind)} aria-label={`Hapus ${i.nama}`} className="text-white/80 hover:text-white">
                  <X size={13} />
                </button>
              </span>
            ))}
          </div>
          <div className="shrink-0 text-right">
            <div className="text-[11px] leading-none text-white/70">Subtotal</div>
            <div className="text-base font-bold text-white">{formatRupiah(subtotal)}</div>
          </div>
          <button
            onClick={() => setOpen(true)}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-white px-6 py-2.5 text-sm font-bold text-rose shadow-sm transition hover:bg-rose-soft"
          >
            Book <ArrowRight size={16} />
          </button>
        </div>
      </div>

      {open && <Checkout data={data} settings={settings} onClose={() => setOpen(false)} />}
    </>
  );
}
