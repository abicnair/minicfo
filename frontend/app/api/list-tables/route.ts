import { NextRequest, NextResponse } from 'next/server';
import { BigQuery, Table } from '@google-cloud/bigquery';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function GET(req: NextRequest) {
    try {
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
                            // Ignore if called from Server Component
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
                error: 'BigQuery not configured.'
            }, { status: 400 });
        }

        const bigquery = new BigQuery({
            projectId: config.projectId,
            credentials: config.serviceAccountJson,
        });

        const DATASET_ID = 'nimbus_edge';

        // 1. Get the dataset
        const [dataset] = await bigquery.dataset(DATASET_ID).get({ autoCreate: true });

        // 2. List tables in the dataset
        const [tables] = await dataset.getTables();

        const tableList = tables.map((table: Table) => ({
            id: table.id,
            metadata: table.metadata, // Contains tableReference, creationTime, etc.
        }));

        return NextResponse.json({
            success: true,
            tables: tableList
        });

    } catch (error: any) {
        console.error('List Tables Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
