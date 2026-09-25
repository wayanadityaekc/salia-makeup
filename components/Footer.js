import Link from "next/link";
import { Instagram, Mail, Clock, MapPin } from "lucide-react";
import { site } from "@/lib/config";
import { getSettings } from "@/lib/storage";
import SocialLinks from "@/components/SocialLinks";

export default async function Footer() {
  const { social } = await getSettings();

  return (
    <footer className="mt-24 border-t border-rose-line bg-rose-soft">
      <div className="container-x grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <div className="text-lg font-bold text-rose">{site.brand}</div>
          <p className="mt-3 max-w-xs text-sm text-muted">{site.tagline} di {site.kota}.</p>
          <SocialLinks social={social} className="mt-4" />
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
