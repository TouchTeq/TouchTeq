import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Fire and Gas System Commissioning: What Handover Must Prove | TouchTeq Insights',
  description:
    'A source-led guide to F&G commissioning stages, cause-and-effect testing, detector procedures, inhibit control and handover evidence in South Africa.',
  keywords: [
    'fire and gas commissioning',
    'F&G system',
    'cause and effect testing',
    'detector commissioning',
    'FAT and SAT',
    'loop checking',
    'inhibit control',
    'pre-startup safety review',
    'PSSR',
    'fire detection',
    'gas detection',
    'commissioning process',
    'industrial safety',
    'South Africa',
  ],
  authors: [{ name: 'Touch Teqniques Engineering' }],
  creator: 'Touch Teqniques Engineering Services',
  publisher: 'Touch Teqniques Engineering Services',
  metadataBase: new URL('https://www.touchteq.co.za'),
  alternates: {
    canonical: '/insights/fire-and-gas-system-commissioning',
  },
  category: 'technical articles',
  openGraph: {
    type: 'article',
    locale: 'en_ZA',
    url: 'https://www.touchteq.co.za/insights/fire-and-gas-system-commissioning',
    siteName: 'Touch Teqniques Engineering',
    title: 'Fire and Gas System Commissioning: What a Credible Handover Must Prove',
    description:
      'A source-led guide to F&G commissioning stages, cause-and-effect testing, detector procedures, inhibit control and handover evidence.',
    images: [
      {
        url: '/f&g.jpeg',
        width: 1200,
        height: 630,
        alt: 'Engineer commissioning an industrial fire and gas control system',
      },
    ],
    publishedTime: '2026-08-11T00:00:00+02:00',
    modifiedTime: '2026-08-11T00:00:00+02:00',
    authors: ['Touch Teqniques Engineering'],
    tags: ['Fire & Gas', 'Commissioning', 'Cause & Effect'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Fire and Gas System Commissioning: What Handover Must Prove',
    description:
      'A source-led guide to commissioning stages, detector procedures, cause-and-effect testing and handover evidence.',
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
