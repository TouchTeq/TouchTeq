'use client';

import { motion, AnimatePresence } from 'motion/react';
import { 
  DraftingCompass, FileCode, Layers, Settings, ShieldCheck, 
  Activity, Zap, Flame, Database, Search, ChevronRight, 
  ArrowRight, CheckCircle2, Factory, Droplets, HardHat, 
  ZapOff, Microscope, Plus, Minus, Info, AlertTriangle,
  ClipboardList, Network, Cpu, Ruler, PenTool, BookOpen,
  RefreshCw, History, ShieldAlert, FileText, ClipboardCheck,
  Compass, Zap as ElectricalIcon, ArrowUpRight, Phone
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
    title: "Front-End Engineering Design (FEED)",
    description: "We help define the technical direction of your project before you commit to construction. This includes developing system architectures, preliminary single-line diagrams, equipment sizing, detection philosophy documents, and cost estimates."
  },
  {
    title: "Detailed Engineering Design",
    description: "We produce the complete technical packages required to build your systems. This includes cable schedules, loop diagrams, wiring diagrams, termination details, cause and effect matrices, equipment specifications, data sheets, and layout drawings."
  },
  {
    title: "P&ID Development and Verification",
    description: "We develop, review, and update P&IDs that accurately represent your process and instrumentation configuration. For existing facilities, we conduct site verification walkdowns to ensure your P&IDs reflect the actual installed condition."
  },
  {
    title: "Cause and Effect Matrix Development",
    description: "For safety-critical systems, we develop detailed cause and effect matrices that define exactly how the system must respond to each input. Every alarm, trip, and output action is mapped, cross-referenced, and validated."
  },
  {
    title: "Fire and Gas Detection System Design",
    description: "We engineer the complete detection layout for fire and gas systems, including the selection and placement of gas detectors, flame detectors, heat detectors, smoke detectors, and manual call points based on gas dispersion analysis."
  },
  {
    title: "Protection and Safety Studies",
    description: "We perform the engineering calculations that underpin safe system design, including electrical protection coordination studies, fault level calculations, discrimination studies, cable sizing verification, and voltage drop analysis."
  },
  {
    title: "Drafting and CAD Services",
    description: "Our drafting capability supports the production of clear, accurate, and standards-compliant technical drawings, including 2D layouts, single-line diagrams, P&IDs, and equipment location plans."
  },
  {
    title: "Reverse Engineering and Legacy Plant Documentation",
    description: "We help clients regain control of undocumented systems by tracing existing installations from the field device to the control system, identifying every component, and producing updated drawings and schedules."
  },
  {
    title: "As-Built Documentation",
    description: "We update all project drawings and documents to reflect the final installed condition on site. Accurate as-built records are a fundamental requirement for ongoing maintenance and compliance audits."
  },
  {
    title: "Bill of Materials and Procurement Support",
    description: "We produce detailed bills of materials derived directly from the engineering design, ensuring that every item ordered has a clear link to a drawing, a specification, and a location on the plant."
  },
  {
    title: "Independent Design Review",
    description: "We perform independent technical reviews of engineering packages produced by EPC contractors, system integrators, or other consultancies. Our reviews assess compliance with applicable standards, technical accuracy, constructability, and alignment with the project's safety objectives."
  }
];

const disciplines = [
  {
    title: "Fire and Gas Detection System Design",
    desc: "Detection philosophy development, detector selection and placement, coverage mapping and gas dispersion analysis, cause and effect matrix development, alarm management, and integration with plant safety systems.",
    icon: Flame
  },
  {
    title: "Control and Instrumentation (C&I) Engineering",
    desc: "Instrument selection and specification, loop design, wiring and termination engineering, control narrative development, safety instrumented system (SIS) design, SIL verification, and marshalling design.",
    icon: Cpu
  },
  {
    title: "Industrial Electrical Engineering",
    desc: "Power distribution design, single-line diagrams, cable sizing and route engineering, protection coordination, earthing and lightning protection, hazardous area electrical design, and MCC specification.",
    icon: ElectricalIcon
  }
];

const processSteps = [
  {
    title: "Requirements Capture and Basis of Design",
    desc: "We establish what the system needs to achieve by reviewing project scope, safety studies (HAZOP, SIL), regulatory requirements, and client engineering standards."
  },
  {
    title: "Concept and System Architecture",
    desc: "We develop the system concept, including block diagrams, preliminary single-line diagrams, detection philosophy, and overall system architecture."
  },
  {
    title: "Detail Engineering",
    desc: "This is where the concept is developed into the full construction documentation: P&IDs, loop drawings, cable schedules, termination diagrams, and specifications."
  },
  {
    title: "Interdisciplinary Coordination",
    desc: "We coordinate our deliverables with other engineering disciplines (process, mechanical, civil, structural) to identify clashes and interface gaps."
  },
  {
    title: "Issue for Construction and Ongoing Support",
    desc: "We issue the final design package and remain available throughout construction and commissioning to respond to technical queries and review vendor submissions."
  }
];

const standards = [
  { code: "IEC 61511", desc: "Functional safety: Safety instrumented systems for the process industry" },
  { code: "IEC 61508", desc: "Functional safety of electrical/electronic safety-related systems" },
  { code: "IEC 60079-14", desc: "Design, selection, and erection of electrical installations in explosive atmospheres" },
  { code: "ISA 5.1 / IEC 62424", desc: "Instrumentation symbols and identification standards" },
  { code: "SANS 10142", desc: "The wiring of premises (South African standard)" },
  { code: "SANS 10089", desc: "Design and installation of systems in petroleum handling facilities" },
  { code: "SANS 10108", desc: "Classification of hazardous locations" },
  { code: "SANS 10400", desc: "Application of the National Building Regulations" },
  { code: "EN 54 Series", desc: "Applied where EN 54-certified detection components are specified, particularly for projects with international client or insurer requirements." },
  { code: "ATEX / IECEx", desc: "International frameworks for equipment certification in explosive atmospheres" },
  { code: "ISO 9001", desc: "Quality management systems for engineering processes" },
  { code: "Client Standards", desc: "Client-specific and site-specific engineering standards and specifications" }
];

const industries = [
  { name: "Oil Refineries & Petrochemical", icon: Droplets },
  { name: "Chemical Processing", icon: Factory },
  { name: "Mining & Minerals Processing", icon: HardHat },
  { name: "Power Generation & Utilities", icon: ZapOff },
  { name: "Oil & Gas Production", icon: Droplets },
  { name: "Fuel Storage & Distribution", icon: Flame },
  { name: "Water & Wastewater Treatment", icon: Droplets },
  { name: "Pharmaceutical & Food Processing", icon: Microscope }
];

const whyChooseUs = [
  {
    title: "Designs Shaped by Field Experience",
    desc: "Our engineers have direct exposure to installation, commissioning, and maintenance. They know which decisions cause problems during construction and which layouts make maintenance difficult."
  },
  {
    title: "All Three Disciplines Under One Roof",
    desc: "We handle electrical, C&I, and fire and gas design within a single team, eliminating interface problems that occur when separate consultancies work on different pieces of the same project."
  },
  {
    title: "Professional and Legal Accountability",
    desc: "Our engineering output is overseen by professionals registered with ECSA. When we sign off on a design, it carries professional accountability and legal responsibility."
  },
  {
    title: "Documentation That Stands Up to Scrutiny",
    desc: "We structure our packages to meet the expectations of regulatory inspectors, insurance auditors, and client review panels. Our documentation answers questions, not creates them."
  },
  {
    title: "Direct Access to the Engineer",
    desc: "You speak directly to the engineer responsible for the deliverables. No layers of project coordinators filtering your technical discussions or design decisions."
  },
  {
    title: "Deliverables Designed for the Full Asset Lifecycle",
    desc: "Our documents are structured to support not just construction, but also day-to-day operations, planned maintenance, future modifications, and eventual decommissioning."
  }
];

const faqs = [
  {
    q: "Can you provide design-only services without handling the installation?",
    a: "Yes. We regularly deliver standalone engineering packages for clients who have their own installation teams or who are appointing a separate construction contractor. We produce the full design documentation, support procurement, and remain available during construction to respond to technical queries."
  },
  {
    q: "Our plant drawings are outdated or missing entirely. Can you help?",
    a: "This is one of the most frequent requests we receive. We conduct physical site walkdowns, trace existing installations from the field device through to the control room, and produce updated documentation that reflects the actual installed condition."
  },
  {
    q: "At what stage of a project should we get you involved?",
    a: "As early as possible. The greatest value we add is during the concept and FEED phase, where the decisions about system architecture, technology selection, detection philosophy, and safety strategy are made."
  },
  {
    q: "What will a typical engineering deliverable package include?",
    a: "A typical detailed engineering package includes a Basis of Design, system architecture diagrams, P&IDs, single-line diagrams, loop drawings, wiring diagrams, cable schedules, termination details, cause and effect matrices, equipment specifications, data sheets, layout drawings, and a bill of materials."
  },
  {
    q: "Do you design fire and gas detection systems?",
    a: "Yes. Fire and gas detection system design is one of our primary capabilities, covering detection philosophy, detector selection, physical layout engineering based on gas dispersion, and cause and effect logic development."
  },
  {
    q: "How do you handle electrical design for hazardous areas?",
    a: "Our design is directly linked to the Hazardous Area Classification. We ensure every piece of equipment specified within a classified zone carries the correct protection concept (Ex d, Ex e, Ex i, etc.) and that all installation details comply with the zone requirements."
  },
  {
    q: "What software do you use for engineering and drafting?",
    a: "We use AutoCAD as our primary drafting platform along with specialised electrical and instrumentation design tools for cable sizing, protection coordination, and system modelling."
  },
  {
    q: "Can you review a design that was produced by another engineering firm?",
    a: "Yes. We regularly perform independent design reviews for compliance with standards, technical accuracy, constructability, maintainability, and alignment with safety objectives."
  },
  {
    q: "Do you provide engineering support during construction and commissioning?",
    a: "We remain available throughout construction and commissioning to answer technical queries, review vendor documentation, issue design clarifications, and produce as-built updates."
  },
  {
    q: "How long does a typical design project take?",
    a: "The timeline depends on the scope and complexity. A focused engagement might take a few weeks, while a full front-end engineering package for a new facility could run over several months."
  }
];

export default function DesignAndEngineeringPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <main className="bg-white min-h-screen font-sans">
      <BreadcrumbJsonLd 
        items={[
          { name: 'Home', url: 'https://touchteq.co.za' },
          { name: 'Services', url: 'https://touchteq.co.za/#services' },
          { name: 'Design & Engineering', url: 'https://touchteq.co.za/services/design-and-engineering' }
        ]}
      />
      <FAQJsonLd 
        faqs={faqs.map(faq => ({ question: faq.q, answer: faq.a }))}
      />
      <ServiceJsonLd 
        name="Industrial Design & Engineering"
        description="Comprehensive front-end (FEED) and detailed engineering for industrial facilities. Specialist design in Fire & Gas, C&I, and Electrical systems."
        url="https://touchteq.co.za/services/design-and-engineering"
        serviceType={[
          'Front-End Engineering Design (FEED)', 
          'Detailed Engineering Design', 
          'P&ID Development', 
          'Cause and Effect Matrix',
          'Fire & Gas Detection Design',
          'Protection Studies'
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
            src="/Industrial_facility.jpeg"
            alt="Design & Engineering Services"
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
            <span className="text-white">Design & Engineering</span>
          </nav>

          <div className="max-w-4xl">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-4xl md:text-7xl font-black text-white uppercase tracking-tight mb-8 leading-none"
            >
              Front-End and <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF6900] to-orange-300">Detailed Engineering</span> <br />
              <span className="text-2xl md:text-4xl block mt-4 text-white/90 tracking-normal">for Industrial Facilities</span>
            </motion.h1>
            
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-slate-300 text-lg md:text-xl max-w-2xl leading-relaxed mb-10 font-medium"
            >
              Touch Teq Engineering provides the technical foundation that industrial projects depend on. We design fire and gas detection, control and instrumentation, and electrical installations from first principles.
            </motion.p>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="flex flex-wrap gap-4"
            >
              <Link href="#contact" className="group flex items-stretch bg-orange-500 hover:bg-orange-600 transition-all rounded-md overflow-hidden shadow-xl shadow-orange-500/20 max-w-full sm:w-auto">
                <span className="px-6 md:px-8 py-3 flex items-center text-white font-black text-[11px] md:text-sm uppercase tracking-widest text-left">
                  Discuss Your Project
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
          <DraftingCompass size={600} />
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
              <span className="text-orange-500 font-black text-xs uppercase tracking-[0.4em]">Design & Engineering</span>
              <div className="w-8 h-px bg-orange-500"></div>
            </motion.div>
            
            <h2 className="text-[#1A2B4C] text-3xl md:text-5xl font-black uppercase tracking-normal mb-8 leading-tight">
              Engineering That Moves From <br />
              <span className="text-orange-500">Concept to Construction</span>
            </h2>
            
            <div className="space-y-6 text-slate-600 text-lg leading-relaxed font-medium">
              <p>
                The quality of your engineering determines the quality of your installation. A project with incomplete drawings, ambiguous specifications, or poorly defined safety logic will generate problems at every stage, from procurement through to commissioning and handover.
              </p>
              <p>
                At Touch Teq Engineering, we work at the front end of the project lifecycle, where the decisions that shape everything downstream are made. We take your operational requirements, your process hazards, your regulatory obligations, and your site-specific constraints, and we translate them into a complete engineering design that your construction team can execute with confidence.
              </p>
              <p>
                Our approach is grounded in practical experience. Because we also deliver installation and commissioning services, our engineers understand what happens when a design meets the reality of a working plant. We know which cable routing arrangements cause access problems during construction. We know which junction box layouts make termination difficult in confined spaces.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Section 2: Our Engineering Services (Cards) */}
      <section className="py-24 bg-slate-50">
        <div className="container mx-auto px-4 md:px-8">
          <div className="text-center mb-16">
            <span className="text-orange-500 font-black text-xs uppercase tracking-[0.4em] block mb-4">What We Offer</span>
            <h2 className="text-[#1A2B4C] text-3xl md:text-5xl font-black uppercase tracking-normal">Full-Scope Engineering from Early Concept Through to As-Built Records</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {services.map((service, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
                className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group"
              >
                <div className="w-10 h-10 bg-slate-50 rounded-lg flex items-center justify-center mb-6 group-hover:bg-orange-500 transition-colors duration-300">
                  <span className="text-[#1A2B4C] font-black text-lg group-hover:text-white transition-colors">0{index + 1}</span>
                </div>
                <h3 className="text-sm font-black text-[#1A2B4C] uppercase tracking-normal mb-4 group-hover:text-orange-500 transition-colors leading-tight">{service.title}</h3>
                <p className="text-slate-500 text-[10px] leading-relaxed font-bold uppercase tracking-wide">{service.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Section 3: Disciplines We Cover */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-4 md:px-8">
          <div className="text-center mb-16">
            <span className="text-orange-500 font-black text-xs uppercase tracking-[0.4em] block mb-4">Our Expertise</span>
            <h2 className="text-[#1A2B4C] text-3xl md:text-5xl font-black uppercase tracking-normal">Integrated Design Across Three Core Technical Disciplines</h2>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {disciplines.map((discipline, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-slate-50 p-10 rounded-[2rem] border border-slate-100 group hover:bg-[#1A2B4C] transition-all duration-500"
              >
                <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mb-8 shadow-sm group-hover:bg-orange-500 transition-colors">
                  <discipline.icon className="text-[#1A2B4C] group-hover:text-white transition-colors" size={32} />
                </div>
                <h4 className="text-[#1A2B4C] group-hover:text-white text-xl font-black uppercase tracking-normal mb-6 transition-colors">{discipline.title}</h4>
                <p className="text-slate-500 group-hover:text-slate-300 text-sm leading-relaxed font-medium transition-colors">{discipline.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Section 4: Our Design Process */}
      <section className="py-24 bg-slate-50">
        <div className="container mx-auto px-4 md:px-8">
          <div className="text-center mb-16">
            <span className="text-orange-500 font-black text-xs uppercase tracking-[0.4em] block mb-4">How We Work</span>
            <h2 className="text-[#1A2B4C] text-3xl md:text-5xl font-black uppercase tracking-normal">A Structured Methodology from Requirements Through to Construction Issue</h2>
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

      {/* Section 5: Risk Awareness */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-4 md:px-8">
          <div className="max-w-5xl mx-auto bg-[#1A2B4C] rounded-[3rem] p-12 md:p-20 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 p-12 opacity-10">
              <ShieldAlert size={300} />
            </div>
            
            <div className="relative z-10">
              <span className="text-orange-500 font-black text-xs uppercase tracking-[0.4em] block mb-6">Risk Awareness</span>
              <h2 className="text-3xl md:text-6xl font-black uppercase tracking-normal mb-12 leading-tight">
                The Real Cost of <br /> <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF6900] to-orange-300">Poor Front-End</span> <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF6900] to-orange-300">Engineering</span>
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                <div className="space-y-8">
                  <div>
                    <h4 className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF6900] to-orange-300 font-black text-xl uppercase tracking-normal mb-4">Rework During Construction</h4>
                    <p className="text-slate-400 text-sm leading-relaxed">
                      Equipment arrives on site and does not fit. Cables are routed to the wrong junction boxes. The installation team stops, costs climb, and schedules slip. Every day of waiting multiplies the cost.
                    </p>
                  </div>
                  <div>
                    <h4 className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF6900] to-orange-300 font-black text-xl uppercase tracking-normal mb-4">Commissioning Delays</h4>
                    <p className="text-slate-400 text-sm leading-relaxed">
                      Logic errors in the cause and effect matrix, missing interlocks, and undocumented field modifications all surface during testing, turning commissioning into a troubleshooting exercise.
                    </p>
                  </div>
                </div>
                <div className="space-y-8">
                  <div>
                    <h4 className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF6900] to-orange-300 font-black text-xl uppercase tracking-normal mb-4">Compliance Exposure</h4>
                    <p className="text-slate-400 text-sm leading-relaxed">
                      Without a properly documented design basis, it is difficult to demonstrate to a regulator or insurer that your installation was engineered to the required standards.
                    </p>
                  </div>
                  <div>
                    <h4 className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF6900] to-orange-300 font-black text-xl uppercase tracking-normal mb-4">Maintenance Burden</h4>
                    <p className="text-slate-400 text-sm leading-relaxed">
                      A poorly documented installation creates an ongoing problem. Without accurate loop drawings and as-built records, every fault-finding exercise takes longer than it should.
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="mt-12 pt-12 border-t border-white/10 text-center">
                <p className="text-white font-black text-xl uppercase tracking-normal italic">
                  &quot;The investment required to engineer a project properly at the front end is a fraction of the cost of fixing problems during construction.&quot;
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 6: Standards We Design To */}
      <section className="py-24 bg-[#1A2B4C] text-white">
        <div className="container mx-auto px-4 md:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <span className="text-orange-500 font-black text-xs uppercase tracking-[0.4em] block mb-6">Technical Standards</span>
              <h2 className="text-3xl md:text-5xl font-black uppercase tracking-normal mb-8 leading-tight">
                Engineering Aligned to <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF6900] to-orange-300">International</span> <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF6900] to-orange-300">Requirements</span>
              </h2>
              <p className="text-slate-300 text-lg leading-relaxed mb-8 font-medium">
                Every design we produce is developed in accordance with the standards and codes applicable to your industry, your region, and your specific facility requirements.
              </p>
            </div>
            
            <div className="space-y-4 max-h-[600px] overflow-y-auto pr-4 custom-scrollbar">
              {standards.map((std, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.05 }}
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

      {/* Section 7: Industries We Serve */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-4 md:px-8">
          <div className="text-center mb-16">
            <span className="text-orange-500 font-black text-xs uppercase tracking-[0.4em] block mb-4">Industries</span>
            <h2 className="text-[#1A2B4C] text-3xl md:text-5xl font-black uppercase tracking-normal">Engineering Design for High-Risk, High-Consequence Environments</h2>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
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

      {/* Section 8: Brownfield Engineering */}
      <section className="py-24 bg-slate-50">
        <div className="container mx-auto px-4 md:px-8">
          <div className="bg-white rounded-[3rem] p-12 md:p-20 border border-slate-100 shadow-xl">
            <div className="flex flex-col lg:flex-row gap-16 items-center">
              <div className="lg:w-1/2">
                <span className="text-orange-500 font-black text-xs uppercase tracking-[0.4em] block mb-6">Brownfield Engineering</span>
                <h2 className="text-[#1A2B4C] text-3xl md:text-5xl font-black uppercase tracking-normal mb-8 leading-tight">
                  Recovering, Updating, and <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF6900] to-orange-300">Completing</span> <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF6900] to-orange-300">Documentation</span>
                </h2>
                <p className="text-slate-600 text-lg leading-relaxed mb-8 font-medium">
                  Plants built decades ago may have undergone multiple modifications without documentation keeping pace. We address this systematically by conducting site walkdowns and tracing every circuit to produce accurate records.
                </p>
              </div>
              <div className="lg:w-1/2">
                <div className="grid grid-cols-1 gap-4">
                  {[
                    "Site verification walkdowns and condition assessments",
                    "Red-lining and updating P&IDs to reflect current condition",
                    "Producing as-built loop drawings and wiring diagrams",
                    "Updating cable schedules and termination records",
                    "Revising fire and gas detection layouts for modifications",
                    "Developing or updating equipment registers (HAER)",
                    "Documentation gap analysis and recovery prioritisation"
                  ].map((item, i) => (
                    <div key={i} className="flex items-center space-x-4 bg-slate-50 p-4 rounded-xl border border-slate-100 group hover:border-orange-500 transition-colors">
                      <div className="w-2 h-2 bg-orange-500 rounded-full group-hover:scale-150 transition-transform"></div>
                      <span className="text-[#1A2B4C] font-black text-[10px] uppercase tracking-widest">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 9: Why Choose Touch Teq */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-4 md:px-8">
          <div className="flex flex-col lg:flex-row gap-16 items-center">
            <div className="lg:w-1/2">
              <span className="text-orange-500 font-black text-xs uppercase tracking-[0.4em] block mb-6">The Touch Teq Advantage</span>
              <h2 className="text-[#1A2B4C] text-3xl md:text-5xl font-black uppercase tracking-normal mb-8 leading-tight">
                Engineers Who Design <br />
                What They Know <br />
                <span className="text-orange-500">How to Build</span>
              </h2>
              <div className="relative h-[500px] w-full rounded-3xl overflow-hidden shadow-xl">
                <Image 
                  src="/engineer-led-design-and-installation.jpg" 
                  alt="Engineering Field Experience" 
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

      {/* Section 10: FAQ */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-4 md:px-8">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-16">
              <span className="text-orange-500 font-black text-xs uppercase tracking-[0.4em] block mb-4">Frequently Asked Questions</span>
              <h2 className="text-[#1A2B4C] text-3xl md:text-5xl font-black uppercase tracking-normal">Practical Questions About Our <br /> Design and Engineering Services</h2>
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

      {/* Section 11: CTA */}
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
              Start Your Project With <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF6900] to-orange-300">the Right</span> <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF6900] to-orange-300">Engineering</span>
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-slate-400 text-lg md:text-xl max-w-2xl mb-12 font-medium leading-relaxed"
            >
              Whether you are planning a new facility, expanding existing operations, or bringing your plant documentation up to standard, our team is ready to help.
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
                  DISCUSS YOUR PROJECT
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
