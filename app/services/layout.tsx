import type { Metadata } from 'next';
import JsonLd from '@/components/seo/JsonLd';

export const metadata: Metadata = {
  title: 'Engineering Services | Touch Teq',
  description: 'Specialist engineering services for fire and gas detection, hazardous area classification, and control & instrumentation in safety-critical industrial environments across Southern Africa.',
};

export default function ServicesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <JsonLd data={[
        {
          '@context': 'https://schema.org',
          '@type': 'Service',
          '@id': 'https://touchteq.co.za/services',
          name: 'Engineering Services',
          provider: {
            '@id': 'https://touchteq.co.za/#professional-service',
          },
          serviceType: [
            'Fire and Gas Detection Systems',
            'Control and Instrumentation Engineering',
            'Hazardous Area Classification',
            'SIL Assessment',
            'IEC 61511 Compliance',
            'Industrial Electrical Engineering',
          ],
          areaServed: [
            { '@type': 'Country', name: 'South Africa' },
            { '@type': 'Country', name: 'Botswana' },
            { '@type': 'Country', name: 'Mozambique' },
            { '@type': 'Country', name: 'Namibia' },
            { '@type': 'Country', name: 'Zimbabwe' },
          ],
        }
      ]} />
      {children}
    </>
  );
}
