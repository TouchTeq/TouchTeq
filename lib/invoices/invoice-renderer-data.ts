type AnyRecord = Record<string, any>;

export type InvoiceRenderSettings = {
  primaryColor: string;
  fontFamily: string;
  showCsd: boolean;
  showWebsite: boolean;
  invoicePaymentTermsDays?: number;
  invoiceDefaultNotes?: string;
  invoiceTermsConditions?: string;
  invoiceThankYouMessage?: string;
};

export type InvoiceRenderLineItem = {
  description: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  qtyType: 'qty' | 'hrs';
};

export type InvoiceRenderData = {
  invoiceNumber: string;
  issueDate: string;
  dueDate: string;
  paymentReference: string;
  status?: string;
  supplierName?: string;
  supplierAddressLines: string[];
  supplierDetails: Array<{ label: string; value: string }>;
  clientName?: string;
  clientAttention?: string;
  clientAddressLines: string[];
  clientVatNumber?: string;
  quantityLabel: string;
  lineItems: InvoiceRenderLineItem[];
  subtotal: number;
  vatAmount: number;
  total: number;
  amountPaid: number;
  balanceDue: number;
  bankDetails: Array<{ label: string; value: string }>;
  bankReference?: string;
  notes?: string;
  terms?: string;
  thankYouMessage?: string;
  footerLine?: string;
  paymentDueFooter?: string;
  settings: InvoiceRenderSettings;
  logoUrl?: string;
};

function asNumber(value: unknown) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function asString(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function formatDate(value: unknown) {
  const raw = asString(value);
  if (!raw) return '';

  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) {
    return raw;
  }

  return new Intl.DateTimeFormat('en-ZA', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(parsed);
}

function splitAddressLines(value: unknown) {
  const raw = asString(value);
  if (!raw) return [] as string[];

  const normalized = raw.replace(/\r\n/g, '\n');
  if (normalized.includes('\n')) {
    return normalized
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);
  }

  return normalized
    .split(',')
    .map((line) => line.trim())
    .filter(Boolean);
}

function findCredential(profile: AnyRecord, keywords: string[]) {
  const credentials = Array.isArray(profile?.credentials) ? profile.credentials : [];
  return credentials.find((credential: AnyRecord) => {
    const haystack = `${asString(credential?.type)} ${asString(credential?.number)}`.toLowerCase();
    return keywords.some((keyword) => haystack.includes(keyword));
  }) as AnyRecord | undefined;
}

function resolveBbbeeValue(profile: AnyRecord) {
  const credential = findCredential(profile, ['b-bbee', 'bbbee']);
  if (!credential) return '';

  const type = asString(credential.type);
  const number = asString(credential.number);
  const combined = [type, number].filter(Boolean).join(' ').trim();
  const levelMatch = combined.match(/level\s*:?[\s-]*(\d+)/i);
  if (levelMatch) return levelMatch[1];
  return number || type;
}

function resolveSaqccValue(profile: AnyRecord) {
  const credential = findCredential(profile, ['saqcc', 'fire']);
  if (!credential) return '';
  return asString(credential.number) || asString(credential.type);
}

function buildFooterLine(profile: AnyRecord, bbbeeValue: string) {
  const supplierName = asString(profile?.legal_name) || asString(profile?.trading_name);
  const parts = [
    supplierName,
    asString(profile?.vat_number) ? `VAT: ${asString(profile.vat_number)}` : '',
    asString(profile?.registration_number) ? `Reg: ${asString(profile.registration_number)}` : '',
    bbbeeValue ? `B-BBEE Level ${bbbeeValue}` : '',
  ].filter(Boolean);

  return parts.join(' • ');
}

function resolveQuantityLabel(lineItems: InvoiceRenderLineItem[]) {
  if (lineItems.length === 0) return 'Qty';
  const distinct = new Set(lineItems.map((item) => item.qtyType));
  if (distinct.size === 1) {
    return lineItems[0]?.qtyType === 'hrs' ? 'Hrs' : 'Qty';
  }
  return 'Qty/Hrs';
}

export function formatInvoiceCurrency(value: number) {
  return new Intl.NumberFormat('en-ZA', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(asNumber(value));
}

export function buildInvoiceRenderData(invoice: AnyRecord, rawLineItems: AnyRecord[], businessProfile: AnyRecord): InvoiceRenderData {
  const settingsEntry = typeof businessProfile?.document_settings === 'object' && businessProfile.document_settings
    ? businessProfile.document_settings
    : {};
  const bankingEntry = typeof businessProfile?.banking_details === 'object' && businessProfile.banking_details
    ? businessProfile.banking_details
    : {};

  const settings: InvoiceRenderSettings = {
    primaryColor: asString(settingsEntry.primary_color) || '#F97316',
    fontFamily: asString(settingsEntry.font_family) || 'Arial',
    showCsd: settingsEntry.show_csd !== false,
    showWebsite: settingsEntry.show_website !== false,
    invoicePaymentTermsDays: Number.isFinite(Number(settingsEntry.invoice_payment_terms_days))
      ? Number(settingsEntry.invoice_payment_terms_days)
      : undefined,
    invoiceDefaultNotes: asString(settingsEntry.invoice_default_notes),
    invoiceTermsConditions: asString(settingsEntry.invoice_terms_conditions),
    invoiceThankYouMessage: asString(settingsEntry.invoice_thank_you_message),
  };

  const bbbeeValue = resolveBbbeeValue(businessProfile);
  const saqccValue = resolveSaqccValue(businessProfile);

  const lineItems: InvoiceRenderLineItem[] = (rawLineItems || []).map((item) => ({
    description: asString(item?.description),
    quantity: asNumber(item?.quantity),
    unitPrice: asNumber(item?.unit_price ?? item?.unitPrice),
    lineTotal: asNumber(item?.line_total ?? item?.lineTotal ?? item?.total),
    qtyType: item?.qty_type === 'hrs' ? 'hrs' : 'qty',
  }));

  const subtotal = asNumber(invoice?.subtotal);
  const vatAmount = asNumber(invoice?.vat_amount);
  const total = asNumber(invoice?.total);
  const amountPaid = asNumber(invoice?.amount_paid);
  const balanceDue = Number.isFinite(Number(invoice?.balance_due))
    ? asNumber(invoice?.balance_due)
    : Math.max(0, total - amountPaid);

  const supplierDetails = [
    { label: 'VAT No', value: asString(businessProfile?.vat_number) },
    { label: 'Reg No', value: asString(businessProfile?.registration_number) },
    { label: 'CSD No', value: settings.showCsd ? asString(businessProfile?.csd_number) : '' },
    { label: 'SAQCC Fire Reg', value: saqccValue },
    { label: 'B-BBEE Level', value: bbbeeValue },
    { label: 'Email', value: asString(businessProfile?.accounts_email) || asString(businessProfile?.email) },
    { label: 'Website', value: settings.showWebsite ? asString(businessProfile?.website) : '' },
  ].filter((item) => item.value);

  const bankDetails = [
    { label: 'Bank Name', value: asString(bankingEntry?.bank_name) },
    { label: 'Account Number', value: asString(bankingEntry?.account_number) },
    { label: 'Account Type', value: asString(bankingEntry?.account_type) },
    { label: 'Branch Code', value: asString(bankingEntry?.branch_code) },
  ].filter((item) => item.value);

  return {
    invoiceNumber: asString(invoice?.invoice_number),
    issueDate: formatDate(invoice?.issue_date),
    dueDate: formatDate(invoice?.due_date),
    paymentReference: asString(invoice?.payment_reference) || asString(invoice?.invoice_number),
    status: asString(invoice?.status),
    supplierName: asString(businessProfile?.legal_name) || asString(businessProfile?.trading_name),
    supplierAddressLines: splitAddressLines(businessProfile?.physical_address),
    supplierDetails,
    clientName: asString(invoice?.clients?.company_name),
    clientAttention: asString(invoice?.clients?.contact_person),
    clientAddressLines: splitAddressLines(invoice?.clients?.physical_address),
    clientVatNumber: asString(invoice?.clients?.vat_number),
    quantityLabel: resolveQuantityLabel(lineItems),
    lineItems,
    subtotal,
    vatAmount,
    total,
    amountPaid,
    balanceDue,
    bankDetails,
    bankReference: asString(invoice?.invoice_number),
    notes: asString(invoice?.notes) || settings.invoiceDefaultNotes,
    terms: settings.invoiceTermsConditions,
    thankYouMessage: settings.invoiceThankYouMessage,
    footerLine: buildFooterLine(businessProfile, bbbeeValue),
    paymentDueFooter: settings.invoicePaymentTermsDays ? `Payment due within ${settings.invoicePaymentTermsDays} days` : '',
    settings,
    logoUrl: asString(businessProfile?.logo_url),
  };
}
