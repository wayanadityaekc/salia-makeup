import { Instagram } from "lucide-react";

// Brand glyphs Lucide doesn't ship. Monochrome (currentColor).
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

// Shared clickable social icon row. Hidden entirely when no links are set.
export default function SocialLinks({ social = {}, size = 18, className = "" }) {
  const links = [
    social.instagram && { href: social.instagram, label: "Instagram", Icon: Instagram },
    social.tiktok && { href: social.tiktok, label: "TikTok", Icon: TikTokIcon },
    social.google && { href: social.google, label: "Google Business Profile", Icon: GoogleIcon },
  ].filter(Boolean);
  if (links.length === 0) return null;
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
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
          <Icon size={size} />
        </a>
      ))}
    </div>
  );
}
