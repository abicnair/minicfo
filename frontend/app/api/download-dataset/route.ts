import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import path from 'path';
import fs from 'fs';

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

        // 2. Validate that the dataset is unlocked for this mission
        const { data: missionProgress, error: mpError } = await supabase
            .from('user_missions')
            .select('unlocked_datasets')
            .eq('user_id', session.user.id)
            .eq('mission_id', missionId)
            .single();

        if (mpError || !missionProgress?.unlocked_datasets.includes(datasetId)) {
            return NextResponse.json({ error: 'Access denied. Please unlock this dataset first.' }, { status: 403 });
        }

        // 3. Map datasetId to fileName
        // We'll fetch the actual filename from the datasets table if possible, 
        // but for now we follow the same mapping as sync
        const fileMapping: Record<string, string> = {
            'customer_dim': 'customer_dim.csv',
            'bookings': 'bookings_by_customer_month.csv',
            'consumption': 'consumption_by_customer_month.csv',
            'instance_hours': 'instance_hours_by_customer_month_sku.csv',
            'sku_pricing': 'sku_pricing_cost.csv',
            'support_tickets': 'support_tickets.csv',
        };

        const fileName = fileMapping[datasetId];
        if (!fileName) {
            // Try to find by name if ID doesn't match keys directly (some fallback)
            const { data: dataset } = await supabase
                .from('datasets')
                .select('name')
                .eq('id', datasetId)
                .single();

            // Hardcoded fallback for known names if UUIDs are used
            if (!dataset) return NextResponse.json({ error: 'Dataset not found' }, { status: 404 });
        }

        const DATA_DIR = path.join(process.cwd(), '../NimbusEdge');
        const filePath = path.join(DATA_DIR, fileName || '');

        if (!fs.existsSync(filePath)) {
            return NextResponse.json({ error: 'Source file not found on server' }, { status: 404 });
        }

        // 4. Stream the file
        const fileBuffer = fs.readFileSync(filePath);

        return new NextResponse(fileBuffer, {
            status: 200,
            headers: {
                'Content-Type': 'text/csv',
                'Content-Disposition': `attachment; filename="${fileName}"`,
            },
        });

    } catch (error: any) {
        console.error('Download Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
