import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'HAZOP vs SIL Assessment: Different Questions, One Safety Lifecycle | TouchTeq Insights',
  description:
    'A source-led guide to HAZOP, SIL determination, LOPA, SRS, verification, validation and the South African process-safety context.',
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
  authors: [{ name: 'Touch Teqniques Engineering' }],
  creator: 'Touch Teqniques Engineering Services',
  publisher: 'Touch Teqniques Engineering Services',
  metadataBase: new URL('https://www.touchteq.co.za'),
  alternates: {
    canonical: '/insights/sil-assessment-vs-hazop',
  },
  category: 'technical articles',
  openGraph: {
    type: 'article',
    locale: 'en_ZA',
    url: 'https://www.touchteq.co.za/insights/sil-assessment-vs-hazop',
    siteName: 'Touch Teqniques Engineering',
    title: 'HAZOP vs SIL Assessment: Different Questions, One Safety Lifecycle',
    description:
      'A source-led guide to HAZOP, SIL determination, LOPA, SRS, verification, validation and the South African process-safety context.',
    images: [
      {
        url: '/SIL-HAZOP.jpeg',
        width: 1200,
        height: 630,
        alt: 'HAZOP and SIL assessment shown as connected process-safety activities',
      },
    ],
    publishedTime: '2024-04-01T00:00:00Z',
    modifiedTime: '2026-08-11T00:00:00+02:00',
    authors: ['Touch Teqniques Engineering'],
    tags: ['Functional Safety', 'HAZOP', 'SIL Determination', 'LOPA'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'HAZOP vs SIL Assessment: Different Questions, One Safety Lifecycle',
    description:
      'A source-led guide to HAZOP, SIL determination, LOPA, SRS, verification, validation and the South African process-safety context.',
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
