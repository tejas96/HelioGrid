import { describe, expect, it } from 'vitest';
import { can } from '../../src/authz/policy';
import { ROLE_PRESETS } from '../../src/authz/roles';
import { CENTRE_VERB_REQUIRES, centreVerbFor } from '../../src/shell/centre-verb';

describe('centreVerbFor — the verb follows the home in force (F7-22)', () => {
  it.each(ROLE_PRESETS)(
    '%s: Add lead where the preset may add leads, Start survey where it may only capture surveys, nothing yet elsewhere',
    (preset) => {
      const expected = can([preset], 'crm.add_edit_leads')
        ? 'add_lead'
        : can([preset], 'survey.capture_surveys')
          ? 'start_survey'
          : null;
      expect(centreVerbFor(preset)).toBe(expected);
    },
  );

  it.each([
    {
      home: 'epc_owner',
      verb: 'add_lead',
      by: 'SCR-M01-06 decision 8 — quick-add on the owner’s arc centre',
    },
    {
      home: 'sales_executive',
      verb: 'add_lead',
      by: 'SCR-SHELL-01 decision 6 — "Add lead" on My Day',
    },
    {
      home: 'survey_engineer',
      verb: 'start_survey',
      by: 'M04 §Surfaces — "Start survey" on today’s visits',
    },
    {
      home: 'design_engineer',
      verb: null,
      by: 'may run a remote survey, never capture one — no act named',
    },
    {
      home: 'field_technician',
      verb: null,
      by: 'no PRD row names an act — the home’s task names it',
    },
  ] as const)('$home → $verb ($by)', ({ home, verb }) => {
    expect(centreVerbFor(home)).toBe(verb);
  });
});

describe('the centre never exposes an act the person’s presets do not permit (F7 §F7.3)', () => {
  it.each(ROLE_PRESETS)('%s holds the capability its verb performs', (preset) => {
    const verb = centreVerbFor(preset);
    if (verb === null) return;
    expect(can([preset], CENTRE_VERB_REQUIRES[verb])).toBe(true);
  });
});
