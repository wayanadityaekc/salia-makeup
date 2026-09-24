import { Suspense } from "react";
import BookingForm from "@/components/BookingForm";
import SectionHeader from "@/components/SectionHeader";
import { site } from "@/lib/config";

export const metadata = { title: "Booking" };

export default function BookingPage() {
  return (
    <div className="container-x grid gap-12 py-16 lg:grid-cols-[1fr_1.2fr]">
      <div>
        <SectionHeader
          eyebrow="Booking"
          title="Amankan jadwalmu"
          desc="Isi form di samping, lalu konfirmasi otomatis lewat WhatsApp. Cepat dan tanpa ribet."
        />
        <div className="mt-8 space-y-4 text-sm text-muted">
          <p>• Booking minimal H-1 untuk ketersediaan jadwal terbaik.</p>
          <p>• Bisa datang ke lokasi (biaya area menyesuaikan jarak).</p>
          <p>• Pembayaran & detail final dikonfirmasi via WhatsApp.</p>
          <p>• Jam operasional: {site.jam}.</p>
        </div>
      </div>

      <Suspense fallback={<div className="text-sm text-muted">Memuat form…</div>}>
        <BookingForm />
      </Suspense>
    </div>
  );
}
