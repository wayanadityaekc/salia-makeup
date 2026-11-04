import './globals.css';
import { site } from '@/lib/config';
import IosZoomFix from '@/components/IosZoomFix';
import MotionRoot from '@/components/motion/MotionRoot';
import { formatMessage } from '@/lib/formatMessage';
import messages from '@/messages/id/layout.json';

export const metadata = {
  title: {
    default: `${site.brand} · ${site.tagline}`,
    template: `%s · ${site.brand}`,
  },
  description: formatMessage(messages.rootLayout.description, { kota: site.kota }),
  openGraph: {
    title: `${site.brand} · ${site.tagline}`,
    type: 'website',
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
      <body>
        <IosZoomFix />
        <MotionRoot>{children}</MotionRoot>
      </body>
    </html>
  );
}
