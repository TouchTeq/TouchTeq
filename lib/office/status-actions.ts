'use server';

import { revalidatePath } from 'next/cache';
import { requireAuthenticatedUser } from '@/lib/auth/require-user';
import { syncInvoiceStatusesWithClient, syncQuoteStatusesWithClient } from '@/lib/office/maintenance';

export async function syncInvoiceStatuses() {
  const { supabase } = await requireAuthenticatedUser();
  await syncInvoiceStatusesWithClient(supabase);

  revalidatePath('/office/invoices');
  revalidatePath('/office/dashboard');
  revalidatePath('/office/reminders');
}

export async function syncQuoteStatuses() {
  const { supabase } = await requireAuthenticatedUser();
  await syncQuoteStatusesWithClient(supabase);

  revalidatePath('/office/quotes');
  revalidatePath('/office/dashboard');
}
