import SectionHeader from "@/components/SectionHeader";
import { getGallery } from "@/lib/storage";

export const metadata = { title: "Galeri" };

export default async function GaleriPage() {
  const items = await getGallery();

  return (
    <div className="container-x py-16">
      <SectionHeader
        eyebrow="Galeri"
        title="Portofolio"
        desc="Kumpulan hasil riasan dan nail art."
        center
      />

      {items.length === 0 ? (
        <div className="mt-12 rounded-2xl border border-dashed border-rose-line bg-white py-20 text-center text-sm text-muted">
          Foto belum ditambahkan. Segera hadir.
        </div>
      ) : (
        <div className="mt-12 columns-2 gap-4 sm:columns-3 [&>*]:mb-4">
          {items.map((g) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={g.id}
              src={g.url}
              alt={g.caption || "Portofolio Salia Makeup"}
              loading="lazy"
              className="w-full rounded-2xl"
            />
          ))}
        </div>
      )}
    </div>
  );
}
