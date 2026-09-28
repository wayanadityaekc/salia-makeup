import { Suspense } from "react";
import { getSettings } from "@/lib/storage";
import { areas as cfgAreas } from "@/lib/config";
import BookingPage from "@/components/booking/BookingPage";

export const metadata = { title: "Booking" };

export default async function Page() {
  const settings = await getSettings();
  if (!settings.areas?.length) settings.areas = cfgAreas;
  return (
    <Suspense fallback={<div className="container-x py-16 text-center text-sm text-muted">Memuat…</div>}>
      <BookingPage settings={settings} />
    </Suspense>
  );
}
