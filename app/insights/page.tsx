'use client';

import { useState, useRef } from 'react';
import { motion } from 'motion/react';
import { ChevronRight, ArrowRight, ArrowUpRight, Check } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import BackToTop from '@/components/BackToTop';
import BreadcrumbJsonLd from '@/components/seo/BreadcrumbJsonLd';
import { sendGAEvent } from '@next/third-parties/google';
import { Turnstile } from '@marsidev/react-turnstile';
import type { TurnstileInstance } from '@marsidev/react-turnstile';

const articles = [
  {
    id: 1,
    title: "Understanding IEC 61511: What Plant Managers in South Africa Need to Know",
    excerpt: "IEC 61511 defines the requirements for safety instrumented systems in the process industry. For plant managers in South Africa, understanding what the standard requires — and what it means for your facility's safety lifecycle — is no longer optional. This article breaks down the key requirements in plain language.",
    category: "Regulatory Updates",
    cardTag: "Functional Safety",
    detailTags: ["Functional Safety", "IEC 61511", "Safety Instrumented Systems"],
    image: "/IEC.jpeg",
    link: "/insights/iec-61511-plant-managers",
    readTime: 12
  },
  {
    id: 2,
    title: "A Guide to Hazardous Area Classification in Southern Africa",
    excerpt: "Hazardous area classification determines where explosive atmospheres may exist in your facility and what equipment protection levels are required. This guide covers the classification process, the applicable standards, and what plant managers and HSE teams need to understand before commissioning a HAC study.",
    category: "Technical Articles",
    cardTag: "Hazardous Areas",
    detailTags: ["Hazardous Areas", "SANS 10108", "IEC 60079"],
    image: "/HAC.jpg",
    link: "/insights/hazardous-area-classification-southern-africa",
    readTime: 8
  },
  {
    id: 3,
    title: "Top 5 Reasons for False Alarms in Optical Flame Detectors",
    excerpt: "False alarms in optical flame detection systems are one of the most disruptive and costly problems in industrial fire protection. This article identifies the five most common causes, explains the engineering principles behind each, and outlines the corrective actions that will reduce nuisance trips without compromising detection performance.",
    category: "Technical Articles",
    cardTag: "Fire & Gas",
    detailTags: ["Fire & Gas", "Flame Detectors", "Maintenance"],
    image: "/optical-flame-detector.jpeg",
    link: "/insights/flame-detector-false-alarms",
    readTime: 6
  },
  {
    id: 4,
    title: "The Difference Between a SIL Assessment and a HAZOP",
    excerpt: "These two studies come up together constantly in process safety conversations, and they often get conflated. A plant manager who has sat through both can usually describe what happened in the room. What's less common is a clear understanding of why they're different studies, why the sequence matters, and what each one actually produces.",
    category: "Technical Articles",
    cardTag: "Functional Safety",
    detailTags: ["Functional Safety", "SIL Assessment", "HAZOP"],
    image: "/SIL-HAZOP.jpeg",
    link: "/insights/sil-assessment-vs-hazop",
    readTime: 7
  },
  {
    id: 5,
    title: "What to Expect During a Fire and Gas System Commissioning",
    excerpt: "There's a version of commissioning that most people have seen: a technician walks around with a clipboard, presses a test button on a detector, the panel beeps, and someone signs off a form. That's not commissioning. That's a functional check, and it is not enough to know whether a fire and gas system will actually perform when it's needed.",
    category: "Technical Articles",
    cardTag: "Fire & Gas",
    detailTags: ["Fire & Gas", "Commissioning", "IEC 61511"],
    image: "/f&g.jpeg",
    link: "/insights/fire-and-gas-system-commissioning",
    readTime: 8
  }
];

const categories = ["ALL", "TECHNICAL ARTICLES", "REGULATORY UPDATES"];

export default function InsightsPage() {
  const [activeCategory, setActiveCategory] = useState("ALL");
  const [notifyName, setNotifyName] = useState("");
  const [notifyEmail, setNotifyEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [turnstileToken, setTurnstileToken] = useState("");
  const turnstileRef = useRef<TurnstileInstance>(null);

  const filteredArticles = activeCategory === "ALL" 
    ? articles 
    : articles.filter(article => article.category.toUpperCase() === activeCategory);

  const featuredArticle = articles[0];
  const gridArticles = articles.slice(1);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!notifyName || !notifyEmail || !agreed) return;
    
    setIsSubmitting(true);
    setErrorMsg("");

    try {
      let token = turnstileToken;

      if (process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY && !token) {
        turnstileRef.current?.execute();
        await new Promise(resolve => setTimeout(resolve, 1500));
        token = turnstileToken;
      }

      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: notifyName, email: notifyEmail, token }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to subscribe. Please try again.");
      }

      setSubscribed(true);
      sendGAEvent('event', 'insights_subscribe');
    } catch (err: any) {
      setErrorMsg(err.message || "An unexpected error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="bg-white min-h-screen font-sans">
      <BreadcrumbJsonLd
        items={[
          { name: 'Home', url: 'https://touchteq.co.za' },
          { name: 'Insights', url: 'https://touchteq.co.za/insights' },
        ]}
      />
      <Header />
      
      {/* Hero Section */}
      <section className="relative pt-32 pb-24 md:pt-48 md:pb-32 bg-[#1A2B4C] overflow-hidden">
        <div className="container mx-auto px-4 md:px-8">
          {/* Breadcrumb */}
          <nav className="flex items-center space-x-2 text-slate-400 text-[10px] font-black uppercase tracking-widest mb-8">
            <Link href="/" className="hover:text-orange-500 transition-colors">Home</Link>
            <ChevronRight size={12} />
            <span className="text-white">Insights</span>
          </nav>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-6xl lg:text-7xl font-black text-white uppercase tracking-tight mb-6 leading-none"
          >
            Technical Insights for <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF6900] to-orange-300">Industrial Engineers</span> <br />
            <span className="text-2xl md:text-4xl mt-4 block text-white/90 tracking-normal">and HSE Managers</span>
          </motion.h1>
          
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-slate-300 text-lg md:text-xl max-w-3xl leading-relaxed font-medium"
          >
            Practical articles and regulatory updates written by engineers who work in the same environments you manage. No filler. No generic safety advice. Content that is relevant to the decisions you make and the standards you are held to.
          </motion.p>
        </div>
      </section>

      {/* Category Filter Bar */}
      <section className="py-6 bg-slate-50 border-b border-slate-200">
        <div className="container mx-auto px-4 md:px-8">
          <div className="flex flex-wrap gap-3">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setActiveCategory(category)}
                className={`px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${
                  activeCategory === category 
                    ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20' 
                    : 'bg-white text-slate-600 border border-slate-200 hover:border-orange-500 hover:text-orange-500'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Article */}
      <section className="py-16">
        <div className="container mx-auto px-4 md:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-8"
          >
            <span className="bg-orange-500 text-white px-4 py-1.5 rounded-sm text-[10px] font-black uppercase tracking-widest">
              Featured Article
            </span>
          </motion.div>

          <motion.article
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="relative"
          >
            <div className="relative h-[400px] md:h-[500px] w-full rounded-2xl overflow-hidden">
              <Link href={featuredArticle.link}>
                <Image
                  src={featuredArticle.image}
                  alt={featuredArticle.title}
                  fill
                  className="object-cover"
                  referrerPolicy="no-referrer"
                  priority
                />
              </Link>
              <div className="absolute inset-0 bg-gradient-to-t from-[#1A2B4C] via-[#1A2B4C]/60 to-transparent"></div>
              
              <div className="absolute bottom-0 left-0 right-0 p-8 md:p-12">
                <div className="flex flex-wrap gap-2 mb-4">
                  {featuredArticle.detailTags.map((tag, index) => (
                    <span key={index} className="bg-orange-500 text-white px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
                      {tag}
                    </span>
                  ))}
                </div>
                
                <Link href={featuredArticle.link}>
                  <h2 className="text-white text-2xl md:text-4xl font-black uppercase tracking-normal leading-tight mb-4 max-w-3xl transition-colors">
                    {featuredArticle.title}
                  </h2>
                </Link>
                
                <p className="text-slate-200 text-base md:text-lg leading-relaxed mb-6 max-w-2xl">
                  {featuredArticle.excerpt}
                </p>
                
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="inline-flex items-center text-slate-400 text-xs font-medium px-3 py-1 rounded-full border border-slate-300">
                    {featuredArticle.readTime} min read
                  </div>
                  
                  <Link 
                    href={featuredArticle.link}
                    className="group inline-flex items-center bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-md font-black text-xs uppercase tracking-widest transition-all shadow-lg shadow-orange-500/20"
                  >
                    <span>Read the Article</span>
                    <ArrowRight size={16} className="ml-2 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </div>
            </div>
          </motion.article>
        </div>
      </section>

      {/* Article Grid */}
      <section className="py-16 bg-slate-50">
        <div className="container mx-auto px-4 md:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {gridArticles.map((article, index) => (
              <motion.article
                key={article.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-500"
              >
                {/* Image Container */}
                <div className="relative aspect-[16/9] overflow-hidden">
                  <Link href={article.link}>
                    <Image
                      src={article.image}
                      alt={article.title}
                      fill
                      className="object-cover transition-transform duration-700 group-hover:scale-110"
                      referrerPolicy="no-referrer"
                    />
                  </Link>
                  <div className="absolute top-4 left-4">
                    <span className="bg-[#FF6900] text-white px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
                      {article.cardTag}
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-8">
                  <div className="inline-flex items-center text-slate-400 text-xs font-medium px-3 py-1 rounded-full border border-slate-300 mb-4">
                    {article.readTime} min read
                  </div>

                  <Link href={article.link}>
                    <h3 className="text-[#1A2B4C] text-xl font-black uppercase tracking-normal leading-tight mb-4 group-hover:text-orange-500 transition-colors line-clamp-2">
                      {article.title}
                    </h3>
                  </Link>

                  <p className="text-slate-500 text-sm font-medium leading-relaxed mb-6 line-clamp-3">
                    {article.excerpt}
                  </p>

                  <div className="flex flex-wrap gap-2 mb-6">
                    {article.detailTags.map((tag, i) => (
                      <span key={i} className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                        {i > 0 && "· "}{tag}
                      </span>
                    ))}
                  </div>

                  <Link 
                    href={article.link}
                    className="inline-flex items-center text-[#1A2B4C] font-black text-xs uppercase tracking-[0.2em] group/btn"
                  >
                    Read the Article
                    <ArrowRight size={14} className="ml-2 text-orange-500 group-hover/btn:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </motion.article>
            ))}
          </div>
        </div>
      </section>

      {/* Free Resources CTA */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4 md:px-8">
          <div className="max-w-4xl mx-auto">
            <Link 
              href="/downloads"
              className="group block bg-gradient-to-r from-[#1A2B4C] to-[#1A2B4C]/90 rounded-2xl p-8 md:p-12 border border-[#1A2B4C]/20 hover:border-orange-500/30 transition-all"
            >
              <div className="flex flex-col md:flex-row items-center gap-8">
                <div className="w-20 h-20 bg-orange-500/20 rounded-2xl flex items-center justify-center shrink-0">
                  <svg className="w-10 h-10 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div className="flex-1 text-center md:text-left">
                  <p className="text-orange-500 text-xs font-black uppercase tracking-[0.3em] mb-2">
                    Free Resources
                  </p>
                  <h3 className="text-white text-2xl md:text-3xl font-black uppercase tracking-tight mb-2">
                    Download Technical Checklists & Reference Sheets
                  </h3>
                  <p className="text-slate-400 text-sm leading-relaxed">
                    HAC Checklist, Fire & Gas Audit Checklist, and Engineering Standards Reference Sheet — free to download with your details.
                  </p>
                </div>
                <div className="shrink-0">
                  <div className="bg-orange-500 group-hover:bg-orange-600 p-4 rounded-full transition-colors">
                    <ArrowRight size={24} className="text-white" />
                  </div>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </section>
      
      {/* CTA Section for Risk Assessment */}
      <section className="py-24 bg-[#0A1120] text-white">
        <div className="container mx-auto px-4 md:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="mb-6"
            >
              <span className="text-orange-500 font-black text-xs uppercase tracking-[0.4em]">
                Identify Your Gaps
              </span>
            </motion.div>

            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-3xl md:text-5xl font-black uppercase tracking-tight mb-8 text-white"
            >
              Is Your Facility <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF6900] to-orange-300">Compliant and Safe?</span>
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="text-slate-300 text-lg leading-relaxed font-medium mb-10 max-w-2xl mx-auto"
            >
              Take our interactive Facility Risk Assessment to instantly identify gaps in your safety documentation, functional safety measures, and fire & gas audit history. Get a free, personalised risk report in minutes.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
            >
              <Link 
                href="/risk-assessment"
                className="group inline-flex items-stretch bg-orange-500 hover:bg-orange-600 transition-all rounded-md overflow-hidden shadow-xl shadow-orange-500/20"
              >
                <span className="px-8 py-5 flex items-center text-white font-black text-xs md:text-sm uppercase tracking-widest whitespace-nowrap">
                  Assess My Facility Risk — Free
                </span>
                <div className="bg-[#1A2B4C] px-6 flex items-center justify-center group-hover:bg-black transition-colors">
                  <ArrowRight className="text-white w-5 h-5 group-hover:translate-x-1 transition-all duration-300" />
                </div>
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* About This Content */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-4 md:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="mb-6"
            >
              <span className="text-orange-500 font-black text-xs uppercase tracking-[0.4em]">
                Why We Publish
              </span>
            </motion.div>

            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-[#1A2B4C] text-3xl md:text-5xl font-black uppercase tracking-normal mb-8"
            >
              Written by Engineers.<br />For Engineers.
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="text-slate-600 text-lg leading-relaxed font-medium"
            >
              Most technical content published online is written by marketers summarising information they found elsewhere. The articles on this page are written by practising engineers at Touch Teq who work daily in refineries, chemical plants, mines, and processing facilities across Southern Africa.
            </motion.p>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              className="text-slate-600 text-lg leading-relaxed font-medium mt-6"
            >
              We publish on topics that are directly relevant to the work we do and the challenges our clients face. If an article appears here, it is because we have direct experience with the subject matter and something useful to say about it.
            </motion.p>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4 }}
              className="text-slate-500 text-base leading-relaxed mt-8 italic"
            >
              We do not publish on a fixed schedule. We publish when we have something worth reading.
            </motion.p>
          </div>
        </div>
      </section>

      {/* Stay Informed */}
      <section className="py-24 bg-slate-50">
        <div className="container mx-auto px-4 md:px-8">
          <div className="max-w-2xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-10"
            >
              <span className="text-orange-500 font-black text-xs uppercase tracking-[0.4em] block mb-4">
                Stay Informed
              </span>
              <h2 className="text-[#1A2B4C] text-3xl md:text-5xl font-black uppercase tracking-normal mb-4">
                Get Notified When We Publish
              </h2>
              <p className="text-slate-600 text-lg leading-relaxed font-medium">
                We publish new technical articles and regulatory updates periodically. If you want to be notified when new content is available, leave your email address below. No newsletters. No marketing emails. Only a notification when a new article is published.
              </p>
            </motion.div>

            {subscribed ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-green-50 border border-green-200 rounded-xl p-8 text-center"
              >
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Check size={32} className="text-green-600" />
                </div>
                <h3 className="text-[#1A2B4C] text-xl font-black uppercase tracking-normal mb-2">
                  You&apos;re Subscribed
                </h3>
                <p className="text-slate-600 font-medium">
                  We&apos;ll notify you when new articles are published.
                </p>
              </motion.div>
            ) : (
              <motion.form
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
                onSubmit={handleSubscribe}
                className="bg-white p-8 rounded-2xl shadow-lg"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div>
                    <input
                      type="text"
                      placeholder="Name"
                      value={notifyName}
                      onChange={(e) => setNotifyName(e.target.value)}
                      className="w-full px-6 py-4 bg-slate-50 border border-slate-100 focus:border-orange-500 focus:bg-white outline-none transition-all font-medium text-[#1A2B4C] placeholder:text-slate-400"
                      required
                    />
                  </div>
                  <div>
                    <input
                      type="email"
                      placeholder="Email Address"
                      value={notifyEmail}
                      onChange={(e) => setNotifyEmail(e.target.value)}
                      className="w-full px-6 py-4 bg-slate-50 border border-slate-100 focus:border-orange-500 focus:bg-white outline-none transition-all font-medium text-[#1A2B4C] placeholder:text-slate-400"
                      required
                    />
                  </div>
                </div>

                <div className="mb-6 flex items-start space-x-3 text-left">
                  <button
                    type="button"
                    onClick={() => setAgreed(!agreed)}
                    className={`shrink-0 w-5 h-5 mt-0.5 border-2 rounded-sm flex items-center justify-center transition-colors ${
                      agreed ? "bg-orange-500 border-orange-500" : "border-slate-300 hover:border-orange-500"
                    }`}
                  >
                    {agreed && <Check size={14} className="text-white" />}
                  </button>
                  <label className="text-slate-500 text-sm leading-relaxed cursor-pointer" onClick={() => setAgreed(!agreed)}>
                    I agree to receive industry updates from Touch Teq Engineering. You can unsubscribe at any time.
                  </label>
                </div>

                {errorMsg && (
                  <div className="mb-6 bg-red-50 text-red-600 text-sm font-bold px-4 py-3 rounded-md text-left border border-red-100">
                    {errorMsg}
                  </div>
                )}

                {process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY && (
                  <div className="mb-6">
                    <Turnstile 
                      ref={turnstileRef}
                      siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY} 
                      onSuccess={(t) => setTurnstileToken(t)} 
                      options={{ size: "invisible" }}
                    />
                  </div>
                )}

                <button
                  type="submit"
                  disabled={!agreed || isSubmitting}
                  className={`w-full text-white px-8 py-4 rounded-md font-black text-xs uppercase tracking-widest transition-all shadow-lg ${
                    agreed && !isSubmitting
                      ? "bg-orange-500 hover:bg-orange-600 shadow-orange-500/20"
                      : "bg-slate-300 cursor-not-allowed shadow-none"
                  }`}
                >
                  {isSubmitting ? "Submitting..." : "Notify Me"}
                </button>

              </motion.form>
            )}
          </div>
        </div>
      </section>

      {/* CTA Section */}
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
              Have a Technical Question <br /> <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF6900] to-orange-300">We Haven't Covered?</span>
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-slate-400 text-lg md:text-xl max-w-2xl mb-12 font-medium leading-relaxed"
            >
              If there is a topic you would like us to address — a standard you are trying to understand, a compliance question, or a technical challenge you are facing — contact us directly. We are happy to point you in the right direction, and your question may become the subject of a future article.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="flex flex-col sm:flex-row gap-6"
            >
              <Link 
                href="/contact"
                className="group flex items-stretch bg-white hover:bg-slate-100 transition-all rounded-md overflow-hidden shadow-xl max-w-full sm:w-auto"
              >
                <span className="px-6 md:px-8 py-3 flex items-center text-[#0A1120] group-hover:text-orange-500 font-black text-[11px] md:text-sm uppercase tracking-widest text-left transition-colors">
                  Contact Our Engineers
                </span>
                <div className="bg-[#ff6900] px-4 md:px-5 flex items-center justify-center group-hover:bg-orange-600 transition-colors shrink-0">
                  <ArrowRight className="text-white w-4 h-4 -rotate-45 group-hover:rotate-0 transition-all duration-300" />
                </div>
              </Link>
              <Link 
                href="/#services"
                className="group flex items-stretch bg-orange-500 hover:bg-orange-600 transition-all rounded-md overflow-hidden shadow-xl shadow-orange-500/20 max-w-full sm:w-auto"
              >
                <span className="px-6 md:px-8 py-3 flex items-center text-white font-black text-[11px] md:text-sm uppercase tracking-widest text-left">
                  <span>Explore Our Services</span>
                </span>
                <div className="bg-[#1A2B4C] px-5 flex items-center justify-center group-hover:bg-black transition-colors shrink-0">
                  <ArrowRight className="text-white w-4 h-4 -rotate-45 group-hover:rotate-0 group-hover:text-orange-500 transition-all duration-300" />
                </div>
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      <BackToTop />
      <Footer />
    </main>
  );
}
