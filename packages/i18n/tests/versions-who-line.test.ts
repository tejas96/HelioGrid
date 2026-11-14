import { describe, expect, it } from 'vitest';
import { proposalVersionsWords } from '../src/copy/proposal-after-versions';
import { createTranslator } from '../src/runtime';

const formats = { money: String, number: String, when: () => 'Today' };

type Version = Parameters<ReturnType<typeof proposalVersionsWords>['whoLine']>[0];
const version = (facts: { shared: boolean; inForce: boolean; by: boolean }) =>
  ({
    generatedAt: '2026-11-14T00:00:00.000Z',
    sharedAt: facts.shared ? '2026-11-14T00:00:00.000Z' : null,
    inForce: facts.inForce,
    generatedBy: facts.by ? { id: 'm1', name: 'Priya Kale' } : null,
  }) as unknown as Version;

describe('the versions hero says what the customer sees, by where the deal stands', () => {
  it.each([
    [
      'open, not shared',
      false,
      { shared: false, inForce: false, by: true },
      'Priya Kale · Today · not shared yet, so the customer still sees the earlier version',
    ],
    [
      'open, shared',
      false,
      { shared: true, inForce: false, by: true },
      'Priya Kale · Today · shared with the customer',
    ],
    [
      'open, no maker',
      false,
      { shared: false, inForce: false, by: false },
      'Today · not shared yet',
    ],
    // Once won the link shows the project and the plan in force, never "the earlier version".
    [
      'won, in force',
      true,
      { shared: false, inForce: true, by: true },
      'Priya Kale · Today · the customer’s link shows this plan',
    ],
    [
      'won, not in force',
      true,
      { shared: false, inForce: false, by: true },
      'Priya Kale · Today · not in force yet',
    ],
    [
      'won, shared, not in force',
      true,
      { shared: true, inForce: false, by: true },
      'Priya Kale · Today · not in force yet',
    ],
    [
      'won, in force, no maker',
      true,
      { shared: true, inForce: true, by: false },
      'Today · the customer’s link shows this plan',
    ],
    [
      'won, not in force, no maker',
      true,
      { shared: false, inForce: false, by: false },
      'Today · not in force yet',
    ],
  ] as const)('%s', async (_, won, facts, said) => {
    const { t } = await createTranslator('en');
    expect(proposalVersionsWords(t, formats).whoLine(version(facts), won)).toBe(said);
  });
});
