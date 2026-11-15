/**
 * Feature 08: Pre-Built Vertical Templates
 * Ready-to-deploy configurations for high-demand Kenyan business verticals.
 */

const TEMPLATES = [
  {
    id: 'electronics_laptop',
    name: 'Electronics & Laptop Tech Shop',
    industry: 'Consumer Tech & Hardware',
    badge: 'P3L Active Default',
    description: 'Hardware specs consultation, KES pricing, 1-year warranty policies, motherboard/screen repairs, and Nairobi express courier.',
    sampleQuery: 'What laptops do you have for heavy coding and Docker?',
    systemPromptSupplement: 'You are Odin, Senior Technical Sales & Hardware Specialist for P3L Developers and Tech Shop in Nairobi, Kenya. You specialize in high-end dev laptops (MacBook Pro/Air, Lenovo ThinkPad/Legion, HP Victus), screen replacements, and motherboard diagnostics. All pricing is in KES.'
  },
  {
    id: 'boutique_fashion',
    name: 'Boutique Fashion & Luxury Streetwear',
    industry: 'Retail & Luxury Streetwear',
    badge: 'Ready to Deploy',
    description: 'Size recommendations, fabric details, stock availability, same-day Nairobi rider dispatch.',
    sampleQuery: 'Do you have evening silk gowns in size Medium?',
    systemPromptSupplement: 'You are an upscale fashion stylist and customer care specialist for a Nairobi boutique. You recommend outfits, size fits, fabric care, and coordinate same-day courier delivery.'
  },
  {
    id: 'pharmacy_health',
    name: 'Pharmacies & Healthcare Supplies',
    industry: 'Health & Wellness',
    badge: 'Ready to Deploy',
    description: 'Prescription fulfillment, OTC medicines, wellness supplements, licensed pharmacist escalation.',
    sampleQuery: 'Can I drop off a prescription for home delivery in Kilimani?',
    systemPromptSupplement: 'You are a healthcare concierge for a licensed community pharmacy in Nairobi. You assist customers with wellness products, prescription delivery logistics, and escalate medical queries to the licensed on-duty pharmacist.'
  },
  {
    id: 'car_dealership',
    name: 'Car Dealerships & Auto Sales',
    industry: 'Automotive & Fleet',
    badge: 'Ready to Deploy',
    description: 'Japanese & European import specs, test drive scheduling, and asset financing consultations.',
    sampleQuery: 'What is the price of the 2019 Mazda CX-5 and can I book a test drive?',
    systemPromptSupplement: 'You are a luxury automotive sales executive for a Nairobi car dealership. You provide vehicle specifications, import duty breakdowns, financing options with local banks, and schedule test drives.'
  }
];

let activeTemplateId = 'electronics_laptop';

function getTemplates() {
  return TEMPLATES.map(t => ({
    ...t,
    isActive: t.id === activeTemplateId
  }));
}

function getActiveTemplate() {
  return TEMPLATES.find(t => t.id === activeTemplateId) || TEMPLATES[0];
}

function setActiveTemplate(templateId) {
  const found = TEMPLATES.find(t => t.id === templateId);
  if (found) {
    activeTemplateId = found.id;
    return { success: true, activeTemplate: found };
  }
  return { success: false, error: 'Template not found' };
}

module.exports = {
  TEMPLATES,
  getTemplates,
  getActiveTemplate,
  setActiveTemplate
};
