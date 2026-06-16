import { getTaxDashboard } from '@/lib/tax/actions';
import TaxClient from './TaxClient';

export default async function TaxPage() {
  const res = await getTaxDashboard();
  if ('error' in res) {
    return (
      <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6 text-red-400">
        Failed to load tax data: {res.error}
      </div>
    );
  }
  return <TaxClient data={res.data} />;
}
