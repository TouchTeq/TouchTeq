import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Five Common Causes of False Alarms in Optical Flame Detectors | TouchTeq Insights',
  description:
    'A source-led guide to optical flame-detector interference, diagnostics, safe troubleshooting, maintenance and the limits of universal fixes.',
  keywords: [
    'flame detector false alarms',
    'optical flame detection',
    'fire and gas detection',
    'false alarm causes',
    'industrial fire protection',
    'flame detector maintenance',
    'South Africa',
  ],
  authors: [{ name: 'Touch Teqniques Engineering' }],
  creator: 'Touch Teqniques Engineering Services',
  publisher: 'Touch Teqniques Engineering Services',
  metadataBase: new URL('https://www.touchteq.co.za'),
  alternates: {
    canonical: '/insights/flame-detector-false-alarms',
  },
  category: 'technical articles',
  openGraph: {
    type: 'article',
    locale: 'en_ZA',
    url: 'https://www.touchteq.co.za/insights/flame-detector-false-alarms',
    siteName: 'Touch Teqniques Engineering',
    title: 'Five Common Causes of False Alarms in Optical Flame Detectors',
    description:
      'A source-led guide to optical interference, diagnostics, safe troubleshooting and maintenance without compromising detector coverage.',
    images: [
      {
        url: '/optical-flame-detector.jpeg',
        width: 1200,
        height: 630,
        alt: 'Industrial optical flame detector installed in a process facility',
      },
    ],
    publishedTime: '2024-04-01T00:00:00Z',
    modifiedTime: '2026-08-11T00:00:00+02:00',
    authors: ['Touch Teqniques Engineering'],
    tags: ['Fire & Gas', 'Flame Detectors', 'Troubleshooting', 'Maintenance'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Five Common Causes of False Alarms in Optical Flame Detectors',
    description:
      'A source-led guide to optical interference, diagnostics and safe troubleshooting without compromising detector coverage.',
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
