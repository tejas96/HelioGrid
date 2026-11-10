import { describe, expect, it } from 'vitest';
import type { RolePreset } from '../../src/authz/roles';
import { type DedupeMatch, dedupeSheetOf } from '../../src/crm/dedupe-facts';

const PRIYA: DedupeMatch = {
  customerId: 'customer-priya',
  leadId: 'lead-priya',
  name: 'Priya Sharma',
  city: 'Nashik',
  ownerName: 'Rajesh',
  stage: 'contacted',
  lastContactAt: Date.parse('2026-11-05T06:00:00Z'),
  inScope: true,
};

describe('the dedupe sheet (M02-08, M02-09)', () => {
  it('the sheet shows owner, stage and last contact, and only those when the record is out of scope', () => {
    expect(dedupeSheetOf(PRIYA, ['sales_executive']).record).toEqual({
      kind: 'visible',
      customerId: 'customer-priya',
      leadId: 'lead-priya',
      name: 'Priya Sharma',
      city: 'Nashik',
      ownerName: 'Rajesh',
      stage: 'contacted',
      lastContactAt: PRIYA.lastContactAt,
    });
    const outside = dedupeSheetOf({ ...PRIYA, inScope: false }, ['sales_executive']).record;
    expect(outside).toEqual({
      kind: 'out_of_scope',
      ownerName: 'Rajesh',
      stage: 'contacted',
      lastContactAt: PRIYA.lastContactAt,
    });
    expect(Object.keys(outside).sort()).toEqual(['kind', 'lastContactAt', 'ownerName', 'stage']);
  });

  it.each([
    [true, 'record'],
    [false, 'ask_owner'],
  ] as const)('in scope %s, open existing opens the %s', (inScope, opens) => {
    expect(dedupeSheetOf({ ...PRIYA, inScope }, ['sales_executive']).choices).toEqual([
      { choice: 'open_existing', opens },
      { choice: 'log_enquiry' },
      { choice: 'keep_both', available: true, needsReason: true },
    ]);
  });

  it.each<[readonly RolePreset[], boolean]>([
    [['epc_owner'], true],
    [['sales_manager'], true],
    [['sales_executive'], true],
    [['marketing'], false],
    [['survey_engineer'], false],
    [['marketing', 'sales_executive'], true],
    [[], false],
  ])('%j may keep both: %s', (roles, available) => {
    const [, , keepBoth] = dedupeSheetOf(PRIYA, roles).choices;
    expect(keepBoth).toEqual({ choice: 'keep_both', available, needsReason: true });
  });

  it('an unassigned record with no contact yet shows both facts as absent', () => {
    const fresh = { ...PRIYA, ownerName: null, stage: 'new', lastContactAt: null } as const;
    expect(dedupeSheetOf({ ...fresh, inScope: false }, []).record).toEqual({
      kind: 'out_of_scope',
      ownerName: null,
      stage: 'new',
      lastContactAt: null,
    });
  });

  it('a customer captured with the number alone shows in scope with no name', () => {
    expect(dedupeSheetOf({ ...PRIYA, name: null }, []).record).toMatchObject({
      kind: 'visible',
      name: null,
    });
  });
});
