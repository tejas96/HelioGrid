import { theme } from '@heliogrid/theme';
import { useRef, useState } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import { Dimensions, Pressable as RNPressable, ScrollView, StyleSheet, View } from 'react-native';
import { Portal } from '../../primitives/Portal/Portal.native';
import type { MenuItem, MenuProps } from './Menu.types';
import { MenuItemRow } from './MenuItemRow.native';
import { MenuTrigger } from './MenuTrigger.native';
import { menuRowKey } from './menu-walk';

interface NativeMenuProps extends MenuProps {
  style?: StyleProp<ViewStyle>;
}

interface Anchor {
  left: number;
  max: number;
  top: number;
  up: boolean;
}

const GAP = 6;
const MIN_BELOW = 160;

/**
 * Actions / overflow menu. A destructive item never relies on colour alone — it carries its own
 * trash glyph. `selection="single"` turns the list into a SWITCHER (`M13-10`) with a tick as the
 * non-colour channel and a reserved tick column, so labels stay put whichever entry is current.
 *
 * THREE WEB BEHAVIOURS MAPPED FOR TOUCH:
 * · The whole keyboard contract — arrow walk with wrap, Home/End, type-ahead, Escape, focus
 *   returned to the trigger — has no touch equivalent. The two acts are tap-to-open and
 *   tap-to-select, with a full-bleed scrim as the cancel that the outside-click listener was.
 * · There is no hover, so the web half's `data-active` row tint is carried by the Pressable
 *   primitive's own pressed state instead.
 * · `position: absolute` under the trigger becomes `measureInWindow` plus the Portal primitive, so
 *   nothing above the menu can clip it; the list rises instead of dropping when it would not fit.
 */
export function Menu({
  items = [],
  trigger,
  label = 'More actions',
  align = 'end',
  width = 220,
  selection = 'none',
  onSelect,
  disabled = false,
  style,
}: NativeMenuProps) {
  const [anchor, setAnchor] = useState<Anchor | null>(null);
  const wrapRef = useRef<View>(null);
  const open = anchor !== null;

  const openMenu = () => {
    wrapRef.current?.measureInWindow((x, y, triggerWidth, height) => {
      const windowSize = Dimensions.get('window');
      const below = windowSize.height - (y + height) - GAP;
      const above = y - GAP;
      const up = below < MIN_BELOW && above > below;
      const left = align === 'end' ? x + triggerWidth - width : x;
      setAnchor({
        left: Math.max(GAP, Math.min(left, windowSize.width - width - GAP)),
        max: Math.max(120, up ? above : below),
        top: up ? y - GAP : y + height + GAP,
        up,
      });
    });
  };

  const choose = (item: MenuItem) => {
    if (item.disabled === true) {
      return;
    }
    setAnchor(null);
    item.onSelect?.();
    const key = item.key ?? item.label;
    if (onSelect !== undefined && key !== undefined) {
      onSelect(key);
    }
  };

  const toggle = () => (open ? setAnchor(null) : openMenu());

  return (
    <View ref={wrapRef} collapsable={false} style={[styles.wrap, style]}>
      <MenuTrigger
        disabled={disabled}
        label={label}
        onToggle={toggle}
        open={open}
        trigger={trigger}
      />

      {anchor === null ? null : (
        <Portal>
          <RNPressable
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
            onPress={() => setAnchor(null)}
            style={styles.scrim}
          />
          <View
            accessibilityRole="menu"
            accessibilityLabel={label}
            style={[
              styles.list,
              {
                width,
                left: anchor.left,
                maxHeight: anchor.max,
                top: anchor.up ? anchor.top - anchor.max : anchor.top,
              },
            ]}
          >
            <ScrollView>
              {items.map((item, index) =>
                item.separator === true ? (
                  <View key={`separator-${menuRowKey(item, index)}`} style={styles.separator} />
                ) : (
                  <MenuItemRow
                    item={item}
                    key={menuRowKey(item, index)}
                    onSelect={() => choose(item)}
                    radio={selection === 'single'}
                  />
                ),
              )}
            </ScrollView>
          </View>
        </Portal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignSelf: 'flex-start' },
  scrim: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  list: {
    position: 'absolute',
    zIndex: 60,
    padding: 6,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius['r-md'],
    ...theme.elevation.e4,
  },
  /* A gap, never a rule: this system separates by luminance and space, not by lines. */
  separator: {
    height: 6,
    marginVertical: theme.spacing['sp-1'],
    marginHorizontal: 6,
  },
});
