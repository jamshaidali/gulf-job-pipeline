import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/builder', '/ats-scanner', '/templates', '/guides', '/guides/*', '/login', '/register', '/privacy', '/terms', '/contact'],
        disallow: ['/app', '/api/*'],
      },
    ],
    sitemap: 'https://rateyourcv.com/sitemap.xml',
  };
}
