import { IN_FORMATS } from '@heliogrid/domain';
import { describe, expect, it } from 'vitest';
import { crmVocabularyWords } from '../src/copy/crm-vocabulary';
import { type LeadTimelineEntryFacts, leadTimelineEntryWords } from '../src/copy/lead-timeline';
import { createTranslator } from '../src/runtime';

const formats = {
  pack: IN_FORMATS,
  day: (date: string) => date,
  time: (hhmm: string) => hhmm,
  word: (_kind: string, key: string) => key,
};

const composed = {
  known: true,
  activity: {
    id: 'entry-1',
    kind: 'message_copied',
    appliedAt: '2026-11-14T08:00:00.000Z',
    actor: { kind: 'user', name: 'Asha Patil' },
    body: { templateKey: 'visit_confirmation', visitId: 'visit-1' },
  },
} as unknown as LeadTimelineEntryFacts;

/**
 * A composed message is recorded when its words are made, before anyone copies them (`M02-33`):
 * the timeline says it was made ready to send, never that it was copied or sent.
 */
describe('the timeline entry of a composed message', () => {
  it('says the message was made ready to send, and never claims a copy', async () => {
    const { t } = await createTranslator('en');
    const words = leadTimelineEntryWords(t, formats, composed);
    expect(words.summary).toMatch(/^Message ready to send · /);
    expect(crmVocabularyWords(t).activityKind.message_copied).toBe('Message ready to send');
  });
});
