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

const markdownContent = `# What to expect during a fire and gas system commissioning

There's a version of commissioning that most people have seen: a technician walks around with a clipboard, presses a test button on a detector, the panel beeps, and someone signs off a form. That's not commissioning. That's a functional check, and it's not enough to know whether a fire and gas system will actually perform when it's needed.

Proper F&G commissioning is a structured, documented process that proves the entire system, from field sensors through to logic, alarms, and physical outputs, works as designed in the real environment it's been installed in. It's the difference between a system that passed a test and a system you can rely on.

---

## Why the F&G system gets commissioned first

Before fuel systems, rotating equipment, or process systems are brought online, the fire and gas system needs to be ready. Every subsequent commissioning activity introduces hazards (hydrocarbons, pressure, heat) that the F&G system exists to detect and respond to. Commissioning it last, or in parallel with live process systems, removes the safety net before you know it works.

This sequencing is a fundamental principle, not a preference.

---

## The phases of a proper commissioning

### Pre-commissioning: before anything gets tested

Pre-commissioning is document and installation verification. Nothing gets powered up until this is done properly.

On the documentation side, the commissioning team should be working from the Fire and Gas Philosophy document, the Cause and Effect matrix, instrument index and loop diagrams, P&IDs, equipment data sheets, hazardous area classification drawings, and equipment certification records. Every piece of installed equipment needs to be traceable back to a document.

On the physical side, inspectors verify that detectors are mounted in the correct locations with correct orientations, that wiring terminations are complete with correct polarity, that cable insulation resistance meets specification, that earthing and bonding is in order, and that every device installed in a classified hazardous area carries the correct Ex certification for that zone. A Zone 1 area with Zone 2 rated equipment is a compliance failure before commissioning has even started.

In South Africa, fire detection and suppression work must be carried out by SAQCC Fire-registered competent persons. If that's not confirmed before the team arrives on site, it needs to be confirmed before they start work.

### Factory acceptance testing (FAT)

For larger or more complex systems, FAT happens at the manufacturer's facility before equipment ships to site. The logic solver is tested against simulated inputs, cause and effect matrices are verified, and wiring inside control cabinets is checked against project drawings.

Skipping FAT is a common project shortcut with a predictable outcome: logic errors and wiring faults that would take hours to resolve in a factory take days to diagnose and fix in the field. Not a place to save time.

For integrated plants, an Integrated FAT (IFAT) tests the F&G system alongside the Basic Process Control System and ESD system together, verifying that data passes correctly across the interfaces before anything leaves the factory.

### Power-up and panel commissioning

Once pre-commissioning is complete, the panel is energised and initial diagnostics are reviewed. Technicians verify supply voltages, check startup behaviour, confirm battery backup meets the specified standby duration, and review any fault conditions showing on the panel before field devices are connected.

This is also where the cause and effect logic gets a first review: checking that the programmed matrix matches the approved C&E document before any field testing begins.

### Loop testing and detector commissioning

Each field device is tested individually. For gas detectors, this means zero and span calibration with certified test gas, performed in sequence (zero before span). Skipping certified test gas or using the wrong gas concentration invalidates the calibration.

For optical flame detectors, end-to-end functional testing with an approved test lamp is required to confirm the optical path is clear and the detector is correctly aimed. Self-diagnostic indicators on the detector confirm internal health. They do not confirm that the detector is pointed at the right area, that nothing is obscuring its field of view, or that it will respond to an actual flame event. Those things only get confirmed by testing the full optical path.

Each loop test should be recorded by instrument tag, with the technician's name, date, result, and any corrective action taken.

### Cause and effect testing

This is the part that proves the logic. Inputs are simulated (a gas detector in alarm, a flame detector activating, a manual call point being triggered) and the team verifies that the programmed responses follow: which alarms sound, which beacons activate, which HVAC systems trip, which ESD signals are sent, which suppression outputs are enabled.

One important operational point: relay-activated outputs like deluge valves, suppression releases, and ESD trips should be inhibited or physically isolated before cause and effect testing begins. Triggering a deluge system in a live plant area to prove a logic response is not a test. It's an incident.

All inhibits applied during testing must be tracked and formally restored before handover. Bypasses left in place at startup are one of the most common and most dangerous commissioning close-out failures.

### Integrated systems testing

Once individual systems are proven, integrated testing confirms that the F&G system communicates correctly with everything else: the DCS, ESD system, HVAC controls, public address and general alarm systems, fire pumps, and any other interfaces defined in the design. A flame detector going into alarm should produce a specific, verifiable chain of responses across multiple systems. Integrated testing is how you confirm that chain actually works end to end.

---

## What gets handed over at the end

A properly closed-out commissioning produces a dossier that should include completed pre-commissioning checklists, loop test reports, cause and effect test records, functional performance test results, punch list items and their resolution status, as-built drawings reflecting any field changes, calibration certificates, and equipment certification documents.

This is not paperwork for its own sake. It's the baseline record for every proof test, modification, and audit that will happen over the life of the system. A commissioning dossier that's incomplete or poorly compiled becomes a problem the first time someone needs to demonstrate that the system was properly validated before startup.

Operations and maintenance staff should also receive formal training before the system is handed over. Not a walkthrough, but documented training covering system architecture, alarm response, bypass procedures, detector testing methods, and maintenance schedules. New staff join organisations constantly. If the training isn't documented, it doesn't transfer.

### Pre-startup safety review (PSSR)

Before hazardous chemicals or process fluids are introduced, a Pre-Startup Safety Review confirms that construction matches design specifications, operating and emergency procedures are in place, all HAZOP recommendations have been implemented, and operator training is complete. Under IEC 61511, this aligns with the Functional Safety Assessment required before startup.

The PSSR is the formal gate between a commissioned system and a live one. It shouldn't be treated as a formality.

---

## What plant managers should watch for

A few things consistently separate well-run commissioning campaigns from ones that create problems later:

**Anything still inhibited or bypassed at handover.** Get a written list of every inhibit applied during testing and confirm each one is restored and signed off before the system goes live.

**End-to-end detector testing, not just panel health.** If the commissioning report doesn't show test lamp results for flame detectors and certified test gas results for gas detectors, the detectors haven't been properly commissioned.

**Hazardous area compliance.** If any equipment in a classified area doesn't have the correct Ex certification for its zone, that needs to be resolved before startup, not retrospectively documented.

**Documentation completeness.** A commissioning dossier with gaps is a liability. Future modifications, proof test planning, and regulatory inspections all depend on having a complete baseline record.

**Proof test planning in place before handover.** The maintenance team should receive a proof test plan with defined intervals and procedures as part of the handover package. The period immediately after commissioning is not a maintenance-free honeymoon; it's when the system's real performance data starts accumulating.

---

## The South African regulatory context

In South Africa, F&G commissioning for process facilities intersects with the OHS Act, the Major Hazard Installation Regulations (2022), and SANS standards including SANS 10139 for fire detection and alarm systems and SANS 14520 for gaseous extinguishing systems. The Department of Employment and Labour's requirements for pre-startup confirmation of safety system readiness apply to major hazard installations, and SAQCC Fire registration requirements apply to the personnel doing the work.

For operations extending into other SADC countries, the technical approach translates well, but verify the specific regulatory requirements and approval authorities for each jurisdiction before assuming South African compliance carries across.

*This article is a general overview for plant operators and managers. For site-specific commissioning planning, scoping, or execution, consult a qualified fire and gas engineer with relevant process industry experience.*`;

const title = "What to Expect During a Fire and Gas System Commissioning";
const wordCount = markdownContent.trim().split(/\s+/).length;
const readingTime = Math.round(wordCount / 200);
const detailTags = ["Fire & Gas", "Commissioning", "IEC 61511"];
const reviewedDate = 'March 2026';

const articleJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: 'Fire and Gas System Commissioning: What to Expect',
  description:
    'Find out what a professional fire and gas system commissioning involves, what to prepare, and what to expect at each stage of the process.',
  image: 'https://touchteq.co.za/f&g.jpeg',
  author: { '@type': 'Person', name: 'Thabo Matona', jobTitle: 'Founder and Principal Engineer' },
  publisher: {
    '@type': 'Organization',
    name: 'Touch Teq Engineering Services',
    logo: 'https://touchteq.co.za/TT-logo-orange-trans.png',
  },
  dateModified: '2026-03-30T00:00:00Z',
  reviewedBy: { '@type': 'Person', name: 'Thabo Matona' },
  mainEntityOfPage: 'https://touchteq.co.za/insights/fire-and-gas-system-commissioning',
  keywords:
    'Fire & Gas Commissioning, F&G System, IEC 61511, Pre-Startup, PSSR, Fire Detection, Gas Detection',
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

export default function FGCommissioningInsightsDetailPage() {
  return (
    <main className="bg-white min-h-screen font-sans">
      <BreadcrumbJsonLd
        items={[
          { name: 'Home', url: 'https://touchteq.co.za' },
          { name: 'Insights', url: 'https://touchteq.co.za/insights' },
          { name: 'Fire and Gas System Commissioning', url: 'https://touchteq.co.za/insights/fire-and-gas-system-commissioning' },
        ]}
      />
      <JsonLd data={articleJsonLd} />
      <Header />

      {/* Hero Section */}
      <section className="pt-32 pb-24 md:pt-48 md:pb-32 bg-[#1A2B4C] relative overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
          <Image
            src="/f&g.jpeg"
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
              Fire & Gas
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
            className="text-3xl md:text-5xl lg:text-6xl font-black text-white uppercase tracking-tighter leading-tight max-w-4xl"
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
              title="Fire and Gas System Commissioning: What to Expect"
              description="Find out what a professional fire and gas system commissioning involves, what to prepare, and what to expect at each stage of the process."
              url="https://touchteq.co.za/insights/fire-and-gas-system-commissioning"
              className="mb-6"
            />

            {/* Audio Player */}
            <AudioPlayer audioSrc="content/audio/fg-commissioning.mp3" />

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
                topics={['Fire and gas commissioning', 'Pre-startup safety review', 'Cause and effect testing', 'IEC 61511']}
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
