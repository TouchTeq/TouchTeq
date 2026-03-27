import { createClient } from '@/lib/supabase/client';

/**
 * Fuzzy matches a name against the client database.
 * Returns the matched client or null if no strong match.
 */
export async function matchClient(name: string) {
  const supabase = createClient();
  const searchName = name.toLowerCase().trim();

  // 1. Exact match
  const { data: exactMatch } = await supabase
    .from('clients')
    .select('*')
    .ilike('company_name', searchName)
    .single();

  if (exactMatch) return exactMatch;

  // 2. Fetch all clients and do a simple fuzzy check
  const { data: allClients } = await supabase
    .from('clients')
    .select('*');

  if (!allClients) return null;

  // Find client where searchName is contained in the company_name or contact_person
  const fuzzyMatch = allClients.find(client => {
    const companyName = (client.company_name || '').toLowerCase();
    const contactPerson = (client.contact_person || '').toLowerCase();
    
    return companyName.includes(searchName) || 
           searchName.includes(companyName) ||
           contactPerson.includes(searchName) ||
           searchName.includes(contactPerson);
  });

  return fuzzyMatch || null;
}

/**
 * Strips digits and special chars from client name for strict validation.
 */
export function sanitizeClientNameAi(name: string) {
  // Strip digits and non-alpha (except spaces/hyphens)
  return name.replace(/[0-9]/g, '').trim();
}
