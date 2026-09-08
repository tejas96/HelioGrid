import { describe, expect, it } from 'vitest';
import type { Capability } from '../../src/authz/capabilities';
import { can, limitsOn, visibilityIn } from '../../src/authz/policy';
import { ROLE_PRESETS } from '../../src/authz/roles';

describe('F2-03 — design sign-off is a capability of the Design Engineer preset', () => {
  it.each(ROLE_PRESETS)('%s approves designs only as EPC Owner or Design Engineer', (preset) => {
    expect(can([preset], 'studio.approve_designs')).toBe(
      preset === 'epc_owner' || preset === 'design_engineer',
    );
  });
});

describe('F2-08 — Sales Manager is the direct successor of the v1 Manager preset', () => {
  /** The v1 `Manager` matrix grants, by their V2 row (journey L1443–1461). */
  const carriedGrants: readonly Capability[] = [
    'crm.add_edit_leads',
    'crm.assign_leads',
    'survey.capture_surveys',
    'proposals.create_edit_proposals',
    'proposals.send_proposals',
    'projects.update_stages',
    'projects.project_documents',
    'payments.record_payments',
    'sales.agent_performance',
    'reports.company_reports',
  ];

  it.each(carriedGrants)('holds %s', (capability) => {
    expect(can(['sales_manager'], capability)).toBe(true);
  });

  it('sees the team’s leads — the v1 "Team lead visibility" cell', () => {
    expect(visibilityIn(['sales_manager'], 'leads')).toEqual({
      scope: 'team',
      includesAssigned: false,
      through: [],
      grantedBy: ['sales_manager'],
    });
  });
});

describe('F2-14 — a cell that reads through another domain is carried, never folded or dropped', () => {
  it.each([
    ['operations', 'portfolio'],
    ['project_manager', 'own'],
  ] as const)('%s reaches leads through the projects rung %s', (preset, rung) => {
    expect(visibilityIn([preset], 'leads')).toEqual({
      scope: 'none',
      includesAssigned: false,
      through: [{ domain: 'projects', scope: rung }],
      grantedBy: [],
    });
  });

  it('sees company reports team-scoped, the one v1 grant that carries a phrase', () => {
    expect(limitsOn(['sales_manager'], 'reports.company_reports')).toEqual(['team-scoped']);
  });
});
