import { nailArt as cfgNailArt } from "@/lib/config";
import { getServicesData, getGallery } from "@/lib/storage";
import ServiceCard from "@/components/ServiceCard";
import SectionHeader from "@/components/SectionHeader";

export const metadata = { title: "Nail Art" };

export default async function NailArtPage() {
  const data = await getServicesData();
  const nailArt = data?.nailArt?.length ? data.nailArt : cfgNailArt;
  const gallery = await getGallery();
  return (
    <div className="container-x py-16">
      <SectionHeader
        eyebrow="Nail Art"
        title="Kuku cantik, detail sempurna"
        desc="Perawatan dan seni kuku profesional — dari polish rapi sampai desain custom hand-painted yang tahan lama."
      />

      <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {nailArt.map((n) => (
          <ServiceCard key={n.id} item={n} />
        ))}
      </div>

      {/* Galeri kecil */}
      {gallery.length > 0 && (
        <div className="mt-16">
          <SectionHeader eyebrow="Inspirasi" title="Beberapa karya" />
          <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            {gallery.slice(0, 6).map((g) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={g.id} src={g.url} alt={g.caption || "Nail art"} loading="lazy" className="aspect-square w-full rounded-xl object-cover" />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
