import { ROLE_PRESETS, type RolePreset } from '@heliogrid/domain';

/**
 * The QA companies `/task` step 7 drives, one per surface: each owner owns exactly one company, so a
 * sign-in always lands in it, and every name is unique, so no two people read alike. Every number
 * is in `DEV_OTP_PHONES` (`.env.example`), so its code is `DEV_OTP_CODE`. `web/qa-seed.setup.ts`
 * makes them through the api — sign-up, invite, accept — and is safe to run again.
 */
/* By place in F2's order, never by spelling: a role name is the permission model's to write. */
const [OWNER, , SALES, SURVEY, DESIGN, , , INSTALL] = ROLE_PRESETS;

export interface QaPerson {
  readonly name: string;
  readonly phoneE164: string;
  readonly roles: readonly [RolePreset, ...RolePreset[]];
}

export interface QaCompany {
  readonly surface: 'web' | 'ios' | 'android' | 'api' | 'api-second';
  readonly companyName: string;
  readonly owner: QaPerson;
  /** Joined by invite: a second EPC Owner, a three-preset member and a Sales Executive. */
  readonly members: readonly QaPerson[];
}

const company = (surface: QaCompany['surface'], label: string, first: number): QaCompany => {
  const phone = (offset: number) => `+9199999988${String(first + offset).padStart(2, '0')}`;
  return {
    surface,
    companyName: `QA ${label}`,
    owner: { name: `Owner ${label}`, phoneE164: phone(0), roles: [OWNER] },
    members: [
      { name: `Second Owner ${label}`, phoneE164: phone(1), roles: [OWNER] },
      { name: `Vikram ${label}`, phoneE164: phone(2), roles: [SURVEY, DESIGN, INSTALL] },
      { name: `Isha ${label}`, phoneE164: phone(3), roles: [SALES] },
    ],
  };
};

export const QA_COMPANIES: readonly QaCompany[] = [
  company('web', 'Web', 1),
  company('ios', 'iOS', 5),
  company('android', 'Android', 9),
  company('api', 'API One', 13),
  company('api-second', 'API Two', 17),
];
