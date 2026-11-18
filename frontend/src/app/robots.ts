import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/builder', '/ats-scanner', '/templates', '/guides', '/guides/*', '/login', '/register'],
        disallow: ['/app', '/api/*'],
      },
    ],
    sitemap: 'https://gulf-job-pipeline.vercel.app/sitemap.xml',
  };
}
