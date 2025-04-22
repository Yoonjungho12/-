export default function robots() {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/master/'],
      },
    ],
    sitemap: 'https://yeogidot.com/sitemap.xml',
  };
} 