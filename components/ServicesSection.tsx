'use client';

import { motion } from 'motion/react';
import { Flame, Cpu, Zap, AlertTriangle, Settings, ArrowUpRight, CheckCircle2, ShieldCheck, Award, Clock, Globe } from 'lucide-react';
import Link from 'next/link';

const trustSignals = [
  { icon: ShieldCheck, title: "IEC 61511 & SANS 10089", subtitle: "Compliant" },
  { icon: Award, title: "OEM-Approved", subtitle: "Equipment" },
  { icon: Clock, title: "24/7 Emergency", subtitle: "Support" },
  { icon: Globe, title: "Regional & Cross-Border", subtitle: "Service" },
];

const services = [
  {
    title: "Fire & Gas Detection",
    icon: Flame,
    description: "Advanced flame and gas detection systems engineered for hazardous industrial environments. We deliver compliant, reliable solutions from design through commissioning.",
    features: ["System Design & Layout Studies", "SPECTREX Optical Monitoring", "Compliance Verification"],
    color: "orange",
    href: "/services/fire-and-gas-detection"
  },
  {
    title: "Control & Instrumentation",
    icon: Cpu,
    description: "Complete automation solutions including PLC programming, SCADA systems, and process control optimization for high-risk facilities.",
    features: ["PLC Programming & Configuration", "Flow, Pressure & Level Instruments", "Process Analytics (pH, O2)"],
    color: "navy",
    href: "/services/control-and-instrumentation"
  },
  {
    title: "Electrical Engineering",
    icon: Zap,
    description: "Professional electrical design, installation, and maintenance services for heavy industrial applications and plant operations.",
    features: ["Industrial System Design", "Plant Commissioning", "Preventive Maintenance Programs"],
    color: "navy",
    href: "/services/electrical-engineering"
  },
  {
    title: "Hazardous Area Classification",
    icon: AlertTriangle,
    description: "Expert area classification studies, zone drawings, and equipment selection support to ensure compliance with IECEx and ATEX requirements.",
    features: ["Area Classification Studies", "Zone Drawings & Documentation", "Ex-Rated Equipment Specification"],
    color: "navy",
    href: "/services/hazardous-area-classification"
  },
  {
    title: "Design & Engineering",
    icon: ShieldCheck,
    description: "Front-end engineering design (FEED) and detailed engineering for complex industrial systems, ensuring safety and efficiency from the start.",
    features: ["P&ID Development", "Front-End Engineering (FEED)", "Technical Specifications"],
    color: "navy",
    href: "/services/design-and-engineering"
  },
  {
    title: "Installation & Commissioning",
    icon: Award,
    description: "Expert on-site execution and seamless handovers. We ensure your systems are installed correctly and perform to specification.",
    features: ["On-Site Project Management", "System Testing & Validation", "Operator Training & Handover"],
    color: "navy",
    href: "/services/installation-and-commissioning"
  },
  {
    title: "Maintenance & Support",
    icon: Settings,
    description: "24/7 emergency support, service level agreements, and preventative maintenance programs to keep your systems running safely.",
    features: ["24/7 Emergency Field Service", "Service Level Agreements (SLAs)", "Remote Support & Diagnostics"],
    color: "navy",
    href: "/services/maintenance-and-support"
  }
];

export default function ServicesSection() {
  return (
    <section id="services" className="py-20 md:py-32 bg-white relative overflow-hidden">
      <div className="container mx-auto px-4 md:px-8 relative z-10">
        {/* Header */}
        <div className="max-w-3xl mb-16 md:mb-24">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="flex items-center space-x-2 mb-6"
          >
            <div className="h-px w-8 bg-orange-500"></div>
            <span className="text-orange-500 font-mono text-[10px] md:text-xs font-bold uppercase tracking-[0.3em]">
              What We Offer
            </span>
          </motion.div>
          
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-[#1A2B4C] text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black mb-6 uppercase tracking-normal leading-tight"
          >
            Engineering Services <br /> for <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF6900] to-orange-300">safety critical </span><span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF6900] to-orange-300">environments.</span>
          </motion.h2>
          
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-slate-500 text-base md:text-lg leading-relaxed max-w-2xl font-medium"
          >
            Specialist fire & gas, control and instrumentation, and electrical engineering services designed for regulated industrial operations across Southern Africa.
          </motion.p>
        </div>

        {/* Services Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 lg:gap-8">
          {services.map((service, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              whileHover={{ y: -10 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="group relative p-5 md:p-6 lg:p-10 rounded-2xl border bg-[#1A2B4C] border-white/10 hover:border-[#ff6900]/50 transition-all duration-300 flex flex-col h-full shadow-2xl hover:shadow-[#ff6900]/10 overflow-hidden"
            >
              {/* Icon Container */}
              <div className="w-10 h-10 md:w-12 md:h-12 lg:w-16 lg:h-16 rounded-xl flex items-center justify-center mb-6 md:mb-8 bg-[#263655] transition-all duration-300 group-hover:bg-orange-500 group-hover:rotate-6">
                <service.icon className="text-white transition-colors duration-300" size={24} />
              </div>

              {/* Content */}
              <h3 className="text-lg md:text-xl lg:text-2xl font-black mb-3 md:mb-4 uppercase tracking-normal text-white transition-colors">
                {service.title}
              </h3>
              
              <p className="text-xs md:text-sm leading-relaxed mb-6 md:mb-8 flex-grow text-slate-400 font-medium">
                {service.description}
              </p>

              {/* Features List */}
              <div className="space-y-2 md:space-y-3 mb-6 md:mb-10">
                {service.features.map((feature, fIndex) => (
                  <div key={fIndex} className="flex items-start space-x-2">
                    <CheckCircle2 size={14} className="text-[#ff6900] mt-0.5 md:mt-1 shrink-0" />
                    <span className="text-[10px] md:text-xs font-bold uppercase tracking-wide text-slate-300">
                      {feature}
                    </span>
                  </div>
                ))}
              </div>

              {/* Footer Link */}
              <Link 
                href={service.href}
                className="flex items-center space-x-2 text-[10px] md:text-xs font-black uppercase tracking-[0.2em] text-[#ff6900] hover:text-white transition-colors"
              >
                <span>Read More</span>
                <ArrowUpRight size={16} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </Link>

              {/* Decorative Corner Accent */}
              <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="w-8 h-8 border-t-2 border-r-2 border-[#ff6900] rounded-tr-lg"></div>
              </div>
            </motion.div>
          ))}
          
          {/* Contact CTA Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            whileHover={{ x: 10 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4 }}
            className="lg:col-span-2 p-6 sm:p-8 md:p-10 rounded-2xl bg-[#ff6900] flex flex-col justify-center items-start group cursor-pointer hover:bg-[#e55e00] transition-all shadow-2xl hover:shadow-[#ff6900]/20"
          >
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between w-full gap-6">
              <div>
                <h3 className="text-white text-2xl md:text-3xl font-black mb-4 uppercase tracking-normal leading-tight">
                  Need a Custom <br /> Engineering Solution?
                </h3>
                <p className="text-white/80 text-xs md:text-sm font-bold">
                  Our technical team is ready to discuss your specific facility requirements.
                </p>
              </div>
              <motion.div 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="shrink-0"
              >
                <Link 
                  href="/contact#request-quote"
                  className="bg-[#1A2B4C] text-white px-5 sm:px-8 py-4 rounded-md font-black text-[11px] md:text-sm uppercase tracking-[0.12em] sm:tracking-widest transition-all shadow-xl hover:shadow-black/20 flex items-center justify-center space-x-2 w-full sm:w-auto"
                >
                  <span>Start Consultation</span>
                  <ArrowUpRight size={18} />
                </Link>
              </motion.div>
            </div>
          </motion.div>
        </div>

        {/* Trust Bar */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.6 }}
          className="mt-20 md:mt-32 pt-16 border-t border-slate-100"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-12">
            {trustSignals.map((signal, index) => (
              <motion.div 
                key={index} 
                whileHover={{ y: -5 }}
                className="flex items-center space-x-4 group"
              >
                <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center border border-slate-100 group-hover:bg-orange-50 group-hover:border-orange-200 transition-all duration-300">
                  <signal.icon className="text-[#1A2B4C] group-hover:text-[#ff6900] transition-colors" size={24} />
                </div>
                <div className="flex flex-col">
                  <span className="text-[#1A2B4C] font-black text-xs uppercase tracking-wider leading-tight">
                    {signal.title}
                  </span>
                  <span className="text-slate-400 font-bold text-[10px] uppercase tracking-[0.2em]">
                    {signal.subtitle}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
