import {
  Activity,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  ClipboardCheck,
  Clock,
  ExternalLink,
  FileCheck2,
  Gauge,
  Search,
  ShieldCheck,
  Thermometer,
  Wrench,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

import BackToTop from '@/components/BackToTop';
import Footer from '@/components/Footer';
import Header from '@/components/Header';
import BreadcrumbJsonLd from '@/components/seo/BreadcrumbJsonLd';
import FAQJsonLd from '@/components/seo/FAQJsonLd';
import JsonLd from '@/components/seo/JsonLd';
import { ShareButton } from '@/components/ui/share-button';

const articleUrl =
  'https://www.touchteq.co.za/insights/industrial-instrument-calibration-process-guide';
const calibrationContactHref =
  '/contact?service=Industrial%20Instrument%20Calibration#request-quote';

const processSteps = [
  {
    number: '01',
    title: 'Define the scope',
    icon: Search,
    body: 'Identify the instruments, models, quantities, operating ranges, process medium, locations and required decision points.',
  },
  {
    number: '02',
    title: 'Confirm the method',
    icon: ClipboardCheck,
    body: 'Agree suitability, access, isolation needs, test points, reference equipment, acceptance criteria and reporting expectations.',
  },
  {
    number: '03',
    title: 'Measure, record and report',
    icon: FileCheck2,
    body: 'Compare readings under defined conditions, record the observed deviation and hand over the results in the agreed format.',
  },
];

const equipment = [
  {
    model: 'HSIN150A',
    title: 'Dry-block temperature calibrator',
    image: '/calibration-equipment/hsin150a-dry-block-temperature-calibrator.jpg',
    link: 'https://www.hsincalibrator.com/product/1-3/',
  },
  {
    model: 'HSIN613',
    title: 'Portable pneumatic pressure test pump',
    image: '/calibration-equipment/hsin613-portable-pressure-test-pump.png',
    link: 'https://www.hsincalibrator.com/product/5/',
  },
  {
    model: 'HSIN600-9',
    title: 'Four-port pressure calibration table',
    image: '/calibration-equipment/hsin600-9-four-port-pressure-table.jpg',
    link: 'https://www.hsincalibrator.com/product/1-5/',
  },
];

const faqs = [
  {
    question: 'How often should industrial instruments be calibrated?',
    answer:
      'There is no universal interval. Start with manufacturer guidance and applicable quality requirements, then consider measurement criticality, operating environment, usage, previous results and events such as overload, shock or repair. The interval should be justified for the specific instrument and application.',
  },
  {
    question: 'Does calibration automatically include adjustment or repair?',
    answer:
      'No. Calibration compares and records performance. Adjustment changes the instrument to reduce an observed error, while repair restores a faulty instrument. Either activity must be technically suitable and separately agreed.',
  },
  {
    question: 'Can calibration be completed without stopping production?',
    answer:
      'Sometimes, but it cannot be assumed. The answer depends on isolation points, process risk, access, instrument arrangement and the required method. Suitable clamp-on ultrasonic flow checks can be performed without cutting the pipe, but the process still needs to be scoped.',
  },
  {
    question: 'What does metrological traceability mean?',
    answer:
      'It is a property of a measurement result that links the result to a reference through a documented, unbroken chain of calibrations, with each link contributing to measurement uncertainty. Owning a calibrator by itself does not establish traceability.',
  },
  {
    question: 'Is clamp-on ultrasonic flow measurement suitable for every pipe and fluid?',
    answer:
      'No. Suitability depends on the instrument configuration, pipe material and condition, wall thickness, liner, fluid, solids or aeration, temperature, available straight run and flow profile. These details should be reviewed before quoting.',
  },
];

const articleJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: 'Industrial Instrument Calibration: Process, Capabilities and What to Expect',
  description:
    'A practical guide to pressure, temperature and flow calibration, including scope definition, ultrasonic suitability, reporting and compliance boundaries.',
  image:
    'https://www.touchteq.co.za/insights/industrial-instrument-calibration-process-guide.webp',
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
  datePublished: '2026-08-11T00:00:00+02:00',
  dateModified: '2026-08-11T00:00:00+02:00',
  mainEntityOfPage: articleUrl,
  keywords:
    'industrial instrument calibration, pressure calibration, temperature calibration, flow calibration, ultrasonic flow measurement, South Africa',
};

const sources = [
  {
    name: 'ISO — ISO/IEC 17025:2017 overview',
    href: 'https://www.iso.org/standard/66912.html',
  },
  {
    name: 'ISO and IAF — Monitoring and measuring resources audit guidance',
    href: 'https://committee.iso.org/files/live/sites/tc176/files/documents/ISO%209001%20Auditing%20Practices%20Group%20docs/Auditing%20to%20ISO%209001%202015/APG-MonitoringMeasuring2015.pdf',
  },
  {
    name: 'NIST — Metrological Traceability: Frequently Asked Questions and Policy',
    href: 'https://www.nist.gov/metrology/metrological-traceability',
  },
  {
    name: 'SANAS — South African National Accreditation System',
    href: 'https://www.sanas.co.za/Pages/index.aspx',
  },
  {
    name: 'NMISA — Physical and Electrical Metrology',
    href: 'https://www.nmisa.org/physical-and-electrical-metrology/Pages/default.aspx',
  },
  {
    name: 'South African Government — Legal Metrology Act 9 of 2014',
    href: 'https://www.gov.za/documents/legal-metrology-act',
  },
  {
    name: 'Fluke — How often should you calibrate?',
    href: 'https://www.fluke.com/en-th/learn/blog/calibration/how-often-should-you-calibrate',
  },
];

export default function IndustrialInstrumentCalibrationProcessGuidePage() {
  return (
    <main className="min-h-screen bg-white font-sans">
      <BreadcrumbJsonLd
        items={[
          { name: 'Home', url: 'https://www.touchteq.co.za' },
          { name: 'Insights', url: 'https://www.touchteq.co.za/insights' },
          { name: 'Industrial Instrument Calibration Process Guide', url: articleUrl },
        ]}
      />
      <FAQJsonLd faqs={faqs} />
      <JsonLd data={articleJsonLd} />
      <Header />

      <section className="relative overflow-hidden bg-[#0A1120] pb-24 pt-36 text-white md:pb-32 md:pt-48">
        <div className="absolute inset-0">
          <Image
            src="/plant-field-panel-system-integration.jpeg"
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover opacity-25"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0A1120] via-[#0A1120]/95 to-[#0A1120]/45" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0A1120] via-transparent to-transparent" />
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
            <div className="mb-7 flex flex-wrap items-center gap-3 text-[10px] font-black uppercase tracking-[0.16em]">
              <span className="bg-orange-500 px-3 py-1.5 text-white">Instrument calibration</span>
              <span className="inline-flex items-center gap-2 border border-white/20 px-3 py-1.5 text-slate-300">
                <Clock size={13} aria-hidden="true" /> 11 min read
              </span>
              <span className="text-slate-400">Published 11 August 2026</span>
            </div>

            <h1 className="max-w-5xl text-4xl font-black uppercase leading-[0.98] tracking-tight sm:text-5xl md:text-7xl">
              Industrial instrument calibration:{' '}
              <span className="text-orange-500">process, capabilities and what to expect.</span>
            </h1>
            <p className="mt-8 max-w-3xl text-base font-medium leading-relaxed text-slate-300 md:text-xl">
              A practical guide for plant, maintenance and engineering teams that need to understand what calibration proves, how a defensible scope is built and what information belongs in the handover.
            </p>
          </div>
        </div>
      </section>

      <section className="border-b border-slate-200 bg-slate-50 py-8">
        <div className="container mx-auto flex flex-col gap-5 px-4 md:flex-row md:items-center md:justify-between md:px-8">
          <p className="max-w-3xl text-sm font-medium leading-relaxed text-slate-600">
            <span className="font-black uppercase text-[#1A2B4C]">Quick answer:</span>{' '}
            calibration compares an instrument&apos;s indication with an applicable reference under defined conditions and records the relationship. It does not automatically adjust or repair the instrument.
          </p>
          <ShareButton
            title="Industrial Instrument Calibration: Process, Capabilities and What to Expect"
            description="A practical guide to pressure, temperature and flow calibration for industrial teams."
            url={articleUrl}
            className="shrink-0"
          />
        </div>
      </section>

      <section className="py-16 md:py-24">
        <div className="container mx-auto grid gap-12 px-4 lg:grid-cols-[220px_minmax(0,780px)] lg:justify-center lg:gap-16 md:px-8">
          <aside className="hidden lg:block">
            <nav aria-label="Article contents" className="sticky top-32 border-l border-slate-200 pl-5">
              <p className="mb-4 text-[10px] font-black uppercase tracking-[0.22em] text-orange-500">In this guide</p>
              <ol className="space-y-3 text-sm font-bold leading-snug text-slate-500">
                <li><a className="transition-colors hover:text-orange-600" href="#why-calibration-matters">Why calibration matters</a></li>
                <li><a className="transition-colors hover:text-orange-600" href="#calibration-process">The three-step process</a></li>
                <li><a className="transition-colors hover:text-orange-600" href="#capabilities">Pressure, temperature and flow</a></li>
                <li><a className="transition-colors hover:text-orange-600" href="#ultrasonic-flow">Ultrasonic flow suitability</a></li>
                <li><a className="transition-colors hover:text-orange-600" href="#calibration-frequency">Calibration frequency</a></li>
                <li><a className="transition-colors hover:text-orange-600" href="#records">The handover record</a></li>
                <li><a className="transition-colors hover:text-orange-600" href="#standards">Standards and boundaries</a></li>
                <li><a className="transition-colors hover:text-orange-600" href="#request-scope">What to send</a></li>
              </ol>
            </nav>
          </aside>

          <article className="min-w-0">
            <div className="border-l-4 border-orange-500 bg-slate-50 px-6 py-7 md:px-8">
              <p className="text-xl font-black leading-relaxed text-[#1A2B4C] md:text-2xl">
                A display can look stable while the measurement behind it has shifted. Calibration provides the comparison data needed to decide whether the reading can still be trusted for its intended use.
              </p>
            </div>

            <section id="why-calibration-matters" className="scroll-mt-28 pt-16">
              <p className="text-xs font-black uppercase tracking-[0.28em] text-orange-500">01 — The measurement problem</p>
              <h2 className="mt-4 text-3xl font-black uppercase leading-tight text-[#1A2B4C] md:text-4xl">Why calibration matters before an instrument visibly fails</h2>
              <div className="mt-7 space-y-6 text-base font-medium leading-relaxed text-slate-600">
                <p>
                  Industrial instruments operate through heat, vibration, pressure cycling, moisture, contamination, ageing and occasional over-range events. Those conditions can change how a sensor, transmitter, gauge or meter responds. The change may be gradual enough that operators do not notice it from the display alone.
                </p>
                <p>
                  The consequence depends on what the measurement controls. A small error in a local indication may be inconvenient. The same error in a dosing loop, alarm threshold, product-release measurement or energy balance can change operating decisions, maintenance priorities and product quality.
                </p>
                <p>
                  Calibration does not answer every engineering question. It answers a precise one: <strong className="text-[#1A2B4C]">under the agreed conditions and test points, how did the instrument indication compare with the applicable reference?</strong>
                </p>
              </div>
            </section>

            <section id="calibration-process" className="scroll-mt-28 pt-20">
              <p className="text-xs font-black uppercase tracking-[0.28em] text-orange-500">02 — Scope before testing</p>
              <h2 className="mt-4 text-3xl font-black uppercase leading-tight text-[#1A2B4C] md:text-4xl">A calibration begins with the decision the client needs to make</h2>
              <p className="mt-6 text-base font-medium leading-relaxed text-slate-600">
                The model number alone is not a calibration scope. The method must fit the instrument, process conditions, required test points and intended use of the result. That is why Touch Teqniques uses a three-step journey rather than promising a generic test before reviewing the application.
              </p>

              <ol className="mt-10 grid gap-px overflow-hidden border border-slate-200 bg-slate-200 md:grid-cols-3">
                {processSteps.map((step) => {
                  const Icon = step.icon;
                  return (
                    <li key={step.number} className="bg-white p-6 md:p-7">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs font-black text-orange-500">{step.number}</span>
                        <Icon size={25} className="text-slate-300" aria-hidden="true" />
                      </div>
                      <h3 className="mt-7 text-lg font-black uppercase text-[#1A2B4C]">{step.title}</h3>
                      <p className="mt-3 text-sm font-medium leading-relaxed text-slate-600">{step.body}</p>
                    </li>
                  );
                })}
              </ol>

              <figure className="mt-12 overflow-hidden border border-slate-200 bg-slate-50">
                <Image
                  src="/insights/industrial-instrument-calibration-process-guide.webp"
                  alt="Infographic explaining the three-step industrial instrument calibration journey, supported instruments and ultrasonic flow capability"
                  width={1800}
                  height={1005}
                  sizes="(max-width: 1024px) 100vw, 780px"
                  className="h-auto w-full"
                />
                <figcaption className="flex flex-col gap-3 border-t border-slate-200 bg-white px-5 py-4 text-sm leading-relaxed text-slate-600 sm:flex-row sm:items-center sm:justify-between">
                  <span>Visual summary of the scope-led calibration journey.</span>
                  <Link
                    href="/insights/industrial-instrument-calibration-process-guide.webp"
                    target="_blank"
                    className="inline-flex items-center gap-2 font-black uppercase tracking-[0.12em] text-orange-600 hover:text-[#1A2B4C]"
                  >
                    Open full infographic <ExternalLink size={14} aria-hidden="true" />
                  </Link>
                </figcaption>
              </figure>
            </section>

            <section id="capabilities" className="scroll-mt-28 pt-20">
              <p className="text-xs font-black uppercase tracking-[0.28em] text-orange-500">03 — What can be checked</p>
              <h2 className="mt-4 text-3xl font-black uppercase leading-tight text-[#1A2B4C] md:text-4xl">Pressure, temperature and flow each need a different measurement method</h2>

              <div className="mt-10 space-y-5">
                <div className="grid gap-6 border-t-4 border-orange-500 bg-[#1A2B4C] p-7 text-white sm:grid-cols-[56px_1fr] md:p-9">
                  <Gauge size={42} className="text-orange-500" aria-hidden="true" />
                  <div>
                    <h3 className="text-2xl font-black uppercase">Pressure</h3>
                    <p className="mt-4 text-sm font-medium leading-relaxed text-slate-300">
                      Suitable gauges, transmitters and switches can be compared across agreed points. A planned sequence can reveal zero error, span error, non-linearity, hysteresis or a switch operating away from its intended actuation point. The pressure medium, range, fittings, isolation arrangement and required tolerance must be known before the method is confirmed.
                    </p>
                  </div>
                </div>
                <div className="grid gap-6 border-t-4 border-orange-500 bg-[#1A2B4C] p-7 text-white sm:grid-cols-[56px_1fr] md:p-9">
                  <Thermometer size={42} className="text-orange-500" aria-hidden="true" />
                  <div>
                    <h3 className="text-2xl font-black uppercase">Temperature</h3>
                    <p className="mt-4 text-sm font-medium leading-relaxed text-slate-300">
                      RTDs, thermocouples, probes and transmitters are compared at temperatures relevant to the application. Sensor type, wiring, immersion depth, insert size and stabilisation time all influence the result. A sensor element found outside tolerance may require replacement; calibration itself does not restore a degraded sensing element.
                    </p>
                  </div>
                </div>
                <div className="grid gap-6 border-t-4 border-orange-500 bg-[#1A2B4C] p-7 text-white sm:grid-cols-[56px_1fr] md:p-9">
                  <Activity size={42} className="text-orange-500" aria-hidden="true" />
                  <div>
                    <h3 className="text-2xl font-black uppercase">Flow</h3>
                    <p className="mt-4 text-sm font-medium leading-relaxed text-slate-300">
                      Installed meters and flow loops require a comparison method that fits the meter technology and piping arrangement. Pipe dimensions, process medium, flow profile, zero condition and access can be as important as the meter model. In some applications, a clamp-on ultrasonic instrument provides temporary, non-invasive flow insight.
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-12 border border-slate-200 bg-slate-50 p-6 md:p-8">
                <p className="text-xs font-black uppercase tracking-[0.24em] text-orange-500">Equipment purchased for the new service</p>
                <p className="mt-4 text-sm font-medium leading-relaxed text-slate-600">
                  Touch Teqniques has purchased the three HSIN models below. These tools support the developing temperature and pressure offering, but equipment ownership alone does not establish a published service range, measurement uncertainty or metrological traceability. Those depend on the complete reference setup, procedure and supporting records.
                </p>
                <div className="mt-7 grid gap-px overflow-hidden border border-slate-200 bg-slate-200 sm:grid-cols-3">
                  {equipment.map((item) => (
                    <a
                      key={item.model}
                      href={item.link}
                      target="_blank"
                      rel="noreferrer"
                      className="group bg-white p-5 transition-colors hover:bg-orange-50"
                    >
                      <div className="relative aspect-square">
                        <Image src={item.image} alt={`${item.model} ${item.title}`} fill sizes="(max-width: 640px) 100vw, 240px" className="object-contain" />
                      </div>
                      <p className="mt-4 font-mono text-xs font-black uppercase tracking-[0.16em] text-orange-600">{item.model}</p>
                      <p className="mt-2 text-sm font-black uppercase leading-snug text-[#1A2B4C]">{item.title}</p>
                    </a>
                  ))}
                </div>
              </div>
            </section>

            <section id="ultrasonic-flow" className="scroll-mt-28 pt-20">
              <p className="text-xs font-black uppercase tracking-[0.28em] text-orange-500">04 — Non-invasive flow insight</p>
              <h2 className="mt-4 text-3xl font-black uppercase leading-tight text-[#1A2B4C] md:text-4xl">Clamp-on ultrasonic measurement is valuable because it avoids opening the pipe—not because it removes application limits</h2>
              <p className="mt-7 text-base font-medium leading-relaxed text-slate-600">
                Clamp-on transducers are mounted outside a suitable pipe, allowing temporary measurement without cutting into the line or placing wetted parts in the process. This can be useful for check-metering, troubleshooting and temporary monitoring where process interruption is undesirable.
              </p>

              <div className="mt-8 grid gap-px overflow-hidden border border-slate-200 bg-slate-200 md:grid-cols-2">
                <div className="bg-white p-7">
                  <h3 className="flex items-center gap-3 text-lg font-black uppercase text-[#1A2B4C]"><CheckCircle2 className="text-orange-500" aria-hidden="true" /> Stronger candidates</h3>
                  <ul className="mt-6 space-y-3 text-sm font-medium leading-relaxed text-slate-600">
                    <li>Known pipe material, outside diameter and wall thickness</li>
                    <li>Suitable clean, single-phase liquids</li>
                    <li>A completely filled pipe with a stable flow profile</li>
                    <li>Adequate straight run and accessible mounting surface</li>
                    <li>Temporary verification or troubleshooting duties</li>
                  </ul>
                </div>
                <div className="bg-[#0A1120] p-7 text-white">
                  <h3 className="flex items-center gap-3 text-lg font-black uppercase"><ShieldCheck className="text-orange-500" aria-hidden="true" /> Conditions requiring review</h3>
                  <ul className="mt-6 space-y-3 text-sm font-medium leading-relaxed text-slate-300">
                    <li>Aeration, bubbles or changing gas content</li>
                    <li>High solids loading or an unknown slurry composition</li>
                    <li>Lined, coated, scaled, corroded or partially filled pipes</li>
                    <li>Disturbed flow near valves, bends or pumps</li>
                    <li>Legal-for-trade or custody-transfer measurement</li>
                  </ul>
                </div>
              </div>
              <p className="mt-6 border-l-2 border-orange-500 pl-5 text-sm font-medium leading-relaxed text-slate-600">
                The service page therefore uses the phrase <strong className="text-[#1A2B4C]">suitable applications</strong>. Fluid, pipe, installation and equipment limitations should be reviewed before an ultrasonic result is promised.
              </p>
            </section>

            <section id="calibration-frequency" className="scroll-mt-28 pt-20">
              <p className="text-xs font-black uppercase tracking-[0.28em] text-orange-500">05 — Setting the interval</p>
              <h2 className="mt-4 text-3xl font-black uppercase leading-tight text-[#1A2B4C] md:text-4xl">Annual calibration is a common starting point, not a universal engineering rule</h2>
              <p className="mt-7 text-base font-medium leading-relaxed text-slate-600">
                Calibration frequency should reflect the risk attached to the measurement and the evidence available for that instrument. Manufacturer guidance can provide a baseline, but it should be considered alongside the application.
              </p>
              <ul className="mt-8 grid gap-4 sm:grid-cols-2">
                {[
                  'Measurement criticality and consequence of error',
                  'Manufacturer recommendation and required tolerance',
                  'Heat, vibration, moisture, corrosion and process cycling',
                  'Usage intensity and instrument age',
                  'Previous as-found results and observed drift trend',
                  'Overload, repair, impact or suspicious readings',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3 border border-slate-200 bg-slate-50 p-4 text-sm font-bold leading-relaxed text-slate-700">
                    <CheckCircle2 size={17} className="mt-0.5 shrink-0 text-orange-500" aria-hidden="true" />
                    {item}
                  </li>
                ))}
              </ul>
            </section>

            <section id="records" className="scroll-mt-28 pt-20">
              <p className="text-xs font-black uppercase tracking-[0.28em] text-orange-500">06 — The documented result</p>
              <h2 className="mt-4 text-3xl font-black uppercase leading-tight text-[#1A2B4C] md:text-4xl">Agree the handover before the work begins</h2>
              <p className="mt-7 text-base font-medium leading-relaxed text-slate-600">
                A calibration record should let the maintenance or quality team understand what was tested, how it was tested and what was observed. The exact certificate or handover format, acceptance decision, uncertainty statement and traceability evidence must match the agreed service scope.
              </p>
              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                {[
                  'Instrument tag, manufacturer, model and serial number',
                  'Agreed test points, units and recorded readings',
                  'Method and reference equipment used',
                  'Observed deviation at each point',
                  'As-found and, when separately agreed, as-left results',
                  'Conditions, limitations and recommended follow-up',
                ].map((item) => (
                  <div key={item} className="flex items-start gap-3 text-sm font-semibold leading-relaxed text-slate-700">
                    <FileCheck2 size={18} className="mt-0.5 shrink-0 text-orange-500" aria-hidden="true" />
                    {item}
                  </div>
                ))}
              </div>
            </section>

            <section id="standards" className="scroll-mt-28 pt-20">
              <p className="text-xs font-black uppercase tracking-[0.28em] text-orange-500">07 — Standards and claim boundaries</p>
              <h2 className="mt-4 text-3xl font-black uppercase leading-tight text-[#1A2B4C] md:text-4xl">Traceable, accredited and legal-for-trade are not interchangeable labels</h2>
              <div className="mt-7 space-y-6 text-base font-medium leading-relaxed text-slate-600">
                <p>
                  <a className="font-bold text-orange-600 underline decoration-orange-300 underline-offset-4" href="https://www.nist.gov/metrology/metrological-traceability" target="_blank" rel="noreferrer">NIST&apos;s metrological traceability guidance</a> makes an important point: traceability is a property of a measurement result. It requires a documented, unbroken chain of calibrations, with each link contributing to the measurement uncertainty. Simply owning a reference instrument, or having it calibrated once, does not automatically make every later result traceable.
                </p>
                <p>
                  <a className="font-bold text-orange-600 underline decoration-orange-300 underline-offset-4" href="https://www.iso.org/standard/66912.html" target="_blank" rel="noreferrer">ISO/IEC 17025</a> is the international benchmark used to assess the competence, impartiality and consistent operation of testing and calibration laboratories. In South Africa, <a className="font-bold text-orange-600 underline decoration-orange-300 underline-offset-4" href="https://www.sanas.co.za/Pages/index.aspx" target="_blank" rel="noreferrer">SANAS</a> is the national accreditation body. Accreditation applies to a defined organisation and scope; it should never be implied without current supporting evidence.
                </p>
                <p>
                  Legal verification is another category. The <a className="font-bold text-orange-600 underline decoration-orange-300 underline-offset-4" href="https://www.gov.za/documents/legal-metrology-act" target="_blank" rel="noreferrer">Legal Metrology Act</a> governs prescribed measurement used for purposes such as fair trade, health, safety and environmental protection. Industrial calibration or check-metering does not automatically confer legal-for-trade status.
                </p>
              </div>

              <div className="mt-10 border-t-4 border-orange-500 bg-[#0A1120] p-7 text-white md:p-9">
                <h3 className="flex items-center gap-3 text-xl font-black uppercase"><ShieldCheck className="text-orange-500" aria-hidden="true" /> Touch Teqniques&apos; current website position</h3>
                <p className="mt-5 text-sm font-medium leading-relaxed text-slate-300">
                  This article does not claim SANAS accreditation, ISO/IEC 17025-accredited results, metrological traceability, legal verification, fixed service ranges or stated uncertainties for Touch Teqniques Engineering. Where any of those requirements apply, they must be identified during scoping and supported by the exact method, equipment records and competent route used for that job.
                </p>
              </div>
            </section>

            <section className="pt-20">
              <p className="text-xs font-black uppercase tracking-[0.28em] text-orange-500">08 — A critical distinction</p>
              <h2 className="mt-4 text-3xl font-black uppercase leading-tight text-[#1A2B4C] md:text-4xl">Calibration measures. Adjustment changes. Repair restores.</h2>
              <div className="mt-9 overflow-x-auto border border-slate-200">
                <table className="w-full min-w-[620px] border-collapse text-left">
                  <thead className="bg-[#1A2B4C] text-white">
                    <tr>
                      <th className="p-4 text-xs font-black uppercase tracking-wider">Activity</th>
                      <th className="p-4 text-xs font-black uppercase tracking-wider">What it does</th>
                      <th className="p-4 text-xs font-black uppercase tracking-wider">Result</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 text-sm font-medium leading-relaxed text-slate-600">
                    <tr><td className="p-4 font-black text-[#1A2B4C]">Calibration</td><td className="p-4">Compares indications with an applicable reference under defined conditions.</td><td className="p-4">Recorded measurement relationship and deviation.</td></tr>
                    <tr><td className="p-4 font-black text-[#1A2B4C]">Adjustment</td><td className="p-4">Changes the instrument response to reduce an identified error.</td><td className="p-4">Modified instrument, followed by new measurement data.</td></tr>
                    <tr><td className="p-4 font-black text-[#1A2B4C]">Repair</td><td className="p-4">Corrects a fault or replaces damaged components.</td><td className="p-4">Restored function, followed by suitable testing or calibration.</td></tr>
                  </tbody>
                </table>
              </div>
              <p className="mt-6 flex items-start gap-3 text-sm font-medium leading-relaxed text-slate-600">
                <Wrench size={19} className="mt-0.5 shrink-0 text-orange-500" aria-hidden="true" />
                Touch Teqniques separates calibration from adjustment and repair so the as-found condition is not hidden and the client can decide what corrective work is appropriate.
              </p>
            </section>

            <section id="request-scope" className="scroll-mt-28 pt-20">
              <p className="text-xs font-black uppercase tracking-[0.28em] text-orange-500">09 — Prepare the enquiry</p>
              <h2 className="mt-4 text-3xl font-black uppercase leading-tight text-[#1A2B4C] md:text-4xl">What to send when requesting a calibration scope</h2>
              <p className="mt-7 text-base font-medium leading-relaxed text-slate-600">
                A useful enquiry prevents assumptions and makes the quotation more accurate. Send as much of the following as is available:
              </p>
              <ol className="mt-8 grid gap-px overflow-hidden border border-slate-200 bg-slate-200 sm:grid-cols-2">
                {[
                  'Instrument type, tag number, manufacturer and model',
                  'Quantity and location of each instrument',
                  'Instrument range and normal operating range',
                  'Required test points, alarm points or decision tolerance',
                  'Process medium and relevant operating conditions',
                  'Pipe size, material, wall thickness and liner for ultrasonic flow',
                  'Access, isolation, permit and preferred timing requirements',
                  'Previous reports and client-specific handover requirements',
                ].map((item, index) => (
                  <li key={item} className="flex gap-4 bg-white p-5 text-sm font-semibold leading-relaxed text-slate-700">
                    <span className="font-mono text-xs font-black text-orange-500">{String(index + 1).padStart(2, '0')}</span>
                    {item}
                  </li>
                ))}
              </ol>
            </section>

            <section className="pt-20">
              <p className="text-xs font-black uppercase tracking-[0.28em] text-orange-500">Common questions</p>
              <h2 className="mt-4 text-3xl font-black uppercase leading-tight text-[#1A2B4C] md:text-4xl">Questions to settle before the work is quoted</h2>
              <div className="mt-9 divide-y divide-slate-200 border-y border-slate-200">
                {faqs.map((faq) => (
                  <details key={faq.question} className="group py-6">
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-5 text-lg font-black text-[#1A2B4C] marker:content-none">
                      {faq.question}
                      <span className="text-2xl text-orange-500 transition-transform group-open:rotate-45">+</span>
                    </summary>
                    <p className="mt-4 max-w-3xl pr-10 text-sm font-medium leading-relaxed text-slate-600">{faq.answer}</p>
                  </details>
                ))}
              </div>
            </section>

            <section className="pt-20">
              <p className="text-xs font-black uppercase tracking-[0.28em] text-orange-500">Authoritative references</p>
              <h2 className="mt-4 text-3xl font-black uppercase leading-tight text-[#1A2B4C] md:text-4xl">Sources and further reading</h2>
              <p className="mt-6 text-sm font-medium leading-relaxed text-slate-600">
                The research files supplied for this article were consolidated and filtered against the following standards bodies, government sources, national measurement institutions and manufacturer guidance.
              </p>
              <ul className="mt-7 space-y-3">
                {sources.map((source) => (
                  <li key={source.href}>
                    <a href={source.href} target="_blank" rel="noreferrer" className="inline-flex items-start gap-3 text-sm font-bold leading-relaxed text-[#1A2B4C] transition-colors hover:text-orange-600">
                      <ExternalLink size={15} className="mt-0.5 shrink-0 text-orange-500" aria-hidden="true" />
                      {source.name}
                    </a>
                  </li>
                ))}
              </ul>
            </section>

            <div className="mt-16 border-t border-slate-200 pt-8 text-sm font-medium leading-relaxed text-slate-500">
              <p>
                This guide is general technical information, not a declaration that a particular calibration method, accreditation route or legal verification applies to every instrument. The correct route must be confirmed from the application and required use of the result.
              </p>
            </div>
          </article>
        </div>
      </section>

      <section className="bg-[#0A1120] py-20 text-white">
        <div className="container mx-auto px-4 text-center md:px-8">
          <p className="text-xs font-black uppercase tracking-[0.3em] text-orange-500">Ready to define the requirement?</p>
          <h2 className="mx-auto mt-5 max-w-4xl text-3xl font-black uppercase leading-tight md:text-5xl">Send the instrument list and start with the right measurement method.</h2>
          <p className="mx-auto mt-6 max-w-2xl text-base font-medium leading-relaxed text-slate-300">
            Include the models, quantities, ranges, process medium, site location and preferred timing. Touch Teqniques will review suitability before confirming the scope.
          </p>
          <div className="mt-9 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link href={calibrationContactHref} className="group inline-flex items-center gap-3 rounded-md bg-orange-500 px-7 py-4 text-xs font-black uppercase tracking-[0.16em] text-white transition-colors hover:bg-orange-600">
              Request a Calibration Scope
              <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" aria-hidden="true" />
            </Link>
            <Link href="/services/instrument-calibration" className="inline-flex items-center gap-2 px-5 py-4 text-xs font-black uppercase tracking-[0.16em] text-slate-300 transition-colors hover:text-orange-500">
              View the Calibration Service
              <ArrowRight size={15} aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>

      <BackToTop />
      <Footer />
    </main>
  );
}
