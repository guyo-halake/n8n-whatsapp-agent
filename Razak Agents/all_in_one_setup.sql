-- ============================================================================
-- RAZAK ODIN: ALL-IN-ONE SUPABASE SETUP
-- Includes: Extensions + Custom Types + Tables + Indexes + Production Seed
-- Business: P3L Developers (Nairobi, Kenya)
-- ============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. CUSTOM TYPES
DO $$ BEGIN
    CREATE TYPE business_offering_type AS ENUM ('products_only', 'services_only', 'hybrid_both');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE industry_template_type AS ENUM ('tech', 'retail', 'services', 'restaurant_cafe', 'custom');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE channel_provider_type AS ENUM ('WAHA', 'META_CLOUD_API', 'TWILIO');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE order_status_type AS ENUM ('cart_open', 'pending_payment', 'paid', 'preparing', 'shipped_delivered', 'cancelled');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE booking_status_type AS ENUM ('inquiry', 'confirmed', 'completed', 'rescheduled', 'cancelled');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE payment_gateway_type AS ENUM ('mpesa_stk', 'mpesa_till', 'mpesa_paybill', 'stripe', 'cash_on_delivery', 'bank_transfer');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE subscription_tier_type AS ENUM ('test_and_trial', 'business');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE subscription_status_type AS ENUM ('trialing', 'active', 'past_due', 'canceled', 'paused');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 3. TABLES DEFINITION

-- Table: subscription_plans
CREATE TABLE IF NOT EXISTS subscription_plans (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    monthly_price_kes NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    monthly_message_quota INT NOT NULL DEFAULT 1000,
    max_catalog_items INT NOT NULL DEFAULT 50,
    max_whatsapp_lines INT NOT NULL DEFAULT 1,
    features JSONB NOT NULL DEFAULT '[]'::jsonb,
    is_public BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: tenants
CREATE TABLE IF NOT EXISTS tenants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    slug VARCHAR(64) UNIQUE NOT NULL,
    business_name VARCHAR(255) NOT NULL,
    tagline VARCHAR(255),
    logo_url TEXT,
    industry industry_template_type NOT NULL DEFAULT 'tech',
    offering_type business_offering_type NOT NULL DEFAULT 'hybrid_both',
    
    owner_full_name VARCHAR(150) NOT NULL,
    owner_email VARCHAR(255) NOT NULL,
    owner_phone VARCHAR(50) NOT NULL,
    
    physical_address TEXT,
    city VARCHAR(100) DEFAULT 'Nairobi',
    country VARCHAR(100) DEFAULT 'Kenya',
    currency VARCHAR(10) DEFAULT 'KES',
    operating_hours JSONB DEFAULT '{"mon_fri": "08:00-18:00", "sat_sun": "09:00-14:00"}'::jsonb,
    delivery_zones JSONB DEFAULT '{"coverage": "all over country", "details": "Nairobi same-day dispatch via express rider, upcountry delivery via reliable courier"}'::jsonb,
    
    website_url TEXT,
    instagram_handle VARCHAR(100),
    tiktok_handle VARCHAR(100),
    facebook_page VARCHAR(100),

    google_sheet_id TEXT,
    google_sheet_sync_enabled BOOLEAN DEFAULT false,

    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: tenant_whatsapp_lines
CREATE TABLE IF NOT EXISTS tenant_whatsapp_lines (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    phone_number VARCHAR(50) NOT NULL UNIQUE,
    label VARCHAR(100) DEFAULT 'Main Sales Line',
    provider channel_provider_type NOT NULL DEFAULT 'WAHA',
    
    waha_session_id VARCHAR(100) DEFAULT 'default',
    waha_endpoint_url TEXT DEFAULT 'http://localhost:3000',
    meta_phone_number_id VARCHAR(100),
    meta_waba_id VARCHAR(100),
    meta_access_token TEXT,
    
    is_primary BOOLEAN DEFAULT true,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: tenant_escalation_contacts
CREATE TABLE IF NOT EXISTS tenant_escalation_contacts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    priority_order INT NOT NULL DEFAULT 1,
    full_name VARCHAR(150) NOT NULL,
    role_title VARCHAR(100) NOT NULL,
    phone_number VARCHAR(50) NOT NULL,
    email VARCHAR(255),
    notify_via_whatsapp BOOLEAN DEFAULT true,
    notify_via_sms BOOLEAN DEFAULT false,
    notify_via_email BOOLEAN DEFAULT true,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: tenant_agent_configs
CREATE TABLE IF NOT EXISTS tenant_agent_configs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID UNIQUE NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    agent_name VARCHAR(100) NOT NULL,
    tone_persona TEXT NOT NULL DEFAULT 'Techy, energetic Kenyan youth founder/consultant. Warm, welcoming, highly practical. Speaks fluent English, Swahili, and friendly natural Sheng.',
    language_mode VARCHAR(50) DEFAULT 'multilingual_kenya',
    
    welcome_message_template TEXT NOT NULL,
    system_prompt_overrides TEXT,
    human_takeover_keywords TEXT[] DEFAULT ARRAY['ongea na msee', 'talk to human', 'agent', 'help desk', 'call me', 'human', 'meneja', 'ongea na mtu', 'razak'],
    
    allow_ai_negotiation BOOLEAN DEFAULT false,
    require_stk_confirmation BOOLEAN DEFAULT true,
    
    preferred_model VARCHAR(100) DEFAULT 'gemini-1.5-flash',
    temperature NUMERIC(3,2) DEFAULT 0.20,
    max_tokens INT DEFAULT 600,

    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: tenant_subscriptions
CREATE TABLE IF NOT EXISTS tenant_subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID UNIQUE NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    tier subscription_tier_type NOT NULL DEFAULT 'test_and_trial',
    status subscription_status_type NOT NULL DEFAULT 'active',
    
    monthly_price_kes NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    billing_cycle_anchor TIMESTAMPTZ DEFAULT NOW(),
    current_period_end TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 days'),
    
    monthly_message_quota INT NOT NULL DEFAULT 1000,
    messages_used_this_period INT DEFAULT 0,
    max_catalog_items INT DEFAULT 50,
    max_whatsapp_lines INT DEFAULT 1,
    
    enable_mpesa_stk BOOLEAN DEFAULT true,
    enable_google_sheets_sync BOOLEAN DEFAULT true,
    enable_audio_transcription BOOLEAN DEFAULT false,
    enable_social_manager BOOLEAN DEFAULT false,
    
    mpesa_billing_phone VARCHAR(50),
    auto_renew BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: catalog_items
CREATE TABLE IF NOT EXISTS catalog_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    
    item_type VARCHAR(50) NOT NULL,
    category VARCHAR(100) NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    base_price_kes NUMERIC(10,2) NOT NULL,
    discount_price_kes NUMERIC(10,2),
    
    in_stock BOOLEAN DEFAULT true,
    stock_quantity INT,
    is_available_for_order BOOLEAN DEFAULT true,
    
    service_duration_minutes INT,
    requires_deposit BOOLEAN DEFAULT false,
    deposit_amount_kes NUMERIC(10,2) DEFAULT 0,
    
    image_url TEXT,
    specs JSONB DEFAULT '{}'::jsonb,
    tags TEXT[] DEFAULT ARRAY[]::TEXT[],

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_catalog_items_tenant ON catalog_items (tenant_id, is_available_for_order);

-- Table: tenant_customers
CREATE TABLE IF NOT EXISTS tenant_customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    phone_number VARCHAR(50) NOT NULL,
    customer_name VARCHAR(150),
    lead_score VARCHAR(50) DEFAULT 'warm',
    total_orders_count INT DEFAULT 0,
    total_spend_kes NUMERIC(12,2) DEFAULT 0.00,
    default_delivery_address TEXT,
    notes TEXT,
    is_blocked BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),`
    UNIQUE(tenant_id, phone_number)
);

-- Table: chat_sessions & chat_messages
CREATE TABLE IF NOT EXISTS chat_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    customer_phone VARCHAR(50) NOT NULL,
    whatsapp_line_id UUID REFERENCES tenant_whatsapp_lines(id),
    
    is_human_takeover BOOLEAN DEFAULT false,
    human_operator_name VARCHAR(150),
    takeover_started_at TIMESTAMPTZ,
    
    last_interaction_at TIMESTAMPTZ DEFAULT NOW(),
    session_summary TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS chat_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    sender_role VARCHAR(20) NOT NULL,
    message_text TEXT NOT NULL,
    media_url TEXT,
    raw_payload JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_chat_messages_session ON chat_messages (session_id, created_at DESC);

-- Table: orders & mpesa_transactions
CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES tenant_customers(id),
    customer_phone VARCHAR(50) NOT NULL,
    
    order_items JSONB NOT NULL,
    subtotal_kes NUMERIC(10,2) NOT NULL,
    delivery_fee_kes NUMERIC(10,2) DEFAULT 0.00,
    total_amount_kes NUMERIC(10,2) NOT NULL,
    
    status order_status_type DEFAULT 'pending_payment',
    delivery_address TEXT,
    delivery_notes TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS mpesa_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    order_id UUID REFERENCES orders(id),
    phone_number VARCHAR(50) NOT NULL,
    amount_kes NUMERIC(10,2) NOT NULL,
    
    merchant_request_id VARCHAR(100),
    checkout_request_id VARCHAR(100) UNIQUE,
    mpesa_receipt_number VARCHAR(100),
    result_code INT,
    result_desc TEXT,
    status VARCHAR(50) DEFAULT 'stk_initiated',
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 4. SEED DATA (P3L DEVELOPERS & ODIN-P3L)
-- ============================================================================

-- Subscription Plans
INSERT INTO subscription_plans (id, name, monthly_price_kes, monthly_message_quota, max_catalog_items, max_whatsapp_lines, features)
VALUES 
('test_and_trial', 'Test and Trial Plan', 0.00, 1000, 50, 1, '["gemini_flash", "single_line", "catalog_search", "basic_mpesa", "sheets_sync"]'::jsonb),
('business', 'Business Growth Plan', 10000.00, 10000, 500, 3, '["gemini_flash", "claude_sonnet", "multi_line", "mpesa_stk_push", "two_tier_escalation", "sheets_sync", "custom_prompts"]'::jsonb)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  monthly_price_kes = EXCLUDED.monthly_price_kes,
  monthly_message_quota = EXCLUDED.monthly_message_quota;

-- Tenant: P3L Developers
INSERT INTO tenants (
    id, slug, business_name, tagline, industry, offering_type,
    owner_full_name, owner_email, owner_phone,
    physical_address, city, country, currency,
    operating_hours, delivery_zones,
    website_url, instagram_handle, tiktok_handle
) VALUES (
    '11111111-1111-1111-1111-111111111111',
    'p3l-developers',
    'P3L Developers',
    'AI Automations & Software Startup | Smart Tech & Hardware Solutions',
    'tech',
    'hybrid_both',
    'Razak Guyo',
    'razakwako45@gmail.com',
    '254768141129',
    'Nairobi, Kenya',
    'Nairobi',
    'Kenya',
    'KES',
    '{"mon_fri": "08:00-18:00", "sat_sun": "09:00-14:00"}'::jsonb,
    '{"coverage": "all over country", "details": "Nairobi same-day dispatch via express rider, upcountry delivery via reliable parcel courier (G4S / Fargo Courier)"}'::jsonb,
    'https://p3ldev.com',
    '@p3ldev',
    '@p3ldev'
) ON CONFLICT (id) DO UPDATE SET
    business_name = EXCLUDED.business_name,
    tagline = EXCLUDED.tagline,
    owner_full_name = EXCLUDED.owner_full_name,
    owner_email = EXCLUDED.owner_email,
    owner_phone = EXCLUDED.owner_phone,
    operating_hours = EXCLUDED.operating_hours,
    delivery_zones = EXCLUDED.delivery_zones,
    instagram_handle = EXCLUDED.instagram_handle,
    tiktok_handle = EXCLUDED.tiktok_handle;

-- WhatsApp Line
INSERT INTO tenant_whatsapp_lines (
    tenant_id, phone_number, label, provider, waha_session_id, waha_endpoint_url, is_primary
) VALUES (
    '11111111-1111-1111-1111-111111111111',
    '254768141129',
    'P3L Developers Official WhatsApp Line',
    'WAHA',
    'default',
    'http://localhost:3000',
    true
) ON CONFLICT (phone_number) DO UPDATE SET
    label = EXCLUDED.label,
    provider = EXCLUDED.provider;

-- Escalation Contacts (Razak Guyo + Tech Desk)
DELETE FROM tenant_escalation_contacts WHERE tenant_id = '11111111-1111-1111-1111-111111111111';

INSERT INTO tenant_escalation_contacts (
    tenant_id, priority_order, full_name, role_title, phone_number, email, notify_via_whatsapp, notify_via_email
) VALUES 
('11111111-1111-1111-1111-111111111111', 1, 'Razak Guyo', 'Founder & Lead Architect', '254768141129', 'razakwako45@gmail.com', true, true),
('11111111-1111-1111-1111-111111111111', 2, 'P3L Operations Desk', 'Technical Systems Engineer', '254714188858', 'support@p3ldev.com', true, true);

-- Agent Config: Odin-P3L
INSERT INTO tenant_agent_configs (
    tenant_id, agent_name, tone_persona, language_mode,
    welcome_message_template, preferred_model, allow_ai_negotiation, require_stk_confirmation
) VALUES (
    '11111111-1111-1111-1111-111111111111',
    'Odin-P3L',
    'Techy, energetic Kenyan youth founder/consultant from P3L Developers. Warm, welcoming, highly practical, zero fluff. Speaks fluent English, Swahili, and friendly natural Sheng. Explains tech gear specs, helps clients pick the right laptops, desktops, or web/AI automation services. Quotes prices strictly from verified catalog. Confirms orders and triggers M-Pesa prompt.',
    'multilingual_kenya',
    'Hey, this is P3L Developers. We are an automations and AI startup here to make your business or personal work easier, how may I help you today?',
    'gemini-1.5-flash',
    false,
    true
) ON CONFLICT (tenant_id) DO UPDATE SET
    agent_name = EXCLUDED.agent_name,
    tone_persona = EXCLUDED.tone_persona,
    welcome_message_template = EXCLUDED.welcome_message_template,
    preferred_model = EXCLUDED.preferred_model;

-- Tenant Subscription (Test and Trial Tier - Free 1,000 Messages)
INSERT INTO tenant_subscriptions (
    tenant_id, tier, status, monthly_price_kes, monthly_message_quota,
    max_catalog_items, max_whatsapp_lines, enable_mpesa_stk, enable_google_sheets_sync
) VALUES (
    '11111111-1111-1111-1111-111111111111',
    'test_and_trial',
    'active',
    0.00,
    1000,
    50,
    1,
    true,
    true
) ON CONFLICT (tenant_id) DO UPDATE SET
    tier = EXCLUDED.tier,
    status = EXCLUDED.status,
    monthly_price_kes = EXCLUDED.monthly_price_kes,
    monthly_message_quota = EXCLUDED.monthly_message_quota;

-- Real Products (4 Items) & Services (3 Items)
DELETE FROM catalog_items WHERE tenant_id = '11111111-1111-1111-1111-111111111111';

-- Product 1: Desktops
INSERT INTO catalog_items (
    tenant_id, item_type, category, name, description, base_price_kes,
    in_stock, stock_quantity, is_available_for_order, specs, tags
) VALUES (
    '11111111-1111-1111-1111-111111111111',
    'product',
    'Desktops',
    'Custom High-Performance Workstation & Gaming Desktop PC',
    'Intel Core i7 13th Gen / Ryzen 7, 32GB DDR5 RAM, 1TB NVMe Gen4 SSD, NVIDIA RTX 4070 12GB GPU, 240mm Liquid Cooler, 750W 80+ Gold PSU, High-airflow Tempered Glass Case. Ideal for 3D modeling, video production, coding, and 4K gaming.',
    185000.00,
    true,
    5,
    true,
    '{"cpu": "Intel Core i7 13th Gen", "ram": "32GB DDR5", "storage": "1TB NVMe Gen4 SSD", "gpu": "RTX 4070 12GB"}'::jsonb,
    ARRAY['desktop', 'gaming', 'workstation', 'pc', 'intel', 'nvidia']
);

-- Product 2: Apple iPhones & MacBooks
INSERT INTO catalog_items (
    tenant_id, item_type, category, name, description, base_price_kes,
    in_stock, stock_quantity, is_available_for_order, specs, tags
) VALUES (
    '11111111-1111-1111-1111-111111111111',
    'product',
    'Apple iPhones & MacBooks',
    'Apple MacBook Pro 14" (M3 Chip, 18GB Unified Memory, 512GB SSD)',
    'Space Black, Apple M3 11-core CPU / 14-core GPU, 14.2-inch Liquid Retina XDR screen, 120Hz ProMotion, MagSafe 3 charging. Brand new factory sealed with 1-year official Apple Warranty. The ultimate machine for software engineers.',
    265000.00,
    true,
    4,
    true,
    '{"brand": "Apple", "chip": "Apple M3", "memory": "18GB Unified RAM", "storage": "512GB SSD", "display": "14.2 Liquid Retina XDR"}'::jsonb,
    ARRAY['apple', 'macbook', 'macbookpro', 'm3', 'laptop']
);

-- Product 3: Laptops
INSERT INTO catalog_items (
    tenant_id, item_type, category, name, description, base_price_kes,
    in_stock, stock_quantity, is_available_for_order, specs, tags
) VALUES (
    '11111111-1111-1111-1111-111111111111',
    'product',
    'Laptops',
    'HP Victus 15 Gaming & Engineering Laptop (Core i7, 16GB RAM, RTX 4050)',
    'Intel Core i7-13620H 10-Core Processor, 16GB DDR5 5200MHz RAM, 512GB PCIe NVMe SSD, NVIDIA GeForce RTX 4050 6GB GDDR6, 15.6" FHD 144Hz IPS display, Backlit Keyboard with numpad, Bang & Olufsen Audio. Built for power programming and simulation.',
    128000.00,
    true,
    7,
    true,
    '{"cpu": "Intel Core i7-13620H", "ram": "16GB DDR5", "storage": "512GB SSD", "gpu": "RTX 4050 6GB", "screen": "15.6 144Hz"}'::jsonb,
    ARRAY['laptop', 'hp', 'victus', 'coding', 'gaming']
);

-- Product 4: Tech Accessories & Gaming
INSERT INTO catalog_items (
    tenant_id, item_type, category, name, description, base_price_kes,
    in_stock, stock_quantity, is_available_for_order, specs, tags
) VALUES (
    '11111111-1111-1111-1111-111111111111',
    'product',
    'Tech Accessories & Gaming',
    'Pro Tri-Mode Wireless Mechanical Keyboard & Gaming Mouse Combo',
    'RGB Backlit Hot-Swappable Mechanical Keyboard (Red Linear Switches, Bluetooth 5.0 + 2.4GHz + USB-C) paired with an Ergonomic Ultra-Lightweight 16,000 DPI Gaming Mouse and fast magnetic charging dock.',
    8500.00,
    true,
    25,
    true,
    '{"connectivity": "Bluetooth 5.0 / 2.4G Wireless / Type-C", "switches": "Hot-swappable Mechanical", "rgb": "Per-key Dynamic RGB"}'::jsonb,
    ARRAY['accessories', 'keyboard', 'mouse', 'gaming', 'rgb']
);

-- Service 1: Branding and Web Development
INSERT INTO catalog_items (
    tenant_id, item_type, category, name, description, base_price_kes,
    service_duration_minutes, requires_deposit, deposit_amount_kes, is_available_for_order, tags
) VALUES (
    '11111111-1111-1111-1111-111111111111',
    'service',
    'Branding and Web Development',
    'Full-Stack Custom Web Development & Brand Identity Sprint',
    'High-converting, responsive web applications, client portals, and e-commerce websites built with Next.js, Tailwind CSS, Supabase/Node.js. Includes custom brand identity design: logo, brand style guide, social media visual kit, and SEO configuration. Standard delivery: 10-14 days.',
    45000.00,
    14400,
    true,
    22500.00,
    true,
    ARRAY['service', 'web_development', 'branding', 'nextjs', 'design']
);

-- Service 2: AI and Automations
INSERT INTO catalog_items (
    tenant_id, item_type, category, name, description, base_price_kes,
    service_duration_minutes, requires_deposit, deposit_amount_kes, is_available_for_order, tags
) VALUES (
    '11111111-1111-1111-1111-111111111111',
    'service',
    'AI and Automations',
    'Autonomous WhatsApp AI Sales Agent & Business Process Automation',
    'Custom AI sales and customer care agent connected to your WhatsApp number. Features intelligent catalog search, automatic M-Pesa STK push checkout, 2-tier human takeover alerts, and real-time syncing to Google Sheets and CRM pipelines via n8n. Deployment: 3-5 days.',
    35000.00,
    7200,
    true,
    17500.00,
    true,
    ARRAY['service', 'ai_agents', 'whatsapp_bot', 'n8n', 'mpesa_automation']
);

-- Service 3: IoT and Hardware Repairs
INSERT INTO catalog_items (
    tenant_id, item_type, category, name, description, base_price_kes,
    service_duration_minutes, requires_deposit, deposit_amount_kes, is_available_for_order, tags
) VALUES (
    '11111111-1111-1111-1111-111111111111',
    'service',
    'IoT and Hardware Repairs',
    'Smart IoT Telemetry Systems & Precision Hardware Repair',
    'Custom IoT sensor networks and remote monitoring builds, plus expert chip-level laptop & desktop motherboard repair, diagnostic troubleshooting, GPU/CPU thermal re-pasting, screen & keyboard replacements, and hardware upgrades.',
    5000.00,
    1440,
    false,
    0.00,
    true,
    ARRAY['service', 'iot', 'hardware_repair', 'diagnostics', 'motherboard']
);

-- Production payment/order reconciliation additions
ALTER TABLE orders
    ADD COLUMN IF NOT EXISTS payment_method VARCHAR(40),
    ADD COLUMN IF NOT EXISTS payment_status VARCHAR(30) NOT NULL DEFAULT 'unpaid',
    ADD COLUMN IF NOT EXISTS delivery_status VARCHAR(40) NOT NULL DEFAULT 'pending',
    ADD COLUMN IF NOT EXISTS order_reference VARCHAR(80),
    ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMPTZ;

CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_tenant_reference
    ON orders (tenant_id, order_reference)
    WHERE order_reference IS NOT NULL;

CREATE TABLE IF NOT EXISTS payment_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    provider VARCHAR(40) NOT NULL,
    provider_reference VARCHAR(160) NOT NULL,
    customer_phone VARCHAR(50),
    amount_kes NUMERIC(12,2) NOT NULL,
    currency VARCHAR(10) NOT NULL DEFAULT 'KES',
    status VARCHAR(30) NOT NULL DEFAULT 'initialized',
    provider_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    paid_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (provider, provider_reference)
);
ALTER TABLE payment_transactions
    ADD COLUMN IF NOT EXISTS customer_phone VARCHAR(50);

-- Paystack Transactions (Direct Gateway Ledger & STK/Card Tracking)
CREATE TABLE IF NOT EXISTS paystack_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE DEFAULT '11111111-1111-1111-1111-111111111111',
    reference VARCHAR(100) NOT NULL UNIQUE,
    email VARCHAR(255),
    phone VARCHAR(50),
    amount_kes NUMERIC(12,2) NOT NULL DEFAULT 0,
    currency VARCHAR(10) NOT NULL DEFAULT 'KES',
    status VARCHAR(30) NOT NULL DEFAULT 'initialized',
    channel VARCHAR(50) DEFAULT 'mobile_money',
    authorization_url TEXT,
    gateway_response TEXT,
    paystack_id BIGINT,
    paid_at TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_paystack_tx_ref ON paystack_transactions(reference);
CREATE INDEX IF NOT EXISTS idx_paystack_tx_status ON paystack_transactions(status);
CREATE INDEX IF NOT EXISTS idx_paystack_tx_tenant ON paystack_transactions(tenant_id);

CREATE TABLE IF NOT EXISTS payment_webhook_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    provider VARCHAR(40) NOT NULL,
    event_id VARCHAR(200) NOT NULL,
    event_type VARCHAR(100) NOT NULL,
    payload JSONB NOT NULL,
    processed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (provider, event_id)
);

CREATE TABLE IF NOT EXISTS order_status_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    status_field VARCHAR(30) NOT NULL,
    old_status VARCHAR(40),
    new_status VARCHAR(40) NOT NULL,
    source VARCHAR(60) NOT NULL,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS delivery_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    status VARCHAR(40) NOT NULL,
    agent_name VARCHAR(150),
    agent_phone VARCHAR(50),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS notification_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
    channel VARCHAR(30) NOT NULL,
    recipient VARCHAR(160) NOT NULL,
    event_type VARCHAR(80) NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'pending',
    provider_reference VARCHAR(160),
    error_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (order_id, channel, recipient, event_type)
);

CREATE TABLE IF NOT EXISTS ledger_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
    payment_transaction_id UUID REFERENCES payment_transactions(id) ON DELETE SET NULL,
    entry_type VARCHAR(50) NOT NULL,
    amount_kes NUMERIC(12,2) NOT NULL,
    fee_kes NUMERIC(12,2) NOT NULL DEFAULT 0,
    net_amount_kes NUMERIC(12,2) NOT NULL,
    currency VARCHAR(10) NOT NULL DEFAULT 'KES',
    provider_reference VARCHAR(160),
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
