import { site } from '@/lib/config';

const SITE_URL = `https://${site.domain}`;
const PUBLIC_PAGES = [
  { path: '', changeFrequency: 'weekly', priority: 1 },
  { path: '/layanan', changeFrequency: 'weekly', priority: 0.9 },
  { path: '/nail-art', changeFrequency: 'weekly', priority: 0.9 },
  { path: '/galeri', changeFrequency: 'weekly', priority: 0.7 },
  { path: '/ketentuan', changeFrequency: 'monthly', priority: 0.5 },
  { path: '/links', changeFrequency: 'monthly', priority: 0.4 },
];

export default function sitemap() {
  const lastModified = new Date();
  return PUBLIC_PAGES.map(({ path, changeFrequency, priority }) => ({
    url: `${SITE_URL}${path}`,
    lastModified,
    changeFrequency,
    priority,
  }));
}
