import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Technical Insights for Industrial Engineers | Touch Teqniques Engineering',
  description:
    'Practical articles and regulatory updates written by engineers who work in the same environments you manage. No filler. No generic safety advice. Content that is relevant to the decisions you make and the standards you are held to.',
  keywords: [
    'technical insights',
    'industrial engineering',
    'fire and gas detection',
    'control and instrumentation',
    'hazardous area classification',
    'functional safety',
    'IEC 61511',
    'South Africa',
    'engineering articles',
  ],
  authors: [{ name: 'Touch Teqniques Engineering Services' }],
  creator: 'Touch Teqniques Engineering Services',
  publisher: 'Touch Teqniques Engineering Services',
  metadataBase: new URL('https://www.touchteq.co.za'),
  alternates: {
    canonical: '/insights',
  },
  category: 'insights',
  openGraph: {
    type: 'website',
    locale: 'en_ZA',
    url: 'https://www.touchteq.co.za/insights',
    siteName: 'Touch Teqniques Engineering',
    title: 'Technical Insights for Industrial Engineers | Touch Teqniques Engineering',
    description:
      'Practical articles and regulatory updates written by engineers who work in the same environments you manage. No filler. No generic safety advice. Content that is relevant to the decisions you make and the standards you are held to.',
    images: [
      {
        url: '/touch-teq-logo-wordmark.jpeg',
        width: 1200,
        height: 630,
        alt: 'Touch Teqniques Engineering',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Technical Insights for Industrial Engineers | Touch Teqniques Engineering',
    description:
      'Practical articles and regulatory updates written by engineers who work in the same environments you manage. No filler. No generic safety advice. Content that is relevant to the decisions you make and the standards you are held to.',
    images: ['/touch-teq-logo-wordmark.jpeg'],
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

