"use client";

import { useEffect, useState } from "react";
import { Download, Share, Plus, X, MoreVertical } from "lucide-react";

// Install bar shown in the BROWSER only (hidden once installed / in standalone).
//
// One tap does the most each platform allows:
// - Android/Chrome: the button fires the native "Add to Home screen" dialog
//   directly (beforeinstallprompt) — genuinely one tap.
// - iOS Safari: Apple exposes NO install API, so nothing can open the Share sheet
//   for the user. The button instead opens a short visual guide pointing at the
//   Share → "Add to Home Screen" steps.
// - Any other case (no prompt captured yet): same guide, with the browser-menu steps.
const DISMISS_KEY = "salia_install_dismissed";

export default function InstallPrompt() {
  const [deferred, setDeferred] = useState(null);
  const [show, setShow] = useState(false);
  const [ios, setIos] = useState(false);
  const [guide, setGuide] = useState(false);

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
    setIos(isIOS);
    if (isIOS && isSafari) {
      setShow(true); // iOS Safari can install (via the guide)
      return;
    }

    const onBIP = (e) => {
      e.preventDefault(); // stop Chrome's mini-infobar; we show our own button
      setDeferred(e);
      setShow(true);
    };
    const onInstalled = () => {
      setShow(false);
      setGuide(false);
      setDeferred(null);
    };
    window.addEventListener("beforeinstallprompt", onBIP);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBIP);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  // Close the guide with Escape.
  useEffect(() => {
    if (!guide) return;
    const onKey = (e) => e.key === "Escape" && setGuide(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [guide]);

  const onInstallClick = async () => {
    if (deferred) {
      deferred.prompt(); // native add-to-home-screen dialog — one tap
      try {
        await deferred.userChoice;
      } catch {}
      setDeferred(null);
      setShow(false);
      return;
    }
    setGuide(true); // iOS / no native prompt → show the steps
  };

  const dismiss = () => {
    setShow(false);
    setGuide(false);
    try {
      localStorage.setItem(DISMISS_KEY, "1");
    } catch {}
  };

  if (!show) return null;

  return (
    <>
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
            <p className="mt-0.5 text-xs text-muted">Buka seperti aplikasi, langsung dari layar utama.</p>
          </div>
          <button
            onClick={onInstallClick}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-rose px-4 py-2 text-sm font-semibold text-white hover:bg-rose-deep"
          >
            <Download size={16} /> Pasang
          </button>
          <button
            onClick={dismiss}
            aria-label="Tutup"
            className="shrink-0 rounded-full p-2 text-muted hover:bg-rose-soft hover:text-rose"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Guide (iOS Safari, or any browser with no native prompt) */}
      {guide && (
        <div
          className="fixed inset-0 z-[60] flex items-end justify-center bg-ink/40 p-4 sm:items-center"
          onClick={() => setGuide(false)}
        >
          <div
            className="w-full max-w-sm rounded-3xl border border-rose-line bg-white p-6"
            style={{ marginBottom: "env(safe-area-inset-bottom)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-ink">Pasang ke layar utama</h2>
              <button
                onClick={() => setGuide(false)}
                aria-label="Tutup"
                className="rounded-full p-1.5 text-muted hover:bg-rose-soft hover:text-rose"
              >
                <X size={18} />
              </button>
            </div>

            {ios ? (
              <ol className="mt-4 space-y-3">
                <Step n={1}>
                  Ketuk ikon <b>Bagikan</b>{" "}
                  <Share size={15} className="mx-0.5 inline align-text-bottom text-rose" /> di bar Safari.
                </Step>
                <Step n={2}>
                  Pilih <b>Add to Home Screen</b>{" "}
                  <Plus size={15} className="mx-0.5 inline align-text-bottom text-rose" />.
                </Step>
                <Step n={3}>
                  Ketuk <b>Add</b> di kanan atas. Selesai — buka Salia dari ikonnya.
                </Step>
              </ol>
            ) : (
              <ol className="mt-4 space-y-3">
                <Step n={1}>
                  Buka menu browser{" "}
                  <MoreVertical size={15} className="mx-0.5 inline align-text-bottom text-rose" /> (kanan atas).
                </Step>
                <Step n={2}>
                  Pilih <b>Install app</b> atau <b>Add to Home screen</b>.
                </Step>
                <Step n={3}>Konfirmasi. Buka Salia dari ikonnya.</Step>
              </ol>
            )}

            <button
              onClick={() => setGuide(false)}
              className="mt-6 w-full rounded-full bg-rose px-4 py-2.5 text-sm font-semibold text-white hover:bg-rose-deep"
            >
              Mengerti
            </button>
          </div>
        </div>
      )}
    </>
  );
}

function Step({ n, children }) {
  return (
    <li className="flex gap-3">
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-rose-soft text-xs font-bold text-rose">
        {n}
      </span>
      <span className="text-sm leading-relaxed text-ink">{children}</span>
    </li>
  );
}
