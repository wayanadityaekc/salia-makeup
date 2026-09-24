import "./globals.css";
import { site } from "@/lib/config";

export const metadata = {
  title: {
    default: `${site.brand} — ${site.tagline}`,
    template: `%s — ${site.brand}`,
  },
  description:
    "Jasa make up, hairdo, dan nail art profesional di " +
    site.kota +
    ". Booking mudah langsung via WhatsApp.",
  openGraph: {
    title: `${site.brand} — ${site.tagline}`,
    type: "website",
    url: `https://${site.domain}`,
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
