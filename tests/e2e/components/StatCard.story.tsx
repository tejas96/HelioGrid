import { createTranslator, statCardWords } from '@heliogrid/i18n';
import { StatCard, type StatCardProps } from '@heliogrid/ui';

const en = await createTranslator('en');
const words = statCardWords(en.t);

/**
 * `StatCard` with its words bound in the browser: `loading` and `moved` are functions the card
 * calls while it renders, so they cannot be handed to `mount`.
 */
export function WordedStatCard(props: Omit<StatCardProps, 'words'>) {
  return <StatCard {...props} words={words} />;
}
