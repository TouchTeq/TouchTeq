import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Electrical Engineering Services | Touch Teq',
  description: 'Industrial electrical engineering services including system design, power distribution, lighting, and earthing for mining, oil & gas, and manufacturing facilities across Southern Africa.',
  keywords: ['electrical engineering', 'industrial electrical', 'power distribution', 'lighting design', 'earthing', 'mining electrical', 'South Africa'],
  openGraph: {
    title: 'Electrical Engineering Services | Touch Teq',
    description: 'Industrial electrical engineering services across Southern Africa.',
  },
};

export default function ElectricalEngineeringLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
