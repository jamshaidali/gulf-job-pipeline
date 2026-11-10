import { MetadataRoute } from 'next';

export const dynamic = 'force-dynamic';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://talentradar.ai';

  const routes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/jobs`,
      lastModified: new Date(),
      changeFrequency: 'hourly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/guides`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/guides/how-pakistanis-land-uae-tech-jobs`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/guides/saudi-arabia-vision-2030-hiring-guide`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/guides/ats-cv-optimization-checklist-gulf`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/login`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.3,
    },
    {
      url: `${baseUrl}/register`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
  ];

  try {
    const res = await fetch('http://127.0.0.1:8000/api/jobs?limit=200', {
      cache: 'no-store',
    });
    if (res.ok) {
      const jobs = await res.json();
      const jobUrls: MetadataRoute.Sitemap = jobs.map((j: { id: string; posted_date?: string }) => ({
        url: `${baseUrl}/jobs/${j.id}`,
        lastModified: j.posted_date ? new Date(j.posted_date) : new Date(),
        changeFrequency: 'weekly',
        priority: 0.7,
      }));
      return [...routes, ...jobUrls];
    }
  } catch {
    // If backend is unreachable during build, fallback to core routes
  }

  return routes;
}
