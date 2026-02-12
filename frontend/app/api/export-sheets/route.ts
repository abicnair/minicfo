import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function POST(req: NextRequest) {
    try {
        const { data, title } = await req.json();

        if (!data || !Array.isArray(data) || data.length === 0) {
            return NextResponse.json({ error: 'Data is required for export' }, { status: 400 });
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
                            // Ignored
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
                error: 'Sheets not configured. Please visit Settings to connect your Google Cloud account.'
            }, { status: 500 });
        }

        const auth = new google.auth.JWT({
            email: config.serviceAccountJson.client_email,
            key: config.serviceAccountJson.private_key,
            scopes: ['https://www.googleapis.com/auth/spreadsheets', 'https://www.googleapis.com/auth/drive']
        });

        const sheets = google.sheets({ version: 'v4', auth });

        // 1. Create a new Spreadsheet
        const spreadsheet = await sheets.spreadsheets.create({
            requestBody: {
                properties: {
                    title: title || 'MiniCFO Export',
                },
            },
        });

        const spreadsheetId = spreadsheet.data.spreadsheetId;

        // 2. Format data for Sheets (Headers + Rows)
        const headers = Object.keys(data[0]);
        const values = [
            headers,
            ...data.map(row => headers.map(header => row[header]))
        ];

        // 3. Update the sheet with values
        await sheets.spreadsheets.values.update({
            spreadsheetId: spreadsheetId!,
            range: 'Sheet1!A1',
            valueInputOption: 'RAW',
            requestBody: { values },
        });

        // 4. (Optional) Make it publicly viewable if needed, or share with a specific user
        // For this demo, we'll return the URL. User may need to give service account access or we use a public template.

        return NextResponse.json({
            spreadsheetId,
            spreadsheetUrl: `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`
        });

    } catch (error: any) {
        console.error('Sheets Export Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
