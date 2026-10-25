import type { ProposalTemplateWords } from '@heliogrid/i18n';
import { Banner, FormActionBar } from '@heliogrid/ui';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { styles } from '../styles';

/**
 * The act bar a held change raises in the nav's place (`SCR-M01-19` m19-n5): the consequence over
 * *Save template* and *Discard changes*, its band reaching under the home indicator — and, when
 * the save did not land, its danger banner just above it, where the retry is (m19-n4).
 */
export function TemplateActBar({
  words,
  saving,
  saveFailed,
  onSave,
  onDiscard,
}: {
  words: ProposalTemplateWords;
  saving: boolean;
  saveFailed: boolean;
  onSave: () => void;
  onDiscard: () => void;
}) {
  const insets = useSafeAreaInsets();
  return (
    <View>
      {saveFailed ? (
        <View style={styles.failure}>
          <Banner kind="state" tone="danger" density="functional" title={words.saveFailed}>
            {words.saveFailedBody}
          </Banner>
        </View>
      ) : null}
      <FormActionBar
        placement="sticky"
        align="center"
        consequence={words.consequence}
        saveLabel={words.save}
        onSave={onSave}
        discardLabel={words.discard}
        onDiscard={onDiscard}
        saving={saving}
        bottomInset={insets.bottom}
      />
    </View>
  );
}
