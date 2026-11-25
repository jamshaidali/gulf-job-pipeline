import { MetadataRoute } from 'next';
import { careerGuides } from '@/data/careerGuides';

// Refresh the job list in the sitemap at most once an hour.
export const revalidate = 3600;

const BASE_URL = 'https://rateyourcv.com';
const API_URL = process.env.INTERNAL_API_URL || 'http://127.0.0.1:8000';
const MAX_JOBS = 500;

interface JobRow {
  id?: string | number;
}

/** Public jobs, from the same public endpoint the job pages use. Returns [] if the API is unreachable. */
async function fetchJobIds(): Promise<string[]> {
  const ids: string[] = [];
  try {
    for (let page = 1; ids.length < MAX_JOBS && page <= 20; page++) {
      const res = await fetch(`${API_URL}/api/jobs?limit=50&page=${page}`, { next: { revalidate: 3600 } });
      if (!res.ok) break;
      const rows = (await res.json()) as JobRow[];
      if (!Array.isArray(rows) || rows.length === 0) break;
      for (const r of rows) if (r?.id !== undefined && r?.id !== null) ids.push(String(r.id));
      if (rows.length < 50) break;
    }
  } catch {
    return [];
  }
  return Array.from(new Set(ids)).slice(0, MAX_JOBS);
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const coreRoutes: MetadataRoute.Sitemap = [
    { url: BASE_URL, lastModified: now, changeFrequency: 'daily', priority: 1.0 },
    { url: `${BASE_URL}/builder`, lastModified: now, changeFrequency: 'weekly', priority: 0.95 },
    { url: `${BASE_URL}/ats-scanner`, lastModified: now, changeFrequency: 'weekly', priority: 0.95 },
    { url: `${BASE_URL}/templates`, lastModified: now, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${BASE_URL}/guides`, lastModified: now, changeFrequency: 'weekly', priority: 0.85 },
    { url: `${BASE_URL}/register`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE_URL}/login`, lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
  ];

  const guideRoutes: MetadataRoute.Sitemap = careerGuides.map((guide) => ({
    url: `${BASE_URL}/guides/${guide.slug}`,
    lastModified: new Date(guide.publishedISO),
    changeFrequency: 'monthly',
    priority: 0.8,
  }));

  const jobRoutes: MetadataRoute.Sitemap = (await fetchJobIds()).map((id) => ({
    url: `${BASE_URL}/jobs/${encodeURIComponent(id)}`,
    lastModified: now,
    changeFrequency: 'weekly',
    priority: 0.6,
  }));

  return [...coreRoutes, ...guideRoutes, ...jobRoutes];
}
