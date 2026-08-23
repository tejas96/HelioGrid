import { theme } from '@heliogrid/theme';
import type { ReactNode } from 'react';
import type { TextStyle } from 'react-native';
import { StyleSheet, View } from 'react-native';
import { Pressable } from '../../primitives/Pressable/Pressable.native';
import { Text } from '../../primitives/Text/Text.native';
import { renderActionReason } from '../ActionReason/ActionReason.native';
import { renderMarks } from '../ChipGroup/ChipGroup.native';
import type { MenuItem } from './Menu.types';
import { MenuLeadGlyph, MenuTick } from './MenuGlyphs.native';
import { menuLabelColor, menuRowShape } from './menu-row';

interface MenuItemRowProps {
  item: MenuItem;
  onSelect: () => void;
  /** `single` turns the list into a switcher with a RESERVED tick column. */
  radio: boolean;
}

/**
 * One menu row, through the Pressable primitive — which owns the 44dp floor.
 *
 * AN ITEM THAT IS OFF SAYS WHY. `disabledReason` renders as the SECOND LINE, under the label,
 * through `ActionReason` — `meta` keeps its own job and never carries a reason. With a reason the
 * row stays REACHABLE (the Pressable is not natively disabled) so a screen reader can land on the
 * sentence; selection still refuses it.
 *
 * WEB→TOUCH MAPPING: there is no hover, so the web half's `data-active` row tint is carried by the
 * Pressable primitive's own pressed state.
 */
export function MenuItemRow({ item, onSelect, radio }: MenuItemRowProps) {
  const shape = menuRowShape(item, radio);
  const { checked, destructive, disabled, stated } = shape;
  const reason: ReactNode = disabled ? renderActionReason(item.disabledReason) : null;
  const twoLine = reason !== null;
  const glyphColour = disabled ? theme.colors['text-tertiary'] : theme.colors['danger-text'];
  /* Off with NO reason is the only row that stops being pressable — one with a stated reason stays
     reachable, or the sentence explaining it is announced to nobody. */
  const inert = disabled && !stated;

  return (
    <Pressable
      /* NO `accessibilityLabel`, deliberately. The row's name is its CONTENT — label, marks, the
         stated reason and the meta — which is exactly how the web half's `<button>` is named. A
         label here would have frozen the name to `item.label` alone and silently dropped the very
         sentence that explains why an off row is off. */
      /* A ROW IN A MENU IS A MENU ITEM, and a switcher's row is a menuitemradio — the same two the
         web half spells. It goes through the primitive, not around it: the 44dp floor is why this
         file composes Pressable at all, and no role turns it off. */
      accessibilityRole={radio ? 'menuitemradio' : 'menuitem'}
      /* WHICH PRESET IS IN FORCE (M13-10), said rather than tinted. `checked` only exists in a
         switcher, matching the web's `aria-checked={radio ? … : undefined}`. `disabled` is the DS
         sense, so a row that is off WITH a stated reason announces off while staying reachable —
         `inert` below is the narrower fact of leaving the walk entirely. */
      accessibilityState={{ checked: radio ? checked : undefined, disabled }}
      disabled={inert}
      onPress={disabled ? undefined : onSelect}
      style={[styles.row, twoLine ? styles.rowTwoLine : styles.rowOneLine]}
    >
      {radio ? <MenuTick checked={checked} twoLine={twoLine} /> : null}
      {item.icon ?? <MenuLeadGlyph color={glyphColour} destructive={destructive} />}
      <View style={styles.body}>
        <View style={styles.line}>
          <Text color={menuLabelColor(shape)} style={checked ? currentLabel : undefined}>
            {item.label}
          </Text>
          {renderMarks(item.marks)}
        </View>
        {/* The second line. `meta` keeps its own job and never carries a reason. */}
        {reason}
      </View>
      {item.meta === undefined ? null : (
        <Text
          variant="caption"
          color="tertiary"
          style={twoLine ? styles.metaWithReason : undefined}
        >
          {item.meta}
        </Text>
      )}
    </Pressable>
  );
}

const currentLabel: TextStyle = { fontWeight: '500' };

const styles = StyleSheet.create({
  row: {
    width: '100%',
    minHeight: 44,
    flexDirection: 'row',
    gap: 10,
    borderRadius: theme.radius['r-sm'],
    /* Pressable centres its children; a menu row is a left-aligned list line. */
    justifyContent: 'flex-start',
  },
  rowOneLine: {
    alignItems: 'center',
    paddingHorizontal: theme.spacing['sp-3'],
  },
  rowTwoLine: {
    alignItems: 'flex-start',
    paddingVertical: 9,
    paddingHorizontal: theme.spacing['sp-3'],
  },
  body: {
    flex: 1,
    minWidth: 0,
    alignItems: 'flex-start',
    gap: 3,
  },
  line: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: theme.spacing['sp-2'],
    maxWidth: '100%',
  },
  metaWithReason: { marginTop: theme.spacing['sp-0-5'] },
});
