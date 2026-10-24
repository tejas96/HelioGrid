import { describe, expect, it } from 'vitest';
import { CAPABILITY_MATRIX } from '../../src/authz/capabilities';
import {
  limitScope,
  REFERENCE_ROWS,
  roleReference,
  visibilityScope,
} from '../../src/authz/reference';
import { ROLE_PRESETS } from '../../src/authz/roles';
import { VISIBILITY_MATRIX } from '../../src/authz/visibility';

const line = (preset: (typeof ROLE_PRESETS)[number], row: string) => {
  const { can, cant } = roleReference(preset);
  return {
    can: can.find((held) => held.row === row) ?? null,
    cant: cant.some((missing) => missing.row === row),
  };
};

describe('REFERENCE_ROWS', () => {
  it('every matrix row once, in F2 order', () => {
    const rows = [...Object.keys(CAPABILITY_MATRIX), ...Object.keys(VISIBILITY_MATRIX)];
    expect([...REFERENCE_ROWS].sort()).toEqual(rows.sort());
    expect(new Set(REFERENCE_ROWS).size).toBe(REFERENCE_ROWS.length);
    /* F2 §F2.5's tables in F2's order — M01 … M13, then F5 — each visibility row inside its own
       table: the row keys' tables never step back. */
    const TABLES = [
      'M01',
      'M02',
      'M03',
      'M04',
      'M05',
      'M06',
      'M07',
      'M08',
      'M09',
      'M10',
      'M11',
      'M12',
      'M13',
      'F5',
    ];
    const tableOf = (row: string) => {
      const key = (
        row in CAPABILITY_MATRIX
          ? CAPABILITY_MATRIX[row as keyof typeof CAPABILITY_MATRIX]
          : VISIBILITY_MATRIX[row as keyof typeof VISIBILITY_MATRIX]
      )?.rowKey;
      return TABLES.indexOf(key?.split('.')[1] ?? '');
    };
    const tables = REFERENCE_ROWS.map(tableOf);
    expect(tables).not.toContain(-1);
    expect(tables).toEqual([...tables].sort((a, b) => a - b));
  });

  /* Each visibility row in its board place: between these two neighbours. */
  it.each([
    ['onboarding.add_own_catalog_items', 'leads', 'crm.add_edit_leads'],
    ['crm.merge_customers', 'campaigns', 'marketing.manage_campaigns'],
    ['projects.installation_checklist', 'projects', 'field_work'],
    ['projects', 'field_work', 'field.check_in_out'],
    ['field.view_live_location', 'people', 'hr.request_leave'],
  ] as const)('%s, then %s, then %s', (before, row, after) => {
    const at = REFERENCE_ROWS.indexOf(row);
    expect([REFERENCE_ROWS[at - 1], REFERENCE_ROWS[at + 1]]).toEqual([before, after]);
  });
});

describe('roleReference', () => {
  it('splits every row into can or cant, once', () => {
    for (const preset of ROLE_PRESETS) {
      const { can, cant } = roleReference(preset);
      expect(can.length + cant.length).toBe(REFERENCE_ROWS.length);
      expect(new Set([...can, ...cant].map((held) => held.row)).size).toBe(REFERENCE_ROWS.length);
    }
  });

  it('keeps F2 order inside each list', () => {
    const { can } = roleReference('sales_executive');
    const order = can.map((held) => REFERENCE_ROWS.indexOf(held.row));
    expect(order).toEqual([...order].sort((a, b) => a - b));
  });

  it.each([
    ['epc_owner', 'onboarding.manage_team', null],
    ['finance', 'onboarding.manage_catalog', 'view_prices_margins'],
    ['sales_manager', 'reports.company_reports', 'team_scoped'],
    ['epc_owner', 'reports.company_reports', 'all'],
    ['sales_manager', 'field.attendance_visibility', 'team'],
    ['survey_engineer', 'survey.schedule_survey_visits', 'own_visits'],
    ['sales_executive', 'sales.control_agent_queue', 'own_queued'],
    ['project_manager', 'field.view_live_location', 'own_projects_field_work'],
    ['project_manager', 'field.attendance_visibility', 'own_projects_field_workers'],
    ['epc_owner', 'leads', 'all'],
    ['survey_engineer', 'leads', 'assigned'],
    ['project_manager', 'leads', 'own_projects_deals_read'],
    ['operations', 'leads', 'portfolio_deals_read'],
    ['marketing', 'leads', 'own_captures_until_triage'],
    ['sales_manager', 'campaigns', 'read_results'],
    ['sales_executive', 'projects', 'own_read_only'],
    ['project_manager', 'projects', 'own_projects'],
    ['installation_team_member', 'projects', 'assigned_job_only'],
    ['finance', 'projects', 'all_money_scope'],
    ['operations', 'projects', 'portfolio'],
    ['operations', 'field_work', 'team'],
    ['hr_admin', 'people', 'all'],
  ] as const)('%s holds %s with the scope %s', (preset, row, scope) => {
    expect(line(preset, row).can).toEqual({ row, scope });
  });

  it.each([
    ['sales_manager', 'onboarding.manage_team'],
    ['field_technician', 'leads'],
    ['marketing', 'projects'],
  ] as const)('%s cannot %s', (preset, row) => {
    expect(line(preset, row)).toEqual({ can: null, cant: true });
  });

  it('no PRD rule id reaches a scope', () => {
    expect(line('project_manager', 'projects.installation_checklist').can).toEqual({
      row: 'projects.installation_checklist',
      scope: 'coordinator',
    });
    expect(line('installation_team_member', 'projects.installation_checklist').can).toEqual({
      row: 'projects.installation_checklist',
      scope: null,
    });
  });
});

describe('a cell the vocabulary has no word for', () => {
  it.each([
    ['a capability phrase', () => limitScope('Own regions')],
    ['a visibility qualifier', () => visibilityScope({ scope: 'team', qualifier: 'region only' })],
  ])('stops the read on %s', (_, read) => {
    expect(read).toThrow(/No Roles reference scope/);
  });
});
