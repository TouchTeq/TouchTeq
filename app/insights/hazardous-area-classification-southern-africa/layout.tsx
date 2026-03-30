import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'A Guide to Hazardous Area Classification in Southern Africa | TouchTeq Insights',
  description:
    'A practical guide to hazardous area classification for Southern African facilities. Covers SANS 10108, IEC 60079, zone classification, and equipment selection requirements.',
  keywords: [
    'hazardous area classification',
    'SANS 10108',
    'IEC 60079',
    'zone classification',
    'explosive atmosphere',
    'equipment protection',
    'industrial safety',
    'South Africa',
  ],
  authors: [{ name: 'Thabo Matona' }],
  creator: 'Touch Teqniques Engineering Services',
  publisher: 'Touch Teqniques Engineering Services',
  metadataBase: new URL('https://touchteq.co.za'),
  alternates: {
    canonical: '/insights/hazardous-area-classification-southern-africa',
  },
  category: 'technical articles',
  openGraph: {
    type: 'article',
    locale: 'en_ZA',
    url: 'https://touchteq.co.za/insights/hazardous-area-classification-southern-africa',
    siteName: 'Touch Teq Engineering',
    title: 'A Guide to Hazardous Area Classification in Southern Africa',
    description:
      'A practical guide to hazardous area classification for Southern African facilities. Covers SANS 10108, IEC 60079, zone classification, and equipment selection requirements.',
    images: [
      {
        url: '/HAC.jpg',
        width: 1200,
        height: 630,
        alt: 'Hazardous Area Classification Guide',
      },
    ],
    publishedTime: '2024-04-01T00:00:00Z',
    modifiedTime: '2026-03-24T00:00:00Z',
    authors: ['Thabo Matona'],
    tags: ['Hazardous Areas', 'SANS 10108', 'IEC 60079'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'A Guide to Hazardous Area Classification in Southern Africa',
    description:
      'A practical guide to hazardous area classification for Southern African facilities. Covers SANS 10108, IEC 60079, zone classification, and equipment selection requirements.',
    images: ['/HAC.jpg'],
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
