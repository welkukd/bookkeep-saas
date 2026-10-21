import { createServerClient } from '@/lib/supabase/server';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const supabase = await createServerClient();

  // If Supabase not configured, skip auth checks
  if (!supabase) {
    return NextResponse.next({ request });
  }

  let supabaseResponse = NextResponse.next({ request });

  // Refresh session if expired - required for Server Components
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Protected routes
  const protectedPaths = ['/dashboard', '/accounts', '/budgets', '/goals', '/reports', '/settings'];
  const isProtectedPath = protectedPaths.some(path => request.nextUrl.pathname.startsWith(path));

  // Auth routes that should redirect to dashboard if logged in
  const authPaths = ['/login', '/signup', '/auth'];
  const isAuthPath = authPaths.some(path => request.nextUrl.pathname.startsWith(path));

  if (isProtectedPath && !user) {
    const redirectUrl = new URL('/login', request.url);
    redirectUrl.searchParams.set('redirect', request.nextUrl.pathname);
    return NextResponse.redirect(redirectUrl);
  }

  if (isAuthPath && user) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - api routes (handled separately)
     */
    '/((?!_next/static|_next/image|favicon.ico|public|api).*)',
  ],
};