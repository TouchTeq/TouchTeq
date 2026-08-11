import Image from 'next/image';
import Link from 'next/link';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  ClipboardList,
  Clock,
  ExternalLink,
  FileCheck2,
  Gauge,
  GitBranch,
  Layers3,
  Network,
  Search,
  ShieldCheck,
  Target,
  Users,
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

const articleUrl = 'https://www.touchteq.co.za/insights/sil-assessment-vs-hazop';
const contactHref = '/contact?service=Design%20and%20Engineering#request-quote';
const detailTags = ['Functional Safety', 'HAZOP', 'SIL Determination'];

const guideSections = [
  ['#comparison', 'The two questions'],
  ['#hazop', 'What HAZOP does'],
  ['#sil-language', 'Untangle SIL terminology'],
  ['#handoff', 'The lifecycle handoff'],
  ['#lopa', 'LOPA and protection layers'],
  ['#sif', 'The complete safety function'],
  ['#example', 'A non-numeric example'],
  ['#inputs', 'Inputs and participants'],
  ['#deliverables', 'Usable deliverables'],
  ['#south-africa', 'South African context'],
  ['#revisit', 'When to revisit'],
  ['#misconceptions', 'Five misconceptions'],
  ['#faqs', 'Frequently asked questions'],
  ['#sources', 'Sources and boundaries'],
];

const activityCards = [
  {
    icon: Search,
    label: 'HAZOP',
    question: 'What can go wrong with the process or operation?',
    method: 'A multidisciplinary team examines design intent using nodes, parameters, guide words and credible deviations.',
    output: 'A structured record of deviations, causes, consequences, safeguards, recommendations and actions.',
    boundary: 'It does not, by itself, assign a target SIL or prove that a safeguard is sufficiently reliable.',
  },
  {
    icon: Target,
    label: 'SIL determination',
    question: 'How much risk reduction must a proposed safety instrumented function provide?',
    method: 'Selected scenarios are evaluated using an agreed method such as LOPA, a calibrated risk graph or a safety matrix.',
    output: 'A documented target integrity requirement for each required safety instrumented function.',
    boundary: 'It does not design the function or prove that the proposed architecture will achieve the target.',
  },
] as const;

const silActivities = [
  ['01', 'SIL determination', 'Defines the required risk reduction and target SIL for a specific safety instrumented function.'],
  ['02', 'Safety requirements specification', 'Turns the risk decision into testable functional and integrity requirements: safe state, trip basis, response time, operating modes and proof-test assumptions.'],
  ['03', 'SIL verification', 'Checks whether the proposed sensor, logic solver and final-element design can meet the target using documented reliability, architecture and lifecycle assumptions.'],
  ['04', 'SIS validation', 'Tests the implemented function against the approved safety requirements specification before it is relied upon.'],
  ['05', 'Functional safety assessment', 'Provides an appropriately independent judgement of the functional-safety work and evidence at defined lifecycle stages.'],
] as const;

const lifecycle = [
  ['01', 'Hazard identification', 'HAZOP or another suitable process-hazard method establishes credible scenarios.'],
  ['02', 'Scenario selection', 'The team identifies scenarios that need further risk evaluation and defines the cause-consequence basis.'],
  ['03', 'SIL determination', 'An agreed method evaluates existing risk reduction and any remaining requirement for a SIF.'],
  ['04', 'SRS', 'The safety requirements specification defines what each SIF must do and the integrity it must achieve.'],
  ['05', 'Design and verification', 'The proposed architecture and assumptions are checked against the SRS and target SIL.'],
  ['06', 'Implementation and validation', 'The installed function is tested against the specification and accepted through the project lifecycle.'],
  ['07', 'Operate, maintain and change', 'Proof testing, performance evidence, impairment control and management of change preserve the basis.'],
] as const;

const iplTests = [
  ['Specific', 'The protection acts on the defined scenario and consequence, rather than being a generic control.'],
  ['Independent', 'It is not defeated by the initiating cause or by the failure of another credited layer.'],
  ['Dependable', 'Its claimed performance has a defensible technical and operating basis.'],
  ['Auditable', 'The assumptions, testing, maintenance and performance can be checked over time.'],
] as const;

const sifElements = [
  { icon: Gauge, title: 'Sensor subsystem', body: 'Detects the defined process condition using the agreed voting, diagnostics and failure assumptions.' },
  { icon: Network, title: 'Logic solver', body: 'Evaluates the inputs and commands the required action using the approved application logic.' },
  { icon: ShieldCheck, title: 'Final-element subsystem', body: 'Moves the process toward the defined safe state; valves, actuators, relays and utilities may dominate the failure probability.' },
] as const;

const studyInputs = [
  {
    title: 'For HAZOP',
    icon: ClipboardList,
    items: ['Current P&IDs and process description', 'Design intent and operating envelopes', 'Normal, startup, shutdown and abnormal modes', 'Cause-and-effect and control narratives', 'Operating and maintenance knowledge'],
  },
  {
    title: 'For SIL determination',
    icon: Layers3,
    items: ['Clearly defined cause-consequence scenarios', 'Consequence and initiating-event basis', 'Enabling and conditional factors', 'Evidence for each proposed protection-layer credit', 'Approved organisational risk criteria'],
  },
  {
    title: 'For SIL verification',
    icon: FileCheck2,
    items: ['Approved SRS and target SIL', 'Proposed architecture and device data', 'Failure-rate and common-cause assumptions', 'Diagnostic and proof-test coverage', 'Proof-test interval and operating-mode basis'],
  },
] as const;

const deliverables = [
  ['HAZOP record', 'Nodes, design intent, deviations, causes, consequences, safeguards, recommendations, owners and status.'],
  ['Scenario register', 'A controlled bridge from hazard study findings to the scenarios selected for further risk evaluation.'],
  ['SIL determination report', 'Method, assumptions, risk criteria, credited layers, target for each required SIF and unresolved actions.'],
  ['Safety requirements specification', 'The functional and integrity requirements against which the SIF will be designed, verified and validated.'],
  ['Verification and validation evidence', 'Calculations, assumptions, test results, deviations and acceptance decisions linked back to the SRS.'],
] as const;

const revisitTriggers = [
  'A process, substance, inventory, throughput or operating envelope changes',
  'A new operating mode, cause or consequence becomes credible',
  'A credited safeguard or SIF architecture is modified, bypassed or removed',
  'Proof-test, demand, failure or incident evidence challenges an earlier assumption',
  'An incident, near miss or audit finding exposes a gap in the hazard basis',
  'The applicable legal, company or project review trigger is reached',
] as const;

const misconceptions = [
  ['“HAZOP and SIL assessment are the same workshop.”', 'HAZOP identifies and records hazard and operability scenarios. SIL determination evaluates the integrity required of a specific instrumented protection function. They have different methods and outputs.'],
  ['“A HAZOP recommendation automatically becomes a SIF.”', 'Recommendations may call for inherently safer design, mechanical protection, operating controls or further study. A SIF is one possible risk-reduction decision, not the default outcome.'],
  ['“Every safeguard in the HAZOP can be credited in LOPA.”', 'Only a safeguard that satisfies the project’s protection-layer criteria can receive credit. Shared sensors, utilities, logic, final elements or human dependencies can defeat independence.'],
  ['“A SIL-capable device makes the loop SIL 2 or SIL 3.”', 'The target and achieved performance belong to the complete safety instrumented function, including its architecture, application, testing and maintenance assumptions.'],
  ['“A target SIL means the work is complete and compliant.”', 'Determination is one lifecycle decision. The SRS, design, verification, implementation, validation, operation, proof testing, change control and applicable legal duties still remain.'],
] as const;

const faqs = [
  {
    question: 'Does every HAZOP recommendation become a safety instrumented function?',
    answer: 'No. A recommendation may lead to inherently safer design, mechanical protection, a control change, an operating action or further analysis. A SIF is specified only where the risk decision establishes a need for instrumented protection and defines its function and integrity requirement.',
  },
  {
    question: 'Can LOPA be completed without a HAZOP?',
    answer: 'LOPA needs a clearly defined initiating cause, consequence and safeguard basis. A HAZOP is a common source of those scenarios, but another suitable process-hazard analysis may provide them. The important requirement is a complete, controlled and technically credible scenario basis.',
  },
  {
    question: 'What is the difference between SIL determination and SIL verification?',
    answer: 'SIL determination decides the integrity target a SIF requires. SIL verification tests the proposed design and its assumptions against that target. One sets the requirement; the other checks whether the design can meet it.',
  },
  {
    question: 'When should HAZOP and SIL work be revisited?',
    answer: 'Revisit the relevant work when the process, consequence, initiating-event basis, credited safeguards, SIF design or operating assumptions change, or when incidents, performance evidence, management of change, company rules or applicable regulation trigger a review.',
  },
  {
    question: 'What should a plant prepare before the studies begin?',
    answer: 'Provide current process information, P&IDs, design intent, operating modes, control and cause-and-effect narratives, incident and failure knowledge, safeguard evidence, approved risk criteria and the people who understand how the plant is designed, operated and maintained.',
  },
];

const sources = [
  ['IEC — IEC 61882:2016, HAZOP application guide', 'https://webstore.iec.ch/en/publication/24321'],
  ['IEC — IEC 61511-1:2016 + AMD1:2017, SIS lifecycle requirements', 'https://webstore.iec.ch/en/publication/61289'],
  ['IEC — IEC 61511-3:2016, required SIL determination guidance', 'https://webstore.iec.ch/en/publication/25480'],
  ['South African Government — Occupational Health and Safety Act 85 of 1993', 'https://www.gov.za/sites/default/files/gcis_document/201409/a85-93.pdf'],
  ['South African Government — Major Hazard Installation Regulations, 2022', 'https://www.gov.za/sites/default/files/gcis_document/202302/47970rg11536gon2989.pdf'],
  ['South African Government — Explanatory Notes to the MHI Regulations, 2022', 'https://www.gov.za/sites/default/files/gcis_document/202411/51628gen2841.pdf'],
] as const;

const articleJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: 'HAZOP vs SIL Assessment: Different Questions, One Connected Safety Lifecycle',
  description: 'A source-led guide to HAZOP, SIL determination, LOPA, SRS, verification, validation and the South African process-safety context.',
  image: 'https://www.touchteq.co.za/SIL-HAZOP.jpeg',
  author: { '@type': 'Organization', name: 'Touch Teqniques Engineering' },
  publisher: {
    '@type': 'Organization',
    name: 'Touch Teqniques Engineering',
    logo: { '@type': 'ImageObject', url: 'https://www.touchteq.co.za/touch-teq-logo-wordmark.jpeg' },
  },
  datePublished: '2024-04-01T00:00:00+02:00',
  dateModified: '2026-08-11T00:00:00+02:00',
  mainEntityOfPage: articleUrl,
  keywords: 'HAZOP, SIL determination, SIL assessment, LOPA, safety instrumented function, IEC 61511, IEC 61882, functional safety, South Africa',
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

export default function SilHazopArticle() {
  return (
    <main className="min-h-screen bg-white">
      <BreadcrumbJsonLd items={[{ name: 'Home', url: 'https://www.touchteq.co.za' }, { name: 'Insights', url: 'https://www.touchteq.co.za/insights' }, { name: 'HAZOP vs SIL Assessment', url: articleUrl }]} />
      <FAQJsonLd faqs={faqs} />
      <JsonLd data={articleJsonLd} />
      <Header />

      <section className="relative overflow-hidden bg-[#0A1120] pb-24 pt-36 text-white md:pb-32 md:pt-48">
        <div className="absolute inset-0">
          <Image src="/SIL-HAZOP.jpeg" alt="" fill priority sizes="100vw" className="object-cover object-center" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0A1120]/88 via-[#0A1120]/50 to-[#0A1120]/14" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0A1120]/58 via-transparent to-[#0A1120]/10" />
        </div>
        <div className="container relative mx-auto px-4 md:px-8">
          <Link href="/insights" className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-wider text-orange-500 hover:text-orange-300"><ArrowLeft size={15} />Back to Insights</Link>
          <div className="mt-8 flex flex-wrap items-center gap-x-4 gap-y-2 text-[11px] font-bold uppercase tracking-wider text-slate-200">
            <span className="rounded bg-orange-500 px-3 py-1.5 text-white">Technical article</span>
            <span className="inline-flex items-center gap-1.5 normal-case tracking-normal"><Clock size={14} />15 min read</span>
            {detailTags.map((tag, index) => <span key={tag}>{index > 0 && <span className="mr-4 text-orange-400">·</span>}{tag}</span>)}
          </div>
          <h1 className="mt-9 max-w-5xl text-4xl font-black uppercase leading-[0.98] tracking-tight sm:text-5xl md:text-7xl">HAZOP vs SIL assessment:{' '}<span className="bg-gradient-to-r from-[#FF6900] to-orange-300 bg-clip-text text-transparent">different questions, one connected safety lifecycle.</span></h1>
          <p className="mt-8 max-w-3xl text-base font-medium leading-relaxed text-slate-200 md:text-lg">HAZOP identifies credible deviations and consequences. SIL determination asks how much risk reduction a specific instrumented function must provide. Confusing the two creates missing scenarios, weak assumptions and safety targets with no defensible basis.</p>
        </div>
      </section>

      <section className="border-b border-slate-200 bg-slate-50 py-8">
        <div className="container mx-auto px-4 md:px-8"><p className="max-w-4xl text-sm font-medium leading-relaxed text-slate-600"><span className="font-black uppercase text-[#1A2B4C]">Quick answer:</span>{' '}A HAZOP asks what can go wrong. SIL determination asks what integrity a required safety instrumented function needs for a defined scenario. The output then has to flow into an SRS, design, verification, implementation, validation and ongoing lifecycle management. Neither study replaces the other.</p></div>
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
            <div className="mb-8"><ShareButton title="HAZOP vs SIL Assessment: Different Questions, One Connected Safety Lifecycle" description="A source-led guide to HAZOP, SIL determination, LOPA and the connected functional-safety lifecycle." url={articleUrl} /></div>
            <ArticleAudioPlayer />

            <div className="border-l-4 border-orange-500 bg-[#0A1120] p-7 text-white md:p-9">
              <p className="text-xs font-black uppercase tracking-[0.25em] text-orange-500">The decision trail</p>
              <p className="mt-4 text-2xl font-black leading-tight md:text-3xl">Can the team trace each target integrity requirement back to a defined hazard scenario, credited safeguards and an approved risk decision?</p>
            </div>

            <section id="comparison" className="scroll-mt-28 pt-16">
              <SectionHeading number="01" eyebrow="Start with the question">The studies connect—but their purposes and proof boundaries are different</SectionHeading>
              <div className="mt-9 grid gap-5 sm:grid-cols-2">{activityCards.map(({ icon: Icon, label, question, method, output, boundary }) => <div key={label} className="border-t-4 border-orange-500 bg-slate-50 p-7"><Icon size={31} className="text-orange-500" /><p className="mt-5 text-xs font-black uppercase tracking-[0.2em] text-orange-600">{label}</p><h3 className="mt-3 text-xl font-black text-[#1A2B4C]">{question}</h3><p className="mt-4 text-sm font-medium leading-relaxed text-slate-600">{method}</p><p className="mt-5 border-t border-slate-200 pt-4 text-sm font-semibold leading-relaxed text-slate-700"><strong className="text-[#1A2B4C]">Produces:</strong> {output}</p><p className="mt-3 text-sm font-medium leading-relaxed text-slate-500"><strong className="text-[#1A2B4C]">Does not prove:</strong> {boundary}</p></div>)}</div>
            </section>

            <section id="hazop" className="scroll-mt-28 pt-20">
              <SectionHeading number="02" eyebrow="IEC 61882 method">HAZOP is a structured examination of design intent—not a SIL calculator</SectionHeading>
              <div className="mt-7 space-y-6 text-base font-medium leading-relaxed text-slate-600"><p>IEC 61882:2016 describes a guide-word-based technique with defined preparation, examination, documentation and follow-up. The study team divides the system into manageable parts, establishes design intent and explores credible deviations such as no flow, more pressure, less temperature or reverse flow.</p><p>For each deviation, the team records credible causes, consequences, existing safeguards and actions. The value comes from disciplined team knowledge: process, operations, maintenance, control and instrumentation, mechanical and safety perspectives expose interactions that a single-discipline review can miss.</p></div>
              <div className="mt-9 grid gap-px overflow-hidden border border-slate-200 bg-slate-200 sm:grid-cols-5">{[['01', 'Intent'], ['02', 'Deviation'], ['03', 'Cause'], ['04', 'Consequence'], ['05', 'Safeguards']].map(([number, label], index) => <div key={label} className="relative bg-[#0A1120] p-5 text-center text-white"><span className="font-mono text-xs font-black text-orange-500">{number}</span><p className="mt-3 text-sm font-black uppercase">{label}</p>{index < 4 && <ArrowRight size={16} className="absolute -right-2 top-1/2 z-10 hidden -translate-y-1/2 text-orange-500 sm:block" />}</div>)}</div>
              <div className="mt-7 flex gap-4 border border-orange-200 bg-orange-50 p-6"><AlertTriangle size={22} className="mt-0.5 shrink-0 text-orange-600" /><p className="text-sm font-medium leading-relaxed text-slate-700"><strong className="text-[#1A2B4C]">Boundary:</strong> a HAZOP worksheet can identify a candidate need for instrumented protection. It cannot establish a defensible target SIL unless a separate, documented risk-evaluation method and its required inputs are applied.</p></div>
            </section>

            <section id="sil-language" className="scroll-mt-28 pt-20">
              <SectionHeading number="03" eyebrow="Use precise terms">“SIL assessment” can hide five different lifecycle activities</SectionHeading>
              <p className="mt-7 text-base font-medium leading-relaxed text-slate-600">IEC 61511 separates requirements across the safety lifecycle. Naming the exact activity prevents a proposal, report or purchase order from promising one deliverable while the plant expects another.</p>
              <ol className="mt-9 border-y border-slate-200">{silActivities.map(([number, title, body]) => <li key={number} className="grid gap-4 border-b border-slate-200 py-6 last:border-b-0 sm:grid-cols-[62px_1fr]"><span className="font-mono text-sm font-black text-orange-500">{number}</span><div><h3 className="text-lg font-black uppercase text-[#1A2B4C]">{title}</h3><p className="mt-2 text-sm font-medium leading-relaxed text-slate-600">{body}</p></div></li>)}</ol>
              <p className="mt-6 border-l-2 border-orange-500 pl-5 text-sm font-medium leading-relaxed text-slate-600">A useful scope should say “SIL determination using the agreed method,” “SRS development,” “SIL verification,” “SIS validation” or “functional safety assessment”—not simply “SIL assessment.”</p>
            </section>

            <section id="handoff" className="scroll-mt-28 pt-20">
              <SectionHeading number="04" eyebrow="Control the handoffs">A credible lifecycle keeps the hazard basis attached to the engineered function</SectionHeading>
              <div className="mt-9 space-y-3">{lifecycle.map(([number, title, body], index) => <div key={number} className="relative grid gap-4 border border-slate-200 bg-white p-5 sm:grid-cols-[48px_180px_1fr]"><span className="flex h-9 w-9 items-center justify-center rounded-full bg-orange-500 font-mono text-xs font-black text-white">{number}</span><h3 className="text-sm font-black uppercase text-[#1A2B4C]">{title}</h3><p className="text-sm font-medium leading-relaxed text-slate-600">{body}</p>{index < lifecycle.length - 1 && <div className="absolute -bottom-3 left-9 z-10 h-3 border-l-2 border-dashed border-orange-300 sm:left-[2.4rem]" />}</div>)}</div>
              <p className="mt-7 text-sm font-medium leading-relaxed text-slate-600">The sequence is not always a single waterfall. Actions, design changes and new information can send the team back to an earlier decision. What matters is controlled traceability: scenario, assumption, requirement, design evidence, test evidence and operating basis.</p>
            </section>

            <section id="lopa" className="scroll-mt-28 pt-20">
              <SectionHeading number="05" eyebrow="Credit only what is defensible">LOPA is not a more detailed HAZOP—and every safeguard is not an IPL</SectionHeading>
              <div className="mt-7 space-y-6 text-base font-medium leading-relaxed text-slate-600"><p>Layer of Protection Analysis is a semi-quantitative method often used for SIL determination. It evaluates one defined cause-consequence scenario using an initiating-event basis, relevant enabling or conditional factors, credited independent protection layers and the organisation’s approved tolerable-risk criterion.</p><p>IEC 61511-3 provides a framework and examples for determining required integrity, but it does not prescribe the SIL for a particular application. Initiating frequencies, protection-layer credits, risk criteria and calibration choices remain project- or organisation-specific inputs that need a documented basis.</p></div>
              <div className="mt-9 grid gap-px overflow-hidden border border-slate-200 bg-slate-200 sm:grid-cols-2">{iplTests.map(([title, body]) => <div key={title} className="bg-[#0A1120] p-7 text-white"><CheckCircle2 size={26} className="text-orange-500" /><h3 className="mt-4 text-lg font-black uppercase">{title}</h3><p className="mt-3 text-sm font-medium leading-relaxed text-slate-300">{body}</p></div>)}</div>
              <div className="mt-7 grid gap-4 sm:grid-cols-2"><div className="border border-emerald-200 bg-emerald-50 p-6"><p className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-emerald-700"><CheckCircle2 size={17} />Good evidence</p><p className="mt-3 text-sm font-medium leading-relaxed text-slate-700">A safeguard has a defined scenario, independence basis, performance claim, test regime and owner.</p></div><div className="border border-rose-200 bg-rose-50 p-6"><p className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-rose-700"><XCircle size={17} />Common double-count</p><p className="mt-3 text-sm font-medium leading-relaxed text-slate-700">Two claimed layers share the same sensor, logic, power, final element or human response path.</p></div></div>
            </section>

            <section id="sif" className="scroll-mt-28 pt-20">
              <SectionHeading number="06" eyebrow="Assess the whole function">SIL is not a universal product label</SectionHeading>
              <p className="mt-7 text-base font-medium leading-relaxed text-slate-600">A safety instrumented function is the complete path that detects a defined condition and takes the process to its specified safe state. Component suitability and certification evidence can support the design, but the integrity claim depends on the complete function, its architecture, application and lifecycle assumptions.</p>
              <div className="mt-9 grid gap-5 md:grid-cols-3">{sifElements.map(({ icon: Icon, title, body }, index) => <div key={title} className="relative border-t-4 border-orange-500 bg-slate-50 p-7"><Icon size={31} className="text-orange-500" /><p className="mt-5 font-mono text-xs font-black text-slate-400">0{index + 1}</p><h3 className="mt-2 text-lg font-black uppercase text-[#1A2B4C]">{title}</h3><p className="mt-3 text-sm font-medium leading-relaxed text-slate-600">{body}</p>{index < 2 && <ArrowRight size={18} className="absolute -right-3 top-1/2 z-10 hidden -translate-y-1/2 text-orange-500 md:block" />}</div>)}</div>
              <div className="mt-7 border-t-4 border-orange-500 bg-[#1A2B4C] p-7 text-white"><p className="text-xl font-black uppercase">The target belongs to the function.</p><p className="mt-3 text-sm font-medium leading-relaxed text-slate-300">Device failure data, systematic capability, architecture, common-cause assumptions, diagnostics, proof-test effectiveness and interval all contribute to the verification. None of them alone proves the SIF.</p></div>
            </section>

            <section id="example" className="scroll-mt-28 pt-20">
              <SectionHeading number="07" eyebrow="Illustrative scenario">Follow the decision without inventing universal numbers</SectionHeading>
              <div className="mt-9 border border-slate-200"><div className="bg-[#1A2B4C] px-6 py-4 text-sm font-black uppercase text-white">Fictional reactor high-pressure scenario</div><div className="divide-y divide-slate-200">{[
                ['HAZOP finding', 'A credible feed-control failure can drive reactor pressure above the intended operating envelope, with a potential loss-of-containment consequence. The team records existing safeguards and recommends further risk evaluation.'],
                ['SIL determination question', 'For the defined cause and consequence, which safeguards qualify for credit and what additional risk reduction—if any—must a high-high pressure shutdown function provide?'],
                ['SRS handoff', 'If a SIF is required, the specification defines the sensed condition, trip action, safe state, response time, operating modes, reset, bypass, testing and integrity requirements.'],
                ['Verification and validation', 'The design is checked against the integrity requirement, then the installed function is tested against the approved SRS.'],
              ].map(([title, body], index) => <div key={title} className="grid gap-4 p-6 sm:grid-cols-[48px_170px_1fr]"><span className="font-mono text-sm font-black text-orange-500">0{index + 1}</span><h3 className="text-sm font-black uppercase text-[#1A2B4C]">{title}</h3><p className="text-sm font-medium leading-relaxed text-slate-600">{body}</p></div>)}</div></div>
              <p className="mt-6 text-sm font-medium leading-relaxed text-slate-600">No initiating frequency, protection-layer credit, tolerable-risk value or target SIL is shown here. Those values must come from the site’s controlled method, evidence and risk criteria—not from a generic website example.</p>
            </section>

            <section id="inputs" className="scroll-mt-28 pt-20">
              <SectionHeading number="08" eyebrow="Prepare the evidence and people">The quality of the study cannot exceed the quality of its inputs</SectionHeading>
              <div className="mt-9 grid gap-5 md:grid-cols-3">{studyInputs.map(({ title, icon: Icon, items }) => <div key={title} className="border border-slate-200 bg-white p-6"><Icon size={28} className="text-orange-500" /><h3 className="mt-4 text-lg font-black uppercase text-[#1A2B4C]">{title}</h3><ul className="mt-5 space-y-3">{items.map((item) => <li key={item} className="flex gap-3 text-sm font-medium leading-relaxed text-slate-600"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-orange-500" />{item}</li>)}</ul></div>)}</div>
              <div className="mt-7 flex gap-4 bg-slate-50 p-6"><Users size={24} className="mt-0.5 shrink-0 text-orange-500" /><p className="text-sm font-medium leading-relaxed text-slate-700"><strong className="text-[#1A2B4C]">Participation matters:</strong> HAZOP needs the people who understand design intent and real plant operation. SIL determination needs competent risk-method facilitation plus process, operations, control and instrumentation and process-safety knowledge. Verification and independent assessment require different evidence and, where applicable, independence.</p></div>
            </section>

            <section id="deliverables" className="scroll-mt-28 pt-20">
              <SectionHeading number="09" eyebrow="Make the output usable">A signed workshop sheet is not the whole safety case</SectionHeading>
              <div className="mt-9 space-y-4">{deliverables.map(([title, body]) => <div key={title} className="grid gap-4 border border-slate-200 bg-white p-6 sm:grid-cols-[220px_1fr]"><p className="text-sm font-black uppercase text-[#1A2B4C]">{title}</p><p className="text-sm font-medium leading-relaxed text-slate-600">{body}</p></div>)}</div>
              <p className="mt-6 border-l-2 border-orange-500 pl-5 text-sm font-medium leading-relaxed text-slate-600">Actions need owners, due dates, technical close-out evidence and a controlled route back into drawings, specifications, procedures and management of change. Otherwise, the study records the risk without changing it.</p>
            </section>

            <section id="south-africa" className="scroll-mt-28 pt-20">
              <SectionHeading number="10" eyebrow="South African context">The law defines duties and regulated risk-assessment routes—not one named HAZOP-to-SIL recipe</SectionHeading>
              <div className="mt-7 space-y-6 text-base font-medium leading-relaxed text-slate-600"><p>Section 8 of the Occupational Health and Safety Act requires employers, as far as reasonably practicable, to provide and maintain a working environment that is safe and without risk to employees. The Act does not prescribe HAZOP, LOPA or SIL determination by name.</p><p>For establishments within scope, the Major Hazard Installation Regulations, 2022 require an approved inspection authority to carry out a risk assessment in accordance with SANS 1461. The Regulations also require process-safety-management arrangements that address systematic identification and evaluation of major hazards and management of change.</p><p>HAZOP and IEC 61511 lifecycle work can provide important engineering evidence, but they are not substitutes for the regulated SANS 1461 risk assessment, the duty holder’s legal responsibilities, or any approved-inspection-authority work that applies. A standard can also become contractually required without becoming legislation.</p></div>
              <div className="mt-9 grid gap-5 sm:grid-cols-2"><div className="border-t-4 border-orange-500 bg-slate-50 p-7"><GitBranch size={31} className="text-orange-500" /><h3 className="mt-5 text-xl font-black uppercase text-[#1A2B4C]">Engineering evidence</h3><p className="mt-3 text-sm font-medium leading-relaxed text-slate-600">Scenario traceability, risk decisions, SRS requirements, verification assumptions, validation records and management-of-change links.</p></div><div className="border-t-4 border-orange-500 bg-[#1A2B4C] p-7 text-white"><ShieldCheck size={31} className="text-orange-500" /><h3 className="mt-5 text-xl font-black uppercase">Regulated MHI route</h3><p className="mt-3 text-sm font-medium leading-relaxed text-slate-300">Classification, SANS 1461 risk assessment by an approved inspection authority, policy, safety-report and other duties according to establishment scope and tier.</p></div></div>
            </section>

            <section id="revisit" className="scroll-mt-28 pt-20">
              <SectionHeading number="11" eyebrow="Treat change as new evidence">Revalidation is triggered by the risk basis—not a generic calendar slogan</SectionHeading>
              <ul className="mt-9 grid gap-px overflow-hidden border border-slate-200 bg-slate-200 sm:grid-cols-2">{revisitTriggers.map((item, index) => <li key={item} className="flex gap-4 bg-white p-5 text-sm font-semibold leading-relaxed text-slate-700"><span className="font-mono text-xs font-black text-orange-500">{String(index + 1).padStart(2, '0')}</span>{item}</li>)}</ul>
              <div className="mt-7 flex gap-4 border border-orange-200 bg-orange-50 p-6"><Clock size={22} className="mt-0.5 shrink-0 text-orange-600" /><p className="text-sm font-medium leading-relaxed text-slate-700"><strong className="text-[#1A2B4C]">MHI-specific trigger:</strong> Regulation 10 requires the SANS 1461 risk assessment at intervals not exceeding five years or when the establishment changes. Regulation 12 sets review triggers for a high-hazard establishment’s safety report. These exact duties should not be turned into a universal HAZOP timetable for every facility.</p></div>
            </section>

            <section id="misconceptions" className="scroll-mt-28 pt-20">
              <SectionHeading number="12" eyebrow="Five misconceptions">Shortcuts that break the traceability between hazard and protection</SectionHeading>
              <div className="mt-9 divide-y divide-slate-200 border-y border-slate-200">{misconceptions.map(([claim, correction], index) => <div key={claim} className="grid gap-4 py-7 sm:grid-cols-[52px_1fr]"><span className="font-mono text-sm font-black text-orange-500">{String(index + 1).padStart(2, '0')}</span><div><h3 className="text-lg font-black text-[#1A2B4C]">{claim}</h3><p className="mt-3 text-sm font-medium leading-relaxed text-slate-600">{correction}</p></div></div>)}</div>
            </section>

            <section id="faqs" className="scroll-mt-28 pt-20">
              <p className="text-xs font-black uppercase tracking-[0.28em] text-orange-500">Common questions</p>
              <h2 className="mt-4 text-3xl font-black uppercase leading-tight text-[#1A2B4C] md:text-4xl">HAZOP and SIL questions plant teams ask first</h2>
              <div className="mt-9 divide-y divide-slate-200 border-y border-slate-200">{faqs.map((faq) => <details key={faq.question} className="group py-6"><summary className="flex cursor-pointer list-none items-center justify-between gap-5 text-lg font-black text-[#1A2B4C] marker:content-none">{faq.question}<span className="text-2xl text-orange-500 transition-transform group-open:rotate-45">+</span></summary><p className="mt-4 max-w-3xl pr-10 text-sm font-medium leading-relaxed text-slate-600">{faq.answer}</p></details>)}</div>
            </section>

            <section id="sources" className="scroll-mt-28 pt-20">
              <p className="text-xs font-black uppercase tracking-[0.28em] text-orange-500">Authoritative references</p>
              <h2 className="mt-4 text-3xl font-black uppercase leading-tight text-[#1A2B4C] md:text-4xl">Sources and further reading</h2>
              <p className="mt-6 text-sm font-medium leading-relaxed text-slate-600">Six supplied research reports were consolidated for this rewrite. Conflicting claims were resolved against current IEC catalogue records and published South African legislation and guidance. Full standards remain subject to licence, project edition control and competent interpretation.</p>
              <ul className="mt-7 space-y-3">{sources.map(([name, href]) => <li key={href}><a href={href} target="_blank" rel="noreferrer" className="inline-flex items-start gap-3 text-sm font-bold leading-relaxed text-[#1A2B4C] hover:text-orange-600"><ExternalLink size={15} className="mt-0.5 shrink-0 text-orange-500" />{name}</a></li>)}</ul>
              <div className="mt-10 border-t-4 border-orange-500 bg-[#0A1120] p-7 text-white md:p-9"><h3 className="flex items-center gap-3 text-xl font-black uppercase"><AlertTriangle className="text-orange-500" />What this article does not promise</h3><p className="mt-5 text-sm font-medium leading-relaxed text-slate-300">This article does not claim that Touch Teqniques Engineering is an approved inspection authority, accredited certification body or independently certified functional-safety assessor. It does not guarantee legal compliance, regulator acceptance or a particular SIL outcome. It does not supply universal initiating-event frequencies, protection-layer credits, tolerable-risk criteria, proof-test intervals or risk-graph calibrations. Exact scope, methods, independence, competency and acceptance roles must be confirmed for the facility and project.</p></div>
            </section>

            <ArticleAuthorityBox variant="source-review" updated="11 August 2026" topics={['HAZOP and IEC 61882', 'SIL determination and IEC 61511', 'LOPA and protection-layer boundaries', 'South African MHI context']} />
          </article>
        </div>
      </section>

      <section className="bg-[#0A1120] py-20 text-white">
        <div className="container mx-auto px-4 text-center md:px-8"><p className="text-xs font-black uppercase tracking-[0.3em] text-orange-500">Planning a process-safety study?</p><h2 className="mx-auto mt-5 max-w-4xl text-3xl font-black uppercase leading-tight md:text-5xl">Start with the hazard basis, the exact study activity and the evidence each handoff must produce.</h2><p className="mx-auto mt-6 max-w-2xl text-base font-medium leading-relaxed text-slate-300">Share the facility, project stage, current P&IDs, operating modes, previous studies and required decision. Touch Teqniques can help define the engineering scope while keeping independent, legal and approved-authority roles explicit.</p><Link href={contactHref} className="group mt-9 inline-flex items-center gap-3 rounded-md bg-orange-500 px-7 py-4 text-xs font-black uppercase tracking-[0.16em] text-white hover:bg-orange-600">Request a Study Scope<ArrowRight size={16} className="transition-transform group-hover:translate-x-1" /></Link></div>
      </section>

      <Footer />
      <BackToTop />
    </main>
  );
}
