import { notFound } from 'next/navigation';
import { getSalesOrder } from '@/lib/sales-orders/actions';
import SalesOrderDetailClient from './SalesOrderDetailClient';

export default async function SalesOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const res = await getSalesOrder(id);
  if ('error' in res || !res.data) notFound();
  return <SalesOrderDetailClient so={res.data} />;
}
