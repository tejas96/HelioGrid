import { HOME_LADDER } from '@heliogrid/domain';
import { describe, expect, it } from 'vitest';
import { presetLine } from '../src/copy/shell';
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
