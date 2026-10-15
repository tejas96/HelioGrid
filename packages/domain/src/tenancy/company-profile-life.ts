import type { CompanyProfilePart } from './company-profile';

/**
 * Where the company profile is met (`SCR-M01-05`): `setup`, the skippable third step of a new
 * company's corridor; `settings`, the same profile behind `More`, revisited inside the shell
 * (`M01-29`). The life decides the words, the chrome and what a save writes: only the setup
 * life records an onboarding step.
 */
export const COMPANY_PROFILE_LIVES = ['setup', 'settings'] as const;
export type CompanyProfileLife = (typeof COMPANY_PROFILE_LIVES)[number];

/**
 * The part a life opens on arrival when nothing is owed: setup the logo and the name, the part
 * already half answered; settings the two declarations, the reason to come back after setup
 * (`SCR-M01-05`, `m-default`, `m-settings`; the brief's ruling 58).
 */
export const FIRST_OPEN_PART = {
  setup: 'identity',
  settings: 'declarations',
} as const satisfies Record<CompanyProfileLife, CompanyProfilePart>;
