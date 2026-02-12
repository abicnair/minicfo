-- 1. Create Tables
CREATE TABLE IF NOT EXISTS missions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title         TEXT NOT NULL,
  subtitle      TEXT,
  briefing_from TEXT,
  briefing_body TEXT[],
  created_at    TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS objectives (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mission_id UUID REFERENCES missions(id) ON DELETE CASCADE,
  sort_order INT NOT NULL,
  body       TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS datasets (
  id           TEXT PRIMARY KEY,
  mission_id   UUID REFERENCES missions(id) ON DELETE CASCADE,
  name         TEXT NOT NULL,
  description  TEXT,
  row_count    TEXT,
  unlock_cost  INT DEFAULT 0,
  intel_label  TEXT,
  csv_content  TEXT, -- Raw CSV content
  column_json  JSONB, -- Schema metadata [{name, type, desc}]
  sort_order   INT DEFAULT 0,
  created_at   TIMESTAMPTZ DEFAULT now()
);

-- 2. Seed Mission Data
DO $$
DECLARE
    new_mission_id UUID;
BEGIN
    -- Insert Mission
    INSERT INTO missions (title, subtitle, briefing_from, briefing_body)
    VALUES (
        'Mission: The SaaS Dip',
        'We''re growing headcount, but revenue is flat. Find out why.',
        'Sarah, CEO',
        ARRAY[
            'Welcome to the team. We have a critical situation. Over the last two quarters, our consumption-based revenue has flatlined even though we''re onboarding new customers. Net Revenue Retention (NRR) has dropped from 120% to 105%, and several Enterprise accounts are showing declining instance hours.',
            'The board wants to know: is this a product problem, a pricing problem, or a support problem? I need you to cross-reference our bookings, consumption data, instance usage, and support tickets to find the root cause — in 30 days.'
        ]
    ) RETURNING id INTO new_mission_id;

    -- Insert Objectives
    INSERT INTO objectives (mission_id, sort_order, body) VALUES
    (new_mission_id, 1, 'Compare Bookings vs. Consumption trends by customer segment to find revenue leakage.'),
    (new_mission_id, 2, 'Analyze Instance Hours and SKU Pricing to identify margin erosion or underpriced SKUs.'),
    (new_mission_id, 3, 'Cross-reference Support Tickets with churning accounts to determine if support quality drives NRR decline.'),
    (new_mission_id, 4, 'Draft a 1-page recommendation for the Board.');

    -- Insert Dataset Metadata (Content will be uploaded via script)
    INSERT INTO datasets (id, mission_id, name, description, row_count, unlock_cost, intel_label, sort_order, column_json) VALUES
    ('customer_dim', new_mission_id, 'Customer Dimension', 'Master table for customer details, segmentation, and contract dates.', '2,500', 20, 'Customer Directory & Segments', 1, '[
        {"name": "Customer_ID", "type": "STRING", "desc": "Unique identifier for the customer account"},
        {"name": "Company_Name", "type": "STRING", "desc": "Name of the customer organization"},
        {"name": "Segment_Current", "type": "STRING", "desc": "Current market segment (SMB, Mid-Market, Enterprise)"},
        {"name": "Start_Date", "type": "DATE", "desc": "Contract start date"},
        {"name": "End_Date", "type": "DATE", "desc": "Contract end date"},
        {"name": "Region", "type": "STRING", "desc": "Geographical region"},
        {"name": "Industry", "type": "STRING", "desc": "Customer industry vertical"}
    ]'),
    ('bookings', new_mission_id, 'Bookings', 'Historical record of closed-won deals and booking amounts.', '15,000', 30, 'Monthly Bookings & Deals', 2, '[
        {"name": "Deal_ID", "type": "STRING", "desc": "Unique identifier for the deal"},
        {"name": "Customer_ID", "type": "STRING", "desc": "Foreign key to Customer Dimension"},
        {"name": "Month", "type": "DATE", "desc": "Month of booking"},
        {"name": "SKU_ID", "type": "STRING", "desc": "Product SKU identifying the item sold"},
        {"name": "Sales_Rep_Name", "type": "STRING", "desc": "Name of the sales representative"},
        {"name": "Booking_Amount_USD", "type": "FLOAT", "desc": "Total booking value in USD"},
        {"name": "ARR_Booked_USD", "type": "FLOAT", "desc": "Annual recurring revenue booked in USD"}
    ]'),
    ('consumption', new_mission_id, 'Consumption Data', 'Monthly consumption units per customer.', '50,000+', 40, 'Monthly Consumption Usage', 3, '[
        {"name": "Customer_ID", "type": "STRING", "desc": "Foreign key to Customer Dimension"},
        {"name": "Month", "type": "DATE", "desc": "Billing month"},
        {"name": "Consumption_Units", "type": "FLOAT", "desc": "Total units consumed in the period"}
    ]'),
    ('instance_hours', new_mission_id, 'Instance Hours', 'Granular instance hours usage by SKU.', '100,000+', 30, 'Instance Hours by SKU', 4, '[
        {"name": "Customer_ID", "type": "STRING", "desc": "Foreign key to Customer Dimension"},
        {"name": "Month", "type": "DATE", "desc": "Usage month"},
        {"name": "SKU_ID", "type": "STRING", "desc": "Product SKU being utilized"},
        {"name": "Instance_Hours", "type": "FLOAT", "desc": "Total hours of instance runtime"}
    ]'),
    ('sku_pricing', new_mission_id, 'SKU Pricing', 'Pricing and cost information for all SKUs.', '50', 10, 'SKU Pricing & Cost', 5, '[
        {"name": "SKU_ID", "type": "STRING", "desc": "Unique identifier for the SKU"},
        {"name": "SKU_Name", "type": "STRING", "desc": "Descriptive name of the product"},
        {"name": "SKU_Category", "type": "STRING", "desc": "Product category (Compute, Storage, etc.)"},
        {"name": "Price_Per_Unit", "type": "FLOAT", "desc": "List price per unit"},
        {"name": "Cost_Per_Unit", "type": "FLOAT", "desc": "Cost of checks per unit"}
    ]'),
    ('support_tickets', new_mission_id, 'Support Tickets', 'Log of customer support tickets and resolution status.', '5,000', 25, 'Support Tickets & Root Causes', 6, '[
        {"name": "Ticket_ID", "type": "STRING", "desc": "Unique ticket identifier"},
        {"name": "Customer_ID", "type": "STRING", "desc": "Foreign key to Customer Dimension"},
        {"name": "Severity", "type": "STRING", "desc": "Severity level (Low, Medium, High, Critical)"},
        {"name": "Status", "type": "STRING", "desc": "Current ticket status (Open, Closed, Pending)"},
        {"name": "Category", "type": "STRING", "desc": "Ticket classification"},
        {"name": "Root_Cause", "type": "STRING", "desc": "Identified root cause of the issue"}
    ]');

END $$;
