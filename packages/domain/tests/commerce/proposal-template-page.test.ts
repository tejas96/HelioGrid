import { describe, expect, it } from 'vitest';
import { templateDraftOf, templateEdit } from '../../src/commerce/proposal-template-draft';
import {
  templateChanged,
  templateRefusedPart,
  templateStanding,
  templateWritesOf,
} from '../../src/commerce/proposal-template-page';
import { edited, OWN, PLATFORM } from './proposal-template-fixtures';

describe('what Save template sends', () => {
  it('only a changed record is written', () => {
    const sections = edited(OWN, { kind: 'section', section: 'achievements' });
    const timeline = edited(OWN, { kind: 'move', from: 2, to: 1 });

    expect(templateChanged(OWN, sections)).toEqual({ template: true, timeline: false });
    expect(Object.keys(templateWritesOf(OWN, sections))).toEqual(['template']);
    expect(templateWritesOf(OWN, timeline)).toEqual({
      timeline: {
        phases: [OWN.phases[0], OWN.phases[2], OWN.phases[1]],
      },
    });
    expect(templateChanged(OWN, templateEdit(timeline, { kind: 'move', from: 1, to: 2 }))).toEqual({
      template: false,
      timeline: false,
    });
  });
});

describe('the standing line', () => {
  const at = (iso: string, name: string | null = 'Rajesh Kulkarni') => ({ at: iso, by: { name } });

  it.each([
    [
      'the later of two saves',
      at('2026-08-28T10:00:00Z'),
      at('2026-08-29T10:00:00Z', 'Sunita'),
      'Sunita',
    ],
    ['the template alone', at('2026-08-28T10:00:00Z'), null, 'Rajesh Kulkarni'],
    ['a save with no name', { at: '2026-08-28T10:00:00Z', by: null }, null, null],
  ] as const)('names %s', (_case, template, timeline, name) => {
    expect(templateStanding(templateDraftOf(OWN), template, timeline)).toMatchObject({
      kind: 'saved',
      name,
    });
  });

  it.each([
    ['never saved', PLATFORM, null, null, 'never-set'],
    ['an old api over the platform’s', PLATFORM, undefined, undefined, 'never-set'],
    ['an old api over the tenant’s own', OWN, undefined, undefined, 'saved-unknown'],
  ] as const)('reads %s', (_case, saved, template, timeline, kind) => {
    expect(templateStanding(templateDraftOf(saved), template, timeline)).toEqual({ kind });
  });
});

describe('the part a refused save opens', () => {
  it.each([
    [
      'terms emptied',
      { kind: 'terms', language: 'en', value: { version: 1, blocks: [] } } as const,
      'terms',
    ],
    ['about cleared to spaces', { kind: 'about', language: 'en', text: ' ' } as const, null],
  ] as const)('%s', (_case, edit, part) => {
    expect(templateRefusedPart(edited(OWN, edit))).toBe(part);
  });

  it('a cover whose English about is cleared under a Hindi one opens on the cover', () => {
    const draft = edited(
      OWN,
      { kind: 'about', language: 'hi', text: 'पुणे' },
      { kind: 'about', language: 'en', text: '' },
    );

    expect(templateRefusedPart(draft)).toBe('cover');
  });
});
