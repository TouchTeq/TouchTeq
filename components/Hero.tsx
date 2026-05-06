'use client';

import { motion } from 'motion/react';
import { ArrowRight, ShieldCheck, Zap, Globe } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

const trustSignals = [
  { icon: ShieldCheck, text: "IEC 61511 & SANS 10089 Compliant" },
  { icon: Zap, text: "OEM-Approved Technical Support" },
  { icon: Globe, text: "Regional & Cross-Border Service" },
  { icon: Zap, text: "24/7 Emergency Response" },
];

export default function Hero() {
  return (
    <section className="relative min-h-fit lg:min-h-screen flex items-center pt-28 pb-16 sm:pt-32 sm:pb-24 md:pt-48 md:pb-32 overflow-hidden bg-[#0A1120]">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/tt-bg.jpeg"
          alt="Touch Teq Engineering"
          fill
          className="object-cover translate-y-12 opacity-60"
          priority
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0A1120] via-[#0A1120]/30 to-transparent"></div>
        
        {/* Animated Particles/Dots Overlay */}
        <div className="absolute inset-0 opacity-20 pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-orange-500 rounded-full animate-ping"></div>
          <div className="absolute top-3/4 left-1/2 w-1 h-1 bg-white rounded-full animate-pulse delay-700"></div>
          <div className="absolute top-1/2 right-1/4 w-1.5 h-1.5 bg-orange-500 rounded-full animate-ping delay-1000"></div>
        </div>
      </div>

      <div className="container mx-auto px-4 md:px-8 relative z-10">
        <div className="max-w-4xl">
          {/* Eyebrow */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex items-start sm:items-center gap-2 mb-5 sm:mb-6"
          >
            <div className="h-px w-6 md:w-8 bg-orange-500 mt-2 sm:mt-0 shrink-0"></div>
            <span className="text-orange-500 font-mono text-[10px] md:text-xs font-bold uppercase tracking-[0.2em] md:tracking-[0.3em]">
              Specialized Engineering for Safety-Critical Environments
            </span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-white text-[2.3rem] sm:text-5xl md:text-7xl lg:text-8xl font-black leading-[1.05] sm:leading-[1.1] mb-6 sm:mb-8 tracking-normal sm:tracking-tighter"
          >
            Industrial Engineering <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400">
              Where Safety is Non-Negotiable.
            </span>
          </motion.h1>

          {/* Supporting Paragraph */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="text-slate-300 text-[15px] sm:text-base md:text-xl leading-relaxed mb-8 sm:mb-10 max-w-2xl font-medium"
          >
            Specialist Fire & Gas Detection, Control & Instrumentation, and Electrical Engineering for high-risk industrial facilities across Southern Africa. Delivered by certified experts with 24/7 accountability.
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3 sm:gap-4 mb-12 sm:mb-16"
          >
            <Link 
              href="/contact#request-quote"
              className="group flex w-full sm:w-auto items-stretch bg-orange-500 hover:bg-orange-600 transition-all rounded-md overflow-hidden shadow-xl shadow-orange-500/20 max-w-full"
            >
              <span className="min-w-0 flex-1 justify-center sm:justify-start px-5 md:px-8 py-4 flex items-center text-white font-black text-[10px] md:text-sm uppercase tracking-[0.12em] sm:tracking-widest text-center sm:text-left">
                Request Technical Consultation
              </span>
              <div className="bg-[#1A2B4C] px-4 md:px-5 flex items-center justify-center group-hover:bg-black transition-colors shrink-0">
                <ArrowRight className="text-white w-4 h-4 -rotate-45 group-hover:rotate-0 group-hover:text-orange-500 transition-all duration-300" />
              </div>
            </Link>

            <Link 
              href="/risk-assessment"
              className="group flex w-full sm:w-auto items-stretch bg-white hover:bg-slate-100 transition-all rounded-md overflow-hidden shadow-xl max-w-full"
            >
              <span className="min-w-0 flex-1 justify-center sm:justify-start px-5 md:px-8 py-4 flex items-center text-[#0A1120] group-hover:text-orange-500 font-black text-[10px] md:text-sm uppercase tracking-[0.12em] sm:tracking-widest text-center sm:text-left transition-colors">
                Assess My Facility Risk — Free
              </span>
              <div className="bg-[#1A2B4C] px-4 md:px-5 flex items-center justify-center group-hover:bg-orange-500 transition-colors shrink-0">
                <ArrowRight className="text-white w-4 h-4 -rotate-45 group-hover:rotate-0 transition-all duration-300" />
              </div>
            </Link>
          </motion.div>

          {/* Trust Signals Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
            {trustSignals.map((signal, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.8 + (index * 0.1) }}
                className="flex items-center space-x-3 group"
              >
                <div className="p-2 bg-white/5 rounded border border-white/10 group-hover:border-orange-500/50 transition-colors">
                  <signal.icon size={16} className="text-orange-500" />
                </div>
                <span className="text-slate-400 text-xs md:text-sm font-semibold tracking-wide group-hover:text-white transition-colors">
                  {signal.text}
                </span>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Decorative Elements */}
      <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-[#0A1120] to-transparent z-10"></div>
    </section>
  );
}
