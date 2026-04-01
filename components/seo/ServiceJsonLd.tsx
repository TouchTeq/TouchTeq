'use client';

import JsonLd from './JsonLd';

interface ServiceJsonLdProps {
  name: string;
  description: string;
  url: string;
  serviceType: string[];
  areaServed?: string[];
  image?: string;
}

export default function ServiceJsonLd({
  name,
  description,
  url,
  serviceType,
  areaServed = ['South Africa', 'Mozambique', 'Botswana', 'Namibia', 'Zimbabwe'],
  image = 'https://touchteq.co.za/TT-logo-orange-trans.png'
}: ServiceJsonLdProps) {
  return (
    <JsonLd
      data={{
        '@context': 'https://schema.org',
        '@type': 'Service',
        name,
        description,
        url,
        provider: {
          '@type': 'ProfessionalService',
          name: 'Touch Teqniques Engineering Services',
          url: 'https://touchteq.co.za',
        },
        serviceType,
        areaServed: areaServed.map(country => ({
          '@type': 'Country',
          name: country,
        })),
        image,
      }}
    />
  );
}
