import Link from 'next/link';
import { ArrowRight, Sparkles, Heart, Clock, Quote } from 'lucide-react';
import {
  services as cfgServices,
  hairdo as cfgHairdo,
  nailArt as cfgNailArt,
  areas as cfgAreas,
  site,
  reviews,
} from '@/lib/config';
import { fetchServicesData, fetchSettings } from '@/lib/storage';
import SectionHeader from '@/components/SectionHeader';
import SocialLinks from '@/components/SocialLinks';
import Storefront from '@/components/store/Storefront';
import ReceiptBanner from '@/components/booking/ReceiptBanner';
import { formatMessage } from '@/lib/formatMessage';
import messages from '@/messages/id/pages.json';

const FEATURE_ICONS = [Sparkles, Heart, Clock];

export default async function Home() {
  const data = await fetchServicesData();
  const settings = await fetchSettings();
  const store = {
    services: data?.services?.length ? data.services : cfgServices,
    hairdo: data?.hairdo?.length ? data.hairdo : cfgHairdo,
    nailArt: data?.nailArt?.length ? data.nailArt : cfgNailArt,
    areas: data?.areas?.length ? data.areas : cfgAreas,
  };

  const content = settings.content || {};
  const heroKicker = content.heroKicker || site.tagline;
  const features = messages.home.features.map((feature, index) => ({ ...feature, icon: FEATURE_ICONS[index] }));

  return (
    <>
      <ReceiptBanner />

      <section className="container-x grid items-center gap-10 py-16 lg:grid-cols-2 lg:py-24">
        <div className="animate-rise">
          <div className="eyebrow">{heroKicker}</div>
          <h1 className="mt-4 text-4xl font-bold leading-[1.1] tracking-tight text-ink sm:text-5xl sm:leading-none lg:text-6xl">
            {content.heroTitle ? (
              content.heroTitle
            ) : (
              <>
                {messages.home.heroTitle.before}
                <span className="text-rose">{messages.home.heroTitle.highlight}</span>
                {messages.home.heroTitle.after}
              </>
            )}
          </h1>
          <p className="mt-5 max-w-md text-lg leading-relaxed text-muted">
            {formatMessage(messages.home.heroText, { city: site.kota })}
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="#pilih" className="btn-primary">
              {messages.home.chooseService} <ArrowRight size={18} />
            </Link>
            <Link href="/nail-art" className="btn-outline">
              {messages.home.viewNailArt}
            </Link>
          </div>
          <SocialLinks social={settings.social} className="mt-6" />
        </div>
        {content.heroPhoto ? (
          <img
            src={content.heroPhoto}
            alt={messages.home.heroPhotoAlt}
            className="aspect-4/5 w-full rounded-3xl object-cover"
          />
        ) : (
          <div className="foto-ph aspect-4/5 rounded-3xl text-base">{messages.home.heroPhotoPlaceholder}</div>
        )}
      </section>

      <section className="container-x grid gap-5 sm:grid-cols-3">
        {features.map((feature) => (
          <div key={feature.title} className="rounded-2xl border border-rose-line bg-white p-6">
            <feature.icon className="text-rose" size={24} />
            <h3 className="mt-4 font-semibold text-ink">{feature.title}</h3>
            <p className="mt-1.5 text-sm text-muted">{feature.text}</p>
          </div>
        ))}
      </section>

      <section className="container-x py-16">
        <Storefront data={store} settings={settings} />
      </section>

      {reviews.length > 0 && (
        <section className="container-x py-16">
          <SectionHeader
            eyebrow={messages.home.reviews.eyebrow}
            title={messages.home.reviews.title}
            desc={messages.home.reviews.desc}
          />
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {reviews.map((review, index) => (
              <figure key={index} className="flex flex-col rounded-2xl border border-rose-line bg-white p-6">
                <Quote className="text-rose/40" size={28} />
                <blockquote className="mt-3 flex-1 text-sm leading-relaxed text-ink/80">
                  {formatMessage(messages.home.reviews.quote, { text: review.teks })}
                </blockquote>
                <figcaption className="mt-5 border-t border-rose-line pt-4">
                  <div className="text-sm font-semibold text-ink">{review.nama}</div>
                  {review.layanan && <div className="text-xs text-muted">{review.layanan}</div>}
                </figcaption>
              </figure>
            ))}
          </div>
        </section>
      )}
    </>
  );
}
