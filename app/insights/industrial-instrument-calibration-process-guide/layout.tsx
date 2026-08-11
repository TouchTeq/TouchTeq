import type { Metadata } from 'next';

const title = 'Industrial Instrument Calibration Process Guide | Touch Teq';
const description =
  'A practical guide to pressure, temperature and flow calibration: the process, test scope, ultrasonic limitations, reporting and what clients should prepare.';

export const metadata: Metadata = {
  title,
  description,
  keywords: [
    'industrial instrument calibration South Africa',
    'instrument calibration process',
    'pressure calibration',
    'temperature calibration',
    'flow meter calibration',
    'ultrasonic flow measurement',
    'calibration vs adjustment',
    'calibration scope',
  ],
  authors: [{ name: 'Touch Teqniques Engineering' }],
  creator: 'Touch Teqniques Engineering',
  publisher: 'Touch Teqniques Engineering',
  metadataBase: new URL('https://www.touchteq.co.za'),
  alternates: {
    canonical: '/insights/industrial-instrument-calibration-process-guide',
  },
  category: 'technical articles',
  openGraph: {
    type: 'article',
    locale: 'en_ZA',
    url: 'https://www.touchteq.co.za/insights/industrial-instrument-calibration-process-guide',
    siteName: 'Touch Teqniques Engineering',
    title,
    description,
    images: [
      {
        url: '/insights/industrial-instrument-calibration-process-guide.webp',
        width: 1800,
        height: 1005,
        alt: 'Industrial instrument calibration process guide',
      },
    ],
    publishedTime: '2026-08-11T00:00:00+02:00',
    modifiedTime: '2026-08-11T00:00:00+02:00',
    authors: ['Touch Teqniques Engineering'],
    tags: ['Instrument Calibration', 'Pressure', 'Temperature', 'Flow'],
  },
  twitter: {
    card: 'summary_large_image',
    title,
    description,
    images: ['/insights/industrial-instrument-calibration-process-guide.webp'],
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
