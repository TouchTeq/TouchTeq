import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Hazardous Area Classification in Southern Africa | TouchTeq Insights',
  description:
    'A source-led guide to gas and dust zones, SANS 10108, IEC 60079, equipment selection and South African certification boundaries.',
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
  authors: [{ name: 'Touch Teqniques Engineering' }],
  creator: 'Touch Teqniques Engineering Services',
  publisher: 'Touch Teqniques Engineering Services',
  metadataBase: new URL('https://www.touchteq.co.za'),
  alternates: {
    canonical: '/insights/hazardous-area-classification-southern-africa',
  },
  category: 'technical articles',
  openGraph: {
    type: 'article',
    locale: 'en_ZA',
    url: 'https://www.touchteq.co.za/insights/hazardous-area-classification-southern-africa',
    siteName: 'Touch Teqniques Engineering',
    title: 'Hazardous Area Classification in Southern Africa',
    description:
      'A source-led guide to gas and dust zones, SANS 10108, IEC 60079, equipment selection and South African certification boundaries.',
    images: [
      {
        url: '/HAC.jpg',
        width: 1200,
        height: 630,
        alt: 'Hazardous area classification guide for Southern African industrial facilities',
      },
    ],
    publishedTime: '2024-04-01T00:00:00Z',
    modifiedTime: '2026-08-11T00:00:00+02:00',
    authors: ['Touch Teqniques Engineering'],
    tags: ['Hazardous Areas', 'SANS 10108', 'IEC 60079', 'Explosion-Protected Apparatus'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Hazardous Area Classification in Southern Africa',
    description:
      'A source-led guide to gas and dust zones, SANS 10108, IEC 60079, equipment selection and South African certification boundaries.',
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
