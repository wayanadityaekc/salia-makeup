import Link from "next/link";
import { Instagram, Mail, Clock, MapPin } from "lucide-react";
import { site } from "@/lib/config";
import { getSettings } from "@/lib/storage";

// Brand glyphs Lucide doesn't ship. Monochrome (currentColor) to match the theme.
function TikTokIcon({ size = 18 }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor" aria-hidden="true">
      <path d="M16.5 3c.35 2.1 1.62 3.63 3.5 3.86v2.43c-1.27.06-2.46-.32-3.5-1v5.77c0 3.02-2.2 5.24-5 5.24s-5-2.22-5-5.02c0-2.83 2.24-5.02 5.2-4.9v2.5c-.32-.1-.68-.16-1-.16-1.38 0-2.5 1.14-2.5 2.56 0 1.45 1.12 2.62 2.5 2.62s2.45-1.13 2.45-2.62V3h3.35z" />
    </svg>
  );
}
function GoogleIcon({ size = 18 }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor" aria-hidden="true">
      <path d="M12 11v2.9h4.1c-.25 1.2-1.5 3.1-4.1 3.1-2.47 0-4.5-2.04-4.5-4.55S9.53 7.9 12 7.9c1.4 0 2.35.6 2.9 1.12l1.98-1.9C15.6 5.9 13.98 5.2 12 5.2 8.32 5.2 5.3 8.2 5.3 12s3.02 6.8 6.7 6.8c3.87 0 6.43-2.72 6.43-6.55 0-.44-.05-.77-.12-1.1H12z" />
    </svg>
  );
}

export default async function Footer() {
  const { social } = await getSettings();
  const links = [
    social.instagram && { href: social.instagram, label: "Instagram", Icon: Instagram },
    social.tiktok && { href: social.tiktok, label: "TikTok", Icon: TikTokIcon },
    social.google && { href: social.google, label: "Google Business Profile", Icon: GoogleIcon },
  ].filter(Boolean);

  return (
    <footer className="mt-24 border-t border-rose-line bg-rose-soft">
      <div className="container-x grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <div className="text-lg font-bold text-rose">{site.brand}</div>
          <p className="mt-3 max-w-xs text-sm text-muted">{site.tagline} di {site.kota}.</p>
          {links.length > 0 && (
            <div className="mt-4 flex items-center gap-2.5">
              {links.map(({ href, label, Icon }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  title={label}
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-rose-line bg-white text-rose transition hover:bg-rose hover:text-white"
                >
                  <Icon size={18} />
                </a>
              ))}
            </div>
          )}
        </div>

        <div>
          <div className="mb-3 text-sm font-semibold text-ink">Halaman</div>
          <ul className="space-y-2 text-sm text-muted">
            <li><Link href="/layanan" className="hover:text-rose">Make Up</Link></li>
            <li><Link href="/nail-art" className="hover:text-rose">Nail Art</Link></li>
            <li><Link href="/galeri" className="hover:text-rose">Galeri</Link></li>
            <li><Link href="/booking" className="hover:text-rose">Booking</Link></li>
          </ul>
        </div>

        <div>
          <div className="mb-3 text-sm font-semibold text-ink">Kontak</div>
          <ul className="space-y-2 text-sm text-muted">
            <li>
              {social.instagram ? (
                <a href={social.instagram} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:text-rose">
                  <Instagram size={15} className="text-rose" /> @{site.instagram}
                </a>
              ) : (
                <span className="flex items-center gap-2"><Instagram size={15} className="text-rose" /> @{site.instagram}</span>
              )}
            </li>
            <li className="flex items-center gap-2">
              <Mail size={15} className="text-rose" /> {site.email}
            </li>
          </ul>
        </div>

        <div>
          <div className="mb-3 text-sm font-semibold text-ink">Jam</div>
          <ul className="space-y-2 text-sm text-muted">
            <li className="flex items-center gap-2"><Clock size={15} className="text-rose" /> {site.jam}</li>
            <li className="flex items-center gap-2"><MapPin size={15} className="text-rose" /> {site.kota}</li>
          </ul>
        </div>
      </div>

      <div className="border-t border-rose-line">
        <div className="container-x py-5 text-center text-xs text-muted">
          © {new Date().getFullYear()} {site.brand}. Semua hak cipta dilindungi.
        </div>
      </div>
    </footer>
  );
}
