'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowRight } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import JsonLd from '@/components/seo/JsonLd';

export const faqs = [
  {
    question: 'What is your typical lead time for equipment and parts?',
    answer:
      'Most standard products can be sourced within 3 to 5 working days through OEM-approved supply channels. For specialised or Ex-rated equipment, lead times are typically 2 to 4 weeks depending on stock availability and certification requirements. For urgent shutdown or breakdown situations, we prioritise sourcing and coordination to reduce plant downtime.',
  },
  {
    question: 'Do your systems meet international safety standards?',
    answer:
      'Yes. Our engineering and supply scope is aligned to the relevant South African and international standards for the application, including IEC 61511, IEC 60079, SANS requirements, and ATEX or IECEx equipment frameworks where applicable.',
  },
  {
    question: 'What industries do you work with?',
    answer:
      'We work with refineries, chemical plants, manufacturing facilities, power generation sites, mining operations, fuel storage depots, and food and beverage processing plants. The common thread is safety-critical industrial work where compliance, uptime, and technical accountability matter.',
  },
  {
    question: 'How does your emergency response work?',
    answer:
      'Clients with urgent issues speak directly to a technically competent point of contact. We provide immediate phone-based troubleshooting and, where site attendance is required, mobilise qualified personnel or approved support partners as quickly as the location and access requirements allow.',
  },
  {
    question: 'Can you integrate new systems with our existing infrastructure?',
    answer:
      'Yes. A significant part of our work involves retrofit integration, system upgrades, and brownfield modifications. We design and commission solutions with the existing plant architecture, shutdown windows, and operational constraints in mind.',
  },
  {
    question: 'Do you take on both small and large projects?',
    answer:
      'Yes. We handle focused scopes such as detector replacements, audits, and hazardous area studies, as well as larger engineering, installation, and commissioning packages. The level of engineering discipline stays the same regardless of project size.',
  },
];

export default function FAQ() {
  const [activeIndex, setActiveIndex] = useState<number | null>(0);

  return (
    <section id="faq" className="py-16 md:py-24 bg-white overflow-hidden">
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'FAQPage',
          mainEntity: faqs.map((faq) => ({
            '@type': 'Question',
            name: faq.question,
            acceptedAnswer: {
              '@type': 'Answer',
              text: faq.answer,
            },
          })),
        }}
      />
      <div className="container mx-auto px-4 md:px-8">
        <div className="flex flex-col lg:flex-row gap-10 md:gap-16 items-start">
          <div className="lg:w-1/2 relative min-h-[300px] md:min-h-[500px] w-full">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="relative z-20 w-full sm:w-4/5 aspect-[4/5] bg-[#1A2B4C] p-3 md:p-4 shadow-2xl"
            >
              <div className="relative w-full h-full overflow-hidden">
                <Image
                  src="/faq.jpeg"
                  alt="Touch Teq FAQ"
                  fill
                  className="object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="hidden sm:block absolute top-[65%] right-0 z-30 w-3/5 aspect-square bg-white p-2 shadow-2xl"
            >
              <div className="relative w-full h-full overflow-hidden">
                <Image
                  src="/Blueprints_with_company_logo.jpeg"
                  alt="Engineer on Site"
                  fill
                  className="object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
            </motion.div>

            <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-orange-500/10 rounded-full blur-3xl -z-10"></div>
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#1A2B4C]/5 rounded-full blur-3xl -z-10"></div>
          </div>

          <div className="lg:w-1/2">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="mb-12"
            >
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-2 h-2 bg-orange-500"></div>
                <span className="text-orange-500 font-black text-xs uppercase tracking-[0.3em]">
                  Frequently Asked Questions
                </span>
              </div>
              <h2 className="text-[#1A2B4C] text-4xl md:text-5xl font-black uppercase tracking-normal leading-none mb-8">
                Common Questions <br />
                About Our Engineering <br />
                Services
              </h2>
              <div className="h-px w-full bg-[#1A2B4C]/20"></div>
            </motion.div>

            <div className="space-y-0">
              {faqs.map((faq, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="border-b border-[#1A2B4C]/10"
                >
                  <button
                    onClick={() => setActiveIndex(activeIndex === index ? null : index)}
                    className="w-full py-6 flex items-start text-left group transition-all"
                  >
                    <span className="mr-4 mt-1">
                      <ArrowRight
                        size={20}
                        className={`text-orange-500 transition-transform duration-300 ${activeIndex === index ? 'rotate-90' : 'rotate-0'}`}
                      />
                    </span>
                    <span
                      className={`text-lg md:text-xl font-black uppercase tracking-normal transition-colors duration-300 ${activeIndex === index ? 'text-orange-500' : 'text-[#1A2B4C] group-hover:text-orange-500'}`}
                    >
                      {faq.question}
                    </span>
                  </button>

                  <AnimatePresence initial={false}>
                    {activeIndex === index && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.4, ease: [0.04, 0.62, 0.23, 0.98] }}
                        className="overflow-hidden"
                      >
                        <div className="pb-8 pl-10 pr-4">
                          <p className="text-slate-600 text-sm md:text-base leading-relaxed font-medium">
                            {faq.answer}
                          </p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.6 }}
              className="mt-12"
            >
              <Link
                href="/contact#request-quote"
                className="group inline-flex items-stretch bg-orange-500 hover:bg-orange-600 transition-all rounded-md overflow-hidden shadow-xl shadow-orange-500/20"
              >
                <span className="px-8 py-4 flex items-center text-white font-black text-sm uppercase tracking-widest">
                  Request Technical Consultation
                </span>
                <div className="bg-[#1A2B4C] px-5 flex items-center justify-center group-hover:bg-black transition-colors">
                  <ArrowRight className="text-white w-4 h-4 -rotate-45 group-hover:rotate-0 group-hover:text-orange-500 transition-all duration-300" />
                </div>
              </Link>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
