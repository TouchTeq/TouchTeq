import { createClient } from '@/lib/supabase/server';
import ReportsClient from './ReportsClient';

export default async function ReportsPage() {
  const supabase = await createClient();

  return (
    <div className="py-8">
      <div className="mb-12">
        <h1 className="text-4xl font-black text-white uppercase tracking-tight">Financial Reports</h1>
        <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px] mt-2">
          Real-time business performance analytics & auditing
        </p>
      </div>
      
      <ReportsClient />
    </div>
  );
}
