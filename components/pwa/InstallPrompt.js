"use client";

import { useEffect, useState } from "react";
import { Download, Share, X } from "lucide-react";

// Install bar shown in the BROWSER only (hidden once installed / in standalone).
// - Android/Chrome: captures beforeinstallprompt; the button fires the native
//   "Add to Home screen" dialog directly.
// - iOS Safari: no programmatic prompt exists, so we show the Share → "Add to
//   Home Screen" hint instead.
// Renders nothing in the installed app, and dismissal is remembered.
const DISMISS_KEY = "salia_install_dismissed";

export default function InstallPrompt() {
  const [deferred, setDeferred] = useState(null);
  const [show, setShow] = useState(false);
  const [ios, setIos] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const standalone =
      window.matchMedia?.("(display-mode: standalone)").matches ||
      window.navigator.standalone === true;
    if (standalone) return; // already installed
    try {
      if (localStorage.getItem(DISMISS_KEY) === "1") return;
    } catch {}

    const ua = navigator.userAgent || "";
    const isIOS =
      /iphone|ipad|ipod/i.test(ua) ||
      (/macintosh/i.test(ua) && navigator.maxTouchPoints > 1);
    const isSafari = /safari/i.test(ua) && !/(crios|fxios|chrome|android)/i.test(ua);
    if (isIOS && isSafari) {
      setIos(true);
      setShow(true);
      return;
    }

    const onBIP = (e) => {
      e.preventDefault(); // stop Chrome's mini-infobar; we show our own button
      setDeferred(e);
      setShow(true);
    };
    const onInstalled = () => {
      setShow(false);
      setDeferred(null);
    };
    window.addEventListener("beforeinstallprompt", onBIP);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBIP);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const install = async () => {
    if (!deferred) return;
    deferred.prompt(); // native add-to-home-screen dialog
    try {
      await deferred.userChoice;
    } catch {}
    setDeferred(null);
    setShow(false);
  };

  const dismiss = () => {
    setShow(false);
    try {
      localStorage.setItem(DISMISS_KEY, "1");
    } catch {}
  };

  if (!show) return null;

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-50 border-t border-rose-line bg-white/95 backdrop-blur"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="container-x flex items-center gap-3 py-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-rose text-[#F7EDEF]">
          <span className="font-serif text-base font-semibold">S</span>
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-ink">Pasang Salia Admin</p>
          {ios ? (
            <p className="mt-0.5 flex items-center gap-1 text-xs text-muted">
              Ketuk <Share size={13} className="inline" /> lalu “Add to Home Screen”.
            </p>
          ) : (
            <p className="mt-0.5 text-xs text-muted">Buka seperti aplikasi, langsung dari layar utama.</p>
          )}
        </div>
        {!ios && (
          <button
            onClick={install}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-rose px-4 py-2 text-sm font-semibold text-white hover:bg-rose-deep"
          >
            <Download size={16} /> Pasang
          </button>
        )}
        <button
          onClick={dismiss}
          aria-label="Tutup"
          className="shrink-0 rounded-full p-2 text-muted hover:bg-rose-soft hover:text-rose"
        >
          <X size={18} />
        </button>
      </div>
    </div>
  );
}
