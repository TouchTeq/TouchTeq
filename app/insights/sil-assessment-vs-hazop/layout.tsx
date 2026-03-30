import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'SIL Assessment vs HAZOP: Understanding the Difference | TouchTeq Insights',
  description:
    'SIL assessments and HAZOPs are both essential but serve different purposes. This guide explains the difference in plain terms for process safety professionals.',
  keywords: [
    'SIL assessment',
    'HAZOP',
    'functional safety',
    'process safety',
    'safety instrumented systems',
    'hazard analysis',
    'risk assessment',
    'South Africa',
  ],
  authors: [{ name: 'Thabo Matona' }],
  creator: 'Touch Teqniques Engineering Services',
  publisher: 'Touch Teqniques Engineering Services',
  metadataBase: new URL('https://touchteq.co.za'),
  alternates: {
    canonical: '/insights/sil-assessment-vs-hazop',
  },
  category: 'technical articles',
  openGraph: {
    type: 'article',
    locale: 'en_ZA',
    url: 'https://touchteq.co.za/insights/sil-assessment-vs-hazop',
    siteName: 'Touch Teq Engineering',
    title: 'SIL Assessment vs HAZOP: Understanding the Difference',
    description:
      'SIL assessments and HAZOPs are both essential but serve different purposes. This guide explains the difference in plain terms for process safety professionals.',
    images: [
      {
        url: '/SIL-HAZOP.jpeg',
        width: 1200,
        height: 630,
        alt: 'SIL Assessment vs HAZOP Comparison',
      },
    ],
    publishedTime: '2024-04-01T00:00:00Z',
    modifiedTime: '2026-03-24T00:00:00Z',
    authors: ['Thabo Matona'],
    tags: ['Functional Safety', 'SIL Assessment', 'HAZOP'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SIL Assessment vs HAZOP: Understanding the Difference',
    description:
      'SIL assessments and HAZOPs are both essential but serve different purposes. This guide explains the difference in plain terms for process safety professionals.',
    images: ['/SIL-HAZOP.jpeg'],
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
