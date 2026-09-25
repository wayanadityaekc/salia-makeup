"use client";

import { useEffect } from "react";

// Stops iOS Safari from zooming in when a form field < 16px gets focus, WITHOUT
// enlarging the fields. iOS is the only browser that zooms on focus, and since
// iOS 10 it still honors pinch-zoom even with maximum-scale set — so clamping
// the viewport here costs nothing for users. We do NOT do this on Android/desktop
// (Android would actually lose pinch-zoom), and never use user-scalable=no.
//
// Runs after mount (not in static meta) so Next's own viewport tag is settled
// first. Same reasoning as CUE's IosZoomFix.
export default function IosZoomFix() {
  useEffect(() => {
    const ua = navigator.userAgent || "";
    const iOS = /iphone|ipad|ipod/i.test(ua);
    // iPadOS reports as Mac; detect via touch points (Mac has 0, no touchscreen).
    const iPadOS = /macintosh/i.test(ua) && navigator.maxTouchPoints > 1;
    if (!iOS && !iPadOS) return;

    const meta = document.querySelector('meta[name="viewport"]');
    if (!meta) return;
    if (!/maximum-scale/.test(meta.content)) {
      meta.content = meta.content.replace(/\s*$/, "") + ",maximum-scale=1";
    }
  }, []);
  return null;
}
