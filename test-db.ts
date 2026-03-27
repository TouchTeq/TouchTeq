import { createClient } from '@supabase/supabase-js';

const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL as string, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string);
(async () => {
  const { data, error } = await sb.from('fuel_purchases').select('*').limit(1);
  console.log('fuel_purchases exists:', !error, error?.message || '');
  
  const { data: v, error: verr } = await sb.from('vehicles').select('*').limit(1);
  console.log('vehicles exists:', !verr, verr?.message || '');
})();
