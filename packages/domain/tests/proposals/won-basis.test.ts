import { describe, expect, it } from 'vitest';
import { type ProposalStatusFacts, wonBasisOf } from '../../src/proposals/status';

const proposal = (over: Partial<ProposalStatusFacts> = {}): ProposalStatusFacts => ({
  status: 'draft',
  latestVersion: 1,
  sharedVersion: null,
  answer: null,
  ...over,
});

const SHARED = proposal({ status: 'shared', sharedVersion: 1 });

describe('wonBasisOf — what Mark won may take (M07-62)', () => {
  it.each([
    [
      'the latest shared version was accepted',
      proposal({ status: 'accepted', latestVersion: 2, sharedVersion: 2, answer: 'accept' }),
      null,
      { kind: 'accepted_version', version: 2 },
    ],
    [
      'v2 accepted, v3 shared and not answered',
      proposal({ status: 'shared', latestVersion: 3, sharedVersion: 3 }),
      2,
      { kind: 'newer_version_unanswered', acceptedVersion: 2, sharedVersion: 3 },
    ],
    ['shared and never accepted', SHARED, null, { kind: 'no_acceptance' }],
    [
      'declined',
      { ...SHARED, status: 'declined', answer: 'decline' },
      null,
      { kind: 'no_acceptance' },
    ],
    ['a draft', proposal(), null, { kind: 'no_acceptance' }],
    ['no proposal at all', null, null, { kind: 'no_acceptance' }],
  ] as const)('%s', (_, facts, earlier, basis) => {
    expect(wonBasisOf(facts, earlier)).toEqual(basis);
  });
});
