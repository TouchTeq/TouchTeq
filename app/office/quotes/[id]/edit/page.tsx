import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import EditQuoteClient from './EditQuoteClient';

export default async function EditQuotePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  // Fetch Quote data
  const { data: quote, error } = await supabase
    .from('quotes')
    .select(`
      *,
      clients (*)
    `)
    .eq('id', id)
    .single();

  if (error || !quote) {
    notFound();
  }

  // Check if quote is editable
  if (!['Draft', 'Sent'].includes(quote.status)) {
    return (
      <div className="p-10 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-500 text-center">
        <h2 className="text-xl font-black uppercase tracking-widest mb-2">Edit Lock</h2>
        <p className="font-bold">This quote is marked as {quote.status} and is now read-only. You can only edit Draft or Sent quotes.</p>
        <div className="mt-6">
          <Link href="/office/quotes" className="inline-block text-white bg-slate-800 px-6 py-2 rounded-sm font-black text-xs uppercase tracking-widest hover:bg-slate-700 transition-all">Go Back to Registry</Link>
        </div>
      </div>
    );
  }

  // Fetch Line Items
  const { data: lineItems } = await supabase
    .from('quote_line_items')
    .select('*')
    .eq('quote_id', id)
    .order('created_at', { ascending: true });

  // Fetch all clients for the dropdown
  const { data: clients } = await supabase
    .from('clients')
    .select('*')
    .eq('is_active', true)
    .order('company_name');

  return (
    <div className="pb-20">
      <EditQuoteClient 
         quote={quote} 
         initialLineItems={lineItems || []} 
         clients={clients || []} 
      />
    </div>
  );
}
