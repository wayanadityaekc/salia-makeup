import RegisterSW from "@/components/pwa/RegisterSW";
import InstallPrompt from "@/components/pwa/InstallPrompt";

// PWA metadata is scoped to the admin dashboard segment only — the public
// marketing site (app/(site)) is unaffected. Business logic, auth, API calls
// and the dashboard UI in page.js are untouched; this layout only adds the
// manifest link, Apple web-app tags, icons, theme color, and SW registration.
export const metadata = {
  applicationName: "Salia Admin",
  title: "Salia Admin",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "Salia Admin",
    statusBarStyle: "default",
  },
  // Legacy tag for older iOS Safari (Next only emits the modern
  // "mobile-web-app-capable"); both are needed for reliable standalone on iPhone.
  other: {
    "apple-mobile-web-app-capable": "yes",
  },
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#6B2C3E",
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
