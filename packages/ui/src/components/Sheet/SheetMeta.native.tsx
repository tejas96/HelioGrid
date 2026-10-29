import { theme } from '@heliogrid/theme';
import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import type { SheetDensity } from './Sheet.types';

/** The row between the header and the body, drawn only when the caller gave one. */
export function SheetMeta({ meta, density }: { meta: ReactNode; density: SheetDensity }) {
  if (meta === undefined || meta === null) return null;
  return (
    <View style={density === 'expressive' ? styles.metaExpressive : styles.metaFunctional}>
      {meta}
    </View>
  );
}

const styles = StyleSheet.create({
  metaExpressive: { paddingHorizontal: theme.spacing['sp-5'] },
  metaFunctional: { paddingHorizontal: theme.spacing['sp-4'] },
});
