"use client";

import SectionHeader from "@/components/SectionHeader";
import { CartProvider } from "./CartProvider";
import StoreCard from "./StoreCard";
import BookBar from "./BookBar";

// The pick-and-checkout storefront: three category sections of cards (5-up on
// desktop, 2-up on mobile) + a sticky book bar. Wrapped in the cart context.
export default function Storefront({ data, settings }) {
  // Stamp the category on every item so picking works regardless of source
  // (the static fallback table doesn't carry `kind`).
  const withKind = (arr, kind) => (arr || []).map((x) => ({ ...x, kind }));
  const sections = [
    { key: "makeup", eyebrow: "Make Up", title: "Pilih riasanmu", items: withKind(data.services, "makeup") },
    { key: "hairdo", eyebrow: "Hairdo", title: "Penataan rambut", items: withKind(data.hairdo, "hairdo") },
    { key: "nail", eyebrow: "Nails", title: "Nail art", items: withKind(data.nailArt, "nail") },
  ];

  return (
    <CartProvider>
      <div id="pilih" className="space-y-16 pb-28">
        {sections.map((sec) => (
          <section key={sec.key} className="scroll-mt-24">
            <SectionHeader eyebrow={sec.eyebrow} title={sec.title} />
            {sec.items.length === 0 ? (
              <p className="mt-8 rounded-2xl border border-dashed border-rose-line bg-white py-12 text-center text-sm text-muted">
                Belum ada item di kategori ini.
              </p>
            ) : (
              <div className="mt-8 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-5">
                {sec.items.map((item) => (
                  <StoreCard key={item.id} item={item} />
                ))}
              </div>
            )}
          </section>
        ))}
      </div>

      <BookBar data={data} settings={settings} />
    </CartProvider>
  );
}
