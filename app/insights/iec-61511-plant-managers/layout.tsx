import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'IEC 61511 in South Africa: A Plant Manager Guide | TouchTeq Insights',
  description:
    'A practical guide to IEC 61511, the SIS lifecycle, SIL, proof testing and how the standard relates to South Africa’s Major Hazard Installation Regulations.',
  keywords: [
    'IEC 61511',
    'safety instrumented systems',
    'SIL assessment',
    'functional safety',
    'process safety',
    'OHS Act',
    'plant managers',
    'South Africa',
  ],
  authors: [{ name: 'Thabo Matona' }],
  creator: 'Touch Teqniques Engineering Services',
  publisher: 'Touch Teqniques Engineering Services',
  metadataBase: new URL('https://www.touchteq.co.za'),
  alternates: {
    canonical: '/insights/iec-61511-plant-managers',
  },
  category: 'functional safety',
  openGraph: {
    type: 'article',
    locale: 'en_ZA',
    url: 'https://www.touchteq.co.za/insights/iec-61511-plant-managers',
    siteName: 'Touch Teqniques Engineering',
    title: 'IEC 61511 in South Africa: What Plant Managers Need to Know',
    description:
      'A practical guide to the SIS lifecycle, SIL, proof testing and South Africa’s Major Hazard Installation regulatory context.',
    images: [
      {
        url: '/IEC.jpeg',
        width: 1200,
        height: 630,
        alt: 'IEC 61511 Guide for Plant Managers',
      },
    ],
    publishedTime: '2024-04-01T00:00:00Z',
    modifiedTime: '2026-08-11T00:00:00+02:00',
    authors: ['Thabo Matona'],
    tags: ['Functional Safety', 'IEC 61511', 'Safety Instrumented Systems'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'IEC 61511 in South Africa: What Plant Managers Need to Know',
    description:
      'A practical guide to the SIS lifecycle, SIL, proof testing and South Africa’s Major Hazard Installation regulatory context.',
    images: ['/IEC.jpeg'],
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
