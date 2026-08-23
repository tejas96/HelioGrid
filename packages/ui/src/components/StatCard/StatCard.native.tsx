/* StatCard (native) — same adjacency rule, same figure rule, same two delta facts.

   THE ADJACENCY RULE: the tier renders in the component's own `provenance` slot — directly under
   the value, above the delta and above `children`. Never in `children`.

   The web half's hover lift has no touch equivalent; the Pressable primitive's pressed state is
   what a finger gets instead, and it already owns the 44px floor (which a whole card clears many
   times over).

   Same decomposition as the web half: the two delta facts are `StatCardDelta`, and how the figure
   is written is `StatCard.format`, shared by both halves so the two print the same number. */

import { theme } from '@heliogrid/theme';
import type { StyleProp, ViewStyle } from 'react-native';
import { StyleSheet, View } from 'react-native';
import { Pressable } from '../../primitives/Pressable/Pressable.native';
import { Text } from '../../primitives/Text/Text.native';
import { renderBand } from '../BandedFigure/BandChip.native';
import { useFormat } from '../MarketProvider';
import { renderGap } from '../NamedGap/NamedGap.native';
import { renderProvenance } from '../Provenance/Provenance.native';
import { formatStatValue } from './StatCard.format';
import type { StatCardProps } from './StatCard.types';
import { StatCardDelta } from './StatCardDelta.native';
import { StatCardStates } from './StatCardStates.native';

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius['r-card-expressive'],
    padding: theme.spacing['sp-6'],
    overflow: 'hidden',
    ...theme.elevation.e2,
  },
  button: { alignItems: 'stretch', justifyContent: 'flex-start', width: '100%' },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: theme.spacing['sp-1'],
    marginTop: 10,
  },
  value: { fontWeight: '700' },
  band: { alignSelf: 'center', marginLeft: theme.spacing['sp-1'] },
  slot: { marginTop: 6 },
  gap: { marginTop: 10 },
});

interface NativeStatCardProps extends StatCardProps {
  style?: StyleProp<ViewStyle>;
}

export function StatCard({
  label,
  value,
  unit,
  money = false,
  compact = false,
  gap,
  delta,
  deltaDir = 'up',
  deltaSentiment = 'neutral',
  sentimentLabel,
  band,
  provenance,
  onClick,
  ariaLabel,
  state = 'ready',
  emptyMessage = 'No figure for this period yet.',
  errorMessage = "Couldn't read this figure. Try again — nothing here is a stale number.",
  onRetry,
  unavailableTitle = 'Not measured here',
  unavailableMessage,
  style,
  children,
}: NativeStatCardProps) {
  const f = useFormat();
  const gapNode = renderGap(gap, { scale: 'headline' });
  const shown = formatStatValue(value, { money, compact, format: f });
  const prov = gapNode ? null : renderProvenance(provenance, { size: 12 });
  const bandNode = gapNode ? null : renderBand(band, { size: 12 });

  const overline = (
    <Text variant="overline" color="tertiary">
      {label}
    </Text>
  );

  /* Every non-ready state returns here, and none of them prints a figure. */
  if (state !== 'ready') {
    return (
      <View style={[styles.card, style]}>
        {overline}
        <StatCardStates
          state={state}
          label={label}
          emptyMessage={emptyMessage}
          errorMessage={errorMessage}
          onRetry={onRetry}
          unavailableTitle={unavailableTitle}
          unavailableMessage={unavailableMessage}
        />
      </View>
    );
  }

  const body = (
    <>
      {overline}
      {/* An absent figure is named in the value's own footprint — never a dash, never a zero. */}
      {gapNode ? (
        <View style={styles.gap}>{gapNode}</View>
      ) : (
        <View style={styles.valueRow}>
          <Text variant="h1" style={styles.value}>
            {shown}
          </Text>
          {unit ? (
            <Text variant="body" color="secondary">
              {unit}
            </Text>
          ) : null}
          {bandNode ? <View style={styles.band}>{bandNode}</View> : null}
        </View>
      )}
      {/* The slot. Directly under the value, above everything else. Never beside a gap. */}
      {prov ? <View style={styles.slot}>{prov}</View> : null}
      <StatCardDelta
        delta={delta}
        dir={deltaDir}
        sentiment={deltaSentiment}
        sentimentLabel={sentimentLabel}
        suppressed={Boolean(gapNode)}
      />
      {children}
    </>
  );

  if (onClick) {
    return (
      <Pressable
        onPress={onClick}
        accessibilityLabel={ariaLabel}
        style={[styles.card, styles.button, style]}
      >
        {body}
      </Pressable>
    );
  }
  return <View style={[styles.card, style]}>{body}</View>;
}
