'use client';

import { motion } from 'motion/react';
import { Mail, Shield, Lock, FileText, Users } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import BackToTop from '@/components/BackToTop';
import Link from 'next/link';

const sections = [
  {
    title: 'Who We Are',
    content: `This website is operated by Touch Teqniques Engineering Services, trading as Touch Teq Engineering, a fire and gas detection and control & instrumentation engineering firm based in Johannesburg, South Africa.\n\nIf you have any questions about this policy, contact us at info@touchteq.co.za.`,
    icon: FileText
  },
  {
    title: 'What Information We Collect',
    content: `We collect personal information only when you voluntarily provide it through the following:\n\n• Contact form — name, company name, email address, phone number, and your message\n• Newsletter signup — email address\n• Downloadable resource requests — name and email address\n• Facility Risk Assessment tool — name, email address, and facility information you enter\n\nWe do not collect any personal information from visitors who simply browse the website without submitting a form.`,
    icon: Users
  },
  {
    title: 'Why We Collect It',
    content: `• To respond to your enquiry\n• To send you the resource or information you requested\n• To send our newsletter if you subscribed (you can unsubscribe at any time)\n• To follow up on your risk assessment results if you requested contact\n\nWe do not use your information for any purpose beyond what you submitted it for.`,
    icon: FileText
  },
  {
    title: 'Third Party Services',
    content: `We use the following trusted third party services to operate this website. Each has its own privacy policy governing how they handle data:\n\nGoogle Analytics 4 — collects anonymous usage data (pages visited, time on site, general location) to help us understand how the website is used. No personally identifiable information is shared with Google.\n\nBrevo — our email delivery platform. When you submit a form, your name and email are stored in Brevo to enable us to respond to you.\n\nCloudflare Turnstile — a spam protection service that runs silently in the background on our forms.\n\nWe do not sell, rent, or share your personal information with any other third parties.`,
    icon: Shield
  },
  {
    title: 'Cookies',
    content: `We use the following cookies on this website:\n\nEssential cookies — required for the website to function correctly. These are always active.\n\nAnalytics cookies — used by Google Analytics 4 to collect anonymous usage statistics. These only load if you click "Accept All" on our cookie banner.\n\nWe do not use advertising or marketing tracking cookies of any kind.`,
    icon: Lock
  },
  {
    title: 'How We Protect Your Data',
    content: `All data submitted through this website is transmitted over encrypted HTTPS connections. Data stored in our systems is protected by industry-standard security measures. We retain your personal information only for as long as necessary to fulfil the purpose for which it was collected.`,
    icon: Shield
  },
  {
    title: 'Your Rights Under POPIA',
    content: `Under the Protection of Personal Information Act (POPIA) you have the right to:\n\n• Know what personal information we hold about you\n• Request correction of inaccurate information\n• Request deletion of your personal information\n• Object to the processing of your personal information\n• Lodge a complaint with the Information Regulator of South Africa at www.inforegulator.org.za\n\nTo exercise any of these rights, email us at info@touchteq.co.za. We will respond within 30 days.`,
    icon: Lock
  },
  {
    title: 'Changes to This Policy',
    content: `We may update this policy from time to time. The date at the top of this page reflects when it was last revised. Continued use of the website after changes constitutes acceptance of the updated policy.`,
    icon: FileText
  }
];

export default function PrivacyPage() {
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
                <Shield className="text-orange-500" size={24} />
              </div>
              <span className="text-orange-500 text-xs font-black uppercase tracking-[0.3em]">Legal</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-[#1A2B4C] uppercase tracking-tight mb-4">
              Privacy Policy
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
                className="relative pl-16"
              >
                <div className="absolute left-0 top-0 w-10 h-10 bg-[#1A2B4C] rounded-lg flex items-center justify-center">
                  <section.icon className="text-orange-500" size={18} />
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

        {/* Contact CTA */}
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
                  Questions About Your Data?
                </h3>
                <p className="text-slate-400 text-sm font-medium">
                  If you have any questions about how we handle your personal information, please contact us.
                </p>
              </div>
              <Link
                href="mailto:info@touchteq.co.za"
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
