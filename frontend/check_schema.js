const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Error: NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY not found in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
    console.log('Checking user_missions table for synced_datasets column...');

    // Try to select the column to see if it exists
    const { data, error } = await supabase
        .from('user_missions')
        .select('synced_datasets')
        .limit(1);

    if (error) {
        if (error.code === '42703') {
            console.error('ERROR: Column "synced_datasets" does not exist in table "user_missions".');
            console.log('Action: Please apply the migration in frontend/supabase/user_missions_table.sql');
        } else {
            console.error('Unexpected error checking schema:', error);
        }
    } else {
        console.log('SUCCESS: Column "synced_datasets" exists in table "user_missions".');
    }
}

checkSchema();
