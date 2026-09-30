"use client";

import { useEffect } from "react";

// Stops iOS focus-zoom via maximum-scale, iOS only (Android would lose pinch-zoom); never use user-scalable=no.
export default function IosZoomFix() {
  useEffect(() => {
    const userAgent = navigator.userAgent || "";
    const iOS = /iphone|ipad|ipod/i.test(userAgent);
    // iPadOS reports as Mac; detect via touch points (Mac has 0, no touchscreen).
    const iPadOS = /macintosh/i.test(userAgent) && navigator.maxTouchPoints > 1;
    if (!iOS && !iPadOS) return;

    const meta = document.querySelector('meta[name="viewport"]');
    if (!meta) return;
    if (!/maximum-scale/.test(meta.content)) {
      meta.content = `${meta.content.replace(/\s*$/, "")},maximum-scale=1`;
    }
  }, []);
  return null;
}
