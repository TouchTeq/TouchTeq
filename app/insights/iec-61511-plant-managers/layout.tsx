import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Understanding IEC 61511: What Plant Managers in South Africa Need to Know | TouchTeq Insights',
  description:
    'IEC 61511 governs safety instrumented systems across South African process plants. Learn what plant managers need to know about SIL, SIS design, and OHS Act compliance.',
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
  metadataBase: new URL('https://touchteq.co.za'),
  alternates: {
    canonical: '/insights/iec-61511-plant-managers',
  },
  category: 'regulatory updates',
  openGraph: {
    type: 'article',
    locale: 'en_ZA',
    url: 'https://touchteq.co.za/insights/iec-61511-plant-managers',
    siteName: 'Touch Teq Engineering',
    title: 'Understanding IEC 61511: What Plant Managers in South Africa Need to Know',
    description:
      'IEC 61511 governs safety instrumented systems across South African process plants. Learn what plant managers need to know about SIL, SIS design, and OHS Act compliance.',
    images: [
      {
        url: '/IEC.jpeg',
        width: 1200,
        height: 630,
        alt: 'IEC 61511 Guide for Plant Managers',
      },
    ],
    publishedTime: '2024-04-01T00:00:00Z',
    modifiedTime: '2026-03-24T00:00:00Z',
    authors: ['Thabo Matona'],
    tags: ['Functional Safety', 'IEC 61511', 'Safety Instrumented Systems'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Understanding IEC 61511: What Plant Managers in South Africa Need to Know',
    description:
      'IEC 61511 governs safety instrumented systems across South African process plants. Learn what plant managers need to know about SIL, SIS design, and OHS Act compliance.',
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
