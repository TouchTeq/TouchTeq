'use server';

import { revalidatePath } from 'next/cache';
import { requireAuthenticatedUser } from '@/lib/auth/require-user';
import { sendTransactionalEmail } from '@/lib/brevo/client';
import { escapeHtml, getBusinessProfile as loadBusinessProfile } from '@/lib/office/outbound-email';

const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
const EXPORT_CONFIRMATION = 'EXPORT';
const ALLOWED_UPLOADS: Record<string, RegExp> = {
  logos: /^logo-\d+\.(png|jpe?g|svg|webp)$/i,
};
const ALLOWED_IMAGE_TYPES = new Set([
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/svg+xml',
  'image/webp',
]);

function normalizeString(value: unknown, maxLength = 500) {
  if (typeof value !== 'string') return '';
  return value.trim().slice(0, maxLength);
}

function normalizeOptionalEmail(value: unknown) {
  const email = normalizeString(value, 254).toLowerCase();
  if (!email) return '';
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : '';
}

function normalizeOptionalUrl(value: unknown) {
  const url = normalizeString(value, 500);
  if (!url) return '';

  try {
    const parsed = new URL(url.startsWith('http') ? url : `https://${url}`);
    return parsed.toString();
  } catch {
    return '';
  }
}

function sanitizeCredentials(value: unknown) {
  if (!Array.isArray(value)) return [];

  return value
    .slice(0, 20)
    .map((item) => {
      const entry = typeof item === 'object' && item !== null ? item as Record<string, unknown> : {};
      return {
        type: normalizeString(entry.type, 100),
        number: normalizeString(entry.number, 100),
        expiry: normalizeString(entry.expiry, 50),
      };
    })
    .filter((item) => item.type || item.number || item.expiry);
}

function sanitizeBankingDetails(value: unknown) {
  const entry = typeof value === 'object' && value !== null ? value as Record<string, unknown> : {};

  return {
    bank_name: normalizeString(entry.bank_name, 120),
    account_holder: normalizeString(entry.account_holder, 160),
    account_number: normalizeString(entry.account_number, 50),
    branch_code: normalizeString(entry.branch_code, 30),
    account_type: normalizeString(entry.account_type, 40),
    payment_instructions: normalizeString(entry.payment_instructions, 500),
  };
}

function sanitizeDocumentSettings(value: unknown) {
  const entry = typeof value === 'object' && value !== null ? value as Record<string, unknown> : {};
  const primaryColor = normalizeString(entry.primary_color, 20);
  const fontFamily = normalizeString(entry.font_family, 50);
  const rawPaymentTerms = Number(entry.invoice_payment_terms_days ?? entry.default_payment_terms_days);
  const invoicePaymentTerms = Number.isFinite(rawPaymentTerms) ? Math.max(1, Math.min(365, rawPaymentTerms)) : 30;

  const aiPreferencesEntry = typeof entry.ai_preferences === 'object' && entry.ai_preferences !== null
    ? entry.ai_preferences as Record<string, unknown>
    : {};
  const notificationPreferencesEntry = typeof entry.notification_preferences === 'object' && entry.notification_preferences !== null
    ? entry.notification_preferences as Record<string, unknown>
    : {};
  const cronSummaryEntry = typeof notificationPreferencesEntry.cron_last_summary === 'object' && notificationPreferencesEntry.cron_last_summary !== null
    ? notificationPreferencesEntry.cron_last_summary as Record<string, unknown>
    : null;

  return {
    quote_validity_days: Number.isFinite(Number(entry.quote_validity_days)) ? Math.max(1, Math.min(365, Number(entry.quote_validity_days))) : 30,
    quote_default_notes: normalizeString(entry.quote_default_notes, 2000),
    quote_terms_conditions: normalizeString(entry.quote_terms_conditions, 4000),
    invoice_payment_terms_days: invoicePaymentTerms,
    default_payment_terms_days: invoicePaymentTerms,
    always_include_vat: entry.always_include_vat !== false,
    invoice_always_include_vat: entry.invoice_always_include_vat !== false,
    quote_always_include_vat: entry.quote_always_include_vat !== false,
    invoice_default_notes: normalizeString(entry.invoice_default_notes, 2000),
    invoice_thank_you_message: normalizeString(entry.invoice_thank_you_message, 500),
    invoice_late_notice: normalizeString(entry.invoice_late_notice, 2000),
    invoice_terms_conditions: normalizeString(entry.invoice_terms_conditions, 4000),
    primary_color: /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(primaryColor) ? primaryColor : '#E8500A',
    show_csd: Boolean(entry.show_csd),
    show_website: Boolean(entry.show_website),
    font_family: fontFamily || 'Arial',
    ai_preferences: {
      require_confirmation_before_send: aiPreferencesEntry.require_confirmation_before_send !== false,
      concise_responses: aiPreferencesEntry.concise_responses !== false,
      language_preference: aiPreferencesEntry.language_preference === 'british_english' ? 'british_english' : 'south_african_english',
      hands_free_mode: aiPreferencesEntry.hands_free_mode !== false,
    },
    notification_preferences: {
      cron_job_summary_notification: notificationPreferencesEntry.cron_job_summary_notification !== false,
      daily_action_summary: notificationPreferencesEntry.daily_action_summary !== false,
      cron_last_summary: cronSummaryEntry
        ? {
            ran_at: normalizeString(cronSummaryEntry.ran_at, 80),
            reminders_sent: Number(cronSummaryEntry.reminders_sent) || 0,
            invoices_marked_overdue: Number(cronSummaryEntry.invoices_marked_overdue) || 0,
            quotes_expired: Number(cronSummaryEntry.quotes_expired) || 0,
          }
        : null,
    },
    // Document Numbering
    invoice_prefix: normalizeString(entry.invoice_prefix ?? 'INV', 20),
    invoice_starting_number: Number.isFinite(Number(entry.invoice_starting_number)) ? Math.max(1, Number(entry.invoice_starting_number)) : 1,
    invoice_include_year: Boolean(entry.invoice_include_year),
    
    quote_prefix: normalizeString(entry.quote_prefix ?? 'QT', 20),
    quote_starting_number: Number.isFinite(Number(entry.quote_starting_number)) ? Math.max(1, Number(entry.quote_starting_number)) : 1,
    quote_include_year: Boolean(entry.quote_include_year),
    
    credit_note_prefix: normalizeString(entry.credit_note_prefix ?? 'CN', 20),
    credit_note_starting_number: Number.isFinite(Number(entry.credit_note_starting_number)) ? Math.max(1, Number(entry.credit_note_starting_number)) : 1,
    credit_note_include_year: entry.credit_note_include_year !== undefined ? Boolean(entry.credit_note_include_year) : true,
    
    po_prefix: normalizeString(entry.po_prefix ?? 'PO', 20),
    po_starting_number: Number.isFinite(Number(entry.po_starting_number)) ? Math.max(1, Number(entry.po_starting_number)) : 1,
    po_include_year: entry.po_include_year !== undefined ? Boolean(entry.po_include_year) : true,
    
    cert_prefix: normalizeString(entry.cert_prefix ?? 'CERT', 20),
    cert_starting_number: Number.isFinite(Number(entry.cert_starting_number)) ? Math.max(1, Number(entry.cert_starting_number)) : 1,
    cert_include_year: entry.cert_include_year !== undefined ? Boolean(entry.cert_include_year) : true,

    invoice_template_url: normalizeOptionalUrl(entry.invoice_template_url),
    invoice_template_name: normalizeString(entry.invoice_template_name, 260),
    invoice_template_updated_at: normalizeString(entry.invoice_template_updated_at, 80),
    quote_template_url: normalizeOptionalUrl(entry.quote_template_url),
    quote_template_name: normalizeString(entry.quote_template_name, 260),
    quote_template_updated_at: normalizeString(entry.quote_template_updated_at, 80),
  };
}

function sanitizeEmailSettings(value: unknown) {
  const entry = typeof value === 'object' && value !== null ? value as Record<string, unknown> : {};

  return {
    sender_name: normalizeString(entry.sender_name, 160),
    reply_to: normalizeOptionalEmail(entry.reply_to),
    personal_email_signature: normalizeString(entry.personal_email_signature, 2000),
    accounts_email_signature: normalizeString(entry.accounts_email_signature, 2000),
  };
}

function sanitizeEmailTemplates(value: unknown) {
  const entry = typeof value === 'object' && value !== null ? value as Record<string, unknown> : {};
  const keys = ['quote', 'invoice', 'reminder_1', 'reminder_2', 'final_notice'];

  return keys.reduce<Record<string, { subject: string; body: string }>>((acc, key) => {
    const template = typeof entry[key] === 'object' && entry[key] !== null
      ? entry[key] as Record<string, unknown>
      : {};

    acc[key] = {
      subject: normalizeString(template.subject, 300),
      body: normalizeString(template.body, 5000),
    };

    return acc;
  }, {});
}

function sanitizeBusinessProfileUpdates(updates: any) {
  const sanitized: Record<string, any> = {};

  if (typeof updates?.id === 'string' && updates.id.trim()) {
    sanitized.id = updates.id.trim();
  }

  if ('trading_name' in updates) sanitized.trading_name = normalizeString(updates.trading_name, 160);
  if ('physical_address' in updates) sanitized.physical_address = normalizeString(updates.physical_address, 1000);
  if ('postal_address' in updates) sanitized.postal_address = normalizeString(updates.postal_address, 1000);
  if ('email' in updates) sanitized.email = normalizeOptionalEmail(updates.email);
  if ('accounts_email' in updates) sanitized.accounts_email = normalizeOptionalEmail(updates.accounts_email) || 'accounts@touchteq.co.za';
  if ('phone' in updates) sanitized.phone = normalizeString(updates.phone, 50);
  if ('website' in updates) sanitized.website = normalizeOptionalUrl(updates.website);
  if ('logo_url' in updates) sanitized.logo_url = normalizeOptionalUrl(updates.logo_url);
  if ('credentials' in updates) sanitized.credentials = sanitizeCredentials(updates.credentials);
  if ('banking_details' in updates) sanitized.banking_details = sanitizeBankingDetails(updates.banking_details);
  
  if ('document_settings' in updates) {
    sanitized.document_settings = sanitizeDocumentSettings(updates.document_settings);
  }
  
  if ('email_settings' in updates) sanitized.email_settings = sanitizeEmailSettings(updates.email_settings);
  if ('email_templates' in updates) sanitized.email_templates = sanitizeEmailTemplates(updates.email_templates);

  return sanitized;
}

export async function getBusinessProfile() {
  const { supabase } = await requireAuthenticatedUser();
  return loadBusinessProfile(supabase);
}

export async function getDocumentCounts() {
  const { supabase } = await requireAuthenticatedUser();
  
  const [invoices, quotes, creditNotes, purchaseOrders, certificates] = await Promise.all([
    supabase.from('invoices').select('id', { count: 'exact', head: true }),
    supabase.from('quotes').select('id', { count: 'exact', head: true }),
    supabase.from('credit_notes').select('id', { count: 'exact', head: true }),
    supabase.from('purchase_orders').select('id', { count: 'exact', head: true }),
    supabase.from('certificates').select('id', { count: 'exact', head: true }),
  ]);

  return {
    invoices: invoices.count || 0,
    quotes: quotes.count || 0,
    credit_notes: creditNotes.count || 0,
    purchase_orders: purchaseOrders.count || 0,
    certificates: certificates.count || 0,
  };
}

export async function updateBusinessProfile(updates: any) {
  const { supabase } = await requireAuthenticatedUser();
  const sanitized = sanitizeBusinessProfileUpdates(updates || {});
  const { id, ...updatePayload } = sanitized;

  if (Object.keys(updatePayload).length === 0) {
    return { success: false, error: 'No valid fields provided for update.' };
  }

  const profile = id
    ? { id }
    : await loadBusinessProfile(supabase);

  if (!profile?.id) {
    return { success: false, error: 'Business profile not found.' };
  }

  const { error } = await supabase
    .from('business_profile')
    .update(updatePayload)
    .eq('id', profile.id);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath('/office/settings');
  revalidatePath('/office/dashboard');
  revalidatePath('/office/invoices');
  revalidatePath('/office/invoices/new');
  revalidatePath('/office/quotes');
  revalidatePath('/office/quotes/new');
  revalidatePath('/office/purchase-orders');
  revalidatePath('/office/purchase-orders/new');
  return { success: true };
}

export async function uploadFile(file: FormData, bucket: string, path: string) {
  const { supabase } = await requireAuthenticatedUser();
  const fileObj = file.get('file');

  if (!(fileObj instanceof File)) {
    return { success: false, error: 'No file was provided.' };
  }

  if (!ALLOWED_UPLOADS[bucket] || !ALLOWED_UPLOADS[bucket].test(path)) {
    return { success: false, error: 'This upload destination is not allowed.' };
  }

  if (!ALLOWED_IMAGE_TYPES.has(fileObj.type)) {
    return { success: false, error: 'Only PNG, JPG, SVG, and WebP uploads are allowed.' };
  }

  if (fileObj.size > MAX_UPLOAD_BYTES) {
    return { success: false, error: 'The file is too large. Maximum size is 5MB.' };
  }

  const { error } = await supabase.storage
    .from(bucket)
    .upload(path, fileObj, {
      upsert: true,
      contentType: fileObj.type,
    });

  if (error) {
    return { success: false, error: error.message };
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from(bucket).getPublicUrl(path);

  return { success: true, url: publicUrl };
}

export async function sendTestEmail(to: string, template: any) {
  const { supabase } = await requireAuthenticatedUser();
  const profile = await loadBusinessProfile(supabase);
  const recipientEmail = normalizeOptionalEmail(to);

  if (!recipientEmail) {
    return { success: false, error: 'Enter a valid email address for the test message.' };
  }

  if (!process.env.BREVO_API_KEY) {
    return { success: false, error: 'Brevo is not configured on this environment.' };
  }

  const subject = normalizeString(template?.subject, 300) || 'TouchTeq Test Email';
  const body = normalizeString(template?.body, 5000) || 'This is a test email from TouchTeq Office.';
  const senderName = profile?.email_settings?.sender_name || profile?.trading_name || 'Touch Teqniques';
  const senderEmail = profile?.email_settings?.reply_to || profile?.email || (process.env.SALES_EMAIL || 'sales@touchteq.co.za');

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; color: #334155; line-height: 1.7; max-width: 680px; margin: 0 auto;">
      <p style="font-size: 12px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; color: #94a3b8;">Template Test</p>
      <h1 style="margin-top: 0; color: #0f172a;">${escapeHtml(subject)}</h1>
      <div style="font-size: 14px;">
        ${escapeHtml(body).replace(/\n/g, '<br />')}
      </div>
    </div>
  `;

  const result = await sendTransactionalEmail({
    to: [{ email: recipientEmail, name: 'Test Recipient' }],
    sender: {
      name: senderName,
      email: senderEmail,
    },
    subject,
    htmlContent,
  });

  if (!result.success) {
    return { success: false, error: result.error || 'Test email delivery failed.' };
  }

  return { success: true, message: 'Test email sent successfully.' };
}

export async function uploadDocumentTemplate(formData: FormData, templateType: 'invoice' | 'quote') {
  const { supabase } = await requireAuthenticatedUser();
  const fileObj = formData.get('file');

  if (!(fileObj instanceof File)) {
    return { success: false, error: 'No file was provided.' };
  }

  const allowedTypes = new Set([
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/msword',
  ]);
  if (!allowedTypes.has(fileObj.type) && !fileObj.name.toLowerCase().endsWith('.docx')) {
    return { success: false, error: 'Only .docx files are allowed.' };
  }

  if (fileObj.size > 10 * 1024 * 1024) {
    return { success: false, error: 'File too large. Maximum size is 10MB.' };
  }

  const storagePath = `${templateType}-template.docx`;
  const { error: uploadError } = await supabase.storage
    .from('templates')
    .upload(storagePath, fileObj, {
      upsert: true,
      contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    });

  if (uploadError) {
    return { success: false, error: uploadError.message };
  }

  const { data: { publicUrl } } = supabase.storage.from('templates').getPublicUrl(storagePath);

  // Persist template metadata in document_settings
  const profile = await loadBusinessProfile(supabase);
  if (profile?.id) {
    const existing = typeof profile.document_settings === 'object' ? profile.document_settings : {};
    await supabase
      .from('business_profile')
      .update({
        document_settings: {
          ...existing,
          [`${templateType}_template_url`]: publicUrl,
          [`${templateType}_template_name`]: fileObj.name,
          [`${templateType}_template_updated_at`]: new Date().toISOString(),
        },
      })
      .eq('id', profile.id);
  }

  revalidatePath('/office/settings');
  return { success: true, url: publicUrl, filename: fileObj.name };
}

export async function exportAllData(confirmationText?: string) {
  const { supabase } = await requireAuthenticatedUser();

  if (confirmationText !== EXPORT_CONFIRMATION) {
    return { success: false, error: `Type ${EXPORT_CONFIRMATION} to confirm export.` };
  }

  const [clientsRes, quotesRes, invoicesRes, paymentsRes, expensesRes] = await Promise.all([
    supabase.from('clients').select('*'),
    supabase.from('quotes').select('*'),
    supabase.from('invoices').select('*'),
    supabase.from('payments').select('*'),
    supabase.from('expenses').select('*'),
  ]);

  const firstError = [clientsRes, quotesRes, invoicesRes, paymentsRes, expensesRes]
    .map((result) => result.error)
    .find(Boolean);

  if (firstError) {
    return { success: false, error: firstError.message };
  }

  return {
    success: true,
    data: {
      clients: clientsRes.data || [],
      quotes: quotesRes.data || [],
      invoices: invoicesRes.data || [],
      payments: paymentsRes.data || [],
      expenses: expensesRes.data || [],
      exportedAt: new Date().toISOString(),
    },
  };
}
