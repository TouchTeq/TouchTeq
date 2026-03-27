'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Quote } from 'lucide-react';
import Image from 'next/image';

const testimonials = [
  {
    text: 'Fire and gas detection upgrade delivered with documented cause and effect verification, detector testing, and handover records aligned to plant compliance requirements.',
    author: 'Fuel Storage Terminal Upgrade',
    role: 'Representative project outcome',
    image: '/wcs.jpg',
  },
  {
    text: 'Hazardous area classification scope executed with zone drawings, equipment review, and engineering documentation prepared for audit and project decision-making.',
    author: 'Hazardous Area Classification Study',
    role: 'Representative project outcome',
    image: '/HAC.jpg',
  },
  {
    text: 'Electrical and instrumentation scope coordinated from design through commissioning to reduce interface gaps between engineering, installation, and site testing.',
    author: 'Multi-Discipline Plant Scope',
    role: 'Representative project outcome',
    image: '/qualified-engineer.png',
  },
];

export default function Testimonials() {
  const [current, setCurrent] = useState(0);

  return (
    <section className="py-16 md:py-24 bg-white overflow-hidden">
      <div className="container mx-auto px-4 md:px-8">
        <div className="flex flex-col lg:flex-row items-center gap-10 md:gap-16">
          <div className="lg:w-1/2 relative">
            <div className="absolute -top-6 -left-6 md:-top-12 md:-left-12 w-full h-full bg-[#1A2B4C] -z-10 overflow-hidden">
              <div
                className="absolute inset-0 opacity-20"
                style={{
                  backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 0)`,
                  backgroundSize: '32px 32px',
                }}
              ></div>
              <div
                className="absolute inset-0 opacity-10"
                style={{
                  backgroundImage:
                    'linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)',
                  backgroundSize: '80px 80px',
                }}
              ></div>
            </div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="relative z-10 aspect-[4/3] w-full shadow-2xl"
            >
              <Image
                src="/wcs.jpg"
                alt="Touch Teq project delivery"
                fill
                className="object-cover"
                referrerPolicy="no-referrer"
              />

              <motion.div
                initial={{ opacity: 0, x: 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.4, duration: 0.6 }}
                className="absolute -bottom-4 -right-4 md:-bottom-8 md:-right-8 bg-white p-4 md:p-8 shadow-2xl flex items-center gap-3 md:gap-6 z-20"
              >
                <div className="text-3xl md:text-5xl font-black text-orange-500 leading-none">15+</div>
                <div className="text-orange-500 font-black uppercase text-xs md:text-sm leading-tight tracking-normal">
                  Industrial <br />
                  Projects <br />
                  Delivered
                </div>
              </motion.div>
            </motion.div>
          </div>

          <div className="lg:w-1/2 relative pt-12 lg:pt-0">
            <div className="flex items-center space-x-2 mb-6">
              <div className="w-2 h-2 bg-orange-500"></div>
              <span className="text-orange-500 font-black text-xs uppercase tracking-[0.3em]">
                Project Delivery
              </span>
            </div>

            <div className="relative mb-12">
              <Quote className="absolute -top-10 right-0 w-16 h-16 text-[#1A2B4C] opacity-10" />
              <h2 className="text-[#1A2B4C] text-4xl md:text-5xl font-black uppercase tracking-normal leading-none">
                Representative <br />
                Project Outcomes
              </h2>
            </div>

            <div className="min-h-[200px] mb-12">
              <AnimatePresence mode="wait">
                <motion.p
                  key={current}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.5 }}
                  className="text-slate-600 text-lg leading-relaxed font-medium italic"
                >
                  {testimonials[current].text}
                </motion.p>
              </AnimatePresence>
            </div>

            <div className="h-px w-full bg-slate-100 mb-12 relative">
              <div className="absolute right-0 -top-1 w-2 h-2 bg-orange-500"></div>
            </div>

            <div className="flex items-center justify-between">
              <AnimatePresence mode="wait">
                <motion.div
                  key={current}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.5 }}
                  className="flex items-center gap-4"
                >
                  <div className="relative w-16 h-16 rounded-sm overflow-hidden border-2 border-orange-500 p-1">
                    <div className="relative w-full h-full overflow-hidden">
                      <Image
                        src={testimonials[current].image}
                        alt={testimonials[current].author}
                        fill
                        className="object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  </div>
                  <div>
                    <h4 className="text-[#1A2B4C] font-black uppercase tracking-normal">
                      {testimonials[current].author}
                    </h4>
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">
                      {testimonials[current].role}
                    </p>
                  </div>
                </motion.div>
              </AnimatePresence>

              <div className="flex gap-2">
                {testimonials.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrent(idx)}
                    className={`w-2 h-2 transition-all duration-300 ${current === idx ? 'bg-orange-500 w-6' : 'bg-slate-200 hover:bg-orange-300'}`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
