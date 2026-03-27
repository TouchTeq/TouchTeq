'use client';

import { motion } from 'motion/react';
import { CheckCircle2, ArrowRight } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

export default function ExpertiseSection() {
  const checklistItems = [
    "Control & Instrumentation Systems",
    "Fire & Gas Detection for Hazardous Areas",
    "Electrical Engineering & Plant Services",
    "Hazardous Area Classification (ATEX/IECEx)"
  ];

  return (
    <section className="py-24 bg-white overflow-hidden relative">
      {/* Subtle Background Grid */}
      <div className="absolute top-0 left-0 w-full h-full opacity-[0.03] pointer-events-none">
        <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(#1A2B4C 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
      </div>

      <div className="container mx-auto px-4 md:px-8 relative z-10">
        <div className="flex flex-col lg:flex-row items-center gap-16 lg:gap-24">
          
          {/* Left Side: Image & Experience Box */}
          <div className="w-full lg:w-1/2 relative">
            {/* Background Grid Pattern for Image */}
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="absolute -top-10 -left-10 w-40 h-40 border-t border-l border-slate-200 z-0"
            ></motion.div>

            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="relative z-10 rounded-2xl overflow-hidden shadow-2xl"
            >
              <Image 
                src="/esce.jpeg" 
                alt="Touch Teq Engineering Solutions"
                width={640}
                height={800}
                className="w-full h-auto object-cover"
                referrerPolicy="no-referrer"
              />
            </motion.div>
              
            {/* Experience Box Overlay - Positioned on top of the image container */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8, x: -30 }}
              whileInView={{ opacity: 1, scale: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.5, duration: 0.5 }}
              className="absolute top-12 left-0 md:-left-12 z-20 bg-[#ff6900] p-6 md:p-10 shadow-2xl rounded-lg max-w-[160px] md:max-w-[240px]"
            >
              <div className="text-white">
                <span className="text-4xl md:text-5xl lg:text-7xl font-black block mb-2 tracking-normal">10<span className="text-2xl md:text-3xl lg:text-4xl">+</span></span>
                <p className="text-[10px] md:text-xs lg:text-sm font-black uppercase tracking-[0.15em] md:tracking-[0.2em] leading-tight">
                  Years <br />
                  Engineering <br />
                  Experience
                </p>
              </div>
            </motion.div>
          </div>

          {/* Right Side: Content */}
          <div className="w-full lg:w-1/2">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="mb-8"
            >
              <div className="flex items-center space-x-2 mb-4">
                <div className="h-1.5 w-1.5 bg-[#ff6900] rounded-full"></div>
                <span className="text-[#ff6900] font-mono text-xs font-bold uppercase tracking-[0.3em]">
                  Touch Teq • Certified Engineering Experts
                </span>
              </div>
              
              <h2 className="text-[#1A2B4C] text-4xl md:text-5xl lg:text-6xl font-black mb-8 uppercase tracking-normal leading-[0.95]">
                Engineering Solutions for <br />
                <span className="text-[#ff6900]">Critical Industrial Environments</span>
              </h2>
              
              <p className="text-slate-600 text-lg leading-relaxed mb-10">
                Touch Teq Engineering provides fire & gas detection, control and instrumentation, and electrical engineering solutions for industrial facilities where reliability and compliance are critical. Every project is handled directly by a qualified engineer, ensuring clear communication, accountable decision-making, and consistent quality from design through support, backed by 24/7 emergency service.
              </p>

              {/* Checklist */}
              <div className="space-y-4 mb-10">
                {checklistItems.map((item, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: 20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.2 + (index * 0.1) }}
                    className="flex items-center space-x-3"
                  >
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-orange-50 flex items-center justify-center">
                      <CheckCircle2 size={16} className="text-[#ff6900]" />
                    </div>
                    <span className="text-[#1A2B4C] font-bold text-sm md:text-base uppercase tracking-normal">
                      {item}
                    </span>
                  </motion.div>
                ))}
              </div>

              <motion.p
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.7 }}
                className="text-slate-500 text-sm italic mb-12 border-l-2 border-slate-100 pl-6"
              >
                We deliver practical, compliant engineering solutions that protect people, assets, and operations—without unnecessary complexity.
              </motion.p>

              {/* CTA Button */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.8 }}
              >
                <Link 
                  href="/services"
                  className="group inline-flex items-stretch bg-orange-500 hover:bg-orange-600 transition-all rounded-md overflow-hidden shadow-xl shadow-orange-500/20"
                >
                  <span className="px-8 py-4 flex items-center text-white font-black text-sm uppercase tracking-widest">
                    View Our Services
                  </span>
                  <div className="bg-[#1A2B4C] px-5 flex items-center justify-center group-hover:bg-black transition-colors">
                    <ArrowRight className="text-white w-4 h-4 -rotate-45 group-hover:rotate-0 group-hover:text-orange-500 transition-all duration-300" />
                  </div>
                </Link>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
