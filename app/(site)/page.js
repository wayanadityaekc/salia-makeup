import Link from "next/link";
import { ArrowRight, Sparkles, Heart, Clock, Quote } from "lucide-react";
import {
  services as cfgServices,
  hairdo as cfgHairdo,
  nailArt as cfgNailArt,
  areas as cfgAreas,
  site,
  reviews,
} from "@/lib/config";
import { getServicesData, getSettings } from "@/lib/storage";
import SectionHeader from "@/components/SectionHeader";
import SocialLinks from "@/components/SocialLinks";
import Storefront from "@/components/store/Storefront";

export default async function Home() {
  // Live catalog from the API; fall back to the static table if the API is down.
  const data = await getServicesData();
  const settings = await getSettings();
  const store = {
    services: data?.services?.length ? data.services : cfgServices,
    hairdo: data?.hairdo?.length ? data.hairdo : cfgHairdo,
    nailArt: data?.nailArt?.length ? data.nailArt : cfgNailArt,
    areas: data?.areas?.length ? data.areas : cfgAreas,
  };

  return (
    <>
      {/* Hero */}
      <section className="container-x grid items-center gap-10 py-16 lg:grid-cols-2 lg:py-24">
        <div className="animate-rise">
          <div className="eyebrow">{site.tagline}</div>
          <h1 className="mt-4 text-4xl font-bold leading-[1.1] tracking-tight text-ink sm:text-5xl lg:text-6xl">
            Cantik di hari <span className="text-rose">spesialmu</span>.
          </h1>
          <p className="mt-5 max-w-md text-lg leading-relaxed text-muted">
            Jasa make up, hairdo, dan nail art profesional di {site.kota}. Pilih
            layananmu di bawah, langsung checkout tanpa ribet.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="#pilih" className="btn-primary">
              Pilih layanan <ArrowRight size={18} />
            </Link>
            <Link href="/nail-art" className="btn-outline">
              Lihat Nail Art
            </Link>
          </div>
          <SocialLinks social={settings.social} className="mt-6" />
        </div>
        <div className="foto-ph aspect-[4/5] rounded-3xl text-base">Foto portofolio Salia</div>
      </section>

      {/* Keunggulan */}
      <section className="container-x grid gap-5 sm:grid-cols-3">
        {[
          { icon: Sparkles, t: "Produk premium", d: "Kosmetik berkualitas, aman, dan tahan lama." },
          { icon: Heart, t: "Sesuai karakter", d: "Riasan disesuaikan dengan wajah dan acaramu." },
          { icon: Clock, t: "Tepat waktu", d: "Datang on-time, bisa ke lokasi kamu." },
        ].map((f) => (
          <div key={f.t} className="rounded-2xl border border-rose-line bg-white p-6">
            <f.icon className="text-rose" size={24} />
            <h3 className="mt-4 font-semibold text-ink">{f.t}</h3>
            <p className="mt-1.5 text-sm text-muted">{f.d}</p>
          </div>
        ))}
      </section>

      {/* Storefront: Make Up / Hairdo / Nails — pilih & checkout */}
      <section className="container-x py-16">
        <Storefront data={store} settings={settings} />
      </section>

      {/* Testimoni */}
      {reviews.length > 0 && (
        <section className="container-x py-16">
          <SectionHeader eyebrow="Testimoni" title="Kata mereka" desc="Contoh tampilan — akan diganti dengan review asli." />
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {reviews.map((r, i) => (
              <figure key={i} className="flex flex-col rounded-2xl border border-rose-line bg-white p-6">
                <Quote className="text-rose/40" size={28} />
                <blockquote className="mt-3 flex-1 text-sm leading-relaxed text-ink/80">“{r.teks}”</blockquote>
                <figcaption className="mt-5 border-t border-rose-line pt-4">
                  <div className="text-sm font-semibold text-ink">{r.nama}</div>
                  {r.layanan && <div className="text-xs text-muted">{r.layanan}</div>}
                </figcaption>
              </figure>
            ))}
          </div>
        </section>
      )}
    </>
  );
}
