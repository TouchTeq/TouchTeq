import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://touchteq.co.za';
  const reviewedAt = new Date('2026-03-24T00:00:00Z');
  const articleReviewedAt = new Date('2026-03-24T00:00:00Z');

  return [
    { url: baseUrl, lastModified: reviewedAt, changeFrequency: 'weekly', priority: 1 },
    { url: `${baseUrl}/about`, lastModified: reviewedAt, changeFrequency: 'monthly', priority: 0.9 },
    { url: `${baseUrl}/contact`, lastModified: reviewedAt, changeFrequency: 'monthly', priority: 0.9 },
    { url: `${baseUrl}/risk-assessment`, lastModified: reviewedAt, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${baseUrl}/insights`, lastModified: reviewedAt, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${baseUrl}/downloads`, lastModified: reviewedAt, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${baseUrl}/industries`, lastModified: reviewedAt, changeFrequency: 'monthly', priority: 0.8 },

    // Services
    { url: `${baseUrl}/services/fire-and-gas-detection`, lastModified: reviewedAt, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${baseUrl}/services/control-and-instrumentation`, lastModified: reviewedAt, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${baseUrl}/services/electrical-engineering`, lastModified: reviewedAt, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${baseUrl}/services/hazardous-area-classification`, lastModified: reviewedAt, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${baseUrl}/services/design-and-engineering`, lastModified: reviewedAt, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${baseUrl}/services/installation-and-commissioning`, lastModified: reviewedAt, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${baseUrl}/services/maintenance-and-support`, lastModified: reviewedAt, changeFrequency: 'monthly', priority: 0.8 },

    // Insight Articles
    { url: `${baseUrl}/insights/iec-61511-plant-managers`, lastModified: articleReviewedAt, changeFrequency: 'yearly', priority: 0.7 },
    { url: `${baseUrl}/insights/hazardous-area-classification-southern-africa`, lastModified: articleReviewedAt, changeFrequency: 'yearly', priority: 0.7 },
    { url: `${baseUrl}/insights/flame-detector-false-alarms`, lastModified: articleReviewedAt, changeFrequency: 'yearly', priority: 0.7 },
    { url: `${baseUrl}/insights/sil-assessment-vs-hazop`, lastModified: articleReviewedAt, changeFrequency: 'yearly', priority: 0.7 },
    { url: `${baseUrl}/insights/fire-and-gas-system-commissioning`, lastModified: articleReviewedAt, changeFrequency: 'yearly', priority: 0.7 },

    // Legal
    { url: `${baseUrl}/terms`, lastModified: reviewedAt, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${baseUrl}/privacy`, lastModified: reviewedAt, changeFrequency: 'yearly', priority: 0.3 },
  ];
}
