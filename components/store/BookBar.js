"use client";

import { useState } from "react";
import { X, ShoppingBag } from "lucide-react";
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
        className="fixed inset-x-0 bottom-0 z-40 border-t border-rose-line bg-white/95 backdrop-blur"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className="container-x flex items-center gap-3 py-3 pr-20 sm:pr-24">
          <div className="hidden shrink-0 sm:block">
            <ShoppingBag className="text-rose" size={22} />
          </div>
          <div className="flex min-w-0 flex-1 flex-wrap gap-1.5">
            {items.map((i) => (
              <span key={i.id} className="inline-flex items-center gap-1 rounded-full bg-rose-soft px-2.5 py-1 text-xs font-medium text-rose">
                {i.nama}
                <button onClick={() => remove(i.kind)} aria-label={`Hapus ${i.nama}`} className="hover:text-rose-deep">
                  <X size={12} />
                </button>
              </span>
            ))}
          </div>
          <div className="shrink-0 text-right">
            <div className="text-[11px] leading-none text-muted">Subtotal</div>
            <div className="text-sm font-bold text-rose">{formatRupiah(subtotal)}</div>
          </div>
          <button onClick={() => setOpen(true)} className="btn-primary shrink-0 px-5 py-2.5">
            Book
          </button>
        </div>
      </div>

      {open && <Checkout data={data} settings={settings} onClose={() => setOpen(false)} />}
    </>
  );
}
