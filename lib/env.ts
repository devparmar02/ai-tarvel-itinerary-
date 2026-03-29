/**
 * Centralised environment variable validation.
 * Import this at the top of any server-side file that needs env vars.
 * Throws a clear error at startup instead of a cryptic runtime crash.
 */

function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) throw new Error(`Missing required environment variable: ${key}`);
  return value;
}

function optionalEnv(key: string): string | undefined {
  return process.env[key];
}

// ── Server-only (never prefix with NEXT_PUBLIC_) ──────────────────────────
export const GROQ_API_KEY         = () => requireEnv('GROQ_API_KEY');
export const SUPABASE_SERVICE_KEY = () => requireEnv('SUPABASE_SERVICE_KEY');
export const UPSTASH_REDIS_URL    = () => optionalEnv('UPSTASH_REDIS_REST_URL');
export const UPSTASH_REDIS_TOKEN  = () => optionalEnv('UPSTASH_REDIS_REST_TOKEN');

// ── Public (safe to expose to browser) ───────────────────────────────────
export const NEXT_PUBLIC_SUPABASE_URL      = process.env.NEXT_PUBLIC_SUPABASE_URL      ?? requireEnv('NEXT_PUBLIC_SUPABASE_URL');
export const NEXT_PUBLIC_SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? requireEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY');
export const UNSPLASH_ACCESS_KEY           = () => optionalEnv('UNSPLASH_ACCESS_KEY');