import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Installation and Commissioning Services | Touch Teq',
  description: 'Professional installation and commissioning services for fire and gas detection systems, control systems, and instrumentation. Full loop testing and validation across Southern Africa.',
  keywords: ['installation', 'commissioning', 'loop testing', 'FAT', 'SAT', 'field services', 'system commissioning', 'South Africa'],
  openGraph: {
    title: 'Installation and Commissioning Services | Touch Teq',
    description: 'Professional installation and commissioning services for industrial systems.',
  },
};

export default function InstallationAndCommissioningLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
