import Image from 'next/image';
import Link from 'next/link';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Clock,
  Droplets,
  ExternalLink,
  Eye,
  FileClock,
  Flame,
  Focus,
  Radio,
  Search,
  Settings2,
  ShieldAlert,
  Sparkles,
  Sun,
  Wrench,
  Zap,
} from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import BackToTop from '@/components/BackToTop';
import ArticleAudioPlayer from '@/components/insights/ArticleAudioPlayer';
import ArticleAuthorityBox from '@/components/insights/ArticleAuthorityBox';
import BreadcrumbJsonLd from '@/components/seo/BreadcrumbJsonLd';
import FAQJsonLd from '@/components/seo/FAQJsonLd';
import JsonLd from '@/components/seo/JsonLd';
import { ShareButton } from '@/components/ui/share-button';

const articleUrl = 'https://www.touchteq.co.za/insights/flame-detector-false-alarms';
const contactHref = '/contact?service=Fire%20and%20Gas%20Detection%20Systems#request-quote';
const detailTags = ['Fire & Gas', 'Flame Detectors', 'Troubleshooting'];

const guideSections = [
  ['#first-response', 'First response'],
  ['#technology', 'How the technologies differ'],
  ['#cause-one', 'Interfering radiation'],
  ['#cause-two', 'Optics and obstruction'],
  ['#cause-three', 'Field of view and mounting'],
  ['#cause-four', 'Configuration and logic'],
  ['#cause-five', 'Electrical and system faults'],
  ['#examples', 'Model-family examples'],
  ['#diagnostics', 'What self-tests prove'],
  ['#workflow', 'Safe investigation sequence'],
  ['#maintenance', 'Maintenance checklist'],
  ['#sectors', 'Sector context'],
  ['#misconceptions', 'Five misconceptions'],
  ['#faqs', 'Frequently asked questions'],
  ['#sources', 'Sources and boundaries'],
] as const;

const technologies = [
  {
    icon: Zap,
    label: 'UV',
    sees: 'Ultraviolet radiation produced by combustion.',
    decides: 'The detector evaluates UV energy and, depending on the model, its pulse behaviour over time.',
    watch: 'Arc welding, electrical discharge, lightning and certain artificial UV sources can enter the same sensing band.',
  },
  {
    icon: Sun,
    label: 'Single IR',
    sees: 'Infrared energy in a selected combustion-related band.',
    decides: 'Signal level and flame-like time variation help distinguish a flame from a steady background.',
    watch: 'Hot equipment, modulated thermal backgrounds and exhaust or flare conditions can challenge the discrimination method.',
  },
  {
    icon: Radio,
    label: 'UV/IR',
    sees: 'A UV channel and an IR channel in the same detector.',
    decides: 'Coincidence logic requires both channels to satisfy the model’s fire criteria.',
    watch: 'It rejects many single-band interferents, but intense sources that stimulate both bands and contamination that weakens one channel still matter.',
  },
  {
    icon: Sparkles,
    label: 'IR3 / MSIR',
    sees: 'Several infrared bands rather than one band alone.',
    decides: 'Band relationships, signal dynamics and model-specific algorithms are compared before an alarm is declared.',
    watch: 'Immunity is relative—not absolute. Fuel, flare, exhaust, welding, geometry and sensitivity remain application-specific.',
  },
] as const;

const causeCards = [
  {
    id: 'cause-one',
    number: '01',
    icon: Flame,
    eyebrow: 'External optical stimulus',
    title: 'Interfering radiation or a real flame signature enters the field of view',
    body: 'Hot work, electrical arcs, hot process surfaces, engine or turbine exhaust, flares, lightning and reflected radiation do not affect every detector in the same way. The first useful question is therefore not “what is the universal cause?” but “what technology and model saw what source, from which direction, at that time?”',
    clues: ['Event aligns with welding, grinding, startup, flare or vehicle activity', 'Repeat occurs at a similar time of day or operating state', 'One detector alarms while others with a different view or technology remain normal'],
    checks: ['Preserve the detector and panel event records before changing settings', 'Correlate the timestamp with permits, process logs and weather', 'Walk the field of view from the detector position and look for direct and reflected paths'],
    boundary: 'Do not assume “welding” makes the event harmless. Gas cutting and other hot work can create a genuine fire, and site emergency and permit procedures take priority.',
  },
  {
    id: 'cause-two',
    number: '02',
    icon: Droplets,
    eyebrow: 'Optical path condition',
    title: 'Contaminated optics, weather or an obstruction changes what the detector can see',
    body: 'Dust, oil film, salt, paint overspray, condensation, ice, smoke, fog and physical obstructions usually create a sensitivity or fault problem before they create a true optical false alarm. Uneven contamination, changing shadows or interaction with another radiation source can nevertheless complicate the signal and the diagnosis.',
    clues: ['Dirty-window, optical-integrity or general fault appears before or after the event', 'The problem follows rain, wash-down, dust, coating or construction work', 'Scaffolding, sheeting, pipework or equipment has changed the line of sight'],
    checks: ['Inspect the viewing window and the complete external path—not only the detector face', 'Use only the cleaning method and materials in the exact model manual', 'Check weather shields, heaters, seals, drains and enclosure condition where fitted'],
    boundary: 'A passing internal optical check is not proof that the protected hazard remains visible through the external scene or that rated range is still available.',
  },
  {
    id: 'cause-three',
    number: '03',
    icon: Focus,
    eyebrow: 'Geometry and mechanical condition',
    title: 'Placement, orientation or mounting exposes the detector to the wrong scene',
    body: 'A detector can be healthy yet poorly applied. A field of view that includes a welding bay, hot exhaust, flare reflection, roadway or bright rotating equipment can repeatedly present the algorithm with unwanted signals. A loose or vibrating mount can also move the scene relative to a background source.',
    clues: ['The alarm history began after plant modification or detector replacement', 'The mounting arm is loose, damaged or exposed to vibration', 'The detector covers the hazard only near the edge of its directional response'],
    checks: ['Compare the as-found aim with current drawings and the coverage study', 'Inspect the mount, support and cable entries without altering the position first', 'Review new obstructions and interference sources across the full cone of vision'],
    boundary: 'Re-aiming, adding a shield or moving a detector can create a blind spot. Treat it as an engineering change and re-check coverage.',
  },
  {
    id: 'cause-four',
    number: '04',
    icon: Settings2,
    eyebrow: 'Performance settings and cause-and-effect',
    title: 'Sensitivity, verification time or system logic does not match the hazard and environment',
    body: 'Sensitivity, processing modes, alarm delays, latching and voting influence both unwanted-alarm exposure and real-fire response. The correct values are model- and project-specific. A setting that appears to solve one nuisance event can silently reduce detection performance or delay executive action.',
    clues: ['The issue follows commissioning, firmware, configuration or panel-logic work', 'Installed settings do not match the approved configuration record', 'A single detector event causes a shutdown even though the design basis expected voting'],
    checks: ['Capture as-found detector and panel configuration before alteration', 'Compare settings with the approved fire-and-gas philosophy and cause-and-effect', 'Confirm the exact model, mode, sensitivity and output mapping'],
    boundary: 'Reducing sensitivity, extending delay or changing voting is not a maintenance shortcut. It requires documented hazard review, approval and confirmation of the resulting coverage and response.',
  },
  {
    id: 'cause-five',
    number: '05',
    icon: Wrench,
    eyebrow: 'Detection chain rather than flame algorithm',
    title: 'Power, wiring, communication or enclosure faults are reported as an alarm event',
    body: 'Not every “false alarm” originated in the optical decision. Loose terminations, moisture ingress, power disturbance, grounding or shielding problems, communications faults and incorrect input mapping can create a spurious panel indication or confuse alarm and fault states.',
    clues: ['Detector local status and panel indication do not agree', 'Several devices fault together or the event follows a power disturbance', 'The event appears after enclosure, cable, junction-box or control-system work'],
    checks: ['Compare local LED, analogue output, relay state and panel event class', 'Check power and wiring using the exact OEM and site electrical procedures', 'Inspect glands, seals, drains, junction boxes and documented termination changes'],
    boundary: 'Do not use generic insulation-resistance or live-circuit tests on detector wiring. Some OEM manuals prohibit particular test methods; the installed model manual governs.',
  },
] as const;

const modelExamples = [
  ['Det-Tronics X3301', 'Multispectrum IR', 'Three IR sensors, event logging, selectable sensitivity and automatic optical-integrity checking. Its manual separates fire, fault and high-background conditions and gives model-specific controls for testing and maintenance.'],
  ['MSA FL5000', 'Multispectrum IR', 'Multiple IR inputs are classified by an advanced algorithm. MSA describes the family as using neural-network-based processing to improve rejection of lightning, reflected sunlight, arc welding and hot objects.'],
  ['Honeywell FS24X', 'Triple IR + visible', 'WideBand IR, a combustion-related IR band, visible sensing and dual processors are used for signal analysis, diagnostics, event records and model-specific false-alarm rejection.'],
  ['Dräger Flame 1500', 'IR3', 'Three IR wavelengths are compared with combustion-related CO₂ information and flame flicker. A heated window and optical verification support environmental robustness and diagnostics.'],
] as const;

const diagnosticLimits = [
  ['Can support', 'Power, electronics and defined internal optical-path checks are functioning at the time of the test.'],
  ['Can support', 'A model-specific contamination threshold or diagnostic condition has—or has not—been reached.'],
  ['Cannot prove', 'The detector still sees the entire intended hazard through the external field of view.'],
  ['Cannot prove', 'The selected model, sensitivity, placement and logic are correct for the site hazard.'],
  ['Cannot prove', 'A test lamp or internal check reproduces every fuel, distance, weather and background condition in the design basis.'],
] as const;

const investigationSteps = [
  ['01', 'Respond as a potential real event', 'Follow the site emergency response. Confirm the location and condition through authorised means before classifying the indication as unwanted.'],
  ['02', 'Preserve evidence', 'Record detector tag, panel event class, exact times, duration, local indication and any alarms, faults or inhibits around the event.'],
  ['03', 'Correlate the plant context', 'Check hot-work permits, process transitions, flare or exhaust activity, maintenance, vehicle movement, weather and recent modifications.'],
  ['04', 'Inspect the scene and hardware', 'Under the required permit and access controls, inspect optics, line of sight, reflections, obstructions, mounting, enclosure, glands and junction boxes.'],
  ['05', 'Separate optical from electrical', 'Compare the detector’s local state and diagnostics with its analogue, relay or communications output and the control-system event record.'],
  ['06', 'Clean or correct only approved defects', 'Use the exact OEM procedure. Do not re-aim, desensitise, bypass or alter voting as an informal experiment.'],
  ['07', 'Perform the model-approved verification', 'Control extinguishing or shutdown outputs under the site procedure before a test that can actuate them. Use only the approved built-in test or compatible simulator method.'],
  ['08', 'Escalate unresolved patterns', 'Provide the OEM or competent F&G engineer with model, firmware, settings, event history, photographs, environmental context and as-found test results.'],
  ['09', 'Restore and close out', 'Confirm all protection, outputs and inhibits are restored; record as-found/as-left status and route any design change through management of change.'],
] as const;

const maintenanceChecks = [
  'Review detector and panel event histories for recurring time, weather or process patterns.',
  'Inspect the window, weather shield, mount, support, conduit entries, drains and enclosure condition.',
  'Confirm the external field of view remains clear after scaffolding, construction and plant changes.',
  'Clean only with the exact model’s approved materials and method; avoid residues and abrasive damage.',
  'Verify built-in diagnostics and carry out the approved functional test at the site-defined interval.',
  'Record detector tag, model, configuration, as-found condition, work performed, result and as-left status.',
  'Review sensitivity, delays and system logic against controlled documents—without changing them during routine inspection.',
  'Increase inspection frequency only from site evidence, environment, OEM instructions and the maintenance strategy—not a generic web interval.',
] as const;

const sectorNotes = [
  ['Oil, gas and chemicals', 'Flares, hot work, reflective plant, hydrocarbon films, corrosive atmospheres and changing process backgrounds can dominate the investigation.'],
  ['Mining and materials handling', 'Dust, vibration, mobile equipment, exhaust, welding and frequent changes to physical obstructions can alter both optics and field of view.'],
  ['Power generation', 'Turbine and engine exhaust, hot casings, boilers, steam and electrical work create technology-specific optical and environmental challenges.'],
  ['Warehousing and manufacturing', 'Racking, temporary screens, high-bay lighting, vehicles, hot work and production-layout changes often affect the detector scene.'],
] as const;

const misconceptions = [
  ['“A multispectrum detector cannot false-alarm.”', 'Multispectrum processing improves rejection, but immunity remains model-, source- and application-specific. No technology removes the need for correct selection, placement and maintenance.'],
  ['“If the optical self-test passes, coverage is proven.”', 'A built-in check verifies defined internal functions. It does not prove the external field of view, hazard geometry, atmospheric path or complete alarm action.'],
  ['“Dirty optics are mainly a false-alarm problem.”', 'Contamination is often the more serious missed-detection or fault problem. It can also interact with changing light and shadows, so the actual event evidence matters.'],
  ['“Lower sensitivity or a longer delay is a harmless fix.”', 'Both can reduce or slow real-fire detection. Any change must remain consistent with the hazard basis, coverage and approved cause-and-effect.'],
  ['“A panel alarm proves the detector saw a flame.”', 'The complete chain includes sensing, local processing, outputs, wiring, communications, input mapping and system logic. Compare local and remote evidence before assigning the cause.'],
] as const;

const faqs = [
  {
    question: 'Should an optical flame-detector alarm ever be treated as false immediately?',
    answer: 'No. Follow the site emergency and verification procedure first. Only classify the event after authorised checks establish that no fire condition exists and the event evidence has been preserved.',
  },
  {
    question: 'Which detector technology has the fewest false alarms?',
    answer: 'There is no universal winner. Multispectrum IR technologies generally use more optical information to reject common interferents, but the best choice depends on fuel, distance, field of view, hot backgrounds, flare or exhaust conditions, weather, approvals and required response.',
  },
  {
    question: 'Can a dirty lens cause a false alarm?',
    answer: 'It can complicate the signal or interact with another source, but contamination more commonly reduces sensitivity or produces a fault. Inspect the event class, optics and model diagnostics rather than assuming a direct cause.',
  },
  {
    question: 'Can we use any flame-detector test lamp on any detector?',
    answer: 'No. Test sources and procedures are technology- and model-specific. Some models use approved simulators; some rely on calibrated internal optical tests. Follow the current manual and control any outputs the test can actuate.',
  },
  {
    question: 'How often should optical flame detectors be cleaned and functionally tested?',
    answer: 'Use the current OEM instructions, the site fire-and-gas performance and maintenance strategy, applicable project requirements and evidence from the actual environment. There is no defensible universal monthly, quarterly or annual interval for every installation.',
  },
];

const sources = [
  ['Det-Tronics — X3301 product overview', 'https://www.det-tronics.com/product/flame-detection/x3301-multispectrum-infrared-flame-detector/'],
  ['Det-Tronics — X3301 enhanced instruction manual', 'https://www.det-tronics.com/wp-content/uploads/sites/8/2025/04/95-8704-5.1-X3301-Enhanced-Web.pdf'],
  ['MSA — FL5000 device overview', 'https://docs.msasafety.com/fl5000/en-us/FL5000%2010238682/DeviceOverview.htm'],
  ['Honeywell — FS24X product page and technical resources', 'https://automation.honeywell.com/us/en/products/sensing-solutions/gas-and-flame-detection/fixed-gas-and-flame-detection/fixed-flame-detectors/fs24x-flame-detector'],
  ['Dräger — Flame 1500 IR3 product page', 'https://www.draeger.com/en-us_us/Products/Flame-1500'],
  ['Emerson — industrial flame-detection technology overview', 'https://www.emerson.com/en/measurement-instrumentation/catalog/flame-and-gas-detection/flame-detection'],
  ['ISA — ISA-TR84.00.07-2018 fire and gas system effectiveness guidance', 'https://www.isa.org/standards-and-publications/isa-standards/isa-84-standards'],
  ['ISO — ISO 7240-10:2012 point-type flame-detector scope', 'https://www.iso.org/standard/57473.html'],
  ['NFPA — NFPA 72, National Fire Alarm and Signaling Code', 'https://link.nfpa.org/all-publications/72/2025'],
] as const;

const articleJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: 'Five Common Causes of False Alarms in Optical Flame Detectors',
  description: 'A source-led guide to recurring optical flame-detector alarm causes, technology limitations, safe troubleshooting, maintenance and claim boundaries.',
  image: 'https://www.touchteq.co.za/optical-flame-detector.jpeg',
  author: { '@type': 'Organization', name: 'Touch Teqniques Engineering' },
  publisher: {
    '@type': 'Organization',
    name: 'Touch Teqniques Engineering',
    logo: { '@type': 'ImageObject', url: 'https://www.touchteq.co.za/touch-teq-logo-wordmark.jpeg' },
  },
  datePublished: '2024-04-01T00:00:00+02:00',
  dateModified: '2026-08-11T00:00:00+02:00',
  mainEntityOfPage: articleUrl,
  keywords: 'optical flame detector false alarms, UV flame detector, IR3, MSIR, UV IR, fire and gas detection, flame detector maintenance, South Africa',
};

function SectionHeading({ number, eyebrow, children }: { number: string; eyebrow: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center gap-4">
        <span className="font-mono text-xs font-black text-orange-500">{number}</span>
        <p className="text-xs font-black uppercase tracking-[0.25em] text-orange-500">{eyebrow}</p>
      </div>
      <h2 className="mt-4 text-3xl font-black uppercase leading-tight text-[#1A2B4C] md:text-4xl">{children}</h2>
    </div>
  );
}

export default function FlameDetectorFalseAlarmsArticle() {
  return (
    <main className="min-h-screen bg-white">
      <BreadcrumbJsonLd items={[{ name: 'Home', url: 'https://www.touchteq.co.za' }, { name: 'Insights', url: 'https://www.touchteq.co.za/insights' }, { name: 'Flame Detector False Alarms', url: articleUrl }]} />
      <FAQJsonLd faqs={faqs} />
      <JsonLd data={articleJsonLd} />
      <Header />

      <section className="relative overflow-hidden bg-[#0A1120] pb-24 pt-36 text-white md:pb-32 md:pt-48">
        <div className="absolute inset-0">
          <Image src="/optical-flame-detector.jpeg" alt="" fill priority sizes="100vw" className="object-cover object-center" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0A1120]/88 via-[#0A1120]/52 to-[#0A1120]/14" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0A1120]/62 via-transparent to-[#0A1120]/10" />
        </div>
        <div className="container relative mx-auto px-4 md:px-8">
          <Link href="/insights" className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-wider text-orange-500 hover:text-orange-300"><ArrowLeft size={15} />Back to Insights</Link>
          <div className="mt-8 flex flex-wrap items-center gap-x-4 gap-y-2 text-[11px] font-bold uppercase tracking-wider text-slate-200">
            <span className="rounded bg-orange-500 px-3 py-1.5 text-white">Technical article</span>
            <span className="inline-flex items-center gap-1.5 normal-case tracking-normal"><Clock size={14} />16 min read</span>
            {detailTags.map((tag, index) => <span key={tag}>{index > 0 && <span className="mr-4 text-orange-400">·</span>}{tag}</span>)}
          </div>
          <h1 className="mt-9 max-w-5xl text-4xl font-black uppercase leading-[0.98] tracking-tight sm:text-5xl md:text-7xl">Five common causes of false alarms{' '}<span className="bg-gradient-to-r from-[#FF6900] to-orange-300 bg-clip-text text-transparent">in optical flame detectors.</span></h1>
          <p className="mt-8 max-w-3xl text-base font-medium leading-relaxed text-slate-200 md:text-lg">A field guide to separating optical interference from faults in the detection chain—without desensitising the system, creating a blind spot or mistaking a real event for nuisance.</p>
        </div>
      </section>

      <section className="border-b border-slate-200 bg-slate-50 py-8">
        <div className="container mx-auto px-4 md:px-8"><p className="max-w-4xl text-sm font-medium leading-relaxed text-slate-600"><span className="font-black uppercase text-[#1A2B4C]">Quick answer:</span>{' '}There is no authoritative universal “top five” ranking. The recurring categories are interfering radiation, optics and obstructions, field-of-view or mounting problems, configuration and logic, and electrical or system-chain faults. The installed technology and model determine which explanation is credible.</p></div>
      </section>

      <section className="py-16 md:py-24">
        <div className="container mx-auto grid gap-12 px-4 md:px-8 lg:grid-cols-[220px_minmax(0,780px)] lg:justify-center lg:gap-16">
          <aside className="hidden lg:block">
            <nav aria-label="Article contents" className="sticky top-32 border-l border-slate-200 pl-5">
              <p className="mb-4 text-[10px] font-black uppercase tracking-[0.25em] text-orange-500">In this guide</p>
              <ol className="space-y-2.5">{guideSections.map(([href, label], index) => <li key={href}><a href={href} className="group flex gap-3 text-[11px] font-bold leading-snug text-slate-500 hover:text-orange-600"><span className="font-mono text-[10px] text-slate-300 group-hover:text-orange-400">{String(index + 1).padStart(2, '0')}</span>{label}</a></li>)}</ol>
            </nav>
          </aside>

          <article>
            <div className="mb-8"><ShareButton title="Five Common Causes of False Alarms in Optical Flame Detectors" description="A source-led guide to optical interference, diagnostics, safe troubleshooting and maintenance." url={articleUrl} /></div>
            <ArticleAudioPlayer />

            <div className="border-l-4 border-orange-500 bg-[#0A1120] p-7 text-white md:p-9">
              <p className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.22em] text-orange-500"><ShieldAlert size={17} />The first rule</p>
              <p className="mt-4 text-2xl font-black leading-tight md:text-3xl">Treat the indication as a potential real fire until the site’s authorised response establishes otherwise.</p>
              <p className="mt-5 text-sm font-medium leading-relaxed text-slate-300">A repeated nuisance pattern can damage alarm confidence. It must never become permission to silence, cover, bypass or desensitise a detector outside controlled site procedures.</p>
            </div>

            <section id="first-response" className="scroll-mt-28 pt-16">
              <SectionHeading number="01" eyebrow="Classify before correcting">An unwanted alarm and a detector fault are not the same event</SectionHeading>
              <div className="mt-7 space-y-6 text-base font-medium leading-relaxed text-slate-600"><p>An optical unwanted alarm begins when the detector’s sensing and processing criteria declare fire in response to a non-hazardous source or an unintended real-flame path. A spurious system indication can originate later in the chain—from power, wiring, communication, input mapping or logic. A fault or trouble condition means the detector or system has identified an impairment.</p><p>Those paths need different corrective work. Start with the event class, local detector status and output evidence rather than the label used in a shift report.</p></div>
              <div className="mt-9 grid gap-5 sm:grid-cols-3">{[
                ['Optical alarm', 'The detector’s fire algorithm declared a flame-like signature.'],
                ['Fault / trouble', 'A diagnostic identified impaired optics, power, electronics or communications.'],
                ['Spurious indication', 'The panel or system reported fire without evidence that the optical algorithm declared it.'],
              ].map(([title, body], index) => <div key={title} className="border-t-4 border-orange-500 bg-slate-50 p-6"><span className="font-mono text-xs font-black text-orange-500">0{index + 1}</span><h3 className="mt-4 text-lg font-black uppercase text-[#1A2B4C]">{title}</h3><p className="mt-3 text-sm font-medium leading-relaxed text-slate-600">{body}</p></div>)}</div>
            </section>

            <section id="technology" className="scroll-mt-28 pt-20">
              <SectionHeading number="02" eyebrow="Spectral bands plus signal behaviour">The technology determines which false-alarm explanation is plausible</SectionHeading>
              <p className="mt-7 text-base font-medium leading-relaxed text-slate-600">Detector selection is not only about wavelength and not only about software. The sensing bands decide what energy reaches the electronics; the processing method decides whether the combination, level and behaviour satisfy the fire criteria. Exact thresholds and algorithms are proprietary and model-specific.</p>
              <div className="mt-9 grid gap-px overflow-hidden border border-slate-200 bg-slate-200 sm:grid-cols-2">{technologies.map(({ icon: Icon, label, sees, decides, watch }) => <div key={label} className="bg-white p-7"><Icon size={29} className="text-orange-500" /><h3 className="mt-5 text-xl font-black uppercase text-[#1A2B4C]">{label}</h3><p className="mt-4 text-sm font-medium leading-relaxed text-slate-600"><strong className="text-[#1A2B4C]">Senses:</strong> {sees}</p><p className="mt-3 text-sm font-medium leading-relaxed text-slate-600"><strong className="text-[#1A2B4C]">Evaluates:</strong> {decides}</p><p className="mt-3 border-l-2 border-orange-500 pl-4 text-sm font-medium leading-relaxed text-slate-600"><strong className="text-[#1A2B4C]">Watch:</strong> {watch}</p></div>)}</div>
              <div className="mt-7 flex gap-4 border border-orange-200 bg-orange-50 p-6"><AlertTriangle size={22} className="mt-0.5 shrink-0 text-orange-600" /><p className="text-sm font-medium leading-relaxed text-slate-700"><strong className="text-[#1A2B4C]">Do not generalise a model table:</strong> false-alarm immunity, fuel response, field of view, welding distance and range are test-condition and configuration claims. Use the manual and approval data for the installed detector.</p></div>
            </section>

            {causeCards.map(({ id, number, icon: Icon, eyebrow, title, body, clues, checks, boundary }, index) => (
              <section id={id} key={id} className="scroll-mt-28 pt-20">
                <SectionHeading number={String(index + 3).padStart(2, '0')} eyebrow={`${number} · ${eyebrow}`}>{title}</SectionHeading>
                <p className="mt-7 text-base font-medium leading-relaxed text-slate-600">{body}</p>
                <div className="mt-9 grid gap-5 md:grid-cols-2">
                  <div className="border-t-4 border-orange-500 bg-slate-50 p-7"><Icon size={29} className="text-orange-500" /><h3 className="mt-5 text-lg font-black uppercase text-[#1A2B4C]">Evidence that points this way</h3><ul className="mt-5 space-y-3">{clues.map((item) => <li key={item} className="flex gap-3 text-sm font-medium leading-relaxed text-slate-600"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-orange-500" />{item}</li>)}</ul></div>
                  <div className="border-t-4 border-orange-500 bg-[#1A2B4C] p-7 text-white"><Search size={29} className="text-orange-500" /><h3 className="mt-5 text-lg font-black uppercase">Check before changing</h3><ul className="mt-5 space-y-3">{checks.map((item) => <li key={item} className="flex gap-3 text-sm font-medium leading-relaxed text-slate-300"><CheckCircle2 size={16} className="mt-0.5 shrink-0 text-orange-500" />{item}</li>)}</ul></div>
                </div>
                <p className="mt-6 border-l-2 border-orange-500 pl-5 text-sm font-medium leading-relaxed text-slate-600"><strong className="text-[#1A2B4C]">Safety boundary:</strong> {boundary}</p>
              </section>
            ))}

            <section id="examples" className="scroll-mt-28 pt-20">
              <SectionHeading number="08" eyebrow="Illustrative—not a ranking">Four model families show why “multispectrum” is not one universal algorithm</SectionHeading>
              <p className="mt-7 text-base font-medium leading-relaxed text-slate-600">These current manufacturer examples make the functional differences tangible. They do not establish equivalence, preferred supply, universal immunity or suitability for a particular facility.</p>
              <div className="mt-9 overflow-hidden border border-slate-200"><div className="hidden grid-cols-[180px_135px_1fr] bg-[#1A2B4C] px-6 py-4 text-[11px] font-black uppercase tracking-wider text-white md:grid"><span>Model family</span><span>Method</span><span>What the example shows</span></div>{modelExamples.map(([model, method, note]) => <div key={model} className="grid gap-3 border-t border-slate-200 p-6 first:border-t-0 md:grid-cols-[180px_135px_1fr]"><h3 className="text-sm font-black uppercase text-[#1A2B4C]">{model}</h3><p className="text-xs font-black uppercase text-orange-600">{method}</p><p className="text-sm font-medium leading-relaxed text-slate-600">{note}</p></div>)}</div>
            </section>

            <section id="diagnostics" className="scroll-mt-28 pt-20">
              <SectionHeading number="09" eyebrow="Evidence with limits">An optical self-test is valuable—but it does not prove site coverage</SectionHeading>
              <p className="mt-7 text-base font-medium leading-relaxed text-slate-600">Built-in tests differ. The Det-Tronics X3301, for example, performs a calibrated automatic optical-integrity check once per minute and distinguishes the automatic check from manual checks that actuate alarm output. Dräger describes an optical verification test for the Flame 1500. The exact test path, pass threshold and output behaviour must come from the installed model manual.</p>
              <div className="mt-9 divide-y divide-slate-200 border-y border-slate-200">{diagnosticLimits.map(([status, body]) => <div key={`${status}-${body}`} className="grid gap-3 py-5 sm:grid-cols-[125px_1fr]"><p className={`text-xs font-black uppercase tracking-wider ${status === 'Can support' ? 'text-emerald-700' : 'text-orange-600'}`}>{status}</p><p className="text-sm font-medium leading-relaxed text-slate-600">{body}</p></div>)}</div>
              <div className="mt-7 flex gap-4 bg-slate-50 p-6"><Eye size={23} className="mt-0.5 shrink-0 text-orange-500" /><p className="text-sm font-medium leading-relaxed text-slate-700"><strong className="text-[#1A2B4C]">External scene still matters:</strong> an internal check cannot see a new scaffold outside the detector, prove the aim, confirm the whole cause-and-effect path or reproduce every design-basis fire.</p></div>
            </section>

            <section id="workflow" className="scroll-mt-28 pt-20">
              <SectionHeading number="10" eyebrow="Preserve evidence before adjustment">A safe investigation sequence moves from event response to controlled restoration</SectionHeading>
              <div className="mt-9 space-y-3">{investigationSteps.map(([number, title, body], index) => <div key={number} className="relative grid gap-4 border border-slate-200 bg-white p-5 sm:grid-cols-[48px_185px_1fr]"><span className="flex h-9 w-9 items-center justify-center rounded-full bg-orange-500 font-mono text-xs font-black text-white">{number}</span><h3 className="text-sm font-black uppercase text-[#1A2B4C]">{title}</h3><p className="text-sm font-medium leading-relaxed text-slate-600">{body}</p>{index < investigationSteps.length - 1 && <div className="absolute -bottom-3 left-9 z-10 h-3 border-l-2 border-dashed border-orange-300 sm:left-[2.4rem]" />}</div>)}</div>
              <div className="mt-7 border-t-4 border-orange-500 bg-[#0A1120] p-7 text-white"><p className="text-xl font-black uppercase">Stop conditions are part of the method.</p><p className="mt-3 text-sm font-medium leading-relaxed text-slate-300">Stop and escalate if the event cannot be safely classified, the procedure or manual is unavailable, the test may trigger suppression or shutdown, hazardous-area integrity is uncertain, or a proposed change affects detection coverage or cause-and-effect.</p></div>
            </section>

            <section id="maintenance" className="scroll-mt-28 pt-20">
              <SectionHeading number="11" eyebrow="Condition-led and model-specific">The maintenance record should make the next alarm easier to diagnose</SectionHeading>
              <ul className="mt-9 grid gap-px overflow-hidden border border-slate-200 bg-slate-200 sm:grid-cols-2">{maintenanceChecks.map((item, index) => <li key={item} className="flex gap-4 bg-white p-5 text-sm font-semibold leading-relaxed text-slate-700"><span className="font-mono text-xs font-black text-orange-500">{String(index + 1).padStart(2, '0')}</span>{item}</li>)}</ul>
              <div className="mt-7 flex gap-4 border border-orange-200 bg-orange-50 p-6"><FileClock size={23} className="mt-0.5 shrink-0 text-orange-600" /><p className="text-sm font-medium leading-relaxed text-slate-700"><strong className="text-[#1A2B4C]">Useful history:</strong> trend the event against plant activity, weather, condition, diagnostics, cleaning and configuration. “Tested OK” without as-found evidence rarely explains a recurring event.</p></div>
            </section>

            <section id="sectors" className="scroll-mt-28 pt-20">
              <SectionHeading number="12" eyebrow="One framework, different dominant sources">The five categories stay stable; their local ranking does not</SectionHeading>
              <div className="mt-9 grid gap-px overflow-hidden border border-slate-200 bg-slate-200 sm:grid-cols-2">{sectorNotes.map(([sector, note]) => <div key={sector} className="bg-slate-50 p-7"><h3 className="text-lg font-black uppercase text-[#1A2B4C]">{sector}</h3><p className="mt-3 text-sm font-medium leading-relaxed text-slate-600">{note}</p></div>)}</div>
              <p className="mt-6 text-sm font-medium leading-relaxed text-slate-600">A facility’s own event history is the only defensible way to rank its leading contributors. Even then, separate false optical alarms, real but unintended flames, diagnostic faults and spurious system indications before trending.</p>
            </section>

            <section id="misconceptions" className="scroll-mt-28 pt-20">
              <SectionHeading number="13" eyebrow="Five misconceptions">The shortcuts that turn nuisance reduction into hidden risk</SectionHeading>
              <div className="mt-9 divide-y divide-slate-200 border-y border-slate-200">{misconceptions.map(([claim, correction], index) => <div key={claim} className="grid gap-4 py-7 sm:grid-cols-[52px_1fr]"><span className="font-mono text-sm font-black text-orange-500">{String(index + 1).padStart(2, '0')}</span><div><h3 className="text-lg font-black text-[#1A2B4C]">{claim}</h3><p className="mt-3 text-sm font-medium leading-relaxed text-slate-600">{correction}</p></div></div>)}</div>
            </section>

            <section id="faqs" className="scroll-mt-28 pt-20">
              <p className="text-xs font-black uppercase tracking-[0.28em] text-orange-500">Common questions</p>
              <h2 className="mt-4 text-3xl font-black uppercase leading-tight text-[#1A2B4C] md:text-4xl">What plant teams should ask before they reach for a setting change</h2>
              <div className="mt-9 divide-y divide-slate-200 border-y border-slate-200">{faqs.map((faq) => <details key={faq.question} className="group py-6"><summary className="flex cursor-pointer list-none items-center justify-between gap-5 text-lg font-black text-[#1A2B4C] marker:content-none">{faq.question}<span className="text-2xl text-orange-500 transition-transform group-open:rotate-45">+</span></summary><p className="mt-4 max-w-3xl pr-10 text-sm font-medium leading-relaxed text-slate-600">{faq.answer}</p></details>)}</div>
            </section>

            <section id="sources" className="scroll-mt-28 pt-20">
              <p className="text-xs font-black uppercase tracking-[0.28em] text-orange-500">Primary references</p>
              <h2 className="mt-4 text-3xl font-black uppercase leading-tight text-[#1A2B4C] md:text-4xl">Sources, standards hierarchy and claim boundaries</h2>
              <p className="mt-6 text-sm font-medium leading-relaxed text-slate-600">Seven supplied research files were consolidated for this rewrite. Technical claims were then checked against current manufacturer pages and manuals plus official ISA and ISO catalogue records. The OEM manual and approved site procedure govern work on the installed detector.</p>
              <div className="mt-8 grid gap-4 sm:grid-cols-2"><div className="border-t-4 border-orange-500 bg-slate-50 p-6"><h3 className="text-lg font-black uppercase text-[#1A2B4C]">Process facilities</h3><p className="mt-3 text-sm font-medium leading-relaxed text-slate-600">ISA-TR84.00.07 provides process-industry guidance for evaluating fire and gas detection effectiveness, including coverage, response and reliability considerations.</p></div><div className="border-t-4 border-orange-500 bg-slate-50 p-6"><h3 className="text-lg font-black uppercase text-[#1A2B4C]">Point-type detector standard</h3><p className="mt-3 text-sm font-medium leading-relaxed text-slate-600">ISO 7240-10 covers point-type, resettable flame detectors for building fire-detection systems and says special-risk detectors fall outside its direct scope, though it may offer guidance.</p></div></div>
              <p className="mt-6 text-sm font-medium leading-relaxed text-slate-600">NFPA 72 may be relevant where adopted by the authority having jurisdiction, contract, insurer or site standard. It is not presented here as South African law. Hazardous-area, fire, permit, impairment and change-control requirements must be established for the actual facility.</p>
              <ul className="mt-7 space-y-3">{sources.map(([name, href]) => <li key={href}><a href={href} target="_blank" rel="noreferrer" className="inline-flex items-start gap-3 text-sm font-bold leading-relaxed text-[#1A2B4C] hover:text-orange-600"><ExternalLink size={15} className="mt-0.5 shrink-0 text-orange-500" />{name}</a></li>)}</ul>
              <div className="mt-10 border-t-4 border-orange-500 bg-[#0A1120] p-7 text-white md:p-9"><h3 className="flex items-center gap-3 text-xl font-black uppercase"><AlertTriangle className="text-orange-500" />What this article does not promise</h3><p className="mt-5 text-sm font-medium leading-relaxed text-slate-300">This article does not promise zero false alarms, universal detector immunity, a guaranteed detection distance, a generic cleaning or proof-test interval, or compliance with a particular code. It does not authorise bypassing, shielding, moving, desensitising or changing detector logic. It does not claim manufacturer, certification, approved-inspection or accreditation authority for Touch Teqniques Engineering. Exact work must be scoped against the installed models, approved fire-and-gas basis, site procedures and applicable legal and contractual requirements.</p></div>
            </section>

            <ArticleAuthorityBox
              variant="source-review"
              updated="11 August 2026"
              sourceStatus="Manufacturer manuals and official standards records checked"
              sourceSummary="This article was rebuilt from a consolidated technical research pack and checked against current manufacturer documentation plus official ISA and ISO catalogue records. It is general information and does not replace the installed detector manual, approved site procedure or a site-specific fire and gas engineering assessment."
              topics={['Optical flame-detector technologies', 'False-alarm and fault investigation', 'OEM diagnostics and maintenance limits', 'Fire and gas system effectiveness']}
            />
          </article>
        </div>
      </section>

      <section className="bg-[#0A1120] py-20 text-white">
        <div className="container mx-auto px-4 text-center md:px-8"><p className="text-xs font-black uppercase tracking-[0.3em] text-orange-500">Recurring flame-detector events?</p><h2 className="mx-auto mt-5 max-w-4xl text-3xl font-black uppercase leading-tight md:text-5xl">Start with the detector model, event evidence and field of view—not a generic sensitivity adjustment.</h2><p className="mx-auto mt-6 max-w-2xl text-base font-medium leading-relaxed text-slate-300">Share the installed detector schedule, event logs, cause-and-effect, photographs, recent plant changes and maintenance history. Touch Teqniques can help define a technically controlled investigation scope.</p><Link href={contactHref} className="group mt-9 inline-flex items-center gap-3 rounded-md bg-orange-500 px-7 py-4 text-xs font-black uppercase tracking-[0.16em] text-white hover:bg-orange-600">Request a False-Alarm Review<ArrowRight size={16} className="transition-transform group-hover:translate-x-1" /></Link></div>
      </section>

      <Footer />
      <BackToTop />
    </main>
  );
}
