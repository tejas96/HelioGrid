import type { ProjectPayments } from '@heliogrid/contracts';
import { theme } from '@heliogrid/theme';
import { StyleSheet, View } from 'react-native';
import { colors } from '../../primitives/Color/colors';
import { StatusMark } from '../../primitives/StatusMark/StatusMark.native';
import { Text } from '../../primitives/Text/Text.native';
import { ShellGlyph } from '../AppShell/ShellGlyph.native';
import { Button } from '../Button/Button.native';
import { HeroPanel } from '../HeroPanel/HeroPanel.native';
import { useFormat } from '../MarketProvider';
import { barOf, dueForOf, heroActsOf, nextUpOf, nowDueOf } from './ProjectMoney.logic';
import type { ProjectMoneyProps } from './ProjectMoney.types';

type HeroProps = ProjectMoneyProps & { readonly payments: ProjectPayments };

/**
 * The hero on the phone (design A): what to collect now — the part due longest, exactly what it
 * still owes, how long it has waited — the money bar of received, due and still to come, and the
 * two acts. With nothing due it says when the next part falls due, or that every part is paid.
 */
export function MoneyHero(props: HeroProps) {
  const { payments, words } = props;
  const format = useFormat();
  const now = nowDueOf(payments);
  const next = nextUpOf(payments);
  return (
    <HeroPanel
      label={words.toCollectNow}
      labelAside={
        now?.part.dueOn ? (
          <StatusMark tone="warning" label={dueForOf(now.part.dueOn, payments.today, words)} />
        ) : undefined
      }
    >
      {now === null ? (
        <View style={styles.block}>
          <Text variant="figure">{next === null ? words.allIn : words.nothingDue}</Text>
          {next === null ? null : (
            <Text variant="body-sm" color="secondary">
              {words.nothingDueLine(format.word('stage', next.dueOnStage))}
            </Text>
          )}
        </View>
      ) : (
        <View style={styles.block}>
          <View style={styles.figureRow}>
            <Text variant="hero" oneLine>
              {format.money(now.request.amount)}
            </Text>
          </View>
          <Text variant="body-sm" color="secondary">
            {Number(now.part.received) > 0
              ? words.partOfWithIn(
                  now.part.label,
                  now.part.position,
                  payments.parts.length,
                  format.money(now.part.received),
                )
              : words.partOf(now.part.label, now.part.position, payments.parts.length)}
          </Text>
        </View>
      )}
      <MoneyBar {...props} />
      {now === null ? null : <HeroActs {...props} partId={now.part.id} />}
    </HeroPanel>
  );
}

/** Each segment's colour, the same on the bar and its swatch in the legend. */
const SEGMENT_LOOK = {
  in: { backgroundColor: colors.success },
  due: { backgroundColor: colors.accent },
  next: { backgroundColor: colors['line-strong'] },
} as const;

/** Received, due and still to come, one bar, each segment its own colour and named below it. */
function MoneyBar({ payments, words }: HeroProps) {
  const format = useFormat();
  const { money } = payments;
  const segments = barOf(payments);
  if (segments.length === 0) return null;
  const legend = {
    in: words.legendIn(format.money(money.collected)),
    due: words.legendDue(format.money(money.toCollect)),
    next: words.legendNext(format.money(money.next)),
  };
  return (
    <View style={styles.barFrame}>
      <View
        style={styles.bar}
        accessible
        accessibilityRole="image"
        accessibilityLabel={words.moneyBar(
          format.money(money.collected),
          format.money(money.toCollect),
          format.money(money.next),
        )}
      >
        {segments.map((segment) => (
          <View
            key={segment.key}
            style={[styles.segment, SEGMENT_LOOK[segment.key], { flexGrow: segment.weight }]}
          />
        ))}
      </View>
      <View
        style={styles.legend}
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
      >
        {segments.map((segment) => (
          <View key={segment.key} style={styles.legendItem}>
            <View style={[styles.swatch, SEGMENT_LOOK[segment.key]]} />
            <Text variant="caption" color="secondary">
              {legend[segment.key]}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function HeroActs(props: HeroProps & { readonly partId: string }) {
  const { collect, record } = heroActsOf(props, props.partId);
  return (
    <View style={styles.acts}>
      {collect === null ? null : (
        <Button
          variant="primary"
          size="lg"
          fullWidth
          icon={<ShellGlyph name="rupee" size="md" tone="inverse" />}
          onClick={collect.onClick}
        >
          {collect.label}
        </Button>
      )}
      {record === null ? null : (
        <Button
          variant="secondary"
          size="lg"
          fullWidth
          disabled={record.disabled}
          disabledReason={record.disabledReason}
          icon={<ShellGlyph name="plus" size="md" />}
          onClick={record.onClick}
        >
          {record.label}
        </Button>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  block: { gap: theme.spacing['sp-1'] },
  figureRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: theme.spacing['sp-2'],
  },
  barFrame: { gap: theme.spacing['sp-2'] },
  bar: {
    flexDirection: 'row',
    gap: theme.spacing['sp-1'],
    height: theme.spacing['sp-2'],
    overflow: 'hidden',
    borderRadius: theme.radius['r-pill'],
  },
  segment: {
    flexBasis: 0,
    minWidth: theme.spacing['sp-1'],
    borderRadius: theme.radius['r-pill'],
  },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: theme.spacing['sp-1'],
    columnGap: theme.spacing['sp-3'],
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing['sp-1'] },
  swatch: {
    width: theme.spacing['sp-2'],
    height: theme.spacing['sp-2'],
    flexShrink: 0,
    borderRadius: theme.radius['r-xs'],
  },
  acts: { gap: theme.spacing['sp-2'] },
});
