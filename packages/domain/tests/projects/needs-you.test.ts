import { describe, expect, it } from 'vitest';
import { type NeedsYouFacts, needsYouOf, todoOf } from '../../src/projects/needs-you';
import type { BlockerParty } from '../../src/projects/vocabulary';

/** A project with nothing asked of anyone, entered its stage on 1 November 2026. */
function project(id: string, overrides: Partial<NeedsYouFacts> = {}): NeedsYouFacts {
  return {
    id,
    enteredOn: '2026-11-01',
    earlyProof: false,
    missingProof: false,
    installDatePassed: false,
    moneyDue: false,
    wait: null,
    ...overrides,
  };
}

function waitingOn(party: BlockerParty, startedOn: string): NeedsYouFacts['wait'] {
  return { party, reason: 'other', startedOn };
}

describe('todoOf — one act a project asks, early proof first (ruling 2026-11-10)', () => {
  it.each([
    [true, true, true, 'proof_early'],
    [true, false, false, 'proof_early'],
    [false, true, true, 'proof_missing'],
    [false, true, false, 'proof_missing'],
    [false, false, true, 'install_date_passed'],
    [false, false, false, null],
  ] as const)(
    'early %s, missing %s, install date passed %s asks %s',
    (earlyProof, missingProof, installDatePassed, todo) => {
      expect(todoOf(project('p', { earlyProof, missingProof, installDatePassed }))).toBe(todo);
    },
  );

  it.each([
    [true, 'install_date_passed'],
    [false, 'money_due'],
  ] as const)('money due behind install date passed %s asks %s (M11-53)', (passed, todo) => {
    expect(todoOf(project('p', { installDatePassed: passed, moneyDue: true }))).toBe(todo);
  });

  it('a wait alone asks no act', () => {
    expect(todoOf(project('p', { wait: waitingOn('customer', '2026-11-01') }))).toBeNull();
  });
});

describe('needsYouOf — to-dos by kind and oldest first, then waits by party (M08-23)', () => {
  const lateInstall = project('late-install', { installDatePassed: true, enteredOn: '2026-10-01' });
  const missing = project('missing', { missingProof: true, enteredOn: '2026-11-01' });
  const earlyNewer = project('early-newer', { earlyProof: true, enteredOn: '2026-11-05' });
  const earlyOlder = project('early-older', { earlyProof: true, enteredOn: '2026-10-20' });
  const earlySameDayB = project('early-b', { earlyProof: true, enteredOn: '2026-10-20' });
  const quiet = project('quiet');
  const utilityNewer = project('utility-newer', { wait: waitingOn('utility', '2026-10-05') });
  const companyWait = project('company', { wait: waitingOn('company', '2026-11-01') });
  const utilityOlder = project('utility-older', { wait: waitingOn('utility', '2026-09-01') });
  const customerWait = project('customer', { wait: waitingOn('customer', '2026-10-10') });

  const projects = [
    lateInstall,
    utilityNewer,
    missing,
    earlyNewer,
    companyWait,
    quiet,
    earlySameDayB,
    utilityOlder,
    earlyOlder,
    customerWait,
  ];

  it.each([
    ['as given', projects],
    ['reversed', [...projects].reverse()],
  ])('orders the same whatever order the projects arrive in — %s', (_order, given) => {
    const list = needsYouOf(given);
    expect(list.todo.map(({ project, kind }) => [project.id, kind])).toEqual([
      ['early-b', 'proof_early'],
      ['early-older', 'proof_early'],
      ['early-newer', 'proof_early'],
      ['missing', 'proof_missing'],
      ['late-install', 'install_date_passed'],
    ]);
    expect(list.waits.map(({ party, projects }) => [party, projects.map((one) => one.id)])).toEqual(
      [
        ['company', ['company']],
        ['customer', ['customer']],
        ['utility', ['utility-older', 'utility-newer']],
      ],
    );
  });

  it('two waits begun the same day keep one order, by project', () => {
    const b = project('b', { wait: waitingOn('material', '2026-10-01') });
    const a = project('a', { wait: waitingOn('material', '2026-10-01') });
    expect(needsYouOf([b, a]).waits).toEqual([{ party: 'material', projects: [a, b] }]);
  });

  it('is empty with no project, and with only quiet ones', () => {
    expect(needsYouOf([])).toEqual({ todo: [], waits: [] });
    expect(needsYouOf([quiet])).toEqual({ todo: [], waits: [] });
  });
});
