'use client';

import { motion, AnimatePresence } from 'motion/react';
import { 
  Cpu, ShieldCheck, CheckCircle2, ArrowRight, Activity, 
  Settings, FileText, ChevronRight, HardHat, Factory, 
  Droplets, ZapOff, Microscope, Plus, Minus, Layout, 
  RefreshCw, Target, Wrench, Play, Search, AlertTriangle,
  ArrowUpRight, Phone
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
    title: "System Design",
    description: "We develop control and instrumentation designs based on your plant process, operating conditions, and project requirements. This includes instrument selection, control philosophy, loop design, and supporting documentation."
  },
  {
    title: "PLC & Control System Upgrades",
    description: "We upgrade outdated or unsupported control systems to improve reliability, reduce downtime, and make maintenance easier for your team."
  },
  {
    title: "Instrumentation Installation",
    description: "We install and connect field instruments, panels, cabling, and related equipment with a focus on accuracy, neat workmanship, and long-term reliability."
  },
  {
    title: "Calibration & Testing",
    description: "We test and calibrate instruments to confirm correct readings and dependable performance in day-to-day plant operation."
  },
  {
    title: "Commissioning & Start-Up Support",
    description: "We carry out loop checks, signal testing, functional testing, and start-up support to make sure the system performs as intended before handover."
  },
  {
    title: "Fault Finding & Maintenance Support",
    description: "We help identify faults, resolve recurring issues, and support maintenance teams with practical troubleshooting and corrective action."
  }
];

const systems = [
  "Pressure, temperature, flow, and level instrumentation",
  "Control panels and field panels",
  "PLC based control systems",
  "Process monitoring systems",
  "Alarm and shutdown interfaces",
  "Motor control and basic automation support",
  "System upgrades and replacement projects"
];

const standards = [
  { code: "IEC 61511", desc: "Where safety functions apply" },
  { code: "IEC 60079", desc: "For hazardous area installations where relevant" },
  { code: "Site Standards", desc: "Site-specific client standards and specifications" },
  { code: "Documentation", desc: "Clear testing, commissioning, and handover documentation" }
];

const industries = [
  { name: "Oil & Gas Refineries", icon: Droplets },
  { name: "Chemical & Petrochemical Plants", icon: Factory },
  { name: "Mining & Minerals Processing", icon: HardHat },
  { name: "Manufacturing Facilities", icon: Settings },
  { name: "Power Generation Facilities", icon: ZapOff },
  { name: "Industrial Processing Plants", icon: Activity }
];

const whyChooseUs = [
  {
    title: "Engineer-Led Delivery",
    desc: "Your project is handled directly by qualified engineering professionals who understand the site, the system, and the importance of getting it right."
  },
  {
    title: "Practical Plant Experience",
    desc: "We work in real industrial environments, not just on paper. That means we design and install solutions that make sense in the field."
  },
  {
    title: "Reliable Documentation",
    desc: "We provide the drawings, test records, and handover information your team needs to operate and maintain the system properly."
  },
  {
    title: "Long-Term Support",
    desc: "We do not disappear after commissioning. We support maintenance teams with upgrades, troubleshooting, and ongoing system improvements."
  }
];

const faqs = [
  {
    q: "What do control and instrumentation systems do?",
    a: "Control and instrumentation systems help monitor and manage industrial processes. They measure key variables such as pressure, temperature, flow, and level, then help operators and control systems respond correctly."
  },
  {
    q: "Can you upgrade older control systems?",
    a: "Yes. We help clients upgrade aging or unsupported systems to improve reliability, reduce downtime, and make spare parts and maintenance easier to manage."
  },
  {
    q: "Do you only work on large projects?",
    a: "No. We work on both large and smaller projects. This includes full system installations, plant upgrades, troubleshooting, instrument replacement, and commissioning support."
  },
  {
    q: "Do you provide commissioning support?",
    a: "Yes. We handle loop checks, testing, calibration, functional checks, and start-up support to make sure the system is operating correctly before handover."
  },
  {
    q: "Which industries do you serve?",
    a: "We work with refineries, chemical plants, mining operations, manufacturing facilities, and other industrial sites across Southern Africa."
  },
  {
    q: "Can you work with our existing plant systems?",
    a: "Yes. We assess your current setup and provide solutions that fit the plant as it exists, whether that means integration, upgrades, replacements, or targeted improvements."
  }
];

export default function ControlAndInstrumentationPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <main className="bg-white min-h-screen font-sans">
      <BreadcrumbJsonLd 
        items={[
          { name: 'Home', url: 'https://touchteq.co.za' },
          { name: 'Services', url: 'https://touchteq.co.za/#services' },
          { name: 'Control & Instrumentation', url: 'https://touchteq.co.za/services/control-and-instrumentation' }
        ]}
      />
      <FAQJsonLd 
        faqs={faqs.map(faq => ({ question: faq.q, answer: faq.a }))}
      />
      <ServiceJsonLd 
        name="Control & Instrumentation Engineering"
        description="Design, installation, and maintenance of industrial control and instrumentation systems. PLC upgrades, calibration, and loop testing across Southern Africa."
        url="https://touchteq.co.za/services/control-and-instrumentation"
        serviceType={[
          'Control Engineering', 
          'Process Instrumentation', 
          'PLC Upgrades', 
          'Loop Testing',
          'Industrial Automation'
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
            src="/plant-field-panel-system-integration.jpeg"
            alt="Control & Instrumentation Services"
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
            <span className="text-white">Control & Instrumentation</span>
          </nav>

          <div className="max-w-4xl">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-4xl md:text-7xl font-black text-white uppercase tracking-tight mb-8 leading-none"
            >
              Control & <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF6900] to-orange-300">Instrumentation</span> <br />
              <span className="text-2xl md:text-4xl block mt-4 text-white/90 tracking-normal">Services for Industrial Facilities</span>
            </motion.h1>
            
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-slate-300 text-lg md:text-xl max-w-2xl leading-relaxed mb-10 font-medium"
            >
              We design, install, upgrade, and maintain control and instrumentation systems for industrial facilities across Southern Africa. Our work helps clients improve reliability, process visibility, and operational safety.
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
          <Cpu size={600} />
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
              <span className="text-orange-500 font-black text-xs uppercase tracking-[0.4em]">Control & Instrumentation</span>
              <div className="w-8 h-px bg-orange-500"></div>
            </motion.div>
            
            <h2 className="text-[#1A2B4C] text-3xl md:text-5xl font-black uppercase tracking-normal mb-8 leading-tight">
              Reliable Control Systems for <br />
              <span className="text-orange-500">Safe and Efficient Operations</span>
            </h2>
            
            <div className="space-y-6 text-slate-600 text-lg leading-relaxed font-medium">
              <p>
                Good control and instrumentation systems are essential for stable plant performance. They help operators monitor critical processes, respond quickly to issues, and keep production running safely and efficiently.
              </p>
              <p>
                At Touch Teq Engineering, we provide practical control and instrumentation solutions for high-risk industrial environments. We work on new installations, system upgrades, fault finding, and plant improvements. Our focus is simple. Build systems that are reliable, easy to maintain, and suited to the real conditions on site.
              </p>
              <p>
                We work directly with engineering teams, operations teams, and maintenance teams to make sure the final solution is clear, workable, and properly documented.
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
            <h2 className="text-[#1A2B4C] text-3xl md:text-5xl font-black uppercase tracking-normal">Practical Control & Instrumentation Support Across the Full Project Lifecycle</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
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
                <h3 className="text-xl font-black text-[#1A2B4C] uppercase tracking-normal mb-4 group-hover:text-orange-500 transition-colors">{service.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed font-medium">{service.description}</p>
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
                  src="/plant-field-panel-system-integration.jpeg" 
                  alt="Industrial Monitoring and Control" 
                  fill 
                  className="object-cover"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#1A2B4C]/80 to-transparent"></div>
                <div className="absolute bottom-10 left-10 right-10">
                  <div className="bg-orange-500 inline-block px-4 py-2 rounded-full text-white text-[10px] font-black uppercase tracking-widest mb-4">
                    Plant Monitoring
                  </div>
                  <h4 className="text-white text-2xl font-black uppercase tracking-normal">
                    Support for Critical Plant Monitoring and Control
                  </h4>
                </div>
              </div>
            </div>
            
            <div className="lg:w-1/2">
              <span className="text-orange-500 font-black text-xs uppercase tracking-[0.4em] block mb-6">Systems & Applications</span>
              <h2 className="text-[#1A2B4C] text-3xl md:text-5xl font-black uppercase tracking-normal mb-8 leading-tight">
                Accurate Monitoring <br />
                for Process Stability
              </h2>
              
              <p className="text-slate-600 text-lg leading-relaxed mb-10 font-medium">
                Our control and instrumentation work covers a wide range of industrial applications. We help clients monitor key process conditions, improve control accuracy, and keep important systems operating as they should.
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
                  <Activity className="text-orange-500 mr-3" size={24} />
                  Process Visibility
                </h4>
                <p className="text-slate-300 text-sm leading-relaxed">
                  We focus on delivering high-fidelity process data to your operators. By ensuring instruments are correctly selected, installed, and calibrated, we provide the visibility needed for safe and efficient plant operation.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 4: Standards & Good Practice */}
      <section className="py-24 bg-[#1A2B4C] text-white">
        <div className="container mx-auto px-4 md:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <span className="text-orange-500 font-black text-xs uppercase tracking-[0.4em] block mb-6">Quality & Compliance</span>
              <h2 className="text-3xl md:text-5xl font-black uppercase tracking-normal mb-8 leading-tight">
                Built for Accuracy, Reliability, and <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF6900] to-orange-300">Safe Operation</span>
              </h2>
              <p className="text-slate-300 text-lg leading-relaxed mb-8 font-medium">
                Every facility is different, but the goal stays the same. Deliver a system that is accurate, dependable, and suitable for the environment it operates in. Our work follows sound engineering practice, clear documentation standards, and the specific requirements of each plant.
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
            <h2 className="text-[#1A2B4C] text-3xl md:text-5xl font-black uppercase tracking-normal">
              Control & Instrumentation Support <br />
              for Demanding Industrial Environments
            </h2>
            <p className="text-slate-500 text-lg mt-6 max-w-3xl mx-auto font-medium">
              We work with industrial clients who need dependable process monitoring and control in environments where poor system performance can lead to downtime, safety risks, or production losses.
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
                Clear Solutions. <br />
                Direct Support. <br />
                <span className="text-orange-500">Practical Engineering.</span>
              </h2>
              <div className="relative h-80 w-full rounded-3xl overflow-hidden shadow-xl">
                <Image 
                  src="/qualified-accountable-signoff.jpg" 
                  alt="Instrumentation Testing" 
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
              <h2 className="text-[#1A2B4C] text-3xl md:text-5xl font-black uppercase tracking-normal">Common Questions About <br /> Control & Instrumentation Services</h2>
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
              Need Help With a <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF6900] to-orange-300">Control or</span> <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF6900] to-orange-300">Instrumentation</span> <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF6900] to-orange-300">Project?</span>
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-slate-400 text-lg md:text-xl max-w-2xl mb-12 font-medium leading-relaxed"
            >
              Speak to Touch Teq about a new installation, system upgrade, commissioning scope, or plant support requirement. We will review your needs and provide a practical solution for your site.
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
