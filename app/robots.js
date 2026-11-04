import { site } from '@/lib/config';

const SITE_URL = `https://${site.domain}`;
const PRIVATE_PATHS = ['/dashboard', '/booking'];

export default function robots() {
  return {
    rules: [{ userAgent: '*', allow: '/', disallow: PRIVATE_PATHS }],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
