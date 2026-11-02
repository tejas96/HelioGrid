import { theme } from '@heliogrid/theme';
import { StyleSheet, View } from 'react-native';
import { BillingStatusChip } from '../BillingHome/BillingNeeds.native';
import { BillingValueText } from '../BillingHome/BillingValue.native';
import { Block } from '../Block/Block.native';
import { Explainer } from '../Explainer/Explainer.native';
import { FactRow } from '../FactRow/FactRow.native';
import { FactRows } from '../FactRow/FactRows.native';
import type { PlanHeldView, PlanRegionRead } from './PlanSelection.types';
import type { PlanSelectionWords } from './PlanSelection.words';

/** `Your plan` (phone): the state as its one chip, the one ask, the pairs, the source line. */
export function PlanHeld({
  read,
  held,
  words,
  onRetried,
}: {
  read: PlanRegionRead;
  held: PlanHeldView | null;
  words: PlanSelectionWords;
  onRetried: () => void;
}) {
  if (read.kind !== 'ready' || held === null) {
    return (
      <Block
        title={words.yourPlan}
        density="expressive"
        read={
          read.kind === 'failed'
            ? {
                kind: 'failed',
                retry: () => {
                  read.retry();
                  onRetried();
                },
              }
            : read.kind === 'ready'
              ? { kind: 'loading' }
              : read
        }
        loadingLabel={words.loadingPlan}
        emptyTitle={words.failedPlanTitle}
        errorTitle={words.failedPlanTitle}
        errorMessage={words.failedPlanMessage}
        retryLabel={words.tryAgain}
      />
    );
  }
  return (
    <Block
      title={words.yourPlan}
      density="expressive"
      badge={<BillingStatusChip chip={held.chip} />}
      {...(held.ask
        ? {
            action: (
              <Explainer
                label={words.aboutReading}
                title={words.readingTitle}
                placement="bottom"
                inset
                pages={words.readingBody}
              />
            ),
          }
        : {})}
      {...(held.source === null ? {} : { provenance: { tier: 'unmarked', source: held.source } })}
    >
      <View style={styles.rows}>
        <FactRows label={words.yourPlan} density="expressive" form="pair">
          {held.rows.map((fact) => (
            <FactRow
              key={fact.key}
              label={fact.label}
              value={<BillingValueText value={fact.value} />}
            />
          ))}
        </FactRows>
      </View>
    </Block>
  );
}

const styles = StyleSheet.create({
  rows: { gap: theme.spacing['sp-3'] },
});
