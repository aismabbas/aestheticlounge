import type { MetadataRoute } from 'next';
import { allTreatments } from '@/data/services';

export const dynamic = 'force-static';

const BASE_URL = 'https://aestheticloungeofficial.com';

const STATIC_PAGES = [
  '',
  '/about',
  '/services',
  '/price-guide',
  '/gallery',
  '/doctors',
  '/contact',
  '/book',
];

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const staticEntries: MetadataRoute.Sitemap = STATIC_PAGES.map((path) => ({
    url: `${BASE_URL}${path}`,
    lastModified: now,
    changeFrequency: path === '' ? 'weekly' : 'monthly',
    priority: path === '' ? 1.0 : 0.8,
  }));

  const treatmentEntries: MetadataRoute.Sitemap = allTreatments.map((t) => ({
    url: `${BASE_URL}/services/${t.slug}`,
    lastModified: now,
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  }));

  return [...staticEntries, ...treatmentEntries];
}
