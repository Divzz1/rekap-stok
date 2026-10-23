import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

// ⚠️ GANTI dengan milik proyek Supabase Anda
export const SUPABASE_URL = 'https://vggxtpyduiiaazoloylx.supabase.co/';
export const SUPABASE_ANON_KEY = 'sb_publishable_kQifdwQIic-ycFJBLPa8Og_TvOSw13Z';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);