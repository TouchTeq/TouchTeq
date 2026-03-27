'use client';

import { useState } from 'react';
import { motion } from 'motion/react';
import { ChevronRight, Download, FileText, CheckCircle2, AlertCircle, ArrowRight, Phone } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import BackToTop from '@/components/BackToTop';

const resources = [
  {
    id: 1,
    title: 'HAC Checklist',
    filename: 'HAC_Checklist.docx',
    description: 'A comprehensive checklist for conducting Hazardous Area Classification studies. Covers zoning requirements, equipment selection criteria, documentation standards, and regulatory compliance checkpoints per SANS 10108 and IEC 60079.',
    icon: FileText,
    tag: 'Hazardous Areas'
  },
  {
    id: 2,
    title: 'Fire & Gas Audit Checklist',
    filename: 'FG_Audit_Checklist.docx',
    description: 'A detailed audit checklist for fire and gas detection systems. Includes detector maintenance records, panel inspection points, loop testing procedures, and compliance verification for SANS 10089 requirements.',
    icon: FileText,
    tag: 'Fire & Gas'
  },
  {
    id: 3,
    title: 'Engineering Standards Reference',
    filename: 'Standards_Reference_Sheet.docx',
    description: 'A quick reference guide covering the key engineering standards relevant to industrial fire protection, hazardous areas, and functional safety. Includes IEC 61511, IEC 60079, SANS 10089, and OHS Act references.',
    icon: FileText,
    tag: 'Technical Reference'
  }
];

export default function DownloadsPage() {
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [formData, setFormData] = useState({ name: '', company: '', email: '' });
  const [turnstileToken, setTurnstileToken] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState<{ [key: number]: boolean }>({});
  const [downloadingResource, setDownloadingResource] = useState<number | null>(null);

  const handleSubmit = async (resourceId: number, resourceName: string) => {
    if (!formData.name || !formData.email) {
      setError('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);
    setError('');
    setDownloadingResource(resourceId);

    try {
      const res = await fetch('/api/download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          resourceName,
          turnstileToken
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to process download');
      }

      setSuccess(prev => ({ ...prev, [resourceId]: true }));
      
      const link = document.createElement('a');
      link.href = data.downloadUrl;
      link.download = data.downloadUrl.split('/').pop() || 'download.docx';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

    } catch (err: any) {
      setError(err.message || 'An error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
      setDownloadingResource(null);
    }
  };

  return (
    <main className="min-h-screen bg-white">
      <Header />
      
      {/* Hero Section */}
      <section className="relative pt-32 pb-24 md:pt-48 md:pb-32 bg-[#1A2B4C] overflow-hidden">
        <div className="container mx-auto px-4 md:px-8">
          {/* Breadcrumb */}
          <nav className="flex items-center space-x-2 text-slate-400 text-[10px] font-black uppercase tracking-widest mb-8">
            <Link href="/" className="hover:text-orange-500 transition-colors">Home</Link>
            <ChevronRight size={12} />
            <span className="text-white">Downloads</span>
          </nav>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-orange-500/10 rounded-lg flex items-center justify-center">
                <Download className="text-orange-500" size={24} />
              </div>
              <span className="text-orange-500 text-xs font-black uppercase tracking-[0.3em]">Free Resources</span>
            </div>
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-black text-white uppercase tracking-tight mb-6 leading-none">
              Download Technical <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF6900] to-orange-300">Resources</span>
            </h1>
            <p className="text-slate-300 text-lg md:text-xl max-w-3xl leading-relaxed font-medium">
              Free checklists, reference sheets, and technical guides for engineers and HSE managers working in industrial fire protection, hazardous areas, and functional safety.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Resources Grid */}
      <section className="container mx-auto px-4 md:px-8 py-16">
        <div className="max-w-4xl space-y-6">
            {resources.map((resource, index) => (
              <motion.div
                key={resource.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
                className="bg-white border border-slate-200 rounded-2xl overflow-hidden hover:border-orange-500/30 transition-all"
              >
                <div 
                  className="p-8 cursor-pointer"
                  onClick={() => setExpandedId(expandedId === resource.id ? null : resource.id)}
                >
                  <div className="flex items-start gap-6">
                    <div className="w-16 h-16 bg-slate-50 rounded-xl flex items-center justify-center shrink-0">
                      <resource.icon className="text-[#1A2B4C]" size={32} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="bg-orange-500/10 text-orange-500 text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full">
                          {resource.tag}
                        </span>
                      </div>
                      <h3 className="text-xl font-black text-[#1A2B4C] uppercase tracking-tight mb-2">
                        {resource.title}
                      </h3>
                      <p className="text-slate-500 text-sm leading-relaxed">
                        {resource.description}
                      </p>
                    </div>
                    <div className={`shrink-0 transition-transform ${expandedId === resource.id ? 'rotate-90' : ''}`}>
                      <ChevronRight size={24} className="text-slate-400" />
                    </div>
                  </div>
                </div>

                {expandedId === resource.id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="border-t border-slate-100 p-8 bg-slate-50/50"
                  >
                    {success[resource.id] ? (
                      <div className="flex items-center gap-4 text-green-600">
                        <CheckCircle2 size={24} />
                        <div>
                          <p className="font-black text-sm uppercase tracking-wide">Download Started</p>
                          <p className="text-slate-500 text-sm">Check your downloads folder</p>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        <p className="text-slate-500 text-sm font-medium">
                          Enter your details to download this resource for free:
                        </p>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">
                              Name *
                            </label>
                            <input
                              type="text"
                              value={formData.name}
                              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                              placeholder="Your full name"
                              className="w-full px-4 py-3 bg-white border border-slate-200 rounded-lg text-[#1A2B4C] font-medium text-sm focus:border-orange-500 outline-none transition-colors"
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">
                              Company
                            </label>
                            <input
                              type="text"
                              value={formData.company}
                              onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                              placeholder="Company name (optional)"
                              className="w-full px-4 py-3 bg-white border border-slate-200 rounded-lg text-[#1A2B4C] font-medium text-sm focus:border-orange-500 outline-none transition-colors"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">
                            Email Address *
                          </label>
                          <input
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            placeholder="your.email@company.com"
                            className="w-full px-4 py-3 bg-white border border-slate-200 rounded-lg text-[#1A2B4C] font-medium text-sm focus:border-orange-500 outline-none transition-colors"
                            required
                          />
                        </div>

                        {error && (
                          <div className="flex items-center gap-3 text-red-600 bg-red-50 p-4 rounded-lg border border-red-100">
                            <AlertCircle size={20} />
                            <p className="text-sm font-medium">{error}</p>
                          </div>
                        )}

                        <button
                          onClick={() => handleSubmit(resource.id, resource.title)}
                          disabled={isSubmitting || !formData.name || !formData.email}
                          className="w-full md:w-auto bg-orange-500 hover:bg-orange-600 disabled:bg-slate-300 text-white px-8 py-4 rounded-lg font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-3"
                        >
                          {isSubmitting && downloadingResource === resource.id ? (
                            <>
                              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                              Processing...
                            </>
                          ) : (
                            <>
                              <Download size={18} />
                              Download Free
                            </>
                          )}
                        </button>

                        <p className="text-slate-400 text-xs leading-relaxed">
                          By downloading, you agree to receive relevant technical content from Touch Teq Engineering. You can unsubscribe at any time.
                        </p>
                      </div>
                    )}
                  </motion.div>
                )}
              </motion.div>
            ))}

          </div>
        </section>

        {/* Additional CTA */}
        <section className="container mx-auto px-4 md:px-8 mt-20 mb-12">
          <div className="max-w-4xl">
            <Link 
              href="/risk-assessment"
              className="group block bg-[#1A2B4C] rounded-2xl p-8 md:p-12 hover:border-orange-500/30 transition-all border border-transparent"
            >
              <div className="flex flex-col md:flex-row items-center gap-8">
                <div className="w-20 h-20 bg-orange-500/20 rounded-2xl flex items-center justify-center shrink-0">
                  <svg className="w-10 h-10 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <div className="flex-1 text-center md:text-left">
                  <p className="text-orange-500 text-xs font-black uppercase tracking-[0.3em] mb-2">
                    Also Available
                  </p>
                  <h3 className="text-white text-2xl md:text-3xl font-black uppercase tracking-tight mb-2">
                    Free Interactive Facility Risk Assessment
                  </h3>
                  <p className="text-slate-400 text-sm leading-relaxed">
                    Takes 2 minutes. Get an instant gap analysis of your fire & gas system coverage, documentation status, and compliance gaps.
                  </p>
                </div>
                <div className="shrink-0">
                  <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center group-hover:bg-orange-400 transition-colors">
                    <ChevronRight size={24} className="text-white" />
                  </div>
                </div>
              </div>
            </Link>
          </div>
        </section>

        {/* Ready to Move Forward CTA */}
        <section className="relative w-full bg-[#0A0F1A] text-white overflow-hidden py-24">
          <div className="absolute inset-0 z-0">
            <Image
              src="/f-bg.jpg"
              alt="Industrial Background"
              fill
              className="object-cover opacity-30"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-b from-[#0A0F1A] via-transparent to-[#0A0F1A]"></div>
            <div className="absolute inset-0 bg-[#0A0F1A]/40"></div>
          </div>
          
          <div className="container mx-auto px-4 md:px-8 relative z-10">
            <div className="max-w-4xl">
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
                Need a Custom <br /> <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF6900] to-orange-300">Engineering Solution?</span>
              </motion.h2>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                className="text-slate-400 text-lg md:text-xl max-w-2xl mb-12 font-medium leading-relaxed"
              >
                Our technical resources are free because we believe in empowering the industry. When you're ready for a tailored engineering solution, our team is here to help.
              </motion.p>
              
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
                className="flex flex-col sm:flex-row gap-6"
              >
                <Link 
                  href="/contact"
                  className="group flex items-stretch bg-white hover:bg-slate-100 transition-all rounded-md overflow-hidden shadow-xl max-w-full sm:w-auto"
                >
                  <span className="px-6 md:px-8 py-3 flex items-center text-[#0A1120] group-hover:text-orange-500 font-black text-[11px] md:text-sm uppercase tracking-widest text-left transition-colors">
                    REQUEST CONSULTATION
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
                    CALL US DIRECTLY
                  </span>
                  <div className="bg-[#1A2B4C] px-5 flex items-center justify-center group-hover:bg-black transition-colors shrink-0">
                    <ArrowRight className="text-white w-4 h-4 -rotate-45 group-hover:rotate-0 group-hover:text-orange-500 transition-all duration-300" />
                  </div>
                </a>
              </motion.div>
            </div>
          </div>
        </section>

        <Footer />
        <BackToTop />
      </main>
    );
  }
