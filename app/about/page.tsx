'use client';

import { motion, AnimatePresence } from 'motion/react';
import { 
  ChevronRight, ArrowRight, ArrowUpRight, CheckCircle2, Globe, ShieldCheck, 
  Clock, Award, FileText, Phone, Mail, MapPin, Users, User,
  Zap, Cpu, Flame, AlertTriangle, PhoneCall, Plus, Minus
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import BackToTop from '@/components/BackToTop';

const principles = [
  {
    title: "Technical Rigour Over Shortcuts",
    description: "We do not take shortcuts in engineering. Every design is checked. Every installation is tested. Every document is reviewed before it leaves our hands. When we sign off on a piece of work, it meets the standard. Not approximately, not close enough, but fully compliant and technically defensible. This is not negotiable, regardless of schedule pressure or budget constraints."
  },
  {
    title: "Direct Accountability",
    description: "Every project we take on is led by a qualified engineer who is personally responsible for the outcome. Our clients always know who is accountable for their work, and they have direct access to that person. We do not hide behind layers of project coordinators or administration. If something needs to be discussed, resolved, or escalated, you speak to the engineer."
  },
  {
    title: "Safety as an Engineering Discipline",
    description: "In our line of work, safety is not a slogan on a poster. It is an engineering discipline. We design systems that are intended to prevent explosions, detect fires, shut down processes, and protect human life. The standard to which we execute that work has real consequences. We treat every project with that understanding, whether it is a full facility design or a single detector replacement."
  },
  {
    title: "Honest Communication",
    description: "We tell our clients what they need to hear, not what they want to hear. If a timeline is unrealistic, we say so. If an existing installation is non-compliant, we document it clearly and recommend the corrective action. If a scope of work is outside our capability, we are upfront about it. Trust is built on honesty, and we would rather have a difficult conversation early than deliver a compromised result later."
  },
  {
    title: "Completeness",
    description: "We believe a project is not finished until the documentation is complete, the system is tested, the client's team is trained, and every deliverable has been handed over in a form that is useful for operations and maintenance. We do not disappear after the last piece of equipment is energised. We follow through until the job is properly closed out."
  }
];

const disciplines = [
  {
    icon: Flame,
    title: "Fire and Gas Detection Systems",
    description: "We design, install, commission, and maintain fire and gas detection systems for industrial facilities. This includes flammable gas detection, toxic gas monitoring, flame detection, smoke and heat detection, and manual call point systems. Our work covers detection philosophy development, detector selection and placement based on gas dispersion analysis, cause and effect logic development, system integration with plant DCS and ESD platforms, and ongoing maintenance to keep these life-safety systems in reliable operating condition.",
    items: [
      "Detection philosophy development",
      "Detector selection and placement (Gas dispersion analysis)",
      "Cause and effect logic development",
      "Plant DCS and ESD platform integration",
      "Scheduled maintenance and 24/7 support"
    ]
  },
  {
    icon: Cpu,
    title: "Control and Instrumentation (C&I)",
    description: "We provide control and instrumentation engineering services including instrument selection and specification, loop design, wiring and termination engineering, safety instrumented system (SIS) design, control narrative development, marshalling and I/O design, and control system architecture. Our C&I work is closely integrated with our fire and gas detection and electrical capabilities, ensuring that the full instrumentation scope is coordinated from a single engineering baseline.",
    items: [
      "Instrument selection and specification",
      "Loop, wiring and termination engineering",
      "Safety instrumented system (SIS) design",
      "Control narrative and logic development",
      "Marshalling and I/O design"
    ]
  },
  {
    icon: Zap,
    title: "Industrial Electrical Engineering",
    description: "We deliver electrical engineering services for industrial environments, including power distribution design, single-line diagram development, cable sizing and route engineering, protection coordination studies, fault level calculations, earthing and lightning protection design, hazardous area electrical design, motor control centre specification, and standby power system integration. Our electrical designs account for the specific requirements of classified hazardous areas, ensuring that all equipment, cable entries, and installation methods comply with the zone classification.",
    items: [
      "Power distribution and single-line diagrams",
      "Cable sizing and route engineering",
      "Protection coordination and fault studies",
      "Earthing and lightning protection design",
      "Hazardous area electrical installations"
    ]
  }
];

const approachSteps = [
  {
    title: "Understand Before We Act",
    description: "We do not start drawing or ordering equipment until we thoroughly understand the client's requirements, the process environment, the hazards involved, and the regulatory framework that applies."
  },
  {
    title: "Design With Construction in Mind",
    description: "Every design we produce is intended to be built. Because our team also delivers installation, we design with a practical understanding of how systems are assembled, terminated, tested, and maintained."
  },
  {
    title: "Execute With Discipline",
    description: "During installation and commissioning, we maintain the same discipline as during design. Workmanship standards are defined and enforced. Testing is carried out systematically against the approved design."
  },
  {
    title: "Document Everything",
    description: "We believe documentation is as important as the physical installation. When we hand over a project, the client receives a complete technical record including as-built drawings and test certificates."
  },
  {
    title: "Stay Available After Handover",
    description: "Our relationship with a client does not end when the project is commissioned. We provide ongoing maintenance and support, and we are available when systems need to be modified or expanded."
  }
];

const credentials = [
  {
    title: "ECSA Registration",
    description: "Our engineering professionals are registered with the Engineering Council of South Africa as Professional Technologists (Pr Tech Eng) in Electrical Engineering."
  },
  {
    title: "Functional Safety Competence",
    description: "Our team has demonstrated competence in functional safety per IEC 61511 and IEC 61508 for safety instrumented systems."
  },
  {
    title: "Hazardous Area Engineering",
    description: "Specialist knowledge in hazardous area classification per SANS 10108, IEC 60079-10-1, IEC 60079-10-2, IEC 60079-14, and ATEX/IECEx frameworks."
  },
  {
    title: "Regulatory Compliance",
    description: "Our operations comply with the OHS Act, Electrical Installation Regulations, and relevant SANS standards."
  },
  {
    title: "Quality Management",
    description: "Our engineering processes are aligned with quality management principles ensuring consistency, traceability, and continuous improvement."
  },
  {
    title: "Health and Safety",
    description: "We maintain a comprehensive health and safety management system covering all site activities with necessary insurance coverage."
  }
];

const regions = [
  { country: "South Africa", areas: "Gauteng, Mpumalanga, KwaZulu-Natal, Limpopo, Free State, Western Cape, Eastern Cape, Northern Cape, and North West. Key industrial areas include the Secunda and Sasolburg petrochemical complex, the Durban and Richards Bay refinery and port corridor, the Witwatersrand manufacturing belt, and the Limpopo and Mpumalanga mining and power generation regions." },
  { country: "Mozambique", areas: "Gas processing and LNG infrastructure, Maputo and Matola industrial corridor, and mining operations in the central and northern provinces." },
  { country: "Botswana", areas: "Mining and minerals processing, including operations in the Selebi-Phikwe, Francistown, and Jwaneng regions, and industrial facilities in the greater Gaborone area." },
  { country: "Namibia", areas: "Mining and processing facilities in the Erongo and Otjozondjupa regions, industrial operations in Windhoek and Walvis Bay, and offshore support infrastructure." },
  { country: "Zimbabwe", areas: "Refinery operations, mining, and manufacturing in the Harare and Bulawayo industrial areas." }
];

const industries = [
  "Oil refineries and petrochemical facilities",
  "Chemical processing and manufacturing plants",
  "Mining and minerals processing operations (surface and underground)",
  "Fuel storage and distribution depots",
  "Power generation and utility infrastructure",
  "Manufacturing and heavy industry",
  "Pharmaceutical manufacturing",
  "Food and beverage processing",
  "Water and wastewater treatment",
  "Oil and gas production and pipeline infrastructure"
];

const advantages = [
  {
    title: "Exclusive Industrial Focus",
    description: "We work in one market: high-risk industrial environments. We do not spread our resources across commercial, residential, and industrial projects. That singular focus means our entire team, our entire knowledge base, and our entire operational capability is concentrated on the work that matters to industrial clients."
  },
  {
    title: "Engineer-Led Delivery",
    description: "Every project is led by a qualified, registered engineer who takes personal responsibility for the technical quality and compliance of the work. Our clients always know who is accountable for their work, and they have direct access to that person throughout the project."
  },
  {
    title: "Full Lifecycle Capability",
    description: "We handle the complete project lifecycle from front-end design through to installation, commissioning, and ongoing maintenance. This eliminates the fragmentation that occurs when different firms are responsible for different phases, and it gives our clients a single point of accountability for the entire scope."
  },
  {
    title: "Practical, Constructible Engineering",
    description: "Our designs are informed by real field experience. Because we also install and commission the systems we design, we understand the practical constraints of construction and maintenance. Our engineering produces systems that can be built efficiently, tested systematically, and maintained safely throughout their service life."
  },
  {
    title: "Complete and Auditable Documentation",
    description: "We treat documentation as a core deliverable, not an administrative afterthought. Every project we hand over includes a complete technical record that is structured to support operations, maintenance, compliance audits, and future modifications."
  },
  {
    title: "Proven Regional Capability",
    description: "We have a demonstrated track record of delivering projects across Southern Africa, including cross-border work in Mozambique, Botswana, Namibia, and Zimbabwe. We manage the logistics, regulatory requirements, and site access protocols involved in regional project delivery as a routine part of our operations."
  },
  {
    title: "Long-Term Client Relationships",
    description: "Many of our clients have worked with us across multiple projects over several years. We earn repeat business by delivering consistently, communicating honestly, and being available when our clients need support, whether that is during a planned project or an unplanned emergency."
  }
];

const faqs = [
  {
    q: "How long has Touch Teq Engineering been operating?",
    a: "Touch Teq Engineering was founded in [year] with a specific focus on industrial fire and gas detection, control and instrumentation, and electrical engineering. Since our founding, we have built a portfolio of projects across multiple industries and countries in the Southern African region. Our team's collective experience in the industrial sector extends well beyond the age of the company itself."
  },
  {
    q: "Are your engineers registered with ECSA?",
    a: "Yes. Our engineering work is overseen by professionals registered with the Engineering Council of South Africa. This registration provides our clients with the legal and technical assurance that the work is being conducted by qualified, competent individuals who meet the standards defined by the profession and who are held accountable under the Engineering Profession Act."
  },
  {
    q: "Do you use subcontractors for your project work?",
    a: "We maintain direct control over all critical engineering, installation, and commissioning activities using our own internal team. For specific support functions or large-scale mobilisations, we may engage trusted specialist partners, but the engineering oversight, quality control, and accountability always remain with Touch Teq. Our clients are informed if any external resources are involved in their project."
  },
  {
    q: "What size of projects do you typically handle?",
    a: "We deliver projects across a wide range of scales. This includes focused, short-duration scopes such as a single hazardous area classification study or a detector replacement on an existing system, through to large, multi-discipline engineering packages covering design, procurement, installation, and commissioning for new facilities or major plant upgrades. We scale our resources to match the scope, and we apply the same engineering rigour regardless of the project size."
  },
  {
    q: "Can you work within our existing safety and permit-to-work systems?",
    a: "Absolutely. We work on client sites across multiple industries, each with its own safety management system, permit-to-work procedures, and site-specific requirements. Our teams are experienced in integrating with these systems and complying with all site rules from the day they arrive. We carry our own comprehensive safety documentation and are happy to submit it for client review as part of the mobilisation process."
  },
  {
    q: "Do you carry professional indemnity and liability insurance?",
    a: "Yes. We maintain professional indemnity insurance, public liability insurance, and contractor's all-risk coverage appropriate to the nature and value of the work we perform. Certificates of insurance are available on request and are routinely provided as part of our vendor registration and tender documentation."
  },
  {
    q: "How do we start working with Touch Teq?",
    a: "The easiest way to start is to contact us directly by phone or email, or to submit a request through the contact form on our website. Tell us about your facility, the service you need, and any relevant project details. A qualified engineer will review your inquiry and get back to you to discuss the scope, the approach, and the next steps. There is no obligation, and we are happy to have an initial conversation to understand whether we are the right fit for your requirements."
  },
  {
    q: "What industries do you specialise in?",
    a: "We work across a range of high-risk industrial sectors, including oil and gas refining, chemical and petrochemical processing, mining and minerals processing, fuel storage and distribution, power generation, pharmaceutical manufacturing, food and beverage processing, and water and wastewater treatment. Our core engineering disciplines, fire and gas detection, control and instrumentation, electrical engineering, and hazardous area classification, apply across all of these sectors."
  }
];

export default function AboutPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <main className="bg-white min-h-screen font-sans">
      <Header />
      
      {/* Hero Section */}
      <section className="relative pt-32 pb-24 md:pt-48 md:pb-32 bg-[#1A2B4C] overflow-hidden">
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(#ff6900 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
        </div>

        <div className="container mx-auto px-4 md:px-8 relative z-10">
          <nav className="flex items-center space-x-2 text-slate-400 text-[10px] font-black uppercase tracking-widest mb-8">
            <Link href="/" className="hover:text-orange-500 transition-colors">Home</Link>
            <ChevronRight size={12} />
            <span className="text-white">About Us</span>
          </nav>

          <div className="max-w-4xl">
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: [0.215, 0.61, 0.355, 1] }}
              className="text-4xl md:text-7xl font-black text-white uppercase tracking-tight mb-8 leading-none"
            >
              Specialist Engineering for <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF6900] to-orange-300">Safety-Critical Industrial Environments</span> <br />
              <span className="text-2xl md:text-4xl block mt-4 text-white/90 tracking-normal">Across Southern Africa</span>
            </motion.h1>
            
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.8 }}
              className="text-slate-300 text-lg md:text-xl max-w-2xl leading-relaxed mb-10 font-medium"
            >
              Touch Teq Engineering is a focused industrial engineering firm that delivers fire and gas detection, control and instrumentation, electrical engineering, and hazardous area classification services for high-risk facilities across Southern Africa. We are built on technical depth, professional accountability, and a straightforward commitment to doing the work properly.
            </motion.p>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4, duration: 0.8 }}
              className="flex flex-col sm:flex-row gap-6"
            >
              <Link href="/contact" className="group flex items-stretch bg-orange-500 hover:bg-orange-600 transition-all rounded-md overflow-hidden shadow-xl shadow-orange-500/20 max-w-full sm:w-auto">
                <span className="px-6 md:px-8 py-3 flex items-center text-white font-black text-[11px] md:text-sm uppercase tracking-widest text-left">
                  Discuss Your Requirements
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

      {/* Section 1: Who We Are */}
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
              <span className="text-orange-500 font-black text-xs uppercase tracking-[0.4em]">Who We Are</span>
              <div className="w-8 h-px bg-orange-500"></div>
            </motion.div>
            
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-[#1A2B4C] text-3xl md:text-5xl font-black uppercase tracking-normal mb-8 leading-tight"
            >
              A Specialist Engineering Firm, Not a General Contractor
            </motion.h2>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="space-y-6 text-slate-600 text-lg leading-relaxed font-medium text-left"
            >
              <p>
                Touch Teq Engineering was established to address a specific problem in the Southern African industrial market. Too many facilities were struggling to find engineering partners who genuinely understood the technical and regulatory demands of high-risk environments. General electrical contractors could pull cables, but they could not design a fire and gas detection layout or carry out a hazardous area classification. Large multinational consultancies could produce engineering documents, but they often lacked the practical site experience to ensure those designs translated into installations that actually worked.
              </p>
              <p>
                We set out to bridge that gap. Touch Teq is a specialist engineering firm that works exclusively in industrial environments. Refineries, chemical plants, mines, fuel storage facilities, power stations, and processing operations. We do not take on residential projects. We do not do commercial fit-outs. Every project we deliver, every engineer we employ, and every capability we develop is focused on the systems that protect people and keep industrial operations running safely.
              </p>
              <p>
                Our scope covers three core technical disciplines: fire and gas detection, control and instrumentation, and industrial electrical engineering. Within those disciplines, we provide the full range of services from front-end design and hazardous area classification through to equipment procurement, installation, commissioning, and ongoing maintenance. This means our clients deal with one engineering team that understands the entire lifecycle of the systems they depend on, not a fragmented chain of subcontractors passing responsibility from one to the next.
              </p>
              <p>
                We are not the largest engineering company in the region, and we have no interest in trying to be. What we are is technically deep, operationally focused, and directly accountable for the quality of every piece of work that carries our name.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Section 2: What We Stand For */}
      <section className="py-24 bg-slate-50">
        <div className="container mx-auto px-4 md:px-8">
          <div className="text-center mb-16">
            <motion.span
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-orange-500 font-black text-xs uppercase tracking-[0.4em] block mb-4"
            >
              Our Principles
            </motion.span>
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-[#1A2B4C] text-3xl md:text-5xl font-black uppercase tracking-normal mb-8"
            >
              The Standards We Hold Ourselves To
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="max-w-3xl mx-auto text-slate-600 text-lg leading-relaxed font-medium mb-12"
            >
              We are cautious about listing &quot;core values&quot; because too many companies treat them as wall decorations rather than working commitments. What follows is not a set of aspirational slogans. These are the principles that govern how we operate, how we make engineering decisions, and how we conduct ourselves on our clients&apos; sites.
            </motion.p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {principles.map((principle, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="p-8 bg-white rounded-2xl border border-slate-100 hover:border-orange-500/30 hover:shadow-xl transition-all"
              >
                <div className="w-10 h-10 bg-orange-100 text-orange-500 rounded-lg flex items-center justify-center font-black text-lg mb-6">
                  {index + 1}
                </div>
                <h4 className="text-[#1A2B4C] font-black text-lg uppercase tracking-normal mb-4">{principle.title}</h4>
                <p className="text-slate-500 text-sm leading-relaxed">{principle.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Section 3: Our Technical Focus */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-4 md:px-8">
          <div className="max-w-4xl mx-auto text-center mb-16">
            <motion.span
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-orange-500 font-black text-xs uppercase tracking-[0.4em] block mb-4"
            >
              What We Do
            </motion.span>
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-[#1A2B4C] text-3xl md:text-5xl font-black uppercase tracking-normal mb-8"
            >
              Three Core Disciplines Delivered Under One Roof
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="text-slate-600 text-lg leading-relaxed font-medium"
            >
              Our engineering capability is built around three technical disciplines that sit at the heart of industrial safety and operational control. By delivering all three from within a single team, we eliminate the coordination problems and interface gaps that commonly arise when separate firms work on different parts of the same project.
            </motion.p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {disciplines.map((discipline, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="p-8 bg-slate-50 rounded-2xl border border-slate-100 hover:border-orange-500/30 hover:shadow-xl transition-all"
              >
                <div className="w-14 h-14 bg-[#1A2B4C] text-white rounded-xl flex items-center justify-center mb-6">
                  <discipline.icon size={28} />
                </div>
                <h4 className="text-[#1A2B4C] font-black text-lg uppercase tracking-normal mb-4">{discipline.title}</h4>
                <p className="text-slate-500 text-sm leading-relaxed mb-6">{discipline.description}</p>
                <ul className="space-y-2">
                  {discipline.items.map((item, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <CheckCircle2 size={14} className="text-orange-500 mt-0.5 shrink-0" />
                      <span className="text-slate-600 text-xs">{item}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>

          <div className="mt-16 p-8 bg-slate-50 border border-slate-100 rounded-2xl max-w-4xl mx-auto">
            <h4 className="text-[#1A2B4C] font-black text-xl uppercase tracking-normal mb-4">Supporting Capability: Hazardous Area Classification</h4>
            <p className="text-slate-600 text-lg leading-relaxed font-medium">
              Underpinning all three disciplines is our hazardous area classification service. We carry out HAC studies that define where explosive atmospheres may exist within a facility, determine the zone classification, and establish the equipment protection requirements for each area. The classification directly informs the equipment selection, the installation methods, and the maintenance procedures for everything we design and install.
            </p>
          </div>

          <div className="text-center mt-12">
            <Link href="/#services" className="group flex items-stretch bg-orange-500 hover:bg-orange-600 transition-all rounded-md overflow-hidden shadow-xl shadow-orange-500/20 max-w-full sm:w-auto inline-flex">
              <span className="px-6 md:px-8 py-3 flex items-center text-white font-black text-[11px] md:text-sm uppercase tracking-widest text-left">
                View Our Full Range of Services
              </span>
              <div className="bg-[#1A2B4C] px-5 flex items-center justify-center group-hover:bg-black transition-colors shrink-0">
                <ArrowRight className="text-white w-4 h-4 -rotate-45 group-hover:rotate-0 group-hover:text-orange-500 transition-all duration-300" />
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* Section 4: Our Approach */}
      <section className="py-24 bg-slate-50">
        <div className="container mx-auto px-4 md:px-8">
          <div className="text-center mb-16">
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
              className="text-[#1A2B4C] text-3xl md:text-5xl font-black uppercase tracking-normal"
            >
              Engineering That is Structured, <br />Practical, and Accountable
            </motion.h2>
          </div>

          <div className="max-w-4xl mx-auto">
            {approachSteps.map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ x: 15 }}
                className="flex gap-6 pb-12 last:pb-0 cursor-pointer"
              >
                <div className="shrink-0">
                  <div className="w-12 h-12 bg-orange-500 text-white rounded-full flex items-center justify-center font-black text-lg">
                    {index + 1}
                  </div>
                </div>
                <div className="pt-2">
                  <h4 className="text-[#1A2B4C] font-black text-lg uppercase tracking-normal mb-2">{step.title}</h4>
                  <p className="text-slate-500 text-sm leading-relaxed">{step.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Section 5: Credentials */}
      <section className="py-24 bg-[#1A2B4C] text-white">
        <div className="container mx-auto px-4 md:px-8">
          <div className="text-center mb-16">
            <motion.span
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-orange-500 font-black text-xs uppercase tracking-[0.4em] block mb-4"
            >
              Credentials
            </motion.span>
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-3xl md:text-5xl font-black uppercase tracking-tight"
            >
              Registered, Qualified, and Accountable
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="max-w-4xl mx-auto text-slate-300 text-lg leading-relaxed font-medium mt-8"
            >
              Professional registration is not a marketing badge. It is a legal and ethical commitment that underpins the credibility of every engineering deliverable we produce. When a registered professional signs off on a design, a classification, or a commissioning record, they are taking personal responsibility for the technical content and its compliance with the applicable standards.
              <br /><br />
              At Touch Teq Engineering, our work is overseen by professionals registered with the Engineering Council of South Africa (ECSA). This registration is a requirement under the Engineering Profession Act and provides our clients with the assurance that their engineering is being conducted by individuals who meet the qualifications, competence, and ethical standards defined by the profession.
            </motion.p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {credentials.map((cred, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="group p-6 bg-white/5 border border-white/10 rounded-xl hover:border-orange-500/50 hover:bg-white/10 hover:shadow-2xl hover:shadow-orange-500/10 transition-all duration-300"
              >
                <div className="flex items-center gap-3 mb-3">
                  <Award className="text-orange-500 group-hover:scale-110 transition-transform duration-300" size={24} />
                  <h4 className="text-white font-black text-sm uppercase tracking-tight">{cred.title}</h4>
                </div>
                <p className="text-slate-400 text-sm leading-relaxed group-hover:text-slate-300 transition-colors">{cred.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Section 6: The Team */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-4 md:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <motion.span
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-orange-500 font-black text-xs uppercase tracking-[0.4em] block mb-4"
            >
              Our People
            </motion.span>
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-[#1A2B4C] text-3xl md:text-5xl font-black uppercase tracking-tight mb-8"
            >
              Engineers With Industrial Experience, Not Just Qualifications
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="text-slate-600 text-lg leading-relaxed font-medium"
            >
              The strength of any engineering firm is its people. At Touch Teq, our team is made up of engineers and technicians who have built their careers in industrial environments. They have worked inside refineries during turnarounds. They have commissioned fire and gas systems in chemical plants. They have traced undocumented wiring in processing plants that are decades old. They have carried out hazardous area classifications at fuel depots, mines, and power stations across the region.
              <br /><br />
              This is not a team that learned industrial engineering from a textbook and then started a company. It is a team that has accumulated its knowledge through years of hands-on project delivery in the types of facilities we serve. That practical experience shows up in the quality of our designs, the efficiency of our installations, and the reliability of the systems we hand over.
              <br /><br />
              We invest in our team&apos;s ongoing development. Our engineers maintain their professional registrations, stay current with changes to the standards they work to, and continuously build their competence through project exposure and formal training. When a client engages Touch Teq, they are engaging a team that is technically current and operationally capable.
            </motion.p>
          </div>
        </div>
      </section>

      {/* Section 6b: Leadership */}
      <section className="py-8 bg-slate-50">
        <div className="container mx-auto px-4 md:px-8">
          <div className="w-full bg-white rounded-3xl overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-2">
              {/* Image Side */}
              <div className="relative bg-[#1A2B4C] min-h-[350px] lg:min-h-[600px]">
                {/* Full background image */}
                <Image
                  src="/thiba_image.jpeg"
                  alt="Thabo Matona - Founder & Principal Engineer"
                  fill
                  className="object-cover"
                  priority
                />
                {/* Overlay gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#1A2B4C]/80 via-transparent to-[#1A2B4C]/30"></div>
                {/* Name and title overlay at bottom */}
                <div className="absolute bottom-0 left-0 right-0 p-8 md:p-12 text-center">
                  <h4 className="text-white font-black text-2xl md:text-3xl uppercase tracking-tight drop-shadow-lg">Thabo Matona</h4>
                  <p className="text-orange-500 text-sm md:text-base font-black uppercase tracking-[0.2em] mt-3">Founder & Principal Engineer</p>
                  <p className="text-white/80 text-xs md:text-sm font-medium mt-2">Control & Instrumentation | Fire & Gas Detection</p>
                </div>
              </div>

              {/* Content Side */}
              <div className="p-8 md:p-12 lg:p-16 xl:p-20 flex flex-col justify-center">
                <span className="text-orange-500 font-black text-xs uppercase tracking-[0.3em] block mb-4">Leadership</span>
                <h3 className="text-[#1A2B4C] text-2xl md:text-3xl lg:text-4xl font-black uppercase tracking-tight mb-6 leading-tight">
                  Two Decades of <span className="text-orange-500">Field-Proven</span> Engineering
                </h3>
                <div className="space-y-5 text-slate-600 text-base md:text-lg leading-[1.8] font-medium">
                  <p>
                    Thabo Matona founded Touch Teqniques Engineering Services with a clear mandate — to deliver specialist fire and gas detection and control & instrumentation engineering without the layers of subcontracting that compromise accountability and quality.
                  </p>
                  <p>
                    With over 20 years of hands-on experience across refineries, chemical processing plants, mining operations, fuel storage facilities, and power generation plants, Thabo brings deep practical knowledge to every project he leads. He has personally designed, commissioned, and handed over fire and gas systems in some of Southern Africa&apos;s most demanding and safety-critical industrial environments.
                  </p>
                  <p>
                    Thabo holds professional registrations in line with South African engineering standards and maintains active competency across IEC 61511 functional safety, hazardous area classification, and OEM-approved detection technologies.
                  </p>
                  <div className="mt-6 pl-5 py-5 border-l-4 border-orange-500">
                    <p className="text-[#1A2B4C] font-black text-base md:text-lg leading-relaxed">
                      At Touch Teq, he is not a director who manages from a distance. He is the engineer on your project.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 7: Regional Presence */}
      <section className="py-24 bg-slate-50">
        <div className="container mx-auto px-4 md:px-8">
          <div className="text-center mb-16">
            <motion.span
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-orange-500 font-black text-xs uppercase tracking-[0.4em] block mb-4"
            >
              Where We Operate
            </motion.span>
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-[#1A2B4C] text-3xl md:text-5xl font-black uppercase tracking-tight mb-8"
            >
              Headquartered in South Africa, <br />Working Across the Region
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="max-w-4xl mx-auto text-slate-600 text-lg leading-relaxed font-medium mb-12"
            >
              Touch Teq Engineering is headquartered in [City, South Africa], strategically located to serve the major industrial corridors in Gauteng, Mpumalanga, and KwaZulu-Natal. Our project footprint, however, extends well beyond our home base. 
              <br /><br />
              We have delivered engineering, installation, and maintenance services at industrial facilities across Southern Africa, including cross-border projects in Mozambique, Botswana, Namibia, and Zimbabwe. We manage the logistics, permits, regulatory requirements, and site access protocols involved in working across borders as a standard part of our project delivery. Our regional clients receive the same engineering standard, the same documentation quality, and the same level of direct accountability as our South African clients.
            </motion.p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {regions.map((region, index) => (
              <motion.div
                key={region.country}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="p-6 bg-white rounded-xl border border-slate-100 hover:border-orange-500/30 hover:shadow-xl transition-all"
              >
                <div className="flex items-center gap-3 mb-3">
                  <Globe className="text-orange-500" size={20} />
                  <h4 className="text-[#1A2B4C] font-black text-lg uppercase tracking-tight">{region.country}</h4>
                </div>
                <p className="text-slate-500 text-sm">{region.areas}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Section 8: Safety Culture */}
      <section className="py-24 bg-[#1A2B4C] text-white">
        <div className="container mx-auto px-4 md:px-8">
          <div className="max-w-4xl mx-auto text-center mb-16">
            <motion.span
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-orange-500 font-black text-xs uppercase tracking-[0.4em] block mb-4"
            >
              Safety Commitment
            </motion.span>
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-3xl md:text-5xl font-black uppercase tracking-tight mb-8"
            >
              Safety is Not a Department. It is How We Operate.
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="text-slate-300 text-lg leading-relaxed font-medium"
            >
              For a company that designs and installs life-safety systems, the way we conduct our own operations must reflect the same standard we deliver to our clients.
            </motion.p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
            {[
              { title: "Pre-Task Planning", desc: "Every work activity on a client site is preceded by a documented risk assessment and a task-specific method statement. Our teams review the scope, the hazards, the control measures, and the emergency procedures before any work begins. This is not a formality. It is how we prevent incidents." },
              { title: "Permit-to-Work Compliance", desc: "We work within our clients' permit-to-work systems and ensure that every team member understands the requirements of the permits under which they are operating. This includes hot work permits, isolation permits, confined space entry permits, and working-at-height permits." },
              { title: "Competence and Training", desc: "Every member of our site team holds the necessary safety training and competence certificates for the work they perform. This includes, as applicable, working at heights certification, confined space entry training, first aid, fire fighting, and site-specific induction requirements." },
              { title: "Incident Reporting and Learning", desc: "We maintain a zero-tolerance approach to unreported incidents, near-misses, and unsafe conditions. Every event is documented, investigated, and used as a learning opportunity to improve our procedures and prevent recurrence." },
              { title: "PPE and Equipment Standards", desc: "Our teams are equipped with the correct personal protective equipment for every site and every task. Tools and test equipment are maintained, calibrated, and inspected regularly. There are no exceptions." }
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="group p-6 bg-white/5 border border-white/10 rounded-xl hover:border-orange-500/50 hover:bg-white/10 hover:shadow-2xl hover:shadow-orange-500/10 transition-all duration-300"
              >
                <div className="w-12 h-12 bg-white/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-orange-500 transition-colors duration-300">
                  <ShieldCheck className="text-orange-500 group-hover:text-white transition-colors duration-300" size={24} />
                </div>
                <h4 className="text-white font-black text-sm uppercase tracking-tight mb-2">{item.title}</h4>
                <p className="text-slate-400 text-xs leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Section 9: Industries We Serve */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-4 md:px-8">
          <div className="max-w-4xl mx-auto text-center mb-12">
            <motion.span
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-orange-500 font-black text-xs uppercase tracking-[0.4em] block mb-4"
            >
              Our Clients
            </motion.span>
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-[#1A2B4C] text-3xl md:text-5xl font-black uppercase tracking-tight mb-8"
            >
              Trusted by Clients Across Southern Africa&apos;s Most Demanding Industrial Sectors
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="max-w-4xl mx-auto text-slate-600 text-lg leading-relaxed font-medium mb-12"
            >
              We serve clients in industries where safety, compliance, and system reliability are fundamental to operations. Our experience spans the following sectors:
            </motion.p>
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

          <div className="text-center mt-12">
            <Link href="/industries" className="group flex items-stretch bg-orange-500 hover:bg-orange-600 transition-all rounded-md overflow-hidden shadow-xl shadow-orange-500/20 max-w-full sm:w-auto inline-flex">
              <span className="px-6 md:px-8 py-3 flex items-center text-white font-black text-[11px] md:text-sm uppercase tracking-widest text-left">
                View Detailed Industry Information
              </span>
              <div className="bg-[#1A2B4C] px-5 flex items-center justify-center group-hover:bg-black transition-colors shrink-0">
                <ArrowRight className="text-white w-4 h-4 -rotate-45 group-hover:rotate-0 group-hover:text-orange-500 transition-all duration-300" />
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* Section 10: Why Choose Touch Teq */}
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
              className="text-[#1A2B4C] text-3xl md:text-5xl font-black uppercase tracking-tight"
            >
              What Sets Us Apart
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
                <h4 className="text-[#1A2B4C] font-black text-lg uppercase tracking-tight mb-4">{advantage.title}</h4>
                <p className="text-slate-500 text-sm leading-relaxed">{advantage.description}</p>
              </motion.div>
            ))}
            
            {/* CTA Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.5 }}
              className="p-8 bg-orange-500 rounded-2xl lg:col-span-2 hover:bg-[#E55E00] hover:shadow-2xl hover:shadow-orange-500/20 transition-all duration-300"
            >
              <span className="text-white/80 font-black text-[10px] uppercase tracking-[0.3em] block mb-4">WORK WITH US</span>
              <h4 className="text-white font-black text-xl md:text-2xl uppercase tracking-tight mb-4 leading-tight">
                YOUR ENGINEER IS ONE CALL AWAY.
              </h4>
              <p className="text-white/90 text-sm leading-relaxed mb-6 max-w-lg">
                Not a sales rep. Not a call centre. The engineer who will run your project picks up the phone. Start the conversation today.
              </p>
              <Link 
                href="/contact"
                className="group flex items-stretch bg-white hover:bg-slate-100 transition-all rounded-md overflow-hidden shadow-xl max-w-full w-fit"
              >
                <span className="px-6 md:px-8 py-4 flex items-center text-[#0A1120] group-hover:text-orange-500 font-black text-[11px] md:text-sm uppercase tracking-widest text-left transition-colors">
                  CONTACT THABO DIRECTLY
                </span>
                <div className="bg-[#1A2B4C] px-4 md:px-5 flex items-center justify-center group-hover:bg-orange-500 transition-colors shrink-0">
                  <ArrowRight className="text-white w-4 h-4 -rotate-45 group-hover:rotate-0 transition-all duration-300" />
                </div>
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Section 11: FAQ */}
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
                className="text-[#1A2B4C] text-3xl md:text-5xl font-black uppercase tracking-tight"
              >
                Common Questions About <br />Touch Teq Engineering
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
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>


      {/* Section 12: CTA */}
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
              className="text-5xl md:text-7xl font-black text-white uppercase tracking-tight leading-[0.85] mb-10"
            >
              Partner With An Engineering <br /> <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF6900] to-orange-300">Team You Can Trust</span>
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-slate-400 text-lg md:text-xl max-w-2xl mb-12 font-medium leading-relaxed"
            >
              From conceptual design and hazardous area classification to installation and ongoing maintenance, our team delivers industrial engineering with technical rigour and direct accountability.
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
