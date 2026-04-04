'use client';

import { motion } from 'motion/react';
import {
  Flame, Factory, Pickaxe, Fuel, Zap, Settings, Pill,
  Wheat, Droplets, Network, ChevronRight, ArrowRight,
  CheckCircle2, Globe, ShieldCheck, Phone,
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import BackToTop from '@/components/BackToTop';
import BreadcrumbJsonLd from '@/components/seo/BreadcrumbJsonLd';
import FAQJsonLd from '@/components/seo/FAQJsonLd';
import OrganizationJsonLd from '@/components/seo/OrganizationJsonLd';
import IndustriesFaqAccordion from '@/components/IndustriesFaqAccordion';

const industries = [
  {
    id: "oil-gas",
    icon: Flame,
    title: "Oil and Gas Refineries",
    image: "/large_oil_refinery.png",
    body: "Refineries are among the most complex and hazardous industrial facilities in operation. The combination of high temperatures, high pressures, flammable hydrocarbons, toxic gases such as hydrogen sulphide, and continuous processing creates an environment where every engineering decision carries weight.",
    whatWeDeliver: [
      "Fire and gas detection system design, installation, commissioning, and maintenance",
      "Hazardous area classification (HAC) studies and equipment gap analysis",
      "Control and instrumentation engineering, including loop design, cause and effect development, and SIS verification",
      "Electrical engineering for classified and unclassified areas, including MCC design, cable engineering, and protection studies",
      "Turnaround and shutdown engineering support",
      "As-built documentation and legacy system upgrades",
      "Third-party compliance audits and design reviews"
    ],
    standards: ["IEC 61511", "IEC 60079-10-1", "IEC 60079-14", "SANS 10108", "SANS 10089", "API RP 14C", "API RP 505", "SANS 10400"]
  },
  {
    id: "chemical-petrochemical",
    icon: Factory,
    title: "Chemical and Petrochemical Processing",
    image: "/Chemical_plant_reactors_and_pipes.jpeg",
    body: "Chemical and petrochemical plants handle a wide range of substances, many of which are flammable, toxic, corrosive, or reactive. The diversity of chemicals processed, often within a single facility, creates a complex hazard profile that demands precise engineering and thorough documentation.",
    whatWeDeliver: [
      "Fire and gas detection for flammable, toxic, and oxygen-deficient atmospheres",
      "Hazardous area classification studies covering both gas and dust hazards",
      "Control and instrumentation design for batch reactors, continuous processes, and utility systems",
      "Electrical design for hazardous areas, including ATEX and IECEx equipment specification",
      "Cause and effect matrix development for ESD and process safety systems",
      "Equipment gap analysis and remediation planning",
      "Ongoing maintenance and periodic safety system testing"
    ],
    standards: ["IEC 61511", "IEC 61508", "IEC 60079-10-1", "IEC 60079-10-2", "IEC 60079-14", "SANS 10108", "EN 60079 series"]
  },
  {
    id: "mining",
    icon: Pickaxe,
    title: "Mining and Minerals Processing",
    image: "/Mining_and_Minerals Processing.jpeg",
    body: "Mining operations present a unique combination of engineering challenges. Surface processing plants, underground development, conveyor systems, crushing and screening circuits, smelters, and tailings facilities each have their own hazard profiles, regulatory requirements, and operational demands.",
    whatWeDeliver: [
      "Fire and gas detection for surface plants and underground operations",
      "Methane, CO, and NO2 monitoring system design and installation",
      "Hazardous area classification for coal handling, mineral processing, and chemical storage areas",
      "Electrical engineering for processing plants, conveyor systems, and substations",
      "Control and instrumentation for crushing, screening, flotation, and leaching circuits",
      "Belt fire detection and conveyor protection systems",
      "Cross-border project delivery, including logistics, permits, and in-country compliance"
    ],
    standards: ["IEC 60079-10-1", "IEC 60079-10-2", "IEC 60079-14", "SANS 10108", "Mine Health and Safety Act (MHSA)", "SANS 10142", "DMR regulations"]
  },
  {
    id: "fuel-storage",
    icon: Fuel,
    title: "Fuel Storage and Distribution",
    image: "/fuel_storage_tanks.png",
    body: "Bulk fuel depots, tank farms, pipeline terminals, aviation fuel facilities, LPG storage and filling plants, and retail fuel distribution centres all handle large volumes of highly flammable products. The fire and explosion risk at these facilities is significant.",
    whatWeDeliver: [
      "Fire and gas detection system design, installation, and maintenance for tank farms and depots",
      "Hazardous area classification for fuel storage, dispensing, and loading facilities",
      "LPG facility detection and electrical design",
      "Aviation fuel facility fire and gas detection",
      "Electrical design for classified areas, including cable engineering, earthing, and lightning protection",
      "Tank gauging and level instrumentation",
      "Compliance audits and periodic system reviews"
    ],
    standards: ["SANS 10089", "SANS 10108", "IEC 60079-10-1", "IEC 60079-14", "API 2510", "SANS 10087 (LPG)"]
  },
  {
    id: "power-generation",
    icon: Zap,
    title: "Power Generation and Utilities",
    image: "/High_voltage_electrical.png",
    body: "Power generation plants, whether gas-fired, coal-fired, or operating on liquid fuels, contain multiple areas where flammable gases, combustible dusts, and high-energy electrical systems create significant hazards.",
    whatWeDeliver: [
      "Fire and gas detection for gas turbine enclosures, fuel gas systems, and hydrogen cooling areas",
      "Hazardous area classification for fuel handling, gas metering, and storage areas",
      "Combustible dust detection and classification for coal handling and milling facilities",
      "Electrical engineering for balance-of-plant systems, including MCC design, cable engineering, and protection coordination",
      "Control and instrumentation for boiler systems, turbine auxiliaries, and water treatment plants",
      "Integration with existing SCADA and DCS platforms"
    ],
    standards: ["IEC 61511", "IEC 60079-10-1", "IEC 60079-14", "SANS 10108", "SANS 10142", "SANS 10400", "NFPA 850 (where US-standard compliance is required)"]
  },
  {
    id: "manufacturing",
    icon: Settings,
    title: "Manufacturing and Heavy Industry",
    image: "/Large_heavy_manufact.png",
    body: "Large-scale manufacturing facilities, including steel mills, aluminium smelters, cement plants, glass production, automotive manufacturing, and general heavy industry, rely on robust electrical infrastructure and properly maintained safety systems.",
    whatWeDeliver: [
      "Electrical distribution design, installation, and maintenance",
      "Control and instrumentation for production lines, furnaces, kilns, and utility systems",
      "Fire and gas detection for areas with flammable gas or combustible dust risks",
      "Hazardous area classification for gas supply areas, paint shops, solvent storage, and dust-generating processes",
      "Motor control centre (MCC) design and specification",
      "Legacy system upgrades and documentation recovery"
    ],
    standards: ["SANS 10142", "SANS 10108", "IEC 60079-10-1", "IEC 60079-10-2", "IEC 60079-14", "NFPA 652"]
  },
  {
    id: "pharmaceutical",
    icon: Pill,
    title: "Pharmaceutical Manufacturing",
    image: "/Clean_sterile_pharma.png",
    body: "Pharmaceutical manufacturing facilities operate under strict regulatory control, and the engineering systems within them must meet both safety and quality standards. Many processes involve flammable solvents and combustible dusts.",
    whatWeDeliver: [
      "Hazardous area classification for solvent handling, milling, and powder processing areas",
      "Fire and gas detection for flammable solvent vapours and combustible pharmaceutical dusts",
      "Electrical design for classified and clean environments",
      "Equipment specification for Ex-rated instruments and devices in pharmaceutical settings",
      "Control and instrumentation for process monitoring and batch control",
      "Compliance documentation and audit support"
    ],
    standards: ["IEC 60079-10-1", "IEC 60079-10-2", "IEC 60079-14", "SANS 10108", "NFPA 652", "GMP facility requirements"]
  },
  {
    id: "food-beverage",
    icon: Wheat,
    title: "Food and Beverage Processing",
    image: "/Modern_food_and_beve.png",
    body: "Food and beverage processing facilities are not always recognised as hazardous environments, but many contain serious explosion risks. Grain silos, flour mills, sugar refineries, and breweries all generate combustible dusts or flammable vapours.",
    whatWeDeliver: [
      "Hazardous area classification for combustible dust environments",
      "Fire and gas detection for dust explosion risk areas and flammable vapour zones",
      "Spark detection and suppression system integration for conveyor and duct systems",
      "Electrical design for classified areas within processing and storage facilities",
      "Ammonia detection for cold storage and refrigeration plant rooms",
      "Compliance audits and documentation for insurers and regulators"
    ],
    standards: ["IEC 60079-10-2", "IEC 60079-14", "SANS 10108", "NFPA 652", "NFPA 61", "EN 60079 series"]
  },
  {
    id: "water-wastewater",
    icon: Droplets,
    title: "Water and Wastewater Treatment",
    image: "/Large_water_treatment.png",
    body: "Water and wastewater treatment facilities are essential infrastructure with hazards that are not immediately obvious. Anaerobic digestion produces methane, chlorine dosing introduces toxic gas risks, and chemical storage areas present additional hazards.",
    whatWeDeliver: [
      "Methane and biogas detection for digester and sludge handling areas",
      "Chlorine and toxic gas detection for dosing rooms and chemical storage",
      "Hazardous area classification for biogas generation, storage, and flare systems",
      "Control and instrumentation for treatment processes and pump stations",
      "Electrical design for pump stations, chemical dosing facilities, and control rooms",
      "SCADA integration and remote monitoring system design"
    ],
    standards: ["IEC 60079-10-1", "IEC 60079-14", "SANS 10108", "SANS 10142", "Water Services Act requirements"]
  },
  {
    id: "oil-gas-production",
    icon: Network,
    title: "Oil and Gas Production and Pipeline Infrastructure",
    image: "/Long_oil_and_gas_pipeline.png",
    body: "Upstream oil and gas production facilities, pipeline networks, compressor stations, metering stations, and gas processing plants operate in environments where flammable and toxic gases are present as a fundamental part of the process.",
    whatWeDeliver: [
      "Fire and gas detection for wellheads, process facilities, compressor stations, and pipeline infrastructure",
      "Hazardous area classification for production, processing, and metering facilities",
      "Control and instrumentation for process monitoring, safety shutdown, and SCADA integration",
      "Electrical design for remote and hazardous area installations",
      "Telemetry and remote monitoring system architecture",
      "Custody transfer metering instrumentation"
    ],
    standards: ["IEC 61511", "IEC 60079-10-1", "IEC 60079-14", "SANS 10108", "API RP 14C", "API RP 505", "API 2510"]
  }
];

const challenges = [
  {
    title: "Outdated or Missing Hazardous Area Classification",
    description: "Many facilities were built decades ago and have undergone multiple modifications without the hazardous area classification being updated. We carry out new classification studies and review existing ones to bring them into alignment with current standards."
  },
  {
    title: "Fire and Gas Detection Systems That Have Not Kept Pace With Plant Changes",
    description: "Detection systems designed for the original plant layout may no longer provide adequate coverage after expansions. We assess existing detection coverage, identify gaps, and design additional detection to restore required protection."
  },
  {
    title: "Incomplete or Inaccurate Plant Documentation",
    description: "P&IDs that do not match what is installed. Loop drawings that were never updated. We recover, verify, and update plant documentation through site walkdowns and systematic record correction."
  },
  {
    title: "Non-Compliant Equipment in Classified Hazardous Areas",
    description: "Equipment that does not carry the correct explosion protection rating is an ignition source. We conduct equipment gap analyses and provide prioritised remediation plans."
  },
  {
    title: "Aging Systems Approaching End of Life",
    description: "Safety-critical systems have finite service lives. We help clients plan and execute system upgrades with minimal disruption to operations."
  },
  {
    title: "Pressure to Demonstrate Compliance to Multiple Stakeholders",
    description: "We produce engineering documentation and compliance records that satisfy plant managers, HSE teams, insurers, regulators, and corporate governance bodies simultaneously."
  }
];

const advantages = [
  {
    title: "Exclusive Industrial Focus",
    description: "We do not divide our attention between residential, commercial, and industrial projects. Every engineer on our team works in high-risk industrial environments every day."
  },
  {
    title: "We Cover the Full Technical Scope",
    description: "Fire and gas detection, control and instrumentation, electrical engineering, hazardous area classification, design, installation, commissioning, and maintenance under one roof."
  },
  {
    title: "Compliance Is Built In, Not Bolted On",
    description: "Our engineering process ensures every deliverable meets applicable standards, regulations, and client specifications from the start."
  },
  {
    title: "We Understand Your Procurement and Safety Requirements",
    description: "We know what your procurement team needs in a tender submission, what your HSE department expects in a safety file, and what your operations manager requires in a handover package."
  },
  {
    title: "Engineers Who Take Ownership",
    description: "Every project is led by a qualified engineer who is personally accountable. You always know who is responsible and have direct access to that person."
  },
  {
    title: "Proven Cross-Border Delivery",
    description: "We have a track record of delivering projects outside South Africa, managing logistics, permits, and regulatory requirements seamlessly."
  }
];

const regions = [
  { country: "South Africa", regions: "Secunda, Sasolburg, Richards Bay, Durban, Witwatersrand, Mpumalanga, Limpopo, Western Cape" },
  { country: "Mozambique", regions: "Maputo, Matola, Gas processing and LNG infrastructure" },
  { country: "Botswana", regions: "Selebi-Phikwe, Francistown, Jwaneng, Greater Gaborone" },
  { country: "Namibia", regions: "Erongo, Otjozondjupa, Windhoek, Walvis Bay" },
  { country: "Zimbabwe", regions: "Harare, Bulawayo, and surrounding industrial areas" }
];

const faqs = [
  {
    q: "Do you only work with large refineries and petrochemical plants?",
    a: "No. While we have significant experience in oil and gas and petrochemicals, we serve clients across a wide range of industrial sectors, including mining, fuel storage, manufacturing, food processing, pharmaceuticals, power generation, and water treatment. The size of the facility does not change the standard of engineering we apply."
  },
  {
    q: "Can you work on our site during a planned shutdown or turnaround?",
    a: "Yes. We regularly support scheduled shutdowns and turnaround windows at refineries, chemical plants, and power stations. We understand the time pressure involved and plan our resources, logistics, and documentation to align with the shutdown programme."
  },
  {
    q: "Do you handle all the logistics for cross-border projects?",
    a: "Yes. When we mobilise to projects outside of South Africa, we manage the full scope of logistics, including travel arrangements, work permit applications, temporary importation of equipment and tools, accommodation, and in-country safety and regulatory compliance."
  },
  {
    q: "How do you handle industries you have not worked in before?",
    a: "Our core competencies apply across all industrial sectors. The underlying engineering principles and applicable standards are consistent. What changes is the process context, specific hazards, and regulatory framework. We invest time to understand the environment before beginning engineering work."
  },
  {
    q: "Can you provide ongoing maintenance after the project is complete?",
    a: "Yes. We provide maintenance and support agreements tailored to each client's requirements, including scheduled preventive maintenance, emergency callout support, periodic system testing, and annual compliance reviews."
  },
  {
    q: "Do you supply and install detection equipment, or only provide engineering services?",
    a: "We do both. Depending on the project, we can provide a full turnkey solution that includes design, equipment procurement, installation, and commissioning. Alternatively, we can provide design-only, procurement support, or installation and commissioning services separately."
  },
  {
    q: "What sets you apart from a general electrical contractor?",
    a: "The difference is depth. Our engineers are specialists in industrial safety and control systems. That is all we do, and it is where our entire knowledge base is concentrated."
  },
  {
    q: "Are your engineers registered with ECSA?",
    a: "Yes. Our engineering work is overseen by professionals registered with the Engineering Council of South Africa, providing assurance that work is conducted by qualified, accountable professionals."
  }
];

export default function IndustriesPage() {
  return (
    <main className="bg-white min-h-screen font-sans">
      <BreadcrumbJsonLd 
        items={[
          { name: 'Home', url: 'https://touchteq.co.za' },
          { name: 'Industries', url: 'https://touchteq.co.za/industries' }
        ]}
      />
      <FAQJsonLd 
        faqs={faqs.map(faq => ({
          question: faq.q,
          answer: faq.a
        }))}
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
            <span className="text-white">Industries</span>
          </nav>

          <div className="max-w-4xl">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-4xl md:text-7xl font-black text-white uppercase tracking-tight mb-8 leading-none"
            >
              Specialist Engineering for <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF6900] to-orange-300">High-Risk Industrial</span> <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF6900] to-orange-300">Sectors</span> <br />
              <span className="text-2xl md:text-4xl block mt-4 text-white/90 tracking-normal">Across Southern Africa</span>
            </motion.h1>
            
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-slate-300 text-lg md:text-xl max-w-2xl leading-relaxed mb-10 font-medium"
            >
              Touch Teq Engineering works exclusively with industrial clients in environments where the consequences of failure are serious. Our engineers have hands-on experience across refining, mining, chemical, power, and manufacturing sectors across South Africa, Botswana, Mozambique, Namibia, and Zimbabwe
            </motion.p>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4, duration: 0.8 }}
              className="flex flex-col sm:flex-row gap-6"
            >
              <Link href="/contact#request-quote" className="group flex items-stretch bg-orange-500 hover:bg-orange-600 transition-all rounded-md overflow-hidden shadow-xl shadow-orange-500/20 max-w-full sm:w-auto">
                <span className="px-6 md:px-8 py-3 flex items-center text-white font-black text-[11px] md:text-sm uppercase tracking-widest text-left">
                  Discuss Your Requirements
                </span>
                <div className="bg-[#1A2B4C] px-5 flex items-center justify-center group-hover:bg-black transition-colors shrink-0">
                  <ArrowRight className="text-white w-4 h-4 -rotate-45 group-hover:rotate-0 group-hover:text-orange-500 transition-all duration-300" />
                </div>
              </Link>
              <Link href="#industries" className="group flex items-stretch bg-white hover:bg-slate-100 transition-all rounded-md overflow-hidden shadow-xl max-w-full sm:w-auto">
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

      {/* Section 1: Industry Overview */}
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
              <span className="text-orange-500 font-black text-xs uppercase tracking-[0.4em]">Who We Work With</span>
              <div className="w-8 h-px bg-orange-500"></div>
            </motion.div>
            
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-[#1A2B4C] text-3xl md:text-5xl font-black uppercase tracking-normal mb-8 leading-tight"
            >
              Engineering Built for Industries Where Safety and Compliance Are Not Optional
            </motion.h2>
            
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="text-slate-600 text-lg leading-relaxed font-medium"
            >
              Not every engineering company is equipped to work inside a refinery turnaround, commission a fire and gas system in a chemical plant, or classify hazardous areas at an underground mine. These environments demand more than general electrical or instrumentation knowledge. They require engineers who understand the specific process hazards, the applicable safety standards, the equipment certification requirements, and the operational pressures that define each industry.
            </motion.p>
          </div>
        </div>
      </section>

      {/* Section 2: Industry Sectors */}
      <section id="industries" className="py-24 bg-slate-50">
        <div className="container mx-auto px-4 md:px-8">
          <div className="text-center mb-16">
            <motion.span
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-orange-500 font-black text-xs uppercase tracking-[0.4em] block mb-4"
            >
              Our Industries
            </motion.span>
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-[#1A2B4C] text-3xl md:text-5xl font-black uppercase tracking-normal"
            >
              The Sectors We Serve <br />
              and the Problems We Solve
            </motion.h2>
          </div>

          <div className="space-y-24">
            {industries.map((industry, index) => (
              <motion.div
                key={industry.id}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className={`flex flex-col ${index % 2 === 1 ? 'lg:flex-row-reverse' : 'lg:flex-row'} gap-12 lg:gap-24 items-start`}
              >
                {/* Content */}
                <div className="flex-1">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-16 h-16 bg-orange-500 rounded-xl flex items-center justify-center">
                      <industry.icon className="text-white" size={32} />
                    </div>
                    <h3 className="text-[#1A2B4C] text-2xl md:text-3xl font-black uppercase tracking-normal">
                      {industry.title}
                    </h3>
                  </div>
                  
                  <p className="text-slate-600 text-lg leading-relaxed mb-8 font-medium">
                    {industry.body}
                  </p>

                  <div className="mb-8">
                    <h4 className="text-[#1A2B4C] font-black text-sm uppercase tracking-wider mb-4">What We Deliver:</h4>
                    <ul className="space-y-3">
                      {industry.whatWeDeliver.map((item, i) => (
                        <li key={i} className="flex items-start gap-3">
                          <CheckCircle2 size={18} className="text-orange-500 mt-0.5 shrink-0" />
                          <span className="text-slate-600 text-sm">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h4 className="text-[#1A2B4C] font-black text-sm uppercase tracking-wider mb-4">Applicable Standards:</h4>
                    <div className="flex flex-wrap gap-2">
                      {industry.standards.map((std, i) => (
                        <span key={i} className="px-3 py-1 bg-slate-100 text-slate-600 text-xs font-bold rounded-full">
                          {std}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Image */}
                <div className="w-full lg:w-[450px] shrink-0">
                  <div className="relative rounded-2xl overflow-hidden shadow-2xl aspect-[3/4]">
                    <Image
                      src={industry.image || `https://picsum.photos/seed/${industry.id}/600/800`}
                      alt={industry.title}
                      fill
                      sizes="(max-width: 1024px) 100vw, 450px"
                      className="object-cover w-full h-full"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#1A2B4C]/60 to-transparent"></div>
                    <div className="absolute bottom-8 left-8 right-8">
                      <div className="bg-orange-500 inline-block px-4 py-2 rounded-full text-white text-[10px] font-black uppercase tracking-widest mb-3">
                        {industry.title}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Section 3: Cross-Border Capability */}
      <section className="py-24 bg-[#1A2B4C] text-white">
        <div className="container mx-auto px-4 md:px-8">
          <div className="max-w-4xl mx-auto text-center mb-16">
            <motion.span
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-orange-500 font-black text-xs uppercase tracking-[0.4em] block mb-4"
            >
              Regional Reach
            </motion.span>
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-3xl md:text-5xl font-black uppercase tracking-normal mb-8"
            >
              Engineering Teams That Mobilise to Where Your Facility Is
            </motion.h2>
            <p className="text-slate-300 text-lg leading-relaxed font-medium">
              A significant proportion of Southern Africa&apos;s industrial infrastructure is located outside major metropolitan areas. We mobilise our engineering teams to client sites across the region, managing logistics, travel, work permits, and in-country regulatory compliance as a standard part of our project delivery.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {regions.map((region, index) => (
              <motion.div
                key={region.country}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="group p-8 bg-white/5 border border-white/10 rounded-2xl hover:border-orange-500/50 hover:bg-white/10 hover:shadow-2xl hover:shadow-orange-500/10 transition-all duration-300"
              >
                <div className="flex items-center gap-3 mb-4">
                  <Globe className="text-orange-500 group-hover:scale-110 transition-transform duration-300" size={24} />
                  <h4 className="text-white font-black text-lg uppercase tracking-normal">{region.country}</h4>
                </div>
                <p className="text-slate-400 text-sm leading-relaxed group-hover:text-slate-300 transition-colors">{region.regions}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Section 4: Common Challenges */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-4 md:px-8">
          <div className="text-center mb-16">
            <motion.span
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-orange-500 font-black text-xs uppercase tracking-[0.4em] block mb-4"
            >
              Common Challenges
            </motion.span>
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-[#1A2B4C] text-3xl md:text-5xl font-black uppercase tracking-normal"
            >
              Problems We See Across Industries
            </motion.h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {challenges.map((challenge, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="p-8 bg-slate-50 rounded-2xl border border-slate-100 hover:border-orange-500/30 hover:shadow-xl transition-all"
              >
                <div className="w-10 h-10 bg-[#1A2B4C] text-white rounded-lg flex items-center justify-center font-black text-sm mb-6">
                  {index + 1}
                </div>
                <h4 className="text-[#1A2B4C] font-black text-lg uppercase tracking-normal mb-4">{challenge.title}</h4>
                <p className="text-slate-500 text-sm leading-relaxed">{challenge.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Section 5: Why Choose Touch Teq */}
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
              An Engineering Partner <br />
              Built for Industrial Environments
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
                  <ShieldCheck size={24} />
                </div>
                <h4 className="text-[#1A2B4C] font-black text-lg uppercase tracking-normal mb-4">{advantage.title}</h4>
                <p className="text-slate-500 text-sm leading-relaxed">{advantage.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Section 6: FAQ */}
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
                Questions We Hear From Clients
              </motion.h2>
            </div>

            <IndustriesFaqAccordion faqs={faqs} />
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
            sizes="100vw"
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
              Operating in One of <br /> <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF6900] to-orange-300">These Industries?</span>
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-slate-400 text-lg md:text-xl max-w-2xl mb-12 font-medium leading-relaxed"
            >
              Whatever your sector, if your facility involves hazardous areas, fire and gas detection, electrical systems, or control and instrumentation, we are equipped to support you.
            </motion.p>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="flex flex-col sm:flex-row gap-6"
            >
              <Link href="/contact#request-quote" className="group flex items-stretch bg-white hover:bg-slate-100 transition-all rounded-md overflow-hidden shadow-xl max-w-full sm:w-auto">
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
