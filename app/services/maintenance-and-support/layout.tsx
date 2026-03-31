import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Maintenance and Support Services | Touch Teq',
  description: '24/7 maintenance and support services for fire and gas detection systems, control systems, and instrumentation. Preventative maintenance, emergency repairs, and technical support across Southern Africa.',
  keywords: ['maintenance', 'support', '24/7 support', 'emergency repairs', 'preventative maintenance', 'system support', 'field services', 'South Africa'],
  openGraph: {
    title: 'Maintenance and Support Services | Touch Teq',
    description: '24/7 maintenance and support services for industrial systems.',
  },
};

export default function MaintenanceAndSupportLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
