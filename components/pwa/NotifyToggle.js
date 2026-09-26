"use client";

import { useEffect, useState } from "react";
import { Bell, BellRing, BellOff, Loader2, Check } from "lucide-react";
import { getPushPublicKey, savePushSubscription, removePushSubscription } from "@/lib/storage";

// VAPID public key (base64url) -> Uint8Array for PushManager.subscribe.
function urlB64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

// Owner toggle: turn on native push notifications for new bookings.
// - Android/desktop: works in the browser or installed app.
// - iOS: only inside the installed app (Apple requirement) — otherwise we ask
//   the owner to install first.
export default function NotifyToggle() {
  const [status, setStatus] = useState("loading"); // loading|unsupported|need-install|blocked|off|on
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function refresh() {
    if (typeof window === "undefined") return;
    const supported = "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
    if (!supported) return setStatus("unsupported");
    const ua = navigator.userAgent || "";
    const isIOS = /iphone|ipad|ipod/i.test(ua) || (/macintosh/i.test(ua) && navigator.maxTouchPoints > 1);
    const standalone =
      window.matchMedia?.("(display-mode: standalone)").matches || window.navigator.standalone === true;
    if (isIOS && !standalone) return setStatus("need-install");
    if (Notification.permission === "denied") return setStatus("blocked");
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      setStatus(sub ? "on" : "off");
    } catch {
      setStatus("off");
    }
  }

  async function enable() {
    setBusy(true);
    setErr("");
    try {
      const perm = await Notification.requestPermission();
      if (perm !== "granted") {
        setStatus(perm === "denied" ? "blocked" : "off");
        return;
      }
      const key = await getPushPublicKey();
      if (!key) throw new Error("no_key");
      const reg = await navigator.serviceWorker.ready;
      let sub = await reg.pushManager.getSubscription();
      if (!sub) {
        sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlB64ToUint8Array(key),
        });
      }
      await savePushSubscription(sub.toJSON());
      setStatus("on");
    } catch {
      setErr("Gagal mengaktifkan notifikasi. Coba lagi.");
    } finally {
      setBusy(false);
    }
  }

  async function disable() {
    setBusy(true);
    setErr("");
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await removePushSubscription(sub.endpoint).catch(() => {});
        await sub.unsubscribe();
      }
      setStatus("off");
    } catch {
      setErr("Gagal menonaktifkan.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-2xl border border-rose-line bg-white p-5">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-rose-soft text-rose">
          {status === "on" ? <BellRing size={20} /> : <Bell size={20} />}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-ink">Notifikasi booking</h3>
          <p className="mt-0.5 text-sm text-muted">
            Dapat notifikasi langsung di HP tiap ada booking baru masuk — walau app ketutup.
          </p>

          {status === "loading" && (
            <p className="mt-3 flex items-center gap-2 text-sm text-muted">
              <Loader2 size={15} className="animate-spin" /> Memeriksa…
            </p>
          )}

          {status === "unsupported" && (
            <p className="mt-3 text-sm text-muted">Browser ini belum mendukung notifikasi.</p>
          )}

          {status === "need-install" && (
            <p className="mt-3 text-sm text-muted">
              Di iPhone, pasang dulu app ke layar utama (tombol <b>Pasang</b>), buka dari ikonnya, baru
              notifikasi bisa diaktifkan.
            </p>
          )}

          {status === "blocked" && (
            <p className="mt-3 text-sm text-rose">
              Notifikasi diblokir. Izinkan lewat pengaturan situs di browser, lalu buka lagi halaman ini.
            </p>
          )}

          {status === "off" && (
            <button
              onClick={enable}
              disabled={busy}
              className="mt-3 inline-flex items-center gap-2 rounded-full bg-rose px-4 py-2 text-sm font-semibold text-white hover:bg-rose-deep disabled:opacity-60"
            >
              {busy ? <Loader2 size={16} className="animate-spin" /> : <Bell size={16} />} Aktifkan notifikasi
            </button>
          )}

          {status === "on" && (
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-soft px-3 py-1.5 text-sm font-semibold text-rose">
                <Check size={15} /> Aktif di perangkat ini
              </span>
              <button
                onClick={disable}
                disabled={busy}
                className="inline-flex items-center gap-1.5 text-sm font-medium text-muted hover:text-rose disabled:opacity-60"
              >
                {busy ? <Loader2 size={15} className="animate-spin" /> : <BellOff size={15} />} Matikan
              </button>
            </div>
          )}

          {err && <p className="mt-2 text-xs text-rose">{err}</p>}
        </div>
      </div>
    </div>
  );
}
