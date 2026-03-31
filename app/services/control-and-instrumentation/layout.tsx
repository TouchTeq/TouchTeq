import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Control and Instrumentation Engineering | Touch Teq',
  description: 'Specialist control and instrumentation engineering services for industrial facilities. PLC upgrades, instrument selection, loop design, and process automation across Southern Africa.',
  keywords: ['control and instrumentation', 'C&I', 'PLC programming', 'DCS', 'SCADA', 'process automation', 'instrumentation engineering', 'South Africa'],
  openGraph: {
    title: 'Control and Instrumentation Engineering | Touch Teq',
    description: 'Specialist control and instrumentation engineering services for industrial facilities across Southern Africa.',
  },
};

export default function ControlAndInstrumentationLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
