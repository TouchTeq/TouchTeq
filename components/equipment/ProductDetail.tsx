'use client';

import { motion } from 'motion/react';
import {
  CheckCircle2,
  ArrowRight,
  ArrowUpRight,
  ChevronRight,
  Phone,
  FileText,
  Wrench,
  Settings,
  ShieldCheck,
  Radio,
  Bell,
  Cable,
  Gauge,
  ScanLine,
  Factory,
  Droplets,
  HardHat,
  ZapOff,
  Microscope,
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import BackToTop from '@/components/BackToTop';
import BreadcrumbJsonLd from '@/components/seo/BreadcrumbJsonLd';
import type { Product, ProductCategory } from '@/lib/equipment/products';
import { getRelatedProducts } from '@/lib/equipment/products';

const industryIcons: Record<string, typeof Factory> = {
  'Oil & Gas Refineries': Droplets,
  'Chemical & Petrochemical Plants': Factory,
  'Mining & Minerals Processing': HardHat,
  'Manufacturing & Heavy Industry': Settings,
  'Power Generation Facilities': ZapOff,
  'Pharmaceutical Manufacturing': Microscope,
  'Water & Wastewater Treatment': Droplets,
};

const categoryIcons: Record<string, typeof Radio> = {
  radio: Radio,
  gauge: Gauge,
  beam: ScanLine,
  bell: Bell,
  cable: Cable,
};

interface ProductDetailProps {
  product: Product;
  category: ProductCategory;
  baseUrl: string;
}

export default function ProductDetail({
  product,
  category,
  baseUrl,
}: ProductDetailProps) {
  const relatedProducts = getRelatedProducts(product);
  const CategoryIcon = categoryIcons[category.icon] ?? Radio;

  const productUrl = `${baseUrl}/equipment/${category.slug}/${product.slug}`;
  const categoryUrl = `${baseUrl}/equipment/${category.slug}`;

  return (
    <main className="bg-white min-h-screen font-sans">
      <BreadcrumbJsonLd
        items={[
          { name: 'Home', url: baseUrl },
          { name: 'Equipment', url: `${baseUrl}/equipment` },
          { name: category.name, url: categoryUrl },
          { name: product.model, url: productUrl },
        ]}
      />
      {/* Product JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Product',
            name: product.name,
            mpn: product.model,
            category: category.name,
            description: product.summary,
            brand: { '@type': 'Brand', name: 'GDSCorp' },
            manufacturer: { '@type': 'Organization', name: 'GDSCorp' },
            url: productUrl,
          }),
        }}
      />
      <Header />

      {/* Hero Section */}
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
          {/* Breadcrumbs */}
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
            <Link
              href={`/equipment/${category.slug}`}
              className="hover:text-orange-500 transition-colors"
            >
              {category.shortName}
            </Link>
            <ChevronRight size={12} />
            <span className="text-white">{product.model}</span>
          </nav>

          <div className="flex flex-col lg:flex-row gap-12 items-start lg:items-center">
            {/* Left: Text */}
            <div className="flex-1 max-w-2xl">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-3 mb-6"
              >
                <span className="inline-flex items-center gap-2 bg-orange-500/15 border border-orange-500/30 text-orange-400 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em]">
                  <CategoryIcon size={12} />
                  {category.name}
                </span>
                <span className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em]">
                  GDSCorp
                </span>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-4xl md:text-5xl lg:text-6xl font-black text-white uppercase tracking-tight mb-6 leading-none"
              >
                {product.model}
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-slate-300 text-base md:text-lg leading-relaxed mb-10 font-medium"
              >
                {product.tagline}
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="flex flex-wrap gap-4"
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
                {product.datasheetUrl && (
                  <a
                    href={product.datasheetUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex items-stretch bg-white hover:bg-slate-100 transition-all rounded-md overflow-hidden shadow-xl max-w-full sm:w-auto"
                  >
                    <span className="px-6 md:px-8 py-3 flex items-center text-[#0A1120] group-hover:text-orange-500 font-black text-[11px] md:text-sm uppercase tracking-widest text-left transition-colors">
                      <FileText size={16} className="mr-2" />
                      Data Sheet
                    </span>
                    <div className="bg-[#ff6900] px-5 flex items-center justify-center group-hover:bg-orange-600 transition-colors shrink-0">
                      <ArrowUpRight className="text-white w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                    </div>
                  </a>
                )}
              </motion.div>
            </div>

            {/* Right: Product Image */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.15, duration: 0.6 }}
              className="w-full lg:w-[400px] shrink-0"
            >
              <div className="relative bg-white/5 border border-white/10 rounded-2xl overflow-hidden backdrop-blur-sm">
                <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-transparent" />
                <Image
                  src={product.image}
                  alt={`${product.model} — ${product.name}`}
                  width={400}
                  height={400}
                  className="w-full h-auto object-contain relative z-10 p-8"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-[#1A2B4C] to-transparent h-20 z-0" />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Overview Section */}
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
                Overview
              </span>
              <div className="w-8 h-px bg-orange-500" />
            </motion.div>

            <h2 className="text-[#1A2B4C] text-3xl md:text-4xl lg:text-5xl font-black uppercase tracking-normal mb-8 leading-none">
              What This Device <br />
              <span className="text-orange-500">Does</span>
            </h2>

            <div className="space-y-6 text-slate-600 text-lg leading-relaxed font-medium text-left">
              <p>{product.summary}</p>
            </div>

            {/* Key Features */}
            <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
              {product.features.map((feature, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.05 }}
                  className="flex items-start space-x-3 p-4 rounded-xl border border-slate-100 hover:border-orange-200 transition-colors"
                >
                  <CheckCircle2
                    size={18}
                    className="text-orange-500 mt-0.5 shrink-0"
                  />
                  <span className="text-slate-700 text-sm font-semibold leading-relaxed">
                    {feature}
                  </span>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Technical Specifications */}
      <section className="py-24 bg-slate-50">
        <div className="container mx-auto px-4 md:px-8">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-16">
              <span className="text-orange-500 font-black text-xs uppercase tracking-[0.4em] block mb-4">
                Technical Data
              </span>
              <h2 className="text-[#1A2B4C] text-3xl md:text-5xl font-black uppercase tracking-normal">
                Key Specifications
              </h2>
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              {product.specs.map((spec, i) => (
                <div
                  key={i}
                  className={`flex flex-col sm:flex-row sm:items-center justify-between px-6 md:px-8 py-5 ${
                    i !== product.specs.length - 1
                      ? 'border-b border-slate-50'
                      : ''
                  } ${i % 2 === 1 ? 'bg-slate-50/50' : ''}`}
                >
                  <span className="text-[#1A2B4C] font-black text-xs md:text-sm uppercase tracking-widest mb-1 sm:mb-0">
                    {spec.label}
                  </span>
                  <span className="text-slate-600 text-sm md:text-base font-semibold sm:text-right">
                    {spec.value}
                  </span>
                </div>
              ))}
            </div>

            {product.datasheetUrl && (
              <div className="mt-8 text-center">
                <a
                  href={product.datasheetUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-orange-500 font-black text-xs uppercase tracking-[0.2em] hover:text-[#1A2B4C] transition-colors"
                >
                  <FileText size={16} />
                  Download Full Data Sheet
                  <ArrowUpRight size={14} />
                </a>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Where You'd Use This + Why We Specify */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-4 md:px-8">
          <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Where You'd Use This */}
            <div>
              <span className="text-orange-500 font-black text-xs uppercase tracking-[0.4em] block mb-4">
                Application Engineering
              </span>
              <h3 className="text-[#1A2B4C] text-2xl md:text-3xl font-black uppercase tracking-normal mb-6 leading-tight">
                Where You&apos;d <br />
                <span className="text-orange-500">Use This</span>
              </h3>
              <div className="space-y-4">
                {product.applications.map((app, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.08 }}
                    className="flex items-start space-x-3"
                  >
                    <span className="w-6 h-6 rounded-full bg-orange-50 text-orange-500 flex items-center justify-center text-xs font-black shrink-0 mt-0.5">
                      {i + 1}
                    </span>
                    <p className="text-slate-600 text-sm leading-relaxed font-medium">
                      {app}
                    </p>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Why We Specify This */}
            <div>
              <div className="bg-[#1A2B4C] rounded-2xl p-8 md:p-10 h-full">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center">
                    <Wrench className="text-white" size={20} />
                  </div>
                  <span className="text-orange-500 font-black text-xs uppercase tracking-[0.3em]">
                    Engineering Insight
                  </span>
                </div>
                <h3 className="text-white text-xl md:text-2xl font-black uppercase tracking-normal mb-6 leading-tight">
                  Why We <span className="text-orange-500">Specify This</span>
                </h3>
                <p className="text-slate-300 text-sm md:text-base leading-relaxed font-medium">
                  {product.whySpecify}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Industries */}
      <section className="py-24 bg-slate-50">
        <div className="container mx-auto px-4 md:px-8">
          <div className="text-center mb-16">
            <span className="text-orange-500 font-black text-xs uppercase tracking-[0.4em] block mb-4">
              Industries
            </span>
            <h2 className="text-[#1A2B4C] text-3xl md:text-5xl font-black uppercase tracking-normal">
              Where This Equipment <br />
              <span className="text-orange-500">Gets Deployed</span>
            </h2>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
            {product.industries.map((industry, i) => {
              const Icon = industryIcons[industry] ?? Factory;
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.05 }}
                  className="flex flex-col items-center text-center p-6 rounded-2xl border border-slate-100 hover:border-orange-500 transition-colors group bg-white"
                >
                  <div className="w-14 h-14 rounded-full bg-slate-50 flex items-center justify-center mb-4 group-hover:bg-orange-50 transition-colors">
                    <Icon
                      className="text-[#1A2B4C] group-hover:text-orange-500 transition-colors"
                      size={28}
                    />
                  </div>
                  <span className="text-[#1A2B4C] font-black text-[10px] uppercase tracking-widest leading-tight">
                    {industry}
                  </span>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Related Equipment */}
      {relatedProducts.length > 0 && (
        <section className="py-24 bg-white">
          <div className="container mx-auto px-4 md:px-8">
            <div className="text-center mb-16">
              <span className="text-orange-500 font-black text-xs uppercase tracking-[0.4em] block mb-4">
                Complementary Equipment
              </span>
              <h2 className="text-[#1A2B4C] text-3xl md:text-5xl font-black uppercase tracking-normal">
                Related <span className="text-orange-500">Equipment</span>
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              {relatedProducts.map((rel, i) => {
                const relCategory = category.slug === rel.category ? category : null;
                const href = relCategory
                  ? `/equipment/${rel.category}/${rel.slug}`
                  : `/equipment/${rel.category}/${rel.slug}`;
                return (
                  <motion.div
                    key={rel.slug}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                  >
                    <Link
                      href={href}
                      className="block bg-[#1A2B4C] rounded-2xl border border-white/10 hover:border-[#ff6900]/50 transition-all duration-300 group h-full overflow-hidden"
                    >
                      <div className="relative h-40 bg-white/5 flex items-center justify-center overflow-hidden">
                        <Image
                          src={rel.image}
                          alt={`${rel.model} — ${rel.name}`}
                          width={150}
                          height={150}
                          className="object-contain max-h-32 group-hover:scale-110 transition-transform duration-300"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                      <div className="p-6">
                        <h4 className="text-white text-lg font-black uppercase tracking-normal mb-3 group-hover:text-orange-500 transition-colors">
                          {rel.model}
                        </h4>
                        <p className="text-slate-400 text-xs leading-relaxed font-medium mb-6 line-clamp-2">
                          {rel.tagline}
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
      )}

      {/* Our Support Section */}
      <section className="py-24 bg-slate-50">
        <div className="container mx-auto px-4 md:px-8">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-16">
              <span className="text-orange-500 font-black text-xs uppercase tracking-[0.4em] block mb-4">
                Beyond Supply
              </span>
              <h2 className="text-[#1A2B4C] text-3xl md:text-5xl font-black uppercase tracking-normal">
                How We <span className="text-orange-500">Support This</span>
              </h2>
              <p className="text-slate-500 text-base md:text-lg max-w-2xl mx-auto mt-6 font-medium">
                We don&apos;t just ship a box. Every piece of equipment we supply
                is backed by full engineering, installation, and maintenance
                support.
              </p>
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
                  <div className="w-12 h-12 bg-slate-50 rounded-lg flex items-center justify-center mb-6 group-hover:bg-orange-500 transition-colors">
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
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative w-full bg-[#0A0F1A] text-white overflow-hidden py-32">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-b from-[#0A0F1A] via-transparent to-[#0A0F1A]" />
        </div>

        <div className="container mx-auto px-4 md:px-8 relative z-10">
          <div className="max-w-5xl">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="flex items-center space-x-3 mb-6"
            >
              <div className="w-12 h-[1px] bg-orange-500" />
              <span className="text-orange-500 font-black text-xs uppercase tracking-[0.4em]">
                Ready to Move Forward
              </span>
            </motion.div>
            <motion.h2
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="text-4xl md:text-6xl lg:text-7xl font-black text-white uppercase tracking-normal leading-[0.85] mb-10"
            >
              Discuss the {product.model} <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF6900] to-orange-300">
                for Your Facility
              </span>
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-slate-400 text-lg md:text-xl max-w-2xl mb-12 font-medium leading-relaxed"
            >
              Talk to a qualified engineer about whether the {product.model} is
              the right fit for your application. We&apos;ll review your
              requirements and provide a detailed proposal.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="flex flex-col sm:flex-row gap-6"
            >
              <Link
                href="/contact#request-quote"
                className="group flex items-stretch bg-white hover:bg-slate-100 transition-all rounded-md overflow-hidden shadow-xl max-w-full sm:w-auto"
              >
                <span className="px-6 md:px-8 py-3 flex items-center text-[#0A1120] group-hover:text-orange-500 font-black text-[11px] md:text-sm uppercase tracking-widest text-left transition-colors">
                  REQUEST A CONSULTATION
                </span>
                <div className="bg-[#ff6900] px-4 md:px-5 flex items-center justify-center group-hover:bg-orange-600 transition-colors shrink-0">
                  <ArrowRight className="text-white w-4 h-4 -rotate-45 group-hover:rotate-0 transition-all duration-300" />
                </div>
              </Link>

              <a
                href="tel:+27725522110"
                className="group flex items-stretch bg-orange-500 hover:bg-orange-600 transition-all rounded-md overflow-hidden shadow-xl shadow-orange-500/20 max-w-full sm:w-auto"
              >
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
