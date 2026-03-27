/**
 * Server-side API key resolver.
 *
 * Priority:
 *  1. Encrypted key stored in Supabase (Thabo's own key)
 *  2. Environment variable fallback (dev/deployment default)
 *
 * Decrypted keys are NEVER sent to the browser. Only call this on the server.
 */

import { createClient } from '@supabase/supabase-js';
import { decryptValue } from '@/lib/encryption';

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    // Use the anon key — the api_keys table is RLS-protected
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
  );
}

const ENV_KEY_MAP: Record<string, string | undefined> = {
  gemini: process.env.GEMINI_API_KEY,
  brevo: process.env.BREVO_API_KEY,
};

/**
 * Returns the active API key for the given service.
 * Checks Supabase first; falls back to environment variable.
 */
export async function getActiveApiKey(keyName: 'gemini' | 'brevo'): Promise<string | null> {
  // Only try Supabase if the encryption key is configured
  if (process.env.ENCRYPTION_KEY) {
    try {
      const supabase = getSupabaseAdmin();
      const { data, error } = await supabase
        .from('api_keys')
        .select('encrypted_value, iv')
        .eq('key_name', keyName)
        .maybeSingle();

      if (!error && data?.encrypted_value && data?.iv) {
        const decrypted = await decryptValue(data.encrypted_value, data.iv);
        if (decrypted.trim()) {
          return decrypted.trim();
        }
      }
    } catch {
      // Silently fall through to environment variable
    }
  }

  // Fallback: environment variable
  return ENV_KEY_MAP[keyName] || null;
}

/**
 * Returns whether a UI-stored key exists for the given service.
 * Returns false if no ENCRYPTION_KEY is configured.
 */
export async function hasStoredKey(keyName: 'gemini' | 'brevo'): Promise<boolean> {
  if (!process.env.ENCRYPTION_KEY) return false;

  try {
    const supabase = getSupabaseAdmin();
    const { data } = await supabase
      .from('api_keys')
      .select('id')
      .eq('key_name', keyName)
      .maybeSingle();

    return !!data;
  } catch {
    return false;
  }
}
