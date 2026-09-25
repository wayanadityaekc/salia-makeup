import { services as cfgServices, hairdoAddon as cfgAddon, areas as cfgAreas } from "@/lib/config";
import { getServicesData } from "@/lib/storage";
import { formatRupiah } from "@/lib/utils";
import ServiceCard from "@/components/ServiceCard";
import SectionHeader from "@/components/SectionHeader";

export const metadata = { title: "Make Up" };

export default async function LayananPage() {
  const data = await getServicesData();
  const services = data?.services?.length ? data.services : cfgServices;
  const areas = data?.areas?.length ? data.areas : cfgAreas;
  const hairdoAddon = data?.hairdoAddon || cfgAddon;

  return (
    <div className="container-x py-16">
      <SectionHeader
        eyebrow="Layanan"
        title="Make Up & Hairdo"
        desc="Pilih paket sesuai acaramu. Harga dasar sudah termasuk konsultasi; hairdo dan biaya area ditambahkan sesuai kebutuhan."
      />

      <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {services.map((s) => (
          <ServiceCard key={s.id} item={s} badge={s.hairdoIncluded ? "+ Hairdo" : null} />
        ))}
      </div>

      {/* Info tambahan */}
      <div className="mt-10 grid gap-5 sm:grid-cols-2">
        <div className="rounded-2xl border border-rose-line bg-white p-6">
          <h3 className="font-semibold text-ink">Tambahan Hairdo</h3>
          <p className="mt-2 text-sm text-muted">
            Untuk paket tanpa hairdo, kamu bisa menambah penataan rambut.
          </p>
          <div className="mt-3 text-lg font-bold text-rose">
            + {formatRupiah(hairdoAddon)}
          </div>
        </div>
        <div className="rounded-2xl border border-rose-line bg-white p-6">
          <h3 className="font-semibold text-ink">Biaya Area</h3>
          <ul className="mt-2 space-y-1.5 text-sm text-muted">
            {areas.map((a) => (
              <li key={a.id} className="flex justify-between">
                <span>{a.nama}</span>
                <span className="font-medium text-ink">
                  {a.fee === 0 ? "Gratis" : `+ ${formatRupiah(a.fee)}`}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
