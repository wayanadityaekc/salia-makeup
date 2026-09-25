import { Globe, MessageCircle, Instagram, CalendarHeart } from "lucide-react";
import { site } from "@/lib/config";
import { getSettings } from "@/lib/storage";
import { waLink, normalizeWa } from "@/lib/utils";

// Link-in-bio page for IG/TikTok bio. Not linked anywhere on the site and not
// indexed — reachable only by its URL (/links).
export const metadata = {
  title: "Links",
  robots: { index: false, follow: false },
};

function TikTokIcon({ size = 20 }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor" aria-hidden="true">
      <path d="M16.5 3c.35 2.1 1.62 3.63 3.5 3.86v2.43c-1.27.06-2.46-.32-3.5-1v5.77c0 3.02-2.2 5.24-5 5.24s-5-2.22-5-5.02c0-2.83 2.24-5.02 5.2-4.9v2.5c-.32-.1-.68-.16-1-.16-1.38 0-2.5 1.14-2.5 2.56 0 1.45 1.12 2.62 2.5 2.62s2.45-1.13 2.45-2.62V3h3.35z" />
    </svg>
  );
}
function GoogleIcon({ size = 20 }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor" aria-hidden="true">
      <path d="M12 11v2.9h4.1c-.25 1.2-1.5 3.1-4.1 3.1-2.47 0-4.5-2.04-4.5-4.55S9.53 7.9 12 7.9c1.4 0 2.35.6 2.9 1.12l1.98-1.9C15.6 5.9 13.98 5.2 12 5.2 8.32 5.2 5.3 8.2 5.3 12s3.02 6.8 6.7 6.8c3.87 0 6.43-2.72 6.43-6.55 0-.44-.05-.77-.12-1.1H12z" />
    </svg>
  );
}

export default async function LinksPage() {
  const { social, whatsapp } = await getSettings();
  const wa = waLink(normalizeWa(whatsapp || site.whatsapp), `Halo ${site.brand}, saya mau booking 😊`);
  const webBase = `https://${site.domain}`;

  const links = [
    { href: wa, label: "Booking via WhatsApp", Icon: MessageCircle, primary: true },
    { href: `${webBase}/booking`, label: "Booking Online", Icon: CalendarHeart, primary: true },
    { href: webBase, label: "Website Resmi", Icon: Globe },
    social.instagram && { href: social.instagram, label: "Instagram", Icon: Instagram },
    social.tiktok && { href: social.tiktok, label: "TikTok", Icon: TikTokIcon },
    social.google && { href: social.google, label: "Google Business", Icon: GoogleIcon },
  ].filter(Boolean);

  return (
    <main className="min-h-screen bg-rose-soft px-5 py-14">
      <div className="mx-auto w-full max-w-sm text-center">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-rose text-2xl font-bold text-white">
          SM
        </div>
        <h1 className="mt-4 text-2xl font-bold text-ink">{site.brand}</h1>
        <p className="mt-1 text-sm text-muted">{site.tagline} · {site.kota}</p>

        <div className="mt-8 grid gap-3">
          {links.map(({ href, label, Icon, primary }) => (
            <a
              key={label}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className={`flex items-center gap-3 rounded-2xl border px-5 py-3.5 text-sm font-semibold transition active:scale-[0.99] ${
                primary
                  ? "border-rose bg-rose text-white hover:bg-rose-deep"
                  : "border-rose-line bg-white text-ink hover:bg-white/70"
              }`}
            >
              <Icon size={20} className={primary ? "text-white" : "text-rose"} />
              <span className="flex-1 text-center">{label}</span>
              <span className="w-5" />
            </a>
          ))}
        </div>

        <p className="mt-10 text-xs text-muted">© {new Date().getFullYear()} {site.brand}</p>
      </div>
    </main>
  );
}
