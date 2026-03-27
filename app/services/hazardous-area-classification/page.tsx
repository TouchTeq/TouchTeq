'use client';

import { motion, AnimatePresence } from 'motion/react';
import { 
  AlertTriangle, ShieldAlert, CheckCircle2, ArrowRight, 
  FileText, Layout, ClipboardCheck, Database, Compass, 
  Search, ShieldCheck, HardHat, Factory, Droplets, 
  ZapOff, Microscope, Plus, Minus, Info, AlertOctagon,
  Flame, Wind, Scale, Briefcase, ChevronRight, ArrowUpRight,
  Phone
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import BackToTop from '@/components/BackToTop';

const services = [
  {
    title: "Hazardous Area Classification Studies",
    description: "We carry out detailed HAC studies to identify and document every hazardous area within your facility. This covers the identification of flammable and combustible materials, all potential release sources, the grade of release, ventilation effectiveness, and the resulting zone classification."
  },
  {
    title: "HAC Drawings & Technical Documentation",
    description: "We produce professional classification drawings, including plan views, elevations, and cross-sections, that clearly define the extent and boundaries of Zone 0, 1, 2 and Zone 20, 21, 22. All drawings are supported by a detailed technical report."
  },
  {
    title: "Equipment Gap Analysis",
    description: "We assess your existing electrical, instrumentation, and mechanical equipment against the classified zones to identify installations that do not meet the required protection level. Every non-compliant item is flagged with a recommended corrective action."
  },
  {
    title: "Hazardous Area Equipment Register (HAER)",
    description: "We develop and maintain a Hazardous Area Equipment Register that catalogues every piece of Ex-rated equipment installed within classified zones. This register is a critical tool for ongoing compliance management and audit readiness."
  },
  {
    title: "New Project & Greenfield Design Support",
    description: "We work alongside project engineering teams during the FEED and detail design phases to classify new plant areas before equipment is specified or purchased, preventing costly rework and delays."
  },
  {
    title: "Third-Party Compliance Audits & Reviews",
    description: "We conduct independent audits of existing hazardous area classifications to verify they remain accurate and current, especially after plant modifications or process changes."
  }
];

const whyMatters = [
  {
    title: "Personnel Safety",
    desc: "Correct classification prevents the conditions that lead to explosions, flash fires, and toxic releases by ensuring ignition sources are eliminated or controlled."
  },
  {
    title: "Equipment Selection & Specification",
    desc: "The classification dictates the type and level of explosion protection required for every piece of electrical and instrumentation equipment installed in a hazardous zone."
  },
  {
    title: "Maintenance & Work Procedures",
    desc: "Classification defines where hot work permits are required, what tools can be used, and what precautions must be taken before any work is carried out."
  },
  {
    title: "Legal & Regulatory Compliance",
    desc: "South African legislation, including the OHS Act and SANS 10108, requires facilities to classify hazardous areas and maintain that classification as a living document."
  },
  {
    title: "Insurance & Financial Risk",
    desc: "Insurers increasingly require evidence of a current, professionally conducted HAC study. A valid classification can directly impact your premiums and ability to obtain cover."
  },
  {
    title: "Incident Investigation & Accountability",
    desc: "In the event of an incident, investigators will ask for your HAC. If it is outdated or missing, it becomes a significant point of liability."
  }
];

const processSteps = [
  {
    title: "Information Gathering & Desktop Review",
    desc: "We collect all relevant process data, including P&IDs, process flow diagrams, material safety data sheets (MSDS), and equipment layouts."
  },
  {
    title: "Site Walkdown & Source Identification",
    desc: "Our engineers conduct a thorough physical walkdown to identify every potential release source, including flanges, valves, pumps, and vents."
  },
  {
    title: "Zone Determination & Extent Calculation",
    desc: "We determine the zone type and calculate the physical extent of each hazardous area based on substance properties, release rates, and ventilation effectiveness."
  },
  {
    title: "Drawing Production & Report Compilation",
    desc: "We produce a full set of HAC drawings showing zone boundaries overlaid on your plant layout, supported by a detailed technical report."
  },
  {
    title: "Review, Handover & Implementation Support",
    desc: "We present findings to your teams, address queries, and support implementation by identifying equipment that does not meet zone requirements."
  }
];

const standards = [
  { code: "SANS 10108", desc: "Classification of hazardous locations and selection of apparatus (Primary SA Standard)" },
  { code: "IEC 60079-10-1", desc: "Classification of areas: Explosive gas atmospheres" },
  { code: "IEC 60079-10-2", desc: "Classification of areas: Combustible dust atmospheres" },
  { code: "IEC 60079-14", desc: "Design, selection, and erection of electrical installations in explosive atmospheres" },
  { code: "ATEX Directives", desc: "European directives for equipment and worker safety in explosive atmospheres" },
  { code: "IECEx System", desc: "International certification framework for explosive atmospheres" },
  { code: "OHS Act", desc: "Act 85 of 1993 - Overarching safety legislation in South Africa" },
  { code: "Electrical Installation Regs", desc: "Regulations governing equipment in hazardous locations" }
];

const industries = [
  { name: "Oil Refineries & Petrochemical", icon: Droplets },
  { name: "Chemical Processing", icon: Factory },
  { name: "Mining & Minerals", icon: HardHat },
  { name: "Fuel Storage & Distribution", icon: Flame },
  { name: "Grain & Food Processing", icon: Microscope },
  { name: "Pharmaceutical Manufacturing", icon: Microscope },
  { name: "Paint & Solvent Manufacturing", icon: Droplets },
  { name: "Power Generation", icon: ZapOff },
  { name: "Waste Water Treatment", icon: Droplets }
];

const whyChooseUs = [
  {
    title: "Engineers Who Understand the Science",
    desc: "We understand gas group properties, vapour density behaviour, and ventilation modelling. We do not apply generic templates; every classification is site-specific."
  },
  {
    title: "Integrated Engineering Capability",
    desc: "As E&I engineers, we understand the downstream impact of classification on equipment selection, cable routing, and installation costs."
  },
  {
    title: "Clear and Actionable Reports",
    desc: "Our reports are written for plant managers and maintenance teams. Zone definitions are clear, drawings are legible, and recommendations are prioritized."
  },
  {
    title: "Deep Regional Experience",
    desc: "We have delivered HAC studies across Southern Africa, applying international best practices within the local regulatory framework."
  },
  {
    title: "Single Point of Responsibility",
    desc: "From site assessment to final report, you deal with one team. We own the deliverable from start to finish."
  }
];

const faqs = [
  {
    q: "What exactly is Hazardous Area Classification?",
    a: "Hazardous Area Classification is a structured engineering study that identifies locations within a facility where explosive gas or dust atmospheres could form. The outcome is a set of defined zones that determine what type of equipment, wiring methods, and work procedures are permitted in each area."
  },
  {
    q: "Why is HAC a legal requirement in South Africa?",
    a: "Under the OHS Act and Electrical Installation Regulations, employers must ensure electrical equipment in explosive atmospheres is suitable. SANS 10108 provides the framework for this. Failing to classify your facility puts you in breach of these requirements."
  },
  {
    q: "How often should we review or update our classification?",
    a: "Whenever there is a material change to the process, substances, layout, or ventilation. Even without changes, we recommend a formal review every three to five years to ensure alignment with current standards."
  },
  {
    q: "What is the difference between Zone 0, Zone 1, and Zone 2?",
    a: "These zones describe likelihood: Zone 0 is continuous/long periods; Zone 1 is likely during normal operation; Zone 2 is not likely during normal operation, and if it occurs, it persists for a short time."
  },
  {
    q: "Do you also classify areas with combustible dust hazards?",
    a: "Yes. We classify areas where combustible dust atmospheres could be present using the Zone 20, 21, and 22 framework in accordance with IEC 60079-10-2."
  },
  {
    q: "What deliverables will we receive at the end of the study?",
    a: "A detailed HAC report documenting methodology and release sources, plus a full set of classification drawings showing zone boundaries on your plant layout."
  }
];

export default function HazardousAreaClassificationPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <main className="bg-white min-h-screen font-sans">
      <Header />
      
      {/* Hero Section */}
      <section className="relative pt-32 pb-24 md:pt-48 md:pb-32 bg-[#1A2B4C] overflow-hidden">
        {/* Background Image with Overlay */}
        <div className="absolute inset-0 z-0">
          <Image
            src="https://picsum.photos/seed/hazardous-area/1920/1080"
            alt="Hazardous Area Classification"
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
            <span className="text-white">Hazardous Area Classification</span>
          </nav>

          <div className="max-w-4xl">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-4xl md:text-7xl font-black text-white uppercase tracking-tight mb-8 leading-none"
            >
              Hazardous Area <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF6900] to-orange-300">Classification &</span> <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF6900] to-orange-300">Zoning</span> <br />
              <span className="text-2xl md:text-4xl block mt-4 text-white/90 tracking-normal">Services for Industrial Facilities</span>
            </motion.h1>
            
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-slate-300 text-lg md:text-xl max-w-2xl leading-relaxed mb-10 font-medium"
            >
              Touch Teq Engineering delivers thorough Hazardous Area Classification (HAC) studies for industrial operations across Southern Africa. Our engineers assess your processes, identify explosive atmosphere risks, and deliver the documentation required for compliance and safety.
            </motion.p>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="flex flex-wrap gap-4"
            >
              <Link href="#contact" className="group flex items-stretch bg-orange-500 hover:bg-orange-600 transition-all rounded-md overflow-hidden shadow-xl shadow-orange-500/20 max-w-full sm:w-auto">
                <span className="px-6 md:px-8 py-3 flex items-center text-white font-black text-[11px] md:text-sm uppercase tracking-widest text-left">
                  Request a Compliance Audit
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
        
        {/* Floating Icon */}
        <motion.div
          initial={{ opacity: 0, scale: 0.5, rotate: -20 }}
          animate={{ opacity: 0.05, scale: 1, rotate: 0 }}
          transition={{ duration: 1 }}
          className="absolute right-[-5%] bottom-[-10%] text-white hidden lg:block"
        >
          <AlertTriangle size={600} />
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
              <span className="text-orange-500 font-black text-xs uppercase tracking-[0.4em]">Hazardous Area Classification</span>
              <div className="w-8 h-px bg-orange-500"></div>
            </motion.div>
            
            <h2 className="text-[#1A2B4C] text-3xl md:text-5xl font-black uppercase tracking-normal mb-8 leading-tight">
              Systematic Identification of <br />
              <span className="text-orange-500">Explosive Atmosphere Risks</span>
            </h2>
            
            <div className="space-y-6 text-slate-600 text-lg leading-relaxed font-medium">
              <p>
                Any facility that processes, stores, or handles flammable gases, vapours, or combustible dusts has a legal obligation to classify the areas where an explosive atmosphere could form. This is not optional. It is a fundamental requirement under the Occupational Health and Safety Act and supporting SANS regulations.
              </p>
              <p>
                Hazardous Area Classification (HAC) is the starting point for every decision that follows. It determines what type of electrical and instrumentation equipment can be installed in each area. It defines how maintenance teams work safely. It shapes your hot work procedures, your emergency response planning, and your overall risk management strategy.
              </p>
              <p>
                At Touch Teq Engineering, we take a methodical, engineering-driven approach to area classification. We study your process flow diagrams, identify every potential release source, evaluate the properties of the substances involved, and assess your ventilation arrangements. From there, we calculate the type, extent, and likelihood of hazardous zones based on the actual conditions at your site.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Section 2: Our HAC Services (Cards) */}
      <section className="py-24 bg-slate-50">
        <div className="container mx-auto px-4 md:px-8">
          <div className="text-center mb-16">
            <span className="text-orange-500 font-black text-xs uppercase tracking-[0.4em] block mb-4">What We Offer</span>
            <h2 className="text-[#1A2B4C] text-3xl md:text-5xl font-black uppercase tracking-normal">Full-Scope Hazardous Area Classification Support</h2>
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

      {/* Section 3: Why Classification Matters */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-4 md:px-8">
          <div className="flex flex-col lg:flex-row gap-16 items-start">
            <div className="lg:w-1/2 lg:sticky lg:top-32">
              <span className="text-orange-500 font-black text-xs uppercase tracking-[0.4em] block mb-6">Safety & Compliance</span>
              <h2 className="text-[#1A2B4C] text-3xl md:text-5xl font-black uppercase tracking-normal mb-8 leading-tight">
                Why Hazardous Area <br />
                Classification is <br />
                <span className="text-orange-500">Non-Negotiable</span>
              </h2>
              <p className="text-slate-600 text-lg leading-relaxed mb-10 font-medium">
                Hazardous Area Classification sits at the foundation of your entire safety management system. Every control measure, from the type of light fitting installed in a pump room to the tools your maintenance team carries into a tank farm, flows directly from the classification.
              </p>
              <div className="relative h-80 w-full rounded-3xl overflow-hidden shadow-xl">
                <Image 
                  src="/Industrial_facility.jpeg" 
                  alt="Safety and Compliance" 
                  fill 
                  className="object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
            </div>
            
            <div className="lg:w-1/2 space-y-12">
              {whyMatters.map((item, index) => (
                <motion.div 
                  key={index}
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="flex gap-6"
                >
                  <div className="shrink-0 w-12 h-12 bg-orange-50 rounded-full flex items-center justify-center text-orange-500">
                    <ShieldCheck size={24} />
                  </div>
                  <div>
                    <h4 className="text-[#1A2B4C] text-xl font-black uppercase tracking-normal mb-3">{item.title}</h4>
                    <p className="text-slate-500 text-sm leading-relaxed font-medium">{item.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Section 4: Our Process */}
      <section className="py-24 bg-slate-50">
        <div className="container mx-auto px-4 md:px-8">
          <div className="text-center mb-16">
            <span className="text-orange-500 font-black text-xs uppercase tracking-[0.4em] block mb-4">How We Work</span>
            <h2 className="text-[#1A2B4C] text-3xl md:text-5xl font-black uppercase tracking-normal">A Structured Approach from Site Assessment to Final Deliverables</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {processSteps.map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-white p-8 rounded-2xl border border-slate-100 flex flex-col items-center text-center group"
              >
                <div className="w-12 h-12 bg-[#1A2B4C] text-white rounded-full flex items-center justify-center font-black text-xl mb-6 group-hover:bg-orange-500 transition-colors">
                  {index + 1}
                </div>
                <h4 className="text-[#1A2B4C] text-sm font-black uppercase tracking-normal mb-4 leading-tight">{step.title}</h4>
                <p className="text-slate-500 text-[10px] leading-relaxed font-bold uppercase tracking-wide">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Section 5: Standards & Regulations */}
      <section className="py-24 bg-[#1A2B4C] text-white">
        <div className="container mx-auto px-4 md:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <span className="text-orange-500 font-black text-xs uppercase tracking-[0.4em] block mb-6">Technical Standards</span>
              <h2 className="text-3xl md:text-5xl font-black uppercase tracking-normal mb-8 leading-tight">
                Classification Work Performed to <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF6900] to-orange-300">Recognised Standards</span>
              </h2>
              <p className="text-slate-300 text-lg leading-relaxed mb-8 font-medium">
                All classification work carried out by Touch Teq Engineering is performed in strict accordance with the standards and regulations recognised in Southern Africa and internationally.
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

      {/* Section 6: Industries We Serve */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-4 md:px-8">
          <div className="text-center mb-16">
            <span className="text-orange-500 font-black text-xs uppercase tracking-[0.4em] block mb-4">Industries</span>
            <h2 className="text-[#1A2B4C] text-3xl md:text-5xl font-black uppercase tracking-normal">
              Hazardous Area Expertise <br />
              Across High-Risk Industrial Sectors
            </h2>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
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

      {/* Section 7: Why Choose Touch Teq */}
      <section className="py-24 bg-slate-50">
        <div className="container mx-auto px-4 md:px-8">
          <div className="flex flex-col lg:flex-row gap-16 items-center">
            <div className="lg:w-1/2">
              <span className="text-orange-500 font-black text-xs uppercase tracking-[0.4em] block mb-6">The Touch Teq Advantage</span>
              <h2 className="text-[#1A2B4C] text-3xl md:text-5xl font-black uppercase tracking-normal mb-8 leading-tight">
                Technical Depth. <br />
                Practical Outcomes. <br />
                <span className="text-orange-500">Real Accountability.</span>
              </h2>
              <div className="relative h-80 w-full rounded-3xl overflow-hidden shadow-xl">
                <Image 
                  src="/teq-advantage-engineer-review.jpeg" 
                  alt="Engineering Audit" 
                  fill 
                  className="object-cover"
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

      {/* Section 8: The Cost of Getting It Wrong */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-4 md:px-8">
          <div className="max-w-5xl mx-auto bg-[#1A2B4C] rounded-[3rem] p-12 md:p-20 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 p-12 opacity-10">
              <AlertOctagon size={300} />
            </div>
            
            <div className="relative z-10">
              <span className="text-orange-500 font-black text-xs uppercase tracking-[0.4em] block mb-6">Risk Awareness</span>
              <h2 className="text-3xl md:text-6xl font-black uppercase tracking-normal mb-12 leading-tight">
                The Cost of <br /> <span className="text-orange-500 text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-red-500">Getting It Wrong</span>
              </h2>
              
              <p className="text-slate-300 text-lg md:text-xl leading-relaxed mb-12 font-medium max-w-3xl">
                Facilities that operate without a valid hazardous area classification, or with one that has not been updated following process changes, are exposed to serious risk on multiple fronts.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                <div>
                  <h4 className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF6900] to-orange-300 font-black text-xl uppercase tracking-normal mb-4">Safety & Regulatory Risk</h4>
                  <p className="text-slate-400 text-sm leading-relaxed mb-6">
                    Incorrectly rated equipment is an ignition source waiting for a flammable atmosphere. Regulatory bodies can issue prohibition notices, stop operations, and pursue prosecution.
                  </p>
                </div>
                <div>
                  <h4 className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF6900] to-orange-300 font-black text-xl uppercase tracking-normal mb-4">Financial & Reputational Risk</h4>
                  <p className="text-slate-400 text-sm leading-relaxed mb-6">
                    Insurers may deny claims arising from incidents in areas not properly classified. A serious incident will damage your standing with regulators, clients, and communities.
                  </p>
                </div>
              </div>
              
              <div className="mt-12 pt-12 border-t border-white/10 text-center">
                <p className="text-white font-black text-xl uppercase tracking-normal italic">
                  &quot;The investment in a proper HAC study is small compared to the cost of getting it wrong.&quot;
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 9: FAQ */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-4 md:px-8">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-16">
              <span className="text-orange-500 font-black text-xs uppercase tracking-[0.4em] block mb-4">Frequently Asked Questions</span>
              <h2 className="text-[#1A2B4C] text-3xl md:text-5xl font-black uppercase tracking-normal">Practical Answers to Common <br /> Hazardous Area Questions</h2>
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
              className="text-5xl md:text-7xl font-black text-white uppercase tracking-tight leading-[0.85] mb-10"
            >
              Is Your Facility Classification <br /> <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF6900] to-orange-300">Current and Compliant?</span>
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-slate-400 text-lg md:text-xl max-w-2xl mb-12 font-medium leading-relaxed"
            >
              Whether you need a new classification study, a review of existing zones, or an independent compliance audit, our engineers are ready to help.
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
                  REQUEST A COMPLIANCE AUDIT
                </span>
                <div className="bg-[#ff6900] px-4 md:px-5 flex items-center justify-center group-hover:bg-orange-600 transition-colors shrink-0">
                  <ArrowRight className="text-white w-4 h-4 -rotate-45 group-hover:rotate-0 transition-all duration-300" />
                </div>
              </Link>

              <a href="tel:+27725522110" className="group flex items-stretch bg-orange-500 hover:bg-orange-600 transition-all rounded-md overflow-hidden shadow-xl shadow-orange-500/20 max-w-full sm:w-auto">
                <span className="px-6 md:px-8 py-3 flex items-center text-white font-black text-[11px] md:text-sm uppercase tracking-widest text-left">
                  <Phone size={16} className="mr-3" />
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
