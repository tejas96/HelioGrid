import type { CustomerMergeScreen } from '@heliogrid/data/react';
import type { MergeView } from '@heliogrid/domain';
import { customerMergeFactsOf, customerMergePairWords, customerMergeWords } from '@heliogrid/i18n';
import { useTranslate } from '@heliogrid/i18n/react';
import { Button, MergeCompare, mergeCompareOf, ShellGlyph, Text, useFormat } from '@heliogrid/ui';
import { View } from 'react-native';
import { styles } from '../styles';

/** The choose step on the phone: which record stays, and a pick for every field that differs. */
export function MergeChooseStep({
  screen,
  view,
}: {
  screen: CustomerMergeScreen;
  view: MergeView;
}) {
  const t = useTranslate();
  const format = useFormat();
  const words = customerMergeWords(t);
  const pair = customerMergePairWords(t, customerMergeFactsOf(view, screen.failure, format.phone));
  return (
    <View style={styles.stack}>
      {screen.canChangeOther ? (
        <View style={styles.start}>
          <Button
            variant="ghost"
            size="sm"
            icon={<ShellGlyph name="search" size="sm" />}
            onClick={screen.changeOther}
          >
            {words.find.otherRecord}
          </Button>
        </View>
      ) : null}
      <MergeCompare
        {...mergeCompareOf(view, words, format.phone)}
        same={pair.same}
        onStay={screen.stay}
        onPick={screen.pick}
        disabled={screen.merging}
        words={pair.compare}
      />
      {view.needsUpdate ? (
        <Text variant="body-sm" color="secondary">
          {words.needsUpdate}
        </Text>
      ) : null}
    </View>
  );
}

/**
 * The act bar under the choose step: asleep, saying how many picks wait, until every one is made —
 * and, when a merge came back because the records changed, why, above it.
 */
export function MergeReviewAct({ screen, view }: { screen: CustomerMergeScreen; view: MergeView }) {
  const t = useTranslate();
  const format = useFormat();
  const words = customerMergeWords(t);
  const pair = customerMergePairWords(t, customerMergeFactsOf(view, screen.failure, format.phone));
  return (
    <View style={styles.stack}>
      {pair.failure === null ? null : (
        <Text variant="body-sm" color="danger" live>
          {pair.failure}
        </Text>
      )}
      <Button
        variant="primary"
        size="prominent"
        fullWidth
        iconRight={<ShellGlyph name="arrow-right" size="md" tone="inverse" />}
        disabled={!screen.canMerge}
        onClick={screen.review}
      >
        {pair.pickMore ?? words.review}
      </Button>
    </View>
  );
}
