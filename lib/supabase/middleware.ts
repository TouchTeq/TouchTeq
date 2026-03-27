import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function updateSession(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  // Only apply Supabase auth/session logic to the back-office area.
  // Calling `supabase.auth.getUser()` on every request can hang the entire site
  // if Supabase is slow/unreachable (fetch has no default timeout).
  if (!pathname.startsWith('/office')) {
    return response;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // If env is missing, avoid blocking the request and send users to login for protected pages.
  // Keep `/office/login` reachable so the UI can at least render.
  if (!supabaseUrl || !supabaseAnonKey) {
    if (pathname !== '/office/login') {
      const url = request.nextUrl.clone();
      url.pathname = '/office/login';
      url.searchParams.set('error', 'missing_supabase_env');
      return NextResponse.redirect(url);
    }
    return response;
  }

  const supabase = createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  // Ensure office routes fail closed quickly instead of hanging indefinitely.
  let user: unknown = null;
  try {
    const authResult = await Promise.race([
      supabase.auth.getUser(),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Supabase auth timeout')), 2500)
      ),
    ]);
    user = (authResult as { data?: { user?: unknown } })?.data?.user ?? null;
  } catch {
    user = null;
  }

  // Authentication logic for /office routes
  // If not logged in and trying to access anything other than /office/login
  if (!user && pathname !== '/office/login') {
    const url = request.nextUrl.clone();
    url.pathname = '/office/login';
    return NextResponse.redirect(url);
  }

  // If logged in and trying to access /office/login or just /office, redirect to dashboard
  if (user && (pathname === '/office' || pathname === '/office/login')) {
    const url = request.nextUrl.clone();
    url.pathname = '/office/dashboard';
    return NextResponse.redirect(url);
  }

  return response;
}
