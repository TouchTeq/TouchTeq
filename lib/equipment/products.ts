/**
 * Equipment catalogue data for GDSCorp gas detection products.
 *
 * Source: GDSCorp product data sheets referenced on
 * engineeringteqniques.co.za/blog. Specs are summarised from the
 * manufacturer documentation for selection and reference purposes.
 * Always confirm against the latest official data sheet before specifying.
 */

export type ProductCategorySlug =
  | 'wireless-gas-detectors'
  | 'fixed-gas-detectors'
  | 'open-path-detectors'
  | 'alarm-controllers'
  | 'wireless-accessories';

export interface ProductCategory {
  slug: ProductCategorySlug;
  name: string;
  shortName: string;
  description: string;
  icon: 'radio' | 'gauge' | 'beam' | 'bell' | 'cable';
}

export interface ProductSpec {
  label: string;
  value: string;
}

export interface Product {
  slug: string;
  model: string;
  name: string;
  category: ProductCategorySlug;
  image: string;
  tagline: string;
  summary: string;
  features: string[];
  specs: ProductSpec[];
  applications: string[];
  whySpecify: string;
  datasheetUrl?: string;
  industries: string[];
}

export const categories: ProductCategory[] = [
  {
    slug: 'wireless-gas-detectors',
    name: 'Wireless Gas Detectors',
    shortName: 'Wireless Detectors',
    description:
      'Battery-powered and line-powered wireless gas monitors that detect toxic, combustible, and VOC hazards and report readings back to a central controller over GDSCorp wireless networks.',
    icon: 'radio',
  },
  {
    slug: 'fixed-gas-detectors',
    name: 'Fixed Gas Detectors',
    shortName: 'Fixed Detectors',
    description:
      'Permanently installed point gas monitors using electrochemical, infrared, catalytic bead, and PID sensor technologies. Cover toxic, combustible, VOC, and oxygen depletion hazards with 4-20mA and MODBUS outputs for wired plant integration.',
    icon: 'gauge',
  },
  {
    slug: 'open-path-detectors',
    name: 'Open Path Gas Detectors',
    shortName: 'Open Path',
    description:
      'Line-of-sight open path gas detectors using UV and infrared spectroscopy to monitor hydrocarbon, hydrogen sulphide, and ammonia gas clouds over long distances, up to 200 metres between transmitter and receiver.',
    icon: 'beam',
  },
  {
    slug: 'alarm-controllers',
    name: 'System Alarm Controllers',
    shortName: 'Controllers',
    description:
      'Wireless alarm stations and data interfaces that aggregate detector readings, drive local alarm relays, and feed live data into PLCs, DCS platforms, and SCADA systems.',
    icon: 'bell',
  },
  {
    slug: 'wireless-accessories',
    name: 'Wireless System Accessories',
    shortName: 'Accessories',
    description:
      'Explosion-proof wireless transmitters that bridge legacy analog sensors and switch inputs into a GDSCorp wireless network, extending coverage without new cabling.',
    icon: 'cable',
  },
];

export const products: Product[] = [
  /* ==================== WIRELESS GAS DETECTORS ==================== */
  {
    slug: 'gasmax-cs',
    model: 'GASMAX CS',
    name: 'GASMAX CS Wireless Battery-Powered Gas Monitor',
    category: 'wireless-gas-detectors',
    image: '/equipment/gasmax-cs.png',
    tagline:
      'Single-channel compact wireless gas monitor with battery power and tool-free calibration.',
    summary:
      'The GASMAX CS is a single-channel compact wireless gas monitor that supports a wide range of sensors for toxic gases or volatile organic compounds (VOCs). Battery powered for fast installation in any location, it features push-buttons and magnetic switches for setup and calibration without opening the enclosure.',
    features: [
      'Single-channel wireless gas monitoring',
      'Supports toxic and VOC sensor types',
      'Battery powered for cable-free installation',
      'Push-button and magnetic-switch calibration',
      'No enclosure opening required for routine setup',
    ],
    specs: [
      { label: 'Channels', value: 'Single-channel' },
      { label: 'Sensor Support', value: 'Toxic gases, VOCs' },
      { label: 'Power', value: 'Battery powered' },
      { label: 'Calibration', value: 'Push-button and magnetic switches' },
      { label: 'Enclosure Access', value: 'Not required for setup' },
      { label: 'Network', value: 'GDSCorp wireless' },
    ],
    applications: [
      'Remote or hard-to-cable monitoring points where running conduit is impractical',
      'Temporary monitoring during plant turnarounds or commissioning phases',
      'Perimeter fencing of storage areas for toxic or VOC release detection',
      'Supplementary coverage added to an existing wired detection system without civil works',
    ],
    whySpecify:
      'We specify the GASMAX CS where a client needs gas coverage in a location that would otherwise require expensive trenching or cable runs. The battery power and magnetic-switch calibration mean the unit can be installed and maintained quickly, which matters on large sites where technician time is the bottleneck. Because it sits on the GDSCorp wireless network, readings flow back to the same controller and SCADA layer as your wired detectors. One system, one alarm philosophy.',
    datasheetUrl:
      'https://www.gdscorp.com/site/wp-content/uploads/2022/06/GMCS_02-2.pdf',
    industries: [
      'Chemical & Petrochemical Plants',
      'Water & Wastewater Treatment',
      'Oil & Gas Refineries',
      'Mining & Minerals Processing',
    ],
  },
  {
    slug: 'gasmax-qsm-rf',
    model: 'GASMAX QSM-RF',
    name: 'GASMAX QSM-RF Four-Channel Wireless Gas Monitor',
    category: 'wireless-gas-detectors',
    image: '/equipment/gasmax-qsm-rf.png',
    tagline:
      'Quad-channel wireless gas monitor with adaptive reporting and up to six months of battery backup.',
    summary:
      'The GASMAX QSM-RF is a quad-channel wireless gas monitor supporting up to four local or remote sensors for hazardous toxic, combustible, or volatile organic compound (VOC) gases. An adaptive reporting strategy transmits once per minute under normal conditions and accelerates to once every five seconds when gas levels rise, preserving battery life while delivering fast response when it matters.',
    features: [
      'Four-channel monitoring with local or remote sensors',
      'Toxic, combustible, and VOC gas detection',
      'Battery backup up to six months (EC and low-power IR sensors)',
      'AC line power option for permanent installations',
      'Adaptive reporting: 1-minute baseline, 5-second alarm rate',
      'Adjustable background gas setpoint per sensor',
    ],
    specs: [
      { label: 'Channels', value: 'Up to 4 (local or remote)' },
      { label: 'Sensor Support', value: 'Toxic, combustible, VOC' },
      { label: 'Power', value: 'AC line or battery backup' },
      { label: 'Battery Life', value: 'Up to 6 months (EC / low-power IR)' },
      { label: 'Normal Reporting', value: 'Once per minute' },
      { label: 'Alarm Reporting', value: 'Once every 5 seconds' },
      { label: 'Background Gas Setpoint', value: 'Adjustable per sensor' },
      { label: 'Interface', value: 'Push-buttons and magnetic switches' },
    ],
    applications: [
      'Multi-point monitoring of water and wastewater treatment plants where hydrogen sulphide and methane are present',
      'Chemical plant process areas requiring several gas types at one location',
      'Oxygen depletion monitoring in enclosed or confined spaces',
      'Sites with a constant low-level background gas that need per-sensor thresholds to avoid nuisance alarms',
    ],
    whySpecify:
      'The QSM-RF is our go-to when a single mounting point needs to cover more than one gas. For example, a wastewater facility where H2S, methane, and oxygen depletion all need watching. The adaptive reporting is the differentiator: clients get long battery life during quiet periods but five-second updates the moment gas rises, which is the response time that actually matters for safety. The per-sensor background gas setpoint lets us tune each installation to the site instead of fighting nuisance alarms from a known ambient level.',
    datasheetUrl:
      'https://www.gdscorp.com/site/wp-content/uploads/2022/06/GDS-QSM-RF_02.pdf',
    industries: [
      'Water & Wastewater Treatment',
      'Chemical & Petrochemical Plants',
      'Oil & Gas Refineries',
      'Pharmaceutical Manufacturing',
    ],
  },

  /* ==================== FIXED GAS DETECTORS ==================== */
  {
    slug: 'gasmax-bx',
    model: 'GASMAX BX',
    name: 'GASMAX BX Gas Monitor with Intelligent Sensors',
    category: 'fixed-gas-detectors',
    image: '/equipment/gasmax-bx.png',
    tagline:
      'Dual-channel gas monitor with full colour TFT display, intelligent self-testing sensors, and CSA Class I Division 1 certification.',
    summary:
      'The GASMAX BX delivers advanced features for the most critical gas detection applications. Designed for safety monitoring and leak detection in hazardous areas, it includes dual 4-20mA analog outputs, optional isolated 5A alarm relays, and a serial MODBUS interface. Built-in dual channel electronics support almost any combination of GDS Corp Intelligent Sensors or industry-standard 4-20mA analog devices. Intelligent Sensors contain internal microprocessors that perform self-tests, monitor hours-in-service, store calibration values, and remind the user when calibration is due.',
    features: [
      'Dual 4-20mA analog outputs',
      'Optional 3x isolated 5A alarm relays',
      'Serial MODBUS interface',
      'Intelligent Sensors with self-test and calibration tracking',
      'Full colour TFT backlit display',
      'Magnetic switches for non-intrusive operation',
      'CSA certified for Class I Division 1 hazardous areas',
    ],
    specs: [
      { label: 'Outputs', value: 'Dual 4-20mA, MODBUS RS-485' },
      { label: 'Alarm Relays', value: 'Optional 3x isolated 5A SPDT' },
      { label: 'Display', value: 'Full colour TFT backlit' },
      { label: 'Sensor Types', value: 'Intelligent Sensors, 4-20mA analog' },
      { label: 'Calibration', value: 'Magnetic switches (no enclosure opening)' },
      { label: 'Certification', value: 'CSA Class I Division 1' },
      { label: 'Warranty', value: 'Two years' },
    ],
    applications: [
      'Critical safety monitoring in refineries and chemical plants where sensor self-diagnostics are required',
      'Hazardous area leak detection needing both visual alarm display and relay outputs',
      'Plants that want proactive calibration reminders to stay audit-ready',
      'Facilities upgrading from basic monitors to intelligent, self-reporting detection',
    ],
    whySpecify:
      'The GASMAX BX is the monitor we reach for when a client wants the most advanced diagnostics available. The Intelligent Sensors track their own calibration intervals and hours in service, which makes maintenance planning far easier on a large site with dozens of detectors. The full colour display with flashing alarm screens is also a genuine safety feature -REPLACED- operators can identify alarm state at a glance without reading text.',
    datasheetUrl:
      'https://www.gdscorp.com/site/wp-content/uploads/2023/04/GDSCorp_GasMaxBX_DataSheet.pdf',
    industries: [
      'Oil & Gas Refineries',
      'Chemical & Petrochemical Plants',
      'Mining & Minerals Processing',
      'Manufacturing & Heavy Industry',
    ],
  },
  {
    slug: 'gasmax-gx',
    model: 'GASMAX GX',
    name: 'GASMAX GX Wired Gas Monitor',
    category: 'fixed-gas-detectors',
    image: '/equipment/gasmax-gx.png',
    tagline:
      'Versatile wired gas monitor with electrochemical, PID, infrared, or catalytic bead sensors plus MODBUS daisy-chain wiring.',
    summary:
      'The GASMAX GX is an ideal solution for fixed ambient gas detection applications. It supports both local and remote electrochemical, PID, infrared, or catalytic bead sensors and operates on +12 to +35 VDC with an industry-standard 4-20mA output. Optional RS-485 MODBUS with daisy-chain wiring allows multiple monitors to share a single bus up to 500 metres, minimising installation cost. An optional 900 MHz or 2.4 GHz radio lets it communicate with GDS Corp wireless controllers.',
    features: [
      'Supports electrochemical, PID, infrared, and catalytic bead sensors',
      '4-20mA analog output standard',
      'Optional RS-485 MODBUS with daisy-chain up to 500m',
      'Optional alarm relays and radio module',
      '+12 to +35 VDC operation',
      'Modbus wiring junction box option available',
    ],
    specs: [
      { label: 'Sensor Types', value: 'Electrochemical, PID, IR, catalytic bead' },
      { label: 'Output', value: '4-20mA analog' },
      { label: 'Serial', value: 'Optional RS-485 MODBUS' },
      { label: 'Daisy-Chain', value: 'Up to 500m on MODBUS' },
      { label: 'Alarm Relays', value: 'Optional 2x SPDT' },
      { label: 'Power', value: '+12 to +35 VDC' },
      { label: 'Radio Option', value: '900 MHz or 2.4 GHz' },
    ],
    applications: [
      'Multi-point wired detection systems where MODBUS daisy-chaining reduces cable cost',
      'Refineries and chemical plants requiring multiple sensor technologies at different locations',
      'Facilities with an existing wired infrastructure that may add wireless later',
      'Ambient gas monitoring across compressor stations and pipeline facilities',
    ],
    whySpecify:
      'The GASMAX GX is our workhorse for wired installations because of the MODBUS daisy-chain. Instead of running a home-run cable from every detector back to the control room, we can chain multiple GX monitors on a single RS-485 bus up to 500 metres. That cuts cable, conduit, and labour cost significantly on a greenfield site. The option to add a radio later also future-proofs the investment if the client wants to migrate to wireless.',
    datasheetUrl:
      'https://www.gdscorp.com/site/wp-content/uploads/2022/06/GMGX_02.pdf',
    industries: [
      'Oil & Gas Refineries',
      'Chemical & Petrochemical Plants',
      'Power Generation Facilities',
      'Manufacturing & Heavy Industry',
    ],
  },
  {
    slug: 'gasmax-dsx',
    model: 'GASMAX DSX',
    name: 'GASMAX DSX Dual-Channel Gas Monitor',
    category: 'fixed-gas-detectors',
    image: '/equipment/gasmax-dsx.png',
    tagline:
      'Explosion-proof dual-channel monitor with local and remote sensors, strobe, and buzzer for hazardous areas.',
    summary:
      'The GASMAX DSX is a dual-channel gas monitor for fixed ambient gas detection where multiple sensors are required. It supports both local and remote electrochemical and infrared combustible sensors, with several electrochemical sensors available in low, medium, and high ranges. Non-intrusive magnetic switches allow complete configuration and calibration in the field without compromising the explosion-proof rating.',
    features: [
      'Dual-channel monitoring (local or remote sensors)',
      'Electrochemical sensors in low, medium, and high ranges',
      'Infrared combustible sensor support',
      'Explosion-proof enclosure with magnetic-switch operation',
      'Integrated strobe and dual-tone buzzer',
      '+18 to +32 VDC operation with 4-20mA output',
    ],
    specs: [
      { label: 'Channels', value: 'Dual-channel' },
      { label: 'Sensor Types', value: 'Electrochemical, IR combustible' },
      { label: 'Sensor Ranges', value: 'Low, medium, high (EC)' },
      { label: 'Output', value: '4-20mA analog' },
      { label: 'Enclosure', value: 'Explosion-proof' },
      { label: 'Calibration', value: 'Magnetic switches (non-intrusive)' },
      { label: 'Power', value: '+18 to +32 VDC' },
      { label: 'Alarms', value: 'Strobe + dual-tone buzzer' },
    ],
    applications: [
      'Process areas where two different gas hazards need monitoring from one enclosure',
      'Hazardous areas requiring explosion-proof certification with integrated audible/visual alarms',
      'Refineries and chemical plants needing electrochemical sensors across multiple ranges',
      'Fixed detection points where field calibration must not require opening the enclosure',
    ],
    whySpecify:
      'We specify the GASMAX DSX when a client needs two sensors at one location in a hazardous area -REPLACED- for example H2S and combustible gas at a wellhead. The built-in strobe and buzzer mean we do not need to install separate alarm signaling, which simplifies the wiring and the documentation. The non-intrusive magnetic switches are essential for maintenance inside a classified area where opening an enclosure requires a gas-free certificate.',
    datasheetUrl:
      'https://www.gdscorp.com/site/wp-content/uploads/2022/06/GMDSX_02.pdf',
    industries: [
      'Oil & Gas Refineries',
      'Chemical & Petrochemical Plants',
      'Mining & Minerals Processing',
      'Manufacturing & Heavy Industry',
    ],
  },
  {
    slug: 'gasmax-dsm',
    model: 'GASMAX DSM',
    name: 'GASMAX DSM Dual-Channel Wired Gas Monitor',
    category: 'fixed-gas-detectors',
    image: '/equipment/gasmax-dsm.png',
    tagline:
      'Dual-channel monitor with independent sensor outputs, programmable alarm setpoints, strobe, and buzzer.',
    summary:
      'The GASMAX DSM dual-channel gas monitor supports two local or remote sensors for hazardous toxic or combustible gases or a wide range of dangerous VOCs. Each sensor assembly has independent fault, analog 4-20mA, and digital RS-485 outputs with two user-programmable alarm setpoints and front-panel LED indicators. The unit ships with a standard top-mounted strobe and bottom-mounted dual-tone buzzer.',
    features: [
      'Dual-channel with local or remote sensors (up to 50 ft)',
      'Independent 4-20mA and RS-485 outputs per channel',
      'Two programmable alarm setpoints per channel',
      'Front-panel LED alarm indicators',
      'Top-mounted strobe (red, amber, blue, or tri-colour)',
      'Bottom-mounted dual-tone buzzer',
    ],
    specs: [
      { label: 'Channels', value: 'Dual-channel' },
      { label: 'Sensor Mounting', value: 'Local or remote (up to 50 ft)' },
      { label: 'Outputs per Channel', value: '4-20mA, RS-485, fault' },
      { label: 'Alarm Setpoints', value: '2 per channel (programmable)' },
      { label: 'Strobe Options', value: 'Red, amber, blue, tri-colour' },
      { label: 'Audible', value: 'Dual-tone buzzer' },
      { label: 'Remote Power', value: '+24 VDC external' },
    ],
    applications: [
      'Two-sensor monitoring stations where each channel needs independent outputs to separate control systems',
      'Process areas with both toxic and combustible gas hazards',
      'VOC monitoring in chemical and pharmaceutical facilities',
      'Locations requiring visual and audible alarms integrated into the detector housing',
    ],
    whySpecify:
      'The DSM gives us independent per-channel outputs, which matters when the toxic gas reading needs to go to one controller and the combustible reading to another. The integrated strobe and buzzer combination means the unit is self-contained for local alarming, reducing the number of separate devices we need to mount and wire on site.',
    datasheetUrl:
      'https://www.gdscorp.com/site/wp-content/uploads/2022/06/GDS-DSM_02.pdf',
    industries: [
      'Chemical & Petrochemical Plants',
      'Pharmaceutical Manufacturing',
      'Oil & Gas Refineries',
      'Water & Wastewater Treatment',
    ],
  },
  {
    slug: 'gasmax-qsm',
    model: 'GASMAX QSM',
    name: 'GASMAX QSM Four-Channel Wired Gas Monitor',
    category: 'fixed-gas-detectors',
    image: '/equipment/gasmax-qsm.png',
    tagline:
      'Quad-channel wired monitor with four independent sensor assemblies, per-channel outputs, strobe, and buzzer.',
    summary:
      'The GASMAX QSM is a quad-channel gas monitor supporting up to four local or remote sensors for hazardous toxic or combustible gases or VOCs. Each of the four sensor assemblies has independent fault, 4-20mA, and RS-485 outputs with two programmable alarm setpoints and front-panel LED indicators. Ships with top-mounted strobe and bottom-mounted dual-tone buzzer.',
    features: [
      'Four-channel monitoring (local or remote, up to 50 ft)',
      'Independent outputs per channel (4-20mA, RS-485, fault)',
      'Two programmable alarm setpoints per channel',
      'Front-panel LED alarm indicators',
      'Top-mounted strobe and bottom-mounted buzzer',
      'Remote sensor kit option with cable',
    ],
    specs: [
      { label: 'Channels', value: 'Quad (4)' },
      { label: 'Sensor Mounting', value: 'Local or remote (up to 50 ft)' },
      { label: 'Outputs per Channel', value: '4-20mA, RS-485, fault' },
      { label: 'Alarm Setpoints', value: '2 per channel' },
      { label: 'Strobe', value: 'Red, amber, blue, or tri-colour' },
      { label: 'Audible', value: 'Dual-tone buzzer' },
      { label: 'Remote Power', value: '+24 VDC external' },
    ],
    applications: [
      'Central monitoring point covering four separate gas detection zones',
      'Compressor stations monitoring multiple gas types from one enclosure',
      'Chemical process areas where four hazard points are within 50 feet of a common mounting',
      'Facilities wanting to consolidate multiple single-channel monitors into one unit',
    ],
    whySpecify:
      'The QSM is the wired equivalent of the QSM-RF, and we use it where the installation is cabled rather than wireless. Having four independent channels with individual outputs in one enclosure reduces panel space, conduit runs, and installation labour. The per-channel LED indicators mean an operator walking past can immediately see which sensor is in alarm.',
    datasheetUrl:
      'https://www.gdscorp.com/site/wp-content/uploads/2022/06/GDS-QSM_02.pdf',
    industries: [
      'Oil & Gas Refineries',
      'Chemical & Petrochemical Plants',
      'Manufacturing & Heavy Industry',
      'Power Generation Facilities',
    ],
  },
  {
    slug: 'gasmax-ssm',
    model: 'GASMAX SSM',
    name: 'GASMAX SSM Single-Channel Gas Monitor',
    category: 'fixed-gas-detectors',
    image: '/equipment/gasmax-ssm.png',
    tagline:
      'Single-channel monitor with dedicated fault output, strobe, buzzer, and splashguard for toxic gas and VOC detection.',
    summary:
      'The GASMAX SSM single-channel gas monitor supports a single local or remote sensor for hazardous toxic gases or VOCs. Sensors can be mounted up to 100 feet away. The monitor provides a dedicated fault output, analog 4-20mA, and RS-485 serial output with two programmable alarm setpoints and front-panel LED indicators. Includes a standard top-mounted strobe, bottom-mounted buzzer, and sensor splashguard.',
    features: [
      'Single-channel monitoring (local or remote up to 100 ft)',
      'Dedicated fault output',
      '4-20mA analog and RS-485 serial outputs',
      'Two programmable alarm setpoints with LED indicators',
      'Integrated strobe and dual-tone buzzer',
      'Standard sensor splashguard included',
    ],
    specs: [
      { label: 'Channels', value: 'Single' },
      { label: 'Sensor Mounting', value: 'Local or remote (up to 100 ft)' },
      { label: 'Outputs', value: '4-20mA, RS-485, fault' },
      { label: 'Alarm Setpoints', value: '2 (programmable)' },
      { label: 'Strobe', value: 'Red, amber, blue, or tri-colour' },
      { label: 'Audible', value: 'Dual-tone buzzer' },
      { label: 'Accessories', value: 'Splashguard included' },
    ],
    applications: [
      'Single-point toxic gas monitoring in pump rooms and valve stations',
      'Remote sensor mounting where the detector head must be up to 100 ft from the monitor',
      'Areas subject to washdown where the splashguard protects the sensor',
      'Cost-effective single-hazard detection with integrated alarms',
    ],
    whySpecify:
      'The SSM is our choice for a single-hazard point that needs local alarms without a separate panel. The 100-foot remote sensor capability is particularly useful -REPLACED- we can mount the display at eye level for operators while placing the sensor at the hazard source, which is often at floor level or inside a pit. The included splashguard means we can deploy it in washdown areas without an additional accessory.',
    datasheetUrl:
      'https://www.gdscorp.com/site/wp-content/uploads/2022/06/GDS-SSM_02.pdf',
    industries: [
      'Chemical & Petrochemical Plants',
      'Water & Wastewater Treatment',
      'Mining & Minerals Processing',
      'Manufacturing & Heavy Industry',
    ],
  },
  {
    slug: 'gasmax-lx',
    model: 'GASMAX LX',
    name: 'GASMAX LX Loop-Powered Gas Monitor',
    category: 'fixed-gas-detectors',
    image: '/equipment/gasmax-lx.png',
    tagline:
      'Two-wire loop-powered monitor for oxygen depletion and toxic gases, certified for hazardous area use.',
    summary:
      'The GASMAX LX is a two-wire loop-powered gas monitor for oxygen depletion and toxic gases including hydrogen, hydrogen sulphide, carbon monoxide, sulphur dioxide, fluorine, chlorine, and more. The output is an industry-standard 4-20mA loop signal usable by all GDS Corp controllers and industry-standard PLCs, DCSs, and other control devices. Certified with certain non-reactive-gas sensors for use in hazardous areas.',
    features: [
      'Two-wire loop-powered (4-20mA)',
      'Oxygen depletion and toxic gas detection',
      'Supports O2, CO, Cl2, F2, H2, HF, H2S, SO2 sensors',
      'Fast and easy sensor replacement',
      'Hazardous area certified (non-reactive gas sensors)',
      'Compatible with all GDS Corp controllers and standard PLCs',
    ],
    specs: [
      { label: 'Power', value: 'Two-wire loop-powered' },
      { label: 'Output', value: '4-20mA loop signal' },
      { label: 'Sensor Types', value: 'O2, CO, Cl2, F2, H2, HF, H2S, SO2' },
      { label: 'Wiring', value: 'Two-wire' },
      { label: 'Hazardous Area', value: 'Certified (non-reactive sensors)' },
      { label: 'Sensor Replacement', value: 'Fast and easy' },
    ],
    applications: [
      'Oxygen depletion monitoring in enclosed or confined spaces',
      'Toxic gas detection in power plants, refineries, and tank farms',
      'Compressor stations and pipeline facilities needing loop-powered simplicity',
      'Installations where minimal wiring is essential: two wires carry both power and signal',
    ],
    whySpecify:
      'The GASMAX LX is the simplest wired monitor to install because it needs only two wires: power and signal on the same pair. That halves the cable cost compared to a separately powered monitor. We use it extensively for oxygen depletion and common toxic gases where the client has a standard PLC or DCS already accepting 4-20mA inputs. The hazardous area certification with non-reactive sensors means it is viable inside a Zone 1 or Zone 2 without additional protection.',
    datasheetUrl:
      'https://www.gdscorp.com/site/wp-content/uploads/2022/06/GMLX_02.pdf',
    industries: [
      'Power Generation Facilities',
      'Oil & Gas Refineries',
      'Chemical & Petrochemical Plants',
      'Manufacturing & Heavy Industry',
    ],
  },
  {
    slug: 'gasmax-ns',
    model: 'GASMAX NS',
    name: 'GASMAX NS Single-Channel Compact Wired Gas Monitor',
    category: 'fixed-gas-detectors',
    image: '/equipment/gasmax-ns.png',
    tagline:
      'Non-hazardous area compact monitor with DC or optional AC power and magnetic-switch calibration.',
    summary:
      'The GASMAX NS single-channel gas monitor is designed for non-hazardous areas and supports a wide range of sensors for toxic or volatile organic compounds (VOCs). DC powered with optional AC supply for easy installation, it uses magnetic switches for fast setup that does not require opening the enclosure.',
    features: [
      'Designed for non-hazardous (general purpose) areas',
      'Single-channel toxic and VOC monitoring',
      'DC powered with optional AC supply',
      'Magnetic-switch calibration without enclosure opening',
      'Compact form factor for easy installation',
    ],
    specs: [
      { label: 'Area Classification', value: 'Non-hazardous (general purpose)' },
      { label: 'Channels', value: 'Single' },
      { label: 'Sensor Support', value: 'Toxic gases, VOCs' },
      { label: 'Power', value: 'DC (optional AC)' },
      { label: 'Calibration', value: 'Magnetic switches' },
    ],
    applications: [
      'Indoor air quality monitoring in plant control rooms and workshops',
      'Battery rooms where hydrogen off-gassing requires monitoring in a non-classified area',
      'Water treatment facilities needing toxic gas detection in general purpose zones',
      'Cost-effective monitoring points that do not require explosion-proof certification',
    ],
    whySpecify:
      'Not every monitoring point on a site is in a hazardous area. The GASMAX NS lets us cover the general-purpose zones -REPLACED- control rooms, workshops, battery rooms -REPLACED- without paying for explosion-proof certification that is not needed. The magnetic-switch calibration is the same interface as the hazardous area models, so maintenance technicians only need to learn one workflow.',
    datasheetUrl:
      'https://www.gdscorp.com/site/wp-content/uploads/2020/01/GDS-IR-brochure.pdf',
    industries: [
      'Water & Wastewater Treatment',
      'Manufacturing & Heavy Industry',
      'Pharmaceutical Manufacturing',
      'Power Generation Facilities',
    ],
  },
  {
    slug: 'gds-ir2',
    model: 'GDS-IR2',
    name: 'GDS-IR2 Infrared Gas Sensor for Hydrocarbons and CO2',
    category: 'fixed-gas-detectors',
    image: '/equipment/gds-ir2.png',
    tagline:
      'Infrared gas sensor with five-year warranty, CSA Class I Division 1 certification, and SIL-2 suitability.',
    summary:
      'The GDS-IR2 infrared gas sensor uses proven infrared sensing technology to detect dangerous levels of carbon dioxide or explosive levels of methane, propane, and other hydrocarbons. Designed for harsh environments, it is virtually maintenance-free and immune to poisoning or etching by any known gas. CSA certified for Class I Division 1 explosive environments and suitable for use in SIL-2 safety systems.',
    features: [
      'Infrared sensing -REPLACED- immune to catalyst poisoning',
      'Detects CO2 and a wide range of hydrocarbons',
      'CSA certified for Class I Division 1',
      'SIL-2 safety system suitable',
      'Five-year operational warranty',
      'Manufactured in the USA',
    ],
    specs: [
      { label: 'Technology', value: 'Infrared (IR)' },
      { label: 'Target Gases', value: 'CO2, methane, propane, hexane, pentane, ethanol, Jet-A, more' },
      { label: 'Certification', value: 'CSA Class I Division 1' },
      { label: 'SIL Rating', value: 'SIL-2 suitable' },
      { label: 'Warranty', value: 'Five years' },
      { label: 'Poisoning Immunity', value: 'Immune to all known gases' },
    ],
    applications: [
      'Refineries and offshore drilling platforms where catalyst poisoning is a known failure mode',
      'Fuel loading docks and biogas processing facilities',
      'Breweries and wastewater treatment requiring CO2 monitoring',
      'Natural gas storage and distribution facilities',
    ],
    whySpecify:
      'We specify the GDS-IR2 wherever a catalytic bead sensor would be vulnerable to poisoning from silicones, sulphur compounds, or lead -REPLACED- all common in industrial environments. The infrared technology is immune to these contaminants, which means fewer sensor replacements and more reliable long-term operation. The five-year warranty and SIL-2 suitability make it the right choice for safety-instrumented functions where proof testing intervals matter.',
    datasheetUrl:
      'https://www.gdscorp.com/site/wp-content/uploads/2022/04/GDSIR2_6_002.pdf',
    industries: [
      'Oil & Gas Refineries',
      'Chemical & Petrochemical Plants',
      'Water & Wastewater Treatment',
      'Manufacturing & Heavy Industry',
    ],
  },
  {
    slug: 'gds-ir',
    model: 'GDS-IR',
    name: 'GDS-IR High Performance Infrared Gas Sensor',
    category: 'fixed-gas-detectors',
    image: '/equipment/gds-ir.png',
    tagline:
      'Proven infrared sensor for hydrocarbons and CO2 with five-year warranty and CSA Class I Division 1 certification.',
    summary:
      'The GDS-IR infrared gas sensor uses proven infrared sensing technology to detect dangerous levels of carbon dioxide or explosive levels of methane, propane, and other hydrocarbons. Designed for harsh environments, it is virtually maintenance-free and immune to poisoning or etching by any known gas. CSA certified for Class I Division 1 explosive environments and suitable for SIL-2 safety systems.',
    features: [
      'Infrared sensing technology',
      'Detects CO2 to 5% by volume and combustible hydrocarbons',
      'Calibratable for methane, propane, hexane, pentane, ethanol, Jet-A, more',
      'CSA certified for Class I Division 1',
      'SIL-2 safety system suitable',
      'Five-year operational warranty',
    ],
    specs: [
      { label: 'Technology', value: 'Infrared (IR)' },
      { label: 'CO2 Range', value: 'Up to 5% by volume' },
      { label: 'Hydrocarbons', value: 'Methane, propane, hexane, pentane, ethanol, Jet-A, more' },
      { label: 'Certification', value: 'CSA Class I Division 1' },
      { label: 'SIL Rating', value: 'SIL-2 suitable' },
      { label: 'Warranty', value: 'Five years' },
    ],
    applications: [
      'Fixed hydrocarbon detection where catalyst poisoning has caused false negatives',
      'Biogas and brewery CO2 monitoring',
      'Onshore and offshore drilling platform gas detection',
      'Natural gas storage, distribution, and compressor stations',
    ],
    whySpecify:
      'The GDS-IR is the earlier generation of the GDS-IR2 and remains a proven, reliable choice for infrared gas detection. We use it where the application calls for proven technology with a long track record. The poisoning immunity is the key advantage over catalytic bead sensors -REPLACED- in environments with silicones or heavy metals, an IR sensor will keep reading accurately where a catalytic sensor would drift or fail silently.',
    datasheetUrl:
      'https://www.gdscorp.com/site/wp-content/uploads/2020/01/GDS-IR-brochure.pdf',
    industries: [
      'Oil & Gas Refineries',
      'Chemical & Petrochemical Plants',
      'Water & Wastewater Treatment',
      'Manufacturing & Heavy Industry',
    ],
  },

  /* ==================== OPEN PATH GAS DETECTORS ==================== */
  {
    slug: 'quasar-900',
    model: 'QUASAR 900',
    name: 'SafEye Quasar 900 Open Path Gas Detector for Hydrocarbons',
    category: 'open-path-detectors',
    image: '/equipment/quasar-900.png',
    tagline:
      'Open path hydrocarbon gas detector using DOAS spectroscopy over line-of-sight up to 660 metres.',
    summary:
      'The Spectrex SafEye Quasar 900 is an open path detection system providing continuous monitoring for combustible hydrocarbon gases. It employs spectral fingerprint analysis of the atmosphere using Differential Optical Absorption Spectroscopy (DOAS). The system consists of a Xenon Flash infrared transmitter and receiver separated over a line of sight from 7 m to 200 m in normal conditions, up to 660 m in extremely harsh environments. Housed in rugged stainless steel with ATEX and IECEx approval.',
    features: [
      'DOAS spectral fingerprint analysis for hydrocarbon detection',
      'Line-of-sight range from 7 m to 660 m',
      'Xenon Flash infrared transmitter and receiver',
      'ATEX and IECEx approved enclosure',
      'Rugged stainless steel housing',
      'Performs in dust, fog, rain, snow, and vibration',
    ],
    specs: [
      { label: 'Technology', value: 'DOAS (Differential Optical Absorption Spectroscopy)' },
      { label: 'Target Gas', value: 'Combustible hydrocarbons' },
      { label: 'Range (normal)', value: '7 m to 200 m' },
      { label: 'Range (harsh)', value: 'Up to 660 m' },
      { label: 'Light Source', value: 'Xenon Flash infrared' },
      { label: 'Enclosure', value: 'Stainless steel, EExd flameproof' },
      { label: 'Certification', value: 'ATEX, IECEx' },
    ],
    applications: [
      'Perimeter monitoring of hydrocarbon vapour clouds along fence lines',
      'Loading terminals and jetty areas where point detection would require too many units',
      'Tank farms and storage areas covering wide open spaces between potential leak sources',
      'Process areas where a gas cloud could form anywhere along a long line of pipework',
    ],
    whySpecify:
      'Open path detection is fundamentally different from point detection. Instead of waiting for gas to reach a specific sensor, the Quasar 900 monitors the entire volume of air between the transmitter and receiver. We specify it for perimeter and area-wide coverage where installing enough point detectors to cover the same space would be impractical. The DOAS technology is also highly resistant to false alarms from non-target gases because it reads the actual spectral fingerprint of hydrocarbons.',
    datasheetUrl:
      'https://www.gdscorp.com/site/wp-content/uploads/2022/04/product-data-sheet-safeye-quasar-900-en-us-7027724.pdf',
    industries: [
      'Oil & Gas Refineries',
      'Chemical & Petrochemical Plants',
      'Manufacturing & Heavy Industry',
      'Power Generation Facilities',
    ],
  },
  {
    slug: 'spectrex-950',
    model: 'Spectrex 950',
    name: 'SafEye Quasar 950 Open Path Gas Detector for H2S',
    category: 'open-path-detectors',
    image: '/equipment/spectrex-950.png',
    tagline:
      'UV open path detector for toxic hydrogen sulphide at low concentrations, up to 200 ft range, sub-10 second response.',
    summary:
      'The SafEye Quasar 950 uses ultraviolet technology to continuously monitor for toxic hydrogen sulphide (H2S) gas at very low concentrations, up to 95 percent obscuration. It covers wide areas with long range detection up to 60 m and high speed response in under 10 seconds. Solar blind and immune to industrial environments, so it stays reliable in real plant conditions.',
    features: [
      'UV technology for toxic H2S detection at very low concentrations',
      'Up to 95 percent obscuration tolerance',
      'Detection range up to 60 m (200 ft)',
      'Response time under 10 seconds',
      'Solar blind, immune to sunlight interference',
      'Immune to industrial environmental interference',
    ],
    specs: [
      { label: 'Technology', value: 'Ultraviolet (UV)' },
      { label: 'Target Gas', value: 'Hydrogen sulphide (H2S)' },
      { label: 'Range', value: 'Up to 60 m (200 ft)' },
      { label: 'Response Time', value: 'Under 10 seconds' },
      { label: 'Obscuration Tolerance', value: 'Up to 95%' },
      { label: 'Solar Immunity', value: 'Solar blind' },
    ],
    applications: [
      'H2S perimeter monitoring around sour gas processing facilities',
      'Wide area H2S coverage in oil fields and refinery boundaries',
      'Loading and unloading zones where H2S release could occur at any point',
      'Pipeline compressor stations handling sour gas streams',
    ],
    whySpecify:
      'H2S is lethal at very low concentrations, and point detectors only cover a small radius. The Quasar 950 lets us monitor an entire line of sight for H2S, which means a release anywhere along the beam path is detected, not just at one spot. The solar-blind UV technology is critical for outdoor installations because it will not false-alarm from sunlight the way a broadband detector would.',
    datasheetUrl:
      'https://www.gdscorp.com/site/wp-content/uploads/2022/04/product-data-sheet-safeye-quasar-950-en-us-7027754.pdf',
    industries: [
      'Oil & Gas Refineries',
      'Mining & Minerals Processing',
      'Chemical & Petrochemical Plants',
      'Manufacturing & Heavy Industry',
    ],
  },
  {
    slug: 'spectrex-960',
    model: 'Spectrex 960',
    name: 'SafEye Quasar 960 Open Path Gas Detector for Ammonia',
    category: 'open-path-detectors',
    image: '/equipment/spectrex-960.png',
    tagline:
      'UV open path detector for toxic ammonia (NH3) at low concentrations, up to 200 ft range, sub-10 second response.',
    summary:
      'The SafEye Quasar 960 uses ultraviolet technology to continuously monitor for toxic ammonia (NH3) gas at very low concentrations, up to 95 percent obscuration. It covers wide areas with long range detection up to 60 m and high speed response in under 10 seconds. Solar blind and immune to industrial environments, so it stays reliable in real plant conditions.',
    features: [
      'UV technology for toxic ammonia (NH3) detection at very low concentrations',
      'Up to 95 percent obscuration tolerance',
      'Detection range up to 60 m (200 ft)',
      'Response time under 10 seconds',
      'Solar blind, immune to sunlight interference',
      'Immune to industrial environmental interference',
    ],
    specs: [
      { label: 'Technology', value: 'Ultraviolet (UV)' },
      { label: 'Target Gas', value: 'Ammonia (NH3)' },
      { label: 'Range', value: 'Up to 60 m (200 ft)' },
      { label: 'Response Time', value: 'Under 10 seconds' },
      { label: 'Obscuration Tolerance', value: 'Up to 95%' },
      { label: 'Solar Immunity', value: 'Solar blind' },
    ],
    applications: [
      'Ammonia refrigeration plant perimeter monitoring',
      'Fertiliser production facilities handling large volumes of ammonia',
      'Cold storage facilities using ammonia as a refrigerant',
      'Chemical plants where ammonia is a feedstock or by-product',
    ],
    whySpecify:
      'Ammonia is both toxic and difficult to contain -REPLACED- it disperses rapidly and can form dangerous clouds. The Quasar 960 gives us line-of-sight coverage across an entire ammonia storage or process area, which is far more practical than trying to place enough point detectors to cover the same volume. The solar-blind UV technology means it works reliably outdoors without false alarms from sunlight.',
    datasheetUrl:
      'https://www.gdscorp.com/site/wp-content/uploads/2022/04/product-data-sheet-safeye-quasar-960-en-us-7027748.pdf',
    industries: [
      'Chemical & Petrochemical Plants',
      'Manufacturing & Heavy Industry',
      'Pharmaceutical Manufacturing',
      'Mining & Minerals Processing',
    ],
  },

  /* ==================== ALARM CONTROLLERS ==================== */
  {
    slug: 'gds-75n',
    model: 'GDS-75N',
    name: 'GDS-75N Wireless Alarm Station for General Purpose Areas',
    category: 'alarm-controllers',
    image: '/equipment/gds-75n.png',
    tagline:
      'Wireless alarm station that receives up to 32 detector channels and drives three independent alarm relay levels.',
    summary:
      'The GDS-75N wireless alarm monitor receives radio signals from up to 32 GDSCorp wireless gas monitors and activates local alarm relays based on the wireless detector readings. Three independent user-programmable alarm levels per channel drive three dry-contact relays for external horns, strobes, and plant shutdown interfaces. The unit operates from +12VDC to +35VDC, making it compatible with low-cost 12V solar power systems.',
    features: [
      'Receives signals from up to 32 wireless gas monitors',
      'Three independent programmable alarm levels per channel',
      'Three dry-contact alarm relays for horns and strobes',
      '52 unique networks on 900 MHz, 76 on 2.4 GHz',
      'Up to 255 addresses per network',
      'Wide power range: +12VDC to +35VDC (solar compatible)',
    ],
    specs: [
      { label: 'Input Channels', value: 'Up to 32 wireless monitors' },
      { label: 'Alarm Levels', value: '3 per channel (programmable)' },
      { label: 'Alarm Relays', value: '3 dry contact' },
      { label: '900 MHz Networks', value: '52 unique' },
      { label: '2.4 GHz Networks', value: '76 unique' },
      { label: 'Addresses per Network', value: 'Up to 255' },
      { label: 'Power Supply', value: '+12VDC to +35VDC' },
      { label: 'Solar Compatible', value: 'Yes (use low-voltage cutoff)' },
    ],
    applications: [
      'Central alarm panel for a wireless detection field in a general-purpose area',
      'Solar-powered remote sites where mains power is unavailable',
      'Plants that need local audible and visual alarms driven by remote detector readings',
      'Staged alarm strategies where different gas levels trigger different responses',
    ],
    whySpecify:
      'We use the GDS-75N as the local alarm aggregation point on wireless installations. The three-level alarm programming lets us build a graded response (advisory, high, and critical) that maps directly onto the client\'s cause-and-effect matrix. The wide DC input range is a real advantage on remote mining and pipeline sites where we can pair the unit with a solar supply and avoid a mains installation entirely.',
    datasheetUrl:
      'https://www.gdscorp.com/site/wp-content/uploads/2022/04/GDS75N_01.pdf',
    industries: [
      'Mining & Minerals Processing',
      'Oil & Gas Refineries',
      'Power Generation Facilities',
      'Chemical & Petrochemical Plants',
    ],
  },
  {
    slug: 'gds-98rf',
    model: 'GDS-98RF',
    name: 'GDS-98RF Wireless Data Interface',
    category: 'alarm-controllers',
    image: '/equipment/gds-98rf.png',
    tagline:
      'Wireless network gateway monitoring up to 255 devices with MODBUS, Ethernet, and analog outputs.',
    summary:
      'The GDS-98RF Wireless Data Interface monitors up to 255 wireless network device transmissions, stores the latest values, and responds in real-time to data requests from DCSs, PLCs, or other MODBUS masters. Data is available via three-wire RS-232, two-wire RS-485, or 4-20mA analog outputs. A built-in Ethernet-to-Website interface and USB Virtual COM PORT allow remote users to view readings and alarm status through a standard web browser.',
    features: [
      'Monitors up to 255 wireless network devices',
      'MODBUS compatible for DCS and PLC integration',
      'RS-232 (3-wire), RS-485 (2-wire), and 4-20mA analog outputs',
      'Built-in Ethernet-to-Website interface for browser-based monitoring',
      'USB Virtual COM PORT connectivity',
      'Optional 8-channel analog output cards (up to 32 x 4-20mA)',
    ],
    specs: [
      { label: 'Device Capacity', value: 'Up to 255 wireless devices' },
      { label: 'Serial Outputs', value: 'RS-232 (3-wire), RS-485 (2-wire)' },
      { label: 'Analog Outputs', value: '4-20mA (optional cards up to 32 channels)' },
      { label: 'Protocol', value: 'MODBUS' },
      { label: 'Ethernet', value: 'Built-in web interface' },
      { label: 'USB', value: 'Virtual COM PORT' },
      { label: 'Analog Cards', value: 'Optional 8-channel (up to 4 cards)' },
    ],
    applications: [
      'Bridging a wireless detection field into an existing DCS or SCADA system via MODBUS',
      'Control room dashboards that need live detector readings and alarm status over Ethernet',
      'Plants requiring hardwired 4-20mA analog signals to legacy panels alongside wireless detectors',
      'Remote browser-based monitoring of detector health and gas levels without dedicated software',
    ],
    whySpecify:
      'The GDS-98RF is the integration backbone of a GDSCorp wireless system. We specify it whenever the detection field needs to talk to a plant DCS, a PLC, or a SCADA tag database, which is almost every industrial job. The combination of MODBUS serial and optional 4-20mA analog cards means we can feed both modern control systems and legacy panels from the same gateway, and the built-in web server gives operators a quick visual check without opening engineering software.',
    datasheetUrl:
      'https://www.gdscorp.com/site/wp-content/uploads/2022/04/GDS98RF_01-1.pdf',
    industries: [
      'Oil & Gas Refineries',
      'Chemical & Petrochemical Plants',
      'Power Generation Facilities',
      'Manufacturing & Heavy Industry',
    ],
  },

  /* ==================== WIRELESS ACCESSORIES ==================== */
  {
    slug: 'gds-59x',
    model: 'GDS-59X',
    name: 'GDS-59X Wireless Analog Signal Transmitter',
    category: 'wireless-accessories',
    image: '/equipment/gds-59x.png',
    tagline:
      'Explosion-proof wireless transmitter that bridges 4-20mA analog sensors into a GDSCorp wireless network.',
    summary:
      'The GDS-59X is an explosion-proof wireless 4-20mA signal and state transmitter that accepts industry-standard 4-20mA analog signals and broadcasts them on GDSCorp wireless networks. Scaled values up to 30,000 can be directly input to wireless controllers such as the Protector32 RFD, Protector32 RF, or Protector6 RF. Magnetic switches allow calibration, setup, and diagnostics in hazardous areas without opening the enclosure.',
    features: [
      'Explosion-proof rated enclosure',
      'Accepts industry-standard 4-20mA analog signals',
      'Scaled values up to 30,000',
      'Compatible with Protector32 RFD, Protector32 RF, Protector6 RF controllers',
      'Magnetic switches for hazardous-area calibration',
      'No enclosure opening required for setup or diagnostics',
    ],
    specs: [
      { label: 'Input', value: '4-20mA analog signal / state' },
      { label: 'Rating', value: 'Explosion-proof' },
      { label: 'Scaled Value Range', value: 'Up to 30,000' },
      { label: 'Controller Compatibility', value: 'Protector32 RFD, Protector32 RF, Protector6 RF' },
      { label: 'Configuration', value: 'Magnetic switches (no enclosure opening)' },
      { label: 'Network', value: 'GDSCorp wireless' },
    ],
    applications: [
      'Bringing existing wired 4-20mA detectors onto a new wireless network without replacing the sensors',
      'Hazardous-area locations where opening an enclosure for calibration requires a hot-work permit',
      'Extending wireless coverage to third-party analog instruments already installed on site',
      'Phased migration from a wired to a wireless architecture without a full sensor replacement',
    ],
    whySpecify:
      'The GDS-59X solves a problem we see constantly: a client has reliable analog detectors already installed and working, but wants the coverage and reporting of a wireless network. Instead of ripping out good sensors, we fit the GDS-59X and bridge them onto the GDSCorp network. The explosion-proof rating and magnetic-switch configuration mean we can commission and calibrate inside a hazardous area without a permit to open the box. That saves real time on a live plant.',
    datasheetUrl:
      'https://www.gdscorp.com/site/wp-content/uploads/2022/04/GDS59X_02.pdf',
    industries: [
      'Oil & Gas Refineries',
      'Chemical & Petrochemical Plants',
      'Mining & Minerals Processing',
      'Manufacturing & Heavy Industry',
    ],
  },
  {
    slug: 'gds-58x',
    model: 'GDS-58X',
    name: 'GDS-58X Wireless Switch State Transmitter',
    category: 'wireless-accessories',
    image: '/equipment/gds-58x.png',
    tagline:
      'Explosion-proof wireless transmitter that converts switch contacts into wireless network inputs.',
    summary:
      'The GDS-58X is an explosion-proof wireless switch state transmitter that accepts normally-open or normally-closed switch contacts and broadcasts them on GDSCorp wireless networks. Magnetic switches allow setup and diagnostics in hazardous areas without opening the enclosure. The unit allows any two switch inputs to become part of an advanced GDSCorp wireless network.',
    features: [
      'Explosion-proof rated enclosure',
      'Accepts normally-open (NO) and normally-closed (NC) contacts',
      'Two switch input channels',
      'Magnetic switches for hazardous-area setup and diagnostics',
      'No enclosure opening required for configuration',
      'Integrates switch inputs into GDSCorp wireless networks',
    ],
    specs: [
      { label: 'Input', value: '2 x switch contacts (NO / NC)' },
      { label: 'Rating', value: 'Explosion-proof' },
      { label: 'Configuration', value: 'Magnetic switches (no enclosure opening)' },
      { label: 'Network', value: 'GDSCorp wireless' },
      { label: 'Diagnostics', value: 'On-device via magnetic switches' },
    ],
    applications: [
      'Adding manual call points, flame switches, or pressure switches to a wireless alarm network',
      'Monitoring dry-contact equipment status from remote plant locations without new cabling',
      'Hazardous-area installations where switch inputs must be monitored at a central controller',
      'Emergency stop and manual activation points integrated into a plant-wide detection system',
    ],
    whySpecify:
      'We specify the GDS-58X wherever a dry-contact signal (a manual call point, a pressure switch, a deluge valve position) needs to reach the detection controller without a cable run. Like the GDS-59X, the explosion-proof enclosure and magnetic-switch configuration mean we install and configure it inside a hazardous area without hot-work permits. It is the simplest way to extend a wireless network to cover discrete switch inputs alongside gas readings.',
    datasheetUrl:
      'https://www.gdscorp.com/site/wp-content/uploads/2022/04/GDS58X_02.pdf',
    industries: [
      'Oil & Gas Refineries',
      'Chemical & Petrochemical Plants',
      'Mining & Minerals Processing',
      'Power Generation Facilities',
    ],
  },
];

/* ---------------------------- Helper functions ---------------------------- */

export function getCategory(slug: string): ProductCategory | undefined {
  return categories.find((c) => c.slug === slug);
}

export function getProductsByCategory(slug: string): Product[] {
  return products.filter((p) => p.category === slug);
}

export function getProduct(slug: string): Product | undefined {
  return products.find((p) => p.slug === slug);
}

export function getRelatedProducts(product: Product, limit = 3): Product[] {
  return products
    .filter((p) => p.slug !== product.slug)
    .sort((a, b) => {
      const aSameCat = a.category === product.category ? 0 : 1;
      const bSameCat = b.category === product.category ? 0 : 1;
      if (aSameCat !== bSameCat) return aSameCat - bSameCat;
      const aShared = a.industries.filter((i) => product.industries.includes(i)).length;
      const bShared = b.industries.filter((i) => product.industries.includes(i)).length;
      return bShared - aShared;
    })
    .slice(0, limit);
}

export function getAllProductSlugs(): string[] {
  return products.map((p) => p.slug);
}

export function getAllCategorySlugs(): string[] {
  return categories.map((c) => c.slug);
}
