'use client';

import { motion, AnimatePresence } from 'motion/react';
import { 
  Flame, ShieldCheck, CheckCircle2, ArrowRight, Zap, Cpu, 
  AlertTriangle, Settings, FileText, Activity, ChevronRight,
  Search, HardHat, Factory, Droplets, ZapOff, Microscope,
  Plus, Minus, ArrowUpRight, Phone
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import BackToTop from '@/components/BackToTop';
import BreadcrumbJsonLd from '@/components/seo/BreadcrumbJsonLd';
import FAQJsonLd from '@/components/seo/FAQJsonLd';
import ServiceJsonLd from '@/components/seo/ServiceJsonLd';
import OrganizationJsonLd from '@/components/seo/OrganizationJsonLd';

const services = [
  {
    title: "Hazard & Risk Assessment",
    description: "We assess your facility to identify fire and gas risks, determine detection zones, and recommend the right system architecture before any equipment is specified."
  },
  {
    title: "System Design & Engineering",
    description: "We produce detailed system designs including detector placement, cause and effect matrices, cable schedules, and full documentation packages aligned with IEC 61511 and SANS 10089."
  },
  {
    title: "Equipment Supply",
    description: "We source and supply fire and gas detection equipment from trusted OEM suppliers only. No gray-market components. No substitutions without client approval."
  },
  {
    title: "Installation & Commissioning",
    description: "Our engineers handle on-site installation, loop testing, and full system commissioning. We do not hand off to subcontractors. The same team that designs the system installs it."
  },
  {
    title: "System Integration",
    description: "We integrate fire and gas detection systems with existing control systems, PLCs, DCS platforms, and building management systems where required."
  },
  {
    title: "Maintenance & Support",
    description: "We provide scheduled preventative maintenance and 24/7 emergency callout support to keep your system operational and compliant at all times."
  }
];

const standards = [
  { code: "IEC 61511", desc: "Functional Safety for Safety Instrumented Systems" },
  { code: "SANS 10089", desc: "Fire Detection and Alarm Systems" },
  { code: "ATEX / IECEx", desc: "Equipment for Explosive Atmospheres" },
  { code: "IEC 60079", desc: "Electrical Equipment in Hazardous Areas" },
  { code: "SANS 10400", desc: "Application of the National Building Regulations" }
];

const industries = [
  { name: "Oil & Gas Refineries", icon: Droplets },
  { name: "Chemical & Petrochemical Plants", icon: Factory },
  { name: "Mining & Minerals Processing", icon: HardHat },
  { name: "Manufacturing & Heavy Industry", icon: Settings },
  { name: "Power Generation Facilities", icon: ZapOff },
  { name: "Pharmaceutical Manufacturing", icon: Microscope }
];

const whyChooseUs = [
  {
    title: "Engineer-Led Projects",
    desc: "Every fire and gas detection project is managed and executed directly by a qualified engineer. You always know who is responsible for your system."
  },
  {
    title: "Compliance From Day One",
    desc: "We design to the standard, not around it. Your documentation, cause and effect matrices, and commissioning records are ready for inspection from day one."
  },
  {
    title: "OEM-Approved Equipment Only",
    desc: "We only supply equipment from approved manufacturers. Every component is traceable, warranted, and supported by the OEM."
  },
  {
    title: "24/7 Emergency Support",
    desc: "If your system goes into fault or alarm outside of business hours, we are available. Industrial operations do not stop and neither do we."
  }
];

const faqs = [
  {
    q: "What is the difference between a fire detection system and a fire and gas detection system?",
    a: "A standard fire detection system monitors for smoke, heat, and flame. A fire and gas detection system adds monitoring for toxic gases, flammable gases, and oxygen depletion. In industrial environments like refineries and chemical plants, gas detection is critical because many hazards involve invisible gases that can cause explosions or health risks before any visible fire starts."
  },
  {
    q: "What standards apply to fire and gas detection in South Africa?",
    a: "The primary standard for fire detection and alarm systems in South Africa is SANS 10089. For safety instrumented systems, including fire and gas systems with safety functions, IEC 61511 applies. In hazardous areas, ATEX and IECEx standards govern the equipment used. Touch Teq designs all systems to meet these requirements."
  },
  {
    q: "What industries do you serve?",
    a: "We work primarily with refineries, chemical plants, petrochemical facilities, mining operations, manufacturing plants, and power generation facilities across Southern Africa. If your facility has a fire or gas risk, we can help."
  },
  {
    q: "How long does a typical fire and gas detection project take?",
    a: "Project timelines depend on the size and complexity of the facility. A small to medium installation typically takes between 4 and 12 weeks from design sign-off to commissioning. Larger or more complex facilities may take longer. We provide a detailed project schedule at the proposal stage so you know exactly what to expect."
  },
  {
    q: "Do you handle maintenance after installation?",
    a: "Yes. We offer scheduled preventative maintenance programs and 24/7 emergency callout support. We recommend annual inspections as a minimum to keep your system compliant and operational."
  },
  {
    q: "Can you integrate a new fire and gas system with our existing control system?",
    a: "Yes. We regularly integrate fire and gas detection systems with existing PLCs, DCS platforms, and SCADA systems. We assess your current setup during the design phase and recommend the best integration approach for your facility."
  }
];

const technicalDetails = [
  {
    category: "Optical Detection",
    items: [
      "Triple IR (IR3) Flame Detectors",
      "Multi-Spectrum IR Detectors",
      "UV/IR Hybrid Detection",
      "Open-Path Gas Monitoring"
    ]
  },
  {
    category: "Gas Monitoring",
    items: [
      "Toxic Gas Detection (H2S, CO, Cl2)",
      "Combustible Gas Monitoring (LEL)",
      "Ultrasonic Leak Detection",
      "Point Infrared Gas Detectors"
    ]
  },
  {
    category: "System Integration",
    items: [
      "Addressable Fire Panels",
      "Voting Logic (2oo3) Configuration",
      "Emergency Shutdown (ESD) Integration",
      "Remote Monitoring & SCADA"
    ]
  }
];

export default function FireAndGasPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <main className="bg-white min-h-screen font-sans">
      <BreadcrumbJsonLd 
        items={[
          { name: 'Home', url: 'https://touchteq.co.za' },
          { name: 'Services', url: 'https://touchteq.co.za/#services' },
          { name: 'Fire & Gas Detection', url: 'https://touchteq.co.za/services/fire-and-gas-detection' }
        ]}
      />
      <FAQJsonLd 
        faqs={faqs.map(faq => ({ question: faq.q, answer: faq.a }))}
      />
      <ServiceJsonLd 
        name="Fire and Gas Detection Engineering"
        description="Specialist engineering, design, and installation of fire and gas detection systems for high-risk industrial facilities. Compliant with IEC 61511 and SANS 10089."
        url="https://touchteq.co.za/services/fire-and-gas-detection"
        serviceType={[
          'Fire Detection', 
          'Gas Monitoring', 
          'Toxic Gas Detection', 
          'Flammable Gas Detection',
          'Industrial Safety Systems'
        ]}
      />
      <OrganizationJsonLd 
        name="Touch Teq Engineering"
        url="https://touchteq.co.za"
        logo="https://touchteq.co.za/logo.png"
        description="Specialist industrial engineering firm delivering fire and gas detection, control and instrumentation, and electrical engineering services across Southern Africa."
      />
      <Header />
      
      {/* Hero Section */}
      <section className="relative pt-32 pb-24 md:pt-48 md:pb-32 bg-[#1A2B4C] overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(#ff6900 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
        </div>
        
        <div className="container mx-auto px-4 md:px-8 relative z-10">
          {/* Breadcrumbs */}
          <nav className="flex items-center space-x-2 text-slate-400 text-[10px] font-black uppercase tracking-widest mb-8">
            <Link href="/" className="hover:text-orange-500 transition-colors">Home</Link>
            <ChevronRight size={12} />
            <Link href="/#services" className="hover:text-orange-500 transition-colors">Our Services</Link>
            <ChevronRight size={12} />
            <span className="text-white">Fire & Gas Detection</span>
          </nav>

          <div className="max-w-4xl">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-4xl md:text-7xl font-black text-white uppercase tracking-tight mb-8 leading-none"
            >
              Fire & Gas <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF6900] to-orange-300">Detection Systems</span> <br />
              <span className="text-2xl md:text-4xl block mt-4 text-white/90 tracking-normal">for Industrial Facilities</span>
            </motion.h1>
            
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-slate-300 text-lg md:text-xl max-w-2xl leading-relaxed mb-10 font-medium"
            >
              We design, supply, install, and commission fire and gas detection systems for refineries, chemical plants, mining operations, and manufacturing facilities across Southern Africa. Every system is built to meet IEC 61511 and SANS 10089 requirements.
            </motion.p>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="flex flex-wrap gap-4"
            >
              <Link href="#contact" className="group flex items-stretch bg-orange-500 hover:bg-orange-600 transition-all rounded-md overflow-hidden shadow-xl shadow-orange-500/20 max-w-full sm:w-auto">
                <span className="px-6 md:px-8 py-3 flex items-center text-white font-black text-[11px] md:text-sm uppercase tracking-widest text-left">
                  Request a Consultation
                </span>
                <div className="bg-[#1A2B4C] px-5 flex items-center justify-center group-hover:bg-black transition-colors shrink-0">
                  <ArrowRight className="text-white w-4 h-4 -rotate-45 group-hover:rotate-0 group-hover:text-orange-500 transition-all duration-300" />
                </div>
              </Link>
              <Link href="/#services" className="group flex items-stretch bg-white hover:bg-slate-100 transition-all rounded-md overflow-hidden shadow-xl max-w-full sm:w-auto">
                <span className="px-6 md:px-8 py-3 flex items-center text-[#0A1120] group-hover:text-orange-500 font-black text-[11px] md:text-sm uppercase tracking-widest text-left transition-colors">
                  View All Services
                </span>
                <div className="bg-[#ff6900] px-5 flex items-center justify-center group-hover:bg-orange-600 transition-colors shrink-0">
                  <ArrowRight className="text-white w-4 h-4 -rotate-45 group-hover:rotate-0 transition-all duration-300" />
                </div>
              </Link>
            </motion.div>
          </div>
        </div>
        
        {/* Floating Icon */}
        <motion.div
          initial={{ opacity: 0, scale: 0.5, rotate: -20 }}
          animate={{ opacity: 0.1, scale: 1, rotate: 0 }}
          transition={{ duration: 1 }}
          className="absolute right-[-5%] bottom-[-10%] text-white hidden lg:block"
        >
          <Flame size={600} />
        </motion.div>
      </section>

      {/* Section 1: What We Do */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-4 md:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="flex items-center justify-center space-x-3 mb-6"
            >
              <div className="w-8 h-px bg-orange-500"></div>
              <span className="text-orange-500 font-black text-xs uppercase tracking-[0.4em]">Fire & Gas Detection</span>
              <div className="w-8 h-px bg-orange-500"></div>
            </motion.div>
            
            <h2 className="text-[#1A2B4C] text-3xl md:text-4xl lg:text-5xl font-black uppercase tracking-normal mb-8 leading-none">
              Protecting People and Assets in <br />
              <span className="text-orange-500">High-Risk Environments</span>
            </h2>
            
            <div className="space-y-6 text-slate-600 text-lg leading-relaxed font-medium">
              <p>
                Industrial facilities face serious risks from fire, toxic gas, and explosive atmospheres. A properly designed and installed fire and gas detection system is one of the most important layers of protection you can have on site.
              </p>
              <p>
                At Touch Teq Engineering, we handle the full project lifecycle. From initial hazard assessment and system design through to supply, installation, commissioning, and handover. Every system we deliver is designed for your specific facility, your specific risks, and your specific compliance requirements.
              </p>
              <p>
                We work directly with plant managers, engineering teams, and HSE managers to make sure the system does what it needs to do, is properly documented, and is ready for inspection.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Section 2: Our Services (Cards) */}
      <section className="py-24 bg-slate-50">
        <div className="container mx-auto px-4 md:px-8">
          <div className="text-center mb-16">
            <span className="text-orange-500 font-black text-xs uppercase tracking-[0.4em] block mb-4">What We Offer</span>
            <h2 className="text-[#1A2B4C] text-3xl md:text-5xl font-black uppercase tracking-normal">Full-Scope Fire & Gas Detection Services</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {services.map((service, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-white p-10 rounded-2xl border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group"
              >
                <div className="w-12 h-12 bg-slate-50 rounded-lg flex items-center justify-center mb-6 group-hover:bg-orange-500 transition-colors duration-300">
                  <span className="text-[#1A2B4C] font-black text-xl group-hover:text-white transition-colors">0{index + 1}</span>
                </div>
                <h3 className="text-xl font-black text-[#1A2B4C] uppercase tracking-normal mb-4 group-hover:text-orange-500 transition-colors">{service.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed font-medium">{service.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Hybrid Section: Comprehensive Detection Capabilities (Kept from previous version) */}
      <section id="technical" className="py-24 bg-white">
        <div className="container mx-auto px-4 md:px-8">
          <div className="flex flex-col lg:flex-row gap-16 items-center">
            <div className="lg:w-1/2">
              <div className="relative rounded-3xl overflow-hidden shadow-2xl">
                <Image 
                  src="/flame_detector.jpeg" 
                  alt="Industrial Gas Detection" 
                  width={800} 
                  height={1000}
                  className="object-cover"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#1A2B4C]/80 to-transparent"></div>
                <div className="absolute bottom-10 left-10 right-10">
                  <div className="bg-orange-500 inline-block px-4 py-2 rounded-full text-white text-[10px] font-black uppercase tracking-widest mb-4">
                    Field Proven Technology
                  </div>
                  <h4 className="text-white text-2xl font-black uppercase tracking-normal">
                    SPECTREX SharpEye™ Integration
                  </h4>
                </div>
              </div>
            </div>
            
            <div className="lg:w-1/2">
              <h2 className="text-[#1A2B4C] text-3xl md:text-5xl font-black uppercase tracking-normal mb-8 leading-tight">
                Comprehensive <br />
                <span className="text-orange-500">Detection Capabilities</span>
              </h2>
              
              <div className="space-y-10">
                {technicalDetails.map((detail, index) => (
                  <div key={index}>
                    <h4 className="text-[#1A2B4C] text-lg font-black uppercase tracking-widest mb-4 flex items-center">
                      <span className="w-6 h-px bg-orange-500 mr-3"></span>
                      {detail.category}
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {detail.items.map((item, i) => (
                        <div key={i} className="flex items-center space-x-2">
                          <CheckCircle2 size={16} className="text-orange-500" />
                          <span className="text-slate-600 text-sm font-medium">{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-12 p-8 bg-[#1A2B4C] rounded-2xl text-white">
                <h4 className="text-xl font-black uppercase tracking-normal mb-4">Why Engineering Matters</h4>
                <p className="text-slate-300 text-sm leading-relaxed mb-6">
                  A detector is only as good as its placement. We use advanced mapping software to ensure zero blind spots in your facility, accounting for wind patterns, obstruction, and gas buoyancy.
                </p>
                <Link href="#contact" className="inline-flex items-center text-orange-500 font-black text-xs uppercase tracking-[0.2em] hover:text-white transition-colors">
                  Learn about our mapping process <ArrowRight size={16} className="ml-2" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 3: Standards & Compliance */}
      <section className="py-24 bg-[#1A2B4C] text-white">
        <div className="container mx-auto px-4 md:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <span className="text-orange-500 font-black text-xs uppercase tracking-[0.4em] block mb-6">Compliance & Standards</span>
              <h2 className="text-3xl md:text-5xl font-black uppercase tracking-normal mb-8 leading-tight">
                Systems Built for Audits, Inspections, and <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF6900] to-orange-300">Long-Term Compliance</span>
              </h2>
              <p className="text-slate-300 text-lg leading-relaxed mb-8 font-medium">
                Compliance is not an afterthought for us. Every system we design and install is built around the applicable standards from day one. This means your system is ready for internal audits, third-party inspections, and regulatory reviews without last-minute fixes.
              </p>
            </div>
            
            <div className="space-y-4">
              {standards.map((std, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white/5 border border-white/10 p-6 rounded-xl flex items-center space-x-6 group hover:bg-white/10 transition-colors"
                >
                  <div className="bg-orange-500/20 text-orange-500 px-3 py-1 rounded font-black text-xs uppercase tracking-widest min-w-[100px] text-center">
                    {std.code}
                  </div>
                  <p className="text-slate-300 text-sm font-bold uppercase tracking-normal">{std.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Section 4: Industries We Serve */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-4 md:px-8">
          <div className="text-center mb-16">
            <span className="text-orange-500 font-black text-xs uppercase tracking-[0.4em] block mb-4">Industries</span>
            <h2 className="text-[#1A2B4C] text-3xl md:text-5xl font-black uppercase tracking-normal">Experience Across Southern Africa&apos;s <br />Most Demanding Industrial Sectors</h2>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            {industries.map((industry, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
                className="flex flex-col items-center text-center p-8 rounded-2xl border border-slate-100 hover:border-orange-500 transition-colors group"
              >
                <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center mb-6 group-hover:bg-orange-50 transition-colors">
                  <industry.icon className="text-[#1A2B4C] group-hover:text-orange-500 transition-colors" size={32} />
                </div>
                <span className="text-[#1A2B4C] font-black text-[10px] uppercase tracking-widest leading-tight">{industry.name}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Section 5: Why Choose Touch Teq */}
      <section className="py-24 bg-slate-50">
        <div className="container mx-auto px-4 md:px-8">
          <div className="flex flex-col lg:flex-row gap-16 items-center">
            <div className="lg:w-1/2">
              <span className="text-orange-500 font-black text-xs uppercase tracking-[0.4em] block mb-6">Why Touch Teq</span>
              <h2 className="text-[#1A2B4C] text-3xl md:text-5xl font-black uppercase tracking-normal mb-8 leading-tight">
                Specialist Engineers. <br />
                Direct Accountability. <br />
                <span className="text-orange-500">No Subcontractors.</span>
              </h2>
              <div className="relative h-80 w-full rounded-3xl overflow-hidden shadow-xl">
                <Image 
                  src="/qualified-engineer.png" 
                  alt="Engineer on site" 
                  fill 
                  className="object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
            </div>
            
            <div className="lg:w-1/2 grid grid-cols-1 sm:grid-cols-2 gap-8">
              {whyChooseUs.map((point, index) => (
                <div key={index} className="space-y-4">
                  <div className="w-10 h-10 bg-[#1A2B4C] text-white rounded-lg flex items-center justify-center font-black">
                    {index + 1}
                  </div>
                  <h4 className="text-[#1A2B4C] text-lg font-black uppercase tracking-normal">{point.title}</h4>
                  <p className="text-slate-500 text-sm leading-relaxed font-medium">{point.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Section 6: FAQ */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-4 md:px-8">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-16">
              <span className="text-orange-500 font-black text-xs uppercase tracking-[0.4em] block mb-4">Frequently Asked Questions</span>
              <h2 className="text-[#1A2B4C] text-3xl md:text-5xl font-black uppercase tracking-normal">Common Questions About <br /> Fire & Gas Detection</h2>
            </div>
            
            <div className="space-y-4">
              {faqs.map((faq, index) => (
                <div key={index} className="border border-slate-100 rounded-2xl overflow-hidden">
                  <button 
                    onClick={() => setOpenFaq(openFaq === index ? null : index)}
                    className="w-full flex items-center justify-between p-6 text-left hover:bg-slate-50 transition-colors"
                  >
                    <span className={`font-black text-sm md:text-base uppercase tracking-normal transition-colors ${openFaq === index ? 'text-orange-500' : 'text-[#1A2B4C] hover:text-orange-500'}`}>{faq.q}</span>
                    {openFaq === index ? <Minus className="text-orange-500" /> : <Plus className="text-orange-500" />}
                  </button>
                  <AnimatePresence>
                    {openFaq === index && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="p-6 pt-0 text-slate-500 text-sm md:text-base leading-relaxed font-medium border-t border-slate-50">
                          {faq.a}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Section 7: CTA */}
      <section className="relative w-full bg-[#0A0F1A] text-white overflow-hidden py-32">
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
              className="text-5xl md:text-7xl font-black text-white uppercase tracking-normal leading-[0.85] mb-10"
            >
              Ready to Discuss Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF6900] to-orange-300">Fire & Gas Detection</span> <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF6900] to-orange-300">Needs?</span>
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-slate-400 text-lg md:text-xl max-w-2xl mb-12 font-medium leading-relaxed"
            >
              Talk to a qualified engineer about your facility. We will review your requirements, identify the right system for your environment, and provide a detailed proposal.
            </motion.p>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="flex flex-col sm:flex-row gap-6"
            >
              <Link href="/contact" className="group flex items-stretch bg-white hover:bg-slate-100 transition-all rounded-md overflow-hidden shadow-xl max-w-full sm:w-auto">
                <span className="px-6 md:px-8 py-3 flex items-center text-[#0A1120] group-hover:text-orange-500 font-black text-[11px] md:text-sm uppercase tracking-widest text-left transition-colors">
                  REQUEST A CONSULTATION
                </span>
                <div className="bg-[#ff6900] px-4 md:px-5 flex items-center justify-center group-hover:bg-orange-600 transition-colors shrink-0">
                  <ArrowRight className="text-white w-4 h-4 -rotate-45 group-hover:rotate-0 transition-all duration-300" />
                </div>
              </Link>

              <a href="tel:+27725522110" className="group flex items-stretch bg-orange-500 hover:bg-orange-600 transition-all rounded-md overflow-hidden shadow-xl shadow-orange-500/20 max-w-full sm:w-auto">
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
    </main>
  );
}
