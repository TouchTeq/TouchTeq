'use client';

import { motion } from 'motion/react';
import { ArrowUpRight, CheckCircle2 } from 'lucide-react';
import Image from 'next/image';

const caseStudies = [
  {
    id: 1,
    title: "Petrochemical Refinery Upgrade",
    industry: "Oil & Gas",
    challenge: "Outdated gas detection system causing false alarms and maintenance downtime.",
    solution: "Installed a fully integrated, SIL-2 certified addressable fire & gas network.",
    result: "99.9% uptime, zero false alarms, full SANS compliance.",
    image: "https://picsum.photos/seed/refinery-upgrade/800/600",
  },
  {
    id: 2,
    title: "Deep-Level Mine Conveyor Safety",
    industry: "Mining",
    challenge: "High fire risk on a 2km underground conveyor belt with poor visibility.",
    solution: "Deployed linear heat detection cables paired with automated suppression triggers.",
    result: "Real-time monitoring established, reducing incident response time by 85%.",
    image: "https://picsum.photos/seed/mining-conveyor/800/600",
  },
  {
    id: 3,
    title: "Chemical Plant Ex-Compliance Audit",
    industry: "Manufacturing",
    challenge: "Facility expansion required re-classification of hazardous zones.",
    solution: "Comprehensive area classification study and Ex-equipment specification.",
    result: "Passed all regulatory inspections, saving 20% on equipment costs through precise zoning.",
    image: "https://picsum.photos/seed/chemical-plant/800/600",
  }
];

export default function CaseStudiesSection() {
  return (
    <section id="projects" className="py-24 bg-[#1A2B4C] overflow-hidden">
      <div className="container mx-auto px-4 md:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="flex items-center justify-center space-x-3 mb-4"
          >
            <div className="w-2 h-2 bg-orange-500"></div>
            <span className="text-orange-500 font-black text-xs uppercase tracking-[0.4em]">
              Proven Results
            </span>
            <div className="w-2 h-2 bg-orange-500"></div>
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-3xl md:text-5xl font-black text-white uppercase tracking-normal mb-6"
          >
            Featured <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-orange-300">Case Studies</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-slate-300 text-lg max-w-2xl mx-auto"
          >
            Real-world applications of our engineering expertise across Southern Africa&apos;s most demanding industrial environments.
          </motion.p>
        </div>

        {/* Case Studies Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {caseStudies.map((study, index) => (
            <motion.div
              key={study.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="group bg-white/5 border border-white/10 rounded-2xl overflow-hidden hover:bg-white/10 transition-colors duration-300 flex flex-col h-full"
            >
              {/* Image Container */}
              <div className="relative h-64 w-full overflow-hidden">
                <Image
                  src={study.image}
                  alt={study.title}
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-110"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#1A2B4C] to-transparent opacity-80"></div>
                
                {/* Industry Tag */}
                <div className="absolute top-4 left-4 bg-orange-500 text-white text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full">
                  {study.industry}
                </div>
              </div>

              {/* Content */}
              <div className="p-8 flex flex-col flex-grow relative">
                {/* Decorative Line */}
                <div className="absolute top-0 left-8 right-8 h-px bg-gradient-to-r from-orange-500/50 to-transparent"></div>

                <h3 className="text-xl font-bold text-white mb-6 group-hover:text-orange-400 transition-colors">
                  {study.title}
                </h3>

                <div className="space-y-4 mb-8 flex-grow">
                  <div>
                    <span className="text-orange-500 text-xs font-bold uppercase tracking-wider block mb-1">The Challenge</span>
                    <p className="text-slate-300 text-sm leading-relaxed">{study.challenge}</p>
                  </div>
                  <div>
                    <span className="text-orange-500 text-xs font-bold uppercase tracking-wider block mb-1">Our Solution</span>
                    <p className="text-slate-300 text-sm leading-relaxed">{study.solution}</p>
                  </div>
                </div>

                {/* Result Box */}
                <div className="bg-white/5 rounded-xl p-4 mt-auto border border-white/5 group-hover:border-orange-500/30 transition-colors">
                  <div className="flex items-start space-x-3">
                    <CheckCircle2 size={20} className="text-orange-500 shrink-0 mt-0.5" />
                    <div>
                      <span className="text-white text-xs font-bold uppercase tracking-wider block mb-1">Key Result</span>
                      <p className="text-slate-300 text-sm font-medium">{study.result}</p>
                    </div>
                  </div>
                </div>
                
                {/* Hidden Action Button (Reveals on Hover) */}
                <div className="mt-6 overflow-hidden h-0 group-hover:h-auto opacity-0 group-hover:opacity-100 transition-all duration-300">
                  <button className="flex items-center text-orange-500 text-sm font-bold uppercase tracking-wider hover:text-orange-400 transition-colors">
                    Read Full Study <ArrowUpRight size={16} className="ml-2" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
