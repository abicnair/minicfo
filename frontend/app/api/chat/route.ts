import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function POST(req: NextRequest) {
    try {
        const { message, history, context } = await req.json();

        // Fetch User Session and Profile to get their custom API Key
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
                        } catch { }
                    },
                },
            }
        );

        const { data: { session } } = await supabase.auth.getSession();
        let apiKey = process.env.GEMINI_API_KEY;

        if (session) {
            const { data: profile } = await supabase
                .from('profiles')
                .select('ai_config')
                .eq('id', session.user.id)
                .single();

            if (profile?.ai_config?.gemini_api_key) {
                apiKey = profile.ai_config.gemini_api_key;
            }
        }

        if (!apiKey) {
            return NextResponse.json({ error: 'Gemini API Key not configured' }, { status: 500 });
        }

        // Construct the system instruction and prompt
        const systemInstruction = `You are an AI Junior Analyst at a scaling SaaS company.
You are assisting the user (the CFO) on the mission: "${context.missionTitle}".

You have access to the following dataset schemas:
${JSON.stringify(context.schemas, null, 2)}

STRICT RULES — follow these exactly:
1. Only answer what the user directly asked. Do not volunteer insights, observations, trends, or follow-up analysis they did not request.
2. Do not summarise the mission, restate objectives, or offer strategic commentary unless explicitly asked.
3. If asked for SQL, write only the SQL and a one-line explanation of what it does. Nothing more.
4. Always use fully qualified table names with the tableId (not displayName): \`${process.env.NEXT_PUBLIC_GCP_PROJECT_ID}.nimbus_edge.<tableId>\`
5. Never invent table or column names — only use what is in the schemas above.
6. Keep all responses short and direct.`;

        // Create the contents with the system instruction injected into the first user message
        const contents = history.length === 0
            ? [{ role: 'user', parts: [{ text: `${systemInstruction}\n\nUser Question: ${message}` }] }]
            : [
                {
                    role: history[0].role === 'ai' ? 'model' : 'user',
                    parts: [{ text: `${systemInstruction}\n\n${history[0].content}` }]
                },
                ...history.slice(1).map((msg: any) => ({
                    role: msg.role === 'ai' ? 'model' : 'user',
                    parts: [{ text: msg.content }]
                })),
                { role: 'user', parts: [{ text: message }] }
            ];

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents,
                generationConfig: {
                    temperature: 0.7,
                    maxOutputTokens: 1000,
                }
            }),
        });

        const data = await response.json();

        if (!response.ok || data.error) {
            console.error('Gemini API Error Response:', data);
            throw new Error(data.error?.message || `Gemini API Error: ${response.statusText}`);
        }

        const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || "I'm sorry, I couldn't generate a response.";

        return NextResponse.json({ message: aiResponse });
    } catch (error: any) {
        console.error('Chat API Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
