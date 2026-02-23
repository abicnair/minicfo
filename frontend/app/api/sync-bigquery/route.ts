import { NextRequest, NextResponse } from 'next/server';
import { BigQuery } from '@google-cloud/bigquery';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import path from 'path';
import fs from 'fs';

export async function POST(req: NextRequest) {
    try {
        // 1. Authenticate user and get GCP config
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
                error: 'BigQuery not configured. Please visit Settings to connect your Google Cloud account.'
            }, { status: 400 });
        }

        const body = await req.json().catch(() => ({}));
        const { tableId } = body;
        console.log('Sync API: Received request with body:', body);

        const bigquery = new BigQuery({
            projectId: config.projectId,
            credentials: config.serviceAccountJson,
        });

        // 2. Setup paths and mappings
        const DATASET_ID = 'nimbus_edge';
        const DATA_DIR = path.join(process.cwd(), '../NimbusEdge');

        let fileMapping = [
            { tableId: 'customer_dim', fileName: 'customer_dim.csv' },
            { tableId: 'bookings', fileName: 'bookings_by_customer_month.csv' },
            { tableId: 'consumption', fileName: 'consumption_by_customer_month.csv' },
            { tableId: 'instance_hours', fileName: 'instance_hours_by_customer_month_sku.csv' },
            { tableId: 'sku_pricing', fileName: 'sku_pricing_cost.csv' },
            { tableId: 'support_tickets', fileName: 'support_tickets.csv' },
        ];

        console.log('Sync API: Initial file mapping:', fileMapping.map(f => f.tableId));

        // Filter if tableId is provided
        if (tableId) {
            console.log('Sync API: Filtering for tableId:', tableId);
            fileMapping = fileMapping.filter(item => item.tableId === tableId);
            console.log('Sync API: Filtered mapping:', fileMapping.map(f => f.tableId));
            if (fileMapping.length === 0) {
                return NextResponse.json({ error: `Table '${tableId}' not found in mission data mapping.` }, { status: 400 });
            }
        } else {
            console.log('Sync API: No tableId provided, syncing ALL tables.');
        }

        // 3. Ensure dataset exists
        const [dataset] = await bigquery.dataset(DATASET_ID).get({ autoCreate: true });
        console.log(`Sync: Dataset ${DATASET_ID} is ready in project ${config.projectId}.`);

        const results = [];
        for (const item of fileMapping) {
            const filePath = path.join(DATA_DIR, item.fileName);

            if (!fs.existsSync(filePath)) {
                console.warn(`Sync: File not found at ${filePath}. Skipping.`);
                results.push({ tableId: item.tableId, status: 'skipped', error: 'File not found' });
                continue;
            }

            console.log(`Sync: Loading ${item.fileName} into ${item.tableId}...`);

            // 4. Load data into table
            try {
                const [job] = await dataset.table(item.tableId).load(filePath, {
                    sourceFormat: 'CSV',
                    skipLeadingRows: 1,
                    autodetect: true,
                    writeDisposition: 'WRITE_TRUNCATE',
                });

                await job.promise();
                results.push({ tableId: item.tableId, status: 'success' });
            } catch (err: any) {
                console.error(`Sync: Error loading ${item.tableId}:`, err.message);
                results.push({ tableId: item.tableId, status: 'error', error: err.message });
            }
        }

        return NextResponse.json({
            success: true,
            message: 'Sync completed',
            projectId: config.projectId,
            results
        });

    } catch (error: any) {
        console.error('BigQuery Sync Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
