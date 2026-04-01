'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, ArrowRight, ArrowUpRight, CheckCircle2 } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

const industries = [
  {
    id: 1,
    title: "Heavy Industry",
    href: "/industries",
    categories: "Mining & Minerals | Metals & Steel | Cement & Aggregates",
    description: "Fire & gas detection, control & instrumentation, and electrical engineering solutions for mining operations, metals processing, and cement production facilities across Southern Africa.",
    image: "/heavy_industry.jpeg",
    bullets: [
      "Harsh environment solutions",
      "High-power applications",
      "Dust and vibration resistance",
      "Remote monitoring capabilities"
    ]
  },
  {
    id: 2,
    title: "Process Industry",
    href: "/industries",
    categories: "Oil & Gas | Chemical & Petrochemical | Pharmaceutical | Food & Beverage",
    description: "Hazardous area-compliant fire & gas detection, SIL-rated safety systems, and process control solutions for refineries, chemical plants, pharmaceutical, and food & beverage facilities across Southern Africa.",
    image: "/industrial-oil-refinery.jpeg",
    bullets: [
      "Hazardous area compliance (ATEX/IECEx)",
      "SIL-rated safety systems (IEC 61511)",
      "Batch and continuous control",
      "REGULATORY COMPLIANCE (OHS ACT & SANS STANDARDS)"
    ]
  },
  {
    id: 3,
    title: "Manufacturing",
    href: "/industries",
    categories: "Automotive | Food & Beverage | Packaging | Plastics & Rubber",
    description: "High-speed automation, process control, and electrical engineering solutions for automotive, food & beverage, packaging, and plastics manufacturing facilities across Southern Africa.",
    image: "/manufacturing.jpg",
    bullets: [
      "High-speed automation",
      "Flexible manufacturing systems",
      "OEE optimization",
      "Quality systems integration (MES/SCADA)"
    ]
  },
  {
    id: 4,
    title: "Infrastructure",
    href: "/industries",
    categories: "Power Generation | Water & Wastewater | Transport | Commercial Buildings",
    description: "SCADA systems, critical power solutions, and building automation for power generation, water treatment, transport infrastructure, and commercial facilities across Southern Africa.",
    image: "/Infrastructure.jpeg",
    bullets: [
      "SCADA and telemetry",
      "Energy management systems",
      "Critical power systems (UPS, backup, distribution)",
      "Building automation (BMS/HVAC)"
    ]
  }
];

// For infinite loop, we clone the items
const extendedIndustries = [
  ...industries.slice(-2), // Clone last 2 items at the beginning
  ...industries,           // Original items
  ...industries.slice(0, 2)  // Clone first 2 items at the end
];

export default function IndustriesCarousel() {
  const [activeIndex, setActiveIndex] = useState(2); // Start at the first original item
  const [isAnimating, setIsAnimating] = useState(false);
  const [isJumping, setIsJumping] = useState(false);
  const [containerWidth, setContainerWidth] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const dragX = useRef(0);

  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.offsetWidth);
      }
    };
    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  // Handle infinite loop jump
  const handleAnimationComplete = () => {
    if (activeIndex >= industries.length + 2) {
      setIsJumping(true);
      setActiveIndex(2);
    } else if (activeIndex <= 1) {
      setIsJumping(true);
      setActiveIndex(industries.length + 1);
    } else {
      setIsAnimating(false);
    }
  };

  useEffect(() => {
    if (isJumping) {
      const timer = setTimeout(() => {
        setIsJumping(false);
        setIsAnimating(false);
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isJumping]);

  const nextSlide = useCallback(() => {
    if (isAnimating) return;
    setIsAnimating(true);
    setActiveIndex((prev) => prev + 1);
  }, [isAnimating]);

  const prevSlide = useCallback(() => {
    if (isAnimating) return;
    setIsAnimating(true);
    setActiveIndex((prev) => prev - 1);
  }, [isAnimating]);

  // Auto-play
  useEffect(() => {
    const timer = setInterval(() => {
      if (!isAnimating) nextSlide();
    }, 6000);
    return () => clearInterval(timer);
  }, [isAnimating, nextSlide]);

  const slideWidth = containerWidth > 1024 ? 58 : 85;
  const gap = containerWidth > 1024 ? 4 : 4;

  const onDragEnd = (event: any, info: any) => {
    const threshold = 50;
    if (info.offset.x < -threshold) {
      nextSlide();
    } else if (info.offset.x > threshold) {
      prevSlide();
    }
  };

  return (
    <section id="industries" className="py-20 md:py-32 bg-white overflow-hidden">
      <div className="container mx-auto px-4 mb-16 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex items-center justify-center space-x-2 mb-4"
        >
          <div className="h-1.5 w-1.5 bg-[#ff6900] rounded-full"></div>
          <span className="text-[#ff6900] font-mono text-[10px] md:text-xs font-bold uppercase tracking-[0.3em]">
            Our Expertise
          </span>
          <div className="h-1.5 w-1.5 bg-[#ff6900] rounded-full"></div>
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="text-[#1A2B4C] text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black mb-6 uppercase tracking-normal leading-tight"
        >
          Industries We Serve
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className="text-slate-600 max-w-2xl mx-auto text-sm md:text-base font-medium"
        >
          Fire & gas detection, control & instrumentation, and electrical engineering solutions for high-risk industrial environments across Southern Africa.
        </motion.p>
      </div>

      <div className="relative pt-8 pb-24 overflow-visible" ref={containerRef}>
        {/* The Orange Card behind buttons/slides */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-7xl h-64 bg-[#ff6900] z-0 rounded-sm shadow-2xl"></div>

        <div className="relative z-10 flex items-center justify-center cursor-grab active:cursor-grabbing">
          <motion.div
            className="flex"
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.2}
            onDragEnd={onDragEnd}
            animate={{
              x: `calc(${(50 - slideWidth / 2) - (activeIndex * (slideWidth + gap))}% )`
            }}
            transition={{ ease: "easeInOut", duration: isJumping ? 0 : 0.5 }}
            onAnimationComplete={handleAnimationComplete}
            style={{ width: '100%' }}
          >
            {extendedIndustries.map((industry, index) => {
              const isActive = activeIndex === index ||
                (activeIndex >= industries.length + 2 && index === 2) ||
                (activeIndex <= 1 && index === industries.length + 1);

              return (
                <div
                  key={`${industry.id}-${index}`}
                  style={{
                    width: `${slideWidth}%`,
                    marginRight: `${gap}%`,
                    flexShrink: 0
                  }}
                  className="transition-opacity duration-500 select-none opacity-100"
                >
                  <div className="bg-white rounded-2xl overflow-hidden pointer-events-none shadow-xl border border-slate-100">
                    <Link href={industry.href} className="relative aspect-[16/9] mb-8 rounded-xl overflow-hidden shadow-lg m-4 block group/image pointer-events-auto">
                      <div className="absolute inset-0 z-10 bg-black/10 transition-colors group-hover/image:bg-transparent" />
                      <Image
                        src={industry.image}
                        alt={`${industry.title} - ${industry.categories} engineering services - Touch Teq`}
                        fill
                        className="object-cover transition-transform duration-700 group-hover/image:scale-105"
                        referrerPolicy="no-referrer"
                        draggable={false}
                      />
                    </Link>

                    <div className="px-4 md:px-6 pb-6 md:pb-8">
                      <p className="text-slate-400 text-[10px] md:text-xs font-bold uppercase tracking-wider mb-2">
                        {industry.categories}
                      </p>
                      <h3 className="text-[#ff6900] text-xl md:text-2xl lg:text-3xl font-black uppercase mb-3 md:mb-4 tracking-normal">
                        {industry.title}
                      </h3>
                      <p className="text-slate-600 text-xs md:text-sm mb-4 md:mb-6 leading-relaxed max-w-3xl">
                        {industry.description}
                      </p>

                      <ul className="grid grid-cols-1 md:grid-cols-2 gap-y-2 md:gap-y-3 gap-x-8 mb-6 md:mb-10">
                        {industry.bullets.map((bullet, i) => (
                          <li key={i} className="flex items-center space-x-2">
                            <div className="h-1.5 w-1.5 bg-[#ff6900] rounded-full flex-shrink-0"></div>
                            <span className="text-[#1A2B4C] text-[10px] md:text-[11px] font-black uppercase tracking-normal">
                              {bullet}
                            </span>
                          </li>
                        ))}
                      </ul>

                      <Link href={industry.href} className="inline-flex items-center text-[#1A2B4C] hover:text-[#ff6900] transition-colors group pointer-events-auto cursor-pointer">
                        <span className="text-[11px] font-black uppercase tracking-widest mr-2">Read More</span>
                        <div className="flex items-center">
                          <div className="w-4 h-[1px] bg-current"></div>
                          <ArrowRight size={12} className="-ml-1" />
                        </div>
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </motion.div>
        </div>

        {/* Navigation and CTA on top of the card at the bottom */}
        <div className="container mx-auto px-4 md:px-12 relative z-20 mt-12">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8 md:px-4">
            {/* Navigation Buttons on the left - positioned on top of the orange card */}
            <div className="flex shadow-2xl">
              <button
                onClick={prevSlide}
                className="w-16 h-14 bg-[#1A2B4C] hover:bg-[#263655] text-white flex items-center justify-center transition-all duration-300 hover:translate-x-[-5px] group"
                aria-label="Previous slide"
              >
                <ArrowLeft size={24} className="transition-all duration-300 group-hover:text-[#ff6900]" />
              </button>
              <button
                onClick={nextSlide}
                className="w-16 h-14 bg-[#1A2B4C] hover:bg-[#263655] text-white flex items-center justify-center transition-all duration-300 hover:translate-x-[5px] group"
                aria-label="Next slide"
              >
                <ArrowRight size={24} className="transition-all duration-300 group-hover:text-[#ff6900]" />
              </button>
            </div>

            {/* CTA Button on the right - positioned on top of the orange card */}
            <Link
              href="/contact"
              className="bg-white text-[#1A2B4C] hover:text-[#ff6900] hover:bg-slate-50 transition-all duration-300 flex items-center group rounded-sm overflow-hidden shadow-2xl"
            >
              <span className="px-8 py-4 font-black text-xs md:text-sm uppercase tracking-[0.2em]">
                Request a Consultation
              </span>
              <div className="bg-[#1A2B4C] p-4 flex items-center justify-center group-hover:bg-black transition-colors">
                <ArrowRight size={20} className="text-white transition-all duration-300 -rotate-45 group-hover:rotate-0 group-hover:text-[#ff6900]" />
              </div>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
