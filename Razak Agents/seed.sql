-- ============================================================================
-- RAZAK ODIN: SINGLE PRODUCTION TENANT SEED
-- Business: P3L Developers (Nairobi, Kenya)
-- Owner: Razak Guyo (razakwako45@gmail.com, +254768141129)
-- Agent: Odin-P3L
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. SUBSCRIPTION PLANS IN DATABASE
-- ----------------------------------------------------------------------------
INSERT INTO subscription_plans (id, name, monthly_price_kes, monthly_message_quota, max_catalog_items, max_whatsapp_lines, features)
VALUES 
('test_and_trial', 'Test and Trial Plan', 0.00, 1000, 50, 1, '["gemini_flash", "single_line", "catalog_search", "basic_mpesa", "sheets_sync"]'::jsonb),
('business', 'Business Growth Plan', 10000.00, 10000, 500, 3, '["gemini_flash", "claude_sonnet", "multi_line", "mpesa_stk_push", "two_tier_escalation", "sheets_sync", "custom_prompts"]'::jsonb)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  monthly_price_kes = EXCLUDED.monthly_price_kes,
  monthly_message_quota = EXCLUDED.monthly_message_quota;

-- ----------------------------------------------------------------------------
-- 2. TENANT: P3L Developers
-- ----------------------------------------------------------------------------
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

-- ----------------------------------------------------------------------------
-- 3. WHATSAPP LINE (E.164: 254768141129)
-- ----------------------------------------------------------------------------
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

-- ----------------------------------------------------------------------------
-- 4. HUMAN ESCALATION ROSTER (2 Contacts)
-- ----------------------------------------------------------------------------
DELETE FROM tenant_escalation_contacts WHERE tenant_id = '11111111-1111-1111-1111-111111111111';

INSERT INTO tenant_escalation_contacts (
    tenant_id, priority_order, full_name, role_title, phone_number, email, notify_via_whatsapp, notify_via_email
) VALUES 
('11111111-1111-1111-1111-111111111111', 1, 'Razak Guyo', 'Founder & Lead Architect', '254768141129', 'razakwako45@gmail.com', true, true),
('11111111-1111-1111-1111-111111111111', 2, 'P3L Operations Desk', 'Technical Systems Engineer', '254714188858', 'support@p3ldev.com', true, true);

-- ----------------------------------------------------------------------------
-- 5. AGENT CONFIG (Odin-P3L)
-- ----------------------------------------------------------------------------
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

-- ----------------------------------------------------------------------------
-- 6. SUBSCRIPTION (Test and Trial Tier - 1,000 Messages Quota)
-- ----------------------------------------------------------------------------
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

-- ----------------------------------------------------------------------------
-- 7. REAL CATALOG ITEMS (4 Products & 3 Services)
-- ----------------------------------------------------------------------------
DELETE FROM catalog_items WHERE tenant_id = '11111111-1111-1111-1111-111111111111';

-- PRODUCT 1: Desktops
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

-- PRODUCT 2: Apple iPhones & MacBooks
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

-- PRODUCT 3: Laptops
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

-- PRODUCT 4: Tech Accessories & Gaming
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

-- SERVICE 1: Branding and Web Development
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

-- SERVICE 2: AI and Automations
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

-- SERVICE 3: IoT and Hardware Repairs
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
