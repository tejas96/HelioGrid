import { describe, expect, it } from 'vitest';
import type { RolePreset } from '../../src/authz/roles';
import { shellViewFor } from '../../src/shell/shell-view';
import { moreWorkLists, sidebarWorkLists, workListLanded } from '../../src/shell/sidebar';
import {
  type StandingDestination,
  standingDestinationsFor,
  type WorkDestination,
} from '../../src/shell/standing-destinations';

describe('workListLanded — a list whose module has not shipped is marked Soon', () => {
  it.each<[WorkDestination, boolean]>([
    ['leads', true],
    ['proposals', true],
    ['projects', true],
    ['people', false],
    ['campaigns', false],
  ])('%s opens its own page: %s', (destination, landed) => {
    expect(workListLanded(destination)).toBe(landed);
  });
});

describe('sidebarWorkLists — the desktop sidebar shows every landed list read through a slot it holds', () => {
  it.each<[string, readonly StandingDestination[], readonly WorkDestination[]]>([
    [
      'EPC Owner gains Proposals after Leads',
      standingDestinationsFor('epc_owner'),
      ['leads', 'proposals', 'projects'],
    ],
    [
      'Sales Executive keeps its two',
      standingDestinationsFor('sales_executive'),
      ['leads', 'proposals'],
    ],
    [
      'Survey Engineer reads proposals with its leads',
      standingDestinationsFor('survey_engineer'),
      ['leads', 'proposals'],
    ],
    [
      'Marketing keeps its order',
      standingDestinationsFor('marketing'),
      ['campaigns', 'leads', 'proposals'],
    ],
    [
      'Project Manager keeps Projects alone',
      standingDestinationsFor('project_manager'),
      ['projects'],
    ],
    ['Finance reads no leads, so no proposals', standingDestinationsFor('finance'), ['projects']],
  ])('%s', (_case, destinations, lists) => {
    expect(sidebarWorkLists(destinations)).toEqual(lists);
  });
});

describe('moreWorkLists — More on the phone offers each landed list the pill holds no way into', () => {
  it.each<[string, RolePreset, readonly WorkDestination[]]>([
    ['EPC Owner starts and opens proposals from the pill’s action', 'epc_owner', []],
    ['Sales Executive holds Proposals on the pill', 'sales_executive', []],
    ['Survey Engineer reaches Proposals from More', 'survey_engineer', ['proposals']],
    ['Marketing reaches Proposals from More', 'marketing', ['proposals']],
    ['Finance reads no leads, so More adds no list', 'finance', []],
    ['A person with no list slot gets none', 'field_technician', []],
  ])('%s', (_case, preset, lists) => {
    expect(moreWorkLists(shellViewFor([preset], null))).toEqual(lists);
  });
});
