// Hardcoded reseed script for emergency use
const supabaseUrl = 'https://mcugfbfezsqqyhezkzyz.supabase.co';
const supabaseAnonKey = 'sb_publishable_UKSqhH6wJRKa6VpW7seDdg_emKAedg2';

async function api(path, method = 'GET', body = null) {
    const url = `${supabaseUrl}/rest/v1/${path}`;
    const headers = {
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${supabaseAnonKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
    };

    const options = { method, headers };
    if (body) options.body = JSON.stringify(body);

    console.log(`API ${method} ${url}`);
    const response = await fetch(url, options);
    const data = await response.json();

    if (!response.ok) {
        console.error(`API Error: ${response.status}`, data);
        throw new Error(`Failed ${path}`);
    }
    return data;
}

async function reseed() {
    try {
        console.log('--- Starting Reseed (Hardcoded) ---');

        // 1. Mission
        const missionBody = {
            title: 'Mission: The SaaS Dip',
            subtitle: "We're growing headcount, but revenue is flat. Find out why.",
            briefing_from: 'Sarah, CEO',
            briefing_body: [
                "Welcome to the team. We have a critical situation. Over the last two quarters, our consumption-based revenue has flatlined even though we're onboarding new customers. Net Revenue Retention (NRR) has dropped from 120% to 105%, and several Enterprise accounts are showing declining instance hours.",
                "The board wants to know: is this a product problem, a pricing problem, or a support problem? I need you to cross-reference our bookings, consumption data, instance usage, and support tickets to find the root cause — in 30 days."
            ]
        };

        const missions = await api('missions', 'POST', missionBody);
        const mission = missions[0];
        console.log('Created Mission:', mission.id);

        // 2. Objectives
        const objectives = [
            { mission_id: mission.id, sort_order: 1, body: 'Compare Bookings vs. Consumption trends by customer segment to find revenue leakage.' },
            { mission_id: mission.id, sort_order: 2, body: 'Analyze Instance Hours and SKU Pricing to identify margin erosion or underpriced SKUs.' },
            { mission_id: mission.id, sort_order: 3, body: 'Cross-reference Support Tickets with churning accounts to determine if support quality drives NRR decline.' },
            { mission_id: mission.id, sort_order: 4, body: 'Draft a 1-page recommendation for the Board.' }
        ];
        await api('objectives', 'POST', objectives);
        console.log('Created Objectives');

        // 3. Datasets
        const datasets = [
            {
                id: 'customer_dim', mission_id: mission.id, name: 'Customer Dimension', description: 'Master table for customer details, segmentation, and contract dates.', row_count: '2,500', unlock_cost: 20, intel_label: 'Customer Directory & Segments', sort_order: 1, column_json: [
                    { "name": "Customer_ID", "type": "STRING", "desc": "Unique identifier for the customer account" },
                    { "name": "Company_Name", "type": "STRING", "desc": "Name of the customer organization" },
                    { "name": "Segment_Current", "type": "STRING", "desc": "Current market segment (SMB, Mid-Market, Enterprise)" },
                    { "name": "Start_Date", "type": "DATE", "desc": "Contract start date" },
                    { "name": "End_Date", "type": "DATE", "desc": "Contract end date" },
                    { "name": "Region", "type": "STRING", "desc": "Geographical region" },
                    { "name": "Industry", "type": "STRING", "desc": "Customer industry vertical" }
                ]
            },
            {
                id: 'bookings', mission_id: mission.id, name: 'Bookings', description: 'Historical record of closed-won deals and booking amounts.', row_count: '15,000', unlock_cost: 30, intel_label: 'Monthly Bookings & Deals', sort_order: 2, column_json: [
                    { "name": "Deal_ID", "type": "STRING", "desc": "Unique identifier for the deal" },
                    { "name": "Customer_ID", "type": "STRING", "desc": "Foreign key to Customer Dimension" },
                    { "name": "Month", "type": "DATE", "desc": "Month of booking" },
                    { "name": "SKU_ID", "type": "STRING", "desc": "Product SKU identifying the item sold" },
                    { "name": "Sales_Rep_Name", "type": "STRING", "desc": "Name of the sales representative" },
                    { "name": "Booking_Amount_USD", "type": "FLOAT", "desc": "Total booking value in USD" },
                    { "name": "ARR_Booked_USD", "type": "FLOAT", "desc": "Annual recurring revenue booked in USD" }
                ]
            },
            {
                id: 'consumption', mission_id: mission.id, name: 'Consumption Data', description: 'Monthly consumption units per customer.', row_count: '50,000+', unlock_cost: 40, intel_label: 'Monthly Consumption Usage', sort_order: 3, column_json: [
                    { "name": "Customer_ID", "type": "STRING", "desc": "Foreign key to Customer Dimension" },
                    { "name": "Month", "type": "DATE", "desc": "Billing month" },
                    { "name": "Consumption_Units", "type": "FLOAT", "desc": "Total units consumed in the period" }
                ]
            },
            {
                id: 'instance_hours', mission_id: mission.id, name: 'Instance Hours', description: 'Granular instance hours usage by SKU.', row_count: '100,000+', unlock_cost: 30, intel_label: 'Instance Hours by SKU', sort_order: 4, column_json: [
                    { "name": "Customer_ID", "type": "STRING", "desc": "Foreign key to Customer Dimension" },
                    { "name": "Month", "type": "DATE", "desc": "Usage month" },
                    { "name": "SKU_ID", "type": "STRING", "desc": "Product SKU being utilized" },
                    { "name": "Instance_Hours", "type": "FLOAT", "desc": "Total hours of instance runtime" }
                ]
            },
            {
                id: 'sku_pricing', mission_id: mission.id, name: 'SKU Pricing', description: 'Pricing and cost information for all SKUs.', row_count: '50', unlock_cost: 10, intel_label: 'SKU Pricing & Cost', sort_order: 5, column_json: [
                    { "name": "SKU_ID", "type": "STRING", "desc": "Unique identifier for the SKU" },
                    { "name": "SKU_Name", "type": "STRING", "desc": "Descriptive name of the product" },
                    { "name": "SKU_Category", "type": "STRING", "desc": "Product category (Compute, Storage, etc.)" },
                    { "name": "Price_Per_Unit", "type": "FLOAT", "desc": "Price per unit" },
                    { "name": "Cost_Per_Unit", "type": "FLOAT", "desc": "Cost per unit" }
                ]
            },
            {
                id: 'support_tickets', mission_id: mission.id, name: 'Support Tickets', description: 'Log of customer support tickets and resolution status.', row_count: '5,000', unlock_cost: 25, intel_label: 'Support Tickets & Root Causes', sort_order: 6, column_json: [
                    { "name": "Ticket_ID", "type": "STRING", "desc": "Unique ticket identifier" },
                    { "name": "Customer_ID", "type": "STRING", "desc": "Foreign key to Customer Dimension" },
                    { "name": "Severity", "type": "STRING", "desc": "Severity level (Low, Medium, High, Critical)" },
                    { "name": "Status", "type": "STRING", "desc": "Current ticket status (Open, Closed, Pending)" },
                    { "name": "Category", "type": "STRING", "desc": "Ticket classification" },
                    { "name": "Root_Cause", "type": "STRING", "desc": "Identified root cause of the issue" }
                ]
            }
        ];
        await api('datasets', 'POST', datasets);
        console.log('Created Datasets');

        console.log('--- Success ---');
    } catch (e) {
        console.error('Reseed Failed:', e);
    }
}

reseed();
