'use client';

import { motion } from 'motion/react';
import { Shield, Target, Award, Users, CheckCircle2, ArrowRight } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

const values = [
  {
    icon: Shield,
    title: "Technical Integrity",
    description: "Unwavering adherence to IEC, SANS, and ATEX standards in every project we undertake."
  },
  {
    icon: Users,
    title: "Regional Accountability",
    description: "Direct engineer-led management with deep roots and 24/7 support across Southern Africa."
  },
  {
    icon: Target,
    title: "Safety-First Culture",
    description: "Every engineering decision is filtered through the lens of risk mitigation and personnel safety."
  },
  {
    icon: Award,
    title: "Operational Excellence",
    description: "Ensuring system reliability and compliance in the most demanding industrial environments."
  }
];

export default function AboutSection() {
  return (
    <section id="about" className="py-20 md:py-32 bg-slate-50 relative overflow-hidden">
      {/* Subtle Technical Grid Background */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" 
           style={{ backgroundImage: 'linear-gradient(#1A2B4C 1px, transparent 1px), linear-gradient(90deg, #1A2B4C 1px, transparent 1px)', backgroundSize: '50px 50px' }}>
      </div>

      <div className="container mx-auto px-4 md:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 md:gap-20 items-center mb-20 md:mb-32">
          {/* Left: Content */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8 }}
          >
            <div className="flex items-center space-x-2 mb-6">
              <div className="h-px w-8 bg-orange-500"></div>
              <span className="text-orange-500 font-mono text-[10px] md:text-xs font-bold uppercase tracking-[0.3em]">
                Who We Are
              </span>
            </div>
            
            <h2 className="text-[#1A2B4C] text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black mb-8 leading-tight uppercase tracking-normal">
              Driven by <br />
              <span className="text-orange-500">Technical Accountability.</span>
            </h2>
            
            <p className="text-slate-600 text-base md:text-lg leading-relaxed mb-8 font-medium max-w-xl">
              Touch Teq is not a general contractor. We are a specialist engineering firm focused on the intersection of safety, compliance, and industrial efficiency. Based in Southern Africa, we provide the technical backbone for refineries, chemical plants, and heavy manufacturing facilities.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
              {[
                "Specialist Engineering Partner",
                "Southern African Regional Capability",
                "Safety-Critical Environment Experts",
                "Direct Engineer-Led Projects"
              ].map((item, i) => (
                <motion.div 
                  key={i} 
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="flex items-center space-x-3"
                >
                  <CheckCircle2 className="text-orange-500 w-5 h-5 flex-shrink-0" />
                  <span className="text-[#1A2B4C] font-bold text-xs md:text-sm uppercase tracking-wide">{item}</span>
                </motion.div>
              ))}
            </div>

            <Link 
              href="/about"
              className="group inline-flex w-full sm:w-auto items-stretch bg-orange-500 hover:bg-orange-600 transition-all rounded-md overflow-hidden shadow-xl shadow-orange-500/20"
            >
              <span className="min-w-0 flex-1 justify-center sm:justify-start px-5 sm:px-8 py-4 flex items-center text-white font-black text-[11px] sm:text-sm uppercase tracking-[0.12em] sm:tracking-widest text-center sm:text-left">
                Learn More About Our Standards
              </span>
              <div className="bg-[#1A2B4C] px-5 flex items-center justify-center group-hover:bg-black transition-colors">
                <ArrowRight className="text-white w-4 h-4 -rotate-45 group-hover:rotate-0 group-hover:text-orange-500 transition-all duration-300" />
              </div>
            </Link>
          </motion.div>

          {/* Right: Mission Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="relative"
          >
            <motion.div 
              whileHover={{ y: -5 }}
              className="relative z-10 bg-[#1A2B4C] p-8 md:p-16 rounded-2xl shadow-2xl text-white overflow-hidden"
            >
              {/* Decorative Accent */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 rounded-full -mr-16 -mt-16 blur-3xl"></div>
              
              <div className="relative z-10">
                <div className="w-12 h-12 md:w-16 md:h-16 bg-orange-500 rounded-xl flex items-center justify-center mb-6 md:mb-8 shadow-lg shadow-orange-500/20">
                  <Target className="text-white w-6 h-6 md:w-8 md:h-8" />
                </div>
                <h3 className="text-xl md:text-2xl font-black mb-6 uppercase tracking-wider">Our Mission</h3>
                <p className="text-slate-300 text-lg md:text-xl leading-relaxed italic font-serif">
                  &quot;To set the benchmark for safety-critical engineering in Southern Africa through direct accountability, technical excellence, and uncompromising compliance.&quot;
                </p>
              </div>
            </motion.div>
            
            {/* Background Image Element */}
            <div className="absolute -bottom-4 -right-4 md:-bottom-6 md:-right-6 w-full h-full border-2 border-orange-500/20 rounded-2xl -z-10"></div>
          </motion.div>
        </div>

        {/* Values Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
          {values.map((value, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="bg-white p-6 md:p-8 rounded-xl border border-slate-200 hover:border-orange-500/50 hover:shadow-2xl hover:shadow-slate-200/50 transition-all group cursor-default"
            >
              <motion.div 
                whileHover={{ rotate: 5, scale: 1.1 }}
                className="w-12 h-12 bg-slate-50 rounded-lg flex items-center justify-center mb-6 group-hover:bg-orange-500 transition-colors"
              >
                <value.icon className="text-[#1A2B4C] group-hover:text-white transition-colors" size={24} />
              </motion.div>
              <h4 className="text-[#1A2B4C] font-black text-base md:text-lg mb-4 uppercase tracking-normal">
                {value.title}
              </h4>
              <p className="text-slate-500 text-xs md:text-sm leading-relaxed">
                {value.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
