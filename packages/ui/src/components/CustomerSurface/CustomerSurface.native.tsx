import { theme } from '@heliogrid/theme';
import type { StyleProp, ViewStyle } from 'react-native';
import { StyleSheet, View } from 'react-native';
import type { CustomerSurfaceProps } from './CustomerSurface.types';
import { TenantScopeContext } from './tenant-scope';
import { tenantTokens } from './tenant-tokens';

interface NativeCustomerSurfaceProps extends CustomerSurfaceProps {
  style?: StyleProp<ViewStyle>;
}

const styles = StyleSheet.create({
  root: {
    backgroundColor: theme.colors.canvas,
  },
  fullHeight: {
    flex: 1,
  },
});

/**
 * The scope a tenant's brand colour reaches — the other half of `F7-07`.
 *
 * WEB → RN MAPPING: the web half writes the resolved tokens as inline custom properties, which
 * is what makes the scope airtight. RN has no custom properties, so the same resolved map is
 * provided through `TenantScopeContext` (see tenant-scope.ts) and read by the components built
 * for it. `tenantName` is still never rendered — on native there is no `data-` attribute to
 * record it in, so it is carried for parity and deliberately unused.
 *
 * `fullHeight` maps to `flex: 1` rather than `min-height: 100%`, which RN's layout has no
 * equivalent for.
 */
export function CustomerSurface({
  brandColor,
  fullHeight = false,
  children,
  style,
}: NativeCustomerSurfaceProps) {
  const tokens = tenantTokens(brandColor);
  return (
    <TenantScopeContext.Provider value={tokens}>
      <View style={[styles.root, fullHeight ? styles.fullHeight : undefined, style]}>
        {children}
      </View>
    </TenantScopeContext.Provider>
  );
}

/** What the tenant colour resolved to, for a surface that needs the values directly. */
CustomerSurface.tokens = tenantTokens;
