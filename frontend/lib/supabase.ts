import { createBrowserClient } from '@supabase/ssr';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const createClient = () => {
    // Supabase's GoTrueClient uses navigator.locks for cross-tab session syncing. 
    // This frequently times out (10000ms) on enterprise browsers or during rapid HMR re-renders.
    // We intercept its specific lock request and force it to instantly resolve.
    if (typeof window !== 'undefined' && navigator && navigator.locks) {
        const originalRequest = navigator.locks.request.bind(navigator.locks);
        navigator.locks.request = function (name: string, ...args: any[]) {
            if (name.includes('sb-mcugfbfezsqqyhezkzyz-auth-token')) {
                const callback = args[args.length - 1];
                return callback();
            }
            return (originalRequest as any)(name, ...args);
        } as any;
    }

    return createBrowserClient(supabaseUrl, supabaseAnonKey, {
        auth: {
            storageKey: 'sb-mcugfbfezsqqyhezkzyz-auth-token',
            flowType: 'pkce',
            debug: false
        }
    } as any);
};

const _globalThis = typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : global;
const globalSupabase = _globalThis as any;

export const supabase = globalSupabase.supabaseBrowserClient ?? createClient();

if (process.env.NODE_ENV !== 'production') {
    globalSupabase.supabaseBrowserClient = supabase;
}
