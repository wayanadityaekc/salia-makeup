'use client';

import { useEffect } from 'react';

export default function IosZoomFix() {
  useEffect(() => {
    const userAgent = navigator.userAgent || '';
    const iOS = /iphone|ipad|ipod/i.test(userAgent);
    const iPadOS = /macintosh/i.test(userAgent) && navigator.maxTouchPoints > 1;
    if (!iOS && !iPadOS) return;

    const meta = document.querySelector('meta[name="viewport"]');
    if (!meta) return;
    if (!/maximum-scale/.test(meta.content)) {
      meta.content = `${meta.content.replace(/\s*$/, '')},maximum-scale=1`;
    }
  }, []);
  return null;
}
