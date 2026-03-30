import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Fire and Gas System Commissioning: What to Expect | TouchTeq Insights',
  description:
    'Find out what a professional fire and gas system commissioning involves, what to prepare, and what to expect at each stage of the process.',
  keywords: [
    'fire and gas commissioning',
    'F&G system',
    'IEC 61511',
    'pre-startup safety review',
    'PSSR',
    'fire detection',
    'gas detection',
    'commissioning process',
    'industrial safety',
    'South Africa',
  ],
  authors: [{ name: 'Thabo Matona' }],
  creator: 'Touch Teqniques Engineering Services',
  publisher: 'Touch Teqniques Engineering Services',
  metadataBase: new URL('https://touchteq.co.za'),
  alternates: {
    canonical: '/insights/fire-and-gas-system-commissioning',
  },
  category: 'technical articles',
  openGraph: {
    type: 'article',
    locale: 'en_ZA',
    url: 'https://touchteq.co.za/insights/fire-and-gas-system-commissioning',
    siteName: 'Touch Teq Engineering',
    title: 'Fire and Gas System Commissioning: What to Expect',
    description:
      'Find out what a professional fire and gas system commissioning involves, what to prepare, and what to expect at each stage of the process.',
    images: [
      {
        url: '/f&g.jpeg',
        width: 1200,
        height: 630,
        alt: 'Fire and Gas System Commissioning',
      },
    ],
    publishedTime: '2024-04-01T00:00:00Z',
    modifiedTime: '2026-03-24T00:00:00Z',
    authors: ['Thabo Matona'],
    tags: ['Fire & Gas', 'Commissioning', 'IEC 61511'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Fire and Gas System Commissioning: What to Expect',
    description:
      'Find out what a professional fire and gas system commissioning involves, what to prepare, and what to expect at each stage of the process.',
    images: ['/f&g.jpeg'],
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
