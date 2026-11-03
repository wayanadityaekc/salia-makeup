'use client';

import { useEffect } from 'react';

export default function useBodyLock(active) {
  useEffect(() => {
    if (!active) return;
    const root = document.documentElement;
    const count = Number(root.dataset.locks || 0) + 1;
    root.dataset.locks = String(count);
    root.classList.add('salia-locked');
    document.body.classList.add('salia-locked');
    return () => {
      const left = Number(root.dataset.locks || 1) - 1;
      root.dataset.locks = String(left);
      if (left > 0) return;
      root.classList.remove('salia-locked');
      document.body.classList.remove('salia-locked');
    };
  }, [active]);
}
