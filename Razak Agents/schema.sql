-- ============================================================================
-- RAZAK ODIN: ENTERPRISE MULTI-TENANT DATABASE SCHEMA
-- PostgreSQL / Supabase Migration
-- Version: 2.1 (Production - Fixed Schema)
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Custom Enums
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

-- ============================================================================
-- TABLE: subscription_plans (System Tiers Defined in Database)
-- ============================================================================
CREATE TABLE IF NOT EXISTS subscription_plans (
    id VARCHAR(50) PRIMARY KEY, -- 'test_and_trial', 'business'
    name VARCHAR(100) NOT NULL,
    monthly_price_kes NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    monthly_message_quota INT NOT NULL DEFAULT 1000,
    max_catalog_items INT NOT NULL DEFAULT 50,
    max_whatsapp_lines INT NOT NULL DEFAULT 1,
    features JSONB NOT NULL DEFAULT '[]'::jsonb,
    is_public BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- TABLE: tenants (The Businesses)
-- ============================================================================
CREATE TABLE IF NOT EXISTS tenants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    slug VARCHAR(64) UNIQUE NOT NULL,
    business_name VARCHAR(255) NOT NULL,
    tagline VARCHAR(255),
    logo_url TEXT,
    industry industry_template_type NOT NULL DEFAULT 'tech',
    offering_type business_offering_type NOT NULL DEFAULT 'hybrid_both',
    
    -- Owner Details
    owner_full_name VARCHAR(150) NOT NULL,
    owner_email VARCHAR(255) NOT NULL,
    owner_phone VARCHAR(50) NOT NULL,
    
    -- Address & Operations
    physical_address TEXT,
    city VARCHAR(100) DEFAULT 'Nairobi',
    country VARCHAR(100) DEFAULT 'Kenya',
    currency VARCHAR(10) DEFAULT 'KES',
    operating_hours JSONB DEFAULT '{"mon_fri": "08:00-18:00", "sat_sun": "09:00-14:00"}'::jsonb,
    delivery_zones JSONB DEFAULT '{"coverage": "all over country", "details": "Nairobi same-day dispatch via rider, upcountry via reliable parcel courier (G4S / Fargo / EasyCoach)"}'::jsonb,
    
    -- Online Handles
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

-- ============================================================================
-- TABLE: tenant_whatsapp_lines (Multi-Number Support)
-- ============================================================================
CREATE TABLE IF NOT EXISTS tenant_whatsapp_lines (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    phone_number VARCHAR(50) NOT NULL UNIQUE, -- E.164 without '+', e.g. '254768141129'
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

-- ============================================================================
-- TABLE: tenant_escalation_contacts (2 Personnel for Human Takeover)
-- ============================================================================
CREATE TABLE IF NOT EXISTS tenant_escalation_contacts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    priority_order INT NOT NULL DEFAULT 1, -- 1 = primary, 2 = secondary
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

-- ============================================================================
-- TABLE: tenant_agent_configs (AI Tone, Language & DNA)
-- ============================================================================
CREATE TABLE IF NOT EXISTS tenant_agent_configs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID UNIQUE NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    agent_name VARCHAR(100) NOT NULL, -- Format: 'Odin-(business name)', e.g. 'Odin-P3L'
    tone_persona TEXT NOT NULL DEFAULT 'Techy, energetic Kenyan youth founder/consultant. Warm, welcoming, highly practical. Speaks fluent English, Swahili, and friendly natural Sheng.',
    language_mode VARCHAR(50) DEFAULT 'multilingual_kenya',
    
    welcome_message_template TEXT NOT NULL,
    system_prompt_overrides TEXT,
    human_takeover_keywords TEXT[] DEFAULT ARRAY['ongea na msee', 'talk to human', 'agent', 'help desk', 'call me', 'human', 'meneja', 'ongea na mtu'],
    
    allow_ai_negotiation BOOLEAN DEFAULT false,
    require_stk_confirmation BOOLEAN DEFAULT true,
    
    preferred_model VARCHAR(100) DEFAULT 'gemini-1.5-flash',
    temperature NUMERIC(3,2) DEFAULT 0.20,
    max_tokens INT DEFAULT 600,

    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- TABLE: tenant_subscriptions (Subscription & Revenue Engine)
-- ============================================================================
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

-- ============================================================================
-- TABLE: catalog_items (Strict Products & Services Only)
-- ============================================================================
CREATE TABLE IF NOT EXISTS catalog_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    
    item_type VARCHAR(50) NOT NULL, -- 'product' or 'service'
    category VARCHAR(100) NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    base_price_kes NUMERIC(10,2) NOT NULL,
    discount_price_kes NUMERIC(10,2),
    
    -- Stock & Availability
    in_stock BOOLEAN DEFAULT true,
    stock_quantity INT, -- Null for services
    is_available_for_order BOOLEAN DEFAULT true,
    
    -- Services specific
    service_duration_minutes INT,
    requires_deposit BOOLEAN DEFAULT false,
    deposit_amount_kes NUMERIC(10,2) DEFAULT 0,
    
    image_url TEXT,
    specs JSONB DEFAULT '{}'::jsonb, -- Specifications (CPU, RAM, Storage, etc.)
    tags TEXT[] DEFAULT ARRAY[]::TEXT[],

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_catalog_items_tenant ON catalog_items (tenant_id, is_available_for_order);

-- ============================================================================
-- TABLE: tenant_customers (Customer CRM)
-- ============================================================================
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
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(tenant_id, phone_number)
);

-- ============================================================================
-- TABLE: chat_sessions & chat_messages (Persistent Memory)
-- ============================================================================
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

-- ============================================================================
-- TABLE: orders & mpesa_transactions
-- ============================================================================
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
-- Production payment, delivery, notification, and ledger records
-- ============================================================================
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

CREATE INDEX IF NOT EXISTS idx_payment_transactions_order ON payment_transactions(order_id);
CREATE INDEX IF NOT EXISTS idx_ledger_entries_tenant_created ON ledger_entries(tenant_id, created_at DESC);
