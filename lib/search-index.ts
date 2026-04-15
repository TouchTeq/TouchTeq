export type SearchCategory = 'Page' | 'Service' | 'Insight' | 'Resource';

export type SearchResult = {
  id: string;
  title: string;
  description: string;
  category: SearchCategory;
  url: string;
  keywords: string;
};

export const searchIndex: SearchResult[] = [
  // ── Pages ─────────────────────────────────────────────────────────────
  {
    id: 'home',
    title: 'Touch Teq Engineering',
    description: 'Specialist industrial engineering for fire and gas detection, control and instrumentation, and electrical engineering across Southern Africa.',
    category: 'Page',
    url: '/',
    keywords: 'home industrial engineering specialist southern africa safety hazardous areas',
  },
  {
    id: 'about',
    title: 'About Us',
    description: 'Engineer-led firm built on technical rigour, direct accountability, and completeness. ECSA registered, operating across Southern Africa.',
    category: 'Page',
    url: '/about',
    keywords: 'about us ecsa registered principles disciplines approach credentials team engineers professional indemnity regional',
  },
  {
    id: 'contact',
    title: 'Contact & Request a Consultation',
    description: 'Get in touch to discuss your fire and gas, control and instrumentation, or electrical engineering requirements.',
    category: 'Page',
    url: '/contact',
    keywords: 'contact quote consultation request get in touch call email rfq tender vendor',
  },
  {
    id: 'industries',
    title: 'Industries We Serve',
    description: 'Specialist engineering for oil and gas, chemical, mining, power generation, pharmaceutical, food and beverage, water treatment, and more.',
    category: 'Page',
    url: '/industries',
    keywords: 'industries sectors refinery chemical mining power pharmaceutical food water oil gas pipeline fuel storage',
  },
  // ── Services ──────────────────────────────────────────────────────────
  {
    id: 'service-fgd',
    title: 'Fire & Gas Detection Systems',
    description: 'Design, supply, installation, commissioning, and maintenance of fire and gas detection systems for industrial facilities.',
    category: 'Service',
    url: '/services/fire-and-gas-detection',
    keywords: 'fire gas detection flame detector h2s co toxic combustible iec 61511 sans 10089 optical infrared uv ir commissioning maintenance hazard risk',
  },
  {
    id: 'service-ci',
    title: 'Control & Instrumentation',
    description: 'Design, installation, upgrade, and maintenance of control and instrumentation systems for industrial operations.',
    category: 'Service',
    url: '/services/control-and-instrumentation',
    keywords: 'control instrumentation c&i plc scada dcs loop design pressure temperature flow level calibration shutdown alarm motor',
  },
  {
    id: 'service-elec',
    title: 'Electrical Engineering',
    description: 'Industrial electrical engineering including power distribution, motor control, hazardous area installations, earthing, and lightning protection.',
    category: 'Service',
    url: '/services/electrical-engineering',
    keywords: 'electrical engineering power distribution motor control mcc lighting earthing lightning protection hazardous area sans 10142 switchgear cable',
  },
  {
    id: 'service-hac',
    title: 'Hazardous Area Classification',
    description: 'HAC studies, zone drawings, equipment gap analysis, HAER, and compliance audits for explosive atmosphere environments.',
    category: 'Service',
    url: '/services/hazardous-area-classification',
    keywords: 'hazardous area classification hac zone 0 1 2 atex iecex sans 10108 iec 60079 explosive atmosphere dust gas zoning drawings equipment gap analysis',
  },
  {
    id: 'service-maintenance',
    title: 'Maintenance & 24/7 Support',
    description: 'Scheduled preventative maintenance and 24/7 emergency callout for fire and gas, electrical, and control systems.',
    category: 'Service',
    url: '/services/maintenance-and-support',
    keywords: 'maintenance support 24 7 emergency callout preventative calibration testing audit spare parts inspection scheduled breakdown',
  },
  // ── Insights ──────────────────────────────────────────────────────────
  {
    id: 'insight-iec61511',
    title: 'IEC 61511: What Plant Managers Need to Know',
    description: 'Understanding IEC 61511 requirements for safety instrumented systems in South African industrial facilities.',
    category: 'Insight',
    url: '/insights/iec-61511-plant-managers',
    keywords: 'iec 61511 functional safety sis safety instrumented systems plant managers south africa sil lifecycle',
  },
  {
    id: 'insight-hac-guide',
    title: 'Hazardous Area Classification in Southern Africa',
    description: 'A guide to HAC processes, applicable standards, and what plant managers need to understand.',
    category: 'Insight',
    url: '/insights/hazardous-area-classification-southern-africa',
    keywords: 'hazardous area classification southern africa sans 10108 iec 60079 zones explosive atmosphere guide',
  },
  {
    id: 'insight-false-alarms',
    title: 'Top 5 Causes of False Alarms in Flame Detectors',
    description: 'Common causes of false alarms in optical flame detectors and engineering actions to reduce nuisance trips.',
    category: 'Insight',
    url: '/insights/flame-detector-false-alarms',
    keywords: 'flame detector false alarms nuisance trips optical ir uv maintenance fire detection solar radiation vibration contamination',
  },
  {
    id: 'insight-sil-hazop',
    title: 'SIL Assessment vs HAZOP: What\'s the Difference?',
    description: 'Why SIL assessments and HAZOPs are different studies, what each produces, and why the sequence matters.',
    category: 'Insight',
    url: '/insights/sil-assessment-vs-hazop',
    keywords: 'sil assessment hazop functional safety process safety difference comparison iec 61511 risk reduction',
  },
  {
    id: 'insight-commissioning',
    title: 'What to Expect During Fire & Gas System Commissioning',
    description: 'Phases of a fire and gas commissioning: pre-commissioning, FAT, loop testing, cause and effect testing, and PSSR.',
    category: 'Insight',
    url: '/insights/fire-and-gas-system-commissioning',
    keywords: 'commissioning fire gas detection fat loop testing cause effect pssr iec 61511 handover integrated testing',
  },
  // ── Resources ─────────────────────────────────────────────────────────
  {
    id: 'downloads',
    title: 'Free Technical Resources & Downloads',
    description: 'Download checklists, reference sheets, and technical guides for fire and gas, hazardous areas, and functional safety.',
    category: 'Resource',
    url: '/downloads',
    keywords: 'downloads checklist hac audit reference guide free resources pdf fire gas engineering standards',
  },
  {
    id: 'risk-assessment',
    title: 'Free Facility Risk Assessment',
    description: 'Interactive 2-minute risk assessment that provides an instant gap analysis for your facility.',
    category: 'Resource',
    url: '/risk-assessment',
    keywords: 'risk assessment facility gap analysis free interactive checklist compliance',
  },
];

export function searchSite(query: string): SearchResult[] {
  const q = query.toLowerCase().trim();
  if (!q) return [];
  return searchIndex
    .filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        item.keywords.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q),
    )
    .slice(0, 12);
}
