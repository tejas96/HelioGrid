import { calendarWords, createTranslator, DATE_SET, dateSetWords } from '@heliogrid/i18n';
import { DateSet, type DateSetEntry } from '@heliogrid/ui';

const en = await createTranslator('en');
/* The set's sentences are functions it calls while it renders, so they are bound here, in the
   browser, never handed across from the test. */
const words = dateSetWords(en.t);
const calendar = calendarWords(en.t);
/* No pack date is drawn here, so the floor's sentences are never read: test words stand in. */
const floorWords = {
  cannot: () => en.t('Cannot be changed'),
  notSaved: () => en.t('Not saved'),
  putBack: () => en.t('Put it back'),
};

/** The holiday calendar at a pinned month, every word from the catalog. */
export function DateSetAt({ entries, month }: { entries: DateSetEntry[]; month: string }) {
  return (
    <DateSet
      entries={entries}
      month={month}
      onMonthChange={() => undefined}
      packName="India market pack"
      label={en.t(DATE_SET.label)}
      listLabel={en.t(DATE_SET.listLabel)}
      addLabel={en.t(DATE_SET.addLabel)}
      emptyMessage={en.t(DATE_SET.emptyMessage)}
      words={words}
      floorWords={floorWords}
      calendarWords={calendar}
    />
  );
}
