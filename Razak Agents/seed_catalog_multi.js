const https = require('https');
const SUPABASE_KEY = 'SUPABASE_KEY_PLACEHOLDER';
const SUPABASE_URL = 'https://muratasgegqmbkhmsevt.supabase.co/rest/v1';

function post(table, data) {
  return new Promise((resolve, reject) => {
    const bodyStr = JSON.stringify(data);
    const u = new URL(SUPABASE_URL + '/' + table);
    const req = https.request({
      hostname: u.hostname, path: u.pathname, method: 'POST',
      headers: {
        'apikey': SUPABASE_KEY, 'Authorization': 'Bearer ' + SUPABASE_KEY,
        'Content-Type': 'application/json', 'Prefer': 'return=representation',
        'Content-Length': Buffer.byteLength(bodyStr)
      }
    }, res => {
      let b = '';
      res.on('data', c => b += c);
      res.on('end', () => resolve({ status: res.statusCode, body: b }));
    });
    req.on('error', reject);
    req.write(bodyStr);
    req.end();
  });
}

const items = [
  {
    tenant_id: 'cc0889c5-76f6-4954-960a-a68542b7f6e8',
    item_type: 'product',
    name: 'Apple MacBook Air M2 13.6-inch (16GB RAM / 256GB SSD)',
    category: 'Laptops',
    description: 'Midnight Blue, Apple M2 chip, 16GB unified memory, 18-hour battery, Liquid Retina display. Brand new sealed.',
    base_price_kes: 155000.00,
    in_stock: true,
    stock_quantity: 6,
    is_available_for_order: true
  },
  {
    tenant_id: 'cc0889c5-76f6-4954-960a-a68542b7f6e8',
    item_type: 'product',
    name: 'iPhone 16 Pro Max 256GB Natural Titanium',
    category: 'Smartphones',
    description: 'A18 Pro chip, 48MP Fusion camera system, Action Button, 5G dual eSIM + physical SIM. 1-year Apple care.',
    base_price_kes: 215000.00,
    in_stock: true,
    stock_quantity: 4,
    is_available_for_order: true
  },
  {
    tenant_id: 'f0252d68-1fa9-499c-acf3-5acc4a0ca895',
    item_type: 'service',
    name: 'Nairobi to Mombasa Same-Day Express Cargo (Up to 15kg)',
    category: 'Express Freight',
    description: 'Guaranteed 8-hour doorstep delivery between Nairobi and Mombasa. Includes real-time GPS tracking and insured manifest.',
    base_price_kes: 3500.00,
    in_stock: true,
    stock_quantity: 999,
    is_available_for_order: true
  },
  {
    tenant_id: 'f0252d68-1fa9-499c-acf3-5acc4a0ca895',
    item_type: 'service',
    name: 'Upcountry Parcel Courier (All Kenya Towns, Up to 5kg)',
    category: 'Courier Services',
    description: 'Next-day morning dispatch to Kisumu, Nakuru, Eldoret, Nyeri, Meru, Machakos, and Kitale.',
    base_price_kes: 850.00,
    in_stock: true,
    stock_quantity: 999,
    is_available_for_order: true
  }
];

Promise.all(items.map(i => post('catalog_items', i))).then(res => {
  console.log('Catalog items seeded:', res.map(r => ({ status: r.status, body: r.status === 201 ? 'OK' : r.body })));
});
