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
import BreadcrumbJsonLd from '@/components/seo/BreadcrumbJsonLd';

const markdownContent = `# Hazardous Area Classification in Southern Africa

Walk into any refinery, chemical plant, gas processing facility, or underground mine in Southern Africa and you'll find equipment that was selected and installed based on how the surrounding space was classified. That process is Hazardous Area Classification, or HAC. If your site handles flammable gases, vapours, or combustible dust, you're legally required to do it.

## What HAC is (and what it isn't)

HAC identifies the three-dimensional spaces where a flammable or explosive atmosphere could form in concentrations high enough to need ignition-source controls. The deliverable is a zone map: a documented, site-specific record of where explosive atmospheres can occur, how often, and for how long.

It's not a full risk assessment. Classification tells you where the hazard may exist. It doesn't evaluate what happens if ignition occurs, and it doesn't replace a process hazard analysis. But it's the foundation that everything else builds on. Equipment selection, installation standards, inspection intervals, maintenance procedures: all of these follow from the classification. Get it wrong and every decision downstream inherits the error.

The technical framework comes from two IEC standards: IEC 60079-10-1 for explosive gas atmospheres and IEC 60079-10-2 for explosive dust atmospheres. South Africa adopts these as SANS 60079-10-1 and SANS 60079-10-2 under SANS 10108, the primary standard for classification and equipment selection in the country. The 7th edition of SANS 10108 was published in February 2023.

## The legal position in South Africa

HAC is a legal requirement, not a guideline.

Under the Occupational Health and Safety Act (Act 85 of 1993) and its Electrical Machinery Regulations (Clause 9.1), every employer must identify all hazardous locations and classify them in accordance with the applicable standards. You cannot operate electrical machinery where flammable gases, vapours, or dusts are present unless the location has been formally classified and the equipment matches.

Mining falls under separate authority: the Mine Health and Safety Act (Act 29 of 1996), enforced by the Department of Mineral Resources and Energy. This matters more than people realise. Underground coal mines deal with methane and suspended coal dust in ways that need a completely different engineering approach. Equipment certified for a surface petrochemical plant is not automatically suitable underground. Different regulators, different equipment groups, different rules. Don't treat them as interchangeable.

Non-compliance carries real consequences: fines, operational shutdown, and in serious cases, criminal liability for plant owners and responsible persons.

## The zone system

Southern Africa uses the IEC zone system, not the North American division system. If you're working with equipment or drawings from the US, keep that in mind.

**For gas, vapour, and mist hazards:**

*   **Zone 0:** Explosive atmosphere present continuously or for long periods (more than 1,000 hours per year)
*   **Zone 1:** Likely to occur occasionally in normal operation (10 to 1,000 hours per year)
*   **Zone 2:** Unlikely in normal operation, brief if it occurs (under 10 hours per year)

**For combustible dust:**

*   **Zone 20:** Dust cloud present continuously or for long periods
*   **Zone 21:** Dust cloud likely in normal operation occasionally
*   **Zone 22:** Dust cloud unlikely in normal operation, brief if it occurs

Dust hazards are underestimated at far too many facilities. Grain storage, flour milling, woodworking, and certain chemical processing operations all generate combustible dust. A settled dust layer on a surface can ignite and feed a larger explosion. If your site handles powders or generates fine particulates, dust zone classification belongs in your HAC study, not as something you get to later.

## How classification is done

A proper HAC study follows a structured process:

1.  Identify the flammable substances on site using safety data sheets and process data.
2.  Identify sources of release (continuous, normal operation, or abnormal/unplanned).
3.  Assess ventilation and how far a flammable atmosphere could realistically extend.
4.  Consider internal spaces of equipment where flammable material and air may mix.
5.  Map zone boundaries in three dimensions.
6.  Document and maintain the classification as a live record.

Classification must be carried out by a qualified engineer or a competent person with relevant knowledge of the process, the equipment, and the applicable standards. A team approach works better. Process, production, maintenance, and safety staff all hold information that a single engineer working alone simply won't have.

For complex or new plants, HAC should draw from a broader process hazard study such as a HAZOP or PHA, particularly where atmospheric dispersion modelling is needed.

## Equipment selection and certification

Once you've established zones, electrical equipment in those areas must match the classification. Equipment is categorised by Equipment Protection Level (EPL):

*   **Zone 0 / Zone 20:** EPL Ga or Da (intrinsic safety or encapsulation)
*   **Zone 1 / Zone 21:** EPL Gb or Db (flameproof, increased safety, or intrinsic safety)
*   **Zone 2 / Zone 22:** EPL Gc or Dc (non-sparking, restricted breathing, or energy-limited)

In South Africa, explosion-protected apparatus must hold a valid Inspection Authority (IA) certificate issued by an Approved Test Laboratory, such as MASC or Explolabs. This is a legal prerequisite for installation. IA certificates have a 10-year validity period, unlike ATEX or IECEx certificates which don't expire.

Imported equipment certified under ATEX or IECEx may be accepted without full re-testing, but it still needs to meet local certification requirements before installation. A European certificate on its own doesn't clear the equipment for use on a South African site.

All Ex equipment installations require Certificates of Compliance (COCs), which must be obtained and maintained.

## Beyond South Africa

South Africa has the most developed regulatory and accreditation infrastructure for this work on the continent. MASC is the only IECEx-accredited certification body and test laboratory in Sub-Saharan Africa. The South African Flameproof Association (SAFA) provides liaison between industry, regulators, and international standards bodies.

Across the wider SADC region, the technical approach is broadly IEC-based. Similar zone language and equipment standards apply in Namibia, Botswana, Zimbabwe, and elsewhere. But the legal trigger, approval path, and enforcement body differ by country. SADCAS provides accreditation services across 13 SADC member states that don't have their own national bodies.

If your operations extend beyond South Africa, the technical framework translates reasonably well. But verify the specific regulatory requirements in each country. South African compliance does not automatically satisfy another jurisdiction's legal obligations.

## Where it goes wrong

The same mistakes keep showing up, and most of them are avoidable:

*   Treating the HAC drawing as a once-off deliverable instead of a live document that needs updating when anything changes.
*   Classifying gas hazards but missing combustible dust hazards on the same site.
*   Using equipment labels as the only check, without verifying that the EPL matches the zone and the specific gas or dust group.
*   Applying surface-plant logic to mining environments.
*   Not updating the classification after process modifications, layout changes, or new equipment.

A HAC study that was accurate five years ago may not reflect what's happening on the plant today. Every time ventilation changes, process conditions shift, or new equipment comes in, the classification should be reviewed. That's how a site that started with a solid study quietly accumulates risk.

## What a well-managed site should have

*   A site-specific HAC study, not a copied template from another facility.
*   Zone drawings that are current, version-controlled, and reflect the actual plant layout.
*   Equipment registers that cross-reference EPL requirements against what's installed.
*   Valid IA certificates and COCs for all Ex equipment.
*   A clear trigger for classification review within the management of change process.
*   Qualified, competent people involved in any classification, selection, or inspection work.

All of this traces back to the zone map. If the classification is wrong or outdated, the rest falls apart.

*This article is a general overview for engineering and operations teams. For site-specific hazardous area classification studies, zone drawings, or equipment selection guidance, consult a qualified engineer with experience in SANS 10108, IEC 60079, and relevant process industry standards.*`;

const title = "A Guide to Hazardous Area Classification in Southern Africa";
const wordCount = markdownContent.trim().split(/\s+/).length;
const readingTime = Math.round(wordCount / 200);
const detailTags = ["Hazardous Areas", "SANS 10108", "IEC 60079"];
const reviewedDate = 'March 2026';

const articleJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: 'A Guide to Hazardous Area Classification in Southern Africa',
  description:
    'A practical guide to hazardous area classification for Southern African facilities. Covers SANS 10108, IEC 60079, zone classification, and equipment selection requirements.',
  image: 'https://touchteq.co.za/HAC.jpg',
  author: { '@type': 'Person', name: 'Thabo Matona', jobTitle: 'Founder and Principal Engineer' },
  publisher: {
    '@type': 'Organization',
    name: 'Touch Teq Engineering Services',
    logo: 'https://touchteq.co.za/TT-logo-orange-trans.png',
  },
  dateModified: '2026-03-30T00:00:00Z',
  reviewedBy: { '@type': 'Person', name: 'Thabo Matona' },
  mainEntityOfPage: 'https://touchteq.co.za/insights/hazardous-area-classification-southern-africa',
  keywords:
    'Hazardous Area Classification, HAC, SANS 10108, IEC 60079, ATEX, Zone Classification, Explosive Atmospheres, South Africa',
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

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
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

export default function HACInsightsDetailPage() {
  return (
    <main className="bg-white min-h-screen font-sans">
      <BreadcrumbJsonLd
        items={[
          { name: 'Home', url: 'https://touchteq.co.za' },
          { name: 'Insights', url: 'https://touchteq.co.za/insights' },
          { name: 'Hazardous Area Classification', url: 'https://touchteq.co.za/insights/hazardous-area-classification-southern-africa' },
        ]}
      />
      <JsonLd data={articleJsonLd} />
      <Header />

      {/* Hero Section */}
      <section className="pt-32 pb-24 md:pt-48 md:pb-32 bg-[#1A2B4C] relative overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
          <Image
            src="/HAC.jpg"
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
              Hazardous Areas
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
              title="A Guide to Hazardous Area Classification in Southern Africa"
              description="A practical guide to hazardous area classification for Southern African facilities. Covers SANS 10108, IEC 60079, zone classification, and equipment selection requirements."
              url="https://touchteq.co.za/insights/hazardous-area-classification-southern-africa"
              className="mb-6"
            />

            {/* Audio Player - Pass audioSrc prop if available */}
            <AudioPlayer audioSrc="/content/audio/hac-southern-africa.mp3" />

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
                topics={['Hazardous area classification', 'SANS 10108', 'IEC 60079', 'Equipment selection in explosive atmospheres']}
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
