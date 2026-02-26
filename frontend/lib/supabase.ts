import { createBrowserClient } from '@supabase/ssr';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        storageKey: 'sb-mcugfbfezsqqyhezkzyz-auth-token',
        flowType: 'pkce',
        debug: false
    }
} as any); // Adding options to avoid the lock manager issue across multiple tabs
