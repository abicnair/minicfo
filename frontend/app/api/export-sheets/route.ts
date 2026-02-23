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

        const auth = new google.auth.JWT(
            config.serviceAccountJson.client_email,
            undefined,
            config.serviceAccountJson.private_key,
            ['https://www.googleapis.com/auth/spreadsheets', 'https://www.googleapis.com/auth/drive.file']
        );

        console.log('Export API: Authenticating with service account:', config.serviceAccountJson.client_email);

        const sheets = google.sheets({ version: 'v4', auth });
        const drive = google.drive({ version: 'v3', auth });

        // 1. Create a new Spreadsheet
        console.log('Export API: Creating spreadsheet...');
        const spreadsheet = await sheets.spreadsheets.create({
            requestBody: {
                properties: {
                    title: title || 'MiniCFO Export',
                },
            },
        });

        const spreadsheetId = spreadsheet.data.spreadsheetId;
        if (!spreadsheetId) throw new Error('Failed to create spreadsheet');

        // 2. Format data for Sheets (Headers + Rows)
        console.log('Export API: Formatting data for spreadsheetId:', spreadsheetId);
        const headers = Object.keys(data[0]);
        const values = [
            headers,
            ...data.map(row => headers.map(header => row[header]))
        ];

        // 3. Update the sheet with values
        console.log('Export API: Writing data to Sheet1...');
        await sheets.spreadsheets.values.update({
            spreadsheetId,
            range: 'Sheet1!A1',
            valueInputOption: 'RAW',
            requestBody: { values },
        });

        // 4. Share with the specific user who requested it
        const userEmail = session.user.email;
        console.log('Export API: Attempting to share with user email:', userEmail);
        if (userEmail) {
            try {
                await drive.permissions.create({
                    fileId: spreadsheetId,
                    requestBody: {
                        type: 'user',
                        role: 'writer',
                        emailAddress: userEmail,
                    },
                });
                console.log('Export API: Successfully shared with user email.');
            } catch (shareError: any) {
                console.warn('Export API: Failed to share with user email, trying public fallback:', shareError.message);
                // Fallback: make it readable for anyone with the link
                await drive.permissions.create({
                    fileId: spreadsheetId,
                    requestBody: {
                        type: 'anyone',
                        role: 'reader',
                    },
                });
                console.log('Export API: Successfully set public reader permission.');
            }
        }

        return NextResponse.json({
            success: true,
            spreadsheetId,
            spreadsheetUrl: `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`
        });

    } catch (error: any) {
        console.error('Sheets Export Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
