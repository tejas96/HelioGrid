import { describe, expect, it } from 'vitest';
import { can } from '../../src/authz/policy';
import { ROLE_PRESETS } from '../../src/authz/roles';
import { CENTRE_VERB_REQUIRES, centreVerbFor, homeVerbFor } from '../../src/shell/centre-verb';

describe('centreVerbFor — the verb follows the home in force (F7-22)', () => {
  it.each(ROLE_PRESETS)(
    '%s: Proposals for the owner, Add lead where another preset may add leads, Start survey where it may only capture surveys, nothing yet elsewhere',
    (preset) => {
      const expected =
        preset === 'epc_owner'
          ? 'proposals'
          : can([preset], 'crm.add_edit_leads')
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
      verb: 'proposals',
      by: 'F7-48 — the owner’s centre opens the proposals',
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

describe('homeVerbFor — the home’s own button keeps Add lead where the centre opens the proposals', () => {
  it.each(ROLE_PRESETS)('%s', (preset) => {
    const centre = centreVerbFor(preset);
    expect(homeVerbFor(preset)).toBe(centre === 'proposals' ? 'add_lead' : centre);
  });
});

describe('the shell never exposes an act the person’s presets do not permit (F7 §F7.3)', () => {
  it.each(ROLE_PRESETS)('%s holds the capability each of its verbs performs', (preset) => {
    for (const verb of [centreVerbFor(preset), homeVerbFor(preset)]) {
      if (verb !== null) expect(can([preset], CENTRE_VERB_REQUIRES[verb])).toBe(true);
    }
  });
});
