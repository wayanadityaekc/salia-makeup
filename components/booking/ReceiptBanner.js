"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Download, Clock, Loader2 } from "lucide-react";
import { site } from "@/lib/config";
import { formatTanggal } from "@/lib/utils";
import { getUserBookings, getSettings } from "@/lib/storage";
import { makeReceiptPdf } from "@/lib/receipt";
import { useUser } from "@/components/auth/UserProvider";

// Homepage banner for a logged-in customer: shows their latest booking's state
// and, once approved, a receipt download. Download is login-gated by design —
// this only renders for a signed-in user reading their own bookings.
export default function ReceiptBanner() {
  const { user, ready } = useUser();
  const [booking, setBooking] = useState(null);
  const [dpPercent, setDpPercent] = useState(50);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!ready || !user) return;
    let alive = true;
    Promise.all([getUserBookings(), getSettings()]).then(([rows, s]) => {
      if (!alive) return;
      setDpPercent(s?.dpPercent || 50);
      // Prefer the newest approved booking; else the newest pending one.
      const approved = rows.find((b) => b.status === "konfirmasi" || b.status === "selesai");
      setBooking(approved || rows[0] || null);
    });
    return () => { alive = false; };
  }, [ready, user]);

  if (!user || !booking) return null;

  const approved = booking.status === "konfirmasi" || booking.status === "selesai";
  const items = Array.isArray(booking.items) && booking.items.length
    ? booking.items
    : (booking.serviceNama ? [{ nama: booking.serviceNama, base: booking.total }] : []);

  const download = async () => {
    setBusy(true);
    try {
      const orang = booking.orang || 1;
      const sub = items.reduce((s, i) => s + (i.base || 0) * orang, 0);
      const areaFee = Math.max(0, (booking.total || 0) - sub);
      const pdf = await makeReceiptPdf({
        ref: `SALIA-${booking.id}`, nama: booking.nama, telepon: booking.telepon,
        items, orang, areaNama: booking.areaNama, areaFee,
        tanggal: booking.tanggal, jam: booking.jam, total: booking.total,
        dpPercent, brand: site.brand,
      });
      const url = URL.createObjectURL(pdf.blob);
      const a = document.createElement("a");
      a.href = url; a.download = pdf.filename; a.click();
      setTimeout(() => URL.revokeObjectURL(url), 4000);
    } finally { setBusy(false); }
  };

  return (
    <div className="border-b border-rose-line bg-rose-soft/70">
      <div className="container-x flex flex-wrap items-center gap-3 py-3">
        {approved ? <CheckCircle2 className="shrink-0 text-rose" size={20} /> : <Clock className="shrink-0 text-muted" size={20} />}
        <div className="min-w-0 flex-1 text-sm">
          {approved ? (
            <><span className="font-semibold text-ink">Booking {`SALIA-${booking.id}`} dikonfirmasi 🎉</span>{" "}
              <span className="text-muted">{formatTanggal(booking.tanggal)} · struk siap diunduh.</span></>
          ) : (
            <><span className="font-semibold text-ink">Booking {`SALIA-${booking.id}`} sedang diproses</span>{" "}
              <span className="text-muted">Menunggu konfirmasi admin.</span></>
          )}
        </div>
        {approved && (
          <button onClick={download} disabled={busy} className="btn-primary shrink-0 px-4 py-2 text-sm disabled:opacity-60">
            {busy ? <Loader2 size={15} className="animate-spin" /> : <Download size={15} />} Download struk
          </button>
        )}
      </div>
    </div>
  );
}
