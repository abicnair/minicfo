import { createBrowserClient } from '@supabase/ssr';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const createClient = () => {
    return createBrowserClient(supabaseUrl, supabaseAnonKey, {
        auth: {
            storageKey: 'sb-mcugfbfezsqqyhezkzyz-auth-token',
            flowType: 'pkce',
            debug: false,
            // Supabase occasionally gets stuck trying to acquire a cross-tab lock.
            // When this happens even in single tabs, we must completely disable the lock.
            // Returning a resolved promise tells Supabase it instantly acquired the lock.
            lock: async (name: string, acquire: () => Promise<void>) => {
                try {
                    await acquire();
                } catch (e) {
                    console.warn('Supabase lock bypassed due to timeout protection.', e);
                }
            }
        }
    } as any);
};

const _globalThis = typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : global;
const globalSupabase = _globalThis as any;

export const supabase = globalSupabase.supabaseBrowserClient ?? createClient();

if (process.env.NODE_ENV !== 'production') {
    globalSupabase.supabaseBrowserClient = supabase;
}
