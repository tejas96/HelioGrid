import { theme } from '@heliogrid/theme';
import { Text as RNText, StyleSheet, View } from 'react-native';
import type { BrandColorSpecimenProps } from './BrandColorField.types';

/**
 * The document context, and the ONLY thing the tenant colour paints. F7-07 makes the operator
 * application identical for every tenant, so this control writes no token and restyles nothing
 * around it — the inline colours below are the tenant's data inside a specimen. No figure.
 */
export function BrandColorSpecimen({
  hex,
  textOn,
  companyName,
  kindWord,
  word,
  wordColour,
}: BrandColorSpecimenProps) {
  return (
    <View style={styles.frame}>
      <View style={[styles.band, { backgroundColor: hex }]}>
        {companyName === undefined ? null : (
          <RNText style={[styles.name, { color: textOn }]}>{companyName}</RNText>
        )}
        <RNText style={[styles.kind, { color: textOn }]}>{kindWord}</RNText>
      </View>
      <View style={styles.body}>
        <RNText style={[styles.word, { color: wordColour }]}>{word}</RNText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    borderRadius: theme.radius['r-md'],
    overflow: 'hidden',
    ...theme.elevation.e1,
  },
  band: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: theme.spacing['sp-3'],
    paddingVertical: theme.spacing['sp-3'],
    paddingHorizontal: 14,
  },
  name: { fontFamily: theme.type.families.sans, fontWeight: '700', fontSize: 14 },
  kind: { fontFamily: theme.type.families.sans, fontWeight: '500', fontSize: 11, opacity: 0.85 },
  body: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    // biome-ignore lint/plugin/raw-white: paper — a document, a drawing sheet, a QR code's quiet zone, a brand specimen
    backgroundColor: theme.colors.surface,
  },
  word: {
    fontFamily: theme.type.families.sans,
    fontWeight: '700',
    fontSize: theme.type.roles.caption.fontSize,
  },
});
