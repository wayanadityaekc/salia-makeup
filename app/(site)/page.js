import Link from "next/link";
import { ArrowRight, Sparkles, Heart, Clock, Quote } from "lucide-react";
import { services as cfgServices, nailArt as cfgNailArt, site, reviews } from "@/lib/config";
import { getServicesData, getSettings } from "@/lib/storage";
import ServiceCard from "@/components/ServiceCard";
import SectionHeader from "@/components/SectionHeader";
import SocialLinks from "@/components/SocialLinks";

export default async function Home() {
  // Live services from the API; fall back to the static table if the API is down.
  const data = await getServicesData();
  const services = data?.services?.length ? data.services : cfgServices;
  const nailArt = data?.nailArt?.length ? data.nailArt : cfgNailArt;
  const { social } = await getSettings();

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
            Jasa make up, hairdo, dan nail art profesional di {site.kota}. Riasan
            rapi, tahan lama, dan sesuai karaktermu.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/booking" className="btn-primary">
              Booking Sekarang <ArrowRight size={18} />
            </Link>
            <Link href="/layanan" className="btn-outline">
              Lihat Layanan
            </Link>
          </div>
          <div className="mt-10 flex flex-wrap gap-2.5">
            {["Make up & Hairdo", "Nail art", "Bisa datang ke lokasi"].map((t) => (
              <span
                key={t}
                className="rounded-full border border-rose-line bg-white px-4 py-1.5 text-sm font-medium text-ink"
              >
                {t}
              </span>
            ))}
          </div>

          <SocialLinks social={social} className="mt-6" />
        </div>
        <div className="foto-ph aspect-[4/5] rounded-3xl text-base">
          Foto portofolio Salia
        </div>
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

      {/* Layanan makeup */}
      <section className="container-x py-20">
        <div className="flex items-end justify-between gap-6">
          <SectionHeader eyebrow="Make Up" title="Layanan riasan" />
          <Link href="/layanan" className="hidden shrink-0 items-center gap-1 text-sm font-medium text-rose sm:inline-flex">
            Semua layanan <ArrowRight size={16} />
          </Link>
        </div>
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {services.slice(0, 3).map((s) => (
            <ServiceCard key={s.id} item={s} badge={s.hairdoIncluded ? "+ Hairdo" : null} />
          ))}
        </div>
        <div className="mt-8 flex justify-center">
          <Link href="/layanan" className="btn-outline">
            Lihat semua layanan makeup <ArrowRight size={18} />
          </Link>
        </div>
      </section>

      {/* Nail art teaser */}
      <section className="container-x">
        <div className="overflow-hidden rounded-3xl border border-rose-line bg-rose-soft">
          <div className="grid items-center gap-8 p-8 lg:grid-cols-2 lg:p-12">
            <div>
              <div className="eyebrow">Baru</div>
              <h2 className="mt-3 text-3xl font-bold tracking-tight text-ink sm:text-4xl">
                Nail Art custom
              </h2>
              <p className="mt-4 max-w-md text-muted">
                Dari gel polish sampai desain hand-painted. Kuku cantik yang
                melengkapi penampilanmu.
              </p>
              <Link href="/nail-art" className="btn-primary mt-6">
                Lihat Nail Art <ArrowRight size={18} />
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {nailArt.slice(0, 4).map((n) =>
                n.foto ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img key={n.id} src={n.foto} alt={n.nama} loading="lazy" className="aspect-square w-full rounded-2xl object-cover" />
                ) : (
                  <div key={n.id} className="foto-ph aspect-square rounded-2xl text-xs">
                    {n.nama}
                  </div>
                )
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Testimoni */}
      {reviews.length > 0 && (
        <section className="container-x py-20">
          <SectionHeader
            eyebrow="Testimoni"
            title="Kata mereka"
            desc="Contoh tampilan — akan diganti dengan review asli."
          />
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {reviews.map((r, i) => (
              <figure key={i} className="flex flex-col rounded-2xl border border-rose-line bg-white p-6">
                <Quote className="text-rose/40" size={28} />
                <blockquote className="mt-3 flex-1 text-sm leading-relaxed text-ink/80">
                  “{r.teks}”
                </blockquote>
                <figcaption className="mt-5 border-t border-rose-line pt-4">
                  <div className="text-sm font-semibold text-ink">{r.nama}</div>
                  {r.layanan && <div className="text-xs text-muted">{r.layanan}</div>}
                </figcaption>
              </figure>
            ))}
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="container-x py-20">
        <div className="rounded-3xl bg-rose px-8 py-14 text-center text-white">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Siap tampil memukau?
          </h2>
          <p className="mx-auto mt-3 max-w-md text-white/80">
            Booking sekarang, konfirmasi langsung lewat WhatsApp.
          </p>
          <Link
            href="/booking"
            className="btn mt-7 bg-white text-rose hover:bg-rose-soft"
          >
            Booking Sekarang <ArrowRight size={18} />
          </Link>
        </div>
      </section>
    </>
  );
}
