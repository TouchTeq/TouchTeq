'use client';

import { motion } from 'motion/react';
import {
  Radio,
  Bell,
  Cable,
  Gauge,
  ScanLine,
  ArrowUpRight,
  ChevronRight,
  ArrowRight,
  ShieldCheck,
  Wrench,
  Settings,
  CheckCircle2,
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import BackToTop from '@/components/BackToTop';
import {
  categories,
  products,
  getCategory,
} from '@/lib/equipment/products';

const categoryIcons: Record<string, typeof Radio> = {
  radio: Radio,
  gauge: Gauge,
  beam: ScanLine,
  bell: Bell,
  cable: Cable,
};

export default function EquipmentHub() {
  return (
    <main className="bg-white min-h-screen font-sans">
      <Header />

      {/* Hero */}
      <section className="relative pt-32 pb-24 md:pt-48 md:pb-32 bg-[#1A2B4C] overflow-hidden">
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage:
                'radial-gradient(#ff6900 1px, transparent 1px)',
              backgroundSize: '40px 40px',
            }}
          />
        </div>

        <div className="container mx-auto px-4 md:px-8 relative z-10">
          <nav className="flex items-center space-x-2 text-slate-400 text-[10px] font-black uppercase tracking-widest mb-8">
            <Link href="/" className="hover:text-orange-500 transition-colors">
              Home
            </Link>
            <ChevronRight size={12} />
            <span className="text-white">Equipment</span>
          </nav>

          <div className="max-w-4xl">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-4xl md:text-7xl font-black text-white uppercase tracking-tight mb-8 leading-none"
            >
              Equipment We <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF6900] to-orange-300">
                Specify &amp; Support
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-slate-300 text-lg md:text-xl max-w-2xl leading-relaxed mb-10 font-medium"
            >
              We partner with GDSCorp to supply reliable gas and flame detection
              solutions for industrial environments. Every device listed here is
              one we specify, install, commission, and maintain, backed by
              engineering judgement rather than a catalogue entry.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Link
                href="/contact#request-quote"
                className="group flex items-stretch bg-orange-500 hover:bg-orange-600 transition-all rounded-md overflow-hidden shadow-xl shadow-orange-500/20 max-w-full sm:w-auto"
              >
                <span className="px-6 md:px-8 py-3 flex items-center text-white font-black text-[11px] md:text-sm uppercase tracking-widest text-left">
                  Request a Consultation
                </span>
                <div className="bg-[#1A2B4C] px-5 flex items-center justify-center group-hover:bg-black transition-colors shrink-0">
                  <ArrowRight className="text-white w-4 h-4 -rotate-45 group-hover:rotate-0 group-hover:text-orange-500 transition-all duration-300" />
                </div>
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Intro */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-4 md:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="flex items-center justify-center space-x-3 mb-6"
            >
              <div className="w-8 h-px bg-orange-500" />
              <span className="text-orange-500 font-black text-xs uppercase tracking-[0.4em]">
                GDSCorp Partnership
              </span>
              <div className="w-8 h-px bg-orange-500" />
            </motion.div>

            <h2 className="text-[#1A2B4C] text-3xl md:text-4xl lg:text-5xl font-black uppercase tracking-normal mb-8 leading-tight">
              The Right Device, <br />
              <span className="text-orange-500">Specified Properly.</span>
            </h2>

            <div className="space-y-6 text-slate-600 text-lg leading-relaxed font-medium">
              <p>
                A detector is only as good as its placement and the system
                architecture around it. We do more than supply hardware. We
                assess your facility, determine the right detection zones, and
                specify equipment that fits your hazards, your environment, and
                your operating philosophy.
              </p>
              <p>
                Every product below is part of the GDSCorp wireless detection
                ecosystem that we design, install, and maintain across Southern
                Africa. Select a category to see the specific models we work
                with.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Grid */}
      <section className="py-24 bg-slate-50">
        <div className="container mx-auto px-4 md:px-8">
          <div className="text-center mb-16">
            <span className="text-orange-500 font-black text-xs uppercase tracking-[0.4em] block mb-4">
              Product Categories
            </span>
            <h2 className="text-[#1A2B4C] text-3xl md:text-5xl font-black uppercase tracking-normal">
              Browse by <span className="text-orange-500">Category</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {categories.map((cat, i) => {
              const Icon = categoryIcons[cat.icon] ?? Radio;
              const catProducts = products.filter(
                (p) => p.category === cat.slug,
              );
              return (
                <motion.div
                  key={cat.slug}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                >
                  <Link
                    href={`/equipment/${cat.slug}`}
                    className="block bg-white p-8 md:p-10 rounded-2xl border border-slate-100 hover:border-orange-500/50 hover:shadow-xl transition-all duration-300 group h-full"
                  >
                    <div className="w-14 h-14 rounded-xl bg-[#1A2B4C] flex items-center justify-center mb-6 group-hover:bg-orange-500 transition-colors duration-300">
                      <Icon className="text-white" size={28} />
                    </div>
                    <h3 className="text-[#1A2B4C] text-xl font-black uppercase tracking-normal mb-3 group-hover:text-orange-500 transition-colors">
                      {cat.name}
                    </h3>
                    <p className="text-slate-500 text-sm leading-relaxed font-medium mb-6">
                      {cat.description}
                    </p>
                    <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                        {catProducts.length}{' '}
                        {catProducts.length === 1 ? 'Model' : 'Models'}
                      </span>
                      <span className="inline-flex items-center text-[10px] font-black uppercase tracking-[0.2em] text-[#ff6900] group-hover:text-[#1A2B4C] transition-colors">
                        View
                        <ArrowUpRight
                          size={14}
                          className="ml-1 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform"
                        />
                      </span>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* All Products Quick List */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-4 md:px-8">
          <div className="text-center mb-16">
            <span className="text-orange-500 font-black text-xs uppercase tracking-[0.4em] block mb-4">
              Full Catalogue
            </span>
            <h2 className="text-[#1A2B4C] text-3xl md:text-5xl font-black uppercase tracking-normal">
              All <span className="text-orange-500">Equipment</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {products.map((product, i) => {
              const cat = getCategory(product.category);
              return (
                <motion.div
                  key={product.slug}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: (i % 3) * 0.08 }}
                >
                  <Link
                    href={`/equipment/${product.category}/${product.slug}`}
                    className="block bg-[#1A2B4C] rounded-2xl border border-white/10 hover:border-[#ff6900]/50 transition-all duration-300 group h-full overflow-hidden"
                  >
                    <div className="relative h-36 bg-white/5 flex items-center justify-center overflow-hidden">
                      <Image
                        src={product.image}
                        alt={`${product.model} — ${product.name}`}
                        width={130}
                        height={130}
                        className="object-contain max-h-28 group-hover:scale-110 transition-transform duration-300"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <div className="p-5">
                      <span className="inline-block text-[10px] font-black uppercase tracking-widest text-orange-500 mb-3">
                        {cat?.shortName}
                      </span>
                      <h4 className="text-white text-lg font-black uppercase tracking-normal mb-2 group-hover:text-orange-500 transition-colors">
                        {product.model}
                      </h4>
                      <p className="text-slate-400 text-xs leading-relaxed font-medium mb-4 line-clamp-2">
                        {product.tagline}
                      </p>
                      <span className="inline-flex items-center text-[10px] font-black uppercase tracking-[0.2em] text-[#ff6900] group-hover:text-white transition-colors">
                        View Details
                        <ArrowUpRight
                          size={14}
                          className="ml-2 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform"
                        />
                      </span>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Support Strip */}
      <section className="py-24 bg-slate-50">
        <div className="container mx-auto px-4 md:px-8">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-16">
              <span className="text-orange-500 font-black text-xs uppercase tracking-[0.4em] block mb-4">
                Beyond Supply
              </span>
              <h2 className="text-[#1A2B4C] text-3xl md:text-5xl font-black uppercase tracking-normal">
                We Don&apos;t Just <span className="text-orange-500">Ship Boxes</span>
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                {
                  icon: ShieldCheck,
                  title: 'Specify & Supply',
                  desc: 'We assess your facility, recommend the right device for the hazard, and source genuine GDSCorp equipment with no grey-market substitutions.',
                },
                {
                  icon: Settings,
                  title: 'Install & Commission',
                  desc: 'Our engineers handle on-site installation, loop testing, network configuration, and full commissioning with documentation.',
                },
                {
                  icon: Wrench,
                  title: 'Maintain & Support',
                  desc: 'Scheduled preventative maintenance, calibration, and 24/7 emergency callout to keep your system operational.',
                },
              ].map((step, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm"
                >
                  <div className="w-12 h-12 bg-slate-50 rounded-lg flex items-center justify-center mb-6">
                    <step.icon className="text-[#1A2B4C]" size={24} />
                  </div>
                  <h4 className="text-[#1A2B4C] text-lg font-black uppercase tracking-normal mb-3">
                    {step.title}
                  </h4>
                  <p className="text-slate-500 text-sm leading-relaxed font-medium">
                    {step.desc}
                  </p>
                </motion.div>
              ))}
            </div>

            <div className="mt-12 text-center">
              <Link
                href="/services/fire-and-gas-detection"
                className="inline-flex items-center gap-2 text-orange-500 font-black text-xs uppercase tracking-[0.2em] hover:text-[#1A2B4C] transition-colors"
              >
                Learn About Our Fire &amp; Gas Detection Services
                <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <BackToTop />
      <Footer />
    </main>
  );
}
