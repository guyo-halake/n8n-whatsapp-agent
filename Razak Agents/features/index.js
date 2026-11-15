/**
 * Central Commercial Features Registry
 * Exports the 10 production commercial client features.
 */
const qrOnboarding = require('./01_qr_onboarding');
const pricingPackages = require('./02_pricing_packages');
const mpesaBilling = require('./03_mpesa_billing');
const knowledgeBase = require('./04_knowledge_base');
const operatorInbox = require('./05_operator_inbox');
const roiAnalytics = require('./06_roi_analytics');
const businessHours = require('./07_business_hours');
const industryTemplates = require('./08_industry_templates');
const dialectModes = require('./09_dialect_modes');
const slaGuarantee = require('./10_sla_guarantee');

module.exports = {
  qrOnboarding,
  pricingPackages,
  mpesaBilling,
  knowledgeBase,
  operatorInbox,
  roiAnalytics,
  businessHours,
  industryTemplates,
  dialectModes,
  slaGuarantee
};
