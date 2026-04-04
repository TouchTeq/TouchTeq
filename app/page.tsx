'use client';

import Header from '@/components/Header';
import Hero from '@/components/Hero';
import AboutSection from '@/components/AboutSection';
import ServicesSection from '@/components/ServicesSection';
import ExpertiseSection from '@/components/ExpertiseSection';
import IndustriesCarousel from '@/components/IndustriesCarousel';
import { Gallery6 } from '@/components/Gallery6';
import WhyChooseUs from '@/components/WhyChooseUs';
import Testimonials from '@/components/Testimonials';
import FAQ from '@/components/FAQ';
import ContactSection from '@/components/ContactSection';
import Footer from '@/components/Footer';
import BackToTop from '@/components/BackToTop';
import { motion } from 'motion/react';
import Link from 'next/link';
import Image from 'next/image';
import { Phone, ArrowUpRight, ArrowRight } from 'lucide-react';
import OrganizationJsonLd from '@/components/seo/OrganizationJsonLd';

export default function Home() {
  return (
    <main className="relative min-h-screen bg-white overflow-x-hidden">
      <OrganizationJsonLd 
        name="Touch Teq Engineering"
        url="https://touchteq.co.za"
        logo="https://touchteq.co.za/logo.png"
        description="Specialist industrial engineering firm delivering fire and gas detection, control and instrumentation, and electrical engineering services across Southern Africa."
        address={{
          streetAddress: '787 16th Rd',
          addressLocality: 'Midrand',
          addressRegion: 'Gauteng',
          postalCode: '1685',
          addressCountry: 'ZA'
        }}
        contactPoint={{
          telephone: '+27-72-552-2110',
          contactType: 'Sales and Technical Support',
          areaServed: ['ZA', 'MZ', 'BW', 'NA', 'ZW'],
          availableLanguage: ['English']
        }}
        sameAs={[
          'https://www.linkedin.com/company/touch-teq-engineering'
        ]}
      />
      {/* Main Content Wrapper */}
      <div className="relative z-10 bg-white">
        <Header />
        <Hero />
        <AboutSection />
        <ServicesSection />
        <WhyChooseUs />
        <Testimonials />
        <ExpertiseSection />
        <IndustriesCarousel />
        <Gallery6 subtitle="Expert perspectives on safety standards, technical innovations, and strategic engineering in the Southern African industrial landscape." />
        <FAQ />
        <ContactSection />

        {/* CTA Section */}
        <section className="relative w-full bg-[#0A0F1A] text-white overflow-hidden py-32">
          <div className="absolute inset-0 z-0">
            <Image
              src="/f-bg.jpg"
              alt="Industrial Background"
              fill
              sizes="100vw"
              className="object-cover opacity-30"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-b from-[#0A0F1A] via-transparent to-[#0A0F1A]"></div>
            <div className="absolute inset-0 bg-[#0A0F1A]/40"></div>
          </div>

          <div className="container mx-auto px-4 md:px-8 relative z-10">
            <div className="max-w-5xl">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="flex items-center space-x-3 mb-6"
              >
                <div className="w-12 h-[1px] bg-orange-500"></div>
                <span className="text-orange-500 font-black text-xs uppercase tracking-[0.4em]">Ready to Move Forward</span>
              </motion.div>
              <motion.h2
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                className="text-5xl md:text-7xl font-black text-white uppercase tracking-tight leading-[0.85] mb-10"
              >
                Ready to Protect Your <br /> <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF6900] to-orange-300">People and Assets?</span>
              </motion.h2>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                className="text-slate-400 text-lg md:text-xl max-w-2xl mb-12 font-medium leading-relaxed"
              >
                From fire and gas detection to electrical engineering and hazardous area classification, Touch Teq delivers specialist industrial solutions across Southern Africa.
              </motion.p>
              
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
                className="flex flex-col sm:flex-row gap-6"
              >
                <Link 
                  href="/contact#request-quote"
                  className="group flex items-stretch bg-white hover:bg-slate-100 transition-all rounded-md overflow-hidden shadow-xl max-w-full sm:w-auto"
                >
                  <span className="px-6 md:px-8 py-3 flex items-center text-[#0A1120] group-hover:text-orange-500 font-black text-[11px] md:text-sm uppercase tracking-widest text-left transition-colors">
                    REQUEST A CONSULTATION
                  </span>
                  <div className="bg-[#ff6900] px-4 md:px-5 flex items-center justify-center group-hover:bg-orange-600 transition-colors shrink-0">
                    <ArrowRight className="text-white w-4 h-4 -rotate-45 group-hover:rotate-0 transition-all duration-300" />
                  </div>
                </Link>

                <a 
                  href="tel:+27725522110"
                  className="group flex items-stretch bg-orange-500 hover:bg-orange-600 transition-all rounded-md overflow-hidden shadow-xl shadow-orange-500/20 max-w-full sm:w-auto"
                >
                  <span className="px-6 md:px-8 py-3 flex items-center text-white font-black text-[11px] md:text-sm uppercase tracking-widest text-left">
                    <Phone size={16} className="mr-3" />
                    CALL US
                  </span>
                  <div className="bg-[#1A2B4C] px-5 flex items-center justify-center group-hover:bg-black transition-colors shrink-0">
                    <ArrowRight className="text-white w-4 h-4 -rotate-45 group-hover:rotate-0 group-hover:text-orange-500 transition-all duration-300" />
                  </div>
                </a>
              </motion.div>
            </div>
          </div>
        </section>

        <BackToTop />
        <Footer />
      </div>
    </main>
  );
}
