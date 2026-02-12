import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

// Load env vars from .env.local
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Error: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must be set in .env.local');
    console.error('Looking for .env.local at:', path.resolve(__dirname, '../.env.local'));
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const DATA_DIR = path.resolve(__dirname, '../../NimbusEdge');

const fileMapping = [
    { id: 'customer_dim', fileName: 'customer_dim.csv' },
    { id: 'bookings', fileName: 'bookings_by_customer_month.csv' },
    { id: 'consumption', fileName: 'consumption_by_customer_month.csv' },
    { id: 'instance_hours', fileName: 'instance_hours_by_customer_month_sku.csv' },
    { id: 'sku_pricing', fileName: 'sku_pricing_cost.csv' },
    { id: 'support_tickets', fileName: 'support_tickets.csv' },
];

async function uploadCSVs() {
    console.log('--- Starting CSV Upload to Supabase ---');

    for (const item of fileMapping) {
        const filePath = path.join(DATA_DIR, item.fileName);

        if (!fs.existsSync(filePath)) {
            console.warn(`⚠️ Warning: File not found at ${filePath}. Skipping.`);
            continue;
        }

        console.log(`Reading ${item.fileName}...`);
        const csvContent = fs.readFileSync(filePath, 'utf8');

        console.log(`Uploading content to dataset: ${item.id}...`);
        const { error } = await supabase
            .from('datasets')
            .update({ csv_content: csvContent })
            .eq('id', item.id);

        if (error) {
            console.error(`❌ Error uploading ${item.id}:`, error.message);
        } else {
            console.log(`✅ Success: ${item.id} uploaded.`);
        }
    }

    console.log('--- Finished ---');
}

uploadCSVs();
