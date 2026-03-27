import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import ExpenseDetailContent from './ExpenseDetailContent';
import { getSignedUrl } from '@/lib/expenses/actions';

export default async function ExpenseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: expense, error } = await supabase
    .from('expenses')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !expense) {
    return notFound();
  }

  let signedUrl = null;
  if (expense.receipt_url) {
    signedUrl = await getSignedUrl(expense.receipt_url);
  }

  return <ExpenseDetailContent expense={expense} signedUrl={signedUrl} />;
}
