import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import QuoteDetailClient from './QuoteDetailClient';

export default async function QuoteDetailPage({ params }: { params: Promise<{ id: string }> }) {
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

  // Fetch Line Items
  const { data: lineItems } = await supabase
    .from('quote_line_items')
    .select('*')
    .eq('quote_id', id)
    .order('created_at', { ascending: true });

  // Fetch Business Profile
  const { data: businessProfile } = await supabase
    .from('business_profile')
    .select('*')
    .single();

  return (
    <div className="pb-20">
      <QuoteDetailClient 
         quote={quote} 
         lineItems={lineItems || []} 
         businessProfile={businessProfile} 
      />
    </div>
  );
}
