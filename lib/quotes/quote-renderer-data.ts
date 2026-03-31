type AnyRecord = Record<string, any>;

export type QuoteRenderSettings = {
  primaryColor: string;
  fontFamily: string;
  showCsd: boolean;
  showWebsite: boolean;
  quoteDefaultNotes?: string;
  quoteTermsConditions?: string;
  quoteThankYouMessage?: string;
};

export type QuoteRenderLineItem = {
  description: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  qtyType: 'qty' | 'hrs';
};

export type QuoteRenderData = {
  quoteNumber: string;
  issueDate: string;
  expiryDate: string;
  status?: string;
  supplierName?: string;
  supplierAddressLines: string[];
  supplierDetails: Array<{ label: string; value: string }>;
  clientName?: string;
  clientAttention?: string;
  clientAddressLines: string[];
  clientVatNumber?: string;
  quantityLabel: string;
  lineItems: QuoteRenderLineItem[];
  subtotal: number;
  vatAmount: number;
  total: number;
  bankDetails: Array<{ label: string; value: string }>;
  notes?: string;
  terms?: string;
  thankYouMessage?: string;
  footerLine?: string;
  settings: QuoteRenderSettings;
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
  if (Number.isNaN(parsed.getTime())) return raw;
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
    return normalized.split('\n').map((l) => l.trim()).filter(Boolean);
  }
  return normalized.split(',').map((l) => l.trim()).filter(Boolean);
}

function findCredential(profile: AnyRecord, keywords: string[]) {
  const credentials = Array.isArray(profile?.credentials) ? profile.credentials : [];
  return credentials.find((c: AnyRecord) => {
    const haystack = `${asString(c?.type)} ${asString(c?.number)}`.toLowerCase();
    return keywords.some((kw) => haystack.includes(kw));
  }) as AnyRecord | undefined;
}

function resolveBbbeeValue(profile: AnyRecord) {
  const c = findCredential(profile, ['b-bbee', 'bbbee']);
  if (!c) return '';
  const type = asString(c.type);
  const number = asString(c.number);
  const combined = [type, number].filter(Boolean).join(' ').trim();
  const m = combined.match(/level\s*:?[\s-]*(\d+)/i);
  if (m) return m[1];
  return number || type;
}

function resolveSaqccValue(profile: AnyRecord) {
  const c = findCredential(profile, ['saqcc', 'fire']);
  if (!c) return '';
  return asString(c.number) || asString(c.type);
}

function buildFooterLine(profile: AnyRecord, bbbeeValue: string) {
  const name = asString(profile?.legal_name) || asString(profile?.trading_name);
  const parts = [
    name,
    asString(profile?.vat_number) ? `VAT: ${asString(profile.vat_number)}` : '',
    asString(profile?.registration_number) ? `Reg: ${asString(profile.registration_number)}` : '',
    bbbeeValue ? `B-BBEE Level ${bbbeeValue}` : '',
  ].filter(Boolean);
  return parts.join(' • ');
}

function resolveQuantityLabel(lineItems: QuoteRenderLineItem[]) {
  if (lineItems.length === 0) return 'Qty';
  const distinct = new Set(lineItems.map((i) => i.qtyType));
  if (distinct.size === 1) return lineItems[0]?.qtyType === 'hrs' ? 'Hrs' : 'Qty';
  return 'Qty/Hrs';
}

export function formatQuoteCurrency(value: number) {
  return new Intl.NumberFormat('en-ZA', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(asNumber(value));
}

export function buildQuoteRenderData(quote: AnyRecord, rawLineItems: AnyRecord[], businessProfile: AnyRecord): QuoteRenderData {
  const settingsEntry = typeof businessProfile?.document_settings === 'object' && businessProfile.document_settings
    ? businessProfile.document_settings
    : {};
  const bankingEntry = typeof businessProfile?.banking_details === 'object' && businessProfile.banking_details
    ? businessProfile.banking_details
    : {};

  const settings: QuoteRenderSettings = {
    primaryColor: asString(settingsEntry.primary_color) || '#F97316',
    fontFamily: asString(settingsEntry.font_family) || 'Arial',
    showCsd: settingsEntry.show_csd !== false,
    showWebsite: settingsEntry.show_website !== false,
    quoteDefaultNotes: asString(settingsEntry.quote_default_notes),
    quoteTermsConditions: asString(settingsEntry.quote_terms_conditions),
    quoteThankYouMessage: asString(settingsEntry.invoice_thank_you_message),
  };

  const bbbeeValue = resolveBbbeeValue(businessProfile);
  const saqccValue = resolveSaqccValue(businessProfile);

  const lineItems: QuoteRenderLineItem[] = (rawLineItems || []).map((item) => ({
    description: asString(item?.description),
    quantity: asNumber(item?.quantity),
    unitPrice: asNumber(item?.unit_price ?? item?.unitPrice),
    lineTotal: asNumber(item?.line_total ?? item?.lineTotal ?? item?.total),
    qtyType: item?.qty_type === 'hrs' ? 'hrs' : 'qty',
  }));

  const subtotal = asNumber(quote?.subtotal);
  const vatAmount = asNumber(quote?.vat_amount);
  const total = asNumber(quote?.total);

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
    quoteNumber: asString(quote?.quote_number),
    issueDate: formatDate(quote?.issue_date),
    expiryDate: formatDate(quote?.expiry_date),
    status: asString(quote?.status),
    supplierName: asString(businessProfile?.legal_name) || asString(businessProfile?.trading_name),
    supplierAddressLines: splitAddressLines(businessProfile?.physical_address),
    supplierDetails,
    clientName: asString(quote?.clients?.company_name),
    clientAttention: asString(quote?.clients?.contact_person),
    clientAddressLines: splitAddressLines(quote?.clients?.physical_address),
    clientVatNumber: asString(quote?.clients?.vat_number),
    quantityLabel: resolveQuantityLabel(lineItems),
    lineItems,
    subtotal,
    vatAmount,
    total,
    bankDetails,
    notes: asString(quote?.notes) || settings.quoteDefaultNotes,
    terms: settings.quoteTermsConditions,
    thankYouMessage: settings.quoteThankYouMessage,
    footerLine: buildFooterLine(businessProfile, bbbeeValue),
    settings,
    logoUrl: asString(businessProfile?.logo_url),
  };
}
