import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    // Return null or throw a descriptive error that we can catch.
    // For now, let's keep it safe but avoid the hard crash from @supabase/ssr.
    return createBrowserClient(
      url || 'https://placeholder.supabase.co',
      key || 'placeholder'
    );
  }

  return createBrowserClient(url, key);
}
