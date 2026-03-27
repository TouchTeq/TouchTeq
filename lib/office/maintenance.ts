import { differenceInDays, parseISO, addDays, addWeeks, addMonths, addYears, format } from 'date-fns';
import { pickPreferredRecipient } from '@/lib/clients/contactPreference';
import { getBusinessProfile, sendReminderEmail } from '@/lib/office/outbound-email';

type OfficeSupabaseClient = Awaited<ReturnType<typeof import('@/lib/supabase/server').createClient>> | ReturnType<typeof import('@/lib/supabase/admin').createAdminClient>;

function todayIsoDate() {
  return new Date().toISOString().split('T')[0];
}

export async function syncInvoiceStatusesWithClient(supabase: OfficeSupabaseClient) {
  const today = todayIsoDate();

  const { count, error: countError } = await supabase
    .from('invoices')
    .select('*', { count: 'exact', head: true })
    .in('status', ['Sent', 'Partially Paid'])
    .lt('due_date', today);

  if (countError) {
    throw countError;
  }

  const { error } = await supabase
    .from('invoices')
    .update({ status: 'Overdue' })
    .in('status', ['Sent', 'Partially Paid'])
    .lt('due_date', today);

  if (error) {
    throw error;
  }

  return count || 0;
}

export async function syncQuoteStatusesWithClient(supabase: OfficeSupabaseClient) {
  const today = todayIsoDate();

  const { count, error: countError } = await supabase
    .from('quotes')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'Sent')
    .lt('expiry_date', today);

  if (countError) {
    throw countError;
  }

  const { error } = await supabase
    .from('quotes')
    .update({ status: 'Expired' })
    .eq('status', 'Sent')
    .lt('expiry_date', today);

  if (error) {
    throw error;
  }

  return count || 0;
}

export async function processReminderSequence(
  supabase: OfficeSupabaseClient,
  body: { invoiceId?: string; manual?: boolean; message?: string } = {}
) {
  const { invoiceId, manual, message } = body;
  const profile = await getBusinessProfile(supabase as Awaited<ReturnType<typeof import('@/lib/supabase/server').createClient>>);

  let query = supabase
    .from('invoices')
    .select(`
      *,
      clients (*)
    `)
    .eq('status', 'Overdue');

  if (invoiceId) {
    query = query.eq('id', invoiceId);
  }

  const { data: invoicesToProcess, error: invoiceError } = await query;
  if (invoiceError) {
    throw invoiceError;
  }

  if (!invoicesToProcess || invoicesToProcess.length === 0) {
    return [];
  }

  const results: Array<{ invoice: string; type: string; status: 'Sent' | 'Failed' }> = [];

  for (const invoice of invoicesToProcess) {
    const { data: contacts } = await supabase
      .from('client_contacts')
      .select('contact_type, full_name, email, is_primary')
      .eq('client_id', invoice.client_id);

    const preference = pickPreferredRecipient(contacts || [], 'invoice');
    const recipientEmail = preference.email || invoice.clients?.email || null;
    const recipientName =
      preference.name || invoice.clients?.contact_person || invoice.clients?.company_name || null;

    const { data: logs } = await supabase
      .from('reminder_logs')
      .select('*')
      .eq('invoice_id', invoice.id)
      .order('sent_at', { ascending: true });

    const sentReminders = logs || [];
    const firstReminder = sentReminders.find(
      (log) => log.reminder_type === '1st Reminder' && log.status === 'Sent'
    );
    const secondReminder = sentReminders.find(
      (log) => log.reminder_type === '2nd Reminder' && log.status === 'Sent'
    );
    const finalReminder = sentReminders.find(
      (log) => log.reminder_type === 'Final Notice' && log.status === 'Sent'
    );

    let nextReminderType: 'Manual Reminder' | '1st Reminder' | '2nd Reminder' | 'Final Notice' | null = null;
    let shouldSend = false;

    const today = new Date();
    const dueDate = parseISO(invoice.due_date);
    const daysOverdue = differenceInDays(today, dueDate);

    if (manual) {
      nextReminderType = 'Manual Reminder';
      shouldSend = true;
    } else if (!firstReminder) {
      nextReminderType = '1st Reminder';
      shouldSend = true;
    } else if (!secondReminder) {
      const daysSinceFirst = differenceInDays(today, new Date(firstReminder.sent_at));
      if (daysSinceFirst >= 7) {
        nextReminderType = '2nd Reminder';
        shouldSend = true;
      }
    } else if (!finalReminder) {
      const daysSinceSecond = differenceInDays(today, new Date(secondReminder.sent_at));
      if (daysSinceSecond >= 14) {
        nextReminderType = 'Final Notice';
        shouldSend = true;
      }
    }

    if (!shouldSend || !nextReminderType) {
      continue;
    }

    const sendResult = recipientEmail
      ? await sendReminderEmail({
          supabase: supabase as Awaited<ReturnType<typeof import('@/lib/supabase/server').createClient>>,
          invoice,
          type: nextReminderType,
          daysOverdue,
          recipient: { email: recipientEmail, name: recipientName },
          customMessage: message,
          profile,
        })
      : { success: false, error: 'No recipient email found for this client' };

    await supabase.from('reminder_logs').insert([
      {
        invoice_id: invoice.id,
        reminder_type: nextReminderType,
        recipient_email: recipientEmail,
        status: sendResult.success ? 'Sent' : 'Failed',
        error_message: sendResult.success ? null : (sendResult.error || 'Unknown error'),
        days_overdue: daysOverdue,
        sent_at: new Date().toISOString(),
      },
    ]);

    results.push({
      invoice: invoice.invoice_number,
      type: nextReminderType,
      status: sendResult.success ? 'Sent' : 'Failed',
    });
  }

  return results;
}

export async function processRecurringInvoices(supabase: OfficeSupabaseClient) {
  const today = new Date().toISOString().split('T')[0];
  const results: any[] = [];

  // Find recurring invoices due today
  const { data: dueInvoices } = await supabase
    .from('invoices')
    .select('*, clients(*)')
    .eq('is_recurring', true)
    .lte('recurring_next_date', today)
    .eq('status', 'Paid');

  if (!dueInvoices || dueInvoices.length === 0) {
    return { processed: 0, results: [] };
  }

  for (const parentInvoice of dueInvoices) {
    // Check if recurring has ended
    if (parentInvoice.recurring_end_date && parentInvoice.recurring_end_date < today) {
      continue;
    }

    // Get line items from parent
    const { data: lineItems } = await supabase
      .from('invoice_line_items')
      .select('*')
      .eq('invoice_id', parentInvoice.id);

    // Generate new invoice number
    const { data: lastInvoice } = await supabase
      .from('invoices')
      .select('invoice_number')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    let newNum = 1;
    if (lastInvoice?.invoice_number) {
      const match = lastInvoice.invoice_number.match(/INV-(\d+)/);
      if (match) newNum = parseInt(match[1]) + 1;
    }
    const newInvoiceNumber = `INV-${String(newNum).padStart(4, '0')}`;

    // Calculate new dates
    let newIssueDate = new Date(today);
    let newDueDate: Date;
    
    switch (parentInvoice.recurring_frequency) {
      case 'weekly':
        newDueDate = addWeeks(newIssueDate, 1);
        break;
      case 'monthly':
        newDueDate = addMonths(newIssueDate, 1);
        break;
      case 'quarterly':
        newDueDate = addMonths(newIssueDate, 3);
        break;
      case 'annually':
        newDueDate = addYears(newIssueDate, 1);
        break;
      default:
        newDueDate = addMonths(newIssueDate, 1);
    }

    // Create new invoice
    const { data: newInvoice, error: createError } = await supabase
      .from('invoices')
      .insert({
        client_id: parentInvoice.client_id,
        invoice_number: newInvoiceNumber,
        issue_date: format(newIssueDate, 'yyyy-MM-dd'),
        due_date: format(newDueDate, 'yyyy-MM-dd'),
        subtotal: parentInvoice.subtotal,
        vat_amount: parentInvoice.vat_amount,
        total: parentInvoice.total,
        notes: parentInvoice.notes,
        internal_notes: parentInvoice.internal_notes,
        status: parentInvoice.recurring_auto_send ? 'Sent' : 'Draft',
        amount_paid: 0,
        is_recurring: false,
        recurring_parent_id: parentInvoice.id,
      })
      .select()
      .single();

    if (createError || !newInvoice) {
      console.error('Error creating recurring invoice:', createError);
      continue;
    }

    // Insert line items
    if (lineItems && lineItems.length > 0) {
      const newItems = lineItems.map((item: any) => ({
        invoice_id: newInvoice.id,
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unit_price,
      }));

      await supabase.from('invoice_line_items').insert(newItems);
    }

    // Update parent's next date
    let nextDate: Date;
    switch (parentInvoice.recurring_frequency) {
      case 'weekly':
        nextDate = addWeeks(parseISO(parentInvoice.recurring_next_date), 1);
        break;
      case 'monthly':
        nextDate = addMonths(parseISO(parentInvoice.recurring_next_date), 1);
        break;
      case 'quarterly':
        nextDate = addMonths(parseISO(parentInvoice.recurring_next_date), 3);
        break;
      case 'annually':
        nextDate = addYears(parseISO(parentInvoice.recurring_next_date), 1);
        break;
      default:
        nextDate = addMonths(parseISO(parentInvoice.recurring_next_date), 1);
    }

    await supabase
      .from('invoices')
      .update({ recurring_next_date: format(nextDate, 'yyyy-MM-dd') })
      .eq('id', parentInvoice.id);

    // Create notification
    await supabase.from('invoice_notifications').insert({
      invoice_id: newInvoice.id,
      type: 'recurring_generated',
      title: 'Recurring Invoice Generated',
      message: `Recurring invoice ${newInvoiceNumber} generated for ${parentInvoice.clients?.company_name || 'N/A'} — R ${newInvoice.total?.toFixed(2)}. ${parentInvoice.recurring_auto_send ? 'Auto-sent.' : 'Created as draft.'}`,
      read: false,
    });

    results.push({
      parentInvoiceId: parentInvoice.id,
      newInvoiceId: newInvoice.id,
      invoiceNumber: newInvoiceNumber,
      client: parentInvoice.clients?.company_name,
      amount: newInvoice.total,
      autoSend: parentInvoice.recurring_auto_send,
    });
  }

  return { processed: results.length, results };
}

export async function runOfficeSequences(supabase: OfficeSupabaseClient) {
  const invoicesMarkedOverdue = await syncInvoiceStatusesWithClient(supabase);
  const quotesExpired = await syncQuoteStatusesWithClient(supabase);
  const reminderResults = await processReminderSequence(supabase);
  const remindersSent = reminderResults.filter((result) => result.status === 'Sent').length;
  const recurringResults = await processRecurringInvoices(supabase);

  return {
    invoiceStatusesSynced: true,
    quoteStatusesSynced: true,
    reminderResults,
    remindersSent,
    invoicesMarkedOverdue,
    quotesExpired,
    recurringInvoicesProcessed: recurringResults.processed,
    recurringResults: recurringResults.results,
  };
}
