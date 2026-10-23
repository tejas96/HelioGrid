import { describe, expect, it } from 'vitest';
import { CAPABILITY_MATRIX } from '../../src/authz/capabilities';
import {
  ROLE_CARD_LIMITS,
  ROLE_CARD_LINES,
  type RoleCardLineKey,
  roleCard,
} from '../../src/authz/role-card';
import { ROLE_PRESETS, type RolePreset } from '../../src/authz/roles';

const SALES_EXECUTIVE_GRANTS: readonly RoleCardLineKey[] = [
  'leads_own',
  'leads_edit',
  'site_survey',
  'proposals_edit',
  'proposals_send',
  'won_lost',
];
const SALES_EXECUTIVE_LIMITS: readonly RoleCardLineKey[] = [
  'leads_assign',
  'leads_delete',
  'stages_update',
  'payments_record',
  'reports_company',
  'company_settings',
];

const lineOf = (key: RoleCardLineKey) => ROLE_CARD_LINES.find((line) => line.key === key);

describe('SCR-M01-10 — the Sales Executive alone reads the board', () => {
  const card = roleCard(['sales_executive']);

  it('six grants and six limits, in the board order', () => {
    expect(card.grants).toEqual(SALES_EXECUTIVE_GRANTS);
    expect(card.limits).toEqual(SALES_EXECUTIVE_LIMITS);
  });

  it('names no money cell beyond its scope', () => {
    expect(card.grants).not.toContain('payments_record');
    expect(card.limits).toContain('payments_record');
  });

  it('carries the owner note: only the owner adds a teammate', () => {
    expect(card.ownerNote).toBe(true);
  });
});

describe('ruling 4 — stacked presets take the union, and a limit one preset lifts is no limit', () => {
  const card = roleCard(['design_engineer', 'sales_executive']);

  it('eight grants: the Sales Executive six and the designs', () => {
    expect(card.grants).toEqual([...SALES_EXECUTIVE_GRANTS, 'designs_edit', 'designs_approve']);
  });

  it('Design Engineer lists sending proposals, but the Sales Executive holds it', () => {
    expect(ROLE_CARD_LIMITS.design_engineer).toContain('proposals_send');
    expect(card.limits).not.toContain('proposals_send');
    expect(card.limits).toEqual(SALES_EXECUTIVE_LIMITS);
  });

  it('the presets read in matrix order, whatever order they came in', () => {
    expect(card.presets).toEqual(['sales_executive', 'design_engineer']);
    expect(roleCard(['sales_executive', 'design_engineer', 'sales_executive'])).toEqual(card);
  });
});

describe('each preset alone — no line claims what the matrix refuses', () => {
  it.each<RolePreset>([...ROLE_PRESETS])('%s', (preset) => {
    const card = roleCard([preset]);
    expect(card.grants.length).toBeGreaterThan(0);
    for (const key of card.grants) {
      const line = lineOf(key);
      if (line?.decidedBy.kind !== 'row') continue;
      const cell = CAPABILITY_MATRIX[line.decidedBy.row].grants[preset];
      expect(cell.held, key).toBe(true);
      if ('limitedTo' in cell) expect(line.decidedBy.limited, key).toBe('grants');
    }
    for (const key of card.limits) {
      expect(ROLE_CARD_LIMITS[preset]).toContain(key);
      const line = lineOf(key);
      if (line?.decidedBy.kind !== 'row') throw new Error(`${key} is a limit without a row`);
      const cell = CAPABILITY_MATRIX[line.decidedBy.row].grants[preset];
      expect(cell.held && !('limitedTo' in cell && line.decidedBy.limited === 'denies'), key).toBe(
        false,
      );
    }
  });
});

describe('the lines the board does not draw', () => {
  it.each<{ roles: readonly RolePreset[] }>(
    ROLE_PRESETS.map((preset) => ({ roles: ['epc_owner', preset] })),
  )('$roles — an Owner lacks nothing and holds the team, so no limit and no note', ({ roles }) => {
    const card = roleCard(roles);
    expect(card.limits).toEqual([]);
    expect(card.ownerNote).toBe(false);
    expect(card.grants).toContain('leads_all');
  });

  it('a Field Technician holds no table row, so the preset decides its line', () => {
    expect(roleCard(['field_technician']).grants).toEqual(['own_work']);
  });

  it('Marketing sees its own captures, not leads and follow-ups', () => {
    expect(roleCard(['marketing']).grants).toContain('leads_campaigns');
    expect(roleCard(['marketing']).grants).not.toContain('leads_own');
    expect(roleCard(['marketing', 'sales_executive']).grants).toContain('leads_own');
  });

  it('the Sales Manager sees the team', () => {
    expect(roleCard(['sales_manager']).grants).toContain('leads_team');
    expect(roleCard(['sales_manager']).grants).toContain('reports_company');
  });

  it('a limited cell grants or denies by its line: Finance views prices, never changes them', () => {
    expect(roleCard(['finance']).grants).not.toContain('price_list');
    expect(roleCard(['finance']).limits).toContain('price_list');
    expect(roleCard(['finance', 'operations']).grants).toContain('price_list');
  });

  it('an assigned-only preset draws no leads line', () => {
    const { grants } = roleCard(['survey_engineer']);
    expect(grants.filter((key) => key.startsWith('leads_'))).toEqual([]);
    expect(grants).toContain('site_survey');
  });

  it('no roles hold nothing', () => {
    expect(roleCard([])).toEqual({ presets: [], grants: [], limits: [], ownerNote: true });
  });
});
