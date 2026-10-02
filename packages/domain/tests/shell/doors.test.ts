import { describe, expect, it } from 'vitest';
import { offeredDoors } from '../../src/shell/doors';
import { shellViewFor } from '../../src/shell/shell-view';

describe('offeredDoors — the doors a person’s shell may open (F7-48)', () => {
  it.each([
    {
      who: 'an EPC Owner',
      held: ['epc_owner'],
      chosen: null,
      doors: ['leads', 'projects', 'more', 'add_lead', 'search', 'notifications'],
    },
    {
      who: 'a Project Manager — no list, no verb',
      held: ['project_manager'],
      chosen: null,
      doors: ['more', 'search', 'notifications'],
    },
    {
      who: 'a rep + surveyor on the ladder’s home',
      held: ['sales_executive', 'survey_engineer'],
      chosen: null,
      doors: ['leads', 'proposals', 'more', 'add_lead', 'search', 'notifications'],
    },
    {
      who: 'a rep + surveyor on the survey home — the verb follows the home',
      held: ['sales_executive', 'survey_engineer'],
      chosen: 'survey_engineer',
      doors: ['leads', 'proposals', 'more', 'start_survey', 'search', 'notifications'],
    },
    {
      who: 'a person holding no preset',
      held: [],
      chosen: null,
      doors: ['search', 'notifications'],
    },
  ] as const)('$who', ({ held, chosen, doors }) => {
    expect(offeredDoors(shellViewFor(held, chosen))).toEqual(doors);
  });
});
