"use client";

import { useEffect } from "react";

// Registers the service worker for the admin PWA, scoped to /dashboard only, so
// the public marketing site is never controlled by it. Renders nothing.
// Registration failure is non-fatal: the dashboard works normally without a SW.
export default function RegisterSW() {
  useEffect(() => {
    if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;
    const register = () => {
      navigator.serviceWorker
        .register("/sw.js", { scope: "/dashboard" })
        .catch(() => {
          /* no-op: PWA install is a progressive enhancement */
        });
    };
    if (document.readyState === "complete") register();
    else {
      window.addEventListener("load", register, { once: true });
      return () => window.removeEventListener("load", register);
    }
  }, []);
  return null;
}
