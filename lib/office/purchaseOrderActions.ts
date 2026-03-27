'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function getPurchaseOrders() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('purchase_orders')
    .select(`
      *,
      purchase_order_items(*)
    `)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

export async function deletePurchaseOrder(id: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from('purchase_orders')
    .delete()
    .eq('id', id);

  if (error) throw error;
  revalidatePath('/office/purchase-orders');
  return { success: true };
}

export async function updatePurchaseOrderStatus(id: string, status: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from('purchase_orders')
    .update({ status })
    .eq('id', id);

  if (error) throw error;
  revalidatePath('/office/purchase-orders');
  return { success: true };
}

export async function getPurchaseOrderDetails(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('purchase_orders')
    .select(`
      *,
      purchase_order_items(*)
    `)
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
}
