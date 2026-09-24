import { nailArt } from "@/lib/config";
import ServiceCard from "@/components/ServiceCard";
import SectionHeader from "@/components/SectionHeader";

export const metadata = { title: "Nail Art" };

export default function NailArtPage() {
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
      <div className="mt-16">
        <SectionHeader eyebrow="Inspirasi" title="Beberapa karya" />
        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="foto-ph aspect-square rounded-xl text-xs">
              Nail #{i + 1}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
