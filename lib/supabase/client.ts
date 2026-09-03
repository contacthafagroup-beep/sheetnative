import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ??
  "https://supabase-api-prod.verdent.ai/p/p4fae8c46f211b6becca7";

const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhdWQiOiJhdXRoZW50aWNhdGVkIiwiZXhwIjoyMTA0MDQyMDU5LCJpYXQiOjE3ODg0MjI4NTksImlzcyI6InN1cGFiYXNlIiwicHJvamVjdF9yZWYiOiJwNGZhZThjNDZmMjExYjZiZWNjYTciLCJyb2xlIjoiYW5vbiJ9.gLMKxcYueFTDyJHIwEL35WB1hXYWpn2V8GeGOwZd9MY";

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
  return getSupabase().auth.signInWithOAuth({
    provider,
    options: { redirectTo: `${siteUrl()}/app` },
  });
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
