'use client';

import { motion } from 'motion/react';
import { PencilRuler, ClipboardCheck, Briefcase, FileBadge, Clock, ArrowRight } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

const reasons = [
  {
    icon: PencilRuler,
    title: "Engineer-Led Projects",
    description: "Every project is handled directly by a qualified engineer from start to finish—no subcontracting, no handoffs. You get consistent expertise, clear communication, and full accountability."
  },
  {
    icon: ClipboardCheck,
    title: "Compliance & Standards",
    description: "We design, supply, and commission systems that meet IEC 61511, SANS 10089, IECEx, and ATEX requirements. Our solutions are built for audits, inspections, and long-term regulatory confidence."
  },
  {
    icon: Briefcase,
    title: "Industry Experience",
    description: "With 10+ years of hands-on experience in refineries, chemical plants, and heavy industry, I understand the unique challenges of hazardous environments and deliver solutions that work."
  },
  {
    icon: FileBadge,
    title: "Registered Professional Engineer",
    description: "ECSA Pr Tech Eng (Electrical) and SAQCC Fire Industry registered. Every project is handled by a qualified professional, not subcontractors."
  },
  {
    icon: Clock,
    title: "24/7 Emergency Support",
    description: "Industrial operations don't stop, and neither do we. Our emergency response team is available around the clock to troubleshoot, repair, and restore critical safety systems when you need us most."
  }
];

export default function WhyChooseUs() {
  return (
    <section className="relative bg-[#1A2B4C] py-24 overflow-hidden">
      {/* Background Blueprint Pattern */}
      <div className="absolute bottom-0 left-0 w-full h-1/2 opacity-10 pointer-events-none">
        <svg width="100%" height="100%" viewBox="0 0 1000 500" preserveAspectRatio="none">
          <path d="M0,500 L1000,500 L1000,0 L0,0 Z" fill="none" stroke="white" strokeWidth="1" strokeDasharray="5,5" />
          <path d="M100,500 L100,0 M200,500 L200,0 M300,500 L300,0 M400,500 L400,0 M500,500 L500,0 M600,500 L600,0 M700,500 L700,0 M800,500 L800,0 M900,500 L900,0" stroke="white" strokeWidth="0.5" opacity="0.3" />
          <path d="M0,100 L1000,100 M0,200 L1000,200 M0,300 L1000,300 M0,400 L1000,400" stroke="white" strokeWidth="0.5" opacity="0.3" />
          <circle cx="200" cy="300" r="150" stroke="white" strokeWidth="1" fill="none" opacity="0.2" />
          <path d="M500,100 L800,400 M800,100 L500,400" stroke="white" strokeWidth="1" opacity="0.2" />
        </svg>
      </div>

      <div className="container mx-auto px-4 md:px-8 relative z-10">
        <div className="flex flex-col lg:flex-row gap-12 items-start mb-20">
          {/* Left Content */}
          <div className="lg:w-1/2">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="flex items-center space-x-3 mb-6"
            >
              <div className="w-2 h-2 bg-orange-500"></div>
              <span className="text-orange-500 font-black text-xs uppercase tracking-[0.3em]">
                We Work With Integrity
              </span>
              <div className="w-2 h-2 bg-orange-500"></div>
            </motion.div>

            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-white text-4xl md:text-6xl font-black mb-8 uppercase tracking-normal"
            >
              Why <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF6900] to-orange-300">Choose Us?</span>
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="text-slate-300 text-sm md:text-base leading-relaxed font-medium max-w-xl"
            >
              Touch Teq delivers specialist fire & gas detection, control & instrumentation, as well as electrical engineering, with a hands-on, engineer-led approach. Every project is handled directly by a qualified professional—ensuring clear communication, technical precision, and accountability from design through commissioning.
            </motion.p>
          </div>

          {/* Right Image */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="lg:w-1/2 relative"
          >
            <div className="relative rounded-2xl overflow-hidden shadow-2xl border-4 border-white/10">
              <Image
                src="/wcu.jpg"
                alt="Touch Teq Engineering Team"
                width={800}
                height={600}
                className="object-cover"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#1A2B4C]/60 to-transparent"></div>
            </div>
            {/* Decorative element */}
            <div className="absolute -top-6 -right-6 w-24 h-24 bg-orange-500/20 rounded-full blur-3xl"></div>
          </motion.div>
        </div>

        {/* Reasons Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-6 mb-12 md:mb-20">
          {reasons.map((reason, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              whileHover={{ 
                scale: 1.05, 
                y: -10,
                transition: { duration: 0.3, ease: "easeOut" }
              }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ 
                duration: 0.6, 
                delay: index * 0.1,
                ease: [0.21, 0.47, 0.32, 0.98] 
              }}
              className="group p-4 md:p-6 rounded-2xl transition-all duration-300 hover:bg-white/[0.03] hover:shadow-[0_20px_50px_rgba(251,176,59,0.1)] border border-transparent hover:border-white/10"
            >
              <div className="mb-4 md:mb-6">
                <reason.icon className="text-white w-10 h-10 md:w-12 md:h-12 group-hover:text-orange-500 transition-colors duration-300" strokeWidth={1.5} />
              </div>
              <h3 className="text-orange-500 font-black text-base md:text-lg mb-3 md:mb-4 uppercase tracking-normal leading-tight">
                {reason.title}
              </h3>
              <p className="text-slate-300 text-xs md:text-sm leading-relaxed font-medium">
                {reason.description}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Separator */}
        <div className="relative h-px bg-white/20 mb-12">
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-2 h-2 bg-orange-500"></div>
          <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 bg-orange-500"></div>
        </div>

        {/* Footer CTA */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-8">
          <p className="text-white text-sm md:text-base font-bold text-center md:text-left">
            Ready to ensure compliance and safety in your industrial facility? <br className="hidden md:block" />
            Get a free consultation from a qualified engineer.
          </p>
          
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Link 
              href="/contact#request-quote"
              className="group inline-flex w-full sm:w-auto items-stretch bg-orange-500 hover:bg-orange-600 transition-all rounded-md overflow-hidden shadow-xl shadow-orange-500/20"
            >
              <span className="min-w-0 flex-1 justify-center sm:justify-start px-5 sm:px-8 py-4 flex items-center text-white font-black text-[11px] sm:text-sm uppercase tracking-[0.12em] sm:tracking-widest text-center sm:text-left">
                Request a Quote
              </span>
              <div className="bg-[#1A2B4C] px-5 flex items-center justify-center group-hover:bg-black transition-colors">
                <ArrowRight className="text-white w-4 h-4 -rotate-45 group-hover:rotate-0 group-hover:text-orange-500 transition-all duration-300" />
              </div>
            </Link>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
