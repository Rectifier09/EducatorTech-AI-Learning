import { createBrowserClient as createSSRBrowserClient } from "@supabase/ssr";

/** Supabase client for use in Client Components (browser). */
export function createBrowserClient() {
  return createSSRBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
