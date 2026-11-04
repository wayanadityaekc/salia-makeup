import SectionHeader from '@/components/SectionHeader';
import { fetchGallery } from '@/lib/storage';
import messages from '@/messages/id/pages.json';

export const metadata = { title: messages.galeri.metaTitle };

export default async function GaleriPage() {
  const items = await fetchGallery();

  return (
    <div className="container-x py-16">
      <SectionHeader
        eyebrow={messages.galeri.eyebrow}
        title={messages.galeri.title}
        desc={messages.galeri.desc}
        center
      />

      {items.length === 0 ? (
        <div className="mt-12 rounded-2xl border border-dashed border-rose-line bg-white py-20 text-center text-sm text-muted">
          {messages.galeri.empty}
        </div>
      ) : (
        <div className="mt-12 columns-2 gap-4 sm:columns-3 *:mb-4">
          {items.map((photo) => (
            <img
              key={photo.id}
              src={photo.url}
              alt={photo.caption || messages.galeri.photoAlt}
              loading="lazy"
              className="w-full rounded-2xl"
            />
          ))}
        </div>
      )}
    </div>
  );
}
