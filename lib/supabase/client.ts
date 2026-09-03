import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const envOr = (value: string | undefined, fallback: string) =>
  value && value.trim() ? value.trim() : fallback;

const SUPABASE_URL = envOr(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  "https://vbayhnlkcoqgssgapaay.supabase.co"
);

const SUPABASE_ANON_KEY = envOr(
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  "sb_publishable_jBoN1Vj0SoRRRnPEbPnn4A_1b0pYPWC"
);

let client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (client) return client;
  client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });
  return client;
}

export function siteUrl(): string {
  if (typeof window !== "undefined") return window.location.origin;
  return process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
}

export async function signInWithProvider(provider: "google" | "github" | "azure") {
  const isDesktop =
    typeof window !== "undefined" &&
    !!(window as unknown as { sheetnative?: { isDesktop?: boolean } }).sheetnative?.isDesktop;

  const res = await getSupabase().auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: `${siteUrl()}/app`,
      // desktop shell: open a sign-in popup, keep the app window intact
      skipBrowserRedirect: isDesktop,
    },
  });

  if (isDesktop && res.data?.url) {
    window.open(res.data.url, "sheetnative-signin", "width=480,height=720,menubar=no");
  }
  return res;
}

export async function signInWithPassword(email: string, password: string) {
  return getSupabase().auth.signInWithPassword({ email, password });
}

export async function signUpWithPassword(email: string, password: string) {
  return getSupabase().auth.signUp({
    email,
    password,
    options: { emailRedirectTo: `${siteUrl()}/app` },
  });
}
