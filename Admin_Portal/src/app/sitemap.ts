import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
    const baseUrl = 'https://elitestitchworld.com';

    // Core pages
    const routes = [
        '',
        '/designs',
        '/order',
        '/track',
        '/reviews',
        '/contact',
        '/privacy',
        '/terms',
        '/refund',
    ].map((route) => ({
        url: `${baseUrl}${route}`,
        lastModified: new Date(),
        changeFrequency: 'weekly' as const,
        priority: route === '' ? 1 : 0.8,
    }));

    return routes;
}
