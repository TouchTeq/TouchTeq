import { notFound } from 'next/navigation';
import { getReconcileData } from '@/lib/bank/actions';
import ReconcileClient from './ReconcileClient';

export default async function ReconcilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const data = await getReconcileData(id);
  if (!data.import) notFound();

  return (
    <ReconcileClient
      importId={id}
      statementImport={data.import}
      transactions={data.transactions}
      openInvoices={data.openInvoices}
      expenses={data.expenses}
    />
  );
}
