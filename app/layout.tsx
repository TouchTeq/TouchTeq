import type {Metadata} from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import LenisProvider from '@/components/LenisProvider';
import CustomCursor from '@/components/CustomCursor';
import CookieConsentBanner from '@/components/CookieConsentBanner';
import ConditionalGA4 from '@/components/ConditionalGA4';
import JsonLd from '@/components/seo/JsonLd';
import { SpeedInsights } from '@vercel/speed-insights/next';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
});

export const metadata: Metadata = {
  title: 'Touch Teq | Specialist Fire & Gas Detection Engineering | South Africa',
  description: 'Specialist engineering partner for fire and gas detection, hazardous area classification, and control & instrumentation in safety-critical industrial environments across Southern Africa.',
  keywords: [
    'fire and gas detection',
    'hazardous area classification',
    'control and instrumentation',
    'IEC 61511',
    'functional safety',
    'SIL assessment',
    'industrial engineering',
    'South Africa',
    'SADC',
    'mining safety',
    'oil and gas',
    'petrochemical',
  ],
  authors: [{ name: 'Touch Teqniques Engineering Services' }],
  creator: 'Touch Teqniques Engineering Services',
  publisher: 'Touch Teqniques Engineering Services',
  metadataBase: new URL('https://touchteq.co.za'),
  alternates: {
    canonical: '/',
    languages: {
      'en-ZA': '/',
      'en': '/',
    },
  },
  category: 'industrial engineering',
  openGraph: {
    type: 'website',
    locale: 'en_ZA',
    url: 'https://touchteq.co.za',
    siteName: 'Touch Teq Engineering',
    title: 'Touch Teq | Specialist Fire & Gas Detection Engineering',
    description: 'Specialist engineering partner for fire and gas detection, hazardous area classification, and control & instrumentation across Southern Africa.',
    images: [
      {
        url: '/TT-logo-orange-trans.png',
        width: 1200,
        height: 630,
        alt: 'Touch Teq Engineering',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Touch Teq | Specialist Fire & Gas Detection Engineering',
    description: 'Specialist engineering partner for fire and gas detection, hazardous area classification, and control & instrumentation across Southern Africa.',
    images: ['/TT-logo-orange-trans.png'],
    creator: '@TouchTeqniques',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en" data-scroll-behavior="smooth" suppressHydrationWarning className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <body suppressHydrationWarning className="font-sans antialiased text-slate-900 bg-white cursor-none">
        <JsonLd
          data={[
            {
              '@context': 'https://schema.org',
              '@type': 'ProfessionalService',
              '@id': 'https://touchteq.co.za/#professional-service',
              name: 'Touch Teqniques Engineering Services',
              alternateName: 'Touch Teq Engineering',
              url: 'https://touchteq.co.za',
              logo: 'https://touchteq.co.za/TT-logo-orange-trans.png',
              image: 'https://touchteq.co.za/TT-logo-orange-trans.png',
              description: 'Specialist engineering partner for fire and gas detection, hazardous area classification, and control & instrumentation in safety-critical industrial environments across Southern Africa.',
              address: {
                '@type': 'PostalAddress',
                streetAddress: '91 Sir George Grey St',
                addressLocality: 'Horizon, Roodepoort',
                addressRegion: 'Gauteng',
                postalCode: '1724',
                addressCountry: 'ZA',
              },
              geo: {
                '@type': 'GeoCoordinates',
                latitude: '-26.1715',
                longitude: '27.8725',
              },
              telephone: '+27-72-552-2110',
              email: 'info@touchteq.co.za',
              areaServed: [
                { '@type': 'Country', name: 'South Africa' },
                { '@type': 'Country', name: 'Botswana' },
                { '@type': 'Country', name: 'Mozambique' },
                { '@type': 'Country', name: 'Namibia' },
                { '@type': 'Country', name: 'Zimbabwe' },
              ],
              serviceType: [
                'Fire and Gas Detection Systems',
                'Control and Instrumentation Engineering',
                'Hazardous Area Classification',
                'SIL Assessment',
                'IEC 61511 Compliance',
                'Industrial Electrical Engineering',
              ],
              priceRange: '$$$$',
              paymentAccepted: 'Cash, Credit Card, Bank Transfer, Invoice',
              currenciesAccepted: 'ZAR',
              sameAs: [
                'https://www.linkedin.com/company/touch-teqniques-engineering-services/',
                'https://www.facebook.com/TouchTeqniques',
                'https://x.com/TouchTeqniques',
              ],
              founder: {
                '@id': 'https://touchteq.co.za/#thabo-matona',
              },
              contactPoint: [
                {
                  '@type': 'ContactPoint',
                  contactType: 'sales',
                  telephone: '+27-72-552-2110',
                  email: 'info@touchteq.co.za',
                  availableLanguage: ['en'],
                  areaServed: 'ZA',
                },
              ],
              openingHoursSpecification: {
                '@type': 'OpeningHoursSpecification',
                dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
                opens: '08:00',
                closes: '17:00',
              },
            },
            {
              '@context': 'https://schema.org',
              '@type': 'WebSite',
              '@id': 'https://touchteq.co.za/#website',
              url: 'https://touchteq.co.za',
              name: 'Touch Teq Engineering',
              inLanguage: 'en-ZA',
              publisher: {
                '@id': 'https://touchteq.co.za/#professional-service',
              },
            },
            {
              '@context': 'https://schema.org',
              '@type': 'Person',
              '@id': 'https://touchteq.co.za/#thabo-matona',
              name: 'Thabo Matona',
              jobTitle: 'Founder and Principal Engineer',
              url: 'https://touchteq.co.za/about',
              worksFor: {
                '@id': 'https://touchteq.co.za/#professional-service',
              },
              knowsAbout: [
                'Fire and gas detection systems',
                'Hazardous area classification',
                'Control and instrumentation engineering',
                'Electrical engineering',
                'Functional safety',
              ],
            },
          ]}
        />
        <LenisProvider>
          <CustomCursor />
          {children}
          <CookieConsentBanner />
        </LenisProvider>
        <ConditionalGA4 />
        <SpeedInsights />
      </body>
    </html>
  );
}
