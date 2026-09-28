"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

// Checkout cart: at most one item per category (makeup / hairdo / nail) + a
// people count. Picking another item in the same category replaces it.
// Persisted to localStorage so the selection survives the trip to /booking
// (a real route, not a modal). Read in an effect to keep SSR markup stable.
const Ctx = createContext(null);
export const CART_KEY = "salia_cart";

export function CartProvider({ children }) {
  const [sel, setSel] = useState({ makeup: null, hairdo: null, nail: null });
  const [orang, setOrang] = useState(1);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(CART_KEY);
      if (raw) {
        const v = JSON.parse(raw);
        if (v.sel) setSel({ makeup: v.sel.makeup || null, hairdo: v.sel.hairdo || null, nail: v.sel.nail || null });
        if (v.orang) setOrang(v.orang);
      }
    } catch {}
  }, []);

  useEffect(() => {
    try { localStorage.setItem(CART_KEY, JSON.stringify({ sel, orang })); } catch {}
  }, [sel, orang]);

  const pick = (item) =>
    setSel((s) => ({ ...s, [item.kind]: s[item.kind]?.id === item.id ? null : item }));
  const remove = (kind) => setSel((s) => ({ ...s, [kind]: null }));
  const clear = () => {
    setSel({ makeup: null, hairdo: null, nail: null });
    setOrang(1);
  };

  const items = useMemo(() => [sel.makeup, sel.hairdo, sel.nail].filter(Boolean), [sel]);
  const subtotal = useMemo(() => items.reduce((a, b) => a + (b.base || 0), 0), [items]);

  const value = {
    sel, orang, setOrang, pick, remove, clear, items, subtotal,
    isSelected: (id) => items.some((i) => i.id === id),
  };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useCart = () => useContext(Ctx);
