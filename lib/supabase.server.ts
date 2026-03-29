/**
 * SERVER-ONLY Supabase admin client.
 * Uses the service-role key which bypasses Row Level Security.
 * NEVER import this file in 'use client' components.
 */
import 'server-only';
import { createClient } from '@supabase/supabase-js';
import { NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_KEY } from './env';

export function getServiceClient() {
  return createClient(NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_KEY(), {
    auth: { persistSession: false },
  });
}
