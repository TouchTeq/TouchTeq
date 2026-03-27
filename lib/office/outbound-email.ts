import { sendTransactionalEmail } from '@/lib/brevo/client';
import { pickPreferredRecipient } from '@/lib/clients/contactPreference';
import { format } from 'date-fns';

export type DocumentEmailType = 'invoice' | 'quotation' | 'certificate' | 'purchase-order' | 'credit-note' | 'statement';
export type ReminderEmailType = 'Manual Reminder' | '1st Reminder' | '2nd Reminder' | 'Final Notice';

type BusinessProfile = Record<string, any> | null;
type DocumentRecord = Record<string, any>;

interface SendDocumentEmailInput {
  supabase: Awaited<ReturnType<typeof import('@/lib/supabase/server').createClient>>;
  documentType: DocumentEmailType;
  documentId?: string | null;
  documentReference?: string | null;
  recipientEmail?: string | null;
  recipientName?: string | null;
  personalMessage?: string | null;
  subjectOverride?: string | null;
  htmlBodyOverride?: string | null;
  attachmentBase64?: string | null;
}

interface SendReminderEmailInput {
  supabase: Awaited<ReturnType<typeof import('@/lib/supabase/server').createClient>>;
  invoice: Record<string, any>;
  type: ReminderEmailType;
  daysOverdue: number;
  recipient: { email: string; name: string | null };
  customMessage?: string;
  profile?: BusinessProfile;
}

const DEFAULT_PRIMARY_COLOR = '#f97316';

export function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function textToHtml(value: string) {
  return escapeHtml(value).replace(/\n/g, '<br />');
}

function toDocumentLabel(documentType: DocumentEmailType) {
  if (documentType === 'invoice') return 'Invoice';
  if (documentType === 'quotation') return 'Quotation';
  if (documentType === 'certificate') return 'Certificate';
  if (documentType === 'purchase-order') return 'Purchase Order';
  if (documentType === 'credit-note') return 'Credit Note';
  return 'Statement';
}

function getClientRecord(record: Record<string, any>) {
  if (Array.isArray(record?.clients)) {
    return record.clients[0] ?? null;
  }
  return record?.clients ?? null;
}

export async function getBusinessProfile(supabase: Awaited<ReturnType<typeof import('@/lib/supabase/server').createClient>>) {
  const { data } = await supabase.from('business_profile').select('*').single();
  return data ?? null;
}

async function resolveDocumentRecord(
  supabase: Awaited<ReturnType<typeof import('@/lib/supabase/server').createClient>>,
  documentType: DocumentEmailType,
  documentId?: string | null,
  documentReference?: string | null
): Promise<any> {
  if (documentType === 'statement') {
    const { data: client } = await supabase.from('clients').select('id, email, company_name').eq('id', documentId).single();
    if (!client) throw new Error('Client not found for statement');
    return { id: client.id, client_id: client.id, clients: client };
  }

  const tableMap: Record<string, string> = {
    'invoice': 'invoices',
    'quotation': 'quotes',
    'certificate': 'certificates',
    'purchase-order': 'purchase_orders',
    'credit-note': 'credit_notes'
  };
  
  const refColMap: Record<string, string> = {
    'invoice': 'invoice_number',
    'quotation': 'quote_number',
    'certificate': 'certificate_number',
    'purchase-order': 'po_number',
    'credit-note': 'cn_number'
  };

  const table = tableMap[documentType];
  const referenceColumn = refColMap[documentType];

  let query: any = supabase
    .from(table)
    .select(`id, ${referenceColumn}, client_id, status, clients(email, contact_person, company_name)`);

  if (documentId) {
    query = query.eq('id', documentId);
  } else if (documentReference) {
    query = query.eq(referenceColumn, documentReference);
  } else {
    throw new Error('Missing document identifier');
  }

  const { data, error } = await query.limit(1).single();
  if (error || !data) {
    throw new Error(`${toDocumentLabel(documentType)} not found`);
  }

  return data;
}

async function resolveRecipient(
  supabase: Awaited<ReturnType<typeof import('@/lib/supabase/server').createClient>>,
  documentType: DocumentEmailType,
  record: DocumentRecord,
  providedEmail?: string | null,
  providedName?: string | null
) {
  if (providedEmail) {
    return {
      email: providedEmail,
      name: providedName || 'Valued Client',
      matched: 'provided',
    };
  }

  const { data: contacts } = await supabase
    .from('client_contacts')
    .select('contact_type, full_name, email, is_primary')
    .eq('client_id', record.client_id);

  const prefTypeMap: Record<string, string> = {
    'invoice': 'invoice',
    'quotation': 'quote',
    'certificate': 'technical',
    'purchase-order': 'finance',
    'credit-note': 'invoice',
    'statement': 'invoice'
  };
  
  const preference = pickPreferredRecipient(contacts || [], prefTypeMap[documentType] as any);
  const client = getClientRecord(record);
  const email = preference.email || client?.email || null;
  const name = preference.name || client?.contact_person || client?.company_name || 'Valued Client';

  if (!email) {
    throw new Error('Missing recipient email');
  }

  return { email, name, matched: preference.matched };
}

function replaceMergeTags(value: string, replacements: Record<string, string>) {
  return Object.entries(replacements).reduce(
    (acc, [tag, replacement]) => acc.split(tag).join(replacement),
    value
  );
}

function getSender(profile: BusinessProfile, useSalesEmail?: boolean) {
  const defaultEmail = useSalesEmail
    ? (process.env.SALES_EMAIL || 'sales@touchteq.co.za')
    : (process.env.ACCOUNTS_EMAIL || 'accounts@touchteq.co.za');
  return {
    name: profile?.email_settings?.sender_name || profile?.trading_name || 'Touch Teqniques',
    email: profile?.email_settings?.reply_to || profile?.email || defaultEmail,
  };
}

function buildEmailShell(profile: BusinessProfile, subject: string, bodyHtml: string) {
  const sender = getSender(profile);
  const primaryColor = profile?.document_settings?.primary_color || DEFAULT_PRIMARY_COLOR;
  const tradingName = profile?.trading_name || 'TouchTeq';

  return `
    <div style="font-family: Arial, sans-serif; color: #334155; max-width: 680px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
      <div style="background-color: ${primaryColor}; padding: 28px 32px;">
        <h1 style="margin: 0; color: white; font-size: 24px; letter-spacing: 1px; text-transform: uppercase;">${escapeHtml(tradingName)}</h1>
      </div>
      <div style="padding: 36px 32px;">
        <h2 style="margin-top: 0; color: #0f172a; font-size: 22px;">${escapeHtml(subject)}</h2>
        <div style="font-size: 14px; line-height: 1.7; color: #334155;">
          ${bodyHtml}
        </div>
        <div style="margin-top: 32px; padding-top: 20px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #64748b;">
          <p style="margin: 0 0 8px;">Kind regards,<br /><strong>${escapeHtml(sender.name)}</strong></p>
          ${profile?.physical_address ? `<p style="margin: 0 0 8px;">${textToHtml(String(profile.physical_address))}</p>` : ''}
          ${profile?.vat_number ? `<p style="margin: 0;">VAT Reg: ${escapeHtml(String(profile.vat_number))}</p>` : ''}
        </div>
      </div>
    </div>
  `;
}

function getDocumentTemplate(profile: BusinessProfile, documentType: DocumentEmailType) {
  const templates = profile?.email_templates || {};

  if (documentType === 'invoice') {
    return templates.invoice || templates.invoices || {
      subject: 'Tax Invoice [INV-XXXX] from TouchTeq',
      body: 'Please find attached the tax invoice for services rendered by Touch Teqniques Engineering Services.',
    };
  }

  if (documentType === 'quotation') {
    return templates.quote || {
      subject: 'Quotation [QT-XXXX] from TouchTeq',
      body: 'Please find the attached quotation from Touch Teqniques Engineering Services.',
    };
  }

  if (documentType === 'purchase-order') {
    return {
      subject: 'Purchase Order [PO-XXXX] from TouchTeq',
      body: 'Please find the attached purchase order for requested services/parts.',
    };
  }

  if (documentType === 'credit-note') {
    return {
      subject: 'Credit Note [CN-XXXX] from TouchTeq',
      body: 'Please find the attached credit note for your records.',
    };
  }

  if (documentType === 'statement') {
    return {
      subject: 'Statement of Account from TouchTeq',
      body: 'Please find your attached statement of account reflecting recent transactions and your current balance.',
    };
  }

  return templates.certificate || {
    subject: 'Compliance Certificate [CERT-XXXX] from TouchTeq',
    body: 'Please find attached the professional compliance certificate from Touch Teqniques Engineering Services.',
  };
}

async function bestEffortAuditLog(
  supabase: Awaited<ReturnType<typeof import('@/lib/supabase/server').createClient>>,
  payload: Record<string, any>,
  fallback: Record<string, any>
) {
  const richInsert = await supabase.from('reminder_logs').insert([payload]);
  if (!richInsert.error) {
    return;
  }

  await supabase.from('reminder_logs').insert([fallback]);
}

async function updateDocumentDeliveryStatus(
  supabase: Awaited<ReturnType<typeof import('@/lib/supabase/server').createClient>>,
  documentType: DocumentEmailType,
  record: any
) {
  const tableMap: Record<string, string> = {
    'invoice': 'invoices',
    'quotation': 'quotes',
    'certificate': 'certificates',
    'purchase-order': 'purchase_orders',
    'credit-note': 'credit_notes'
  };

  const table = tableMap[documentType];
  if (!table) return;

  const now = new Date().toISOString();
  const nextStatus =
    record.status === 'Draft'
      ? (documentType === 'invoice' || documentType === 'purchase-order' ? 'Sent' : 'Issued')
      : record.status;

  const updatePayload: Record<string, any> = {
    last_sent_at: now,
  };

  if (['invoice', 'certificate', 'purchase-order', 'credit-note'].includes(documentType)) {
    updatePayload.updated_at = now;
  }

  if (nextStatus) {
    updatePayload.status = nextStatus;
  }

  await supabase.from(table).update(updatePayload).eq('id', record.id);
}

export async function sendDocumentEmail(input: SendDocumentEmailInput) {
  const {
    supabase,
    documentType,
    documentId,
    documentReference,
    recipientEmail,
    recipientName,
    personalMessage,
    subjectOverride,
    htmlBodyOverride,
    attachmentBase64,
  } = input;

  const profile = await getBusinessProfile(supabase);
  const record = await resolveDocumentRecord(supabase, documentType, documentId, documentReference);
  const resolvedRecipient = await resolveRecipient(
    supabase,
    documentType,
    record,
    recipientEmail,
    recipientName
  );
  const template = getDocumentTemplate(profile, documentType);
  const reference =
    documentType === 'invoice'
      ? (record as any).invoice_number || documentReference
      : documentType === 'quotation'
        ? (record as any).quote_number || documentReference
        : documentType === 'purchase-order'
          ? (record as any).po_number || documentReference
          : documentType === 'credit-note'
            ? (record as any).cn_number || documentReference
            : (record as any).certificate_number || documentReference;
  
  const safeReference =
    reference || (
      documentType === 'invoice' ? 'INV-XXXX' : 
      documentType === 'quotation' ? 'QT-XXXX' : 
      documentType === 'purchase-order' ? 'PO-XXXX' :
      documentType === 'credit-note' ? 'CN-XXXX' :
      documentType === 'statement' ? `STMT-${format(new Date(), 'yyyyMMdd')}` :
      'CERT-XXXX'
    );

  const replacements = {
    '[INV-XXXX]': documentType === 'invoice' ? safeReference : '',
    '[QT-XXXX]': documentType === 'quotation' ? safeReference : '',
    '[PO-XXXX]': documentType === 'purchase-order' ? safeReference : '',
    '[CN-XXXX]': documentType === 'credit-note' ? safeReference : '',
    '[Client Name]': resolvedRecipient.name,
  };

  const subject = replaceMergeTags(
    subjectOverride?.trim() || template.subject || `${toDocumentLabel(documentType)} ${safeReference}`,
    replacements
  );

  const mergedBody = replaceMergeTags(template.body || '', replacements);
  const personalMessageHtml = personalMessage?.trim()
    ? `
        <div style="background-color: #f8fafc; border-left: 4px solid ${profile?.document_settings?.primary_color || DEFAULT_PRIMARY_COLOR}; padding: 16px; margin: 24px 0; color: #475569;">
          ${textToHtml(personalMessage.trim())}
        </div>
      `
    : '';

  const htmlContent = htmlBodyOverride?.trim()
    ? htmlBodyOverride
    : buildEmailShell(
        profile,
        subject,
        `
          <p>${textToHtml(mergedBody)}</p>
          ${personalMessageHtml}
          <p>If you have any questions, please reply to this email.</p>
        `
      );

  const emailResult = await sendTransactionalEmail({
    to: [{ email: resolvedRecipient.email, name: resolvedRecipient.name }],
    sender: getSender(profile),
    subject,
    htmlContent,
    attachment: attachmentBase64
      ? [
          {
            content: attachmentBase64,
            name: `${toDocumentLabel(documentType)}-${safeReference}.pdf`,
          },
        ]
      : undefined,
  });

  if (!emailResult.success) {
    throw new Error(emailResult.error || 'Email delivery failed');
  }

  await updateDocumentDeliveryStatus(supabase, documentType, record);

  const referenceKeyMap: Record<string, string> = {
    'invoice': 'invoice_id',
    'quotation': 'quote_id',
    'certificate': 'certificate_id',
    'purchase-order': 'po_id',
    'credit-note': 'cn_id',
    'statement': 'client_id'
  };

  const referenceKey = referenceKeyMap[documentType] || 'invoice_id';
  const auditType = `${toDocumentLabel(documentType)} Email Sent`;
  const message = `Delivered ${toDocumentLabel(documentType).toLowerCase()} ${safeReference} to ${resolvedRecipient.email}`;
  
  await bestEffortAuditLog(
    supabase,
    {
      [referenceKey]: record.id,
      sent_to: resolvedRecipient.email,
      recipient_email: resolvedRecipient.email,
      type: auditType,
      reminder_type: auditType,
      status: 'Sent',
      sent_at: new Date().toISOString(),
      message,
    },
    {
      [referenceKey]: record.id,
      sent_to: resolvedRecipient.email,
      type: auditType,
      message,
    }
  );

  return {
    documentId: record.id,
    documentType,
    recipientEmail: resolvedRecipient.email,
    recipientName: resolvedRecipient.name,
    reference: safeReference,
    messageId: emailResult.messageId,
  };
}

export async function sendFreeformOfficeEmail(params: {
  supabase: Awaited<ReturnType<typeof import('@/lib/supabase/server').createClient>>;
  recipientEmail: string;
  recipientName?: string | null;
  subject: string;
  htmlBody: string;
  documentType?: DocumentEmailType | null;
  documentReference?: string | null;
}) {
  const profile = await getBusinessProfile(params.supabase);

  const emailResult = await sendTransactionalEmail({
    to: [{ email: params.recipientEmail, name: params.recipientName || 'Valued Client' }],
    sender: getSender(profile, true),
    subject: params.subject,
    htmlContent: params.htmlBody,
  });

  if (!emailResult.success) {
    throw new Error(emailResult.error || 'Email delivery failed');
  }

  if (params.documentType && params.documentReference) {
    await sendDocumentEmail({
      supabase: params.supabase,
      documentType: params.documentType,
      documentReference: params.documentReference,
      recipientEmail: params.recipientEmail,
      recipientName: params.recipientName,
      subjectOverride: params.subject,
      htmlBodyOverride: params.htmlBody,
    });

    return { messageId: emailResult.messageId };
  }

  await bestEffortAuditLog(
    params.supabase,
    {
      sent_to: params.recipientEmail,
      recipient_email: params.recipientEmail,
      type: 'Manual Office Email',
      reminder_type: 'Manual Office Email',
      status: 'Sent',
      sent_at: new Date().toISOString(),
      message: `Delivered email with subject "${params.subject}"`,
    },
    {
      sent_to: params.recipientEmail,
      type: 'Manual Office Email',
      message: `Delivered email with subject "${params.subject}"`,
    }
  );

  return { messageId: emailResult.messageId };
}

function getReminderTemplate(
  profile: BusinessProfile,
  type: ReminderEmailType,
  fallbackSubject: string,
  fallbackBody: string,
  replacements: Record<string, string>
) {
  const templates = profile?.email_templates || {};
  const key =
    type === '1st Reminder'
      ? 'reminder_1'
      : type === '2nd Reminder'
        ? 'reminder_2'
        : type === 'Final Notice'
          ? 'final_notice'
          : null;

  if (!key || !templates[key]) {
    return {
      subject: fallbackSubject,
      bodyHtml: `<p>${textToHtml(fallbackBody)}</p>`,
    };
  }

  return {
    subject: replaceMergeTags(templates[key].subject || fallbackSubject, replacements),
    bodyHtml: `<p>${textToHtml(replaceMergeTags(templates[key].body || fallbackBody, replacements))}</p>`,
  };
}

export async function sendReminderEmail(input: SendReminderEmailInput) {
  const { supabase, invoice, type, daysOverdue, recipient, customMessage } = input;
  const profile = input.profile ?? await getBusinessProfile(supabase);
  const totalAmount = new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR' })
    .format(invoice.total)
    .replace('ZAR', 'R');
  const greetingName = recipient.name || invoice.clients?.contact_person || 'there';
  const replacements = {
    '[INV-XXXX]': invoice.invoice_number,
    '[Client Name]': greetingName,
    '[Amount]': totalAmount,
    '[Due Date]': invoice.due_date,
  };

  const summaryHtml = `
    <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid #e2e8f0;">
      <p style="margin: 0; font-size: 12px; font-weight: bold; color: #64748b; text-transform: uppercase;">Invoice Summary</p>
      <table style="width: 100%; margin-top: 10px; font-size: 14px; border-collapse: collapse;">
        <tr><td style="padding: 5px 0; color: #64748b;">Invoice Number:</td><td style="padding: 5px 0; font-weight: bold;">${escapeHtml(invoice.invoice_number)}</td></tr>
        <tr><td style="padding: 5px 0; color: #64748b;">Amount Due:</td><td style="padding: 5px 0; font-weight: bold;">${escapeHtml(totalAmount)}</td></tr>
        <tr><td style="padding: 5px 0; color: #64748b;">Due Date:</td><td style="padding: 5px 0; font-weight: bold;">${escapeHtml(invoice.due_date)}</td></tr>
        ${daysOverdue > 0 ? `<tr><td style="padding: 5px 0; color: #64748b;">Days Overdue:</td><td style="padding: 5px 0; font-weight: bold; color: #ef4444;">${daysOverdue} Days</td></tr>` : ''}
      </table>
    </div>
  `;

  let subject = '';
  let bodyHtml = '';

  if (type === 'Manual Reminder' && customMessage?.trim()) {
    subject = `Follow-up: Invoice ${invoice.invoice_number} from TouchTeq`;
    bodyHtml = `
      <p>Dear ${escapeHtml(greetingName)},</p>
      <div style="background-color: #fffbeb; border-left: 4px solid #f59e0b; padding: 16px; margin: 20px 0;">
        <p style="margin: 0; font-size: 14px; color: #92400e;">${textToHtml(customMessage.trim())}</p>
      </div>
      <p>Please refer to the invoice summary below for payment details.</p>
      ${summaryHtml}
    `;
  } else if (type === '1st Reminder' || (type === 'Manual Reminder' && !customMessage?.trim())) {
    const template = getReminderTemplate(
      profile,
      '1st Reminder',
      `Friendly Reminder: Invoice [${invoice.invoice_number}] from TouchTeq`,
      `Dear ${greetingName},\n\nI hope this message finds you well. Invoice ${invoice.invoice_number} for ${totalAmount} was due on ${invoice.due_date} and remains outstanding.\n\nIf payment has already been made, please disregard this message and accept our thanks.`,
      replacements
    );
    subject = template.subject;
    bodyHtml = `<p>Dear ${escapeHtml(greetingName)},</p>${template.bodyHtml}${summaryHtml}`;
  } else if (type === '2nd Reminder') {
    const template = getReminderTemplate(
      profile,
      '2nd Reminder',
      `Second Reminder: Invoice [${invoice.invoice_number}] Now Overdue`,
      `Dear ${greetingName},\n\nI am following up regarding Invoice ${invoice.invoice_number} for ${totalAmount} which was due on ${invoice.due_date}. Despite a previous reminder, this invoice remains unpaid.\n\nWe kindly request that payment be made as soon as possible.`,
      replacements
    );
    subject = template.subject;
    bodyHtml = `<p>Dear ${escapeHtml(greetingName)},</p>${template.bodyHtml}${summaryHtml}`;
  } else {
    const template = getReminderTemplate(
      profile,
      'Final Notice',
      `Final Notice: Invoice [${invoice.invoice_number}] Immediate Payment Required`,
      `Dear ${greetingName},\n\nThis is a final notice regarding Invoice ${invoice.invoice_number} for ${totalAmount} which is now ${daysOverdue} days overdue.\n\nWe respectfully request that full payment be made within 5 business days of this notice.`,
      replacements
    );
    subject = template.subject;
    bodyHtml = `<p>Dear ${escapeHtml(greetingName)},</p>${template.bodyHtml}${summaryHtml}`;
  }

  const htmlContent = buildEmailShell(profile, subject, bodyHtml);
  return sendTransactionalEmail({
    to: [{ email: recipient.email, name: greetingName }],
    sender: getSender(profile),
    subject,
    htmlContent,
  });
}
