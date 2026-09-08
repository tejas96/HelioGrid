import { describe, expect, it } from 'vitest';
import { acceptsAdministration, keepsControl } from '../../src/authz/administration';
import { can } from '../../src/authz/policy';
import { ROLE_PRESETS, type RolePreset } from '../../src/authz/roles';
import type { MembershipStatus } from '../../src/tenancy/membership';

describe('F2-19 — keepsControl: the company always keeps an EPC Owner and someone who can manage the team', () => {
  it.each<{ held: readonly RolePreset[]; keeps: boolean; why: string }>([
    { held: [], keeps: false, why: 'nobody left holds anything' },
    {
      held: ['sales_manager', 'finance', 'hr_admin'],
      keeps: false,
      why: 'a full team without an owner has nobody who can manage it',
    },
    { held: ['epc_owner'], keeps: true, why: 'one owner is the floor' },
    {
      held: ['field_technician', 'epc_owner', 'sales_executive'],
      keeps: true,
      why: 'the owner may sit anywhere in the list',
    },
    { held: ['epc_owner', 'epc_owner'], keeps: true, why: 'a second owner changes only the count' },
  ])('$why', ({ held, keeps }) => {
    expect(keepsControl(held)).toBe(keeps);
  });

  it('a sole owner keeps the company in control through a change that keeps Owner, and loses it through one that drops it', () => {
    const others: readonly RolePreset[] = ['sales_executive', 'survey_engineer'];
    expect(keepsControl([...others, 'epc_owner', 'design_engineer'])).toBe(true);
    expect(keepsControl([...others, 'design_engineer'])).toBe(false);
  });

  it('in this matrix only the owner grants Manage team, so one refusal names both clauses', () => {
    const managers = ROLE_PRESETS.filter((preset) => can([preset], 'onboarding.manage_team'));
    expect(managers).toEqual(['epc_owner']);
  });
});

describe('F2-20 — acceptsAdministration: roles change and access ends on an active membership only', () => {
  it.each<{ status: MembershipStatus; accepts: boolean; why: string }>([
    { status: 'invited', accepts: false, why: 'an invited person has not joined yet' },
    { status: 'active', accepts: true, why: 'an active person can be changed' },
    {
      status: 'deactivated',
      accepts: false,
      why: 'a deactivated person keeps their presets as history',
    },
  ])('$why', ({ status, accepts }) => {
    expect(acceptsAdministration(status)).toBe(accepts);
  });
});
