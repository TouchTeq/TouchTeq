import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Hazardous Area Classification | Touch Teq',
  description: 'Expert hazardous area classification services for industrial facilities. SANS 10108 and IEC 60079 compliant explosive atmosphere zoning for refineries, chemical plants, and mining operations.',
  keywords: ['hazardous area classification', 'HAC', 'ATEX', 'IECEx', 'explosive atmosphere', 'SANS 10108', 'area classification', 'South Africa'],
  openGraph: {
    title: 'Hazardous Area Classification | Touch Teq',
    description: 'Expert hazardous area classification services for industrial facilities.',
  },
};

export default function HazardousAreaClassificationLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
