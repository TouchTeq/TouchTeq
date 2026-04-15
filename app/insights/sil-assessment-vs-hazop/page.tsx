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

const markdownContent = `# The difference between a SIL assessment and a HAZOP

These two studies come up together constantly in process safety conversations, and they get conflated just as often. A plant manager who has sat through both can usually describe what happened in the room. What's less common is a clear understanding of why they're different, why the sequence matters, and what each one actually produces.

## The short version

A HAZOP asks: what can go wrong in this process?

A SIL assessment asks: for the safety function we're relying on to prevent or mitigate that, how reliable does it need to be?

One finds the problem. The other defines the performance requirement for the instrumented solution. They answer different questions at different stages of the safety lifecycle, and neither replaces the other.

## What a HAZOP does

A Hazard and Operability Study is a structured, team-based examination of a process. The team works through the process node by node, applying standardised guide words (No, More, Less, Reverse, Other Than, among others) to process parameters like flow, pressure, temperature, and level.

For each combination, the team asks:

- What could cause this deviation?
- What happens if it occurs?
- What safeguards are already in place?
- Is the residual risk acceptable?
- What additional measures are needed?

The output is a register of hazard scenarios, causes, consequences, existing safeguards, and recommended actions. Some will be design changes. Some will be procedural. And some will be a recommendation that a Safety Instrumented Function (SIF) is needed to provide additional risk reduction.

This is the part people miss: the HAZOP identifies that instrumented protection may be required. It doesn't determine what level of reliability that protection must achieve. Those are two different questions, and the second one belongs to the SIL assessment.

A HAZOP is governed by IEC 61882 and is a qualitative study. The quality of the output depends heavily on the facilitator and the team in the room, which should include process engineers, operations staff, instrumentation and control engineers, maintenance representation, and HSE input.

## What a SIL assessment does

A SIL (Safety Integrity Level) assessment is performed once a SIF has been identified as necessary. Its purpose is to determine how much risk reduction that SIF must provide, expressed as a target SIL.

SIL levels run from 1 to 4:

- SIL 1: roughly 10-fold risk reduction
- SIL 2: 100-fold
- SIL 3: 1,000-fold
- SIL 4: 10,000-fold (rare in process industries)

The most common method for determining the required SIL is LOPA (Layer of Protection Analysis). LOPA takes the hazard scenario from the HAZOP, establishes the frequency of the initiating event, identifies the independent protection layers (IPLs) that can be credited, and calculates whether the residual risk after those IPLs meets the facility's tolerable risk target. If there's a gap, the SIF must close it, and the size of that gap determines the required SIL.

The assessment is governed by IEC 61508 (generic functional safety) and IEC 61511 (process industry sector). In South Africa, this aligns with the Major Hazard Installation Regulations framework for facilities where a SIS forms part of the risk reduction strategy.

## How the two studies connect

In practice the sequence looks like this:

1. HAZOP identifies hazard scenarios, causes, consequences, and existing safeguards
2. Risk evaluation determines whether existing safeguards are sufficient
3. Where they aren't, a SIF is proposed and a SIL assessment (typically via LOPA) determines the required SIL
4. The SIF is designed to meet that target
5. SIL verification confirms the design actually achieves the required probability of failure on demand

The HAZOP comes first. The SIL assessment depends on it. Without a rigorous HAZOP, the SIL assessment has no foundation: it lacks the scenarios, causes, consequences, and safeguard inventory that LOPA needs to produce a defensible result.

## A practical example

Consider a pressure vessel containing flammable liquid. During the HAZOP, the team examines the node for high pressure.

**HAZOP finding:**
The basic process control system pressure control valve could fail open, causing excessive feed, reactor overpressure, loss of containment, and a potential fire or explosion. Existing safeguards include a pressure alarm, operator response, and a pressure relief valve. The team recommends verifying that the proposed high-high pressure trip SIF meets the required SIL.

**SIL assessment (LOPA) result:**
The initiating event frequency (control valve failure) is 0.1 per year. The pressure relief valve is credited as an IPL with a probability of failure on demand of 0.01. Operator response to the alarm does not qualify as an IPL because it lacks the required independence from the basic process control system. The mitigated frequency without the SIF is 0.001 per year. The tolerable risk target is 0.00001 per year. The SIF needs to provide 100-fold risk reduction: SIL 2.

The HAZOP identified the problem. The SIL assessment set the performance requirement for the solution.

## Misconceptions worth correcting

**"A HAZOP establishes the SIL."**
No. A HAZOP may recommend that a SIF is needed and flag a scenario for SIL assessment. Assigning a SIL target requires a separate risk reduction calculation.

**"Every safeguard in the HAZOP becomes an IPL in LOPA."**
This catches people out regularly. To be credited as an IPL, a safeguard must meet strict criteria for independence, specificity, and auditability. Many safeguards that appear in HAZOP worksheets won't qualify.

**"Every hazard scenario from the HAZOP needs a SIL."**
Many scenarios are adequately addressed by non-instrumented safeguards, procedural controls, or inherently safer design. A SIF is only needed where instrumented protection is required to close a residual risk gap.

**"SIL is a property of a device."**
This one persists despite years of correction. There is no such thing as a SIL-rated transmitter or a SIL-rated control system. What exists are components with published failure rate data that make them suitable for use in a SIL-rated loop. The SIL is a property of the complete safety function: the sensor, logic solver, and final element together, including their architecture, redundancy, and maintenance regime.

**"SIL assessment and SIL verification are the same thing."**
Different activities, both required. The SIL assessment determines the required SIL. SIL verification confirms the designed system actually achieves it. Skipping verification after a correct assessment still leaves the question unanswered.

## What plant managers should take from this

If you manage a process facility, the distinction boils down to this: the HAZOP protects you from not seeing the hazard. The SIL assessment protects you from underdesigning the safety function once you've seen it.

Both need to be done properly. A weak HAZOP produces scenarios too vague to support rigorous LOPA. A SIL assessment without a proper HAZOP behind it produces targets that lack a defensible basis. And neither study is self-closing: the SIF still has to be designed, verified, installed, commissioned, proof-tested, and maintained.

In South Africa, for facilities covered by the Major Hazard Installation Regulations, functional safety documentation (HAZOP records, SIL determination basis, SRS, and verification calculations) forms part of the evidence base that regulators and insurers may request. Getting the studies right at the start is considerably cheaper than reconstructing them later.

*This article is a general overview. For site-specific hazard studies, SIL determination, or functional safety lifecycle support, consult a qualified functional safety engineer or certified HAZOP facilitator.*`;

const title = "The Difference Between a SIL Assessment and a HAZOP";
const wordCount = markdownContent.trim().split(/\s+/).length;
const readingTime = Math.round(wordCount / 200);
const detailTags = ["Functional Safety", "SIL Assessment", "HAZOP"];
const reviewedDate = 'March 2026';

const articleJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: 'SIL Assessment vs HAZOP: Understanding the Difference',
  description:
    'SIL assessments and HAZOPs are both essential but serve different purposes. This guide explains the difference in plain terms for process safety professionals.',
  image: 'https://touchteq.co.za/SIL-HAZOP.jpeg',
  author: { '@type': 'Person', name: 'Thabo Matona', jobTitle: 'Founder and Principal Engineer' },
  publisher: {
    '@type': 'Organization',
    name: 'Touch Teq Engineering Services',
    logo: 'https://touchteq.co.za/TT-logo-orange-trans.png',
  },
  dateModified: '2026-03-30T00:00:00Z',
  reviewedBy: { '@type': 'Person', name: 'Thabo Matona' },
  mainEntityOfPage: 'https://touchteq.co.za/insights/sil-assessment-vs-hazop',
  keywords:
    'SIL Assessment, HAZOP, LOPA, Process Safety, IEC 61511, Functional Safety, Safety Instrumented Function',
};

interface AudioPlayerProps {
  audioSrc?: string;
}

function AudioPlayer({ audioSrc }: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
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

  const changeSpeed = (speed: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.playbackRate = speed;
    setPlaybackSpeed(speed);
  };

  const speedOptions = [1, 1.5, 2];

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

        <div className="flex items-center gap-1 ml-2">
          {speedOptions.map((speed) => (
            <button
              key={speed}
              onClick={() => changeSpeed(speed)}
              className={`px-2 py-1 text-xs rounded transition-colors ${
                playbackSpeed === speed
                  ? 'bg-orange-500 text-white'
                  : 'bg-slate-600 text-slate-300 hover:bg-slate-500'
              }`}
            >
              {speed}x
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function SILHAZOPInsightsDetailPage() {
  return (
    <main className="bg-white min-h-screen font-sans">
      <BreadcrumbJsonLd
        items={[
          { name: 'Home', url: 'https://touchteq.co.za' },
          { name: 'Insights', url: 'https://touchteq.co.za/insights' },
          { name: 'SIL Assessment vs HAZOP', url: 'https://touchteq.co.za/insights/sil-assessment-vs-hazop' },
        ]}
      />
      <JsonLd data={articleJsonLd} />
      <Header />

      {/* Hero Section */}
      <section className="pt-32 pb-24 md:pt-48 md:pb-32 bg-[#1A2B4C] relative overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
          <Image
            src="/SIL-HAZOP.jpeg"
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
            <span className="bg-orange-500 text-white px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
              Functional Safety
            </span>
            <span className="inline-flex items-center text-slate-400 text-xs font-medium px-3 py-1 rounded-full border border-slate-300">
              <Clock size={12} className="mr-1.5" />
              {readingTime} min read
            </span>
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
              title="SIL Assessment vs HAZOP: Understanding the Difference"
              description="SIL assessments and HAZOPs are both essential but serve different purposes. This guide explains the difference in plain terms for process safety professionals."
              url="https://touchteq.co.za/insights/sil-assessment-vs-hazop"
              className="mb-6"
            />

            {/* Audio Player */}
            <AudioPlayer audioSrc="content/audio/sil-vs-hazop.mp3" />

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
                topics={['Functional safety', 'SIL assessment', 'HAZOP', 'Layer of protection analysis']}
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
