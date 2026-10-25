import type { BrandingWords } from '@heliogrid/i18n';
import { Button, EmptyState, FormActionBar } from '@heliogrid/ui';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/**
 * The act bar a held change raises in the pill's place (`SCR-M01-18` s18-m): the consequence over
 * *Save branding* and *Discard changes*, its band reaching under the device's home indicator.
 */
export function BrandingActBar({
  words,
  saving,
  onSave,
  onDiscard,
}: {
  words: BrandingWords;
  saving: boolean;
  onSave: () => void;
  onDiscard: () => void;
}) {
  const insets = useSafeAreaInsets();
  return (
    <FormActionBar
      placement="sticky"
      align="center"
      consequence={words.sentKeep}
      saveLabel={words.save}
      onSave={onSave}
      discardLabel={words.discard}
      onDiscard={onDiscard}
      saving={saving}
      bottomInset={insets.bottom}
    />
  );
}

/** The reads got no answer: what happened, and the one way on. */
export function BrandingUnread({
  words,
  onTryAgain,
}: {
  words: BrandingWords;
  onTryAgain: () => void;
}) {
  return (
    <EmptyState
      title={words.unread}
      action={
        <Button variant="primary" size="lg" onClick={onTryAgain}>
          {words.tryAgain}
        </Button>
      }
    />
  );
}
