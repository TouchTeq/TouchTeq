export type ClientContactLike = {
  contact_type?: string | null;
  full_name?: string | null;
  email?: string | null;
  is_primary?: boolean | null;
};

export type EmailContext = 'quote' | 'invoice';

function normType(value: string | null | undefined) {
  return String(value || '').trim().toLowerCase();
}

function hasEmail(c: ClientContactLike) {
  return !!(c.email && String(c.email).trim());
}

export function pickPreferredRecipient(
  contacts: ClientContactLike[],
  context: EmailContext
): { email: string | null; name: string | null; matched: 'technical' | 'finance' | 'primary' | 'none' } {
  const list = Array.isArray(contacts) ? contacts : [];

  const primary = list.find((c) => !!c.is_primary && hasEmail(c));
  const technical = list.find((c) => normType(c.contact_type) === 'technical' && hasEmail(c));
  const finance = list.find((c) => normType(c.contact_type) === 'finance' && hasEmail(c));

  const candidate =
    context === 'quote'
      ? technical || primary || finance
      : finance || primary || technical;

  if (!candidate) return { email: null, name: null, matched: 'none' };

  if (candidate === technical) return { email: String(candidate.email).trim(), name: candidate.full_name || null, matched: 'technical' };
  if (candidate === finance) return { email: String(candidate.email).trim(), name: candidate.full_name || null, matched: 'finance' };
  if (candidate === primary) return { email: String(candidate.email).trim(), name: candidate.full_name || null, matched: 'primary' };

  return { email: String(candidate.email).trim(), name: candidate.full_name || null, matched: 'none' };
}

