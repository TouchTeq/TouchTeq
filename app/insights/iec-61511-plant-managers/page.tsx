import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  ClipboardCheck,
  Clock,
  ExternalLink,
  FileCheck2,
  Gauge,
  GitBranch,
  LockKeyhole,
  RefreshCcw,
  Scale,
  ShieldCheck,
} from 'lucide-react';
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

const articleUrl =
  'https://www.touchteq.co.za/insights/iec-61511-plant-managers';
const detailTags = ['Functional Safety', 'IEC 61511', 'South Africa'];

const guideSections = [
  { href: '#standard', label: 'What the standard covers' },
  { href: '#lifecycle', label: 'The safety lifecycle' },
  { href: '#south-africa', label: 'The South African position' },
  { href: '#sil', label: 'SIL without shortcuts' },
  { href: '#plant-controls', label: 'Plant-side disciplines' },
  { href: '#documents', label: 'Documents to request' },
  { href: '#drift', label: 'Warning signs of drift' },
  { href: '#misconceptions', label: 'Client misconceptions' },
  { href: '#faqs', label: 'Frequently asked questions' },
  { href: '#sources', label: 'Sources and boundaries' },
];

const standardTerms = [
  {
    title: 'SIS',
    subtitle: 'The system',
    icon: ShieldCheck,
    body: 'The sensors, logic solver and final elements used to implement one or more safety instrumented functions.',
  },
  {
    title: 'SIF',
    subtitle: 'The function',
    icon: Activity,
    body: 'A defined action that takes or keeps a process in a safe state when its stated conditions are met.',
  },
  {
    title: 'SIL',
    subtitle: 'The target',
    icon: Gauge,
    body: 'The safety-integrity target assigned to an individual SIF—not a blanket label for the whole plant or a single device.',
  },
];

const lifecycleStages = [
  {
    number: '01',
    title: 'Analyse and specify',
    body: 'Identify hazards, decide which protection layers are required and define each SIF in the safety requirements specification.',
    items: ['Hazard and risk assessment', 'SIL determination', 'Safety requirements specification'],
  },
  {
    number: '02',
    title: 'Design and realise',
    body: 'Engineer, program, test, install and validate the SIS against the approved requirements before relying on it.',
    items: ['Design and engineering', 'Application programming', 'FAT, installation and validation'],
  },
  {
    number: '03',
    title: 'Operate and sustain',
    body: 'Maintain the assumptions behind the design through proof testing, bypass control, records and managed change.',
    items: ['Operation and maintenance', 'Management of change', 'Modification and decommissioning'],
  },
];

const plantControls = [
  {
    title: 'Proof testing',
    icon: ClipboardCheck,
    body: 'Use written procedures that test the intended SIF path and record the result. The interval and achieved coverage must remain consistent with the assumptions used in the SIL verification.',
    question: 'Do the records prove the complete function was tested at the planned interval?',
  },
  {
    title: 'Bypass control',
    icon: LockKeyhole,
    body: 'A bypass changes the protection available to the process. It needs authorisation, visible status, a defined duration and appropriate compensating measures based on the risk.',
    question: 'Can every active bypass be explained, approved and closed out?',
  },
  {
    title: 'Management of change',
    icon: RefreshCcw,
    body: 'Setpoint changes, device substitutions, logic revisions and process changes can invalidate the SRS or verification assumptions even when the change appears minor.',
    question: 'Did the latest plant change flow through the SRS, verification and validation records?',
  },
];

const documentChecklist = [
  'Hazard and risk assessment records supporting each SIF',
  'Safety requirements specification for every identified SIF',
  'SIL determination and verification records with assumptions stated',
  'SIS architecture, loop, logic and as-built documentation',
  'Application-program version and configuration records',
  'Factory, site, commissioning and validation test records',
  'Operation, maintenance and proof-test procedures',
  'Proof-test results, deferrals and corrective-action evidence',
  'Current and historical bypass or override register',
  'Demand, failure, spurious-trip and incident records',
  'Management-of-change and revalidation records',
  'Competence, audit and functional-safety-assessment records',
];

const driftSigns = [
  'Proof tests are overdue, repeatedly deferred or do not cover the complete function.',
  'The proof-test interval differs from the interval used in the SIL verification.',
  'Bypasses have no current authorisation, expiry date or compensating measures.',
  'The SRS and loop documentation do not reflect accepted plant changes.',
  'Logic versions, setpoints or device substitutions cannot be traced through MOC.',
  'Demand and failure data are collected but never compared with the design basis.',
  'Competence records do not match the SIS activities people actually perform.',
  'Audit or assessment findings remain open without evidence of closure.',
];

const misconceptions = [
  {
    claim: '“IEC 61511 is South African law.”',
    correction:
      'The 2022 MHI Regulations do not name IEC 61511. They create separate statutory duties, including an AIA-led risk assessment in accordance with SANS 1461. IEC 61511 is the process-sector engineering framework for SIS work—not a substitute for legal advice or statutory assessment.',
  },
  {
    claim: '“A SIL-capable device makes the complete loop SIL compliant.”',
    correction:
      'Device evidence is only one input. The complete SIF, its architecture, application, proof-test assumptions, systematic controls and lifecycle evidence must support the target.',
  },
  {
    claim: '“SIL 3 simply means ten times safer than SIL 2.”',
    correction:
      'SIL bands express target failure measures for a defined function and operating mode. The actual result depends on the design and its assumptions; the label is not a universal multiplication factor for plant safety.',
  },
  {
    claim: '“Calibration and routine maintenance are the same as proof testing.”',
    correction:
      'Calibration can confirm instrument response and maintenance can restore equipment, but proof testing must demonstrate the defined safety function and reveal dangerous failures covered by the procedure.',
  },
  {
    claim: '“Once the SIS is validated, functional safety becomes an engineering-file issue.”',
    correction:
      'Operating discipline keeps the claim credible. Proof tests, bypasses, competence, failures, changes and records continue for as long as the SIS remains in service.',
  },
];

const faqs = [
  {
    question: 'Which IEC 61511 edition is current, and is there a 2026 edition?',
    answer:
      'The current consolidated Part 1 is IEC 61511-1:2016+AMD1:2017, Edition 2.1. Parts 2 and 3 remain 2016 editions. IEC also lists an IEC 61511:2026 SER product, but SER is an all-parts series pack containing those existing publications and technical reports; it is not a new technical edition of Parts 1, 2 or 3.',
  },
  {
    question: 'Is IEC 61511 mandatory under South African law?',
    answer:
      'The Major Hazard Installation Regulations, 2022 do not name IEC 61511. They impose their own duties, including risk assessment in accordance with SANS 1461 by an approved inspection authority. IEC 61511 remains an important engineering framework for process-sector SIS work, but following it does not by itself prove statutory compliance.',
  },
  {
    question: 'What is the difference between verification, validation and a functional safety assessment?',
    answer:
      'Verification checks whether the output of a lifecycle activity meets its stated inputs and requirements. Validation tests whether the installed and commissioned SIS meets the safety requirements specification. A functional safety assessment forms a judgement about the functional safety achieved using the available lifecycle evidence and the required degree of independence.',
  },
  {
    question: 'Why does the proof-test interval matter to a SIL claim?',
    answer:
      'The proof-test interval and coverage are assumptions in the quantitative evaluation of many safety functions. If the plant tests later, tests less of the function or cannot demonstrate the assumed coverage, the operating evidence no longer matches the basis used for the calculation.',
  },
  {
    question: 'What should a plant manager request first when reviewing a SIS programme?',
    answer:
      'Start with the safety requirements specification and the SIL determination and verification records. Then compare their assumptions with current proof-test records, bypasses, management-of-change records, validation evidence, competence records and actual demand or failure history.',
  },
];

const sources = [
  {
    name: 'IEC — IEC 61511-1:2016 scope, edition and lifecycle status',
    href: 'https://webstore.iec.ch/en/publication/24241',
  },
  {
    name: 'IEC — IEC 61511-1:2016+AMD1:2017 consolidated version, Edition 2.1',
    href: 'https://webstore.iec.ch/en/publication/61289',
  },
  {
    name: 'IEC — IEC 61511:2026 SER all-parts series pack',
    href: 'https://webstore.iec.ch/en/publication/5527',
  },
  {
    name: 'IEC — IEC 61511-2:2016 application guidance',
    href: 'https://webstore.iec.ch/en/publication/25510',
  },
  {
    name: 'IEC — IEC 61511-3:2016 SIL-determination guidance',
    href: 'https://webstore.iec.ch/en/publication/25480',
  },
  {
    name: 'IEC — IEC TR 61511-0:2018 overview of functional safety for the process industry',
    href: 'https://webstore.iec.ch/en/publication/60766',
  },
  {
    name: 'IEC — IEC TR 61511-4:2020 rationale for Edition 1 to Edition 2 changes',
    href: 'https://webstore.iec.ch/en/publication/64497',
  },
  {
    name: 'South African Government — Major Hazard Installation Regulations, 2022',
    href: 'https://www.gov.za/sites/default/files/gcis_document/202302/47970rg11536gon2989.pdf',
  },
  {
    name: 'South African Government — 2016 standards notice issuing SANS 61511-1 and SANS 61511-2',
    href: 'https://www.gov.za/sites/default/files/gcis_document/201612/40428gen774.pdf',
  },
];

const articleJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: 'IEC 61511 in South Africa: What Plant Managers Need to Know',
  description:
    'A practical guide to IEC 61511, the SIS safety lifecycle, SIL, proof testing and how the standard relates to South Africa’s Major Hazard Installation Regulations.',
  image: 'https://www.touchteq.co.za/IEC.jpeg',
  author: {
    '@type': 'Organization',
    name: 'Touch Teqniques Engineering',
    url: 'https://www.touchteq.co.za',
  },
  publisher: {
    '@type': 'Organization',
    name: 'Touch Teqniques Engineering',
    logo: {
      '@type': 'ImageObject',
      url: 'https://www.touchteq.co.za/touch-teq-logo-wordmark.jpeg',
    },
  },
  datePublished: '2024-04-01T00:00:00+02:00',
  dateModified: '2026-08-11T00:00:00+02:00',
  mainEntityOfPage: articleUrl,
  keywords:
    'IEC 61511 South Africa, safety instrumented systems, SIS, safety instrumented function, SIL, functional safety, proof testing, Major Hazard Installation Regulations',
};

export default function IEC61511PlantManagersPage() {
  return (
    <main className="min-h-screen bg-white font-sans">
      <BreadcrumbJsonLd
        items={[
          { name: 'Home', url: 'https://www.touchteq.co.za' },
          { name: 'Insights', url: 'https://www.touchteq.co.za/insights' },
          { name: 'IEC 61511 for Plant Managers', url: articleUrl },
        ]}
      />
      <FAQJsonLd faqs={faqs} />
      <JsonLd data={articleJsonLd} />
      <Header />

      <section className="relative overflow-hidden bg-[#0A1120] pb-24 pt-36 text-white md:pb-32 md:pt-48">
        <div className="absolute inset-0">
          <Image
            src="/IEC.jpeg"
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover object-center opacity-100"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0A1120]/90 via-[#0A1120]/40 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0A1120]/55 via-[#0A1120]/5 to-transparent" />
        </div>

        <div className="container relative z-10 mx-auto px-4 md:px-8">
          <Link
            href="/insights"
            className="mb-9 inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-orange-500 transition-colors hover:text-orange-300"
          >
            <ArrowLeft size={15} aria-hidden="true" />
            Back to Insights
          </Link>

          <div className="max-w-5xl">
            <div className="mb-6 flex flex-wrap items-center gap-4">
              <span className="rounded-sm bg-orange-500 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-white">
                Industry Standards
              </span>
              <div className="flex items-center text-xs text-slate-400">
                <Clock size={12} className="mr-1" aria-hidden="true" />
                13 min read
              </div>
              <div className="flex flex-wrap gap-2">
                {detailTags.map((tag, index) => (
                  <span
                    key={tag}
                    className="text-[10px] font-medium uppercase tracking-wider text-slate-400"
                  >
                    {index > 0 && (
                      <span className="mx-1 text-slate-600">{'·'}</span>
                    )}
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            <h1 className="max-w-5xl text-4xl font-black uppercase leading-[0.98] tracking-tight sm:text-5xl md:text-7xl">
              IEC 61511 in South Africa:{' '}
              <span className="bg-gradient-to-r from-[#FF6900] to-orange-300 bg-clip-text text-transparent">
                what plant managers need to know.
              </span>
            </h1>
            <p className="mt-8 max-w-3xl text-base font-medium leading-relaxed text-slate-300 md:text-xl">
              A practical guide to what the standard covers, where South African law sits and which records show whether the safety instrumented system still matches the plant.
            </p>
          </div>
        </div>
      </section>

      <section className="border-b border-slate-200 bg-slate-50 py-8">
        <div className="container mx-auto px-4 md:px-8">
          <p className="max-w-4xl text-sm font-medium leading-relaxed text-slate-600">
            <span className="font-black uppercase text-[#1A2B4C]">Quick answer:</span>{' '}
            IEC 61511 is the process-industry framework for specifying, designing, installing, operating and maintaining safety instrumented systems. South Africa&apos;s 2022 MHI Regulations do not name IEC 61511; they create separate legal duties, including an AIA-led risk assessment in accordance with SANS 1461.
          </p>
        </div>
      </section>

      <section className="py-16 md:py-24">
        <div className="container mx-auto grid gap-12 px-4 lg:grid-cols-[220px_minmax(0,780px)] lg:justify-center lg:gap-16 md:px-8">
          <aside className="hidden lg:block">
            <nav
              aria-label="Article contents"
              className="sticky top-32 border-l border-slate-200 pl-5"
            >
              <p className="mb-4 text-[10px] font-black uppercase tracking-[0.22em] text-orange-500">
                In this guide
              </p>
              <ol className="space-y-3 text-sm font-bold leading-snug text-slate-500">
                {guideSections.map((section) => (
                  <li key={section.href}>
                    <a
                      className="transition-colors hover:text-orange-600"
                      href={section.href}
                    >
                      {section.label}
                    </a>
                  </li>
                ))}
              </ol>
            </nav>
          </aside>

          <article className="min-w-0">
            <ShareButton
              title="IEC 61511 in South Africa: What Plant Managers Need to Know"
              description="A practical guide to the SIS lifecycle, SIL and South Africa's MHI regulatory context."
              url={articleUrl}
              className="mb-6"
            />

            <ArticleAudioPlayer />

            <div className="border-l-4 border-orange-500 bg-slate-50 px-6 py-7 md:px-8">
              <p className="text-xl font-black leading-relaxed text-[#1A2B4C] md:text-2xl">
                A safety system can be correctly designed on paper and still lose credibility in operation. The plant manager&apos;s question is not only “Was it commissioned?” but “Does today&apos;s evidence still support the assumptions behind every safety function?”
              </p>
            </div>

            <section id="standard" className="scroll-mt-28 pt-16">
              <p className="text-xs font-black uppercase tracking-[0.28em] text-orange-500">
                01 — Standard at a glance
              </p>
              <h2 className="mt-4 text-3xl font-black uppercase leading-tight text-[#1A2B4C] md:text-4xl">
                IEC 61511 manages a safety function across its whole life—not only its hardware
              </h2>
              <div className="mt-7 space-y-6 text-base font-medium leading-relaxed text-slate-600">
                <p>
                  The{' '}
                  <a
                    href="https://webstore.iec.ch/en/publication/24241"
                    target="_blank"
                    rel="noreferrer"
                    className="font-bold text-orange-600 underline decoration-orange-300 underline-offset-4"
                  >
                    IEC catalogue description for Part 1
                  </a>{' '}
                  covers specification, design, installation, operation and maintenance of a safety instrumented system so that it can achieve or maintain a safe process state. That scope makes functional safety an operating-management discipline, not a once-off project deliverable.
                </p>
                <p>
                  Three terms are often blurred together. Keeping them separate makes the rest of the lifecycle easier to understand.
                </p>
              </div>

              <div className="mt-9 grid gap-px overflow-hidden border border-slate-200 bg-slate-200 md:grid-cols-3">
                {standardTerms.map((term) => {
                  const Icon = term.icon;
                  return (
                    <div key={term.title} className="bg-white p-6 md:p-7">
                      <Icon size={30} className="text-orange-500" aria-hidden="true" />
                      <p className="mt-6 font-mono text-xs font-black uppercase tracking-[0.18em] text-orange-600">
                        {term.subtitle}
                      </p>
                      <h3 className="mt-2 text-3xl font-black uppercase text-[#1A2B4C]">
                        {term.title}
                      </h3>
                      <p className="mt-4 text-sm font-medium leading-relaxed text-slate-600">
                        {term.body}
                      </p>
                    </div>
                  );
                })}
              </div>

              <div className="mt-10 border-t-4 border-orange-500 bg-[#0A1120] p-7 text-white md:p-9">
                <p className="text-xs font-black uppercase tracking-[0.24em] text-orange-500">
                  Edition check — 11 August 2026
                </p>
                <h3 className="mt-4 text-2xl font-black uppercase">
                  The 2026 product is a series pack, not a new technical edition
                </h3>
                <p className="mt-5 text-sm font-medium leading-relaxed text-slate-300">
                  The current consolidated Part 1 is{' '}
                  <a
                    href="https://webstore.iec.ch/en/publication/61289"
                    target="_blank"
                    rel="noreferrer"
                    className="font-bold text-orange-400 underline underline-offset-4"
                  >
                    IEC 61511-1:2016+AMD1:2017, Edition 2.1
                  </a>
                  . IEC lists an{' '}
                  <a
                    href="https://webstore.iec.ch/en/publication/5527"
                    target="_blank"
                    rel="noreferrer"
                    className="font-bold text-orange-400 underline underline-offset-4"
                  >
                    IEC 61511:2026 SER
                  </a>
                  , but its own page describes an “all parts” pack containing the existing 2016–2020 publications. It does not replace Parts 1, 2 or 3 with a new edition.
                </p>
              </div>
            </section>

            <section id="lifecycle" className="scroll-mt-28 pt-20">
              <p className="text-xs font-black uppercase tracking-[0.28em] text-orange-500">
                02 — Follow the evidence
              </p>
              <h2 className="mt-4 text-3xl font-black uppercase leading-tight text-[#1A2B4C] md:text-4xl">
                The lifecycle is a chain: weak evidence in one phase moves risk into the next
              </h2>
              <p className="mt-7 text-base font-medium leading-relaxed text-slate-600">
                The standard is detailed, but a plant manager can view the work in three practical movements. Functional safety management and verification span the entire chain.
              </p>

              <ol className="mt-10 grid gap-px overflow-hidden border border-slate-200 bg-slate-200 md:grid-cols-3">
                {lifecycleStages.map((stage) => (
                  <li key={stage.number} className="bg-white p-6 md:p-7">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-black text-orange-500">
                        {stage.number}
                      </span>
                      <GitBranch size={24} className="text-slate-300" aria-hidden="true" />
                    </div>
                    <h3 className="mt-7 text-xl font-black uppercase text-[#1A2B4C]">
                      {stage.title}
                    </h3>
                    <p className="mt-4 text-sm font-medium leading-relaxed text-slate-600">
                      {stage.body}
                    </p>
                    <ul className="mt-6 space-y-3 border-t border-slate-200 pt-5">
                      {stage.items.map((item) => (
                        <li
                          key={item}
                          className="flex items-start gap-2 text-xs font-bold leading-relaxed text-slate-500"
                        >
                          <CheckCircle2
                            size={14}
                            className="mt-0.5 shrink-0 text-orange-500"
                            aria-hidden="true"
                          />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </li>
                ))}
              </ol>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="border border-slate-200 bg-slate-50 p-5 text-sm font-bold leading-relaxed text-[#1A2B4C]">
                  Functional safety management: planning, competence, assessment, audit and controlled records.
                </div>
                <div className="border border-slate-200 bg-slate-50 p-5 text-sm font-bold leading-relaxed text-[#1A2B4C]">
                  Verification: objective checks that each phase delivers what the next phase requires.
                </div>
              </div>
            </section>

            <section id="south-africa" className="scroll-mt-28 pt-20">
              <p className="text-xs font-black uppercase tracking-[0.28em] text-orange-500">
                03 — Legal duties and engineering practice
              </p>
              <h2 className="mt-4 text-3xl font-black uppercase leading-tight text-[#1A2B4C] md:text-4xl">
                South African law and IEC 61511 answer different questions
              </h2>
              <p className="mt-7 text-base font-medium leading-relaxed text-slate-600">
                The safest wording is precise: the{' '}
                <a
                  href="https://www.gov.za/sites/default/files/gcis_document/202302/47970rg11536gon2989.pdf"
                  target="_blank"
                  rel="noreferrer"
                  className="font-bold text-orange-600 underline decoration-orange-300 underline-offset-4"
                >
                  Major Hazard Installation Regulations, 2022
                </a>{' '}
                do not name IEC 61511. They impose regulatory duties on establishments within their scope. IEC 61511 supplies an engineering framework for the SIS lifecycle; applying it does not automatically prove legal compliance.
              </p>

              <div className="mt-9 grid gap-px overflow-hidden border border-slate-200 bg-slate-200 md:grid-cols-2">
                <div className="bg-[#0A1120] p-7 text-white md:p-9">
                  <Scale size={34} className="text-orange-500" aria-hidden="true" />
                  <p className="mt-6 text-xs font-black uppercase tracking-[0.22em] text-orange-500">
                    What the MHI Regulations say
                  </p>
                  <ul className="mt-5 space-y-4 text-sm font-medium leading-relaxed text-slate-300">
                    <li>Risk assessment by an approved inspection authority in accordance with SANS 1461, at intervals not exceeding five years or when the establishment changes.</li>
                    <li>A written major incident prevention policy, including a process safety management system.</li>
                    <li>Additional safety-report and licence-to-operate duties for high-hazard establishments.</li>
                  </ul>
                </div>
                <div className="bg-white p-7 md:p-9">
                  <BookOpen size={34} className="text-orange-500" aria-hidden="true" />
                  <p className="mt-6 text-xs font-black uppercase tracking-[0.22em] text-orange-600">
                    What IEC 61511 contributes
                  </p>
                  <ul className="mt-5 space-y-4 text-sm font-medium leading-relaxed text-slate-600">
                    <li>A process-sector framework for the complete SIS lifecycle.</li>
                    <li>Requirements and guidance for defining, designing, validating, operating and maintaining SIFs.</li>
                    <li>An evidence base for instrumentation protection claimed in a wider risk-management programme.</li>
                  </ul>
                </div>
              </div>

              <div className="mt-7 border-l-2 border-orange-500 pl-5 text-sm font-medium leading-relaxed text-slate-600">
                <strong className="text-[#1A2B4C]">SANS edition caution:</strong> a 2016 government standards notice records SANS 61511-1:2016 and SANS 61511-2:2016 as identical adoptions of the 2003 IEC editions. Confirm the current SABS catalogue edition before placing a project-standard requirement; do not assume the year in the SANS designation proves adoption of IEC Edition 2.
              </div>
            </section>

            <section id="sil" className="scroll-mt-28 pt-20">
              <p className="text-xs font-black uppercase tracking-[0.28em] text-orange-500">
                04 — Read the target correctly
              </p>
              <h2 className="mt-4 text-3xl font-black uppercase leading-tight text-[#1A2B4C] md:text-4xl">
                SIL is a target for a defined safety function—not a universal risk-reduction slogan
              </h2>
              <p className="mt-7 text-base font-medium leading-relaxed text-slate-600">
                The target failure measure depends on how the SIF operates. The calculation is only as credible as its demand basis, device data, architecture, proof-test coverage, proof-test interval and systematic controls.
              </p>

              <div className="mt-9 grid gap-px overflow-hidden border border-slate-200 bg-slate-200 md:grid-cols-2">
                <div className="bg-white p-7">
                  <p className="font-mono text-xs font-black uppercase tracking-[0.18em] text-orange-600">
                    Low-demand functions
                  </p>
                  <h3 className="mt-3 text-2xl font-black uppercase text-[#1A2B4C]">
                    PFDavg
                  </h3>
                  <p className="mt-4 text-sm font-medium leading-relaxed text-slate-600">
                    Average probability of failure on demand. The proof-test interval and achieved coverage materially influence the result.
                  </p>
                </div>
                <div className="bg-[#1A2B4C] p-7 text-white">
                  <p className="font-mono text-xs font-black uppercase tracking-[0.18em] text-orange-500">
                    High-demand or continuous functions
                  </p>
                  <h3 className="mt-3 text-2xl font-black uppercase">
                    PFH
                  </h3>
                  <p className="mt-4 text-sm font-medium leading-relaxed text-slate-300">
                    Average frequency of dangerous failure per hour. It is a different measure and should not be collapsed into a simple “times safer” comparison.
                  </p>
                </div>
              </div>

              <div className="mt-7 flex items-start gap-4 border border-orange-200 bg-orange-50 p-6 text-sm font-medium leading-relaxed text-slate-700">
                <AlertTriangle
                  size={22}
                  className="mt-0.5 shrink-0 text-orange-600"
                  aria-hidden="true"
                />
                <p>
                  A device certificate or “suitable for use” statement does not verify the complete SIF. Ask for the function-level design basis, calculation, architecture, safety manuals, proof-test assumptions and lifecycle evidence.
                </p>
              </div>
            </section>

            <section id="plant-controls" className="scroll-mt-28 pt-20">
              <p className="text-xs font-black uppercase tracking-[0.28em] text-orange-500">
                05 — Operating discipline
              </p>
              <h2 className="mt-4 text-3xl font-black uppercase leading-tight text-[#1A2B4C] md:text-4xl">
                Proof tests, bypasses and change control keep the paper design connected to the plant
              </h2>

              <div className="mt-10 space-y-5">
                {plantControls.map((control, index) => {
                  const Icon = control.icon;
                  return (
                    <div
                      key={control.title}
                      className="grid gap-6 border-t-4 border-orange-500 bg-[#1A2B4C] p-7 text-white sm:grid-cols-[58px_1fr] md:p-9"
                    >
                      <div>
                        <span className="font-mono text-xs font-black text-orange-500">
                          {String(index + 1).padStart(2, '0')}
                        </span>
                        <Icon size={32} className="mt-5 text-orange-500" aria-hidden="true" />
                      </div>
                      <div>
                        <h3 className="text-2xl font-black uppercase">{control.title}</h3>
                        <p className="mt-4 text-sm font-medium leading-relaxed text-slate-300">
                          {control.body}
                        </p>
                        <p className="mt-6 border-l border-orange-500 pl-4 text-sm font-bold leading-relaxed text-white">
                          Management question: {control.question}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            <section id="documents" className="scroll-mt-28 pt-20">
              <p className="text-xs font-black uppercase tracking-[0.28em] text-orange-500">
                06 — Evidence to request
              </p>
              <h2 className="mt-4 text-3xl font-black uppercase leading-tight text-[#1A2B4C] md:text-4xl">
                Twelve document groups reveal whether the lifecycle is being managed
              </h2>
              <p className="mt-7 text-base font-medium leading-relaxed text-slate-600">
                The files do not need to sit in one binder, but they should be controlled, traceable and consistent with one another. Start with the SRS and verification, then test the assumptions against operating records.
              </p>

              <ol className="mt-9 grid gap-px overflow-hidden border border-slate-200 bg-slate-200 sm:grid-cols-2">
                {documentChecklist.map((item, index) => (
                  <li
                    key={item}
                    className="flex gap-4 bg-white p-5 text-sm font-semibold leading-relaxed text-slate-700"
                  >
                    <span className="font-mono text-xs font-black text-orange-500">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    {item}
                  </li>
                ))}
              </ol>
            </section>

            <section id="drift" className="scroll-mt-28 pt-20">
              <p className="text-xs font-black uppercase tracking-[0.28em] text-orange-500">
                07 — What operating drift looks like
              </p>
              <h2 className="mt-4 text-3xl font-black uppercase leading-tight text-[#1A2B4C] md:text-4xl">
                The first warning is often a mismatch between records—not an alarm on the panel
              </h2>
              <ul className="mt-9 grid gap-4 sm:grid-cols-2">
                {driftSigns.map((sign) => (
                  <li
                    key={sign}
                    className="flex items-start gap-3 border border-slate-200 bg-slate-50 p-5 text-sm font-bold leading-relaxed text-slate-700"
                  >
                    <AlertTriangle
                      size={18}
                      className="mt-0.5 shrink-0 text-orange-500"
                      aria-hidden="true"
                    />
                    {sign}
                  </li>
                ))}
              </ul>
            </section>

            <section id="misconceptions" className="scroll-mt-28 pt-20">
              <p className="text-xs font-black uppercase tracking-[0.28em] text-orange-500">
                08 — Five misconceptions
              </p>
              <h2 className="mt-4 text-3xl font-black uppercase leading-tight text-[#1A2B4C] md:text-4xl">
                Statements that sound reassuring but do not survive an evidence check
              </h2>

              <div className="mt-9 divide-y divide-slate-200 border-y border-slate-200">
                {misconceptions.map((item, index) => (
                  <div key={item.claim} className="grid gap-4 py-7 sm:grid-cols-[52px_1fr]">
                    <span className="font-mono text-sm font-black text-orange-500">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    <div>
                      <h3 className="text-lg font-black text-[#1A2B4C]">{item.claim}</h3>
                      <p className="mt-3 text-sm font-medium leading-relaxed text-slate-600">
                        {item.correction}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section id="faqs" className="scroll-mt-28 pt-20">
              <p className="text-xs font-black uppercase tracking-[0.28em] text-orange-500">
                Common questions
              </p>
              <h2 className="mt-4 text-3xl font-black uppercase leading-tight text-[#1A2B4C] md:text-4xl">
                IEC 61511 questions plant teams ask first
              </h2>
              <div className="mt-9 divide-y divide-slate-200 border-y border-slate-200">
                {faqs.map((faq) => (
                  <details key={faq.question} className="group py-6">
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-5 text-lg font-black text-[#1A2B4C] marker:content-none">
                      {faq.question}
                      <span className="text-2xl text-orange-500 transition-transform group-open:rotate-45">
                        +
                      </span>
                    </summary>
                    <p className="mt-4 max-w-3xl pr-10 text-sm font-medium leading-relaxed text-slate-600">
                      {faq.answer}
                    </p>
                  </details>
                ))}
              </div>
            </section>

            <section id="sources" className="scroll-mt-28 pt-20">
              <p className="text-xs font-black uppercase tracking-[0.28em] text-orange-500">
                Authoritative references
              </p>
              <h2 className="mt-4 text-3xl font-black uppercase leading-tight text-[#1A2B4C] md:text-4xl">
                Sources and further reading
              </h2>
              <p className="mt-6 text-sm font-medium leading-relaxed text-slate-600">
                Four supplied research reports were consolidated for this rewrite. Conflicting edition claims were resolved against the current IEC catalogue, and the South African section was checked against the published MHI Regulations and government standards notice.
              </p>
              <ul className="mt-7 space-y-3">
                {sources.map((source) => (
                  <li key={source.href}>
                    <a
                      href={source.href}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-start gap-3 text-sm font-bold leading-relaxed text-[#1A2B4C] transition-colors hover:text-orange-600"
                    >
                      <ExternalLink
                        size={15}
                        className="mt-0.5 shrink-0 text-orange-500"
                        aria-hidden="true"
                      />
                      {source.name}
                    </a>
                  </li>
                ))}
              </ul>

              <div className="mt-10 border-t-4 border-orange-500 bg-[#0A1120] p-7 text-white md:p-9">
                <h3 className="flex items-center gap-3 text-xl font-black uppercase">
                  <FileCheck2 className="text-orange-500" aria-hidden="true" />
                  What this article does not promise
                </h3>
                <p className="mt-5 text-sm font-medium leading-relaxed text-slate-300">
                  This article does not claim that Touch Teqniques Engineering is an approved inspection authority, SANAS-accredited inspection body, SIS certification body or legal-compliance authority. It does not guarantee a SIL outcome, an audit pass or incident prevention. An MHI risk assessment under SANS 1461, independent functional safety assessment, SIL verification, cybersecurity review and other specialist activities require the correct documented scope and competent route.
                </p>
              </div>
            </section>

            <div className="mt-16 border-t border-slate-200 pt-8 text-sm font-medium leading-relaxed text-slate-500">
              <p>
                This guide is general technical information. The applicable legislation, standards edition, competence requirements, assessment independence and project method must be confirmed for the specific site and decision.
              </p>
            </div>

            <ArticleAuthorityBox
              variant="source-review"
              updated="August 2026"
              topics={[
                'IEC 61511',
                'Safety instrumented systems',
                'Functional safety lifecycle',
                'South African MHI regulatory context',
              ]}
            />
          </article>
        </div>
      </section>

      <section className="bg-[#0A1120] py-20 text-white">
        <div className="container mx-auto px-4 text-center md:px-8">
          <p className="text-xs font-black uppercase tracking-[0.3em] text-orange-500">
            Need to define the next question?
          </p>
          <h2 className="mx-auto mt-5 max-w-4xl text-3xl font-black uppercase leading-tight md:text-5xl">
            Start with the records that support the safety function—not a generic compliance promise.
          </h2>
          <p className="mx-auto mt-6 max-w-2xl text-base font-medium leading-relaxed text-slate-300">
            Share the current concern, available lifecycle documents and site context. Touch Teqniques can clarify the engineering scope and identify when an independent specialist or approved inspection authority is required.
          </p>
          <Link
            href="/contact#request-quote"
            className="group mt-9 inline-flex items-center gap-3 rounded-md bg-orange-500 px-7 py-4 text-xs font-black uppercase tracking-[0.16em] text-white transition-colors hover:bg-orange-600"
          >
            Request a Scoping Discussion
            <ArrowRight
              size={16}
              className="transition-transform group-hover:translate-x-1"
              aria-hidden="true"
            />
          </Link>
        </div>
      </section>

      <BackToTop />
      <Footer />
    </main>
  );
}
