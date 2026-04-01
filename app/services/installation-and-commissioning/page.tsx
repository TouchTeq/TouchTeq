'use client';

import { motion } from 'motion/react';
import { 
  ChevronRight, ArrowRight, CheckCircle2, Globe, ShieldCheck, 
  Clock, Award, Phone, Zap, Cpu, Flame, Terminal,
  Wrench, FileCheck, Settings, Cable, Activity, AlertTriangle,
  Server, Plug, Gauge, ClipboardCheck, Users, BookOpen, ArrowUpRight
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
    title: "Field Device and Instrument Installation",
    description: "We install the full range of field instrumentation and detection equipment, including gas detectors, flame detectors, process transmitters, control valves, and temperature elements. Every device is installed per manufacturer instructions and applicable standards.",
    icon: Settings
  },
  {
    title: "Cable Reticulation, Glanding, and Termination",
    description: "We manage the complete cable installation scope, from cable tray and conduit through to glanding and termination. For hazardous areas, this includes certified cable glands, barrier glands, and earthing continuity verification.",
    icon: Cable
  },
  {
    title: "Control Panel and Junction Box Wiring",
    description: "We build, wire, and install control panels, marshalling cabinets, and junction boxes. Internal wiring follows high workmanship standards with clear labelling and ferrule identification.",
    icon: Terminal
  },
  {
    title: "Loop Testing and Signal Verification",
    description: "We perform comprehensive point-to-point wiring checks and loop testing. Every instrument loop is tested from field device through to control system to verify signal integrity and proper channel assignment.",
    icon: Activity
  },
  {
    title: "Functional Safety Testing",
    description: "For fire and gas and safety instrumented systems, we carry out full functional testing against the approved cause and effect matrix. Every test is documented and traceable.",
    icon: ShieldCheck
  },
  {
    title: "System Integration and Hot Commissioning",
    description: "We manage integration with plant control infrastructure including DCS, PLC, SCADA, and ESD. This covers communication protocol configuration, alarm verification, and graphic display confirmation.",
    icon: Server
  },
  {
    title: "Hazardous Area Installation and Inspection",
    description: "We specialise in Ex d, Ex e, Ex i, Ex n, and Ex p equipment installation. Every installation is inspected per IEC 60079-14 and IEC 60079-17 to confirm protection integrity.",
    icon: AlertTriangle
  },
  {
    title: "Electrical Installation and Power System Commissioning",
    description: "We install and commission industrial electrical systems including MCCs, distribution boards, transformers, and cable systems. Commissioning includes insulation resistance testing and protection relay testing.",
    icon: Zap
  },
  {
    title: "Pre-Commissioning Support",
    description: "Before commissioning begins, we verify mechanical completion including confirming all devices are mounted, cables terminated, labels in place, and punch list items resolved.",
    icon: ClipboardCheck
  },
  {
    title: "Handover, Documentation, and Operator Familiarisation",
    description: "We provide complete handover packages including as-built drawings, loop test records, calibration certificates, functional test reports, and operator familiarisation sessions.",
    icon: FileCheck
  }
];

const methodologyPhases = [
  { title: "Pre-Installation Verification", desc: "Verify equipment received matches specifications, certification markings, and is in proper condition before installation." },
  { title: "Installation and Construction", desc: "Physical installation carried out per approved drawings with workmanship standards defined and monitored throughout." },
  { title: "Mechanical Completion", desc: "Thorough inspection confirming all items installed, terminated, labelled, and punch list items cleared." },
  { title: "Loop Testing and Cold Commissioning", desc: "End-to-end loop testing from field device through to control system with signal verification." },
  { title: "Functional Testing", desc: "Full functional testing against cause and effect matrix for safety systems, including gas challenges and alarm verification." },
  { title: "Hot Commissioning and Integration", desc: "System brought online under live process conditions with integration verification to DCS/SCADA." },
  { title: "Punch List Resolution", desc: "Formal punch list management with Category A items resolved before acceptance." },
  { title: "Handover and Close-Out", desc: "Complete commissioning data book assembled and formally handed over with operator familiarisation." }
];

const standards = [
  "IEC 60079-14", "IEC 60079-17", "IEC 61511", "IEC 61508",
  "SANS 10142", "SANS 10108", "SANS 10089",
  "Electrical Installation Regulations", "OHS Act", "ATEX", "IECEx"
];

const industries = [
  "Oil Refineries and Petrochemical Facilities",
  "Chemical Processing and Manufacturing Plants",
  "Mining and Minerals Processing",
  "Fuel Storage and Distribution Depots",
  "Power Generation and Utilities",
  "Manufacturing and Heavy Industry",
  "Food and Beverage Processing",
  "Pharmaceutical Manufacturing",
  "Water and Wastewater Treatment"
];

const advantages = [
  { title: "Our Own Teams, Not Subcontracted Labour", desc: "We maintain direct control over all safety-critical activities using our own engineers and technicians, not labour brokers." },
  { title: "Engineers Who Understand the Design Intent", desc: "Our installation teams have access to the engineers who created the design, eliminating guesswork." },
  { title: "Hazardous Area Installation Specialists", desc: "Our teams know Ex d, Ex e, Ex i, Ex n, and Ex p protection concepts and their specific installation requirements." },
  { title: "Systematic Commissioning", desc: "We do not skip steps. Every loop tested, every safety function verified, every test result documented." },
  { title: "Complete Handover Packages", desc: "When we hand over, the documentation is finished. As-built drawings, test records, certificates all included." },
  { title: "Shutdown and Turnaround Experience", desc: "We understand time pressure and plan resources to align with shutdown schedules." },
  { title: "Regional Mobilisation Capability", desc: "We mobilise across Southern Africa, managing logistics and cross-border compliance as standard." }
];

const faqs = [
  { q: "Do you use subcontractors for installation and commissioning work?", a: "We maintain direct control over all safety-critical installation and commissioning activities using our own engineers and technicians. For specific support functions on larger projects, we may engage trusted partners, but engineering supervision always remains with Touch Teq." },
  { q: "Can you install and commission systems designed by another engineering firm?", a: "Yes. We regularly execute installation and commissioning based on design packages from other consultancies or EPC contractors. We review documentation before mobilisation and raise technical queries where needed." },
  { q: "Can you work during a planned plant shutdown or turnaround?", a: "Yes. We frequently deliver scope within shutdown windows at refineries, chemical plants, and power stations. We plan resources and logistics to complete our scope within the allocated window." },
  { q: "What documentation do we receive at handover?", a: "You receive a complete commissioning data book including as-built drawings, loop test records, calibration certificates, functional test reports, equipment manuals, spare parts lists, hazardous area inspection records, and a signed completion certificate." },
  { q: "Do you provide operator training as part of the handover?", a: "Yes. We provide practical operator familiarisation sessions covering system operation, alarm response, reset procedures, and basic troubleshooting. Your team will be confident with the system from day one." },
  { q: "How do you handle integration with our existing DCS, PLC, or SCADA?", a: "We manage communication setup, signal mapping, and point verification between the new installation and your existing control infrastructure. We coordinate with your control system integrator or in-house team." },
  { q: "Do you handle electrical installations, or only instrumentation?", a: "We handle both. Our installation capability covers full industrial electrical work including power cables, MCCs, transformers, earthing, and lighting, plus the full range of instrumentation and detection equipment." },
  { q: "What happens if you find problems with the design during installation?", a: "We raise a formal technical query with the design engineer or client team. The TQ is documented, reviewed, and resolved through an agreed process before work proceeds. We do not make undocumented changes." },
  { q: "How do you manage quality control during installation?", a: "Quality is managed through defined workmanship standards, stage inspections, documented test records, and engineering supervision. Key hold points are identified in the quality plan, and hazardous area inspections follow IEC 60079-14 and IEC 60079-17." },
  { q: "How long does a typical installation and commissioning project take?", a: "Duration depends on scope. A small upgrade might take days; a new fire and gas system at a refinery could take weeks or months. We provide a detailed programme during proposal phase." }
];

export default function InstallationCommissioningPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <main className="bg-white min-h-screen font-sans">
      <BreadcrumbJsonLd 
        items={[
          { name: 'Home', url: 'https://touchteq.co.za' },
          { name: 'Services', url: 'https://touchteq.co.za/#services' },
          { name: 'Installation & Commissioning', url: 'https://touchteq.co.za/services/installation-and-commissioning' }
        ]}
      />
      <FAQJsonLd 
        faqs={faqs.map(faq => ({ question: faq.q, answer: faq.a }))}
      />
      <ServiceJsonLd 
        name="Industrial Installation & Commissioning"
        description="Expert installation and commissioning of industrial safety and control systems. Specialists in Fire & Gas, C&I, and Hazardous Area (Ex) equipment."
        url="https://touchteq.co.za/services/installation-and-commissioning"
        serviceType={[
          'Field Device Installation', 
          'Cable Reticulation', 
          'Loop Testing', 
          'Functional Safety Testing',
          'System Integration',
          'Hazardous Area Inspection'
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
        <div className="absolute inset-0 z-0 text-white">
          <Image
            src="/Commissioning_testing.png"
            alt="Installation & Commissioning Services"
            fill
            className="object-cover opacity-30"
            priority
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#1A2B4C] via-[#1A2B4C]/80 to-transparent"></div>
          <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#1A2B4C] to-transparent"></div>
        </div>

        <div className="container mx-auto px-4 md:px-8 relative z-10">
          <nav className="flex items-center space-x-2 text-slate-400 text-[10px] font-black uppercase tracking-widest mb-8">
            <Link href="/" className="hover:text-orange-500 transition-colors">Home</Link>
            <ChevronRight size={12} />
            <Link href="/#services" className="hover:text-orange-500 transition-colors">Our Services</Link>
            <ChevronRight size={12} />
            <span className="text-white">Installation & Commissioning</span>
          </nav>

          <div className="max-w-4xl">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-4xl md:text-7xl font-black text-white uppercase tracking-tight mb-8 leading-none"
            >
              Installation and <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF6900] to-orange-300">Commissioning</span> <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF6900] to-orange-300">Services</span> <br />
              <span className="text-2xl md:text-4xl block mt-4 text-white/90 tracking-normal">for Industrial Safety and Control Systems</span>
            </motion.h1>
            
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-slate-300 text-lg md:text-xl max-w-2xl leading-relaxed mb-10 font-medium"
            >
              Touch Teq Engineering takes your project from approved design to fully operational system. Our engineers and technicians handle physical installation, loop testing, functional safety verification, and formal handover of fire and gas, C&I, and electrical systems.
            </motion.p>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="flex flex-wrap gap-4"
            >
              <Link href="/contact" className="group flex items-stretch bg-orange-500 hover:bg-orange-600 transition-all rounded-md overflow-hidden shadow-xl shadow-orange-500/20 max-w-full sm:w-auto">
                <span className="px-6 md:px-8 py-3 flex items-center text-white font-black text-[11px] md:text-sm uppercase tracking-widest text-left">
                  Request a Site Visit
                </span>
                <div className="bg-[#1A2B4C] px-5 flex items-center justify-center group-hover:bg-black transition-colors shrink-0">
                  <ArrowRight className="text-white w-4 h-4 -rotate-45 group-hover:rotate-0 group-hover:text-orange-500 transition-all duration-300" />
                </div>
              </Link>
              <Link href="/#services" className="group flex items-stretch bg-white hover:bg-slate-100 transition-all rounded-md overflow-hidden shadow-xl max-w-full sm:w-auto">
                <span className="px-6 md:px-8 py-3 flex items-center text-[#0A1120] group-hover:text-orange-500 font-black text-[11px] md:text-sm uppercase tracking-widest text-left transition-colors">
                  Explore Our Services
                </span>
                <div className="bg-[#ff6900] px-5 flex items-center justify-center group-hover:bg-orange-600 transition-colors shrink-0">
                  <ArrowRight className="text-white w-4 h-4 -rotate-45 group-hover:rotate-0 transition-all duration-300" />
                </div>
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Section 1: What We Do */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-4 md:px-8">
          <div className="max-w-4xl mx-auto text-center mb-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="flex items-center justify-center space-x-3 mb-6"
            >
              <div className="w-8 h-px bg-orange-500"></div>
              <span className="text-orange-500 font-black text-xs uppercase tracking-[0.4em]">Installation & Commissioning</span>
              <div className="w-8 h-px bg-orange-500"></div>
            </motion.div>
            
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-[#1A2B4C] text-3xl md:text-5xl font-black uppercase tracking-normal mb-8 leading-tight"
            >
              Turning Engineering Designs Into Operational, Tested, and Documented Systems
            </motion.h2>
            
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="text-slate-600 text-lg leading-relaxed font-medium"
            >
              A fire and gas detection system that sits on a drawing is not protecting anyone. The value of every engineering design is realised only when it is physically installed, correctly wired, rigorously tested, and formally handed over.
            </motion.p>
          </div>
        </div>
      </section>

      {/* Section 2: Our Installation Services */}
      <section className="py-24 bg-slate-50">
        <div className="container mx-auto px-4 md:px-8">
          <div className="text-center mb-16">
            <motion.span
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-orange-500 font-black text-xs uppercase tracking-[0.4em] block mb-4"
            >
              What We Offer
            </motion.span>
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-[#1A2B4C] text-3xl md:text-5xl font-black uppercase tracking-normal"
            >
              Comprehensive On-Site Execution
            </motion.h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((service, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
                className="p-8 bg-white rounded-2xl border border-slate-100 hover:border-orange-500/30 hover:shadow-xl transition-all"
              >
                <div className="w-12 h-12 bg-slate-50 text-[#1A2B4C] rounded-xl flex items-center justify-center mb-6 group-hover:bg-orange-500 group-hover:text-white transition-colors">
                  <service.icon size={24} />
                </div>
                <h4 className="text-[#1A2B4C] font-black text-sm uppercase tracking-normal mb-3">{service.title}</h4>
                <p className="text-slate-500 text-sm leading-relaxed">{service.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Section 3: Methodology */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-4 md:px-8">
          <div className="max-w-4xl mx-auto text-center mb-16">
            <motion.span
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-orange-500 font-black text-xs uppercase tracking-[0.4em] block mb-4"
            >
              How We Work
            </motion.span>
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-[#1A2B4C] text-3xl md:text-5xl font-black uppercase tracking-normal mb-8"
            >
              A Structured Process That Leaves Nothing to Chance
            </motion.h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {methodologyPhases.map((phase, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
                className="flex gap-4 p-6 bg-slate-50 rounded-xl"
              >
                <div className="shrink-0 w-8 h-8 bg-orange-500 text-white rounded-full flex items-center justify-center font-black text-sm">
                  {index + 1}
                </div>
                <div>
                  <h4 className="text-[#1A2B4C] font-black text-sm uppercase tracking-normal mb-2">{phase.title}</h4>
                  <p className="text-slate-500 text-sm leading-relaxed">{phase.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Section 4: Risk Awareness */}
      <section className="py-24 bg-[#1A2B4C] text-white">
        <div className="container mx-auto px-4 md:px-8">
          <div className="max-w-4xl mx-auto text-center mb-16">
            <motion.span
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-orange-500 font-black text-xs uppercase tracking-[0.4em] block mb-4"
            >
              Risk Awareness
            </motion.span>
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-3xl md:text-5xl font-black uppercase tracking-normal mb-8"
            >
              The Consequences of Cutting Corners
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="text-slate-300 text-lg leading-relaxed font-medium"
            >
              We have seen the results of poor installation and commissioning work. The consequences are predictable, expensive, and sometimes dangerous.
            </motion.p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              { title: "Nuisance Alarms and False Trips", desc: "Detectors in wrong locations generate false alarms. Over time, operators distrust the system." },
              { title: "Compromised Hazardous Area Protection", desc: "Incorrect gland installation or enclosure defects defeat explosion protection." },
              { title: "Uncommissioned Systems", desc: "Systems energised without full testing carry unknown risks and wiring errors." },
              { title: "Missing Documentation", desc: "Incomplete records create long-term burdens for maintenance teams." },
              { title: "Cost of Remediation", desc: "Fixing defects after handover is significantly more expensive than getting it right first time." }
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="p-6 bg-white/5 border border-white/10 rounded-xl"
              >
                <AlertTriangle className="text-orange-500 mb-4" size={24} />
                <h4 className="text-white font-black text-sm uppercase tracking-normal mb-2">{item.title}</h4>
                <p className="text-slate-400 text-sm leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Section 5: Safety on Site */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-4 md:px-8">
          <div className="max-w-4xl mx-auto text-center mb-16">
            <motion.span
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-orange-500 font-black text-xs uppercase tracking-[0.4em] block mb-4"
            >
              Site Safety
            </motion.span>
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-[#1A2B4C] text-3xl md:text-5xl font-black uppercase tracking-normal mb-8"
            >
              Working Safely in Live Industrial Environments
            </motion.h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { title: "Pre-Mobilisation Planning", desc: "Task-specific risk assessments and method statements prepared before arrival." },
              { title: "Daily Task Planning", desc: "Toolbox talks cover specific tasks, hazards, and control measures." },
              { title: "Permit-to-Work", desc: "We work strictly within client permit-to-work systems." },
              { title: "Stop Work Authority", desc: "Every team member can stop work if unsafe conditions are observed." }
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="p-6 bg-slate-50 rounded-xl border border-slate-100"
              >
                <ShieldCheck className="text-orange-500 mb-4" size={24} />
                <h4 className="text-[#1A2B4C] font-black text-sm uppercase tracking-normal mb-2">{item.title}</h4>
                <p className="text-slate-500 text-sm">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Section 6: Standards */}
      <section className="py-24 bg-slate-50">
        <div className="container mx-auto px-4 md:px-8">
          <div className="max-w-4xl mx-auto text-center mb-12">
            <motion.span
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-orange-500 font-black text-xs uppercase tracking-[0.4em] block mb-4"
            >
              Technical Standards
            </motion.span>
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-[#1A2B4C] text-3xl md:text-5xl font-black uppercase tracking-normal mb-8"
            >
              Installation and Commissioning <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF6900] to-orange-300">to Recognised</span> <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF6900] to-orange-300">Standards</span>
            </motion.h2>
          </div>

          <div className="flex flex-wrap justify-center gap-3">
            {standards.map((std, index) => (
              <motion.span
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.03 }}
                className="px-4 py-2 bg-white text-[#1A2B4C] font-black text-xs uppercase tracking-wider rounded-full border border-slate-100"
              >
                {std}
              </motion.span>
            ))}
          </div>
        </div>
      </section>

      {/* Section 7: Industries */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-4 md:px-8">
          <div className="max-w-4xl mx-auto text-center mb-12">
            <motion.span
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-orange-500 font-black text-xs uppercase tracking-[0.4em] block mb-4"
            >
              Industries
            </motion.span>
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-[#1A2B4C] text-3xl md:text-5xl font-black uppercase tracking-normal mb-8"
            >
              Experience Across High-Risk Industrial Sectors
            </motion.h2>
          </div>

          <div className="flex flex-wrap justify-center gap-4">
            {industries.map((industry, index) => (
              <motion.span
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
                className="px-6 py-3 bg-slate-50 text-[#1A2B4C] font-black text-xs uppercase tracking-wider rounded-full border border-slate-100 hover:border-orange-500 hover:text-orange-500 transition-colors"
              >
                {industry}
              </motion.span>
            ))}
          </div>
        </div>
      </section>

      {/* Section 8: Why Choose Us */}
      <section className="py-24 bg-slate-50">
        <div className="container mx-auto px-4 md:px-8">
          <div className="text-center mb-16">
            <motion.span
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-orange-500 font-black text-xs uppercase tracking-[0.4em] block mb-4"
            >
              The Touch Teq Advantage
            </motion.span>
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-[#1A2B4C] text-3xl md:text-5xl font-black uppercase tracking-normal"
            >
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF6900] to-orange-300">Engineer-Led Execution</span> <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF6900] to-orange-300">With Direct Accountability</span>
            </motion.h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {advantages.map((advantage, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="p-8 bg-white rounded-2xl border border-slate-100 hover:border-orange-500/30 hover:shadow-xl transition-all"
              >
                <div className="w-12 h-12 bg-orange-100 text-orange-500 rounded-xl flex items-center justify-center mb-6">
                  <CheckCircle2 size={24} />
                </div>
                <h4 className="text-[#1A2B4C] font-black text-sm uppercase tracking-normal mb-3">{advantage.title}</h4>
                <p className="text-slate-500 text-sm leading-relaxed">{advantage.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Section 9: FAQ */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-4 md:px-8">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-16">
              <motion.span
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="text-orange-500 font-black text-xs uppercase tracking-[0.4em] block mb-4"
              >
                Frequently Asked Questions
              </motion.span>
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                className="text-[#1A2B4C] text-3xl md:text-5xl font-black uppercase tracking-normal"
              >
                Practical Questions About Installation & Commissioning
              </motion.h2>
            </div>

            <div className="space-y-4">
              {faqs.map((faq, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.05 }}
                  className="border border-slate-100 rounded-2xl overflow-hidden"
                >
                  <button 
                    onClick={() => setOpenFaq(openFaq === index ? null : index)}
                    className="w-full flex items-center justify-between p-6 text-left hover:bg-slate-50 transition-colors"
                  >
                    <span className={`font-black text-sm md:text-base uppercase tracking-normal pr-4 transition-colors ${openFaq === index ? 'text-orange-500' : 'text-[#1A2B4C] hover:text-orange-500'}`}>{faq.q}</span>
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${openFaq === index ? 'bg-[#1A2B4C] text-white rotate-180' : 'bg-slate-100 text-[#1A2B4C]'}`}>
                      <ChevronRight size={18} />
                    </div>
                  </button>
                  {openFaq === index && (
                    <div className="px-6 pb-6 text-slate-500 text-sm md:text-base leading-relaxed font-medium border-t border-slate-50 pt-4">
                      {faq.a}
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>


      {/* Section 10: CTA */}
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
              Ready for Professional <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF6900] to-orange-300">Installation &</span> <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF6900] to-orange-300">Commissioning?</span>
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-slate-400 text-lg md:text-xl max-w-2xl mb-12 font-medium leading-relaxed"
            >
              Contact our engineering team to discuss your project requirements or to request a site visit. We provide comprehensive installation and commissioning services across Southern Africa.
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
                  REQUEST A SITE VISIT
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
