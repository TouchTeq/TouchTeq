import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'About Touch Teq Engineering | Specialist Fire & Gas Detection Engineering',
  description:
    'Touch Teq Engineering is a specialist industrial engineering firm delivering fire and gas detection, control and instrumentation, electrical engineering, and hazardous area classification services across Southern Africa.',
  keywords: [
    'about Touch Teq',
    'fire and gas detection engineering',
    'control and instrumentation',
    'hazardous area classification',
    'industrial engineering',
    'South Africa',
    'SADC',
    'ECSA registered',
    'functional safety',
  ],
  authors: [{ name: 'Touch Teqniques Engineering Services' }],
  creator: 'Touch Teqniques Engineering Services',
  publisher: 'Touch Teqniques Engineering Services',
  metadataBase: new URL('https://touchteq.co.za'),
  alternates: {
    canonical: '/about',
  },
  category: 'about',
  openGraph: {
    type: 'website',
    locale: 'en_ZA',
    url: 'https://touchteq.co.za/about',
    siteName: 'Touch Teq Engineering',
    title: 'About Touch Teq Engineering | Specialist Fire & Gas Detection Engineering',
    description:
      'Touch Teq Engineering is a specialist industrial engineering firm delivering fire and gas detection, control and instrumentation, electrical engineering, and hazardous area classification services across Southern Africa.',
    images: [
      {
        url: '/TT-logo-orange-trans.png',
        width: 1200,
        height: 630,
        alt: 'Touch Teq Engineering',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'About Touch Teq Engineering | Specialist Fire & Gas Detection Engineering',
    description:
      'Touch Teq Engineering is a specialist industrial engineering firm delivering fire and gas detection, control and instrumentation, electrical engineering, and hazardous area classification services across Southern Africa.',
    images: ['/TT-logo-orange-trans.png'],
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
