import { BigQuery } from '@google-cloud/bigquery';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

// Setup __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env vars from .env.local
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const projectId = process.env.GCP_PROJECT_ID;
const clientEmail = process.env.GCP_CLIENT_EMAIL;
const privateKey = process.env.GCP_PRIVATE_KEY?.replace(/\\n/g, '\n');

if (!projectId || !clientEmail || !privateKey) {
    console.error('Error: GCP_PROJECT_ID, GCP_CLIENT_EMAIL, and GCP_PRIVATE_KEY must be set in .env.local');
    process.exit(1);
}

const bigquery = new BigQuery({
    projectId,
    credentials: {
        client_email: clientEmail,
        private_key: privateKey,
    },
});

const DATASET_ID = 'nimbus_edge';
const DATA_DIR = path.resolve(__dirname, '../../NimbusEdge');

const fileMapping = [
    { tableId: 'customer_dim', fileName: 'customer_dim.csv' },
    { tableId: 'bookings', fileName: 'bookings_by_customer_month.csv' },
    { tableId: 'consumption', fileName: 'consumption_by_customer_month.csv' },
    { tableId: 'instance_hours', fileName: 'instance_hours_by_customer_month_sku.csv' },
    { tableId: 'sku_pricing', fileName: 'sku_pricing_cost.csv' },
    { tableId: 'support_tickets', fileName: 'support_tickets.csv' },
];

async function uploadToBigQuery() {
    console.log('--- Starting CSV Upload to BigQuery ---');

    try {
        // 1. Ensure dataset exists
        const [dataset] = await bigquery.dataset(DATASET_ID).get({ autoCreate: true });
        console.log(`✅ Dataset ${DATASET_ID} is ready.`);

        for (const item of fileMapping) {
            const filePath = path.join(DATA_DIR, item.fileName);

            if (!fs.existsSync(filePath)) {
                console.warn(`⚠️ Warning: File not found at ${filePath}. Skipping.`);
                continue;
            }

            console.log(`Loading ${item.fileName} into ${item.tableId}...`);

            // 2. Load data into table
            const [job] = await dataset.table(item.tableId).load(filePath, {
                sourceFormat: 'CSV',
                skipLeadingRows: 1,
                autodetect: true,
                writeDisposition: 'WRITE_TRUNCATE', // Overwrite if exists
            });

            console.log(`✅ Job ${job.id} started.`);

            // Wait for the job to finish
            await job.promise();
            console.log(`✅ Table ${item.tableId} loaded.`);
        }

        console.log('--- Finished ---');
    } catch (error: any) {
        console.error('❌ Error uploading to BigQuery:', error.message);
        if (error.errors) {
            console.error('Inner errors:', JSON.stringify(error.errors, null, 2));
        }
    }
}

uploadToBigQuery();
