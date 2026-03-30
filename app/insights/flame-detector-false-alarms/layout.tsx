import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Top 5 Reasons for False Alarms in Optical Flame Detectors | TouchTeq Insights',
  description:
    'False alarms in optical flame detection systems cost time and money. Discover the five most common causes and how to eliminate them in your facility.',
  keywords: [
    'flame detector false alarms',
    'optical flame detection',
    'fire and gas detection',
    'false alarm causes',
    'industrial fire protection',
    'flame detector maintenance',
    'South Africa',
  ],
  authors: [{ name: 'Thabo Matona' }],
  creator: 'Touch Teqniques Engineering Services',
  publisher: 'Touch Teqniques Engineering Services',
  metadataBase: new URL('https://touchteq.co.za'),
  alternates: {
    canonical: '/insights/flame-detector-false-alarms',
  },
  category: 'technical articles',
  openGraph: {
    type: 'article',
    locale: 'en_ZA',
    url: 'https://touchteq.co.za/insights/flame-detector-false-alarms',
    siteName: 'Touch Teq Engineering',
    title: 'Top 5 Reasons for False Alarms in Optical Flame Detectors',
    description:
      'False alarms in optical flame detection systems cost time and money. Discover the five most common causes and how to eliminate them in your facility.',
    images: [
      {
        url: '/optical-flame-detector.jpeg',
        width: 1200,
        height: 630,
        alt: 'Optical Flame Detector False Alarms',
      },
    ],
    publishedTime: '2024-04-01T00:00:00Z',
    modifiedTime: '2026-03-24T00:00:00Z',
    authors: ['Thabo Matona'],
    tags: ['Fire & Gas', 'Flame Detectors', 'Maintenance'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Top 5 Reasons for False Alarms in Optical Flame Detectors',
    description:
      'False alarms in optical flame detection systems cost time and money. Discover the five most common causes and how to eliminate them in your facility.',
    images: ['/optical-flame-detector.jpeg'],
    creator: '@TouchTeqniques',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
