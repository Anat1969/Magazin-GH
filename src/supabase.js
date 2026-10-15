import { createClient } from '@supabase/supabase-js';

// Shared project cultura-GH. Every table and the bucket carry the mahut_ prefix.
export const SUPABASE_URL = 'https://ktqmwpbzcnzkhjskqisy.supabase.co';
const PUBLISHABLE_KEY = 'sb_publishable_IkreG7naPa1h-d4kGp1gpA_sLU4tg5q';

export const supabase = createClient(SUPABASE_URL, PUBLISHABLE_KEY, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, storageKey: 'mahut-auth' },
});

export const TABLE = 'mahut_articles';
