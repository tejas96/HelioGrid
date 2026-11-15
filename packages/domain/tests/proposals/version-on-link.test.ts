import { describe, expect, it } from 'vitest';
import { versionAwaitingShare, versionsOnLink } from '../../src/proposals/version-on-link';

const AT = '2026-11-14T11:22:00.000Z';

describe('versionsOnLink — the link serves the latest shared version (M06-45)', () => {
  it.each([
    ['nothing generated', [], { shown: null, awaitingShare: null }],
    [
      'v1 generated, never shared',
      [{ version: 1, sharedAt: null }],
      { shown: 1, awaitingShare: null },
    ],
    ['v1 shared', [{ version: 1, sharedAt: AT }], { shown: 1, awaitingShare: null }],
    [
      'v1 shared, v2 generated and not shared',
      [
        { version: 2, sharedAt: null },
        { version: 1, sharedAt: AT },
      ],
      { shown: 1, awaitingShare: 2 },
    ],
    [
      'v2 shared over v1',
      [
        { version: 1, sharedAt: AT },
        { version: 2, sharedAt: AT },
      ],
      { shown: 2, awaitingShare: null },
    ],
    [
      'v1 and v2 never shared',
      [
        { version: 1, sharedAt: null },
        { version: 2, sharedAt: null },
      ],
      { shown: 2, awaitingShare: null },
    ],
    [
      'v2 shared, v3 generated',
      [
        { version: 3, sharedAt: null },
        { version: 2, sharedAt: AT },
        { version: 1, sharedAt: AT },
      ],
      { shown: 2, awaitingShare: 3 },
    ],
  ])('%s', (_, versions, expected) => {
    expect(versionsOnLink(versions)).toEqual(expected);
  });
});

describe('versionAwaitingShare — offered only while the link still takes a newer version', () => {
  const waiting = [
    { version: 2, sharedAt: null },
    { version: 1, sharedAt: AT },
  ];
  it.each([
    ['shared', 2],
    ['opened', 2],
    ['negotiating', 2],
    ['accepted', 2],
    ['declined', 2],
    ['won', null],
    ['withdrawn', null],
    ['replaced', null],
  ])('%s → %s', (standing, expected) => {
    expect(versionAwaitingShare(standing, waiting)).toBe(expected);
  });
});
