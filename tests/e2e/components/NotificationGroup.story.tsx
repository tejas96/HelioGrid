import {
  createTranslator,
  energySourceLabel,
  freshnessLabel,
  standingLabel,
  tierLabel,
} from '@heliogrid/i18n';
import {
  NotificationGroup,
  type NotificationGroupProps,
  ProvenanceWordsProvider,
} from '@heliogrid/ui';

const translators = {
  en: await createTranslator('en'),
  hi: await createTranslator('hi'),
};

/**
 * A group mounted under the provenance words its count line reads. The words are functions the
 * label calls while it renders, and a function handed to `mount` answers from the test process —
 * so they are bound here, in the browser.
 */
export function GroupWithWords({
  language = 'en',
  ...props
}: NotificationGroupProps & { language?: keyof typeof translators }) {
  const { t } = translators[language];
  return (
    <ProvenanceWordsProvider
      value={{
        tier: (tier) => tierLabel(t, tier),
        standing: (standing) => standingLabel(t, standing),
        energySource: (source) => energySourceLabel(t, source),
        freshness: (warning) => freshnessLabel(t, warning),
      }}
    >
      <NotificationGroup {...props} />
    </ProvenanceWordsProvider>
  );
}
