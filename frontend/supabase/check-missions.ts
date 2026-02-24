const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkMissions() {
    console.log('Checking missions at:', supabaseUrl);
    const { data, error, count } = await supabase
        .from('missions')
        .select('*', { count: 'exact' });

    if (error) {
        console.error('Error fetching missions:', error);
    } else {
        console.log('Missions found:', data?.length || 0);
        console.log('Total count:', count);
        if (data && data.length > 0) {
            console.log('Titles:', data.map((m: any) => m.title).join(', '));
        }
    }
}

checkMissions();
