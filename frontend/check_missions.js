
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function checkMissions() {
    const { data, error } = await supabase.from('missions').select('id, title');
    if (error) {
        console.error('Error:', error);
    } else {
        console.log('Missions:', JSON.stringify(data, null, 2));
    }
}

checkMissions();
