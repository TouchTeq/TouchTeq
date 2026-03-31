import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Fire and Gas Detection Systems | Touch Teq',
  description: 'Expert fire and gas detection system design, installation, commissioning and maintenance for industrial facilities across Southern Africa. IEC 61511 compliant.',
  keywords: ['fire detection', 'gas detection', 'F&G detection', 'flame detectors', 'smoke detectors', 'gas monitors', 'industrial fire safety', 'IEC 61511', 'South Africa'],
  openGraph: {
    title: 'Fire and Gas Detection Systems | Touch Teq',
    description: 'Expert fire and gas detection system design, installation, commissioning and maintenance for industrial facilities across Southern Africa.',
  },
};

export default function FireAndGasDetectionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
