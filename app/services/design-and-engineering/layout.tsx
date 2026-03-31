import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Design and Engineering Services | Touch Teq',
  description: 'Specialist engineering design services for industrial facilities. Documentation, CAD drawings, safety studies, and technical specifications for fire protection and process safety.',
  keywords: ['engineering design', 'industrial design', 'CAD drawings', 'technical documentation', 'safety studies', 'engineering documentation', 'South Africa'],
  openGraph: {
    title: 'Design and Engineering Services | Touch Teq',
    description: 'Specialist engineering design services for industrial facilities.',
  },
};

export default function DesignAndEngineeringLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
