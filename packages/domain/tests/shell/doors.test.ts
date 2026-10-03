import { describe, expect, it } from 'vitest';
import { offeredDoors, offersDoor } from '../../src/shell/doors';
import { shellViewFor } from '../../src/shell/shell-view';

describe('offeredDoors — the doors a person’s shell may open (F7-48)', () => {
  it.each([
    {
      who: 'an EPC Owner',
      held: ['epc_owner'],
      chosen: null,
      doors: ['leads', 'projects', 'more', 'add_lead', 'search'],
    },
    {
      who: 'a Project Manager — no list, no verb',
      held: ['project_manager'],
      chosen: null,
      doors: ['more', 'search'],
    },
    {
      who: 'a rep + surveyor on the ladder’s home',
      held: ['sales_executive', 'survey_engineer'],
      chosen: null,
      doors: ['leads', 'proposals', 'more', 'add_lead', 'search'],
    },
    {
      who: 'a rep + surveyor on the survey home — the verb follows the home',
      held: ['sales_executive', 'survey_engineer'],
      chosen: 'survey_engineer',
      doors: ['leads', 'proposals', 'more', 'start_survey', 'search'],
    },
    {
      who: 'a person holding no preset',
      held: [],
      chosen: null,
      doors: ['search'],
    },
  ] as const)('$who', ({ held, chosen, doors }) => {
    expect(offeredDoors(shellViewFor(held, chosen))).toEqual(doors);
  });
});

describe('offersDoor — one door, asked by name', () => {
  it.each([
    ['an EPC Owner has the leads door', ['epc_owner'], 'leads', true],
    ['a Project Manager has none', ['project_manager'], 'leads', false],
  ] as const)('%s', (_, held, door, offered) => {
    expect(offersDoor(shellViewFor(held, null), door)).toBe(offered);
  });
});
