import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { createBigQueryClient } from '@/lib/bigquery';

export async function POST(req: NextRequest) {
    try {
        const { missionId, datasetId } = await req.json();

        if (!missionId || !datasetId) {
            return NextResponse.json({ error: 'Mission ID and Dataset ID are required' }, { status: 400 });
        }

        // 1. Authenticate user
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
                            // Ignore
                        }
                    },
                },
            }
        );

        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // 2. Query BigQuery for the dataset
        const bq = createBigQueryClient();
        const projectId = process.env.NEXT_PUBLIC_GCP_PROJECT_ID;

        // Map Supabase dataset IDs to BigQuery table names where they differ
        const tableIdMap: Record<string, string> = {
            'sku_pricing': 'sku_pricing_cost',
        };
        const bqTableId = tableIdMap[datasetId] ?? datasetId;

        const query = `SELECT * FROM \`${projectId}.nimbus_edge.${bqTableId}\` LIMIT 10000`;
        const [rows] = await bq.query({ query, location: 'US' });

        if (!rows || rows.length === 0) {
            return NextResponse.json({ error: 'No data found for this dataset' }, { status: 404 });
        }

        // 3. Convert to CSV
        const headers = Object.keys(rows[0]);
        const csvLines = [
            headers.join(','),
            ...rows.map(row =>
                headers.map(h => {
                    const val = row[h];
                    if (val === null || val === undefined) return '';
                    const str = typeof val === 'object' ? JSON.stringify(val) : String(val);
                    // Escape values that contain commas, quotes, or newlines
                    return str.includes(',') || str.includes('"') || str.includes('\n')
                        ? `"${str.replace(/"/g, '""')}"`
                        : str;
                }).join(',')
            )
        ];
        const csv = csvLines.join('\n');

        return new NextResponse(csv, {
            status: 200,
            headers: {
                'Content-Type': 'text/csv',
                'Content-Disposition': `attachment; filename="${datasetId}.csv"`,
            },
        });

    } catch (error: any) {
        console.error('Download Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
