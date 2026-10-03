import { HOME_LADDER } from '@heliogrid/domain';
import { describe, expect, it } from 'vitest';
import {
  accessRemovedWords,
  accountMenuWords,
  doorTitle,
  firstRunMarkLabels,
  firstRunMarkWords,
  homeBlocksWords,
  homeHeadWords,
  presetLine,
  todayLine,
} from '../src/copy/shell';
import { createTranslator } from '../src/runtime';

/**
 * `M13-10` — the line under the home's title says whose home it is and what else the person
 * holds. `held` arrives in ladder order (`homesOf`), so its first entry is the highest preset;
 * the three here are the ladder's top three, read from domain rather than named.
 */
const [OWNER, MANAGER, OPERATIONS] = HOME_LADDER;

describe('presetLine', () => {
  it.each([
    {
      why: 'one preset held',
      home: OWNER,
      held: [OWNER],
      line: 'EPC Owner home · your only preset',
    },
    {
      why: 'the highest preset in force, one other held',
      home: OWNER,
      held: [OWNER, MANAGER],
      line: 'EPC Owner home · you also hold Sales Manager',
    },
    {
      why: 'the highest preset in force, two others held',
      home: OWNER,
      held: [OWNER, MANAGER, OPERATIONS],
      line: 'EPC Owner home · you also hold Sales Manager, Operations',
    },
    {
      why: 'a switched home, which names the highest',
      home: MANAGER,
      held: [OWNER, MANAGER],
      line: 'Sales Manager home · EPC Owner is your highest preset',
    },
  ])('says $why', async ({ home, held, line }) => {
    const { t } = await createTranslator('en');
    expect(presetLine(t, home, held)).toBe(line);
  });
});

describe('accessRemovedWords — Frame 8 names the company when it is known (S1.wrong.4)', () => {
  it.each([
    { company: 'Suryodaya Solar', title: 'Your access to Suryodaya Solar was removed' },
    { company: null, title: 'Your access was removed' },
  ])('company $company → $title', async ({ company, title }) => {
    const { t } = await createTranslator('en');
    expect(accessRemovedWords(t, company).title).toBe(title);
  });
});

describe('doorTitle — a door the shell opens is titled by what it is', () => {
  it.each([
    { door: 'leads', title: 'Leads' },
    { door: 'proposals', title: 'Proposals' },
    { door: 'projects', title: 'Projects' },
    { door: 'people', title: 'People' },
    { door: 'campaigns', title: 'Campaigns' },
    { door: 'more', title: 'More' },
    { door: 'add_lead', title: 'Add lead' },
    { door: 'start_survey', title: 'Start survey' },
    { door: 'search', title: 'Search' },
  ] as const)('$door → $title', async ({ door, title }) => {
    const { t } = await createTranslator('en');
    expect(doorTitle(t, door)).toBe(title);
  });
});

describe('firstRunMarkWords — each mark names its own control, true on both platforms (M01-16)', () => {
  it.each([
    {
      mark: 'switch-home',
      verb: 'add_lead',
      words: {
        title: 'Two presets, one home',
        body: 'Your home is the EPC Owner one. Open the title to switch.',
      },
    },
    {
      mark: 'centre-action',
      verb: 'add_lead',
      words: { title: 'Add a lead from your home', body: 'Use this button to add a lead.' },
    },
    {
      mark: 'centre-action',
      verb: 'start_survey',
      words: { title: 'Start a survey from your home', body: 'Use this button to start a survey.' },
    },
    { mark: 'centre-action', verb: null, words: null },
  ] as const)('$mark with verb $verb', async ({ mark, verb, words }) => {
    const { t } = await createTranslator('en');
    expect(firstRunMarkWords(t, mark, OWNER, verb)).toEqual(words);
  });
});

describe('firstRunMarkLabels — the run reads as a count, and its last mark closes it (M01-16)', () => {
  it.each([
    {
      step: 1,
      total: 2,
      labels: { counterLabel: '1 of 2', nextLabel: 'Next', dismissLabel: 'Got it' },
    },
    {
      step: 2,
      total: 2,
      labels: { counterLabel: '2 of 2', nextLabel: 'Got it', dismissLabel: 'Got it' },
    },
    {
      step: 1,
      total: 1,
      labels: { counterLabel: '1 of 1', nextLabel: 'Got it', dismissLabel: 'Got it' },
    },
  ] as const)('mark $step of $total', async ({ step, total, labels }) => {
    const { t } = await createTranslator('en');
    expect(firstRunMarkLabels(t, { step, total })).toEqual(labels);
  });
});

describe("todayLine — the line over the home's title", () => {
  it("writes today's line around the market's date", async () => {
    const { t } = await createTranslator('en');
    expect(todayLine(t, '2 Oct 2026')).toBe('Today · 2 Oct 2026');
  });
});

describe('homeHeadWords — the switcher ticks the home in force (M13-10)', () => {
  it.each([
    { home: MANAGER, held: [OWNER, MANAGER], ticked: [false, true] },
    { home: OWNER, held: [OWNER], ticked: [true] },
  ])('in force $home of $held', async ({ home, held, ticked }) => {
    const { t } = await createTranslator('en');
    const words = homeHeadWords(t, home, held);
    expect(words.entries.map((entry) => entry.selected)).toEqual(ticked);
    expect(words.entries.map((entry) => entry.preset)).toEqual(held);
    expect(words.switchName).toBe(`${words.title}, switch home`);
  });
});

describe("homeBlocksWords — the home's own block first, then each composed preset (M13-10)", () => {
  it.each([
    { composed: [], overlines: ['EPC Owner'] },
    { composed: [MANAGER], overlines: ['EPC Owner', 'Sales Manager'] },
    { composed: [MANAGER, OPERATIONS], overlines: ['EPC Owner', 'Sales Manager', 'Operations'] },
  ])('composed $composed', async ({ composed, overlines }) => {
    const { t } = await createTranslator('en');
    const words = homeBlocksWords(t, { home: OWNER, composed });
    expect(words.blocks.map((block) => block.overline)).toEqual(overlines);
    expect(words.blocks.map((block) => block.key)).toEqual([OWNER, ...composed]);
  });
});

describe('accountMenuWords — the avatar names whose account it opens (F1-59, MS12-19)', () => {
  it('names the person and the two items', async () => {
    const { t } = await createTranslator('en');
    expect(accountMenuWords(t, 'Amit Rane')).toEqual({
      triggerName: 'Amit Rane — account, grievance contact and sign out',
      menuLabel: 'Account',
      grievanceLabel: 'Grievance officer',
      signOutLabel: 'Sign out',
    });
  });
});
