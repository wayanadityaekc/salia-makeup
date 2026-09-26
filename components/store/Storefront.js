"use client";

import { useState } from "react";
import { CartProvider } from "./CartProvider";
import StoreCard from "./StoreCard";
import BookBar from "./BookBar";

// Pick-and-checkout storefront. A sticky category bar (Make Up / Hairdo / Nails)
// switches which list is shown; items are big, one-per-screen cards you scroll
// through vertically. Wrapped in the cart context.
export default function Storefront({ data, settings }) {
  const withKind = (arr, kind) => (arr || []).map((x) => ({ ...x, kind }));
  const cats = [
    { key: "makeup", label: "Make Up", items: withKind(data.services, "makeup") },
    { key: "hairdo", label: "Hairdo", items: withKind(data.hairdo, "hairdo") },
    { key: "nail", label: "Nails", items: withKind(data.nailArt, "nail") },
  ];
  const [cat, setCat] = useState("makeup");
  const active = cats.find((c) => c.key === cat) || cats[0];

  return (
    <CartProvider>
      <div id="pilih">
        {/* Category bar */}
        <div className="sticky top-16 z-30 -mx-5 border-y border-rose-line bg-white/95 px-5 backdrop-blur sm:mx-0 sm:rounded-full sm:border">
          <div className="mx-auto flex max-w-md gap-1 py-2">
            {cats.map((c) => (
              <button
                key={c.key}
                onClick={() => setCat(c.key)}
                className={`flex-1 rounded-full px-3 py-2 text-sm font-semibold transition ${
                  cat === c.key ? "bg-rose text-white" : "text-ink hover:bg-rose-soft"
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>

        {/* One big card per screen */}
        <div className="mx-auto mt-6 max-w-md space-y-6 pb-28">
          {active.items.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-rose-line bg-white py-16 text-center text-sm text-muted">
              Belum ada item di kategori ini.
            </p>
          ) : (
            active.items.map((item) => <StoreCard key={item.id} item={item} big />)
          )}
        </div>
      </div>

      <BookBar data={data} settings={settings} />
    </CartProvider>
  );
}
