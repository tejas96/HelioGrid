/**
 * Proposal defaults' tenant (`SCR-M01-19`, `T-M01-030`), which the story and the spec both name.
 * Kept apart from any Playwright import: a story runs in the browser.
 */
export const COMPANY = 'Suryodaya Solar Pvt Ltd';

/** The company's two payment plans, as Payment terms holds them. */
export const PLANS = [
  { id: 'plan-standard', name: 'Standard 10/60/20/10', isDefault: true },
  { id: 'plan-short', name: 'Standard 30/60/10', isDefault: false },
] as const;

/** The default plan's parts, as the page holds them (`useDefaultsPlan`). */
export const PLAN_LINES = [
  { label: 'Advance on signing', percent: '10.00', dueOnStage: 'won' },
  { label: 'Before dispatch', percent: '60.00', dueOnStage: 'material_ordered' },
  { label: 'On installation', percent: '20.00', dueOnStage: 'installation' },
  { label: 'On commissioning', percent: '10.00', dueOnStage: 'commissioned' },
] as const;
