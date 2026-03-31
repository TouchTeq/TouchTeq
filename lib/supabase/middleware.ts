import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function updateSession(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  let supabaseResponse = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  // Only apply Supabase auth/session logic to the back-office area.
  if (!pathname.startsWith('/office')) {
    return supabaseResponse;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    if (pathname !== '/office/login') {
      const url = request.nextUrl.clone();
      url.pathname = '/office/login';
      url.searchParams.set('error', 'missing_supabase_env');
      return NextResponse.redirect(url);
    }
    return supabaseResponse;
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
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          cookiesToSet.forEach(({ name, value, options }) => {
            supabaseResponse.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  let user = null;
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
  if (!user && pathname !== '/office/login') {
    const url = request.nextUrl.clone();
    url.pathname = '/office/login';
    const redirectResponse = NextResponse.redirect(url);
    
    // Sync cookies to the redirect response
    supabaseResponse.cookies.getAll().forEach((cookie) => {
      redirectResponse.cookies.set(cookie.name, cookie.value, cookie);
    });
    return redirectResponse;
  }

  // If logged in and trying to access /office/login or just /office, redirect to dashboard
  if (user && (pathname === '/office' || pathname === '/office/login')) {
    const url = request.nextUrl.clone();
    url.pathname = '/office/dashboard';
    const redirectResponse = NextResponse.redirect(url);
    
    // Sync cookies to the redirect response
    supabaseResponse.cookies.getAll().forEach((cookie) => {
      redirectResponse.cookies.set(cookie.name, cookie.value, cookie);
    });
    return redirectResponse;
  }

  return supabaseResponse;
}
