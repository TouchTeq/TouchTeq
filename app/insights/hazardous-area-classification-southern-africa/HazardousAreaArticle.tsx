import { AlertTriangle, ArrowLeft, ArrowRight, Clock, ExternalLink, FileCheck2, Flame, Layers3, Map, RefreshCcw, ShieldCheck, Wind } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

import BackToTop from '@/components/BackToTop';
import Footer from '@/components/Footer';
import Header from '@/components/Header';
import ArticleAudioPlayer from '@/components/insights/ArticleAudioPlayer';
import ArticleAuthorityBox from '@/components/insights/ArticleAuthorityBox';
import BreadcrumbJsonLd from '@/components/seo/BreadcrumbJsonLd';
import FAQJsonLd from '@/components/seo/FAQJsonLd';
import JsonLd from '@/components/seo/JsonLd';
import { ShareButton } from '@/components/ui/share-button';

const articleUrl = 'https://www.touchteq.co.za/insights/hazardous-area-classification-southern-africa';
const detailTags = ['Explosive Atmospheres', 'SANS 10108', 'IEC 60079'];

const guideSections = [
  ['#scope', 'What classification establishes'],
  ['#standards', 'Current standards picture'],
  ['#zones', 'Gas and dust zones'],
  ['#inputs', 'Inputs a study needs'],
  ['#selection', 'From zone to equipment'],
  ['#south-africa', 'South African legal route'],
  ['#regional', 'Mining and regional limits'],
  ['#review', 'When to review the study'],
  ['#misconceptions', 'Five misconceptions'],
  ['#faqs', 'Frequently asked questions'],
  ['#sources', 'Sources and boundaries'],
];

const standards = [
  ['SANS 10108:2023', 'South African framework', 'Edition 7 is the current published South African framework identified in the official standards notice for classifying hazardous locations and selecting equipment for explosive atmospheres.'],
  ['IEC / SANS 60079-10-1', 'Gas, vapour and mist', 'IEC 60079-10-1:2020, with its 2021 corrigendum, is the international gas-classification edition. South Africa published SANS 60079-10-1:2023 as an identical adoption.'],
  ['IEC 60079-10-2:2026', 'Combustible dust', 'IEC published Edition 3 in June 2026. The verified South African notice still identifies SANS 60079-10-2:2018, based on IEC Edition 2; confirm the project-specified SANS edition before use.'],
];

const gasZones = [
  ['0', 'Continuous, long periods or frequently', 'Ga'],
  ['1', 'Likely to occur occasionally in normal operation', 'Gb'],
  ['2', 'Not likely in normal operation; brief if it occurs', 'Gc'],
];
const dustZones = [
  ['20', 'Continuous, long periods or frequently', 'Da'],
  ['21', 'Likely to occur occasionally in normal operation', 'Db'],
  ['22', 'Not likely in normal operation; brief if it occurs', 'Dc'],
];

const studyInputs = [
  'Process descriptions, P&IDs and current plot plans',
  'Substance data: flash point, gas or dust group, ignition temperature and other relevant properties',
  'Normal, start-up, shutdown, cleaning and foreseeable abnormal operating conditions',
  'Release sources, grades of release and credible release parameters',
  'Ventilation type, availability, effectiveness and obstructions',
  'Equipment openings, drains, pits, trenches, enclosed spaces and dust layers',
  'Existing zone drawings, equipment registers and modification history',
  'Input from process, operations, maintenance, electrical and safety personnel',
];

const selectionSteps = [
  ['01', 'Zone and EPL', 'Start with the classified location and required protection level.'],
  ['02', 'Gas or dust group', 'Match the substance group to the apparatus marking and certificate.'],
  ['03', 'Temperature', 'Check temperature class or maximum surface temperature against the substance.'],
  ['04', 'Protection concept', 'Confirm the Ex technique is suitable for the application, installation and maintenance regime.'],
  ['05', 'Certificate and conditions', 'Read the certificate, suffixes, special conditions and local acceptance route—not only the nameplate.'],
];

const reviewTriggers = [
  'A process, substance, pressure, temperature or operating envelope changes.',
  'Ventilation, walls, openings, pits, drainage or equipment layout changes.',
  'A release source is added, removed or altered.',
  'Dust generation, housekeeping or layer accumulation changes.',
  'New equipment or a different protection concept is proposed.',
  'An incident, near miss, inspection finding or operating experience challenges an assumption.',
  'Drawings no longer match the plant or the governing standard and legal basis changes.',
];

const misconceptions = [
  ['“A Zone 2 area is basically safe.”', 'Zone 2 means an explosive gas atmosphere is not likely in normal operation and, if it occurs, exists only briefly. It still requires suitable equipment, installation and controls.'],
  ['“The 1,000 / 10-hour rule determines the zone.”', 'Those hour bands are common explanatory shorthand, not the normative zone definitions. Classification depends on release characteristics, ventilation and the standard method.'],
  ['“An IECEx or ATEX certificate is all we need in South Africa.”', 'International evidence can support the route, but South African electrical machinery requirements and the applicable IA-certificate pathway must still be checked.'],
  ['“Once the drawing is approved, it is valid forever.”', 'A classification records a defined plant and operating basis. Management of change must trigger review whenever its assumptions change.'],
  ['“The same report works across Southern Africa and for mines.”', 'The IEC technical language may travel, but legal triggers and approval routes do not. Mining has a separate South African regime, and every neighbouring jurisdiction needs a country-specific check.'],
];

const faqs = [
  { question: 'What is the main deliverable from hazardous area classification?', answer: 'A controlled classification dossier normally records the basis, substances, release sources, ventilation assumptions, zone types and three-dimensional extents, drawings, responsible inputs and limitations. The exact deliverables should be agreed for the site and project stage.' },
  { question: 'Do the familiar 1,000, 10–1,000 and under-10 hours define Zones 0, 1 and 2?', answer: 'No. They are widely used indicative bands, not the normative IEC definitions. The zones are defined qualitatively by the likelihood and duration of an explosive atmosphere, and the classification method considers releases, ventilation and site conditions.' },
  { question: 'Does a hazardous area drawing prove that installed equipment complies?', answer: 'No. The drawing establishes the location requirements. Equipment selection, certification, installation, inspection, maintenance and the certificate of compliance are separate evidence chains that must align with the classification.' },
  { question: 'Can IECEx- or ATEX-certified equipment be installed directly in South Africa?', answer: 'Do not assume so. International certification may support a South African certification assessment, but the applicable Inspection Authority certificate, certificate status, special conditions and installation requirements must be confirmed before acceptance.' },
  { question: 'When should an existing classification be reviewed?', answer: 'Review it through management of change whenever substances, operating conditions, releases, ventilation, layout or equipment change, and when incidents, inspections or revised requirements undermine its assumptions. A fixed calendar interval alone is not enough.' },
];

const sources = [
  ['IEC — IEC 60079-10-1:2020, Edition 3.0', 'https://webstore.iec.ch/en/publication/63327'],
  ['IEC — Corrigendum 1 to IEC 60079-10-1:2020', 'https://webstore.iec.ch/en/publication/68786'],
  ['IEC — IEC 60079-10-2:2026, Edition 3.0', 'https://webstore.iec.ch/en/publication/90124'],
  ['IEC — IEC 60079-14:2024 for electrical installation design and initial inspection', 'https://webstore.iec.ch/en/publication/66049'],
  ['IEC — IEC 60079-17:2023 for inspection and maintenance', 'https://webstore.iec.ch/en/publication/64810'],
  ['South African Government — notice issuing SANS 10108:2023, Edition 7', 'https://www.gov.za/sites/default/files/gcis_document/202302/48104gen1633.pdf'],
  ['South African Government — notice issuing SANS 60079-10-1:2023', 'https://www.gov.za/sites/default/files/gcis_document/202308/49108gen1963.pdf'],
  ['South African Government — notice issuing SANS 60079-10-2:2018', 'https://www.gov.za/sites/default/files/gcis_document/201806/41704gen342.pdf'],
  ['SAFLII — Electrical Machinery Regulations, 2011', 'https://www.saflii.org/za/legis/consol_reg/emr2011295.pdf'],
  ['SAFLII — incorporation of SANS 10108 under the OHS Act', 'https://www.saflii.org/za/legis/consol_reg/iohassitemr2011777/'],
  ['South African Government — National Code of Practice for Electrical Machinery in Hazardous Locations, 2022', 'https://www.gov.za/documents/notices/occupational-health-and-safety-act-national-code-practice-electrical-machinery'],
  ['DMRE — ARP 0108:2018 certification of explosion-protected apparatus', 'https://www.dmre.gov.za/Portals/0/Resource%20Center/Reports%20and%20Other%20Documents/ARP0108_2018.pdf?ver=2019-03-13-234529-593'],
  ['IECEx — Certified Equipment Scheme FAQs', 'https://www.iecex.com/certified-equipment-scheme/faqs-certified-equipment-scheme/'],
  ['SANAS — South African National Accreditation System', 'https://www.sanas.co.za/Pages/index.aspx?cat=1'],
  ['SAFLII — Mine Health and Safety Act 29 of 1996', 'https://www.saflii.org/za/legis/consol_act/mhasa1996192/'],
];

const articleJsonLd = {
  '@context': 'https://schema.org', '@type': 'Article',
  headline: 'Hazardous Area Classification in Southern Africa: Zones, Equipment and the South African Legal Picture',
  description: 'A source-led guide to hazardous area classification, gas and dust zones, SANS 10108, IEC 60079, equipment selection and South African certification boundaries.',
  image: 'https://www.touchteq.co.za/HAC.jpg',
  author: { '@type': 'Organization', name: 'Touch Teqniques Engineering', url: 'https://www.touchteq.co.za' },
  publisher: { '@type': 'Organization', name: 'Touch Teqniques Engineering', logo: { '@type': 'ImageObject', url: 'https://www.touchteq.co.za/touch-teq-logo-wordmark.jpeg' } },
  datePublished: '2024-04-01T00:00:00+02:00', dateModified: '2026-08-11T00:00:00+02:00', mainEntityOfPage: articleUrl,
  keywords: 'hazardous area classification South Africa, SANS 10108, IEC 60079, Zone 0, Zone 1, Zone 2, combustible dust, explosion-protected apparatus, IA certificate',
};

const SectionHeading = ({ number, eyebrow, children }: { number: string; eyebrow: string; children: React.ReactNode }) => (
  <><p className="text-xs font-black uppercase tracking-[0.28em] text-orange-500">{number} — {eyebrow}</p><h2 className="mt-4 text-3xl font-black uppercase leading-tight text-[#1A2B4C] md:text-4xl">{children}</h2></>
);

export default function HazardousAreaArticle() {
  return (
    <main className="min-h-screen bg-white font-sans">
      <BreadcrumbJsonLd items={[{ name: 'Home', url: 'https://www.touchteq.co.za' }, { name: 'Insights', url: 'https://www.touchteq.co.za/insights' }, { name: 'Hazardous Area Classification', url: articleUrl }]} />
      <FAQJsonLd faqs={faqs} /><JsonLd data={articleJsonLd} /><Header />

      <section className="relative overflow-hidden bg-[#0A1120] pb-24 pt-36 text-white md:pb-32 md:pt-48">
        <div className="absolute inset-0"><Image src="/HAC.jpg" alt="" fill priority sizes="100vw" className="object-cover object-center" /><div className="absolute inset-0 bg-gradient-to-r from-[#0A1120]/88 via-[#0A1120]/40 to-[#0A1120]/10" /><div className="absolute inset-0 bg-gradient-to-t from-[#0A1120]/50 via-transparent to-[#0A1120]/10" /></div>
        <div className="container relative z-10 mx-auto px-4 md:px-8">
          <Link href="/insights" className="mb-9 inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-orange-500 hover:text-orange-300"><ArrowLeft size={15} />Back to Insights</Link>
          <div className="max-w-5xl">
            <div className="mb-6 flex flex-wrap items-center gap-4"><span className="rounded-sm bg-orange-500 px-3 py-1 text-[10px] font-black uppercase tracking-widest">Technical Guide</span><div className="flex items-center text-xs text-slate-300"><Clock size={12} className="mr-1" />16 min read</div><div className="flex flex-wrap gap-2">{detailTags.map((tag, index) => <span key={tag} className="text-[10px] font-medium uppercase tracking-wider text-slate-300">{index > 0 && <span className="mx-1 text-slate-500">·</span>}{tag}</span>)}</div></div>
            <h1 className="max-w-5xl text-4xl font-black uppercase leading-[0.98] tracking-tight sm:text-5xl md:text-7xl">Hazardous area classification in Southern Africa:{' '}<span className="bg-gradient-to-r from-[#FF6900] to-orange-300 bg-clip-text text-transparent">zones, equipment and the South African legal picture.</span></h1>
            <p className="mt-8 max-w-3xl text-base font-medium leading-relaxed text-slate-200 md:text-xl">A practical, source-led guide to what a classification establishes, how gas and dust zones differ, and where drawings, equipment certificates and legal duties connect.</p>
          </div>
        </div>
      </section>

      <section className="border-b border-slate-200 bg-slate-50 py-8"><div className="container mx-auto px-4 md:px-8"><p className="max-w-4xl text-sm font-medium leading-relaxed text-slate-600"><span className="font-black uppercase text-[#1A2B4C]">Quick answer:</span>{' '}Hazardous area classification identifies where an explosive atmosphere may occur and defines the zone and extent needed for equipment selection. It is the start of an evidence chain—not proof that equipment is certified, correctly installed or legally accepted.</p></div></section>

      <section className="py-16 md:py-24"><div className="container mx-auto grid gap-12 px-4 md:px-8 lg:grid-cols-[220px_minmax(0,780px)] lg:justify-center lg:gap-16">
        <aside className="hidden lg:block"><nav aria-label="Article contents" className="sticky top-32 border-l border-slate-200 pl-5"><p className="mb-4 text-[10px] font-black uppercase tracking-[0.22em] text-orange-500">In this guide</p><ol className="space-y-3 text-sm font-bold leading-snug text-slate-500">{guideSections.map(([href, label]) => <li key={href}><a className="hover:text-orange-600" href={href}>{label}</a></li>)}</ol></nav></aside>
        <article className="min-w-0">
          <ShareButton title="Hazardous Area Classification in Southern Africa" description="A source-led guide to gas and dust zones, SANS 10108, IEC 60079 and South African equipment-certification boundaries." url={articleUrl} className="mb-6" />
          <ArticleAudioPlayer
            audioSrc="/content/audio/hazardous-area-classification-southern-africa-deep-dive.mp3"
            variant="deep-dive"
            title="What a hazardous-area drawing proves—and what it does not"
            description="A two-host explanation of zones, study inputs, equipment evidence and why South African surface, mining and regional acceptance routes must remain distinct."
            durationLabel="5:30"
            disclosure="This AI-produced discussion is an accessible companion to the written guide and may simplify or paraphrase technical and regulatory points. For precise terminology, standards references and engineering boundaries, refer to the written article and its cited sources. Always follow the applicable OEM instructions, approved site procedures and project-specific engineering requirements."
          />
          <div className="border-l-4 border-orange-500 bg-slate-50 px-6 py-7 md:px-8"><p className="text-xl font-black leading-relaxed text-[#1A2B4C] md:text-2xl">A credible classification lets a plant trace every zone boundary back to a substance, release source, ventilation assumption and operating case—and then carry that basis into equipment selection and change control.</p></div>

          <section id="scope" className="scroll-mt-28 pt-16"><SectionHeading number="01" eyebrow="Define the decision">Classification defines the location requirement. It does not close every Ex obligation.</SectionHeading><div className="mt-7 space-y-6 text-base font-medium leading-relaxed text-slate-600"><p>A hazardous location is assessed because flammable gas, vapour, mist or combustible dust may combine with air to form an explosive atmosphere. Classification identifies the zone type and its three-dimensional extent under a documented operating basis.</p><p>The result informs equipment protection, installation and operating controls. It does not certify a product, approve an installation, replace a process-risk assessment or predict the consequence of an ignition.</p></div><div className="mt-9 grid gap-px overflow-hidden border border-slate-200 bg-slate-200 md:grid-cols-3">{[[Map, 'Classification', 'Where can an explosive atmosphere occur, of what type and to what extent?'], [ShieldCheck, 'Equipment evidence', 'Does the apparatus marking, certificate and protection level suit that location?'], [FileCheck2, 'Installation evidence', 'Was the equipment designed, installed, inspected and maintained correctly?']].map(([Icon, title, body]) => { const ItemIcon = Icon as typeof Map; return <div key={title as string} className="bg-white p-7"><ItemIcon size={32} className="text-orange-500" /><h3 className="mt-5 text-xl font-black uppercase text-[#1A2B4C]">{title as string}</h3><p className="mt-3 text-sm font-medium leading-relaxed text-slate-600">{body as string}</p></div>; })}</div></section>

          <section id="standards" className="scroll-mt-28 pt-20"><SectionHeading number="02" eyebrow="Check the edition">The gas and dust standards are no longer on the same international edition cycle</SectionHeading><p className="mt-7 text-base font-medium leading-relaxed text-slate-600">The governing basis must be stated in the study. “IEC 60079 compliant” is too vague when the international dust-classification standard changed in 2026 and the verified South African adoption is still the 2018 edition.</p><div className="mt-9 space-y-4">{standards.map(([code, label, body]) => <div key={code} className="grid gap-4 border border-slate-200 bg-slate-50 p-6 sm:grid-cols-[200px_1fr]"><div><p className="font-mono text-sm font-black text-orange-600">{code}</p><p className="mt-2 text-xs font-bold uppercase tracking-wider text-[#1A2B4C]">{label}</p></div><p className="text-sm font-medium leading-relaxed text-slate-600">{body}</p></div>)}</div><div className="mt-7 flex items-start gap-4 border border-orange-200 bg-orange-50 p-6 text-sm font-medium leading-relaxed text-slate-700"><AlertTriangle size={22} className="mt-0.5 shrink-0 text-orange-600" /><p><strong className="text-[#1A2B4C]">Edition control matters:</strong> confirm the current SABS catalogue, contract specification and legal incorporation. Do not silently substitute a newer IEC edition for the published SANS edition.</p></div></section>

          <section id="zones" className="scroll-mt-28 pt-20"><SectionHeading number="03" eyebrow="Two hazard families">Gas zones and dust zones use parallel logic—but different numbers and evidence</SectionHeading><p className="mt-7 text-base font-medium leading-relaxed text-slate-600">The zone expresses how likely an explosive atmosphere is to be present and for how long. It does not describe consequence. The EPL shown is the expected minimum relationship; complete selection still needs the substance group, temperature, environment and certificate conditions.</p><div className="mt-9 grid gap-5 md:grid-cols-2">{[[Flame, 'Gas, vapour and mist', gasZones], [Wind, 'Combustible dust', dustZones]].map(([Icon, title, zones]) => { const ItemIcon = Icon as typeof Flame; return <div key={title as string} className="bg-[#0A1120] p-7 text-white"><ItemIcon size={32} className="text-orange-500" /><h3 className="mt-5 text-xl font-black uppercase">{title as string}</h3><div className="mt-6 divide-y divide-white/10">{(zones as string[][]).map(([zone, presence, epl]) => <div key={zone} className="grid grid-cols-[62px_1fr_42px] gap-3 py-4"><span className="font-mono text-lg font-black text-orange-500">Z{zone}</span><span className="text-xs font-medium leading-relaxed text-slate-300">{presence}</span><span className="font-mono text-xs font-black">{epl}</span></div>)}</div></div>; })}</div><p className="mt-5 border-l-2 border-orange-500 pl-5 text-sm font-medium leading-relaxed text-slate-600"><strong className="text-[#1A2B4C]">Do not classify by indicative hours alone.</strong> The familiar greater-than-1,000, 10–1,000 and under-10-hour bands are explanatory conventions, not the normative zone definitions.</p></section>

          <section id="inputs" className="scroll-mt-28 pt-20"><SectionHeading number="04" eyebrow="Build the basis">A useful study starts with plant evidence—not a borrowed drawing</SectionHeading><p className="mt-7 text-base font-medium leading-relaxed text-slate-600">Classification is multidisciplinary. Process knowledge defines the releases; operations explains real modes; maintenance and electrical teams expose installation and change history; the classification specialist turns those inputs into a controlled basis.</p><ul className="mt-9 grid gap-px overflow-hidden border border-slate-200 bg-slate-200 sm:grid-cols-2">{studyInputs.map((item, index) => <li key={item} className="flex gap-4 bg-white p-5 text-sm font-semibold leading-relaxed text-slate-700"><span className="font-mono text-xs font-black text-orange-500">{String(index + 1).padStart(2, '0')}</span>{item}</li>)}</ul></section>

          <section id="selection" className="scroll-mt-28 pt-20"><SectionHeading number="05" eyebrow="Carry the requirement forward">A zone number is only the first filter in equipment selection</SectionHeading><div className="mt-9 border-t-4 border-orange-500 bg-[#0A1120] p-7 text-white md:p-9"><p className="text-[10px] font-black uppercase tracking-[0.24em] text-orange-500">Illustrative gas-equipment marking</p><p className="mt-5 break-words font-mono text-3xl font-black tracking-wider md:text-5xl">Ex db IIB T4 Gb</p><div className="mt-7 grid gap-3 text-xs font-medium leading-relaxed text-slate-300 sm:grid-cols-4"><p><strong className="text-white">Ex db</strong><br />Type of protection</p><p><strong className="text-white">IIB</strong><br />Gas subgroup</p><p><strong className="text-white">T4</strong><br />Temperature class</p><p><strong className="text-white">Gb</strong><br />Equipment protection level</p></div><p className="mt-6 border-t border-white/10 pt-5 text-xs text-slate-400">Illustration only. Read the complete product marking, certificate, schedule, suffixes and special conditions for the actual apparatus.</p></div><ol className="mt-5 grid gap-px overflow-hidden border border-slate-200 bg-slate-200 sm:grid-cols-2">{selectionSteps.map(([number, title, body]) => <li key={number} className="bg-white p-6"><span className="font-mono text-xs font-black text-orange-500">{number}</span><h3 className="mt-3 text-lg font-black uppercase text-[#1A2B4C]">{title}</h3><p className="mt-3 text-sm font-medium leading-relaxed text-slate-600">{body}</p></li>)}</ol></section>

          <section id="south-africa" className="scroll-mt-28 pt-20"><SectionHeading number="06" eyebrow="South African surface industries">The legal route connects classification, suitable apparatus, certification and recurring inspection</SectionHeading><div className="mt-7 space-y-6 text-base font-medium leading-relaxed text-slate-600"><p>Regulation 9 of the Electrical Machinery Regulations, 2011 requires an employer using electrical machinery in a hazardous location to identify and classify that location, use electrical machinery suitable for it, obtain the prescribed certificate and arrange inspection and testing at intervals not exceeding two years.</p><p>SANS 10108 is incorporated under section 44 of the Occupational Health and Safety Act. The 2022 National Code of Practice for Electrical Machinery in Hazardous Locations adds the surface-industry certification framework for explosion-protected apparatus.</p></div><div className="mt-9 grid gap-px overflow-hidden border border-slate-200 bg-slate-200 md:grid-cols-2"><div className="bg-[#1A2B4C] p-7 text-white"><ShieldCheck size={34} className="text-orange-500" /><h3 className="mt-5 text-xl font-black uppercase">What to verify</h3><ul className="mt-5 space-y-3 text-sm font-medium leading-relaxed text-slate-300"><li>Applicable IA certificate and current status</li><li>Certificate schedule and special conditions</li><li>Match between product, marking and certified configuration</li><li>Installation CoC and inspection records</li></ul></div><div className="bg-white p-7"><AlertTriangle size={34} className="text-orange-500" /><h3 className="mt-5 text-xl font-black uppercase text-[#1A2B4C]">What not to assume</h3><ul className="mt-5 space-y-3 text-sm font-medium leading-relaxed text-slate-600"><li>An IECEx CoC or ATEX document alone completes the local route</li><li>A ten-year manufacturing certificate means apparatus expires after ten years</li><li>A nameplate proves the installed unit matches every condition</li><li>Classification and product certification are the same decision</li></ul></div></div><p className="mt-6 text-sm font-medium leading-relaxed text-slate-600">The National Code states a ten-year validity period for manufacturing purposes. Apparatus manufactured while that certificate was valid remains considered certified after the certificate expires. Overseas-certificate-based IA certificates follow a different, shorter validity framework.</p></section>

          <section id="regional" className="scroll-mt-28 pt-20"><SectionHeading number="07" eyebrow="Jurisdiction matters">Do not turn a South African surface-industry pathway into a regional promise</SectionHeading><div className="mt-9 grid gap-5 md:grid-cols-2"><div className="border-t-4 border-orange-500 bg-slate-50 p-7"><Layers3 size={32} className="text-orange-500" /><h3 className="mt-5 text-xl font-black uppercase text-[#1A2B4C]">Mining</h3><p className="mt-4 text-sm font-medium leading-relaxed text-slate-600">South African mines fall under the Mine Health and Safety Act and DMRE framework. Equipment groups, methane and coal-dust hazards, certification and competent-person duties must be assessed under that regime—not copied from a surface plant.</p></div><div className="border-t-4 border-orange-500 bg-[#1A2B4C] p-7 text-white"><Map size={32} className="text-orange-500" /><h3 className="mt-5 text-xl font-black uppercase">Southern Africa</h3><p className="mt-4 text-sm font-medium leading-relaxed text-slate-300">IEC zone terminology may be familiar across the region, but legislation, standards adoption, accreditation, product acceptance and enforcement differ. Confirm each country and sector before stating a compliance route.</p></div></div></section>

          <section id="review" className="scroll-mt-28 pt-20"><SectionHeading number="08" eyebrow="Keep the basis alive">Management of change should reopen the classification before the plant outgrows it</SectionHeading><ul className="mt-9 space-y-3">{reviewTriggers.map((trigger) => <li key={trigger} className="flex items-start gap-3 border border-slate-200 bg-slate-50 p-5 text-sm font-bold leading-relaxed text-slate-700"><RefreshCcw size={17} className="mt-0.5 shrink-0 text-orange-500" />{trigger}</li>)}</ul></section>

          <section id="misconceptions" className="scroll-mt-28 pt-20"><SectionHeading number="09" eyebrow="Five misconceptions">Shortcuts that break the evidence chain</SectionHeading><div className="mt-9 divide-y divide-slate-200 border-y border-slate-200">{misconceptions.map(([claim, correction], index) => <div key={claim} className="grid gap-4 py-7 sm:grid-cols-[52px_1fr]"><span className="font-mono text-sm font-black text-orange-500">{String(index + 1).padStart(2, '0')}</span><div><h3 className="text-lg font-black text-[#1A2B4C]">{claim}</h3><p className="mt-3 text-sm font-medium leading-relaxed text-slate-600">{correction}</p></div></div>)}</div></section>

          <section id="faqs" className="scroll-mt-28 pt-20"><p className="text-xs font-black uppercase tracking-[0.28em] text-orange-500">Common questions</p><h2 className="mt-4 text-3xl font-black uppercase leading-tight text-[#1A2B4C] md:text-4xl">Hazardous-area questions plant teams ask first</h2><div className="mt-9 divide-y divide-slate-200 border-y border-slate-200">{faqs.map((faq) => <details key={faq.question} className="group py-6"><summary className="flex cursor-pointer list-none items-center justify-between gap-5 text-lg font-black text-[#1A2B4C] marker:content-none">{faq.question}<span className="text-2xl text-orange-500 transition-transform group-open:rotate-45">+</span></summary><p className="mt-4 max-w-3xl pr-10 text-sm font-medium leading-relaxed text-slate-600">{faq.answer}</p></details>)}</div></section>

          <section id="sources" className="scroll-mt-28 pt-20"><p className="text-xs font-black uppercase tracking-[0.28em] text-orange-500">Authoritative references</p><h2 className="mt-4 text-3xl font-black uppercase leading-tight text-[#1A2B4C] md:text-4xl">Sources and further reading</h2><p className="mt-6 text-sm font-medium leading-relaxed text-slate-600">Four supplied research reports were consolidated for this rewrite. Conflicting edition and certification claims were resolved against IEC catalogue records, official South African standards notices, consolidated regulations and scheme-owner material.</p><ul className="mt-7 space-y-3">{sources.map(([name, href]) => <li key={href}><a href={href} target="_blank" rel="noreferrer" className="inline-flex items-start gap-3 text-sm font-bold leading-relaxed text-[#1A2B4C] hover:text-orange-600"><ExternalLink size={15} className="mt-0.5 shrink-0 text-orange-500" />{name}</a></li>)}</ul><div className="mt-10 border-t-4 border-orange-500 bg-[#0A1120] p-7 text-white md:p-9"><h3 className="flex items-center gap-3 text-xl font-black uppercase"><FileCheck2 className="text-orange-500" />What this article does not promise</h3><p className="mt-5 text-sm font-medium leading-relaxed text-slate-300">This article does not claim that Touch Teqniques Engineering is SANAS-accredited, an approved inspection authority, an approved test laboratory or a product-certification body. It does not certify equipment, issue IA certificates, guarantee legal compliance or replace a site-specific classification by competent people. Certification, installation design, inspection and legal interpretation require the correct independent scope and authority.</p></div></section>

          <div className="mt-16 border-t border-slate-200 pt-8 text-sm font-medium leading-relaxed text-slate-500"><p>This guide is general technical information. Confirm the applicable legislation, standards editions, sector, certificate route, competence and project basis for the specific site and decision.</p></div>
          <ArticleAuthorityBox variant="source-review" updated="11 August 2026" topics={['Hazardous area classification', 'SANS 10108', 'IEC 60079 gas and dust zones', 'South African Ex equipment boundaries']} />
        </article>
      </div></section>

      <section className="bg-[#0A1120] py-20 text-white"><div className="container mx-auto px-4 text-center md:px-8"><p className="text-xs font-black uppercase tracking-[0.3em] text-orange-500">Need to define the scope?</p><h2 className="mx-auto mt-5 max-w-4xl text-3xl font-black uppercase leading-tight md:text-5xl">Start with the plant basis, release sources and current drawings—not a generic zone template.</h2><p className="mx-auto mt-6 max-w-2xl text-base font-medium leading-relaxed text-slate-300">Share the facility type, substances, process stage and available records. Touch Teqniques can clarify the engineering scope and identify where an approved inspection authority, certification body or other independent specialist is required.</p><Link href="/contact#request-quote" className="group mt-9 inline-flex items-center gap-3 rounded-md bg-orange-500 px-7 py-4 text-xs font-black uppercase tracking-[0.16em] text-white hover:bg-orange-600">Request a Scoping Discussion<ArrowRight size={16} className="transition-transform group-hover:translate-x-1" /></Link></div></section>
      <BackToTop /><Footer />
    </main>
  );
}
