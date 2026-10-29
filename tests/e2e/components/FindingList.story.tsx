import { createTranslator, findingListWords } from '@heliogrid/i18n';
import { FindingList, type FindingListProps } from '@heliogrid/ui';

const en = await createTranslator('en');
const words = findingListWords(en.t);

/**
 * `FindingList` with its words bound in the browser: `heading`, `openCount` and the others are
 * functions the list calls while it renders, so they cannot be handed to `mount`.
 */
export function WordedFindingList(props: Omit<FindingListProps, 'words'>) {
  return <FindingList {...props} words={words} />;
}
