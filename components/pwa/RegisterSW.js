"use client";

import { useEffect } from "react";

// Registers the admin SW scoped to /dashboard so the public site is never controlled by it; failure is non-fatal.
export default function RegisterSW() {
  useEffect(() => {
    if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;
    async function register() {
      try {
        await navigator.serviceWorker.register("/sw.js", { scope: "/dashboard" });
      } catch (e) {
        // No-op: PWA install is a progressive enhancement.
      }
    }
    if (document.readyState === "complete") register();
    else {
      window.addEventListener("load", register, { once: true });
      return () => window.removeEventListener("load", register);
    }
  }, []);
  return null;
}
