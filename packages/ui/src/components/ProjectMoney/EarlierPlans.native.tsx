import { theme } from '@heliogrid/theme';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { colors } from '../../primitives/Color/colors';
import { Text } from '../../primitives/Text/Text.native';
import { Card } from '../Card/Card.native';
import { FoldHead } from '../FoldHead/FoldHead.native';
import { useFormat } from '../MarketProvider';
import { amountsOf } from './ProjectMoney.logic';
import type { EarlierPlansProps } from './ProjectMoney.parts.types';

/** The earlier plan under the live one, on the phone (`T-M06-025`, `M11-14`): one folded card. */
export function EarlierPlans({ plans, words }: EarlierPlansProps) {
  const format = useFormat();
  const [open, setOpen] = useState(false);
  if (plans.length === 0) return null;
  return (
    <Card density="functional" style={styles.card}>
      <FoldHead
        title={words.title}
        meta={words.count(plans.length)}
        open={open}
        onToggle={() => setOpen(!open)}
      />
      {open
        ? plans.map((plan) => (
            <View key={`${plan.version ?? 'won'}-${plan.replacedAt}`} style={styles.plan}>
              <Text variant="body-sm" color="secondary" style={styles.head}>
                {words.plan(
                  { version: plan.version, name: plan.replacedBy?.name ?? null },
                  format.date(plan.replacedAt),
                )}
              </Text>
              {plan.parts.map((part, index) => (
                <View key={part.id} style={[styles.row, index === 0 ? undefined : styles.rule]}>
                  <View style={styles.words}>
                    <Text variant="body">{part.label}</Text>
                    <Text variant="body-sm" color="secondary">
                      {words.dueAt(format.word('stage', part.dueOnStage))}
                    </Text>
                  </View>
                  <Text variant="mono">{format.moneyPlain(part.amount, amountsOf(plan))}</Text>
                </View>
              ))}
            </View>
          ))
        : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { padding: theme.spacing['sp-1'], gap: theme.spacing['sp-1'] },
  plan: { paddingBottom: theme.spacing['sp-2'] },
  head: { paddingHorizontal: theme.spacing['sp-3'], paddingTop: theme.spacing['sp-2'] },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: theme.spacing['sp-2'],
    padding: theme.spacing['sp-3'],
  },
  rule: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors['line-soft'] },
  words: { flex: 1, minWidth: 0, gap: theme.spacing['sp-0-5'] },
});
