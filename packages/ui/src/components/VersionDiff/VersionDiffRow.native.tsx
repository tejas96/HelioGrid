/* VersionDiff's row (native) — the same block, the same order, the same four words. Phone width is
   what this design was drawn for, so the native half is the design rather than a reduction of it. */

import { theme } from '@heliogrid/theme';
import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { Text } from '../../primitives/Text/Text.native';
import { NamedGap } from '../NamedGap/NamedGap.native';
import { ProvenanceTier } from '../Provenance/Provenance.native';
import type { ProvenanceTierSpec } from '../Provenance/Provenance.types';
import { isTierOnly, resolveDiffRow } from './VersionDiff.resolve';
import type { DiffRow, DiffState } from './VersionDiff.types';

const STATE_WORD: Record<DiffState, string> = {
  changed: 'Changed',
  unchanged: 'Unchanged',
  added: 'Added',
  removed: 'Removed',
};

const STATE_TONE: Record<DiffState, { bg: string; fg: string }> = {
  changed: { bg: theme.colors['info-bg'], fg: theme.colors['info-text'] },
  unchanged: { bg: theme.colors['neutral-bg'], fg: theme.colors['neutral-text'] },
  added: { bg: theme.colors['success-bg'], fg: theme.colors['success-text'] },
  removed: { bg: theme.colors['warning-bg'], fg: theme.colors['warning-text'] },
};

const styles = StyleSheet.create({
  row: {
    gap: 6,
    paddingVertical: theme.spacing['sp-3'],
    borderTopWidth: 1,
    borderTopColor: theme.colors['canvas-sunken'],
  },
  head: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    columnGap: 10,
  },
  label: { fontWeight: '500', flexShrink: 1 },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    height: 20,
    paddingHorizontal: theme.spacing['sp-2'],
    borderRadius: theme.radius['r-pill'],
    flexShrink: 0,
  },
  pillDot: { width: 6, height: 6, borderRadius: theme.radius['r-pill'] },
  pillWord: { fontWeight: '500' },
  side: {
    flexDirection: 'row',
    alignItems: 'baseline',
    flexWrap: 'wrap',
    columnGap: theme.spacing['sp-2'],
    rowGap: theme.spacing['sp-1'],
  },
  stamp: {
    minWidth: 26,
    fontWeight: '700',
    letterSpacing: 0.88,
    textTransform: 'uppercase',
  },
  figure: {
    fontFamily: theme.type.families.mono,
    fontWeight: '700',
    fontSize: 14,
  },
  unit: { fontWeight: '400' },
  tierOnly: { gap: theme.spacing['sp-1'] },
  tierPair: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: theme.spacing['sp-2'],
  },
  moved: { flexDirection: 'row', alignItems: 'flex-start' },
  arrowDown: { marginTop: 1, marginLeft: 6 },
  movedSide: { flex: 1, minWidth: 0 },
});

function StatePill({ state }: { state: DiffState }) {
  const tone = STATE_TONE[state];
  return (
    <View style={[styles.pill, { backgroundColor: tone.bg }]}>
      <View style={[styles.pillDot, { backgroundColor: tone.fg }]} />
      <Text variant="caption" style={[styles.pillWord, { color: tone.fg }]}>
        {STATE_WORD[state]}
      </Text>
    </View>
  );
}

function Figure({ value, unit, strong }: { value: ReactNode; unit?: string; strong?: boolean }) {
  return (
    <Text
      variant="body-sm"
      color={strong ? 'primary' : 'secondary'}
      style={[styles.figure, strong ? { fontSize: theme.type.roles.body.fontSize } : null]}
    >
      {value}
      {unit ? (
        <Text variant="body-sm" color="tertiary" style={styles.unit}>
          {` ${unit}`}
        </Text>
      ) : null}
    </Text>
  );
}

function Side({
  stamp,
  value,
  unit,
  tier,
  strong,
  gap,
}: {
  stamp: string;
  value?: ReactNode;
  unit?: string;
  tier?: ProvenanceTierSpec;
  strong?: boolean;
  gap?: string;
}) {
  return (
    <View style={styles.side}>
      <Text variant="overline" color="tertiary" style={styles.stamp}>
        {stamp}
      </Text>
      {gap ? (
        <NamedGap gap={gap} scale="cell" />
      ) : (
        <Figure value={value} unit={unit} strong={strong} />
      )}
      {tier ? <ProvenanceTier tier={tier} size={12} /> : null}
    </View>
  );
}

function Arrow({ down }: { down?: boolean }) {
  return (
    <View style={down ? styles.arrowDown : null}>
      <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
        <Path
          d={down ? 'M12 5v14M6 13l6 6 6-6' : 'M5 12h14M13 6l6 6-6 6'}
          stroke={theme.colors['text-tertiary']}
          strokeWidth={1.8}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    </View>
  );
}

export function VersionDiffRow({
  row,
  beforeStamp,
  afterStamp,
  removedLabel,
  addedLabel,
}: {
  row: DiffRow;
  beforeStamp: string;
  afterStamp: string;
  removedLabel: string;
  addedLabel?: ReactNode;
}) {
  const st = resolveDiffRow(row);
  const tierOnly = isTierOnly(row, st);
  return (
    <View style={styles.row}>
      <View style={styles.head}>
        <Text variant="body-sm" style={styles.label}>
          {row.label}
        </Text>
        <StatePill state={st} />
      </View>

      {tierOnly ? (
        /* The value did not move; the TIER did — on SCR-M06-18 that tier change is the content. */
        <View style={styles.tierOnly}>
          <Figure value={row.after} unit={row.unit} strong />
          <View style={styles.tierPair}>
            <ProvenanceTier tier={row.beforeTier} size={12} />
            <Arrow />
            <ProvenanceTier tier={row.afterTier} size={12} />
          </View>
        </View>
      ) : null}

      {!tierOnly && st === 'added' ? (
        <Side stamp={afterStamp} value={row.after} unit={row.unit} tier={row.afterTier} strong />
      ) : null}

      {!tierOnly && st === 'removed' ? (
        <>
          <Side stamp={beforeStamp} value={row.before} unit={row.unit} tier={row.beforeTier} />
          <Side stamp={afterStamp} gap={row.gapLabel || removedLabel} />
        </>
      ) : null}

      {!tierOnly && st === 'unchanged' ? (
        <Side
          stamp={`${beforeStamp} · ${afterStamp}`}
          value={row.after ?? row.before}
          unit={row.unit}
          tier={row.afterTier || row.beforeTier}
        />
      ) : null}

      {!tierOnly && st === 'changed' ? (
        <>
          <Side stamp={beforeStamp} value={row.before} unit={row.unit} tier={row.beforeTier} />
          <View style={styles.moved}>
            <Arrow down />
            <View style={styles.movedSide}>
              <Side
                stamp={afterStamp}
                value={row.after}
                unit={row.unit}
                tier={row.afterTier}
                strong
              />
            </View>
          </View>
        </>
      ) : null}

      {row.note ? (
        <Text variant="caption" color="tertiary">
          {row.note}
        </Text>
      ) : null}
      {st === 'added' && addedLabel ? (
        <Text variant="caption" color="tertiary">
          {addedLabel}
        </Text>
      ) : null}
    </View>
  );
}
