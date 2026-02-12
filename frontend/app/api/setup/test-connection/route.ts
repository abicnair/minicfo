import { NextRequest, NextResponse } from 'next/server';
import { BigQuery } from '@google-cloud/bigquery';

export async function POST(req: NextRequest) {
    try {
        const { projectId, serviceAccountJson } = await req.json();

        if (!projectId || !serviceAccountJson) {
            return NextResponse.json({ error: 'Project ID and Service Account JSON are required' }, { status: 400 });
        }

        let credentials;
        try {
            credentials = JSON.parse(serviceAccountJson);
        } catch (e) {
            return NextResponse.json({ error: 'Invalid JSON format in Service Account field' }, { status: 400 });
        }

        const bq = new BigQuery({
            projectId,
            credentials,
        });

        // Test connection by listing datasets (minimal read operation)
        await bq.getDatasets({ maxResults: 1 });

        // If we get here, the connection works!
        // In a real app, we might save these to a secure database.
        // For this local mission, we'll inform the user they can now proceed.

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error('Test Connection Error:', error);
        return NextResponse.json({
            success: false,
            error: error.message,
            details: error.errors ? JSON.stringify(error.errors) : undefined
        });
    }
}
