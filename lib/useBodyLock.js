"use client";

import { useEffect } from "react";

// CUE's scroll lock: while a popup is open the page behind it cannot scroll (class on html AND body, iOS scrolls html).
// A counter keeps the lock on while a second popup is still open on top of the first.
export default function useBodyLock(active) {
  useEffect(() => {
    if (!active) return;
    const root = document.documentElement;
    const count = Number(root.dataset.locks || 0) + 1;
    root.dataset.locks = String(count);
    root.classList.add("salia-locked");
    document.body.classList.add("salia-locked");
    return () => {
      const left = Number(root.dataset.locks || 1) - 1;
      root.dataset.locks = String(left);
      if (left > 0) return;
      root.classList.remove("salia-locked");
      document.body.classList.remove("salia-locked");
    };
  }, [active]);
}
