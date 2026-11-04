import Link from 'next/link';
import { Instagram, Mail, Clock, MapPin } from 'lucide-react';
import { site } from '@/lib/config';
import { fetchSettings } from '@/lib/storage';
import SocialLinks from '@/components/SocialLinks';
import { formatMessage } from '@/lib/formatMessage';
import messages from '@/messages/id/layout.json';

export default async function Footer() {
  const { social } = await fetchSettings();

  return (
    <footer className="mt-24 border-t border-rose-line bg-rose-soft">
      <div className="container-x grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <div className="text-lg font-bold text-rose">{site.brand}</div>
          <p className="mt-3 max-w-xs text-sm text-muted">
            {formatMessage(messages.footer.taglineInCity, { tagline: site.tagline, kota: site.kota })}
          </p>
          <SocialLinks social={social} className="mt-4" />
        </div>

        <div>
          <div className="mb-3 text-sm font-semibold text-ink">{messages.footer.pagesHeading}</div>
          <ul className="space-y-2 text-sm text-muted">
            <li>
              <Link href="/layanan" className="hover:text-rose">
                {messages.footer.makeUp}
              </Link>
            </li>
            <li>
              <Link href="/nail-art" className="hover:text-rose">
                {messages.footer.nailArt}
              </Link>
            </li>
            <li>
              <Link href="/galeri" className="hover:text-rose">
                {messages.footer.gallery}
              </Link>
            </li>
            <li>
              <Link href="/booking" className="hover:text-rose">
                {messages.footer.booking}
              </Link>
            </li>
            <li>
              <Link href="/ketentuan" className="hover:text-rose">
                {messages.footer.termsAndPrep}
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <div className="mb-3 text-sm font-semibold text-ink">{messages.footer.contactHeading}</div>
          <ul className="space-y-2 text-sm text-muted">
            <li>
              {social.instagram ? (
                <a
                  href={social.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 hover:text-rose"
                >
                  <Instagram size={15} className="text-rose" />{' '}
                  {formatMessage(messages.footer.instagramHandle, { handle: site.instagram })}
                </a>
              ) : (
                <span className="flex items-center gap-2">
                  <Instagram size={15} className="text-rose" />{' '}
                  {formatMessage(messages.footer.instagramHandle, { handle: site.instagram })}
                </span>
              )}
            </li>
            <li className="flex items-center gap-2">
              <Mail size={15} className="text-rose" /> {site.email}
            </li>
          </ul>
        </div>

        <div>
          <div className="mb-3 text-sm font-semibold text-ink">{messages.footer.hoursHeading}</div>
          <ul className="space-y-2 text-sm text-muted">
            <li className="flex items-center gap-2">
              <Clock size={15} className="text-rose" /> {site.jam}
            </li>
            <li className="flex items-center gap-2">
              <MapPin size={15} className="text-rose" /> {site.kota}
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-rose-line">
        <div className="container-x py-5 text-center text-xs text-muted">
          {formatMessage(messages.footer.copyright, { year: new Date().getFullYear(), brand: site.brand })}
        </div>
      </div>
    </footer>
  );
}
