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
  CheckCircle2,
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import BackToTop from '@/components/BackToTop';
import {
  categories,
  getCategory,
  getProductsByCategory,
  type ProductCategory,
} from '@/lib/equipment/products';

const categoryIcons: Record<string, typeof Radio> = {
  radio: Radio,
  gauge: Gauge,
  beam: ScanLine,
  bell: Bell,
  cable: Cable,
};

interface CategoryHubProps {
  category: ProductCategory;
}

export default function CategoryHub({ category }: CategoryHubProps) {
  const cat = getCategory(category.slug);
  if (!cat) notFound();

  const CategoryIcon = categoryIcons[cat.icon] ?? Radio;
  const categoryProducts = getProductsByCategory(cat.slug);

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
          <nav className="flex items-center space-x-2 text-slate-400 text-[10px] font-black uppercase tracking-widest mb-8 flex-wrap">
            <Link href="/" className="hover:text-orange-500 transition-colors">
              Home
            </Link>
            <ChevronRight size={12} />
            <Link
              href="/equipment"
              className="hover:text-orange-500 transition-colors"
            >
              Equipment
            </Link>
            <ChevronRight size={12} />
            <span className="text-white">{cat.shortName}</span>
          </nav>

          <div className="max-w-4xl">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-3 mb-6"
            >
              <span className="inline-flex items-center gap-2 bg-orange-500/15 border border-orange-500/30 text-orange-400 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em]">
                <CategoryIcon size={12} />
                GDSCorp
              </span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-4xl md:text-6xl lg:text-7xl font-black text-white uppercase tracking-tight mb-6 leading-none"
            >
              {cat.name}
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-slate-300 text-lg md:text-xl max-w-2xl leading-relaxed mb-10 font-medium"
            >
              {cat.description}
            </motion.p>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.5, rotate: -20 }}
          animate={{ opacity: 0.08, scale: 1, rotate: 0 }}
          transition={{ duration: 1 }}
          className="absolute right-[-5%] bottom-[-10%] text-white hidden lg:block"
        >
          <CategoryIcon size={600} />
        </motion.div>
      </section>

      {/* Products in this category */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-4 md:px-8">
          <div className="text-center mb-16">
            <span className="text-orange-500 font-black text-xs uppercase tracking-[0.4em] block mb-4">
              {categoryProducts.length}{' '}
              {categoryProducts.length === 1 ? 'Model' : 'Models'}
            </span>
            <h2 className="text-[#1A2B4C] text-3xl md:text-5xl font-black uppercase tracking-normal">
              Available <span className="text-orange-500">Equipment</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {categoryProducts.map((product, i) => (
              <motion.div
                key={product.slug}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <Link
                  href={`/equipment/${cat.slug}/${product.slug}`}
                  className="group flex flex-col bg-white rounded-2xl border border-slate-100 hover:border-orange-500/50 hover:shadow-xl transition-all duration-300 h-full overflow-hidden"
                >
                  <div className="relative h-44 bg-slate-50 flex items-center justify-center overflow-hidden">
                    <Image
                      src={product.image}
                      alt={`${product.model} — ${product.name}`}
                      width={160}
                      height={160}
                      className="object-contain max-h-36 group-hover:scale-110 transition-transform duration-300"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div className="p-6 flex flex-col flex-grow">
                  <h3 className="text-[#1A2B4C] text-xl font-black uppercase tracking-normal mb-3 group-hover:text-orange-500 transition-colors">
                    {product.model}
                  </h3>
                  <p className="text-slate-500 text-sm leading-relaxed font-medium mb-6 flex-grow">
                    {product.tagline}
                  </p>

                  <div className="space-y-2 mb-6">
                    {product.features.slice(0, 3).map((feature, fi) => (
                      <div
                        key={fi}
                        className="flex items-start space-x-2"
                      >
                        <CheckCircle2
                          size={14}
                          className="text-orange-500 mt-0.5 shrink-0"
                        />
                        <span className="text-[10px] font-bold uppercase tracking-wide text-slate-600">
                          {feature}
                        </span>
                      </div>
                    ))}
                  </div>

                  <span className="inline-flex items-center text-[10px] font-black uppercase tracking-[0.2em] text-[#ff6900] group-hover:text-[#1A2B4C] transition-colors">
                    View Details
                    <ArrowUpRight
                      size={14}
                      className="ml-2 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform"
                    />
                  </span>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Other Categories */}
      <section className="py-24 bg-slate-50">
        <div className="container mx-auto px-4 md:px-8">
          <div className="text-center mb-16">
            <span className="text-orange-500 font-black text-xs uppercase tracking-[0.4em] block mb-4">
              Explore More
            </span>
            <h2 className="text-[#1A2B4C] text-3xl md:text-5xl font-black uppercase tracking-normal">
              Other <span className="text-orange-500">Categories</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {categories
              .filter((c) => c.slug !== cat.slug)
              .map((otherCat, i) => {
                const OtherIcon = categoryIcons[otherCat.icon] ?? Radio;
                return (
                  <motion.div
                    key={otherCat.slug}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                  >
                    <Link
                      href={`/equipment/${otherCat.slug}`}
                      className="group flex items-center gap-6 bg-white p-6 rounded-2xl border border-slate-100 hover:border-orange-500/50 hover:shadow-lg transition-all duration-300"
                    >
                      <div className="w-12 h-12 rounded-xl bg-[#1A2B4C] flex items-center justify-center shrink-0 group-hover:bg-orange-500 transition-colors">
                        <OtherIcon className="text-white" size={24} />
                      </div>
                      <div className="flex-grow">
                        <h3 className="text-[#1A2B4C] text-base font-black uppercase tracking-normal mb-1 group-hover:text-orange-500 transition-colors">
                          {otherCat.name}
                        </h3>
                        <p className="text-slate-500 text-xs leading-relaxed font-medium line-clamp-2">
                          {otherCat.description}
                        </p>
                      </div>
                      <ArrowUpRight
                        size={18}
                        className="text-slate-300 group-hover:text-orange-500 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all shrink-0"
                      />
                    </Link>
                  </motion.div>
                );
              })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative w-full bg-[#0A0F1A] text-white overflow-hidden py-24">
        <div className="container mx-auto px-4 md:px-8 relative z-10">
          <div className="max-w-4xl">
            <motion.h2
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-3xl md:text-5xl font-black text-white uppercase tracking-normal leading-tight mb-6"
            >
              Need Help Choosing <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF6900] to-orange-300">
                the Right Equipment?
              </span>
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-slate-400 text-base md:text-lg max-w-2xl mb-10 font-medium leading-relaxed"
            >
              Talk to a qualified engineer about your facility. We&apos;ll assess
              your hazards and recommend the right equipment for your
              environment.
            </motion.p>
            <Link
              href="/contact#request-quote"
              className="group inline-flex items-stretch bg-orange-500 hover:bg-orange-600 transition-all rounded-md overflow-hidden shadow-xl shadow-orange-500/20"
            >
              <span className="px-6 md:px-8 py-3 flex items-center text-white font-black text-[11px] md:text-sm uppercase tracking-widest text-left">
                Request a Consultation
              </span>
              <div className="bg-[#1A2B4C] px-5 flex items-center justify-center group-hover:bg-black transition-colors">
                <ArrowRight className="text-white w-4 h-4 -rotate-45 group-hover:rotate-0 group-hover:text-orange-500 transition-all duration-300" />
              </div>
            </Link>
          </div>
        </div>
      </section>

      <BackToTop />
      <Footer />
    </main>
  );
}
