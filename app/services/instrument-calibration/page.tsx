import {
  Activity,
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  Factory,
  FileCheck2,
  Gauge,
  MapPin,
  Search,
  ShieldCheck,
  Thermometer,
  Waves,
  Wrench,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

import BackToTop from '@/components/BackToTop';
import Footer from '@/components/Footer';
import Header from '@/components/Header';
import BreadcrumbJsonLd from '@/components/seo/BreadcrumbJsonLd';
import FAQJsonLd from '@/components/seo/FAQJsonLd';
import OrganizationJsonLd from '@/components/seo/OrganizationJsonLd';
import ServiceJsonLd from '@/components/seo/ServiceJsonLd';

const calibrationContactHref =
  '/contact?service=Industrial%20Instrument%20Calibration#request-quote';

const capabilities = [
  {
    title: 'Pressure',
    icon: Gauge,
    description:
      'Calibration support for suitable pressure gauges, transmitters, switches and measurement loops.',
    examples: ['Pressure gauges', 'Pressure transmitters', 'Pressure switches', 'Indication and control loops'],
  },
  {
    title: 'Temperature',
    icon: Thermometer,
    description:
      'Comparison of suitable temperature sensors and instruments across agreed operating points.',
    examples: ['RTDs and temperature probes', 'Thermocouples', 'Temperature transmitters', 'Indication and control loops'],
  },
  {
    title: 'Flow',
    icon: Activity,
    description:
      'Flow measurement checks and calibration support scoped to the meter, process and installation conditions.',
    examples: ['Installed flow meters', 'Flow transmitters', 'Flow indication loops', 'Temporary check-metering'],
  },
];

const processSteps = [
  {
    number: '01',
    title: 'Define the scope',
    description:
      'Send the instrument type, manufacturer, model, quantity, operating range, process medium and site location.',
    icon: Search,
  },
  {
    number: '02',
    title: 'Confirm the method',
    description:
      'We review instrument and process requirements before confirming suitability, access needs and test points.',
    icon: ClipboardCheck,
  },
  {
    number: '03',
    title: 'Measure and record',
    description:
      'Readings are compared with the applicable reference equipment and the agreed results are documented.',
    icon: Gauge,
  },
  {
    number: '04',
    title: 'Report and recommend',
    description:
      'You receive the agreed calibration record, identified deviations and any separately scoped corrective recommendations.',
    icon: FileCheck2,
  },
];

const deliverables = [
  'Instrument identification and serial details',
  'Agreed test points and recorded readings',
  'Reference equipment used for the work',
  'Observed deviation across the tested range',
  'As-found and, where separately agreed, as-left results',
  'Clear notes on limitations or recommended follow-up work',
];

const industries = [
  'Mining & minerals processing',
  'Water & wastewater',
  'Chemical & petrochemical',
  'Manufacturing',
  'Power & utilities',
  'Food & beverage',
];

const faqs = [
  {
    q: 'What is instrument calibration?',
    a: 'Calibration compares an instrument reading with an applicable reference under defined conditions. The purpose is to identify and document measurement deviation across agreed test points.',
  },
  {
    q: 'Does calibration include adjustment or repair?',
    a: 'Not automatically. Calibration records how the instrument performs. Adjustment or repair is only completed when it is technically appropriate and included in the agreed scope.',
  },
  {
    q: 'Can ultrasonic flow measurement be completed without cutting the pipe?',
    a: 'Suitable clamp-on ultrasonic applications can be measured from outside the pipe. Suitability depends on the instrument, pipe material, diameter, wall thickness, liner, process medium, flow profile and site conditions.',
  },
  {
    q: 'Can you measure slurry flow?',
    a: 'Some slurry applications may be suitable for ultrasonic measurement, but not every slurry or pipe arrangement can be supported. We confirm suitability from the solids content, aeration, pipe construction, process conditions and equipment capability before quoting.',
  },
  {
    q: 'Do you support process analyzers?',
    a: 'Analytical instruments are scoped case by case. Send the analyzer type, parameter, manufacturer, model and process application so that we can confirm whether the required method can be supported.',
  },
  {
    q: 'What information should I send for a calibration quote?',
    a: 'Send the instrument list, makes and models, quantities, operating ranges, required test points, process medium, site location, preferred timing and any client-specific reporting requirements.',
  },
];

function CalibrationCta({ label = 'Request a Calibration Scope' }: { label?: string }) {
  return (
    <Link
      href={calibrationContactHref}
      className="group inline-flex w-full items-stretch overflow-hidden rounded-md bg-orange-500 shadow-xl shadow-orange-500/20 transition-colors hover:bg-orange-600 sm:w-auto"
    >
      <span className="flex flex-1 items-center justify-center px-6 py-4 text-center text-[11px] font-black uppercase tracking-[0.16em] text-white sm:justify-start md:px-8 md:text-sm">
        {label}
      </span>
      <span className="flex shrink-0 items-center justify-center bg-[#1A2B4C] px-5 transition-colors group-hover:bg-black">
        <ArrowRight className="h-4 w-4 -rotate-45 text-white transition-transform duration-300 group-hover:rotate-0 group-hover:text-orange-500" />
      </span>
    </Link>
  );
}

export default function InstrumentCalibrationPage() {
  return (
    <main className="min-h-screen bg-white font-sans">
      <BreadcrumbJsonLd
        items={[
          { name: 'Home', url: 'https://www.touchteq.co.za' },
          { name: 'Services', url: 'https://www.touchteq.co.za/#services' },
          {
            name: 'Industrial Instrument Calibration',
            url: 'https://www.touchteq.co.za/services/instrument-calibration',
          },
        ]}
      />
      <FAQJsonLd faqs={faqs.map((faq) => ({ question: faq.q, answer: faq.a }))} />
      <ServiceJsonLd
        name="Industrial Instrument Calibration"
        description="Scope-led pressure, temperature and flow calibration support, including non-invasive ultrasonic flow measurement for suitable clean-liquid and slurry applications."
        url="https://www.touchteq.co.za/services/instrument-calibration"
        serviceType={[
          'Industrial Instrument Calibration',
          'Pressure Calibration',
          'Temperature Calibration',
          'Flow Measurement',
          'Ultrasonic Flow Measurement',
        ]}
        image="https://www.touchteq.co.za/plant-field-panel-system-integration.jpeg"
      />
      <OrganizationJsonLd
        name="Touch Teqniques Engineering"
        url="https://www.touchteq.co.za"
        logo="https://www.touchteq.co.za/touch-teq-logo-wordmark.jpeg"
        description="Specialist industrial engineering firm delivering fire and gas detection, control and instrumentation, electrical engineering, and industrial instrument calibration support across Southern Africa."
      />

      <Header />

      <section className="relative overflow-hidden bg-[#0A1120] pb-24 pt-36 md:pb-32 md:pt-48">
        <div className="absolute inset-0">
          <Image
            src="/plant-field-panel-system-integration.jpeg"
            alt="Industrial field instrumentation and control panel installation"
            fill
            priority
            className="object-cover opacity-35"
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0A1120] via-[#0A1120]/90 to-[#0A1120]/35" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0A1120] via-transparent to-transparent" />
        </div>

        <div className="container relative z-10 mx-auto px-4 md:px-8">
          <nav aria-label="Breadcrumb" className="mb-8 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
            <Link href="/" className="transition-colors hover:text-orange-500">Home</Link>
            <ChevronRight size={12} aria-hidden="true" />
            <Link href="/#services" className="transition-colors hover:text-orange-500">Services</Link>
            <ChevronRight size={12} aria-hidden="true" />
            <span className="text-white">Calibration</span>
          </nav>

          <div className="max-w-4xl">
            <div className="mb-6 flex items-center gap-3">
              <span className="h-px w-10 bg-orange-500" />
              <span className="font-mono text-[10px] font-bold uppercase tracking-[0.28em] text-orange-500 md:text-xs">
                Industrial Instrument Calibration
              </span>
            </div>

            <h1 className="mb-8 text-4xl font-black uppercase leading-[0.95] tracking-tight text-white sm:text-5xl md:text-7xl lg:text-8xl">
              Know what your instruments are{' '}
              <span className="text-orange-500">really reading.</span>
            </h1>

            <p className="mb-10 max-w-3xl text-base font-medium leading-relaxed text-slate-300 md:text-xl">
              Scope-led calibration and measurement support for pressure, temperature and flow instruments, including non-invasive ultrasonic flow checks for suitable clean-liquid and slurry applications.
            </p>

            <div className="flex flex-col gap-4 sm:flex-row">
              <CalibrationCta />
              <Link
                href="#capabilities"
                className="inline-flex items-center justify-center gap-3 rounded-md border border-white/20 bg-white/5 px-6 py-4 text-[11px] font-black uppercase tracking-[0.16em] text-white backdrop-blur-sm transition-colors hover:border-orange-500 hover:text-orange-500 md:px-8 md:text-sm"
              >
                Explore Capabilities
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>
          </div>

          <div className="mt-16 grid max-w-4xl grid-cols-2 gap-px overflow-hidden rounded-md border border-white/10 bg-white/10 md:grid-cols-4">
            {['Pressure', 'Temperature', 'Flow', 'Ultrasonic'].map((item) => (
              <div key={item} className="bg-[#0A1120]/80 px-4 py-4 text-center text-[10px] font-black uppercase tracking-[0.18em] text-slate-300 backdrop-blur-sm md:px-6">
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-slate-200 bg-slate-50 py-8">
        <div className="container mx-auto grid gap-6 px-4 md:grid-cols-3 md:px-8">
          <div className="flex items-start gap-4">
            <ShieldCheck className="mt-0.5 shrink-0 text-orange-500" size={22} />
            <div>
              <p className="font-black uppercase text-[#1A2B4C]">Scope before claims</p>
              <p className="mt-1 text-sm leading-relaxed text-slate-500">Method and suitability are confirmed before work is quoted.</p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <FileCheck2 className="mt-0.5 shrink-0 text-orange-500" size={22} />
            <div>
              <p className="font-black uppercase text-[#1A2B4C]">Documented results</p>
              <p className="mt-1 text-sm leading-relaxed text-slate-500">Agreed test points and observed deviations are recorded clearly.</p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <MapPin className="mt-0.5 shrink-0 text-orange-500" size={22} />
            <div>
              <p className="font-black uppercase text-[#1A2B4C]">Industrial applications</p>
              <p className="mt-1 text-sm leading-relaxed text-slate-500">Built around plant conditions, access and operating requirements.</p>
            </div>
          </div>
        </div>
      </section>

      <section id="capabilities" className="scroll-mt-28 py-24 md:py-32">
        <div className="container mx-auto px-4 md:px-8">
          <div className="mb-14 max-w-3xl">
            <span className="mb-5 block text-xs font-black uppercase tracking-[0.3em] text-orange-500">Core capabilities</span>
            <h2 className="text-3xl font-black uppercase leading-tight text-[#1A2B4C] md:text-5xl">
              Better measurements support better process decisions.
            </h2>
            <p className="mt-6 text-base font-medium leading-relaxed text-slate-600 md:text-lg">
              Instrument drift can affect control, alarms, maintenance decisions and product quality. Calibration shows how an instrument performs across the agreed working range.
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            {capabilities.map((capability) => {
              const Icon = capability.icon;
              return (
                <article key={capability.title} className="border-t-4 border-orange-500 bg-[#1A2B4C] p-7 text-white md:p-9">
                  <Icon className="mb-8 text-orange-500" size={38} aria-hidden="true" />
                  <h3 className="text-2xl font-black uppercase">{capability.title}</h3>
                  <p className="mt-4 text-sm font-medium leading-relaxed text-slate-300">{capability.description}</p>
                  <ul className="mt-8 space-y-3">
                    {capability.examples.map((example) => (
                      <li key={example} className="flex items-start gap-3 text-sm font-semibold text-slate-200">
                        <CheckCircle2 className="mt-0.5 shrink-0 text-orange-500" size={16} aria-hidden="true" />
                        {example}
                      </li>
                    ))}
                  </ul>
                </article>
              );
            })}
          </div>

          <div className="mt-8 border border-slate-200 bg-slate-50 p-6 md:flex md:items-center md:justify-between md:gap-10 md:p-8">
            <div>
              <p className="font-black uppercase text-[#1A2B4C]">Need support for a process analyzer?</p>
              <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-600">
                Analytical instruments are scoped case by case. Include the parameter, manufacturer, model and process application in your enquiry so suitability can be confirmed before quoting.
              </p>
            </div>
            <Link href={calibrationContactHref} className="mt-5 inline-flex shrink-0 items-center gap-2 text-xs font-black uppercase tracking-[0.16em] text-orange-600 hover:text-[#1A2B4C] md:mt-0">
              Send instrument details <ArrowRight size={16} aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>

      <section className="overflow-hidden bg-[#0A1120] py-24 text-white md:py-32">
        <div className="container mx-auto grid items-center gap-16 px-4 lg:grid-cols-[1.05fr_0.95fr] md:px-8">
          <div>
            <span className="mb-5 block text-xs font-black uppercase tracking-[0.3em] text-orange-500">Ultrasonic flow spotlight</span>
            <h2 className="text-3xl font-black uppercase leading-tight md:text-5xl">Flow insight without automatically opening the pipe.</h2>
            <p className="mt-6 text-base font-medium leading-relaxed text-slate-300 md:text-lg">
              Suitable clamp-on ultrasonic applications can be assessed from outside the pipe, supporting temporary measurement and check-metering where a process interruption is undesirable.
            </p>

            <div className="mt-10 grid gap-4 sm:grid-cols-2">
              {[
                'Clean-liquid applications',
                'Suitable slurry applications',
                'Temporary check-metering',
                'Flow troubleshooting support',
              ].map((item) => (
                <div key={item} className="flex items-center gap-3 border border-white/10 bg-white/5 px-4 py-4 text-sm font-bold">
                  <CheckCircle2 className="shrink-0 text-orange-500" size={17} aria-hidden="true" />
                  {item}
                </div>
              ))}
            </div>

            <p className="mt-8 border-l-2 border-orange-500 pl-5 text-sm leading-relaxed text-slate-400">
              Suitability depends on the pipe, liner, process medium, solids or aeration, flow profile, temperature and available equipment configuration. Exact ranges are confirmed during scoping.
            </p>
          </div>

          <div aria-label="Diagram showing ultrasonic sensors measuring flow from outside a pipe" className="relative min-h-[390px] border border-white/10 bg-white/[0.03] p-6 sm:p-10">
            <div className="absolute inset-x-8 top-1/2 h-28 -translate-y-1/2 rounded-full border-4 border-slate-500 bg-gradient-to-b from-slate-300 to-slate-600 shadow-2xl sm:inset-x-12">
              <div className="absolute inset-3 overflow-hidden rounded-full bg-[#15395b]">
                <div className="absolute inset-y-0 left-0 w-2/3 bg-gradient-to-r from-[#1f5b83] to-[#2e7aa1]" />
                <ArrowRight className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-white/80" size={52} strokeWidth={1.3} aria-hidden="true" />
              </div>
            </div>

            <div className="absolute left-[24%] top-[25%] h-20 w-12 -rotate-12 rounded border-2 border-orange-300 bg-orange-500 shadow-lg shadow-orange-500/30" />
            <div className="absolute right-[24%] top-[25%] h-20 w-12 rotate-12 rounded border-2 border-orange-300 bg-orange-500 shadow-lg shadow-orange-500/30" />

            <Waves className="absolute left-1/2 top-[34%] -translate-x-1/2 text-orange-300" size={70} strokeWidth={1.3} aria-hidden="true" />

            <div className="absolute bottom-8 left-1/2 w-[calc(100%-3rem)] -translate-x-1/2 border border-white/10 bg-[#0A1120] p-4 text-center sm:w-auto sm:min-w-72">
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-orange-500">Non-invasive measurement concept</p>
              <p className="mt-2 text-xs leading-relaxed text-slate-400">Sensors are mounted externally for suitable applications.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-24 md:py-32">
        <div className="container mx-auto px-4 md:px-8">
          <div className="mb-14 max-w-3xl">
            <span className="mb-5 block text-xs font-black uppercase tracking-[0.3em] text-orange-500">How the service works</span>
            <h2 className="text-3xl font-black uppercase leading-tight text-[#1A2B4C] md:text-5xl">A clear path from instrument list to documented result.</h2>
          </div>

          <ol className="grid gap-px overflow-hidden border border-slate-200 bg-slate-200 md:grid-cols-2 lg:grid-cols-4">
            {processSteps.map((step) => {
              const Icon = step.icon;
              return (
                <li key={step.number} className="bg-white p-7 md:p-8">
                  <div className="mb-8 flex items-center justify-between">
                    <span className="font-mono text-sm font-black text-orange-500">{step.number}</span>
                    <Icon className="text-slate-300" size={28} aria-hidden="true" />
                  </div>
                  <h3 className="text-lg font-black uppercase text-[#1A2B4C]">{step.title}</h3>
                  <p className="mt-4 text-sm leading-relaxed text-slate-500">{step.description}</p>
                </li>
              );
            })}
          </ol>
        </div>
      </section>

      <section className="bg-slate-50 py-24 md:py-32">
        <div className="container mx-auto grid gap-16 px-4 lg:grid-cols-2 md:px-8">
          <div>
            <span className="mb-5 block text-xs font-black uppercase tracking-[0.3em] text-orange-500">Documented handover</span>
            <h2 className="text-3xl font-black uppercase leading-tight text-[#1A2B4C] md:text-5xl">Results your maintenance team can use.</h2>
            <p className="mt-6 text-base font-medium leading-relaxed text-slate-600 md:text-lg">
              The reporting scope is agreed before work begins, so your team knows what will be measured, recorded and handed over.
            </p>
            <ul className="mt-10 grid gap-4 sm:grid-cols-2">
              {deliverables.map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm font-semibold leading-relaxed text-slate-700">
                  <CheckCircle2 className="mt-0.5 shrink-0 text-orange-500" size={17} aria-hidden="true" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <aside className="bg-[#1A2B4C] p-8 text-white md:p-10">
            <Wrench className="mb-8 text-orange-500" size={40} aria-hidden="true" />
            <h3 className="text-2xl font-black uppercase">Calibration is not automatically adjustment or repair.</h3>
            <p className="mt-5 text-sm font-medium leading-relaxed text-slate-300">
              Calibration records instrument performance. If adjustment, repair or a compliance decision is required, that work must be technically suitable and included in the agreed scope.
            </p>
            <div className="mt-8 border-t border-white/10 pt-8">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-orange-500">Important scope boundary</p>
              <p className="mt-3 text-sm leading-relaxed text-slate-400">
                Regulatory verification and accredited calibration are not implied. Where either is required, tell us during scoping so the correct route can be confirmed.
              </p>
            </div>
          </aside>
        </div>
      </section>

      <section className="py-24 md:py-32">
        <div className="container mx-auto px-4 md:px-8">
          <div className="grid gap-14 lg:grid-cols-[0.85fr_1.15fr]">
            <div>
              <span className="mb-5 block text-xs font-black uppercase tracking-[0.3em] text-orange-500">Industrial applications</span>
              <h2 className="text-3xl font-black uppercase leading-tight text-[#1A2B4C] md:text-5xl">Built for the conditions around the instrument.</h2>
              <p className="mt-6 text-base font-medium leading-relaxed text-slate-600">
                The process medium, installation, access, production schedule and reporting requirement all shape the right measurement approach.
              </p>
            </div>
            <div className="grid gap-px border border-slate-200 bg-slate-200 sm:grid-cols-2">
              {industries.map((industry) => (
                <div key={industry} className="flex items-center gap-4 bg-white p-6">
                  <Factory className="shrink-0 text-orange-500" size={22} aria-hidden="true" />
                  <span className="text-sm font-black uppercase text-[#1A2B4C]">{industry}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-slate-50 py-24 md:py-32">
        <div className="container mx-auto max-w-5xl px-4 md:px-8">
          <div className="mb-14 text-center">
            <span className="mb-5 block text-xs font-black uppercase tracking-[0.3em] text-orange-500">Common questions</span>
            <h2 className="text-3xl font-black uppercase leading-tight text-[#1A2B4C] md:text-5xl">Scope the requirement before the site visit.</h2>
          </div>

          <div className="divide-y divide-slate-200 border-y border-slate-200">
            {faqs.map((faq) => (
              <details key={faq.q} className="group bg-white open:bg-[#1A2B4C]">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-6 px-5 py-6 text-left text-sm font-black uppercase text-[#1A2B4C] marker:content-none group-open:text-white md:px-7 md:text-base">
                  {faq.q}
                  <span aria-hidden="true" className="text-2xl font-light text-orange-500 group-open:rotate-45">+</span>
                </summary>
                <p className="px-5 pb-7 text-sm font-medium leading-relaxed text-slate-500 group-open:text-slate-300 md:px-7 md:text-base">
                  {faq.a}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden bg-[#0A1120] py-24 text-white md:py-32">
        <div className="absolute inset-0 opacity-20">
          <Image src="/f-bg.jpg" alt="" fill className="object-cover" sizes="100vw" />
        </div>
        <div className="container relative z-10 mx-auto px-4 md:px-8">
          <div className="max-w-4xl">
            <span className="mb-5 block text-xs font-black uppercase tracking-[0.3em] text-orange-500">Ready to scope the work?</span>
            <h2 className="text-4xl font-black uppercase leading-[0.95] md:text-6xl">Send the instrument list. Start with the right measurement method.</h2>
            <p className="mb-10 mt-7 max-w-2xl text-base font-medium leading-relaxed text-slate-300 md:text-lg">
              Include instrument types, quantities, operating ranges, process medium, site location and preferred timing. We will review the requirement before confirming the service scope.
            </p>
            <CalibrationCta label="Send Calibration Requirements" />
          </div>
        </div>
      </section>

      <BackToTop />
      <Footer />
    </main>
  );
}
