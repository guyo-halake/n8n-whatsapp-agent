/**
 * Feature 02: Standardized Tier Pricing Packages
 * Standard commercial offerings for Kenyan retail & service businesses.
 */

const PRICING_PACKAGES = [
  {
    id: 'starter',
    name: 'Starter Package',
    priceKES: 4500,
    priceUSD: 35,
    tagline: 'Ideal for solo entrepreneurs and single-product merchants.',
    features: [
      '1 Connected WhatsApp Business Number',
      'Up to 1,000 automated conversations/month',
      'Standard Product Catalog & RAG search',
      'Manual M-Pesa Pochi & Paybill instructions',
      'P3L Hosted Cloud Infrastructure',
      '99.5% Uptime SLA Guarantee'
    ]
  },
  {
    id: 'pro',
    name: 'Pro Package',
    popular: true,
    priceKES: 12000,
    priceUSD: 95,
    tagline: 'High-converting engine for active retail, hardware, and service shops.',
    features: [
      '1-2 WhatsApp Business Numbers',
      'Up to 5,000 automated conversations/month',
      'Shared Human Operator Inbox & Instant Takeover',
      'Automated Safaricom Daraja STK Push Integration',
      'Sheng, English & Adaptive Bilingual Dialect Toggle',
      'Business Hours & Night Auto-Routing',
      'Weekly ROI & Analytics Automation Reports',
      '99.9% Production SLA Guarantee'
    ]
  },
  {
    id: 'enterprise',
    name: 'Enterprise Package',
    priceKES: 35000,
    priceUSD: 275,
    tagline: 'Custom omnichannel automations for multi-branch companies.',
    features: [
      'Unlimited WhatsApp Conversations & Multi-agent routes',
      'Full Supabase / PostgreSQL & CRM Database Sync',
      'Custom Multi-Document RAG Pipelines (PDF/CSV/APIs)',
      'Dedicated 15-Minute Response Support SLA',
      'Custom Workflow Engineering Sprint included',
      'Founder Architecture & Growth Advisory'
    ]
  }
];

let currentTierId = 'pro';

function getPackages() {
  return PRICING_PACKAGES.map(pkg => ({
    ...pkg,
    isActive: pkg.id === currentTierId
  }));
}

function getPackageById(id) {
  return PRICING_PACKAGES.find(p => p.id === id) || PRICING_PACKAGES[1];
}

function setActiveTier(tierId) {
  const pkg = PRICING_PACKAGES.find(p => p.id === tierId);
  if (pkg) {
    currentTierId = pkg.id;
    return { success: true, activeTier: pkg };
  }
  return { success: false, error: 'Package not found' };
}

function getCurrentTier() {
  return getPackageById(currentTierId);
}

module.exports = {
  PRICING_PACKAGES,
  getPackages,
  getPackageById,
  setActiveTier,
  getCurrentTier
};
