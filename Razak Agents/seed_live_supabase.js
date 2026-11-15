const SUPABASE_KEY = 'SUPABASE_KEY_PLACEHOLDER';
const SUPABASE_URL = 'https://muratasgegqmbkhmsevt.supabase.co/rest/v1';

async function seedLiveDatabase() {
  console.log('Seeding P3L Developers into live Supabase database...');
  const tenantId = '11111111-1111-1111-1111-111111111111';

  // 1. Clear old catalog items for this tenant
  await fetch(SUPABASE_URL + '/catalog_items?tenant_id=eq.' + tenantId, {
    method: 'DELETE',
    headers: { 'apikey': SUPABASE_KEY, 'Authorization': 'Bearer ' + SUPABASE_KEY }
  });

  // 2. Insert 4 Products + 3 Services
  const items = [
    {
      tenant_id: tenantId,
      item_type: 'product',
      category: 'Desktops',
      name: 'Custom High-Performance Workstation & Gaming Desktop PC',
      description: 'Intel Core i7 13th Gen / Ryzen 7, 32GB DDR5 RAM, 1TB NVMe Gen4 SSD, NVIDIA RTX 4070 12GB GPU, 240mm Liquid Cooler, 750W 80+ Gold PSU. Ideal for 3D modeling, coding, and 4K gaming.',
      base_price_kes: 185000.00,
      in_stock: true,
      stock_quantity: 5,
      is_available_for_order: true
    },
    {
      tenant_id: tenantId,
      item_type: 'product',
      category: 'Apple iPhones & MacBooks',
      name: 'Apple MacBook Pro 14" (M3 Chip, 18GB Unified Memory, 512GB SSD)',
      description: 'Space Black, Apple M3 11-core CPU / 14-core GPU, 14.2-inch Liquid Retina XDR screen, 120Hz ProMotion, MagSafe 3 charging. Brand new factory sealed with 1-year Apple Warranty.',
      base_price_kes: 265000.00,
      in_stock: true,
      stock_quantity: 4,
      is_available_for_order: true
    },
    {
      tenant_id: tenantId,
      item_type: 'product',
      category: 'Laptops',
      name: 'HP Victus 15 Gaming & Engineering Laptop (Core i7, 16GB RAM, RTX 4050)',
      description: 'Intel Core i7-13620H 10-Core Processor, 16GB DDR5 RAM, 512GB PCIe NVMe SSD, NVIDIA RTX 4050 6GB GDDR6, 15.6" FHD 144Hz display, Backlit Keyboard. Built for power programming and simulation.',
      base_price_kes: 128000.00,
      in_stock: true,
      stock_quantity: 7,
      is_available_for_order: true
    },
    {
      tenant_id: tenantId,
      item_type: 'product',
      category: 'Tech Accessories & Gaming',
      name: 'Pro Tri-Mode Wireless Mechanical Keyboard & Gaming Mouse Combo',
      description: 'RGB Backlit Hot-Swappable Mechanical Keyboard (Bluetooth 5.0 + 2.4GHz + Type-C) with an Ergonomic Ultra-Lightweight 16,000 DPI Gaming Mouse and fast charging dock.',
      base_price_kes: 8500.00,
      in_stock: true,
      stock_quantity: 25,
      is_available_for_order: true
    },
    {
      tenant_id: tenantId,
      item_type: 'service',
      category: 'Branding and Web Development',
      name: 'Full-Stack Custom Web Development & Brand Identity Sprint',
      description: 'Modern high-converting web apps, client portals, and e-commerce websites built with Next.js, Tailwind CSS, Supabase/Node.js. Includes logo, brand style guide, and SEO setup. Turnaround: 10-14 days.',
      base_price_kes: 45000.00,
      service_duration_minutes: 14400,
      requires_deposit: true,
      deposit_amount_kes: 22500.00,
      is_available_for_order: true
    },
    {
      tenant_id: tenantId,
      item_type: 'service',
      category: 'AI and Automations',
      name: 'Autonomous WhatsApp AI Sales Agent & Business Process Automation',
      description: 'Custom AI sales and care agent connected to your WhatsApp number. Features intelligent catalog search, automatic M-Pesa STK push checkout, 2-tier human takeover alerts, and real-time Google Sheets sync. Deployment: 3-5 days.',
      base_price_kes: 35000.00,
      service_duration_minutes: 7200,
      requires_deposit: true,
      deposit_amount_kes: 17500.00,
      is_available_for_order: true
    },
    {
      tenant_id: tenantId,
      item_type: 'service',
      category: 'IoT and Hardware Repairs',
      name: 'Smart IoT Telemetry Systems & Precision Hardware Repair',
      description: 'Custom IoT sensor builds and remote monitoring, plus expert chip-level laptop & desktop motherboard repair, diagnostic troubleshooting, screen/keyboard replacements, and hardware upgrades.',
      base_price_kes: 5000.00,
      service_duration_minutes: 1440,
      requires_deposit: false,
      deposit_amount_kes: 0.00,
      is_available_for_order: true
    }
  ];

  let insertedCount = 0;
  for (const item of items) {
    const res = await fetch(SUPABASE_URL + '/catalog_items', {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': 'Bearer ' + SUPABASE_KEY,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify([item])
    });

    if (res.ok) {
      insertedCount++;
      console.log(`✅ [${insertedCount}/7] Inserted: ${item.name} (${item.category}) - KES ${item.base_price_kes.toLocaleString()}`);
    } else {
      console.error(`❌ Failed on ${item.name}:`, res.status, await res.text());
    }
  }

  console.log(`\n🎉 All ${insertedCount} real offerings inserted into live Supabase!`);
}

seedLiveDatabase().catch(console.error);
