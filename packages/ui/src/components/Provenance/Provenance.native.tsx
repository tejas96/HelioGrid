/* Provenance (native) — same law, same words, same order as the web half: the WORD is the carrier
   and the 5px dot is the second, non-colour channel (N6). F8-07 forbids a tooltip and a hover, so
   there is nothing here that a touch device could not render; the whole line is always visible. */

import { theme } from '@heliogrid/theme';
import type { ReactNode } from 'react';
import type { StyleProp, TextStyle, ViewStyle } from 'react-native';
import { StyleSheet, View } from 'react-native';
import { Text } from '../../primitives/Text/Text.native';
import type { TextColor } from '../../primitives/Text/Text.types';
import {
  FRESHNESS_MARK,
  freshnessWarning,
  isProvenanceEmpty,
  provenanceStep,
  STANDING_MARK,
  TIER_MARK,
  tierOf,
} from './Provenance.tiers';
import type {
  ProvenanceAlign,
  ProvenanceMarkToken,
  ProvenanceProps,
  ProvenanceTierProps,
  ProvenanceTierSpec,
} from './Provenance.types';
import { useProvenanceWords } from './Provenance.words';

/* Mark tokens → theme colours. --warning is not a mark in this system (it clears 3:1 on no
   background), so a warning mark lands on --warning-text, exactly as the web half maps it. */
const MARK: Record<ProvenanceMarkToken, string> = {
  success: theme.colors.success,
  'success-text': theme.colors['success-text'],
  info: theme.colors.info,
  'info-text': theme.colors['info-text'],
  warning: theme.colors['warning-text'],
  'warning-text': theme.colors['warning-text'],
  danger: theme.colors.danger,
  'danger-text': theme.colors['danger-text'],
  neutral: theme.colors.neutral,
  'neutral-text': theme.colors['neutral-text'],
  accent: theme.colors.accent,
  'text-tertiary': theme.colors['text-tertiary'],
  'text-secondary': theme.colors['text-secondary'],
  'mark-subtle': theme.colors['mark-subtle'],
};

/** The standing's own word colour, expressed in the Text primitive's role vocabulary. */
const WORD_COLOR: Partial<Record<ProvenanceMarkToken, TextColor>> = {
  'success-text': 'success',
  'warning-text': 'warning',
  'danger-text': 'danger',
  'info-text': 'info',
  'text-tertiary': 'tertiary',
  'text-secondary': 'secondary',
};

const ALIGN: Record<ProvenanceAlign, ViewStyle['justifyContent']> = {
  left: 'flex-start',
  center: 'center',
  right: 'flex-end',
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    rowGap: theme.spacing['sp-0-5'],
    columnGap: theme.spacing['sp-2'],
  },
  part: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing['sp-1'],
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: theme.radius['r-pill'],
    flexShrink: 0,
  },
});

const SIZE: Record<12 | 13, TextStyle> = {
  12: { fontSize: theme.type.roles.caption.fontSize },
  13: { fontSize: theme.type.roles['body-sm'].fontSize },
};

interface NativeProvenanceProps extends ProvenanceProps {
  style?: StyleProp<ViewStyle>;
}

interface NativeProvenanceTierProps extends ProvenanceTierProps {
  style?: StyleProp<ViewStyle>;
}

/** Second channel only (N6). The word beside it already carries the meaning. */
function Dot({ token }: { token: ProvenanceMarkToken }) {
  return <View style={[styles.dot, { backgroundColor: MARK[token] }]} />;
}

/** The tier on its own — word first, dot as the second channel. */
export function ProvenanceTier({ tier, size = 12, style }: NativeProvenanceTierProps) {
  const words = useProvenanceWords();
  const t = tierOf(tier);
  if (!t) {
    return null;
  }
  const step = provenanceStep(size);
  return (
    <View style={[styles.part, style]}>
      <Dot token={TIER_MARK[t]} />
      <Text variant="caption" color="tertiary" style={SIZE[step]}>
        {words.tier(t)}
      </Text>
    </View>
  );
}

export function Provenance({
  tier,
  standing,
  freshness,
  energySource,
  source,
  projection,
  note,
  size = 12,
  align = 'left',
  inline = false,
  style,
}: NativeProvenanceProps) {
  const words = useProvenanceWords();
  const t = tierOf(tier);
  const step = provenanceStep(size);
  const parts: { id: string; node: ReactNode }[] = [];

  /* Standing leads: "this is not final" outranks "this is how it was worked out". */
  if (standing) {
    const st = STANDING_MARK[standing];
    parts.push({
      id: 'standing',
      node: (
        <View style={styles.part}>
          <Dot token={st.mark} />
          <Text variant="caption" color={WORD_COLOR[st.color] ?? 'tertiary'} style={SIZE[step]}>
            {words.standing(standing)}
          </Text>
        </View>
      ),
    });
  }
  const warning = freshnessWarning(freshness);
  if (warning) {
    parts.push({
      id: 'freshness',
      node: (
        <View style={styles.part}>
          <Dot token={FRESHNESS_MARK.mark} />
          <Text
            variant="caption"
            color={WORD_COLOR[FRESHNESS_MARK.color] ?? 'tertiary'}
            style={SIZE[step]}
          >
            {words.freshness(warning)}
          </Text>
        </View>
      ),
    });
  }
  if (t) {
    parts.push({
      id: 'tier',
      node: (
        <View style={styles.part}>
          <Dot token={TIER_MARK[t]} />
          <Text variant="caption" color="tertiary" style={SIZE[step]}>
            {words.tier(t)}
          </Text>
        </View>
      ),
    });
  }
  for (const [id, prose] of [
    ['energySource', energySource ? words.energySource(energySource) : undefined],
    ['source', source],
    ['projection', projection],
    ['note', note],
  ] as const) {
    if (prose) {
      parts.push({
        id,
        node: (
          <Text variant="caption" color="tertiary" style={SIZE[step]}>
            {prose}
          </Text>
        ),
      });
    }
  }
  if (parts.length === 0) {
    return null;
  }

  return (
    <View
      style={[
        styles.row,
        { justifyContent: ALIGN[align] },
        inline ? { rowGap: theme.spacing['sp-0'] } : null,
        style,
      ]}
    >
      {parts.map((part, i) => (
        <View key={part.id} style={styles.part}>
          {/* The middot is a separator, not content — hidden from assistive tech, exactly as the
              web half's aria-hidden span is. */}
          {i > 0 ? (
            <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
              <Text
                variant="caption"
                color="tertiary"
                style={[SIZE[step], { color: theme.colors['mark-subtle'] }]}
              >
                ·
              </Text>
            </View>
          ) : null}
          {part.node}
        </View>
      ))}
    </View>
  );
}

/** True when a spec would render NOTHING — lets a host skip the slot without guessing. */
Provenance.isEmpty = isProvenanceEmpty;

/**
 * Accepts a spec object or a bare tier, so every host can offer ONE `provenance` prop. Never a
 * ready node: a caller's element could print a fifth tier past the closed set (`F8-03`).
 */
export function renderProvenance(
  spec?: ProvenanceProps | ProvenanceTierSpec | null,
  extra: Partial<ProvenanceProps> = {},
): ReactNode {
  if (!spec) {
    return null;
  }
  /* A bare tier goes through the same emptiness guard as a spec: `renderProvenance("unmarked")`
     must hand back null, or every host draws its slot around the deliberate absence. */
  const props: ProvenanceProps = typeof spec === 'string' ? { tier: spec } : spec;
  const merged = { ...props, ...extra };
  return isProvenanceEmpty(merged) ? null : <Provenance {...merged} />;
}
