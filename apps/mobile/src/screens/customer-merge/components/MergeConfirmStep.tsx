import type { CustomerMergeScreen } from '@heliogrid/data/react';
import type { MergeView } from '@heliogrid/domain';
import {
  customerMergeFactsOf,
  customerMergePairWords,
  customerMergeWords,
  mergeRecordName,
} from '@heliogrid/i18n';
import { useTranslate } from '@heliogrid/i18n/react';
import { Card, HeroPanel, MergeAct, MergeMoves, ShellGlyph, Text, useFormat } from '@heliogrid/ui';
import { View } from 'react-native';
import { styles } from '../styles';

/**
 * The confirm step on the phone (`M02-63`): read once before the merge — who stays and who merges
 * in, what moves, what the other record becomes, no money, and the choices made.
 */
export function MergeConfirmStep({ view }: { view: MergeView }) {
  const t = useTranslate();
  const format = useFormat();
  const words = customerMergeWords(t);
  const pair = customerMergePairWords(t, customerMergeFactsOf(view, null, format.phone));
  const survivor = mergeRecordName(view.survivor, format.phone);
  const loser = mergeRecordName(view.loser, format.phone);
  return (
    <View style={styles.stack}>
      <HeroPanel label={words.stays}>
        <View style={styles.who}>
          <View style={styles.whoWords}>
            <Text variant="h2">{survivor}</Text>
            <View style={styles.row}>
              <Text variant="mono" color="secondary">
                {format.phone(view.survivor.phoneE164)}
              </Text>
              {view.survivor.city === null ? null : (
                <Text variant="body-sm" color="secondary">
                  {view.survivor.city}
                </Text>
              )}
            </View>
          </View>
        </View>
        <View style={styles.who}>
          <ShellGlyph name="arrow-right" size="md" tone="secondary" />
          <View style={styles.whoWords}>
            <Text variant="overline" color="secondary">
              {words.mergesIn}
            </Text>
            <Text variant="body" bold>
              {loser}
            </Text>
            <Text variant="mono" color="secondary">
              {format.phone(view.loser.phoneE164)}
            </Text>
          </View>
        </View>
      </HeroPanel>
      <Card>
        <MergeMoves
          heading={pair.moves.heading}
          rows={pair.moves.rows}
          tombstone={pair.moves.tombstone}
          noMoney={pair.moves.noMoney}
          cannotUndo={null}
          none={pair.moves.none}
        />
      </Card>
      {view.kept.length === 0 ? null : (
        <Card>
          <View style={styles.stack}>
            <Text variant="overline" color="secondary">
              {words.yourChoices}
            </Text>
            {view.kept.map((kept) => (
              <View key={kept.field} style={styles.kept}>
                <Text variant="body-sm" color="secondary">
                  {words.field(kept.field)}
                </Text>
                <View style={styles.keptValue}>
                  <Text variant={kept.value === null ? 'mono' : 'body-sm'} bold>
                    {kept.value ?? format.phone(kept.phoneE164)}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </Card>
      )}
    </View>
  );
}

/** The act bar under the confirm: "This cannot be undone." above the one explicit press. */
export function MergeConfirmAct({
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
    <MergeAct
      label={words.merge}
      onMerge={screen.merge}
      awake={screen.canMerge}
      merging={screen.merging}
      waiting={words.merging}
      failure={pair.failure}
      line={null}
      warning={words.cannotUndo}
    />
  );
}
