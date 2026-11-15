import type { SignedProposalProof } from '@heliogrid/contracts';
import { describe, expect, it } from 'vitest';
import { shownAsSent } from '../src/copy/assembled';
import { projectPageWords } from '../src/copy/project-page';
import { createTranslator } from '../src/runtime';

const AT = '2026-11-14T06:30:00.000Z';
const proof = (act: string, linkLabel: string | null): SignedProposalProof => ({
  version: 2,
  linkLabel,
  at: AT,
  act,
});

describe('the signed-proposal row says what proves it (F5-46, T-M06-025)', () => {
  it.each<[string, SignedProposalProof, string | null, string]>([
    [
      'the customer’s Accept names its link',
      proof('accepted', 'Anil Kumar'),
      null,
      'Version 2 accepted on Anil Kumar · 14 Nov',
    ],
    [
      'a version put in force names who recorded it',
      proof('put_in_force', null),
      'Neha Joshi',
      'Version 2 put in force by Neha Joshi · 14 Nov',
    ],
    [
      'an act a newer server names keeps the version and the day',
      proof('signed_in_person', null),
      'Neha Joshi',
      'Version 2 · 14 Nov',
    ],
    [
      'an Accept with no link left says only the version and the day',
      proof('accepted', null),
      null,
      'Version 2 · 14 Nov',
    ],
  ])('%s', async (_, given, by, said) => {
    const { t } = await createTranslator('en');
    const words = projectPageWords(
      t,
      (_kind, key) => shownAsSent(key),
      () => '14 Nov',
    );
    expect(words.signedProof(given, by)).toBe(said);
  });
});
