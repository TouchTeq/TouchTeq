import { type NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  // Only run auth/session middleware for the back-office.
  matcher: ['/office', '/office/:path*'],
};
