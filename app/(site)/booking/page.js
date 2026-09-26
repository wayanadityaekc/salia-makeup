import { services as cfgServices, hairdo as cfgHairdo, nailArt as cfgNailArt, areas as cfgAreas } from "@/lib/config";
import { getServicesData, getSettings } from "@/lib/storage";
import SectionHeader from "@/components/SectionHeader";
import Storefront from "@/components/store/Storefront";

export const metadata = { title: "Booking" };

export default async function BookingPage() {
  const data = await getServicesData();
  const settings = await getSettings();
  const store = {
    services: data?.services?.length ? data.services : cfgServices,
    hairdo: data?.hairdo?.length ? data.hairdo : cfgHairdo,
    nailArt: data?.nailArt?.length ? data.nailArt : cfgNailArt,
    areas: data?.areas?.length ? data.areas : cfgAreas,
  };

  return (
    <div className="container-x py-16">
      <SectionHeader
        eyebrow="Booking"
        title="Pilih layanan & checkout"
        desc="Pilih item yang kamu mau (bisa makeup, hairdo, nails), lalu tekan Book untuk isi jadwal dan bayar DP. Konfirmasi otomatis lewat WhatsApp."
      />
      <div className="mt-10">
        <Storefront data={store} settings={settings} />
      </div>
    </div>
  );
}
