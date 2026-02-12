import { NextRequest, NextResponse } from 'next/server';
import { BigQuery } from '@google-cloud/bigquery';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function POST(req: NextRequest) {
    try {
        const { sql } = await req.json();

        if (!sql) {
            return NextResponse.json({ error: 'SQL query is required' }, { status: 400 });
        }

        // Fetch User Session and Profile
        const cookieStore = await cookies();
        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    getAll() {
                        return cookieStore.getAll();
                    },
                    setAll(cookiesToSet) {
                        try {
                            cookiesToSet.forEach(({ name, value, options }) =>
                                cookieStore.set(name, value, options)
                            );
                        } catch {
                            // The `setAll` method was called from a Server Component.
                            // This can be ignored if you have middleware refreshing
                            // user sessions.
                        }
                    },
                },
            }
        );

        const { data: { session } } = await supabase.auth.getSession();

        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { data: profile } = await supabase
            .from('profiles')
            .select('gcp_config')
            .eq('id', session.user.id)
            .single();

        const config = profile?.gcp_config as any;

        if (!config?.projectId || !config?.serviceAccountJson) {
            return NextResponse.json({
                error: 'BigQuery not configured. Please visit Settings to connect your Google Cloud account.'
            }, { status: 500 });
        }

        const bq = new BigQuery({
            projectId: config.projectId,
            credentials: config.serviceAccountJson,
        });

        // Run the query
        const options = {
            query: sql,
            location: 'US', // Adjust as needed
        };

        const [rows] = await bq.query(options);

        return NextResponse.json({ rows });
    } catch (error: any) {
        console.error('BigQuery Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
