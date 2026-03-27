'use client';

import { motion } from 'motion/react';
import { Mail, AlertTriangle, FileText, Scale, ExternalLink, Globe } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import BackToTop from '@/components/BackToTop';
import Link from 'next/link';

const sections = [
  {
    title: 'Who We Are',
    content: `This website is operated by Touch Teqniques Engineering Services, trading as Touch Teq Engineering, Johannesburg, South Africa. By accessing or using this website you agree to these terms.`,
    icon: Globe
  },
  {
    title: 'Use of This Website',
    content: `This website is intended to provide information about Touch Teq Engineering's services, share technical knowledge, and allow prospective clients to make contact. You may use this website for lawful purposes only.\n\nYou may not:\n\n• Copy, reproduce, or redistribute any content from this website without our written permission\n• Use this website in any way that could damage its operation or reputation\n• Attempt to gain unauthorised access to any part of the website or its underlying systems`,
    icon: FileText
  },
  {
    title: 'Enquiries and Contact Forms',
    content: `Submitting an enquiry through our contact form, risk assessment tool, or any other form on this website does not constitute a formal contract, binding agreement, or commitment of any kind by either party. A formal engagement begins only when a signed quotation or written agreement has been issued and accepted.`,
    icon: FileText
  },
  {
    title: 'Intellectual Property',
    content: `All content on this website — including text, articles, technical guides, downloadable resources, graphics, and the Touch Teq name and logo — is the intellectual property of Touch Teqniques Engineering Services and is protected under applicable South African law.\n\nYou may share links to our content and reference our articles with appropriate attribution. You may not reproduce, republish, or repurpose our content for commercial use without prior written consent.`,
    icon: Scale
  },
  {
    title: 'Disclaimer — Important',
    content: `The information, articles, technical guides, risk assessment tools, checklists, and downloadable resources published on this website are provided for general informational purposes only. They are intended to educate and inform, not to serve as professional engineering advice.\n\nNothing on this website constitutes a substitute for qualified engineering assessment, design, or consultation.\n\nFire and gas detection systems, hazardous area classifications, functional safety assessments, SIL determinations, and related engineering activities are safety-critical by nature. They must be designed, assessed, and commissioned by a suitably qualified and experienced engineer in accordance with applicable standards including but not limited to IEC 61511, IEC 60079, and SANS regulations.\n\nTouch Teqniques Engineering Services accepts no liability for any loss, damage, injury, or consequence — direct or indirect — arising from decisions made or actions taken based solely on information obtained from this website.\n\nIf you require professional engineering advice, please contact us directly to discuss your specific requirements.`,
    icon: AlertTriangle,
    isWarning: true
  },
  {
    title: 'Third Party Links',
    content: `This website may contain links to external websites for reference purposes. We do not control or endorse the content of external sites and accept no responsibility for them.`,
    icon: ExternalLink
  },
  {
    title: 'Limitation of Liability',
    content: `To the maximum extent permitted by South African law, Touch Teqniques Engineering Services shall not be liable for any indirect, incidental, or consequential damages arising from your use of or inability to use this website or its content.`,
    icon: AlertTriangle
  },
  {
    title: 'Governing Law',
    content: `These terms are governed by the laws of the Republic of South Africa. Any disputes arising from the use of this website shall be subject to the jurisdiction of the South African courts.`,
    icon: Scale
  },
  {
    title: 'Changes to These Terms',
    content: `We reserve the right to update these terms at any time. The date at the top of this page reflects when they were last revised. Continued use of the website after changes constitutes acceptance of the updated terms.`,
    icon: FileText
  }
];

export default function TermsPage() {
  return (
    <>
      <Header />
      
      <main className="min-h-screen bg-white pt-32 pb-24">
        {/* Hero Section */}
        <section className="container mx-auto px-4 md:px-8 mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-3xl"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-orange-500/10 rounded-lg flex items-center justify-center">
                <Scale className="text-orange-500" size={24} />
              </div>
              <span className="text-orange-500 text-xs font-black uppercase tracking-[0.3em]">Legal</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-[#1A2B4C] uppercase tracking-tight mb-4">
              Terms of Service
            </h1>
            <p className="text-slate-500 text-sm font-medium">
              Last updated: March 2026
            </p>
          </motion.div>
        </section>

        {/* Content Sections */}
        <section className="container mx-auto px-4 md:px-8">
          <div className="max-w-3xl space-y-12">
            {sections.map((section, index) => (
              <motion.div
                key={section.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
                className={`relative pl-16 ${section.isWarning ? 'bg-amber-50 -mx-4 p-6 rounded-xl border border-amber-100/50' : ''}`}
              >
                <div className={`absolute left-0 top-0 w-10 h-10 rounded-lg flex items-center justify-center ${section.isWarning ? 'bg-amber-500' : 'bg-[#1A2B4C]'}`}>
                  <section.icon className={section.isWarning ? 'text-white' : 'text-orange-500'} size={18} />
                </div>
                <h2 className="text-xl md:text-2xl font-black text-[#1A2B4C] uppercase tracking-tight mb-4">
                  {section.title}
                </h2>
                <div className="text-slate-600 text-sm leading-relaxed font-medium whitespace-pre-line">
                  {section.content}
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Contact Section */}
        <section className="container mx-auto px-4 md:px-8 mt-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-3xl bg-[#0A0F1A] rounded-2xl p-8 md:p-12"
          >
            <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
              <div className="w-14 h-14 bg-orange-500/20 rounded-xl flex items-center justify-center shrink-0">
                <Mail className="text-orange-500" size={24} />
              </div>
              <div className="flex-1">
                <h3 className="text-white font-black text-lg uppercase tracking-tight mb-2">
                  Get in Touch
                </h3>
                <p className="text-slate-400 text-sm font-medium">
                  For any questions about these terms or to discuss your requirements:
                </p>
                <div className="mt-3 space-y-1">
                  <p className="text-white text-sm font-medium">Touch Teqniques Engineering Services</p>
                  <p className="text-slate-400 text-sm">Johannesburg, South Africa</p>
                  <a href="mailto:info@touchteq.co.za" className="text-orange-500 text-sm font-medium hover:underline">
                    info@touchteq.co.za
                  </a>
                </div>
              </div>
              <Link
                href="/contact"
                className="shrink-0 bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-lg font-black text-xs uppercase tracking-widest transition-all flex items-center gap-2"
              >
                Contact Us
              </Link>
            </div>
          </motion.div>
        </section>
      </main>
      
      <Footer />
      <BackToTop />
    </>
  );
}
