import { BigQuery } from '@google-cloud/bigquery';

/**
 * Creates a BigQuery client using either:
 * - GOOGLE_APPLICATION_CREDENTIALS_JSON (Vercel/production): JSON string of service account
 * - GOOGLE_APPLICATION_CREDENTIALS (local dev): file path to service account JSON
 */
export function createBigQueryClient(): BigQuery {
    const projectId = process.env.NEXT_PUBLIC_GCP_PROJECT_ID;

    if (!projectId) {
        throw new Error('NEXT_PUBLIC_GCP_PROJECT_ID is not set.');
    }

    const credentialsJson = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;

    if (credentialsJson) {
        const credentials = JSON.parse(credentialsJson);
        return new BigQuery({ projectId, credentials });
    }

    // Falls back to GOOGLE_APPLICATION_CREDENTIALS file path (local dev)
    return new BigQuery({ projectId });
}
