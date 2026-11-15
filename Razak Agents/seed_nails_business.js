/**
 * Seed Script: Second Commercial Business in Supabase
 * Business: Luxe Nails & Spa Lounge (Kilimani, Nairobi)
 * Industry: Beauty, Wellness & Service Bookings
 */
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

const db = require('./db_service');

const NAILS_TENANT_ID = '22222222-2222-2222-2222-222222222222';

async function seedNailsBusiness() {
  console.log('🌸 Seeding Luxe Nails & Spa Lounge into Supabase Cloud DB...');

  // 1. Update Tenant
  const tenantPayload = {
    business_name: 'Luxe Nails & Spa Lounge',
    tagline: 'Premier Sculpted Nails, Russian Manicures & Luxury Spa Lounge',
    industry: 'custom',
    offering_type: 'hybrid_both',
    owner_full_name: 'Amina Wanjiku',
    owner_email: 'amina@luxenailske.com',
    owner_phone: '254722884400',
    physical_address: 'Wood Avenue Plaza, 3rd Floor, Kilimani, Nairobi',
    city: 'Nairobi',
    country: 'Kenya',
    currency: 'KES',
    operating_hours: { mon_sat: '09:00 AM - 07:30 PM', sun: '11:00 AM - 05:00 PM' },
    is_active: true,
    updated_at: new Date().toISOString()
  };

  try {
    await db.supabaseRequest(`/tenants?id=eq.${NAILS_TENANT_ID}`, 'PATCH', tenantPayload);
    console.log('✅ Updated tenant record for Luxe Nails.');
  } catch (e) {
    console.error('❌ Tenant insertion error:', e.message);
  }

  // 2. Agent Config: Bella-Luxe
  const agentPayload = {
    tenant_id: NAILS_TENANT_ID,
    agent_name: 'Bella-Luxe',
    tone_persona: 'Chic, warm, elegant, and highly attentive Senior Nail Stylist & VIP Appointment Concierge for Luxe Nails & Spa Lounge in Kilimani, Nairobi. Speaks in 100% polished, refined English. Consults on acrylic sets, Russian dry manicures, BIAB builder gels, deluxe spa pedicures, and nail art. Quotes exact KES prices and appointment durations in minutes. Books appointments, asks for client preferred time slots, and schedules bookings.',
    language_mode: 'english_only',
    welcome_message_template: 'Welcome to Luxe Nails & Spa Lounge, Kilimani. I am Bella, your Nail Stylist and Appointment Concierge. How may I pamper your hands or feet today?',
    allow_ai_negotiation: false,
    require_stk_confirmation: true,
    preferred_model: 'gemini-3.5-flash-lite',
    temperature: 0.3,
    max_tokens: 600,
    updated_at: new Date().toISOString()
  };

  try {
    const existingAgent = await db.supabaseRequest(`/tenant_agent_configs?tenant_id=eq.${NAILS_TENANT_ID}`, 'GET');
    if (existingAgent.data && existingAgent.data.length > 0) {
      await db.supabaseRequest(`/tenant_agent_configs?tenant_id=eq.${NAILS_TENANT_ID}`, 'PATCH', agentPayload);
      console.log('✅ Updated agent config for Bella-Luxe.');
    } else {
      await db.supabaseRequest('/tenant_agent_configs', 'POST', agentPayload);
      console.log('✅ Created agent config for Bella-Luxe.');
    }
  } catch (e) {
    console.error('❌ Agent config error:', e.message);
  }

  // 3. Subscription: Free Pilot / Business
  const subPayload = {
    tenant_id: NAILS_TENANT_ID,
    tier: 'free_pilot',
    status: 'active',
    monthly_price_kes: 12000,
    monthly_message_quota: 5000,
    max_catalog_items: 100,
    max_whatsapp_lines: 2,
    enable_mpesa_stk: true,
    enable_google_sheets_sync: true,
    enable_audio_transcription: true,
    enable_social_manager: true,
    mpesa_billing_phone: '254722884400',
    auto_renew: true,
    updated_at: new Date().toISOString()
  };

  try {
    const existingSub = await db.supabaseRequest(`/tenant_subscriptions?tenant_id=eq.${NAILS_TENANT_ID}`, 'GET');
    if (existingSub.data && existingSub.data.length > 0) {
      await db.supabaseRequest(`/tenant_subscriptions?tenant_id=eq.${NAILS_TENANT_ID}`, 'PATCH', subPayload);
      console.log('✅ Updated subscription for Luxe Nails.');
    } else {
      await db.supabaseRequest('/tenant_subscriptions', 'POST', subPayload);
      console.log('✅ Created subscription for Luxe Nails.');
    }
  } catch (e) {
    console.error('❌ Subscription error:', e.message);
  }

  // 4. Escalation Contact: Amina Wanjiku
  const contactPayload = {
    tenant_id: NAILS_TENANT_ID,
    full_name: 'Amina Wanjiku',
    role_title: 'Lead Stylist & Salon Manager',
    phone_number: '254722884400',
    email: 'amina@luxenailske.com',
    is_active: true,
    priority_order: 1
  };

  try {
    const existingContact = await db.supabaseRequest(`/tenant_escalation_contacts?tenant_id=eq.${NAILS_TENANT_ID}`, 'GET');
    if (existingContact.data && existingContact.data.length > 0) {
      await db.supabaseRequest(`/tenant_escalation_contacts?id=eq.${existingContact.data[0].id}`, 'PATCH', contactPayload);
    } else {
      await db.supabaseRequest('/tenant_escalation_contacts', 'POST', contactPayload);
    }
    console.log('✅ Seeded escalation contact for Luxe Nails.');
  } catch (e) {
    console.error('❌ Escalation contact error:', e.message);
  }

  // 5. WhatsApp Line: +254722884400
  const linePayload = {
    tenant_id: NAILS_TENANT_ID,
    phone_number: '254722884400',
    label: 'Luxe Nails WhatsApp Reception',
    provider: 'WAHA',
    is_primary: true,
    is_active: true,
    created_at: new Date().toISOString()
  };

  try {
    const existingLine = await db.supabaseRequest(`/tenant_whatsapp_lines?tenant_id=eq.${NAILS_TENANT_ID}`, 'GET');
    if (existingLine.data && existingLine.data.length > 0) {
      await db.supabaseRequest(`/tenant_whatsapp_lines?id=eq.${existingLine.data[0].id}`, 'PATCH', linePayload);
    } else {
      await db.supabaseRequest('/tenant_whatsapp_lines', 'POST', linePayload);
    }
    console.log('✅ Seeded WhatsApp line for Luxe Nails.');
  } catch (e) {
    console.error('❌ WhatsApp line error:', e.message);
  }

  // 6. Delete old catalog items for Luxe Nails and insert 10 luxury service items
  try {
    await db.supabaseRequest(`/catalog_items?tenant_id=eq.${NAILS_TENANT_ID}`, 'DELETE', null, 'return=minimal');
    console.log('🧹 Cleaned existing Luxe Nails service catalog.');
  } catch (e) {}

  const services = [
    {
      tenant_id: NAILS_TENANT_ID,
      item_type: 'service',
      category: 'Acrylics & Extensions',
      name: 'Full Set Sculpted Acrylic Nails (with Gel Polish & Shimmer)',
      description: 'Hand-sculpted acrylic nail extensions tailored to your desired length (short, medium, long, coffin, or almond) finished with premium chip-resistant gel polish, cuticle hydrator, and light hand massage.',
      base_price_kes: 3500,
      in_stock: true,
      stock_quantity: 99,
      is_available_for_order: true,
      service_duration_minutes: 90,
      requires_deposit: true,
      deposit_amount_kes: 1000,
      image_url: 'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=800'
    },
    {
      tenant_id: NAILS_TENANT_ID,
      item_type: 'service',
      category: 'Natural Nail Care & BIAB',
      name: 'Russian Dry Manicure & Builder Gel (BIAB) Apex Overlay',
      description: 'Precision E-file cuticle cleanup for spotless nail beds, followed by a durable Builder In A Bottle (BIAB) apex overlay to reinforce natural nail growth with zero lifting. Lasts up to 4 weeks.',
      base_price_kes: 4200,
      in_stock: true,
      stock_quantity: 99,
      is_available_for_order: true,
      service_duration_minutes: 75,
      requires_deposit: true,
      deposit_amount_kes: 1000,
      image_url: 'https://images.unsplash.com/photo-1632345031435-8727f6897d53?w=800'
    },
    {
      tenant_id: NAILS_TENANT_ID,
      item_type: 'service',
      category: 'Pedicure & Foot Spa',
      name: 'Deluxe Jelly Spa Pedicure with Callus Exfoliation & Hot Towel Massage',
      description: 'Aromatic therapeutic jelly foot bath, ultrasonic callus exfoliation, sea salt scrub, hydrating foot mask, hot steam towels, and relaxing 15-minute calf reflexology massage finished with gel toe polish.',
      base_price_kes: 3000,
      in_stock: true,
      stock_quantity: 99,
      is_available_for_order: true,
      service_duration_minutes: 60,
      requires_deposit: false,
      deposit_amount_kes: 0,
      image_url: 'https://images.unsplash.com/photo-1519014816548-bf5fe059798b?w=800'
    },
    {
      tenant_id: NAILS_TENANT_ID,
      item_type: 'service',
      category: 'Acrylics & Extensions',
      name: 'Ombré French Baby Boomer Fade with Pearl Chrome Finish',
      description: 'Seamless two-tone powder gradient fade from soft nude-pink to crisp white, buffed with glazed donut pearl chrome powder for an ethereal high-gloss shine.',
      base_price_kes: 4500,
      in_stock: true,
      stock_quantity: 99,
      is_available_for_order: true,
      service_duration_minutes: 90,
      requires_deposit: true,
      deposit_amount_kes: 1000,
      image_url: 'https://images.unsplash.com/photo-1599940824399-b87987ceb72a?w=800'
    },
    {
      tenant_id: NAILS_TENANT_ID,
      item_type: 'service',
      category: 'Natural Nail Care & BIAB',
      name: 'Express Gel Manicure & Organic Cuticle Nourishing Oil',
      description: 'Quick nail shaping, gentle buffing, cuticle push, dual LED-cured coats of luxury OPI/Gelish salon polish, and cold-pressed jojoba cuticle serum. Perfect for busy professionals on lunch break.',
      base_price_kes: 1800,
      in_stock: true,
      stock_quantity: 99,
      is_available_for_order: true,
      service_duration_minutes: 45,
      requires_deposit: false,
      deposit_amount_kes: 0,
      image_url: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800'
    },
    {
      tenant_id: NAILS_TENANT_ID,
      item_type: 'service',
      category: 'Nail Art & Luxury Sets',
      name: 'Hard Gel Extensions with Custom 3D Hand-Painted Nail Art',
      description: 'Sculptured hypoallergenic hard gel forms with bespoke freestyle hand-painted art, abstract chrome swirls, marble encapsulation, or 3D gel droplets designed by Master Stylist Amina.',
      base_price_kes: 5500,
      in_stock: true,
      stock_quantity: 99,
      is_available_for_order: true,
      service_duration_minutes: 105,
      requires_deposit: true,
      deposit_amount_kes: 1500,
      image_url: 'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=800'
    },
    {
      tenant_id: NAILS_TENANT_ID,
      item_type: 'service',
      category: 'Men\'s Grooming',
      name: 'Gentlemen\'s Executive Hand & Foot Grooming Spa',
      description: 'Discreet, meticulous nail trimming, cuticle tidy, dead skin removal, pumice callus buffing, unscented matte buff finish, and tension-relief warm towel massage.',
      base_price_kes: 3200,
      in_stock: true,
      stock_quantity: 99,
      is_available_for_order: true,
      service_duration_minutes: 60,
      requires_deposit: false,
      deposit_amount_kes: 0,
      image_url: 'https://images.unsplash.com/photo-1519014816548-bf5fe059798b?w=800'
    },
    {
      tenant_id: NAILS_TENANT_ID,
      item_type: 'service',
      category: 'Restoration & Care',
      name: 'Safe Gel/Acrylic Soak-Off & Intensive Keratin Recovery Treatment',
      description: 'Foil-wrapped gentle acetone soak-off with zero nail plate scraping or thinning, followed by an intensive IBX keratin bonding treatment and vitamin E nail bath.',
      base_price_kes: 1200,
      in_stock: true,
      stock_quantity: 99,
      is_available_for_order: true,
      service_duration_minutes: 30,
      requires_deposit: false,
      deposit_amount_kes: 0,
      image_url: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800'
    },
    {
      tenant_id: NAILS_TENANT_ID,
      item_type: 'service',
      category: 'Add-On Enhancements',
      name: 'Swarovski Crystal & Encapsulated Gold Foil Accent (Pair of Nails)',
      description: 'Genuine Swarovski flatback crystal clusters or 24K gold metallic leaf encapsulation sealed with diamond-hard gel topcoat.',
      base_price_kes: 800,
      in_stock: true,
      stock_quantity: 99,
      is_available_for_order: true,
      service_duration_minutes: 15,
      requires_deposit: false,
      deposit_amount_kes: 0,
      image_url: 'https://images.unsplash.com/photo-1599940824399-b87987ceb72a?w=800'
    },
    {
      tenant_id: NAILS_TENANT_ID,
      item_type: 'service',
      category: 'Luxury Combo Packages',
      name: 'Luxe Signature Bridal & VIP Pampering Package (Hands & Feet Combo)',
      description: 'The ultimate head-to-toe nail suite: Full sculpted acrylics/BIAB with bridal custom art, Deluxe Jelly Foot Spa, paraffin dip for baby-soft hands, and complimentary glass of sparkling wine.',
      base_price_kes: 7500,
      in_stock: true,
      stock_quantity: 99,
      is_available_for_order: true,
      service_duration_minutes: 135,
      requires_deposit: true,
      deposit_amount_kes: 2500,
      image_url: 'https://images.unsplash.com/photo-1632345031435-8727f6897d53?w=800'
    }
  ];

  for (const s of services) {
    try {
      await db.supabaseRequest('/catalog_items', 'POST', s);
    } catch (e) {
      console.warn('Warning inserting service:', s.name, e.message);
    }
  }

  console.log(`✨ Successfully seeded 10 luxury nail & spa services for Luxe Nails!`);
}

seedNailsBusiness().then(() => {
  console.log('🎉 Seeding complete. Exiting.');
  process.exit(0);
}).catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
