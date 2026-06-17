import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Equipment | Touch Teqniques Engineering',
  description:
    'Industrial fire and gas detection equipment from GDSCorp — wireless gas detectors, alarm controllers, and system accessories — specified, supplied, installed, and maintained by Touch Teqniques Engineering across Southern Africa.',
  keywords: [
    'gas detection equipment',
    'GDSCorp',
    'wireless gas detectors',
    'GASMAX',
    'GDS-75N',
    'GDS-98RF',
    'industrial gas monitors',
    'South Africa',
  ],
  openGraph: {
    title: 'Equipment | Touch Teqniques Engineering',
    description:
      'Industrial fire and gas detection equipment from GDSCorp — specified, supplied, installed, and maintained by Touch Teqniques Engineering.',
  },
};

export default function EquipmentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
