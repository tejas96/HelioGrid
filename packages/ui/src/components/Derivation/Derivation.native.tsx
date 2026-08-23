import { theme } from '@heliogrid/theme';
import type { StyleProp, ViewStyle } from 'react-native';
import { Pressable as RNPressable, StyleSheet, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { Icon } from '../../primitives/Icon/Icon.native';
import { MIN_TOUCH_TARGET } from '../../primitives/Pressable';
import { Text } from '../../primitives/Text/Text.native';
import type { DerivationProps } from './Derivation.types';
import { DERIVATION_KINDS } from './Derivation.types';
import { DerivationGroup } from './DerivationGroup.native';
import { DerivationParts } from './DerivationParts.native';
import { useDerivationPanel } from './useDerivationPanel';

const styles = StyleSheet.create({
  root: { flexDirection: 'column', gap: theme.spacing['sp-1'] },
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    minHeight: MIN_TOUCH_TARGET,
  },
  panel: {
    flexDirection: 'column',
    gap: 10,
    borderRadius: theme.radius['r-md'],
    backgroundColor: theme.colors['canvas-sunken'],
  },
  panelCell: { paddingVertical: theme.spacing['sp-3'], paddingHorizontal: 14 },
  panelBlock: { paddingVertical: 14, paddingHorizontal: theme.spacing['sp-4'] },
  open: { transform: [{ rotate: '90deg' }] },
});

function Chevron({ open }: { open: boolean }) {
  return (
    <View style={open ? styles.open : undefined}>
      <Icon size="xs" color={theme.colors['text-secondary']}>
        <Svg viewBox="0 0 24 24" fill="none">
          <Path
            d="M9 6l6 6-6 6"
            stroke={theme.colors['text-secondary']}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      </Icon>
    </View>
  );
}

interface NativeDerivationProps extends DerivationProps {
  style?: StyleProp<ViewStyle>;
}

/**
 * **The long-form explanation of a read-only computed number.**
 *
 * `Provenance` is the always-visible **label**; this is the openable **argument**. They are not
 * alternatives, which is why there is no `tier` prop here — passing one would let a caller retire
 * a persistent label behind a disclosure (`F8-07`).
 *
 * The trigger is a real 44px control announcing its expanded state, and the panel renders **in the
 * flow beneath its own row** — never a floating layer, which is the tooltip failure mode this
 * component exists to avoid, and which touch makes worse rather than better.
 */
export function Derivation({
  label,
  summary = 'How this is worked out',
  parts,
  variant = 'cell',
  open,
  defaultOpen = false,
  onToggle,
  id,
  style,
}: NativeDerivationProps) {
  const panel = useDerivationPanel({ parts, label, summary, open, defaultOpen, onToggle, id });
  const big = variant === 'block';

  return (
    <View style={[styles.root, style]}>
      <RNPressable
        accessibilityRole="button"
        accessibilityState={{ expanded: panel.isOpen }}
        onPress={panel.toggle}
        style={styles.trigger}
      >
        <Chevron open={panel.isOpen} />
        <Text variant={big ? 'body-sm' : 'caption'} color="secondary" style={{ fontWeight: '500' }}>
          {summary}
        </Text>
      </RNPressable>
      {panel.isOpen ? (
        <View style={[styles.panel, big ? styles.panelBlock : styles.panelCell]}>
          {label !== undefined && big ? (
            <Text variant="caption" style={{ fontWeight: '600' }}>
              {label}
            </Text>
          ) : null}
          <DerivationParts parts={parts} size={big ? 'md' : 'sm'} />
        </View>
      ) : null}
    </View>
  );
}

Derivation.Group = DerivationGroup;
Derivation.kinds = DERIVATION_KINDS;

export { DerivationGroup };
