import type { TranslatedText } from '@heliogrid/contracts';
import { theme } from '@heliogrid/theme';
import { useRef, useState } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import { Dimensions, StyleSheet, View } from 'react-native';
import { Svg } from 'react-native-svg';
import { FIELD_BOX_EDGE, fieldBox, fieldWords } from '../../primitives/FieldBox/FieldBox.native';
import { Portal } from '../../primitives/Portal/Portal.native';
import { Pressable } from '../../primitives/Pressable/Pressable.native';
import { Text } from '../../primitives/Text/Text.native';
import { ShellGlyphMarks } from '../AppShell/ShellGlyphMarks.native';
import { listPlacement } from './Select.logic';
import type { SelectDensity, SelectOption, SelectProps } from './Select.types';
import { SelectListbox } from './SelectListbox.native';
import { committableOption, normaliseOptions, openingIndex, pickedOption } from './select-options';

interface NativeSelectProps extends SelectProps {
  style?: StyleProp<ViewStyle>;
}

interface Anchor {
  left: number;
  max: number;
  top: number;
  up: boolean;
  width: number;
  windowHeight: number;
  y: number;
}

const GAP = theme.spacing['sp-2'];

/**
 * Web measures the nearest CLIPPING ANCESTOR; RN has no such box, so the equivalent measurement is
 * the trigger's position in the window against the window height. The list still drops, rises or
 * shortens to fit rather than assuming "8dp under the trigger, 260dp tall".
 */
function anchorFor(x: number, y: number, w: number, h: number, windowHeight: number): Anchor {
  const { up, max } = listPlacement(windowHeight - (y + h) - GAP, y - GAP);
  return {
    left: x,
    max,
    top: y + h + GAP,
    up,
    width: w,
    windowHeight,
    y,
  };
}

interface TriggerProps {
  accessibilityLabel?: TranslatedText;
  current?: SelectOption;
  density: SelectDensity;
  disabled: boolean;
  errored: boolean;
  onPress: () => void;
  open: boolean;
  placeholder: TranslatedText;
}

/** The borderless trigger: the picked label (or the placeholder) and the chevron. */
function SelectTrigger({
  accessibilityLabel,
  current,
  density,
  disabled,
  errored,
  onPress,
  open,
  placeholder,
}: TriggerProps) {
  return (
    <Pressable
      accessibilityLabel={accessibilityLabel}
      /* THE LIST IT OPENS IS OPEN, SAID RATHER THAN DRAWN. The web half's `aria-expanded` is on
         the trigger; here the same fact goes through the primitive, which spells it
         `accessibilityState.expanded`. Left to the chevron's flip and the accent border it would
         be state by shape and colour alone — F7-12. */
      accessibilityRole="combobox"
      accessibilityState={{ expanded: open }}
      disabled={disabled}
      onPress={onPress}
      style={[
        styles.trigger,
        density === 'functional' ? styles.triggerFunctional : undefined,
        fieldBox({ focused: open, tone: errored ? 'error' : 'none', disabled, density }),
      ]}
    >
      <Text
        variant="field-value"
        color={fieldWords(current === undefined, disabled)}
        style={styles.value}
      >
        {current === undefined ? placeholder : current.label}
      </Text>
      <Svg
        width={18}
        height={18}
        viewBox="0 0 24 24"
        fill="none"
        stroke={theme.colors['text-tertiary']}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <ShellGlyphMarks name={open ? 'chevron-up' : 'chevron'} />
      </Svg>
    </Pressable>
  );
}

/**
 * Borderless single-select with an e4 popover listbox.
 *
 * The list and its outside-tap scrim both live in a Portal so nothing above them can clip them.
 * The keyboard contract (Up/Down/Home/End, type-ahead, Esc) is web-only; on touch the two acts are
 * tap-to-open and tap-to-commit, with the scrim as the cancel.
 */
export function Select({
  value,
  onChange,
  options = [],
  label,
  placeholder,
  density = 'expressive',
  disabled = false,
  helper,
  error,
  ariaLabel,
  closeLabel,
  style,
}: NativeSelectProps) {
  const [anchor, setAnchor] = useState<Anchor | null>(null);
  const wrapRef = useRef<View>(null);
  const opts = normaliseOptions(options);
  const current = pickedOption(opts, value);

  const toggle = () => {
    if (anchor !== null) {
      setAnchor(null);
      return;
    }
    wrapRef.current?.measureInWindow((x, y, w, h) => {
      setAnchor(anchorFor(x, y, w, h, Dimensions.get('window').height));
    });
  };

  const commit = (index: number) => {
    const option = committableOption(opts, index);
    if (option === undefined) {
      return;
    }
    onChange?.(option.value);
    setAnchor(null);
  };

  return (
    <View style={style}>
      {label !== undefined ? (
        <Text variant="field-label" color="secondary" style={styles.label}>
          {label}
        </Text>
      ) : null}
      <View ref={wrapRef} collapsable={false}>
        <SelectTrigger
          accessibilityLabel={label ?? ariaLabel}
          current={current}
          density={density}
          disabled={disabled}
          errored={error !== undefined}
          onPress={toggle}
          open={anchor !== null}
          placeholder={placeholder}
        />
      </View>
      {helper !== undefined || error !== undefined ? (
        <Text variant="field-helper" color={error !== undefined ? 'danger' : 'tertiary'}>
          {error ?? helper}
        </Text>
      ) : null}
      {anchor !== null ? (
        <Portal>
          {/* Modal while open: a sheet's modal panel hides every other layer from a screen
              reader, this list's own portal layer included, so its options would not be read. */}
          <View style={StyleSheet.absoluteFill} pointerEvents="box-none" accessibilityViewIsModal>
            <Pressable
              accessibilityLabel={closeLabel}
              onPress={() => setAnchor(null)}
              style={StyleSheet.absoluteFill}
            >
              <View />
            </Pressable>
            <View
              style={[
                styles.list,
                {
                  left: anchor.left,
                  width: anchor.width,
                  ...(anchor.up
                    ? { bottom: anchor.windowHeight - anchor.y + GAP }
                    : { top: anchor.top }),
                },
              ]}
            >
              <SelectListbox
                activeIndex={openingIndex(opts, value)}
                maxHeight={anchor.max}
                onCommit={commit}
                options={opts}
                value={value}
              />
            </View>
          </View>
        </Portal>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    fontWeight: '500',
    marginBottom: 6,
  },
  trigger: {
    width: '100%',
    minHeight: 44,
    height: theme.layout['field-h'],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing['sp-3'],
    // The well and its edge are FieldBox's; the padding gives up the edge's width.
    paddingHorizontal: theme.spacing['sp-4'] - FIELD_BOX_EDGE,
  },
  triggerFunctional: {
    height: 40,
    paddingHorizontal: theme.spacing['sp-3'] - FIELD_BOX_EDGE,
  },
  value: {
    flexShrink: 1,
  },
  list: {
    position: 'absolute',
    // biome-ignore lint/plugin/raw-white: float — a menu, a list, a calendar, a toast, a bubble: white with its shadow (F7-15)
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius['r-md'],
    ...theme.elevation.e4,
  },
});
