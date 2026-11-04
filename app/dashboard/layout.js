import RegisterSW from '@/components/pwa/RegisterSW';
import InstallPrompt from '@/components/pwa/InstallPrompt';
import messages from '@/messages/id/dashboard.json';

export const metadata = {
  applicationName: messages.dashboardLayout.applicationName,
  title: messages.dashboardLayout.title,
  robots: { index: false, follow: false },
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    title: messages.dashboardLayout.appleWebAppTitle,
    statusBarStyle: 'default',
  },
  other: {
    'apple-mobile-web-app-capable': 'yes',
  },
  icons: {
    icon: [
      { url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [{ url: '/icons/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#6B2C3E',
};

export default function DashboardLayout({ children }) {
  return (
    <>
      <RegisterSW />
      {children}
      <InstallPrompt />
    </>
  );
}
