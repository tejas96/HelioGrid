import { theme } from '@heliogrid/theme';
import { useRef, useState } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import { Dimensions, StyleSheet, View } from 'react-native';
import { Path, Svg } from 'react-native-svg';
import { Portal } from '../../primitives/Portal/Portal.native';
import { Pressable } from '../../primitives/Pressable/Pressable.native';
import { Text } from '../../primitives/Text/Text.native';
import type { SelectDensity, SelectOption, SelectProps } from './Select.types';
import { SelectListbox } from './SelectListbox.native';
import { normaliseOptions } from './select-options';

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
const MIN_BELOW = 160;

/**
 * Web measures the nearest CLIPPING ANCESTOR; RN has no such box, so the equivalent measurement is
 * the trigger's position in the window against the window height. The list still drops, rises or
 * shortens to fit rather than assuming "8dp under the trigger, 260dp tall".
 */
function anchorFor(x: number, y: number, w: number, h: number, windowHeight: number): Anchor {
  const below = windowHeight - (y + h) - GAP;
  const above = y - GAP;
  const up = below < MIN_BELOW && above > below;
  return {
    left: x,
    max: Math.max(120, Math.min(260, up ? above : below)),
    top: y + h + GAP,
    up,
    width: w,
    windowHeight,
    y,
  };
}

interface TriggerProps {
  accessibilityLabel?: string;
  current?: SelectOption;
  density: SelectDensity;
  disabled: boolean;
  errored: boolean;
  onPress: () => void;
  open: boolean;
  placeholder: string;
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
        disabled ? styles.triggerDisabled : undefined,
        errored ? styles.triggerError : undefined,
        open ? styles.triggerOpen : undefined,
      ]}
    >
      <Text
        variant="body"
        color={current === undefined ? 'tertiary' : 'primary'}
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
        <Path d={open ? 'm6 15 6-6 6 6' : 'm6 9 6 6 6-6'} />
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
  placeholder = 'Select an option',
  density = 'expressive',
  disabled = false,
  helper,
  error,
  ariaLabel,
  style,
}: NativeSelectProps) {
  const [anchor, setAnchor] = useState<Anchor | null>(null);
  const wrapRef = useRef<View>(null);
  const opts = normaliseOptions(options);
  const current = opts.find((option) => option.value === value);
  const selectedIndex = opts.findIndex((option) => option.value === value);

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
    const option = opts[index];
    if (option === undefined || option.disabled === true) {
      return;
    }
    onChange?.(option.value);
    setAnchor(null);
  };

  return (
    <View style={style}>
      {label !== undefined ? (
        <Text variant="body-sm" color="secondary" style={styles.label}>
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
        <Text variant="caption" color={error !== undefined ? 'danger' : 'tertiary'}>
          {error ?? helper}
        </Text>
      ) : null}
      {anchor !== null ? (
        <Portal>
          <Pressable
            accessibilityLabel="Close the list"
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
              activeIndex={Math.max(0, selectedIndex)}
              maxHeight={anchor.max}
              onCommit={commit}
              options={opts}
              value={value}
            />
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
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing['sp-3'],
    paddingHorizontal: theme.spacing['sp-4'] - 2,
    borderRadius: theme.radius['r-input-expressive'],
    borderWidth: 2,
    borderColor: 'transparent',
    backgroundColor: theme.colors.surface,
    ...theme.elevation.e1,
  },
  triggerFunctional: {
    height: 40,
    paddingHorizontal: theme.spacing['sp-3'] - 2,
    borderRadius: theme.radius['r-input-functional'],
  },
  triggerDisabled: {
    backgroundColor: theme.colors['canvas-sunken'],
  },
  /* An error is the caller's verdict and only the caller clears it — but it must not stand in
     front of the open ring, so the open state wins the outer edge. */
  triggerError: {
    borderColor: theme.colors.danger,
  },
  triggerOpen: {
    borderColor: theme.colors.accent,
  },
  value: {
    flexShrink: 1,
  },
  list: {
    position: 'absolute',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius['r-md'],
    ...theme.elevation.e4,
  },
});
