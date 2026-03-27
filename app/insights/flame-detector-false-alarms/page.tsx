'use client';
import { useState, useRef, useEffect } from 'react';
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

const markdownContent = `# Top 5 Reasons for False Alarms in Optical Flame Detectors

A false alarm from an optical flame detector is easy to dismiss as an inconvenience. It rarely stays that way. Unnecessary shutdowns cost money. Repeated false alarms erode operator confidence in the system — and once a team stops trusting their fire and gas detection, they start ignoring alerts. That's the real danger.

Optical flame detectors — UV, IR, UV/IR, IR3, and multi-spectrum types — don't simply "see fire." They analyse specific radiation wavelengths and, in more advanced designs, the flicker pattern characteristic of combustion. False alarms happen when something else in the plant environment produces a signal that looks close enough to fool the detector. Most of the time, the cause is predictable and preventable.

Here are the five most common reasons.

---

## 1. Hot Work — Welding, Cutting, Grinding

This is the most frequent culprit at operating plants, and it catches facilities off guard more than it should.

Arc welding produces intense broadband UV radiation that falls squarely within the detection band of UV sensors. IR detectors respond to the radiant heat from sparks, molten metal droplets, and the general thermal output of gas cutting operations. Even a brief burst of hot work inside a detector's field of view can look convincingly like a real flame event.

The problem compounds with UV/IR combination detectors. If a strong IR source from a hot process surface is already partially satisfying the IR channel, the detector effectively behaves like a single-band UV detector — and becomes more susceptible to welding arcs and electrical discharges triggering a full alarm.

**What helps:** A strict hot work permit system with formal detector inhibition procedures. Not ad hoc bypassing — controlled inhibition under a documented management of change process, with the inhibit logged, time-limited, and signed off. Detectors in areas with routine maintenance activity should also be reviewed for repositioning or physical shielding during the design phase.

---

## 2. Sunlight and Reflective Surfaces

Sunlight alone doesn't typically trip a well-specified modern detector. The problem is what sunlight does when it bounces off polished stainless steel, glass surfaces, vehicle windscreens, standing water, or rotating equipment.

A changing reflection can mimic the 1–20 Hz flicker frequency that flame detectors use to distinguish a real fire from steady background radiation. Sunrise and sunset transitions are particularly problematic — the angle of light changes rapidly, and reflections that didn't exist an hour ago suddenly do.

For outdoor Southern African installations specifically, solar loading is a real factor. The intensity of direct and reflected sunlight here is not the same as a covered process area in a temperate climate. Detectors without proper solar-blind filtering at the 4.3 µm CO₂ resonance band are not suitable for outdoor use — and some cheaper IR detectors marketed for outdoor applications fall short in practice.

**What helps:** Conduct coverage mapping studies that include walking the site at different times of day. Avoid aiming detectors toward known reflective surfaces. Optical hoods and sunshades are inexpensive compared to the cost of a nuisance shutdown. For outdoor hydrocarbon applications, IR3 or multi-spectrum IR (MSIR) detectors offer significantly better immunity.

---

## 3. Hot Process Equipment and Blackbody Radiation

Furnaces, heat exchangers, flare stacks, turbine exhausts, hot piping, and heaters all radiate infrared energy continuously. By itself, that steady-state radiation is usually manageable — most modern IR detectors are designed to filter it out.

The problem is modulation. When that same radiation is interrupted — by a vehicle passing through the line of sight, fan blades rotating, personnel walking past, or even a detector swaying in wind — the previously steady IR source starts flickering. That flickering pattern can look exactly like a flame to a single or dual-band IR detector.

Turbine and engine exhaust gases present a specific challenge for IR3 detectors because hot CO₂ from combustion exhaust is precisely the signature IR3 technology is designed to detect. Applications like road and rail tanker loading racks or aircraft hangars require either specialised detector configurations or a different technology choice entirely.

**What helps:** Choose detector technology appropriate to the specific radiation environment, not just the fire hazard. Perform a radiation survey during the F&G mapping phase to identify normal process hot spots and exclude them from detector fields of view where possible. IR3 and MSIR detectors with multi-wavelength ratio discrimination are more effective than single-band IR in environments with significant background thermal radiation.

---

## 4. Poor Installation and Incorrect Configuration

This one is often misdiagnosed as a detector fault. The hardware is fine. The problem is where it's pointing and how it's set.

Common issues include detectors aimed too broadly across active work areas or plant roads, sensitivity set higher than the actual hazard requires, time delays configured too short, and fields of view that weren't verified after commissioning. In some cases, detectors are simply the wrong type for the application — a UV detector specified for an outdoor area where solar loading will cause chronic nuisance trips.

Overlapping fields of view without appropriate voting logic is another design issue that shows up in alarm histories. Two detectors covering the same zone without a 2-of-2 or 2-of-3 voting configuration means any single false trigger goes straight through to alarm.

This category of false alarm is really a design and commissioning failure, not an operational one. It's worth reviewing early alarm history carefully after startup — the pattern usually makes the cause obvious.

**What helps:** Base detector placement on a proper fire and gas mapping study tied to the site-specific hazard analysis. Verify settings against the Safety Requirements Specification. Post-commissioning walk-downs with alarm history review should be a standard part of the F&G system handover process.

---

## 5. Contaminated Optics and Harsh Environmental Conditions

Dirty detector windows affect performance in ways that aren't always obvious. Heavy contamination more commonly reduces sensitivity — the detector goes partially blind without triggering any alarm, which is arguably worse than a false alarm. But in marginal or transitional contamination states, unstable signals and nuisance trips can occur.

Common contaminants in Southern African process environments include dust and sand, oil mist from process equipment, salt spray at coastal facilities, condensation and ice in cold climate installations, and insects or spider webs obstructing the lens. Water on the optical window absorbs significantly in the mid-band IR range where most IR, IR3, and UV/IR detectors operate — it doesn't just scatter the signal, it changes it.

One detail worth knowing: optical self-test fault indicators in most detectors activate only after sensitivity has already dropped by around 50%. By that point, a fire would need to be roughly four times its normal detectable size to register. The fault indicator is a lagging signal, not an early warning.

**What helps:** Scheduled cleaning on a defined interval, adjusted for actual site conditions — quarterly or monthly at dirty or coastal sites, not just annually. Weather shields and air-purge systems where the environment warrants it. Detectors with heated optics in cold or wet locations. And self-diagnostic features should be understood for what they are: a backstop, not a substitute for regular inspection.

---

## The Pattern Behind the Problem

False alarms in optical flame detectors are rarely random. They follow predictable patterns tied to site conditions, detector selection, installation decisions, and maintenance discipline. In the context of IEC 61511, a high nuisance trip rate isn't just an operational nuisance — it degrades SIS availability and creates pressure to bypass detectors, which undermines the entire safety layer.

The fixes are usually straightforward once the root cause is identified. The challenge is building the maintenance records and alarm history review discipline to catch problems early, before they become habitual.

---

*This article is intended as a general technical overview. Detector selection, placement, and configuration should be carried out by qualified fire and gas engineers with site-specific knowledge.*`;

const title = "Top 5 Reasons for False Alarms in Optical Flame Detectors";
const wordCount = markdownContent.trim().split(/\s+/).length;
const readingTime = Math.round(wordCount / 200);
const detailTags = ["Fire & Gas", "Flame Detectors", "Maintenance"];
const publishedDate = '2024-03-01';
const reviewedDate = '2026-03-24';

const articleJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: 'Top 5 Reasons for False Alarms in Optical Flame Detectors',
  description:
    'False alarms in optical flame detection systems cost time and money. Discover the five most common causes and how to eliminate them in your facility.',
  image: 'https://touchteq.co.za/optical-flame-detector.jpeg',
  author: { '@type': 'Person', name: 'Thabo Matona', jobTitle: 'Founder and Principal Engineer' },
  publisher: {
    '@type': 'Organization',
    name: 'Touch Teq Engineering Services',
    logo: 'https://touchteq.co.za/TT-logo-orange-trans.png',
  },
  datePublished: `${publishedDate}T00:00:00Z`,
  dateModified: `${reviewedDate}T00:00:00Z`,
  reviewedBy: { '@type': 'Person', name: 'Thabo Matona' },
  mainEntityOfPage: 'https://touchteq.co.za/insights/flame-detector-false-alarms',
  keywords:
    'False Alarms, Optical Flame Detectors, Fire Detection, Maintenance, Industrial Safety, Fire & Gas',
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

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
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

export default function FlameDetectorInsightsDetailPage() {
  return (
    <main className="bg-white min-h-screen font-sans">
      <JsonLd data={articleJsonLd} />
      <Header />
      
      {/* Hero Section */}
      <section className="pt-32 pb-24 md:pt-48 md:pb-32 bg-[#1A2B4C] relative overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
          <Image
            src="/optical-flame-detector.jpeg"
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
              title="Top 5 Reasons for False Alarms in Optical Flame Detectors"
              description="False alarms in optical flame detection systems cost time and money. Discover the five most common causes and how to eliminate them in your facility."
              url="https://touchteq.co.za/insights/flame-detector-false-alarms"
              className="mb-6"
            />
            
            {/* Audio Player - Pass audioSrc prop if available */}
            <AudioPlayer audioSrc="/content/audio/flame-detector-false-alarms.mp3" />
            
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
              
              {/* Disclaimer */}
              <div className="mt-16 pt-8 border-t border-slate-200">
                <p className="text-slate-400 text-sm italic leading-relaxed">
                  This article is intended as a general technical overview. Detector selection, placement, and configuration should be carried out by qualified fire and gas engineers with site-specific knowledge.
                </p>
              </div>
              <ArticleAuthorityBox
                published={publishedDate}
                updated={reviewedDate}
                topics={['Fire and gas detection', 'Optical flame detectors', 'Maintenance strategy', 'Alarm reduction']}
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
