import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/jobs', '/jobs/*'],
        disallow: ['/app', '/api/*'],
      },
    ],
    sitemap: 'https://talentradar.ai/sitemap.xml',
  };
}
