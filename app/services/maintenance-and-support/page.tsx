'use client';

import { motion, AnimatePresence } from 'motion/react';
import {
  Clock, ShieldCheck, Activity, Wrench, Cpu, Package,
  ChevronRight, ArrowRight, CheckCircle2, Factory,
  Droplets, HardHat, ZapOff, Microscope, Plus, Minus,
  Info, AlertTriangle, ShieldAlert, Flame, BookOpen,
  ClipboardCheck, History, Search, PhoneCall, ArrowUpRight
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import BackToTop from '@/components/BackToTop';

const services = [
  {
    title: "Preventative Maintenance",
    description: "We perform scheduled inspections, cleaning, and testing of your fire and gas, electrical, and control systems. Regular maintenance reduces the risk of nuisance alarms and unexpected equipment failure.",
    icon: ShieldCheck
  },
  {
    title: "24/7 Emergency Callout",
    description: "Industrial operations don't stop at 5 PM. We provide rapid-response emergency support for critical system faults, ensuring your plant returns to a safe operating state as quickly as possible.",
    icon: Clock
  },
  {
    title: "System Health Checks & Audits",
    description: "We perform detailed technical audits of existing systems to identify aging components, compliance gaps, or performance issues that need to be addressed.",
    icon: Search
  },
  {
    title: "Calibration & Functional Testing",
    description: "We provide on-site calibration for gas detectors and process instruments, along with full functional testing of safety loops and cause-and-effect logic.",
    icon: Activity
  },
  {
    title: "Software & PLC Support",
    description: "We assist with control system troubleshooting, software backups, and minor logic modifications to keep your automation and monitoring systems up to date.",
    icon: Cpu
  },
  {
    title: "Spare Parts Management",
    description: "We help you identify and source critical spare parts, ensuring you have the right components on hand to minimize downtime during a failure.",
    icon: Package
  }
];

const whyMatters = [
  {
    title: "Regulatory Compliance",
    desc: "Meeting the mandatory inspection requirements of SANS and OHS regulations."
  },
  {
    title: "Reduced Nuisance Alarms",
    desc: "Preventing costly production stops caused by faulty or dirty detectors."
  },
  {
    title: "Extended Equipment Life",
    desc: "Identifying and resolving minor issues before they lead to total component failure."
  },
  {
    title: "Audit Readiness",
    desc: "Maintaining a continuous record of system health for insurance and safety inspectors."
  },
  {
    title: "Personnel Safety",
    desc: "Ensuring that life-safety systems like fire and gas detection are 100% functional."
  }
];

const standards = [
  { code: "SANS 10089", desc: "Maintenance and testing of fire detection systems" },
  { code: "IEC 60079-17", desc: "Inspection and maintenance of electrical installations in hazardous areas" },
  { code: "IEC 61511", desc: "Functional safety requirements for the operational phase" },
  { code: "OEM Procedures", desc: "OEM-specific maintenance and calibration procedures" },
  { code: "Safety Files", desc: "Detailed maintenance reports and updated safety files for every visit" }
];

const industries = [
  { name: "Oil & Gas Refineries", icon: Droplets },
  { name: "Chemical & Petrochemical", icon: Factory },
  { name: "Mining & Minerals Processing", icon: HardHat },
  { name: "Manufacturing & Heavy Industry", icon: Factory },
  { name: "Power Generation Facilities", icon: ZapOff },
  { name: "Bulk Liquid Storage", icon: Droplets }
];

const whyChooseUs = [
  {
    title: "Qualified Engineers, Not Just Technicians",
    desc: "Our maintenance work is overseen by qualified engineers who understand the 'why' behind the system, not just the 'how.' This leads to better troubleshooting and more reliable solutions."
  },
  {
    title: "Regional Responsiveness",
    desc: "We are structured to support clients across Southern Africa. We understand the logistics of getting specialized skills to remote sites quickly."
  },
  {
    title: "Comprehensive Reporting",
    desc: "You receive a detailed report after every visit. We highlight what was tested, what was fixed, and what needs attention in the future. No vague 'system okay' checkboxes."
  },
  {
    title: "Accountability & Ownership",
    desc: "We take pride in the long-term performance of the systems we maintain. We act as a technical partner to your maintenance team, not just a once-off contractor."
  }
];

const faqs = [
  {
    q: "How often should our fire and gas system be maintained?",
    a: "Most standards and OEMs recommend a full functional test and calibration at least every 6 to 12 months, depending on the environment and the specific risks at your facility."
  },
  {
    q: "Do you offer 24/7 support?",
    a: "Yes. We provide emergency callout support for our contract clients to ensure that critical system faults are addressed immediately, regardless of the time or day."
  },
  {
    q: "Can you maintain systems that were installed by other companies?",
    a: "Yes. We frequently take over the maintenance of existing systems. We start with a full system audit to understand the current state of the installation before beginning a regular maintenance program."
  },
  {
    q: "Do you provide calibration certificates?",
    a: "Yes. Every instrument or detector we calibrate comes with a formal calibration record for your safety file and audit requirements."
  },
  {
    q: "What is included in a maintenance contract?",
    a: "Contracts are tailored to your site but typically include scheduled preventative visits, guaranteed emergency response times, discounted labor rates, and priority access to spare parts."
  }
];

export default function MaintenanceAndSupportPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <main className="bg-white min-h-screen font-sans">
      <Header />

      {/* Hero Section */}
      <section className="relative pt-32 pb-24 md:pt-48 md:pb-32 bg-[#1A2B4C] overflow-hidden">
        {/* Background Image with Overlay */}
        <div className="absolute inset-0 z-0">
          <Image
            src="https://picsum.photos/seed/industrial-maintenance/1920/1080"
            alt="Industrial Maintenance & Support"
            fill
            className="object-cover opacity-30"
            priority
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#1A2B4C] via-[#1A2B4C]/80 to-transparent"></div>
        </div>

        <div className="container mx-auto px-4 md:px-8 relative z-10">
          {/* Breadcrumbs */}
          <nav className="flex items-center space-x-2 text-slate-400 text-[10px] font-black uppercase tracking-widest mb-8">
            <Link href="/" className="hover:text-orange-500 transition-colors">Home</Link>
            <ChevronRight size={12} />
            <Link href="/#services" className="hover:text-orange-500 transition-colors">Our Services</Link>
            <ChevronRight size={12} />
            <span className="text-white">Maintenance & Support</span>
          </nav>

          <div className="max-w-4xl">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-4xl md:text-7xl font-black text-white uppercase tracking-tight mb-8 leading-none"
            >
              Industrial <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF6900] to-orange-300">Maintenance & 24/7</span> <br />
              <span className="text-2xl md:text-4xl block mt-4 text-white/90 tracking-normal">Support Services</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-slate-300 text-lg md:text-xl max-w-2xl leading-relaxed mb-10 font-medium"
            >
              We provide scheduled preventative maintenance and rapid emergency response for fire and gas, electrical, and control systems. Minimise unplanned downtime and maintain total regulatory compliance.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="flex flex-wrap gap-4"
            >
              <Link href="#contact" className="group flex items-stretch bg-orange-500 hover:bg-orange-600 transition-all rounded-md overflow-hidden shadow-xl shadow-orange-500/20 max-w-full sm:w-auto">
                <span className="px-6 md:px-8 py-3 flex items-center text-white font-black text-[11px] md:text-sm uppercase tracking-widest text-left">
                  Request a Maintenance Audit
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
          <Wrench size={600} />
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
              <span className="text-orange-500 font-black text-xs uppercase tracking-[0.4em]">Maintenance & Support</span>
              <div className="w-8 h-px bg-orange-500"></div>
            </motion.div>

            <h2 className="text-[#1A2B4C] text-3xl md:text-5xl font-black uppercase tracking-normal mb-8 leading-tight">
              Protecting Your Investment and <br />
              <span className="text-orange-500">Ensuring System Reliability</span>
            </h2>

            <div className="space-y-6 text-slate-600 text-lg leading-relaxed font-medium">
              <p>
                In a high-risk industrial environment, a system failure is more than just an inconvenience. It is a safety risk and a potential production disaster. Fire and gas detection, control systems, and electrical infrastructure require regular, professional attention to remain reliable and compliant.
              </p>
              <p>
                At Touch Teq Engineering, we don&apos;t just install systems and walk away. We provide the ongoing technical support needed to keep your facility running safely. Our maintenance programs are designed to identify potential issues before they cause a shutdown, ensuring your safety-critical systems are ready to perform when they are needed most.
              </p>
              <p>
                Whether you need a once-off system health check, a long-term preventative maintenance contract, or urgent emergency repairs, our engineering team is available to support your operations across Southern Africa.
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
            <h2 className="text-[#1A2B4C] text-3xl md:text-5xl font-black uppercase tracking-normal">Comprehensive Support for <br /> Critical Industrial Systems</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {services.map((service, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-white p-8 rounded-2xl border border-slate-100 hover:border-orange-500/30 hover:shadow-xl transition-all duration-300 group"
              >
                <div className="w-14 h-14 bg-slate-50 rounded-xl flex items-center justify-center mb-6 group-hover:bg-orange-500 transition-colors duration-300">
                  <service.icon className="text-[#1A2B4C] group-hover:text-white transition-colors" size={28} />
                </div>
                <h3 className="text-xl font-black text-[#1A2B4C] uppercase tracking-normal mb-4 group-hover:text-orange-500 transition-colors">{service.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed font-medium">{service.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Section 3: Why Maintenance Matters */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-4 md:px-8">
          <div className="flex flex-col lg:flex-row gap-16 items-center">
            <div className="lg:w-1/2">
              <span className="text-orange-500 font-black text-xs uppercase tracking-[0.4em] block mb-6">Reliability & Compliance</span>
              <h2 className="text-[#1A2B4C] text-3xl md:text-5xl font-black uppercase tracking-normal mb-8 leading-tight">
                The Cost of Neglect vs. <span className="text-orange-500">The Value of Maintenance</span>
              </h2>
              <p className="text-slate-600 text-lg leading-relaxed mb-10 font-medium">
                A &quot;fit and forget&quot; approach to industrial systems leads to higher long-term costs and increased safety risks. Professional maintenance provides a clear return on investment.
              </p>
              <div className="relative h-80 w-full rounded-3xl overflow-hidden shadow-xl mt-8">
                <Image
                  src="/detector-maintenance.jpeg"
                  alt="Instrument Calibration"
                  fill
                  className="object-cover object-[center_65%]"
                  referrerPolicy="no-referrer"
                />
              </div>
            </div>

            <div className="lg:w-1/2 space-y-6">
              {whyMatters.map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center space-x-4 bg-slate-50 p-6 rounded-2xl border border-slate-100 group hover:border-orange-500 transition-colors"
                >
                  <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm group-hover:bg-orange-500 group-hover:text-white transition-colors">
                    <CheckCircle2 size={20} />
                  </div>
                  <div>
                    <h4 className="text-[#1A2B4C] text-sm font-black uppercase tracking-normal">{item.title}</h4>
                    <p className="text-slate-500 text-xs font-bold uppercase tracking-wide">{item.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Section 4: Standards & Documentation */}
      <section className="py-24 bg-[#1A2B4C] text-white">
        <div className="container mx-auto px-4 md:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <span className="text-orange-500 font-black text-xs uppercase tracking-[0.4em] block mb-6">Technical Standards</span>
              <h2 className="text-3xl md:text-5xl font-black uppercase tracking-normal mb-8 leading-tight">
                Maintenance Performed to <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF6900] to-orange-300">Recognized</span> <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF6900] to-orange-300">Engineering Standards</span>
              </h2>
              <p className="text-slate-300 text-lg leading-relaxed mb-8 font-medium">
                Our maintenance work is documented to provide a clear audit trail. We follow the specific testing and inspection requirements laid out in international and local standards.
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
                  <div className="bg-orange-500/20 text-orange-500 px-3 py-1 rounded font-black text-xs uppercase tracking-widest min-w-[140px] text-center">
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
            <h2 className="text-[#1A2B4C] text-3xl md:text-5xl font-black uppercase tracking-normal">Supporting Industrial Operations <br /> Across the Region</h2>
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
              <span className="text-orange-500 font-black text-xs uppercase tracking-[0.4em] block mb-6">The Touch Teq Advantage</span>
              <h2 className="text-[#1A2B4C] text-3xl md:text-5xl font-black uppercase tracking-normal mb-8 leading-tight">
                Direct Access to <br />
                <span className="text-orange-500">Engineering Expertise</span>
              </h2>
              <div className="relative h-80 w-full rounded-3xl overflow-hidden shadow-xl">
                <Image
                  src="/expertise-site-consultation.jpeg"
                  alt="Engineer at Refinery"
                  fill
                  className="object-cover object-[center_65%]"
                  referrerPolicy="no-referrer"
                />
              </div>
            </div>

            <div className="lg:w-1/2 space-y-8">
              {whyChooseUs.map((point, index) => (
                <div key={index} className="flex gap-6 group">
                  <div className="shrink-0 w-10 h-10 bg-[#1A2B4C] text-white rounded-lg flex items-center justify-center font-black group-hover:bg-orange-500 transition-colors">
                    {index + 1}
                  </div>
                  <div>
                    <h4 className="text-[#1A2B4C] text-lg font-black uppercase tracking-normal mb-2">{point.title}</h4>
                    <p className="text-slate-500 text-sm leading-relaxed font-medium">{point.desc}</p>
                  </div>
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
              <h2 className="text-[#1A2B4C] text-3xl md:text-5xl font-black uppercase tracking-normal">Common Questions About <br /> Maintenance & Support</h2>
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
              Is Your System Ready for <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF6900] to-orange-300">an Emergency?</span>
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-slate-400 text-lg md:text-xl max-w-2xl mb-12 font-medium leading-relaxed"
            >
              Don&apos;t wait for a failure to find out if your system works. Contact Touch Teq today to discuss a preventative maintenance program or request emergency technical support.
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
                  REQUEST A MAINTENANCE AUDIT
                </span>
                <div className="bg-[#ff6900] px-4 md:px-5 flex items-center justify-center group-hover:bg-orange-600 transition-colors shrink-0">
                  <ArrowRight className="text-white w-4 h-4 -rotate-45 group-hover:rotate-0 transition-all duration-300" />
                </div>
              </Link>

              <a href="tel:+27725522110" className="group flex items-stretch bg-orange-500 hover:bg-orange-600 transition-all rounded-md overflow-hidden shadow-xl shadow-orange-500/20 max-w-full sm:w-auto">
                <span className="px-6 md:px-8 py-3 flex items-center text-white font-black text-[11px] md:text-sm uppercase tracking-widest text-left">
                  <PhoneCall size={16} className="mr-3" />
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

      <BackToTop />

      <Footer />
    </main>
  );
}
