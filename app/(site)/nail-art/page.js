import { nailArt as cfgNailArt } from '@/lib/config';
import { fetchServicesData, fetchGallery } from '@/lib/storage';
import ServiceCard from '@/components/ServiceCard';
import SectionHeader from '@/components/SectionHeader';
import messages from '@/messages/id/pages.json';

export const metadata = { title: messages.nailArt.metaTitle };

export default async function NailArtPage() {
  const data = await fetchServicesData();
  const nailArt = data?.nailArt?.length ? data.nailArt : cfgNailArt;
  const gallery = await fetchGallery();
  return (
    <div className="container-x py-16">
      <SectionHeader eyebrow={messages.nailArt.eyebrow} title={messages.nailArt.title} desc={messages.nailArt.desc} />

      <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {nailArt.map((design) => (
          <ServiceCard key={design.id} item={design} />
        ))}
      </div>

      {gallery.length > 0 && (
        <div className="mt-16">
          <SectionHeader eyebrow={messages.nailArt.galleryEyebrow} title={messages.nailArt.galleryTitle} />
          <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            {gallery.slice(0, 6).map((photo) => (
              <img
                key={photo.id}
                src={photo.url}
                alt={photo.caption || messages.nailArt.photoAlt}
                loading="lazy"
                className="aspect-square w-full rounded-xl object-cover"
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
