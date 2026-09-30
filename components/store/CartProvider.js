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
        const saved = JSON.parse(raw);
        if (saved.sel) setSel({ makeup: saved.sel.makeup || null, hairdo: saved.sel.hairdo || null, nail: saved.sel.nail || null });
        if (saved.orang) setOrang(saved.orang);
      }
    } catch (e) {}
  }, []);

  useEffect(() => {
    try { localStorage.setItem(CART_KEY, JSON.stringify({ sel, orang })); } catch (e) {}
  }, [sel, orang]);

  function pick(item) {
    setSel((prev) => ({ ...prev, [item.kind]: prev[item.kind]?.id === item.id ? null : item }));
  }
  function remove(kind) { setSel((prev) => ({ ...prev, [kind]: null })); }
  function clear() {
    setSel({ makeup: null, hairdo: null, nail: null });
    setOrang(1);
  }

  const items = useMemo(() => [sel.makeup, sel.hairdo, sel.nail].filter(Boolean), [sel]);
  const subtotal = useMemo(() => items.reduce((sum, item) => sum + (item.base || 0), 0), [items]);

  const value = {
    sel, orang, setOrang, pick, remove, clear, items, subtotal,
    isSelected: (id) => items.some((i) => i.id === id),
  };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useCart() { return useContext(Ctx); }
