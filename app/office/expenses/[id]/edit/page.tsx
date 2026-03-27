import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import ExpenseForm from '../../new/ExpenseForm';

export default async function EditExpensePage({ params }: { params: Promise<{ id: string }> }) {
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

  return (
    <div className="py-8">
      <ExpenseForm initialData={expense} />
    </div>
  );
}
