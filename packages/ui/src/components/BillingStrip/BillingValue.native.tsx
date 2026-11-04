import { theme } from '@heliogrid/theme';
import type { ReactNode } from 'react';
import { Text as RNText, StyleSheet } from 'react-native';
import { Text } from '../../primitives/Text/Text.native';
import type { TextColor, TextVariant } from '../../primitives/Text/Text.types';
import type { DerivationPart } from '../Derivation/Derivation.types';
import type { BillingValue, BillingWorkingPart } from './BillingStrip.types';

/**
 * A value's runs as a line's children: a figure's run changes the face to mono with tabular
 * figures (`F7-09`) and nothing else, so it keeps the line's size, weight and colour. Words stay
 * bare strings, so the holding `Text` resolves their script's face (`F3-13`).
 */
export function valueRuns(value: BillingValue): ReactNode[] {
  return value.map((run, index) =>
    run.mono ? (
      // biome-ignore lint/suspicious/noArrayIndexKey: runs are positional slices of one value
      <RNText key={index} style={styles.mono}>
        {run.text}
      </RNText>
    ) : (
      run.text
    ),
  );
}

/** A value on the region's right edge (brief decision 3), at the fact row's value size. */
export function BillingValueText({
  value,
  variant = 'body',
  color = 'primary',
  align = 'end',
}: {
  value: BillingValue;
  variant?: TextVariant;
  color?: TextColor;
  align?: 'start' | 'end';
}) {
  return (
    <Text variant={variant} color={color} align={align} style={styles.value}>
      {valueRuns(value)}
    </Text>
  );
}

/** `How it is worked out`'s parts, each sentence with its figures in mono. */
export function workingParts(parts: readonly BillingWorkingPart[]): DerivationPart[] {
  return parts.map((part) => ({
    kind: part.kind,
    label: part.label,
    text: valueRuns(part.value),
  }));
}

const styles = StyleSheet.create({
  mono: { fontFamily: theme.type.families.mono, fontVariant: ['tabular-nums'] },
  /* The fact row's value weight (`FactRow`'s `inks`), so a node value reads as its words would. */
  value: { fontWeight: '500' },
});
