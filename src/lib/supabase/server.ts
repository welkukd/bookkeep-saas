import { createServerClient as createSupabaseServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';

const isPlaceholder = (v: string | undefined) =>
  !v || v.includes('your-project') || v.includes('eyJhbG...here') || v.includes('placeholder');

export const createServerClient = async () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (isPlaceholder(url) || isPlaceholder(key)) return null;

  const cookieStore = await cookies();
  return createSupabaseServerClient(url!, key!, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // The `set` method was called from a Server Component.
        }
      },
    },
  });
};

export const createServiceClient = async () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (isPlaceholder(url) || isPlaceholder(key)) return null;

  return createSupabaseServerClient(url!, key!, {
    cookies: {
      getAll() { return []; },
      setAll() {},
    },
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
};

export const isSupabaseConfigured = () => !isPlaceholder(process.env.NEXT_PUBLIC_SUPABASE_URL) && !isPlaceholder(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);