import Image from 'next/image';
import Link from 'next/link';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  ClipboardCheck,
  Clock,
  ExternalLink,
  FileCheck2,
  Flame,
  Gauge,
  Layers3,
  LockKeyhole,
  Network,
  RadioTower,
  ShieldCheck,
  Workflow,
  XCircle,
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

const articleUrl = 'https://www.touchteq.co.za/insights/fire-and-gas-system-commissioning';
const contactHref = '/contact?service=Fire%20and%20Gas%20Detection%20Systems#request-quote';
const detailTags = ['Fire & Gas', 'Commissioning', 'Cause & Effect'];

const guideSections = [
  ['#proof', 'What commissioning proves'],
  ['#phases', 'The commissioning sequence'],
  ['#scope', 'Keep the scopes separate'],
  ['#standards', 'Standards landscape'],
  ['#readiness', 'Inputs before testing'],
  ['#detectors', 'Detector-specific work'],
  ['#test-depth', 'What each test proves'],
  ['#inhibits', 'Inhibits and restoration'],
  ['#cause-effect', 'Cause-and-effect testing'],
  ['#handover', 'The handover dossier'],
  ['#south-africa', 'South African context'],
  ['#misconceptions', 'Five misconceptions'],
  ['#faqs', 'Frequently asked questions'],
  ['#sources', 'Sources and boundaries'],
] as const;

const phases = [
  ['01', 'Pre-commissioning', 'Confirm approved documents, installation completion, identification, wiring, power, earthing, certificates and test readiness.'],
  ['02', 'FAT / FIT', 'Demonstrate configured automation and interfaces against the agreed specification before shipment, where included in the project.'],
  ['03', 'SAT / SIT', 'Confirm the delivered system and its site interfaces after installation, using the agreed acceptance plan.'],
  ['04', 'Loop checks', 'Prove field-to-system signal identity, scaling, direction, status and output continuity for each loop.'],
  ['05', 'Detector commissioning', 'Apply the model-appropriate stimulus and verify the installed detector, local indication, signal and configured alarm behaviour.'],
  ['06', 'Cause and effect', 'Test each required input condition, voting path, delay, alarm and executive action against the approved matrix.'],
  ['07', 'Integrated testing', 'Prove the required interactions with ESD, DCS, HVAC, PAGA, firewater or suppression interfaces within the agreed boundary.'],
  ['08', 'Acceptance and handover', 'Close critical defects, reconcile every inhibit, preserve configuration and test evidence, train users and complete the site approval gate.'],
] as const;

const scopeCards = [
  {
    icon: Flame,
    title: 'Process F&G',
    body: 'Open process areas and loss-of-containment hazards. The design basis may include flame, combustible-gas and toxic-gas coverage, voting and mitigation interfaces.',
    basis: 'ISA-TR84.00.07 and project F&G philosophy',
  },
  {
    icon: RadioTower,
    title: 'Building fire alarm',
    body: 'Life-safety detection, alarm and evacuation functions in non-domestic buildings. Its commissioning and certificate route is not proof of process-area F&G performance.',
    basis: 'SANS 10139 where applicable',
  },
  {
    icon: Gauge,
    title: 'Gaseous suppression',
    body: 'Detection and release logic plus the mechanical agent system, enclosure and safety provisions. It needs its own correctly scoped acceptance evidence.',
    basis: 'Applicable SANS 14520 parts and project basis',
  },
  {
    icon: ShieldCheck,
    title: 'ESD / SIS interfaces',
    body: 'Only the functions identified as safety instrumented functions sit inside the IEC 61511 lifecycle. An F&G interface is not automatically a SIF.',
    basis: 'IEC 61511 where the function qualifies',
  },
] as const;

const standards = [
  ['IEC 62381:2024', 'Defines FAT, FIT, SAT and SIT requirements and checklists for process-industry automation systems. It is a useful acceptance framework, not a substitute for detector commissioning, loop records or site validation.'],
  ['ISA-TR84.00.07-2018', 'Addresses evaluation of fire, combustible-gas and toxic-gas detection-system effectiveness in process areas, including coverage and system performance considerations.'],
  ['IEC 60079-29-2:2015', 'Provides guidance for selection, installation, use and maintenance of equipment detecting flammable gases and oxygen.'],
  ['IEC 62990-2:2021', 'Provides corresponding guidance for equipment measuring toxic gases and vapours in workplace atmospheres.'],
  ['SANS 10139', 'Applies to fire detection and fire-alarm systems in and around non-domestic buildings. Do not extend it to open process-area F&G by implication.'],
  ['SANS 14520 series', 'Addresses gaseous fire-extinguishing systems. The applicable part, agent and project edition must be identified rather than citing the series as one universal procedure.'],
] as const;

const readinessInputs = [
  'Approved F&G philosophy or design basis and the final cause-and-effect matrix',
  'Instrument index, detector schedule, layouts, mapping basis and tag/location cross-reference',
  'Loop, I/O, wiring and interface drawings with current revisions',
  'Detector datasheets, certificates, OEM manuals and configuration records for the installed model',
  'Approved test procedures, inspection and test plans, acceptance criteria and blank result sheets',
  'Defined witnesses, signatories, permits, risk controls and responsibilities',
  'Inhibit, override, isolation and restoration procedure with a live register',
  'Calibrated reference equipment and in-date test media appropriate to the exact detector',
] as const;

const detectorRules = [
  ['Exact test medium', 'Target gas, surrogate gas, zero method and concentration must come from the installed sensor instructions and approved procedure.'],
  ['Exact delivery method', 'Flow, pressure, adapter, tubing material, exposure time and warm-up requirements vary by model and gas.'],
  ['Exact optical method', 'A test lamp is not universal. Some flame-detector families require a specific simulator; others use automatic optical-integrity testing and state that an external lamp is not required.'],
  ['Exact output behaviour', 'Maintenance current, alarm relays, latching, delays, HART status and inhibit behaviour must be checked against the configured device and logic.'],
] as const;

const testStages = [
  ['Self-test / panel health', 'Internal diagnostics, communications or a configured status path.', 'Exposure to the real test stimulus, installed orientation or every external action.'],
  ['Loop check', 'Tag identity, wiring continuity, scaling, polarity and signal path to or from the system.', 'Detector sensitivity to gas or flame, coverage, voting logic or integrated plant action.'],
  ['Detector functional test', 'The installed device responds to the approved physical stimulus and sends the expected signal.', 'Every C&E branch, remote interface, final element or untested hazard scenario.'],
  ['Cause-and-effect test', 'The programmed input condition produces the required alarms, voting, delays and outputs.', 'That a field detector can sense the hazard unless the test starts with a suitable physical stimulus.'],
  ['Integrated end-to-end test', 'The agreed chain works across detector, I/O, logic and connected systems within the test boundary.', 'All future environmental conditions, all release scenarios or performance beyond the approved design basis.'],
] as const;

const inhibitSteps = [
  ['Authorise', 'Identify the function affected, reason, owner, duration and permitted compensating measures before applying the inhibit.'],
  ['Make visible', 'Record the point in the live register and show the inhibited or isolated state clearly at the relevant system and work area.'],
  ['Minimise', 'Limit the number, duration and functional extent of inhibits to what the approved test requires.'],
  ['Restore', 'Remove the force, bypass or physical isolation and confirm that the normal configuration is reinstated.'],
  ['Re-test and reconcile', 'Functionally verify the restored path where required, close the register entry and reconcile all open items before handover.'],
] as const;

const dossierItems = [
  'Approved FAT, FIT, SAT and SIT records included in the project scope',
  'Loop-check sheets and detector commissioning records by tag',
  'Test-gas cylinder identification, concentration and certificate details where used',
  'Cause-and-effect results showing expected versus actual response',
  'Integrated-interface test records and final-element isolation references',
  'Calibration and reference-equipment evidence relevant to the tests',
  'Complete inhibit, override, bypass and restoration history',
  'Punch-list status with safety-critical acceptance decisions recorded',
  'Final configuration backups, approved software versions and as-built drawings',
  'Training, operating handover and the site’s formal pre-startup approval record',
] as const;

const readinessGates = [
  'The approved design basis and acceptance criteria are available and controlled.',
  'Installation, loop, detector, C&E and required interface tests are complete for the agreed scope.',
  'Safety-critical defects are closed or handled through the site’s formal risk and acceptance process.',
  'Every temporary inhibit, force, override and isolation is reconciled and the required normal state is proven.',
  'Configuration backups, as-builts, test records, operating procedures and training are available to the duty holder.',
  'The site’s authorised pre-startup review and decision process is complete before hazardous inventory is introduced.',
] as const;

const misconceptions = [
  ['“The FAT passed, so the site system is ready.”', 'FAT can prove configured functions in a controlled factory environment. It does not prove site installation, field wiring, detector orientation, final interfaces or restored operating state.'],
  ['“A healthy self-test means the detector is commissioned.”', 'Diagnostics are valuable, but their proof boundary is model-specific. Commissioning still needs the approved installed-device and system tests.'],
  ['“A loop check is an end-to-end commissioning test.”', 'A loop check proves the signal path. It does not, by itself, prove physical detection, C&E logic or the final action.'],
  ['“One fire registration or certificate covers every F&G activity.”', 'Building fire alarm, gaseous suppression, process F&G and SIS work have different scopes and competency evidence. Confirm the exact work and applicable scheme.'],
  ['“Once commissioning is complete, the system remains proven.”', 'Commissioning is a baseline. Maintenance, proof testing, impairment control and management of change are needed to preserve the evidence.'],
] as const;

const faqs = [
  {
    question: 'What is the difference between FAT, SAT, a loop check and commissioning?',
    answer: 'FAT and SAT demonstrate agreed automation-system requirements before and after site delivery. A loop check proves the field signal path. Commissioning is the broader programme that brings installation, detector response, logic, interfaces, records, restoration and operational acceptance together.',
  },
  {
    question: 'What does a cause-and-effect test prove?',
    answer: 'It proves that a defined input condition or voting state produces the alarms, delays, outputs and executive actions required by the approved matrix. If the input is simulated, the test does not also prove that the field detector responds to a real gas or flame stimulus.',
  },
  {
    question: 'Which documents should be ready before site testing starts?',
    answer: 'At minimum, the approved philosophy, final cause-and-effect matrix, detector and I/O schedules, current drawings, OEM instructions, acceptance procedure, test sheets, responsibility matrix and inhibit-control process should be available for the agreed scope.',
  },
  {
    question: 'How should commissioning inhibits and bypasses be controlled?',
    answer: 'They should be authorised, visible, recorded, limited to the approved test, reviewed at handover and formally restored. The restored path should be functionally checked where the project procedure requires it.',
  },
  {
    question: 'Who accepts the final commissioning dossier?',
    answer: 'The project responsibility matrix should define the tester, witnesses, reviewers and duty-holder acceptance authority. Different signatories may apply to process F&G, building fire alarm, gaseous suppression and SIS work, so the role must not be assumed from one certificate or registration.',
  },
];

const sources = [
  ['IEC — IEC 62381:2024, FAT, FIT, SAT and SIT', 'https://webstore.iec.ch/en/publication/67572'],
  ['ISA — ISA-TR84.00.07-2018, F&G system effectiveness', 'https://www.isa.org/standards-and-publications/isa-standards/isa-84-standards'],
  ['IEC — IEC 60079-29-2:2015, flammable-gas and oxygen detectors', 'https://webstore.iec.ch/en/publication/21961'],
  ['IEC — IEC 62990-2:2021, toxic-gas and vapour detectors', 'https://webstore.iec.ch/en/publication/59456'],
  ['SABS — SANS 10139:2021 Edition 4 catalogue record', 'https://store.sabs.co.za/catalog/product/view/id/2144915/s/sans-10139-2021-ed-4-00/category/108/'],
  ['SABS — SANS 14520-1:2019 Edition 3 catalogue record', 'https://store.sabs.co.za/catalog/product/view/id/2143341/s/sans-14520-1-2019-ed-3-00/'],
  ['South African Government — Major Hazard Installation Regulations, 2022', 'https://www.gov.za/sites/default/files/gcis_document/202302/47970rg11536gon2989.pdf'],
  ['South African Government — MHI Regulations implementation update', 'https://www.gov.za/news/media-advisories/government-activities/employment-and-labour-launches-implementation-major'],
  ['OSHA — 29 CFR 1910.119 pre-startup safety review benchmark', 'https://www.osha.gov/laws-regs/regulations/standardnumber/1910/1910.119'],
  ['Dräger — Polytron 7000 model-specific calibration instructions', 'https://www.draeger.com/Content/Documents/Products/polytron-7000-ifu-9033002-en.pdf'],
  ['Det-Tronics — X5200 model-specific optical-integrity instructions', 'https://www.det-tronics.com/wp-content/uploads/sites/8/2025/04/95-8546-19.2-X5200-Web.pdf'],
] as const;

const articleJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: 'Fire and Gas System Commissioning: What a Credible Handover Must Prove',
  description: 'A source-led guide to F&G commissioning stages, cause-and-effect testing, detector-specific procedures, inhibit control and handover evidence.',
  image: 'https://www.touchteq.co.za/f&g.jpeg',
  author: { '@type': 'Organization', name: 'Touch Teqniques Engineering' },
  publisher: {
    '@type': 'Organization',
    name: 'Touch Teqniques Engineering',
    logo: { '@type': 'ImageObject', url: 'https://www.touchteq.co.za/touch-teq-logo-wordmark.jpeg' },
  },
  datePublished: '2026-08-11T00:00:00+02:00',
  dateModified: '2026-08-11T00:00:00+02:00',
  mainEntityOfPage: articleUrl,
  keywords: 'fire and gas commissioning, cause and effect testing, detector commissioning, FAT, SAT, loop checks, inhibit control, South Africa',
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

export default function FireGasCommissioningArticle() {
  return (
    <main className="min-h-screen bg-white">
      <BreadcrumbJsonLd items={[{ name: 'Home', url: 'https://www.touchteq.co.za' }, { name: 'Insights', url: 'https://www.touchteq.co.za/insights' }, { name: 'Fire and Gas System Commissioning', url: articleUrl }]} />
      <FAQJsonLd faqs={faqs} />
      <JsonLd data={articleJsonLd} />
      <Header />

      <section className="relative overflow-hidden bg-[#0A1120] pb-24 pt-36 text-white md:pb-32 md:pt-48">
        <div className="absolute inset-0">
          <Image src="/f&g.jpeg" alt="" fill priority sizes="100vw" className="object-cover object-center" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0A1120]/88 via-[#0A1120]/48 to-[#0A1120]/12" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0A1120]/55 via-transparent to-[#0A1120]/10" />
        </div>
        <div className="container relative mx-auto px-4 md:px-8">
          <Link href="/insights" className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-wider text-orange-500 hover:text-orange-300"><ArrowLeft size={15} />Back to Insights</Link>
          <div className="mt-8 flex flex-wrap items-center gap-x-4 gap-y-2 text-[11px] font-bold uppercase tracking-wider text-slate-200">
            <span className="rounded bg-orange-500 px-3 py-1.5 text-white">Technical article</span>
            <span className="inline-flex items-center gap-1.5 normal-case tracking-normal"><Clock size={14} />16 min read</span>
            {detailTags.map((tag, index) => <span key={tag}>{index > 0 && <span className="mr-4 text-orange-400">·</span>}{tag}</span>)}
          </div>
          <h1 className="mt-9 max-w-5xl text-4xl font-black uppercase leading-[0.98] tracking-tight sm:text-5xl md:text-7xl">Fire and gas system commissioning:{' '}<span className="bg-gradient-to-r from-[#FF6900] to-orange-300 bg-clip-text text-transparent">what a credible handover must prove.</span></h1>
          <p className="mt-8 max-w-3xl text-base font-medium leading-relaxed text-slate-200 md:text-lg">Commissioning is not a panel health check or a folder of signed sheets. It is a controlled body of evidence showing that the installed detection, logic, interfaces and required actions perform against an approved design basis.</p>
        </div>
      </section>

      <section className="border-b border-slate-200 bg-slate-50 py-8">
        <div className="container mx-auto px-4 md:px-8"><p className="max-w-4xl text-sm font-medium leading-relaxed text-slate-600"><span className="font-black uppercase text-[#1A2B4C]">Quick answer:</span>{' '}A credible F&G commissioning programme separates each test stage, uses the exact detector instructions, proves the required cause-and-effect paths, controls every temporary inhibit and leaves an auditable dossier. No single FAT, self-test, loop check or certificate proves the whole system.</p></div>
      </section>

      <section className="py-16 md:py-24">
        <div className="container mx-auto grid gap-12 px-4 md:px-8 lg:grid-cols-[220px_minmax(0,780px)] lg:justify-center lg:gap-16">
          <aside className="hidden lg:block">
            <nav aria-label="Article contents" className="sticky top-32 border-l border-slate-200 pl-5">
              <p className="mb-4 text-[10px] font-black uppercase tracking-[0.22em] text-orange-500">In this guide</p>
              <ol className="space-y-3 text-sm font-bold leading-snug text-slate-500">{guideSections.map(([href, label]) => <li key={href}><a className="hover:text-orange-600" href={href}>{label}</a></li>)}</ol>
            </nav>
          </aside>

          <article>
            <ShareButton title="Fire and Gas System Commissioning: What a Credible Handover Must Prove" description="A source-led guide to commissioning stages, cause-and-effect tests, detector procedures, inhibit control and handover evidence." url={articleUrl} className="mb-6" />
            <ArticleAudioPlayer />

            <div className="border-l-4 border-orange-500 bg-orange-50 p-6 text-sm font-medium leading-relaxed text-slate-700 md:p-8">
              <p className="font-black uppercase tracking-wide text-[#1A2B4C]">The central commissioning question</p>
              <p className="mt-3">Can the team trace an approved requirement through the installed detector, wiring, I/O, logic and required plant action—and show that every temporary test condition was safely removed afterwards?</p>
            </div>

            <section id="proof" className="scroll-mt-28 pt-16">
              <SectionHeading number="01" eyebrow="Define the proof boundary">Commissioning proves the installed chain—not every future hazard scenario</SectionHeading>
              <div className="mt-7 space-y-6 text-base font-medium leading-relaxed text-slate-600">
                <p>A process F&G system is built to detect defined fire, combustible-gas or toxic-gas conditions and initiate specified responses. Commissioning demonstrates the parts of that design intent covered by the approved tests. The claim must stay inside that boundary.</p>
                <p>That matters because a green status light can coexist with a field-of-view obstruction, a wrong tag, a disabled output or a mismatched cause-and-effect line. Each test closes a different part of the evidence chain.</p>
              </div>
              <div className="mt-9 grid gap-px overflow-hidden border border-slate-200 bg-slate-200 sm:grid-cols-5">
                {[['01', 'Stimulus'], ['02', 'Detector'], ['03', 'I/O'], ['04', 'Logic'], ['05', 'Action']].map(([number, label], index) => <div key={label} className="relative bg-[#0A1120] p-5 text-center text-white"><span className="font-mono text-xs font-black text-orange-500">{number}</span><p className="mt-3 text-sm font-black uppercase">{label}</p>{index < 4 && <ArrowRight size={16} className="absolute -right-2 top-1/2 z-10 hidden -translate-y-1/2 text-orange-500 sm:block" />}</div>)}
              </div>
            </section>

            <section id="phases" className="scroll-mt-28 pt-20">
              <SectionHeading number="02" eyebrow="Sequence the evidence">Eight phases turn separate checks into an accepted system</SectionHeading>
              <p className="mt-7 text-base font-medium leading-relaxed text-slate-600">Projects may name or group the phases differently. The important discipline is to define what each stage proves, its entry criteria, witnesses, records and exit decision.</p>
              <ol className="mt-9 border-y border-slate-200">{phases.map(([number, title, body]) => <li key={number} className="grid gap-4 border-b border-slate-200 py-6 last:border-b-0 sm:grid-cols-[62px_1fr]"><span className="font-mono text-sm font-black text-orange-500">{number}</span><div><h3 className="text-lg font-black uppercase text-[#1A2B4C]">{title}</h3><p className="mt-2 text-sm font-medium leading-relaxed text-slate-600">{body}</p></div></li>)}</ol>
            </section>

            <section id="scope" className="scroll-mt-28 pt-20">
              <SectionHeading number="03" eyebrow="Prevent scope gaps">Four systems can share interfaces without sharing one standard or certificate</SectionHeading>
              <p className="mt-7 text-base font-medium leading-relaxed text-slate-600">Industrial sites often use “fire and gas” as an umbrella term. Commissioning plans must be more precise because process detection, building alarms, gaseous suppression and safety-instrumented functions have different purposes and acceptance routes.</p>
              <div className="mt-9 grid gap-5 sm:grid-cols-2">{scopeCards.map(({ icon: Icon, title, body, basis }) => <div key={title} className="border-t-4 border-orange-500 bg-slate-50 p-7"><Icon size={31} className="text-orange-500" /><h3 className="mt-5 text-xl font-black uppercase text-[#1A2B4C]">{title}</h3><p className="mt-3 text-sm font-medium leading-relaxed text-slate-600">{body}</p><p className="mt-5 border-t border-slate-200 pt-4 text-[10px] font-black uppercase tracking-wider text-slate-500">{basis}</p></div>)}</div>
            </section>

            <section id="standards" className="scroll-mt-28 pt-20">
              <SectionHeading number="04" eyebrow="Name the exact scope">“The standard requires it” is not enough</SectionHeading>
              <p className="mt-7 text-base font-medium leading-relaxed text-slate-600">The governing edition, system boundary and contractual status should be written into the test basis. A guidance document can become contractually required, but that does not turn it into South African legislation.</p>
              <div className="mt-9 space-y-4">{standards.map(([code, body]) => <div key={code} className="grid gap-4 border border-slate-200 bg-white p-6 sm:grid-cols-[190px_1fr]"><p className="font-mono text-sm font-black text-orange-600">{code}</p><p className="text-sm font-medium leading-relaxed text-slate-600">{body}</p></div>)}</div>
              <div className="mt-7 flex gap-4 border border-orange-200 bg-orange-50 p-6"><AlertTriangle size={22} className="mt-0.5 shrink-0 text-orange-600" /><p className="text-sm font-medium leading-relaxed text-slate-700"><strong className="text-[#1A2B4C]">Boundary:</strong> IEC 62381 defines specific automation acceptance tests. It should not be cited as proof that the entire detector, loop, C&E, integrated-test and operational-readiness programme has been completed.</p></div>
            </section>

            <section id="readiness" className="scroll-mt-28 pt-20">
              <SectionHeading number="05" eyebrow="Prepare before energisation">Testing should start from controlled inputs—not assumptions</SectionHeading>
              <ul className="mt-9 grid gap-px overflow-hidden border border-slate-200 bg-slate-200 sm:grid-cols-2">{readinessInputs.map((item, index) => <li key={item} className="flex gap-4 bg-white p-5 text-sm font-semibold leading-relaxed text-slate-700"><span className="font-mono text-xs font-black text-orange-500">{String(index + 1).padStart(2, '0')}</span>{item}</li>)}</ul>
              <p className="mt-6 border-l-2 border-orange-500 pl-5 text-sm font-medium leading-relaxed text-slate-600">If the final C&E matrix, test acceptance criteria or installed model instructions are missing, the team cannot reliably distinguish a passed test from a test that merely produced activity.</p>
            </section>

            <section id="detectors" className="scroll-mt-28 pt-20">
              <SectionHeading number="06" eyebrow="Follow the exact manual">Gas and flame detectors cannot be commissioned from one generic recipe</SectionHeading>
              <div className="mt-7 space-y-6 text-base font-medium leading-relaxed text-slate-600"><p>The safe, valid test method depends on sensor technology, target gas, cross-sensitivity, firmware, accessories, output configuration and installation. Even devices from one manufacturer can use different procedures.</p><p>For example, some detector instructions specify calibration gas concentration and flow through a dedicated adapter. Some optical flame detectors use a named simulator; other models perform automatic optical-integrity checks and explicitly state that an external test lamp is not required. The model manual decides.</p></div>
              <div className="mt-9 grid gap-px overflow-hidden border border-slate-200 bg-slate-200 sm:grid-cols-2">{detectorRules.map(([title, body]) => <div key={title} className="bg-[#0A1120] p-7 text-white"><CheckCircle2 size={26} className="text-orange-500" /><h3 className="mt-4 text-lg font-black uppercase">{title}</h3><p className="mt-3 text-sm font-medium leading-relaxed text-slate-300">{body}</p></div>)}</div>
            </section>

            <section id="test-depth" className="scroll-mt-28 pt-20">
              <SectionHeading number="07" eyebrow="Avoid false confidence">Every test proves something—and leaves something unproven</SectionHeading>
              <div className="mt-9 space-y-5">{testStages.map(([stage, proves, doesNot]) => <div key={stage} className="border border-slate-200"><div className="bg-[#1A2B4C] px-6 py-4 text-sm font-black uppercase text-white">{stage}</div><div className="grid gap-px bg-slate-200 sm:grid-cols-2"><div className="bg-white p-6"><p className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-emerald-700"><CheckCircle2 size={17} />What it proves</p><p className="mt-3 text-sm font-medium leading-relaxed text-slate-600">{proves}</p></div><div className="bg-slate-50 p-6"><p className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-rose-700"><XCircle size={17} />What it does not prove</p><p className="mt-3 text-sm font-medium leading-relaxed text-slate-600">{doesNot}</p></div></div></div>)}</div>
            </section>

            <section id="inhibits" className="scroll-mt-28 pt-20">
              <SectionHeading number="08" eyebrow="Control temporary states">An inhibit is part of the test—and part of the risk</SectionHeading>
              <p className="mt-7 text-base font-medium leading-relaxed text-slate-600">Testing may require suppressed alarms, isolated final elements, software forces or release prevention. Each one temporarily changes the protective configuration. A credible programme makes that change explicit and proves the return to normal.</p>
              <div className="mt-9 space-y-3">{inhibitSteps.map(([title, body], index) => <div key={title} className="grid gap-4 border border-slate-200 bg-slate-50 p-5 sm:grid-cols-[48px_140px_1fr]"><span className="flex h-9 w-9 items-center justify-center rounded-full bg-orange-500 font-mono text-xs font-black text-white">{index + 1}</span><h3 className="text-sm font-black uppercase text-[#1A2B4C]">{title}</h3><p className="text-sm font-medium leading-relaxed text-slate-600">{body}</p></div>)}</div>
            </section>

            <section id="cause-effect" className="scroll-mt-28 pt-20">
              <SectionHeading number="09" eyebrow="Test the required responses">Cause-and-effect testing is a controlled comparison—not an improvised alarm demonstration</SectionHeading>
              <p className="mt-7 text-base font-medium leading-relaxed text-slate-600">For each matrix line, the team needs a defined initial state, input condition, expected voting and delay, required outputs, permitted isolations, witness and recorded result. A mismatch should become a controlled defect, not an on-the-spot undocumented logic change.</p>
              <div className="mt-9 border-t-4 border-orange-500 bg-[#0A1120] p-7 text-white md:p-9">
                <p className="text-[10px] font-black uppercase tracking-[0.24em] text-orange-500">Example evidence path</p>
                <div className="mt-6 grid gap-4 md:grid-cols-3"><div><Network className="text-orange-500" /><h3 className="mt-4 font-black uppercase">Input condition</h3><p className="mt-2 text-sm text-slate-300">Actual detector stimulus or a documented simulation at the agreed point.</p></div><div><Workflow className="text-orange-500" /><h3 className="mt-4 font-black uppercase">Logic response</h3><p className="mt-2 text-sm text-slate-300">Voting, alarm, delay, latching, reset and interface behaviour.</p></div><div><LockKeyhole className="text-orange-500" /><h3 className="mt-4 font-black uppercase">Safe restoration</h3><p className="mt-2 text-sm text-slate-300">Final elements restored, forces removed and normal state reconciled.</p></div></div>
              </div>
            </section>

            <section id="handover" className="scroll-mt-28 pt-20">
              <SectionHeading number="10" eyebrow="Preserve the baseline">The dossier should let another competent team reconstruct what was tested</SectionHeading>
              <ul className="mt-9 space-y-3">{dossierItems.map((item) => <li key={item} className="flex items-start gap-3 border border-slate-200 bg-white p-5 text-sm font-semibold leading-relaxed text-slate-700"><FileCheck2 size={18} className="mt-0.5 shrink-0 text-orange-500" />{item}</li>)}</ul>
              <p className="mt-6 text-sm font-medium leading-relaxed text-slate-600">The project responsibility matrix should name who performs, witnesses, reviews and accepts each record. Those roles differ by system and jurisdiction; they should not be inferred from a generic title such as “commissioner.”</p>
            </section>

            <section id="south-africa" className="scroll-mt-28 pt-20">
              <SectionHeading number="11" eyebrow="South African context">Regulation creates duty-holder obligations—not a universal F&G test procedure</SectionHeading>
              <div className="mt-7 space-y-6 text-base font-medium leading-relaxed text-slate-600"><p>Section 8 of the Occupational Health and Safety Act creates a general employer duty to provide and maintain a working environment that is safe and without risk to employees. It does not prescribe one fire-and-gas commissioning sequence.</p><p>The Major Hazard Installation Regulations, 2022 establish duties around classification, risk assessment, major-incident prevention, safety reporting, licensing and emergency arrangements for covered establishments. They can make reliable risk-control evidence important, but they do not provide the detector-by-detector F&G commissioning method.</p><p>SANS 10139 and the SANS 14520 series should be applied only to their building fire-alarm and gaseous-suppression scopes. Current competency, registration and certificate requirements must be confirmed for the exact contracted activity. No single SAQCC Fire category should be presented as proof of competence for every process F&G, mapping, ESD or SIS task.</p></div>
              <div className="mt-9 grid gap-5 sm:grid-cols-2"><div className="border-t-4 border-orange-500 bg-slate-50 p-7"><Layers3 size={31} className="text-orange-500" /><h3 className="mt-5 text-xl font-black uppercase text-[#1A2B4C]">PSSR</h3><p className="mt-3 text-sm font-medium leading-relaxed text-slate-600">Pre-startup safety review is a useful international benchmark and common project gate. OSHA 29 CFR 1910.119 is United States law, not South African legislation.</p></div><div className="border-t-4 border-orange-500 bg-[#1A2B4C] p-7 text-white"><ClipboardCheck size={31} className="text-orange-500" /><h3 className="mt-5 text-xl font-black uppercase">Readiness decision</h3><p className="mt-3 text-sm font-medium leading-relaxed text-slate-300">The South African duty holder and project governance must define the authorised local gate before hazardous inventory or process conditions are introduced.</p></div></div>
              <h3 className="mt-10 text-xl font-black uppercase text-[#1A2B4C]">A practical pre-live readiness check</h3>
              <ul className="mt-5 space-y-3">{readinessGates.map((gate) => <li key={gate} className="flex items-start gap-3 text-sm font-semibold leading-relaxed text-slate-700"><CheckCircle2 size={18} className="mt-0.5 shrink-0 text-orange-500" />{gate}</li>)}</ul>
            </section>

            <section id="misconceptions" className="scroll-mt-28 pt-20">
              <SectionHeading number="12" eyebrow="Five misconceptions">The shortcuts that create the most dangerous confidence gaps</SectionHeading>
              <div className="mt-9 divide-y divide-slate-200 border-y border-slate-200">{misconceptions.map(([claim, correction], index) => <div key={claim} className="grid gap-4 py-7 sm:grid-cols-[52px_1fr]"><span className="font-mono text-sm font-black text-orange-500">{String(index + 1).padStart(2, '0')}</span><div><h3 className="text-lg font-black text-[#1A2B4C]">{claim}</h3><p className="mt-3 text-sm font-medium leading-relaxed text-slate-600">{correction}</p></div></div>)}</div>
            </section>

            <section id="faqs" className="scroll-mt-28 pt-20">
              <p className="text-xs font-black uppercase tracking-[0.28em] text-orange-500">Common questions</p>
              <h2 className="mt-4 text-3xl font-black uppercase leading-tight text-[#1A2B4C] md:text-4xl">Fire and gas commissioning questions plant teams ask first</h2>
              <div className="mt-9 divide-y divide-slate-200 border-y border-slate-200">{faqs.map((faq) => <details key={faq.question} className="group py-6"><summary className="flex cursor-pointer list-none items-center justify-between gap-5 text-lg font-black text-[#1A2B4C] marker:content-none">{faq.question}<span className="text-2xl text-orange-500 transition-transform group-open:rotate-45">+</span></summary><p className="mt-4 max-w-3xl pr-10 text-sm font-medium leading-relaxed text-slate-600">{faq.answer}</p></details>)}</div>
            </section>

            <section id="sources" className="scroll-mt-28 pt-20">
              <p className="text-xs font-black uppercase tracking-[0.28em] text-orange-500">Authoritative references</p>
              <h2 className="mt-4 text-3xl font-black uppercase leading-tight text-[#1A2B4C] md:text-4xl">Sources and further reading</h2>
              <p className="mt-6 text-sm font-medium leading-relaxed text-slate-600">Six supplied research reports were consolidated for this rewrite. Conflicting claims were resolved against current IEC and ISA catalogue records, South African government publications and original manufacturer instructions. Full standards remain subject to licence and project edition control.</p>
              <ul className="mt-7 space-y-3">{sources.map(([name, href]) => <li key={href}><a href={href} target="_blank" rel="noreferrer" className="inline-flex items-start gap-3 text-sm font-bold leading-relaxed text-[#1A2B4C] hover:text-orange-600"><ExternalLink size={15} className="mt-0.5 shrink-0 text-orange-500" />{name}</a></li>)}</ul>
              <div className="mt-10 border-t-4 border-orange-500 bg-[#0A1120] p-7 text-white md:p-9"><h3 className="flex items-center gap-3 text-xl font-black uppercase"><AlertTriangle className="text-orange-500" />What this article does not promise</h3><p className="mt-5 text-sm font-medium leading-relaxed text-slate-300">This article does not claim that Touch Teqniques Engineering holds a particular SAQCC Fire registration, ECSA category, functional-safety certification, SANAS accreditation or approved-inspection-authority status. It does not guarantee legal compliance, regulator acceptance, zero false alarms, detection of every release scenario or a specific commissioning duration. Exact test methods, acceptance criteria, signatories and operating-readiness decisions remain project-, model- and duty-holder-specific.</p></div>
            </section>

            <ArticleAuthorityBox variant="source-review" updated="11 August 2026" topics={['Process fire and gas commissioning', 'Cause-and-effect and integrated testing', 'Detector-specific test boundaries', 'South African MHI context']} />
          </article>
        </div>
      </section>

      <section className="bg-[#0A1120] py-20 text-white">
        <div className="container mx-auto px-4 text-center md:px-8"><p className="text-xs font-black uppercase tracking-[0.3em] text-orange-500">Planning a commissioning scope?</p><h2 className="mx-auto mt-5 max-w-4xl text-3xl font-black uppercase leading-tight md:text-5xl">Start with the system boundaries, final C&E matrix and required handover evidence.</h2><p className="mx-auto mt-6 max-w-2xl text-base font-medium leading-relaxed text-slate-300">Share the facility, project stage, detector types, interfaces and available documents. Touch Teqniques can help define the technical scope and identify where separate building-fire, suppression, functional-safety or independent-authority requirements apply.</p><Link href={contactHref} className="group mt-9 inline-flex items-center gap-3 rounded-md bg-orange-500 px-7 py-4 text-xs font-black uppercase tracking-[0.16em] text-white hover:bg-orange-600">Request a Commissioning Scope<ArrowRight size={16} className="transition-transform group-hover:translate-x-1" /></Link></div>
      </section>

      <Footer />
      <BackToTop />
    </main>
  );
}
