import { describe, expect, it } from 'vitest';
import { CAPABILITY_MATRIX, type Capability } from '../../src/authz/capabilities';
import { VISIBILITY_DOMAINS } from '../../src/authz/cells';
import { grantLine } from '../../src/authz/grant-line';
import { grantedCapabilities, limitsOn, visibilityIn } from '../../src/authz/policy';
import { ROLE_PRESETS, type RolePreset } from '../../src/authz/roles';

/** Every non-empty set of the twelve presets, in F2 order. */
function everyCombination(): RolePreset[][] {
  const sets: RolePreset[][] = [];
  for (let mask = 1; mask < 1 << ROLE_PRESETS.length; mask += 1) {
    sets.push(ROLE_PRESETS.filter((_, i) => (mask & (1 << i)) !== 0));
  }
  return sets;
}

/* A limit phrase `all` (any case) narrows nothing, so it reads as an outright grant. */
const limitsRead = (roles: readonly RolePreset[], capability: Capability) => {
  const phrases = limitsOn(roles, capability);
  return phrases.some((phrase) => phrase.toLowerCase() === 'all') ? [] : [...phrases].sort();
};

/** What a set of presets lets a person do: every grant, its limits, and every domain's reach. */
function whatTheyHold(roles: readonly RolePreset[]): string {
  const capabilities = Object.keys(CAPABILITY_MATRIX) as Capability[];
  return JSON.stringify({
    granted: grantedCapabilities(roles),
    limits: capabilities.map((capability) => [capability, limitsRead(roles, capability)]),
    reach: VISIBILITY_DOMAINS.map((domain) => {
      const { scope, includesAssigned, through } = visibilityIn(roles, domain);
      /* A domain seen whole leaves nothing for an assigned or a through reach to add. */
      if (scope === 'all') return [domain, scope];
      return [domain, scope, includesAssigned, through.map((t) => `${t.domain}:${t.scope}`).sort()];
    }),
  });
}

/** `other` covers `preset` when holding both holds no more than `other` alone. */
const covers = (other: RolePreset, preset: RolePreset) =>
  whatTheyHold([other, preset]) === whatTheyHold([other]);

describe('M01-20 — the grant line speaks for exactly what the held presets hold', {
  timeout: 120_000,
}, () => {
  const combinations = everyCombination();

  it('covers all 4,095 combinations', () => {
    expect(combinations).toHaveLength(4095);
  });

  it('the speakers hold exactly what the held set holds, for every combination', () => {
    for (const held of combinations) {
      expect(whatTheyHold(grantLine(held).speakers), held.join('+')).toEqual(whatTheyHold(held));
    }
  });

  it('no speaker is covered by another held preset, for every combination', () => {
    for (const held of combinations) {
      const { speakers } = grantLine(held);
      for (const speaker of speakers) {
        const others = held.filter((preset) => preset !== speaker);
        const coveredBy = others.find((other) => covers(other, speaker));
        expect(coveredBy, `${held.join('+')}: ${speaker}`).toBeUndefined();
      }
    }
  });

  it('no two presets cover each other, so no tie needs a rule', () => {
    for (const a of ROLE_PRESETS) {
      for (const b of ROLE_PRESETS) {
        if (a !== b) expect(covers(a, b) && covers(b, a), `${a} and ${b}`).toBe(false);
      }
    }
  });

  it('speaks in F2 order, each preset once', () => {
    for (const held of combinations) {
      const { speakers } = grantLine(held);
      expect(speakers).toEqual(ROLE_PRESETS.filter((preset) => speakers.includes(preset)));
    }
  });
});

describe('the boards read', () => {
  it('EPC Owner with anything speaks alone', () => {
    expect(grantLine(['epc_owner']).speakers).toEqual(['epc_owner']);
    expect(grantLine([...ROLE_PRESETS]).speakers).toEqual(['epc_owner']);
    expect(grantLine(['epc_owner', 'design_engineer', 'marketing']).speakers).toEqual([
      'epc_owner',
    ]);
  });

  it('Vikram — survey, design and install — speaks for all three', () => {
    expect(
      grantLine(['survey_engineer', 'design_engineer', 'installation_team_member']).speakers,
    ).toEqual(['survey_engineer', 'design_engineer', 'installation_team_member']);
  });

  it('a toggle changes the speakers', () => {
    const before = grantLine(['survey_engineer', 'design_engineer']).speakers;
    const after = grantLine(['survey_engineer', 'design_engineer', 'finance']).speakers;
    expect(after).toEqual([...before, 'finance']);
  });

  it('no presets, no speakers', () => {
    expect(grantLine([]).speakers).toEqual([]);
  });

  it('the order a caller typed the set in never shows', () => {
    expect(grantLine(['finance', 'survey_engineer']).speakers).toEqual(
      grantLine(['survey_engineer', 'finance']).speakers,
    );
  });
});
