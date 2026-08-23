/* Provenance (native) — same law, same words, same order as the web half: the WORD is the carrier
   and the 5px dot is the second, non-colour channel (N6). F8-07 forbids a tooltip and a hover, so
   there is nothing here that a touch device could not render; the whole line is always visible. */

import { theme } from '@heliogrid/theme';
import type { ReactNode } from 'react';
import { isValidElement } from 'react';
import type { StyleProp, TextStyle, ViewStyle } from 'react-native';
import { StyleSheet, View } from 'react-native';
import { Text } from '../../primitives/Text/Text.native';
import type { TextColor } from '../../primitives/Text/Text.types';
import {
  isProvenanceEmpty,
  PROVENANCE_STANDINGS,
  provenanceStep,
  resolveTier,
} from './Provenance.tiers';
import type {
  ProvenanceAlign,
  ProvenanceMarkToken,
  ProvenanceProps,
  ProvenanceTierProps,
  ProvenanceTierSpec,
} from './Provenance.types';

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
export function ProvenanceTier({
  tier,
  withLabel = true,
  size = 12,
  style,
}: NativeProvenanceTierProps) {
  const t = resolveTier(tier);
  if (!t) {
    return null;
  }
  const step = provenanceStep(size);
  /* `withLabel={false}` keeps the word for assistive tech — the visible carrier is the dot, but
     the meaning is never colour alone. RN has no clip-rect, so the label rides the container's
     accessibilityLabel instead of a visually-hidden node. */
  return (
    <View
      style={[styles.part, style]}
      accessible
      accessibilityLabel={withLabel ? undefined : t.label}
    >
      <Dot token={t.color} />
      {withLabel ? (
        <Text variant="caption" color="tertiary" style={SIZE[step]}>
          {t.label}
        </Text>
      ) : null}
    </View>
  );
}

export function Provenance({
  tier,
  standing,
  source,
  projection,
  note,
  size = 12,
  align = 'left',
  inline = false,
  style,
}: NativeProvenanceProps) {
  const t = resolveTier(tier);
  const st = standing ? PROVENANCE_STANDINGS[standing] : null;
  const step = provenanceStep(size);
  const parts: { id: string; node: ReactNode }[] = [];

  /* Standing leads: "this is not final" outranks "this is how it was worked out". */
  if (st) {
    parts.push({
      id: 'standing',
      node: (
        <View style={styles.part}>
          <Dot token={st.mark} />
          <Text variant="caption" color={WORD_COLOR[st.color] ?? 'tertiary'} style={SIZE[step]}>
            {st.label}
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
          <Dot token={t.color} />
          <Text variant="caption" color="tertiary" style={SIZE[step]}>
            {t.label}
          </Text>
        </View>
      ),
    });
  }
  for (const [id, words] of [
    ['source', source],
    ['projection', projection],
    ['note', note],
  ] as const) {
    if (words) {
      parts.push({
        id,
        node: (
          <Text variant="caption" color="tertiary" style={SIZE[step]}>
            {words}
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

/** Accepts either a spec object or a ready node, so every host can offer ONE `provenance` prop. */
export function renderProvenance(
  spec?: ProvenanceProps | ProvenanceTierSpec | ReactNode,
  extra: Partial<ProvenanceProps> = {},
): ReactNode {
  if (!spec) {
    return null;
  }
  if (isValidElement(spec)) {
    return spec;
  }
  if (typeof spec === 'string') {
    return <Provenance tier={spec} {...extra} />;
  }
  if (typeof spec !== 'object') {
    return null;
  }
  const props = spec as ProvenanceProps;
  if (isProvenanceEmpty(props)) {
    return null;
  }
  return <Provenance {...props} {...extra} />;
}
