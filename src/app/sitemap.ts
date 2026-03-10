import type { MetadataRoute } from 'next';
import { allTreatments } from '@/data/services';
import { getPublishedPosts } from '@/data/blog-posts';
import { landingPages } from '@/data/landing-pages';

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
  '/blog',
  '/promotions',
  '/social',
  '/privacy',
  '/terms',
  '/feedback',
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

  const blogEntries: MetadataRoute.Sitemap = getPublishedPosts().map((post) => ({
    url: `${BASE_URL}/blog/${post.slug}`,
    lastModified: post.published_at ? new Date(post.published_at) : now,
    changeFrequency: 'weekly' as const,
    priority: 0.6,
  }));

  const lpEntries: MetadataRoute.Sitemap = landingPages.map((lp) => ({
    url: `${BASE_URL}/lp/${lp.slug}`,
    lastModified: now,
    changeFrequency: 'monthly' as const,
    priority: 0.8,
  }));

  return [...staticEntries, ...treatmentEntries, ...blogEntries, ...lpEntries];
}
