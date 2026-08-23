import { theme } from '@heliogrid/theme';
import { Text as RNText, StyleSheet, View } from 'react-native';

interface BrandColorSpecimenProps {
  /** Normalised "#RRGGBB" — tenant DATA, so it is drawn inline. It is never a token. */
  hex: string;
  /** Whichever of white / near-black the document will set on the band. */
  textOn: string;
  companyName: string;
  /** True when the colour itself clears the text floor on paper and may set the figure. */
  figureInBrand: boolean;
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
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: theme.spacing['sp-3'],
    paddingVertical: theme.spacing['sp-2'],
    paddingHorizontal: 14,
    backgroundColor: theme.colors.surface,
  },
  line: {
    fontFamily: theme.type.families.sans,
    fontSize: theme.type.roles.caption.fontSize,
    color: theme.colors['text-secondary'],
  },
  figure: {
    fontFamily: theme.type.families.mono,
    fontSize: theme.type.roles.caption.fontSize,
    color: theme.colors['text-primary'],
  },
});

/**
 * The document context, and the ONLY thing the tenant colour paints. F7-07 makes the operator
 * application identical for every tenant, so this control writes no token and restyles nothing
 * around it — the two inline colours below are the tenant's data inside a specimen.
 */
export function BrandColorSpecimen({
  hex,
  textOn,
  companyName,
  figureInBrand,
}: BrandColorSpecimenProps) {
  return (
    <View style={styles.frame}>
      <View style={[styles.band, { backgroundColor: hex }]}>
        <RNText style={[styles.name, { color: textOn }]}>{companyName}</RNText>
        <RNText style={[styles.kind, { color: textOn }]}>Proposal</RNText>
      </View>
      <View style={styles.body}>
        <RNText style={styles.line}>8.4 kWp rooftop system</RNText>
        <RNText style={[styles.figure, figureInBrand ? { color: hex } : undefined]}>
          ₹4,52,471
        </RNText>
      </View>
    </View>
  );
}
