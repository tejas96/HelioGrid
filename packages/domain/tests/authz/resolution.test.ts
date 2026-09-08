import { describe, expect, it } from 'vitest';
import type { Capability } from '../../src/authz/capabilities';
import { VISIBILITY_DOMAINS, type VisibilityDomain } from '../../src/authz/cells';
import { can, grantedCapabilities, limitsOn, visibilityIn } from '../../src/authz/policy';
import type { RolePreset } from '../../src/authz/roles';
import { NO_VISIBILITY, resolveVisibility, VISIBILITY_MATRIX } from '../../src/authz/visibility';

const fixedDomains = Object.keys(VISIBILITY_MATRIX) as VisibilityDomain[];

describe('F2-10, F2-11, F2-13 — a rep who also surveys: OR on grants, widest on scope', () => {
  const pair: readonly RolePreset[] = ['sales_executive', 'survey_engineer'];

  it('sees own leads, with the assigned ones beside, and the rep is the role doing the work', () => {
    expect(visibilityIn(pair, 'leads')).toEqual({
      scope: 'own',
      includesAssigned: true,
      through: [],
      grantedBy: ['sales_executive'],
    });
  });

  it.each<Capability>(['crm.add_edit_leads', 'survey.capture_surveys'])(
    'holds %s — one preset’s grant is enough',
    (capability) => {
      expect(can(pair, capability)).toBe(true);
    },
  );

  it('an outright grant beside a limited one is outright: the limit vanishes', () => {
    expect(limitsOn(['finance'], 'onboarding.manage_catalog')).toEqual(['view prices & margins']);
    expect(limitsOn(['finance', 'operations'], 'onboarding.manage_catalog')).toEqual([]);
  });

  it('two limited grants compose to both phrases, each once', () => {
    expect(limitsOn(['epc_owner', 'sales_manager'], 'field.attendance_visibility')).toEqual([
      'All',
      'Team',
    ]);
    expect(limitsOn(['epc_owner', 'epc_owner'], 'field.attendance_visibility')).toEqual(['All']);
  });

  it('a capability nobody holds has no limit either — can says which', () => {
    expect(can(['marketing'], 'onboarding.manage_catalog')).toBe(false);
    expect(limitsOn(['marketing'], 'onboarding.manage_catalog')).toEqual([]);
  });
});

describe('F2-14 — a manager who also does field work: one domain never widens another', () => {
  const pair: readonly RolePreset[] = ['sales_manager', 'field_technician'];

  it.each([
    ['leads', 'team', ['sales_manager']],
    ['field_work', 'own', ['field_technician']],
  ] as const)('%s resolves to %s, granted by %j', (domain, scope, grantedBy) => {
    expect(visibilityIn(pair, domain)).toEqual({
      scope,
      includesAssigned: false,
      through: [],
      grantedBy,
    });
  });

  it('a domain with no fixed row answers none', () => {
    expect(fixedDomains).not.toContain('money');
    expect(visibilityIn(['epc_owner'], 'money')).toEqual(NO_VISIBILITY);
  });

  it('a cell that reads through projects is carried, never folded onto the leads ladder', () => {
    expect(visibilityIn(['operations', 'sales_executive'], 'leads')).toEqual({
      scope: 'own',
      includesAssigned: false,
      through: [{ domain: 'projects', scope: 'portfolio' }],
      grantedBy: ['sales_executive'],
    });
  });
});

describe('F2-12 — the same surface, scoped by role', () => {
  it.each([
    ['sales_executive', 'own'],
    ['sales_manager', 'team'],
    ['epc_owner', 'all'],
  ] as const)('%s sees %s in leads', (preset, scope) => {
    expect(visibilityIn([preset], 'leads').scope).toBe(scope);
  });

  it.each(fixedDomains)('the EPC Owner sees all in %s — everything, always', (domain) => {
    expect(visibilityIn(['epc_owner'], domain).scope).toBe('all');
  });
});

describe('F2-15 — the answer is a function of the preset SET and nothing else', () => {
  const stack: readonly RolePreset[] = ['sales_manager', 'field_technician', 'finance'];
  const shuffled: readonly RolePreset[] = ['finance', 'field_technician', 'sales_manager'];
  const doubled: readonly RolePreset[] = [...stack, 'sales_manager', 'finance'];

  it.each([
    ['reversed', shuffled],
    ['with duplicates', doubled],
  ] as const)('visibility in every domain is the same %s', (_, variant) => {
    for (const domain of VISIBILITY_DOMAINS) {
      expect(visibilityIn(variant, domain)).toEqual(visibilityIn(stack, domain));
    }
  });

  it.each([
    ['reversed', shuffled],
    ['with duplicates', doubled],
  ] as const)('the granted capabilities and their limits are the same %s', (_, variant) => {
    expect(grantedCapabilities(variant)).toEqual(grantedCapabilities(stack));
    for (const capability of grantedCapabilities(stack)) {
      expect(limitsOn(variant, capability)).toEqual(limitsOn(stack, capability));
    }
  });

  it('two limit phrases come back in matrix order whatever order the roles came in', () => {
    const forward = limitsOn(['epc_owner', 'sales_manager'], 'field.attendance_visibility');
    const backward = limitsOn(['sales_manager', 'epc_owner'], 'field.attendance_visibility');
    expect(backward).toEqual(forward);
    expect(forward).toEqual(['All', 'Team']);
  });

  it('two presets on the winning rung are named in matrix order whatever order they came in', () => {
    const forward = visibilityIn(['sales_executive', 'marketing'], 'leads');
    const backward = visibilityIn(['marketing', 'sales_executive'], 'leads');
    expect(backward).toEqual(forward);
    expect(forward.grantedBy).toEqual(['sales_executive', 'marketing']);
  });

  it('two presets reaching through the same rung are carried once', () => {
    expect(
      resolveVisibility(
        [
          ['project_manager', { scope: 'own', qualifier: 'x', through: 'projects' }],
          ['operations', { scope: 'own', qualifier: 'y', through: 'projects' }],
        ],
        ['own', 'team', 'all'],
      ).through,
    ).toEqual([{ domain: 'projects', scope: 'own' }]);
  });

  it('zero presets grant nothing anywhere — an invitee with no role is blocked', () => {
    expect(grantedCapabilities([])).toEqual([]);
    expect(can([], 'crm.add_edit_leads')).toBe(false);
    for (const domain of VISIBILITY_DOMAINS) {
      expect(visibilityIn([], domain)).toEqual(NO_VISIBILITY);
    }
  });
});

describe('resolveVisibility at its edges', () => {
  const ladder = ['own', 'team', 'all'] as const;

  it('no cells → none', () => {
    expect(resolveVisibility([], ladder)).toEqual(NO_VISIBILITY);
  });

  it('assigned alone → none, with assigned noted', () => {
    expect(resolveVisibility([['survey_engineer', { scope: 'assigned' }]], ladder)).toEqual({
      ...NO_VISIBILITY,
      includesAssigned: true,
    });
  });

  it('a rung the ladder does not carry never wins', () => {
    expect(resolveVisibility([['operations', { scope: 'portfolio' }]], ladder).scope).toBe('none');
  });

  it('the widest rung wins and every preset on it is named', () => {
    expect(
      resolveVisibility(
        [
          ['sales_executive', { scope: 'own' }],
          ['sales_manager', { scope: 'team' }],
          ['operations', { scope: 'team' }],
        ],
        ladder,
      ),
    ).toEqual({
      scope: 'team',
      includesAssigned: false,
      through: [],
      grantedBy: ['sales_manager', 'operations'],
    });
  });
});
