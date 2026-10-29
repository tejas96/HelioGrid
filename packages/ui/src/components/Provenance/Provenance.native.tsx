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
  isProvenanceEmpty,
  type ProvenanceLinePart,
  provenanceLineParts,
  provenanceSpecOf,
  provenanceStep,
  TIER_MARK,
  tierOf,
} from './Provenance.tiers';
import type {
  ProvenanceAlign,
  ProvenanceEmphasis,
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

/** The words' role: the quiet role, or the secondary one where the line is load-bearing (`F7-11`). */
const WORDS: Record<ProvenanceEmphasis, TextColor> = {
  quiet: 'tertiary',
  'load-bearing': 'secondary',
};

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
export function ProvenanceTier({
  tier,
  size = 12,
  emphasis = 'quiet',
  style,
}: NativeProvenanceTierProps) {
  const words = useProvenanceWords();
  const t = tierOf(tier);
  if (!t) {
    return null;
  }
  const step = provenanceStep(size);
  return (
    <View style={[styles.part, style]}>
      <Dot token={TIER_MARK[t]} />
      <Text variant="caption" color={WORDS[emphasis]} style={SIZE[step]}>
        {words.tier(t)}
      </Text>
    </View>
  );
}

/** Standing and freshness tint their words; the tier keeps the quiet ink; prose has no dot. */
function LinePart({
  part,
  ink,
  step,
}: {
  part: ProvenanceLinePart;
  ink: TextColor;
  step: 12 | 13;
}) {
  const words = (
    <Text
      variant="caption"
      color={part.ink === null ? ink : (WORD_COLOR[part.ink] ?? ink)}
      style={SIZE[step]}
    >
      {part.words}
    </Text>
  );
  if (part.mark === null) {
    return words;
  }
  return (
    <View style={styles.part}>
      <Dot token={part.mark} />
      {words}
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
  emphasis = 'quiet',
  style,
}: NativeProvenanceProps) {
  const step = provenanceStep(size);
  const ink = WORDS[emphasis];
  const parts = provenanceLineParts(
    { tier, standing, freshness, energySource, source, projection, note },
    useProvenanceWords(),
  );
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
                {'·'}
              </Text>
            </View>
          ) : null}
          <LinePart part={part} ink={ink} step={step} />
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
  const merged = provenanceSpecOf(spec, extra);
  return merged === null ? null : <Provenance {...merged} />;
}
