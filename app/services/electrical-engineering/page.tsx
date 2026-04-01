'use client';

import { motion, AnimatePresence } from 'motion/react';
import { 
  Zap, ShieldCheck, CheckCircle2, ArrowRight, Cpu, 
  Lightbulb, Activity, Settings, FileText, ChevronRight,
  HardHat, Factory, Droplets, ZapOff, Microscope,
  Plus, Minus, Layout, Layers, Shield, ArrowUpRight, Phone
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
    title: "Electrical System Design",
    description: "We develop electrical designs for industrial facilities including single line diagrams, cable schedules, protection studies, and layout drawings. Every design is based on the actual site conditions and operational requirements."
  },
  {
    title: "Power Distribution",
    description: "We design and install power distribution systems including switchgear, distribution boards, transformers, and cable reticulation for industrial plants and process areas."
  },
  {
    title: "Motor Control & Drive Systems",
    description: "We handle motor control centre design, variable speed drive installations, soft starter setups, and associated protection and control wiring."
  },
  {
    title: "Industrial Lighting",
    description: "We design and install lighting systems for industrial facilities including process areas, warehouses, workshops, and hazardous locations. All lighting designs consider the classification of the area and the operational needs of the site."
  },
  {
    title: "Earthing & Lightning Protection",
    description: "We design and install earthing systems and lightning protection for industrial sites. Proper earthing is critical for equipment protection, personnel safety, and system reliability."
  },
  {
    title: "Hazardous Area Electrical Installations",
    description: "We carry out electrical installations in classified hazardous areas in accordance with ATEX, IECEx, and IEC 60079 requirements. This includes correct equipment selection, cable gland terminations, and inspection documentation."
  },
  {
    title: "Testing & Commissioning",
    description: "We perform insulation resistance testing, earth continuity testing, protection relay testing, and full system commissioning before handover. Every test result is documented and included in the handover package."
  },
  {
    title: "Electrical Maintenance & Support",
    description: "We provide planned maintenance, fault finding, and emergency electrical support for industrial clients. Our team is available for scheduled work and urgent callouts when needed."
  }
];

const systems = [
  "Medium and low voltage power distribution",
  "Switchgear and distribution boards",
  "Motor control centres and drive systems",
  "Industrial and hazardous area lighting",
  "Earthing, bonding, and lightning protection",
  "Cable management and containment systems",
  "Hazardous area electrical equipment and installations",
  "Protection coordination and relay settings",
  "Electrical testing and inspection",
  "Emergency and standby power systems"
];

const standards = [
  { code: "SANS 10142", desc: "Wiring of Premises (South African wiring regulations)" },
  { code: "IEC 60079", desc: "Electrical Equipment for Explosive Atmospheres" },
  { code: "ATEX / IECEx", desc: "Hazardous Area Equipment Certification" },
  { code: "IEC 61439", desc: "Low Voltage Switchgear and Controlgear Assemblies" },
  { code: "SANS 10199", desc: "The Design and Erection of Overhead Power Lines" },
  { code: "OHS Act", desc: "Electrical Machinery Regulations" },
  { code: "ECSA", desc: "Engineering Council of South Africa (Pr Tech Eng registered)" }
];

const industries = [
  { name: "Oil & Gas Refineries", icon: Droplets },
  { name: "Chemical & Petrochemical Plants", icon: Factory },
  { name: "Mining & Minerals Processing", icon: HardHat },
  { name: "Manufacturing & Heavy Industry", icon: Settings },
  { name: "Power Generation Facilities", icon: ZapOff },
  { name: "Industrial Warehousing & Storage", icon: Layers }
];

const whyChooseUs = [
  {
    title: "ECSA Registered Professional",
    desc: "Touch Teq is registered with the Engineering Council of South Africa as a Professional Technologist in Electrical Engineering. That registration carries legal accountability and professional responsibility for the work we do."
  },
  {
    title: "No Subcontractors",
    desc: "We do not hand your project off to third parties. The engineer who designs the system is the same person who oversees the installation and signs off on the commissioning."
  },
  {
    title: "Hazardous Area Experience",
    desc: "We have hands-on experience with electrical installations in classified hazardous areas. We understand the requirements of ATEX, IECEx, and IEC 60079 and apply them correctly on site."
  },
  {
    title: "Proper Documentation",
    desc: "Every project comes with complete documentation. Test certificates, as-built drawings, cable schedules, and commissioning records. Your maintenance team and auditors will have everything they need."
  }
];

const faqs = [
  {
    q: "What types of electrical work do you handle?",
    a: "We handle industrial electrical engineering including power distribution, motor control, lighting, earthing, hazardous area installations, testing, and commissioning. We do not do residential or commercial electrical work."
  },
  {
    q: "Are you registered with ECSA?",
    a: "Yes. Touch Teq is registered with the Engineering Council of South Africa as a Professional Technologist in Electrical Engineering (Pr Tech Eng). This means our work carries the professional accountability required for industrial projects."
  },
  {
    q: "Can you work in hazardous areas?",
    a: "Yes. We carry out electrical installations in ATEX and IECEx classified hazardous areas. This includes correct equipment selection, proper cable gland terminations, and the inspection documentation required for compliance."
  },
  {
    q: "Do you provide electrical maintenance services?",
    a: "Yes. We offer planned preventative maintenance, fault finding, and emergency callout support for industrial electrical systems. Regular maintenance helps prevent unplanned downtime and keeps your systems compliant."
  },
  {
    q: "What documentation do you provide after a project?",
    a: "We provide full handover documentation including test certificates, as-built drawings, cable schedules, protection settings, and commissioning records. Everything your team needs to operate and maintain the system."
  },
  {
    q: "Do you handle both new installations and upgrades?",
    a: "Yes. We work on new electrical installations as well as upgrades, replacements, and modifications to existing systems. We assess the current setup and recommend the most practical approach for your facility."
  }
];

export default function ElectricalEngineeringPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <main className="bg-white min-h-screen font-sans">
      <BreadcrumbJsonLd 
        items={[
          { name: 'Home', url: 'https://touchteq.co.za' },
          { name: 'Services', url: 'https://touchteq.co.za/#services' },
          { name: 'Electrical Engineering', url: 'https://touchteq.co.za/services/electrical-engineering' }
        ]}
      />
      <FAQJsonLd 
        faqs={faqs.map(faq => ({ question: faq.q, answer: faq.a }))}
      />
      <ServiceJsonLd 
        name="Industrial Electrical Engineering"
        description="Professional industrial electrical engineering services across Southern Africa. ECSA registered, handling power distribution, motor control, lighting, and hazardous area installations."
        url="https://touchteq.co.za/services/electrical-engineering"
        serviceType={[
          'Electrical Design', 
          'Power Distribution', 
          'Motor Control', 
          'Industrial Lighting',
          'Earthing & Lightning Protection',
          'Testing & Commissioning'
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
        {/* Background Image with Overlay */}
        <div className="absolute inset-0 z-0">
          <Image
            src="/High_voltage_electrical.png"
            alt="Industrial Electrical Engineering"
            fill
            className="object-cover opacity-30"
            priority
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#1A2B4C] via-[#1A2B4C]/80 to-transparent"></div>
          <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#1A2B4C] to-transparent"></div>
        </div>

        <div className="container mx-auto px-4 md:px-8 relative z-10">
          {/* Breadcrumbs */}
          <nav className="flex items-center space-x-2 text-slate-400 text-[10px] font-black uppercase tracking-widest mb-8">
            <Link href="/" className="hover:text-orange-500 transition-colors">Home</Link>
            <ChevronRight size={12} />
            <Link href="/#services" className="hover:text-orange-500 transition-colors">Our Services</Link>
            <ChevronRight size={12} />
            <span className="text-white">Electrical Engineering</span>
          </nav>

          <div className="max-w-4xl">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-4xl md:text-6xl lg:text-7xl font-black text-white uppercase tracking-tight mb-8 leading-none"
            >
              Industrial <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF6900] to-orange-300">Electrical</span> <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF6900] to-orange-300">Engineering Services</span>
            </motion.h1>
            
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-slate-300 text-lg md:text-xl max-w-2xl leading-relaxed mb-10 font-medium"
            >
              We provide electrical engineering services for industrial facilities across Southern Africa. From power distribution and motor control to lighting, earthing, and hazardous area electrical installations. Every project is handled by a registered professional engineer.
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
          animate={{ opacity: 0.05, scale: 1, rotate: 0 }}
          transition={{ duration: 1 }}
          className="absolute right-[-5%] bottom-[-10%] text-white hidden lg:block"
        >
          <Zap size={600} />
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
              <span className="text-orange-500 font-black text-xs uppercase tracking-[0.4em]">Electrical Engineering</span>
              <div className="w-8 h-px bg-orange-500"></div>
            </motion.div>
            
            <h2 className="text-[#1A2B4C] text-3xl md:text-5xl font-black uppercase tracking-normal mb-8 leading-tight">
              Safe, Reliable Electrical Systems for <br />
              <span className="text-orange-500">Industrial Environments</span>
            </h2>
            
            <div className="space-y-6 text-slate-600 text-lg leading-relaxed font-medium">
              <p>
                Electrical systems in industrial facilities need to be safe, reliable, and properly designed for the environment they operate in. Whether it is a refinery, a chemical plant, or a mining operation, the consequences of poor electrical design or installation can be serious.
              </p>
              <p>
                At Touch Teq Engineering, we handle industrial electrical work from design through to installation, testing, and handover. We focus on getting the fundamentals right. Proper cable sizing, correct protection coordination, compliant earthing systems, and clear documentation that your maintenance team can actually use.
              </p>
              <p>
                We are registered with ECSA as a Professional Technologist in Electrical Engineering. That means every project carries the accountability of a qualified professional, not a general contractor working outside their scope.
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
            <h2 className="text-[#1A2B4C] text-3xl md:text-5xl font-black uppercase tracking-normal">Electrical Engineering Services <br /> Across the Full Project Lifecycle</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {services.map((service, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group"
              >
                <div className="w-12 h-12 bg-slate-50 rounded-lg flex items-center justify-center mb-6 group-hover:bg-orange-500 transition-colors duration-300">
                  <span className="text-[#1A2B4C] font-black text-xl group-hover:text-white transition-colors">0{index + 1}</span>
                </div>
                <h3 className="text-lg font-black text-[#1A2B4C] uppercase tracking-normal mb-4 group-hover:text-orange-500 transition-colors">{service.title}</h3>
                <p className="text-slate-500 text-xs leading-relaxed font-medium">{service.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Section 3: What We Work On */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-4 md:px-8">
          <div className="flex flex-col lg:flex-row gap-16 items-center">
            <div className="lg:w-1/2">
              <div className="relative rounded-3xl overflow-hidden shadow-2xl aspect-[4/5]">
                <Image 
                  src="/electrical-infrastructure-industrial-ops.jpeg" 
                  alt="Industrial Electrical Infrastructure" 
                  fill 
                  className="object-cover"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#1A2B4C]/80 to-transparent"></div>
                <div className="absolute bottom-10 left-10 right-10">
                  <div className="bg-orange-500 inline-block px-4 py-2 rounded-full text-white text-[10px] font-black uppercase tracking-widest mb-4">
                    Industrial Infrastructure
                  </div>
                  <h4 className="text-white text-2xl font-black uppercase tracking-normal">
                    Electrical Infrastructure for Industrial Operations
                  </h4>
                </div>
              </div>
            </div>
            
            <div className="lg:w-1/2">
              <span className="text-orange-500 font-black text-xs uppercase tracking-[0.4em] block mb-6">Systems & Applications</span>
              <h2 className="text-[#1A2B4C] text-3xl md:text-5xl font-black uppercase tracking-normal mb-8 leading-tight">
                Reliable Power for <br />
                <span className="text-orange-500">Complex Operations</span>
              </h2>
              
              <p className="text-slate-600 text-lg leading-relaxed mb-10 font-medium">
                Our electrical engineering work covers a broad range of industrial systems. We help clients keep their electrical infrastructure safe, compliant, and fit for purpose.
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {systems.map((item, i) => (
                  <div key={i} className="flex items-center space-x-3 group">
                    <div className="w-2 h-2 bg-orange-500 rounded-full group-hover:scale-150 transition-transform"></div>
                    <span className="text-slate-600 text-sm font-bold uppercase tracking-normal">{item}</span>
                  </div>
                ))}
              </div>
              
              <div className="mt-12 p-8 bg-[#1A2B4C] rounded-2xl text-white">
                <h4 className="text-xl font-black uppercase tracking-normal mb-4 flex items-center">
                  <Shield className="text-orange-500 mr-3" size={24} />
                  Safety First Approach
                </h4>
                <p className="text-slate-300 text-sm leading-relaxed">
                  Every electrical system is designed with multiple layers of protection. We ensure that protection coordination is correctly calculated to prevent cascading failures and minimize equipment damage during faults.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 4: Standards & Compliance */}
      <section className="py-24 bg-[#1A2B4C] text-white">
        <div className="container mx-auto px-4 md:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <span className="text-orange-500 font-black text-xs uppercase tracking-[0.4em] block mb-6">Compliance & Standards</span>
              <h2 className="text-3xl md:text-5xl font-black uppercase tracking-normal mb-8 leading-tight">
                Electrical Systems <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF6900] to-orange-300">Designed and Installed</span> <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF6900] to-orange-300">to the Right Standards</span>
              </h2>
              <p className="text-slate-300 text-lg leading-relaxed mb-8 font-medium">
                Industrial electrical work carries real risk if it is not done properly. We follow the applicable standards and regulations for every project, and we make sure the documentation is in order for inspections and audits.
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
                  <div className="bg-orange-500/20 text-orange-500 px-3 py-1 rounded font-black text-xs uppercase tracking-widest min-w-[120px] text-center">
                    {std.code}
                  </div>
                  <p className="text-slate-300 text-sm font-bold uppercase tracking-normal">{std.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Section 5: Industries We Serve */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-4 md:px-8">
          <div className="text-center mb-16">
            <span className="text-orange-500 font-black text-xs uppercase tracking-[0.4em] block mb-4">Industries</span>
            <h2 className="text-[#1A2B4C] text-3xl md:text-5xl font-black uppercase tracking-normal">Industrial Electrical Engineering <br /> Across Southern Africa</h2>
            <p className="text-slate-500 text-lg mt-6 max-w-3xl mx-auto font-medium">
              We work with industrial clients who need dependable electrical systems in environments where safety, uptime, and compliance matter.
            </p>
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

      {/* Section 6: Why Choose Touch Teq */}
      <section className="py-24 bg-slate-50">
        <div className="container mx-auto px-4 md:px-8">
          <div className="flex flex-col lg:flex-row gap-16 items-center">
            <div className="lg:w-1/2">
              <span className="text-orange-500 font-black text-xs uppercase tracking-[0.4em] block mb-6">Why Touch Teq</span>
              <h2 className="text-[#1A2B4C] text-3xl md:text-5xl font-black uppercase tracking-normal mb-8 leading-tight">
                Registered. Qualified. <br />
                <span className="text-orange-500">Accountable.</span>
              </h2>
              <div className="relative h-80 w-full rounded-3xl overflow-hidden shadow-xl">
                <Image 
                  src="/qualified-accountable-signoff.jpeg" 
                  alt="Electrical Testing" 
                  fill 
                  className="object-cover object-top"
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

      {/* Section 7: FAQ */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-4 md:px-8">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-16">
              <span className="text-orange-500 font-black text-xs uppercase tracking-[0.4em] block mb-4">Frequently Asked Questions</span>
              <h2 className="text-[#1A2B4C] text-3xl md:text-5xl font-black uppercase tracking-normal">Common Questions About <br /> Industrial Electrical Engineering</h2>
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

      {/* Section 8: CTA */}
      <section className="relative w-full bg-[#0A0F1A] text-white overflow-hidden py-32">
        <div className="absolute inset-0 z-0">
          <Image
            src="/f-bg.jpg"
            alt="Industrial Background"
            fill
            className="object-cover opacity-30"
            referrerPolicy="no-referrer"
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
              Need Industrial Electrical <br /> <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF6900] to-orange-300">Engineering Support?</span>
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-slate-400 text-lg md:text-xl max-w-2xl mb-12 font-medium leading-relaxed"
            >
              Talk to a registered professional engineer about your project. Whether it is a new installation, an upgrade, or ongoing maintenance support, we will review your requirements and provide a clear proposal.
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
