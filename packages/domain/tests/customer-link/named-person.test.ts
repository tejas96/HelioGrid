import { describe, expect, it } from 'vitest';
import { type NamedPersonCandidates, namedPersonOf } from '../../src/customer-link/named-person';

const everyone = new Set(['rep', 'pm', 'minter', 'owner-1', 'owner-2']);

function candidates(over: Partial<NamedPersonCandidates> = {}): NamedPersonCandidates {
  return {
    phase: 'proposal',
    leadOwnerId: 'rep',
    projectManagerId: null,
    minterId: 'minter',
    epcOwnerIds: ['owner-1', 'owner-2'],
    activeIds: everyone,
    ...over,
  };
}

const without = (...ids: string[]) => new Set([...everyone].filter((id) => !ids.includes(id)));

describe('namedPersonOf — a person and a number in every phase (F5-55, F5-73)', () => {
  it.each([
    ['the lead’s owner, before Won', {}, 'rep'],
    ['an unassigned lead: whoever minted the link', { leadOwnerId: null }, 'minter'],
    ['a rep who left: whoever minted the link', { activeIds: without('rep') }, 'minter'],
    ['both gone: an EPC Owner', { activeIds: without('rep', 'minter') }, 'owner-1'],
    [
      'the first owner gone too: the next',
      { activeIds: without('rep', 'minter', 'owner-1') },
      'owner-2',
    ],
    ['no link minter known', { leadOwnerId: null, minterId: null }, 'owner-1'],
    ['nobody active is left', { activeIds: new Set<string>() }, null],
  ])('%s', (_, over, person) => {
    expect(namedPersonOf(candidates(over))).toBe(person);
  });

  it.each(['progress', 'handover'] as const)(
    'after Won (%s): the project’s manager, never the sales rep',
    (phase) => {
      expect(namedPersonOf(candidates({ phase, projectManagerId: 'pm' }))).toBe('pm');
      expect(
        namedPersonOf(candidates({ phase, projectManagerId: 'pm', activeIds: without('pm') })),
      ).toBe('minter');
      expect(
        namedPersonOf(
          candidates({ phase, projectManagerId: 'pm', activeIds: without('pm', 'minter') }),
        ),
      ).toBe('owner-1');
    },
  );
});
