import { services as cfgServices, hairdoAddon as cfgAddon, areas as cfgAreas } from '@/lib/config';
import { fetchServicesData } from '@/lib/storage';
import { formatRupiah } from '@/lib/utils';
import ServiceCard from '@/components/ServiceCard';
import SectionHeader from '@/components/SectionHeader';
import { formatMessage } from '@/lib/formatMessage';
import messages from '@/messages/id/pages.json';

export const metadata = { title: messages.layanan.metaTitle };

export default async function LayananPage() {
  const data = await fetchServicesData();
  const services = data?.services?.length ? data.services : cfgServices;
  const areas = data?.areas?.length ? data.areas : cfgAreas;
  const hairdoAddon = data?.hairdoAddon || cfgAddon;

  return (
    <div className="container-x py-16">
      <SectionHeader eyebrow={messages.layanan.eyebrow} title={messages.layanan.title} desc={messages.layanan.desc} />

      <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {services.map((service) => (
          <ServiceCard
            key={service.id}
            item={service}
            badge={service.hairdoIncluded ? messages.layanan.hairdoBadge : null}
          />
        ))}
      </div>

      <div className="mt-10 grid gap-5 sm:grid-cols-2">
        <div className="rounded-2xl border border-rose-line bg-white p-6">
          <h3 className="font-semibold text-ink">{messages.layanan.hairdoAddonTitle}</h3>
          <p className="mt-2 text-sm text-muted">{messages.layanan.hairdoAddonText}</p>
          <div className="mt-3 text-lg font-bold text-rose">
            {formatMessage(messages.layanan.priceAdd, { price: formatRupiah(hairdoAddon) })}
          </div>
        </div>
        <div className="rounded-2xl border border-rose-line bg-white p-6">
          <h3 className="font-semibold text-ink">{messages.layanan.areaFeeTitle}</h3>
          <ul className="mt-2 space-y-1.5 text-sm text-muted">
            {areas.map((area) => (
              <li key={area.id} className="flex justify-between">
                <span>{area.nama}</span>
                <span className="font-medium text-ink">
                  {area.fee === 0
                    ? messages.layanan.areaFree
                    : formatMessage(messages.layanan.priceAdd, { price: formatRupiah(area.fee) })}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
