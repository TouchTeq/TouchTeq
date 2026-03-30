'use client';
import { useState, useRef, useEffect, ChangeEvent } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, Clock, Play, Pause, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import ReactMarkdown from 'react-markdown';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import BackToTop from '@/components/BackToTop';
import { ShareButton } from '@/components/ui/share-button';
import ArticleAuthorityBox from '@/components/insights/ArticleAuthorityBox';
import JsonLd from '@/components/seo/JsonLd';
import BreadcrumbJsonLd from '@/components/seo/BreadcrumbJsonLd';

// Read the markdown file as a string
const markdownContent = `# IEC 61511 in South Africa: what plant managers need to know

If you manage a process plant in South Africa (a refinery, chemical facility, gas processing plant, or similar operation), there's a standard worth understanding beyond its acronym: IEC 61511. It governs how safety instrumented systems are designed, operated, and maintained. More to the point, it defines what you're accountable for when things go wrong.

## What is IEC 61511?

IEC 61511 is an international standard from the International Electrotechnical Commission, written for Safety Instrumented Systems (SIS) in the process industry. These are the automated safety systems that kick in when a process goes off-script: shutting valves, triggering alarms, isolating equipment before a deviation turns into something worse.

The standard covers the full life of a SIS, from initial concept through design, installation, operation, maintenance, and eventual decommissioning. It's not a document you satisfy once during a capital project. It's a management obligation that runs for as long as the system exists.

## Who does it apply to?

In South Africa, process plants subject to the Occupational Health and Safety Act (OHSA) and the Major Hazard Installation (MHI) Regulations (2022) are directly in scope. The MHI Regulations require facilities handling hazardous substances above defined thresholds to demonstrate that risks are properly identified and controlled. IEC 61511 is the accepted standard for doing that on the instrumented safety side.

This is not an engineering department problem. As the plant manager or facility owner, you are the Duty Holder. You can outsource the engineering work. You cannot outsource the accountability. South African regulatory and legal frameworks assign primary liability to the facility operator, and investigations after serious incidents don't stop at the contractor boundary.

## The core concept: safety integrity levels (SIL)

IEC 61511 is built around Safety Integrity Levels, or SILs, which measure how reliably a specific safety function must perform.

*   **SIL 1:** Roughly a 10-fold reduction in risk
*   **SIL 2:** 100-fold
*   **SIL 3:** 1,000-fold
*   **SIL 4:** 10,000-fold (reserved for extreme hazard scenarios; rare in practice)

The required SIL for any given function comes from a formal Hazard and Risk Assessment, often using LOPA (Layer of Protection Analysis). Over-engineering a low-risk function wastes capital. Under-engineering a high-risk one gets people hurt.

## The safety lifecycle

IEC 61511 requires a structured safety lifecycle covering:

1.  Hazard and risk assessment
2.  Safety requirements specification
3.  System design and engineering
4.  Installation, commissioning, and validation
5.  Operation and maintenance
6.  Management of change
7.  Decommissioning

The upfront phases (design, engineering, commissioning) tend to get attention because they're tied to project budgets and timelines. The operational phases are where discipline erodes. Proof tests fall behind schedule. Bypasses stay in place longer than they should. Change management becomes informal.

These gaps don't announce themselves. They compound quietly until a demand event reveals how far the actual system has drifted from what the documentation describes.

## What functional safety management actually looks like

IEC 61511 requires a Functional Safety Management (FSM) system: procedures, competency frameworks, documentation controls, and audit processes governing how the safety lifecycle is managed at your site.

Three areas that plant managers tend to underestimate:

**Competency.** Having qualified people on your org chart isn't enough. The people performing SIS activities (engineers, technicians, operators) need to be demonstrably competent for the specific tasks they carry out. The 2016 edition strengthened this requirement considerably. Records matter; intentions don't.

**Proof testing.** A SIS sits dormant until it's needed. Failures hide inside it without triggering any alarm. Proof testing at defined intervals is how you find those failures before a real demand does. Skipping or deferring these tests is one of the most common ways sites quietly accumulate risk they can't see.

**Management of change.** Equipment gets swapped, setpoints shift, logic gets modified. Each change can affect a safety function. A weak MOC process is where IEC 61511 compliance falls apart at operating facilities, usually without anyone noticing until it's too late.

## The 2026 update

IEC 61511:2026 was published in February 2026. It strengthens requirements around cybersecurity (a formal security risk assessment is now expected), competency demonstration, and how failure rate data for field devices must be substantiated. If your SIS connects to broader plant networks, the cybersecurity piece deserves attention now rather than later.

## Why this matters in South Africa

South Africa's process sector spans petrochemicals (Sasol, Natref), mining and minerals processing, power generation, and chemical manufacturing. SIS failures in these industries have serious consequences. The MHI Regulations introduced clearer compliance timelines in 2022, and regulatory scrutiny has grown since.

The business case isn't complicated. A properly run functional safety program reduces unplanned downtime, supports better asset decisions, and produces documentation that holds up when regulators or insurers come asking questions. A poorly run one produces paperwork that looks fine right up until the moment it actually matters.

## Where to start

If you're not sure where your facility stands:

1.  Commission a gap analysis against IEC 61511. A Functional Safety Assessment (FSA) by a qualified independent party will tell you what's missing.
2.  Confirm your proof testing schedule is current and that results are documented and acted on.
3.  Review competency records for the people responsible for SIS activities.
4.  Make sure your MOC process explicitly captures safety instrumented system impacts.
5.  If your SIS connects to plant or corporate networks, get a cybersecurity risk review started.

The engineering requirements in IEC 61511 are demanding. The management discipline required to sustain them over decades is harder. Sites that treat functional safety as a one-time project deliverable tend to find out what they've missed at the worst possible time.`;

// Extract title from first H1
const extractTitle = (content: string): string => {
  const h1Match = content.match(/^#\s+(.+)$/m);
  return h1Match ? h1Match[1] : 'Insight Article';
};

// Calculate reading time (average 200 words per minute)
const calculateReadingTime = (content: string): number => {
  const words = content.trim().split(/\s+/).length;
  return Math.ceil(words / 200);
};

// Pre-calculate values outside component
const title = extractTitle(markdownContent);
const readingTime = calculateReadingTime(markdownContent);
const detailTags = ["Functional Safety", "IEC 61511", "Safety Instrumented Systems"];
const reviewedDate = 'March 2026';

const articleJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: 'Understanding IEC 61511: What Plant Managers in South Africa Need to Know',
  description:
    'IEC 61511 governs safety instrumented systems across South African process plants. Learn what plant managers need to know about SIL, SIS design, and OHS Act compliance.',
  image: 'https://touchteq.co.za/IEC.jpeg',
  author: { '@type': 'Person', name: 'Thabo Matona', jobTitle: 'Founder and Principal Engineer' },
  publisher: {
    '@type': 'Organization',
    name: 'Touch Teq Engineering Services',
    logo: 'https://touchteq.co.za/TT-logo-orange-trans.png',
  },
  dateModified: '2026-03-30T00:00:00Z',
  reviewedBy: { '@type': 'Person', name: 'Thabo Matona' },
  mainEntityOfPage: 'https://touchteq.co.za/insights/iec-61511-plant-managers',
  keywords:
    'IEC 61511, Safety Instrumented Systems, SIL, SIS, Process Safety, OHS Act, South Africa, Plant Management',
};

interface AudioPlayerProps {
  audioSrc?: string;
}

function AudioPlayer({ audioSrc }: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
    };

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
    };
  }, []);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
    setIsPlaying(!isPlaying);
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleSeek = (e: ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current;
    if (!audio) return;
    const newTime = parseFloat(e.target.value);
    audio.currentTime = newTime;
    setCurrentTime(newTime);
  };

  if (!audioSrc) return null;

  return (
    <div className="bg-[#1A2B4C] rounded-lg p-4 mb-8">
      <audio ref={audioRef} src={audioSrc} preload="metadata" />

      <div className="flex items-center gap-4">
        <button
          onClick={togglePlay}
          className="w-10 h-10 bg-orange-500 hover:bg-orange-600 rounded-full flex items-center justify-center text-white transition-colors flex-shrink-0"
        >
          {isPlaying ? <Pause size={18} /> : <Play size={18} className="ml-0.5" />}
        </button>

        <div className="flex-1 min-w-0">
          <input
            type="range"
            min={0}
            max={duration || 100}
            value={currentTime}
            onChange={handleSeek}
            className="w-full h-1 bg-slate-600 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-orange-500 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer"
          />
          <div className="flex justify-between mt-1">
            <span className="text-slate-400 text-xs">{formatTime(currentTime)}</span>
            <span className="text-slate-400 text-xs">{formatTime(duration)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function InsightsDetailPage() {
  return (
    <main className="bg-white min-h-screen font-sans">
      <BreadcrumbJsonLd
        items={[
          { name: 'Home', url: 'https://touchteq.co.za' },
          { name: 'Insights', url: 'https://touchteq.co.za/insights' },
          { name: 'IEC 61511 for Plant Managers', url: 'https://touchteq.co.za/insights/iec-61511-plant-managers' },
        ]}
      />
      <JsonLd data={articleJsonLd} />
      <Header />

      {/* Hero Section */}
      <section className="pt-32 pb-24 md:pt-48 md:pb-32 bg-[#1A2B4C] relative overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
          <Image
            src="/IEC.jpeg"
            alt=""
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#1A2B4C] via-[#1A2B4C]/50 to-transparent"></div>
        </div>
        <div className="container mx-auto px-4 md:px-8 relative z-10">
          <Link
            href="/insights"
            className="inline-flex items-center text-orange-500 font-black text-xs uppercase tracking-widest mb-8 hover:text-orange-400 transition-colors"
          >
            <ArrowLeft size={14} className="mr-2" />
            Back to Insights
          </Link>

          <div className="flex flex-wrap items-center gap-4 mb-6">
            <span className="bg-orange-500 text-white px-3 py-1 rounded-sm text-[10px] font-black uppercase tracking-widest">
              Industry Standards
            </span>
            <div className="flex items-center text-slate-400 text-xs">
              <Clock size={12} className="mr-1" />
              {readingTime} min read
            </div>
            <div className="flex flex-wrap gap-2">
              {detailTags.map((tag, index) => (
                <span key={tag} className="text-slate-400 text-[10px] font-medium uppercase tracking-wider">
                  {index > 0 && <span className="text-slate-600 mx-1">·</span>}{tag}
                </span>
              ))}
            </div>
          </div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl md:text-5xl lg:text-6xl font-black text-white uppercase tracking-tight leading-tight max-w-4xl"
          >
            {title}
          </motion.h1>
        </div>
      </section>

      {/* Article Content */}
      <section className="py-16">
        <div className="container mx-auto px-4 md:px-8">
          <article className="max-w-[720px] mx-auto">
            <ShareButton
              title="Understanding IEC 61511: What Plant Managers in South Africa Need to Know"
              description="IEC 61511 governs safety instrumented systems across South African process plants. Learn what plant managers need to know about SIL, SIS design, and OHS Act compliance."
              url="https://touchteq.co.za/insights/iec-61511-plant-managers"
              className="mb-6"
            />

            {/* Audio Player */}
            <AudioPlayer audioSrc="/content/audio/IEC_61511_Insight_Post.mp3" />

            <div className="text-base leading-relaxed">
              <ReactMarkdown
                components={{
                  h1: ({ children }) => <h1 className="hidden">{children}</h1>,
                  h2: ({ children }) => <h2 className="text-[#1A2B4C] text-2xl md:text-3xl font-black uppercase tracking-tight mt-12 mb-6 first:mt-0">{children}</h2>,
                  h3: ({ children }) => <h3 className="text-[#1A2B4C] text-xl font-black uppercase tracking-tight mt-8 mb-4">{children}</h3>,
                  p: ({ children }) => <p className="text-slate-600 text-base leading-relaxed mb-6 font-medium">{children}</p>,
                  strong: ({ children }) => <strong className="text-[#1A2B4C] font-bold">{children}</strong>,
                  ul: ({ children }) => <ul className="list-disc list-inside space-y-2 mb-6 pl-4 text-slate-600">{children}</ul>,
                  ol: ({ children }) => <ol className="list-decimal list-inside space-y-2 mb-6 pl-4 text-slate-600">{children}</ol>,
                  li: ({ children }) => <li className="text-slate-600 text-base leading-relaxed mb-2">{children}</li>,
                  hr: () => <hr className="my-12 border-slate-200" />,
                  blockquote: ({ children }) => (
                    <blockquote className="border-l-4 border-orange-500 pl-6 py-2 my-8 italic text-slate-500">
                      {children}
                    </blockquote>
                  ),
                }}
              >
                {markdownContent}
              </ReactMarkdown>

              <div className="mt-16 pt-8 border-t border-slate-200"></div>
              <ArticleAuthorityBox
                updated={reviewedDate}
                topics={['Functional safety', 'IEC 61511', 'Safety instrumented systems', 'Process plant compliance']}
              />
            </div>
          </article>
        </div>
      </section>

      {/* Risk Assessment CTA */}
      <section className="py-16 bg-[#1A2B4C]">
        <div className="container mx-auto px-4 md:px-8">
          <div className="max-w-[720px] mx-auto">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-8 md:p-12 text-center">
              <p className="text-orange-500 text-xs font-black uppercase tracking-[0.3em] mb-4">
                Take Action
              </p>
              <h3 className="text-white text-2xl md:text-3xl font-black uppercase tracking-tight mb-4">
                Assess Your Facility&apos;s Fire & Gas Risk for Free
              </h3>
              <p className="text-slate-300 text-sm leading-relaxed mb-8">
                Takes 2 minutes. Get an instant gap analysis of your safety documentation, detector coverage, and compliance status.
              </p>
              <Link
                href="/risk-assessment"
                className="group inline-flex items-center bg-orange-500 hover:bg-orange-600 text-white px-8 py-4 rounded-md font-black text-xs uppercase tracking-widest transition-all shadow-lg shadow-orange-500/20"
              >
                Start Free Risk Assessment
                <ArrowRight size={16} className="ml-3 group-hover:translate-x-1 transition-transform" />
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
