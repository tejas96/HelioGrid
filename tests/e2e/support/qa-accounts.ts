import { ROLE_PRESETS, type RolePreset } from '@heliogrid/domain';

/**
 * The QA companies `qa-live` signs in as, one per surface: each owner owns exactly one company, so a
 * sign-in always lands in it, and every name is unique, so no two people read alike. Every number is
 * written out, so a reader copies it and never works it out. Each is in `DEV_OTP_PHONES`
 * (`.env.example`), so its code is `DEV_OTP_CODE`; a number left out fails the seed's sign-in.
 * `web/qa-seed.setup.ts` makes them through the api — sign-up, invite, accept — and is safe to run
 * again.
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

/** The owner first, then the second owner, the three-preset member and the Sales Executive. */
type FourPhones = readonly [string, string, string, string];

const company = (surface: QaCompany['surface'], label: string, phones: FourPhones): QaCompany => {
  const [owner, secondOwner, vikram, isha] = phones;
  return {
    surface,
    companyName: `QA ${label}`,
    owner: { name: `Owner ${label}`, phoneE164: owner, roles: [OWNER] },
    members: [
      { name: `Second Owner ${label}`, phoneE164: secondOwner, roles: [OWNER] },
      { name: `Vikram ${label}`, phoneE164: vikram, roles: [SURVEY, DESIGN, INSTALL] },
      { name: `Isha ${label}`, phoneE164: isha, roles: [SALES] },
    ],
  };
};

export const QA_COMPANIES: readonly QaCompany[] = [
  company('web', 'Web', ['+919999998801', '+919999998802', '+919999998803', '+919999998804']),
  company('ios', 'iOS', ['+919999998805', '+919999998806', '+919999998807', '+919999998808']),
  company('android', 'Android', [
    '+919999998809',
    '+919999998810',
    '+919999998811',
    '+919999998812',
  ]),
  company('api', 'API One', ['+919999998813', '+919999998814', '+919999998815', '+919999998816']),
  company('api-second', 'API Two', [
    '+919999998817',
    '+919999998818',
    '+919999998819',
    '+919999998820',
  ]),
];
