import SectionHeader from "@/components/SectionHeader";

export const metadata = { title: "Galeri" };

const items = [
  "Make Up Natural", "Wisuda", "Kundangan", "Upacara Adat",
  "Nail Gel", "Nail Design", "Hairdo Pesta", "Make Up Bold", "Nail Extension",
];

export default function GaleriPage() {
  return (
    <div className="container-x py-16">
      <SectionHeader
        eyebrow="Galeri"
        title="Portofolio"
        desc="Kumpulan hasil riasan dan nail art. Foto asli menyusul."
        center
      />
      <div className="mt-12 columns-2 gap-4 sm:columns-3 [&>*]:mb-4">
        {items.map((label, i) => (
          <div
            key={i}
            className={`foto-ph rounded-2xl text-sm ${
              i % 3 === 0 ? "aspect-[3/4]" : i % 3 === 1 ? "aspect-square" : "aspect-[4/5]"
            }`}
          >
            {label}
          </div>
        ))}
      </div>
    </div>
  );
}
