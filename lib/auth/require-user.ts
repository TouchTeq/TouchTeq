import type { User } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';

const AUTH_TIMEOUT_MS = 3000;

export class AuthError extends Error {
  constructor(message = 'Authentication required') {
    super(message);
    this.name = 'AuthError';
  }
}

type ServerSupabaseClient = Awaited<ReturnType<typeof createClient>>;

export async function requireAuthenticatedUser(existingSupabase?: ServerSupabaseClient) {
  const supabase = existingSupabase ?? await createClient();

  const authResult = await Promise.race([
    supabase.auth.getUser(),
    new Promise<never>((_, reject) => {
      setTimeout(() => reject(new AuthError('Authentication timed out')), AUTH_TIMEOUT_MS);
    }),
  ]);

  const user = (authResult as { data?: { user?: User | null } })?.data?.user ?? null;

  if (!user) {
    throw new AuthError();
  }

  return { supabase, user };
}

export function isAuthError(error: unknown) {
  return error instanceof AuthError || (error instanceof Error && error.name === 'AuthError');
}
