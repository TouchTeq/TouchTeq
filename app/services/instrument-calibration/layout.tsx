import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Industrial Instrument Calibration Services | Touch Teqniques Engineering',
  description:
    'Pressure, temperature and flow calibration support for industrial facilities, including ultrasonic flow measurement for suitable clean-liquid and slurry applications.',
  keywords: [
    'industrial instrument calibration',
    'pressure calibration',
    'temperature calibration',
    'flow meter calibration',
    'ultrasonic flow measurement',
    'on-site calibration South Africa',
  ],
  openGraph: {
    title: 'Industrial Instrument Calibration | Touch Teqniques Engineering',
    description:
      'Scope-led pressure, temperature and flow calibration support for industrial operations across Southern Africa.',
    images: ['/plant-field-panel-system-integration.jpeg'],
  },
};

export default function InstrumentCalibrationLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
