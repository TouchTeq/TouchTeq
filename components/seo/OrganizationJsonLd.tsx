import React from 'react';

interface OrganizationJsonLdProps {
  name: string;
  url: string;
  logo?: string;
  description?: string;
  address?: {
    streetAddress: string;
    addressLocality: string;
    addressRegion: string;
    postalCode: string;
    addressCountry: string;
  };
  contactPoint?: {
    telephone: string;
    contactType: string;
    areaServed?: string | string[];
    availableLanguage?: string | string[];
  };
  sameAs?: string[];
}

const OrganizationJsonLd: React.FC<OrganizationJsonLdProps> = ({
  name,
  url,
  logo,
  description,
  address,
  contactPoint,
  sameAs,
}) => {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name,
    url,
    logo,
    description,
    address: address ? {
      '@type': 'PostalAddress',
      ...address,
    } : undefined,
    contactPoint: contactPoint ? {
      '@type': 'ContactPoint',
      ...contactPoint,
    } : undefined,
    sameAs,
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
};

export default OrganizationJsonLd;
