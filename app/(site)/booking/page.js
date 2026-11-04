import { Suspense } from 'react';
import { fetchSettings } from '@/lib/storage';
import { areas as cfgAreas } from '@/lib/config';
import BookingPage from '@/components/booking/BookingPage';
import messages from '@/messages/id/booking.json';

export const metadata = { title: messages.metadata.title };

export default async function Page() {
  const settings = await fetchSettings();
  if (!settings.areas?.length) settings.areas = cfgAreas;
  return (
    <Suspense
      fallback={<div className="container-x py-16 text-center text-sm text-muted">{messages.bookingRoute.loading}</div>}
    >
      <BookingPage settings={settings} />
    </Suspense>
  );
}
