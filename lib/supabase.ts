/**
 * Browser-safe Supabase client (anon key, respects Row Level Security).
 * Safe to import in 'use client' components.
 *
 * For the service-role admin client (server only), import from '@/lib/supabase.server'.
 */
import { createClient } from '@supabase/supabase-js';
import { NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY } from './env';

export const supabase = createClient(NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY);
