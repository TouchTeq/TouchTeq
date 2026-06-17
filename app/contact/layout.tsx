import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Contact Touch Teqniques Engineering | Get in Touch With Our Engineering Team',
  description:
    'Contact Touch Teqniques Engineering for fire and gas detection, control and instrumentation, electrical engineering, and hazardous area classification services across Southern Africa.',
  keywords: [
    'contact Touch Teqniques Engineering',
    'fire and gas detection',
    'control and instrumentation',
    'hazardous area classification',
    'industrial engineering',
    'South Africa',
    'SADC',
    'engineering consultation',
    'request a quote',
  ],
  authors: [{ name: 'Touch Teqniques Engineering Services' }],
  creator: 'Touch Teqniques Engineering Services',
  publisher: 'Touch Teqniques Engineering Services',
  metadataBase: new URL('https://www.touchteq.co.za'),
  alternates: {
    canonical: '/contact',
  },
  category: 'contact',
  openGraph: {
    type: 'website',
    locale: 'en_ZA',
    url: 'https://www.touchteq.co.za/contact',
    siteName: 'Touch Teqniques Engineering',
    title: 'Contact Touch Teqniques Engineering | Get in Touch With Our Engineering Team',
    description:
      'Contact Touch Teqniques Engineering for fire and gas detection, control and instrumentation, electrical engineering, and hazardous area classification services across Southern Africa.',
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
    title: 'Contact Touch Teqniques Engineering | Get in Touch With Our Engineering Team',
    description:
      'Contact Touch Teqniques Engineering for fire and gas detection, control and instrumentation, electrical engineering, and hazardous area classification services across Southern Africa.',
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

