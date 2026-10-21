import { createBrowserClient } from '@supabase/ssr';

const isPlaceholder = (v: string | undefined) =>
  !v || v.includes('your-project') || v.includes('eyJhbG...here') || v.includes('placeholder');

export const createClient = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (isPlaceholder(url) || isPlaceholder(key)) return null;
  return createBrowserClient(url!, key!);
};

export const isSupabaseConfigured = () => !isPlaceholder(process.env.NEXT_PUBLIC_SUPABASE_URL) && !isPlaceholder(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);