import { theme } from '@heliogrid/theme';
import { useState } from 'react';
import type { ImageLoadEventData, NativeSyntheticEvent, StyleProp, ViewStyle } from 'react-native';
import { Image, StyleSheet, View } from 'react-native';
import { Text } from '../../primitives/Text/Text.native';
import { useTenantScope } from '../CustomerSurface/tenant-scope';
import type { TenantHeaderProps, TenantMarkProps } from './TenantHeader.types';
import { isLogoUrl, tenantInitials } from './tenant-initials';

interface NativeTenantMarkProps extends TenantMarkProps {
  style?: StyleProp<ViewStyle>;
}

interface NativeTenantHeaderProps extends TenantHeaderProps {
  style?: StyleProp<ViewStyle>;
}

/** The widest a logo may run beside the mark, as a multiple of the mark's height. */
const LOGO_MAX_RATIO = 3.4;

const styles = StyleSheet.create({
  mark: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing['sp-3'], minWidth: 0 },
  monogram: { alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  text: { flexDirection: 'column', minWidth: 0, flexShrink: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing['sp-4'],
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingVertical: theme.spacing['sp-4'],
    paddingHorizontal: theme.spacing['sp-5'],
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius['r-lg'],
  },
  headerCentered: { justifyContent: 'center' },
  lockup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing['sp-4'],
    minWidth: 0,
    flexShrink: 1,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing['sp-3'],
    flexShrink: 0,
  },
  name: { fontWeight: '700', letterSpacing: theme.type.roles.h2.letterSpacing },
  headerName: {
    fontSize: theme.type.roles.h4.fontSize,
    fontWeight: '700',
    letterSpacing: theme.type.roles.h2.letterSpacing,
  },
});

/**
 * The fallback monogram.
 *
 * WEB → RN MAPPING: the web monogram fills with `var(--tenant-mark, var(--neutral-bg))`. RN has
 * no custom properties, so the same pair — already gated on the contrast floor by
 * `CustomerSurface` — is read from the scope context with the same neutral fallback. Outside a
 * `CustomerSurface` there is no provider, so operator chrome is identical for every tenant.
 */
function Monogram({ name, size, radius, showName }: MonogramProps) {
  const scope = useTenantScope();
  return (
    <View
      accessible={!showName}
      accessibilityRole={showName ? undefined : 'image'}
      accessibilityLabel={showName ? undefined : name}
      importantForAccessibility={showName ? 'no-hide-descendants' : 'yes'}
      style={[
        styles.monogram,
        {
          width: size,
          height: size,
          borderRadius: radius ?? Math.round(size * 0.3),
          backgroundColor: scope?.['--tenant-mark'] ?? theme.colors['neutral-bg'],
        },
      ]}
    >
      <Text
        style={{
          fontFamily: theme.type.families.sans,
          fontWeight: '700',
          fontSize: Math.round(size * 0.42),
          letterSpacing: theme.type.roles.h2.letterSpacing,
          color: scope?.['--tenant-mark-on'] ?? theme.colors['neutral-text'],
        }}
      >
        {tenantInitials(name)}
      </Text>
    </View>
  );
}

interface MonogramProps {
  name: string;
  size: number;
  radius: number | undefined;
  showName: boolean;
}

/**
 * A remote logo has no intrinsic size in RN, so its aspect ratio is read on load and the box
 * follows — the web half gets the same result from `width: auto` plus a max-width.
 */
function LogoImage({
  logo,
  name,
  size,
  showName,
}: { logo: string } & Omit<MonogramProps, 'radius'>) {
  const [ratio, setRatio] = useState<number | null>(null);
  return (
    <Image
      source={{ uri: logo }}
      accessible={!showName}
      accessibilityLabel={showName ? undefined : `${name} logo`}
      onLoad={(event: NativeSyntheticEvent<ImageLoadEventData>) => {
        const source = event.nativeEvent.source;
        if (source.height > 0) {
          setRatio(source.width / source.height);
        }
      }}
      resizeMode="contain"
      style={{ height: size, width: size * Math.min(ratio ?? LOGO_MAX_RATIO, LOGO_MAX_RATIO) }}
    />
  );
}

function TenantMarkGlyph({ logo, name, size, radius, showName }: TenantMarkProps & MonogramProps) {
  if (isLogoUrl(logo)) {
    return <LogoImage logo={logo} name={name} size={size} showName={showName} />;
  }
  if (logo) {
    return <View style={styles.monogram}>{logo}</View>;
  }
  return <Monogram name={name} size={size} radius={radius} showName={showName} />;
}

/** The mark + name lockup. Identity, never theme. */
export function TenantMark({
  logo,
  name,
  size = 32,
  showName = true,
  meta,
  radius,
  style,
}: NativeTenantMarkProps) {
  return (
    <View style={[styles.mark, style]}>
      <TenantMarkGlyph logo={logo} name={name} size={size} radius={radius} showName={showName} />
      {showName ? (
        <View style={styles.text}>
          {/* No numberOfLines: the Text primitive exposes none, so a long name wraps here
              where the web half ellipsises it. */}
          <Text style={styles.name}>{name}</Text>
          {meta === undefined ? null : (
            <Text variant="caption" color="tertiary">
              {meta}
            </Text>
          )}
        </View>
      ) : null}
    </View>
  );
}

/**
 * The page-level identity band for a customer link page. Mount it inside `CustomerSurface` and
 * the tenant's colour arrives through the scope with no prop.
 *
 * `as` HAS NO RN EQUIVALENT, AND `accessibilityRole="header"` WAS NOT IT. The web half's default
 * element is `<header>` — the BANNER LANDMARK, a region of the page. RN's `header` is a different
 * word for a different thing: it is the HEADING trait, what `<h2>` carries, and landmarks have no
 * React Native partner at all (check h, NO_RN_ROLE names this exact family). The band holds a
 * mark, a name, a caption and `actions`, so announcing all of it as one heading said something
 * untrue; its words are read in order instead, which is what the landmark bought on the web too.
 */
export function TenantHeader({
  logo,
  name,
  caption,
  size = 44,
  actions,
  align = 'left',
  style,
}: NativeTenantHeaderProps) {
  return (
    <View
      style={[
        styles.header,
        align === 'center' ? styles.headerCentered : undefined,
        theme.elevation.e1,
        style,
      ]}
    >
      <View style={styles.lockup}>
        <TenantMark logo={logo} name={name} size={size} showName={false} />
        <View style={styles.text}>
          <Text style={styles.headerName}>{name}</Text>
          {caption === undefined ? null : (
            <Text variant="body-sm" color="secondary">
              {caption}
            </Text>
          )}
        </View>
      </View>
      {actions ? <View style={styles.actions}>{actions}</View> : null}
    </View>
  );
}

/** The inline lockup, for a top bar. Same component as `TenantMark`. */
TenantHeader.Mark = TenantMark;
