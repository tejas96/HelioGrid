import { theme } from '@heliogrid/theme';
import { useId, useImperativeHandle, useRef } from 'react';
import type { StyleProp, TextStyle, ViewStyle } from 'react-native';
import { ActivityIndicator, StyleSheet, type View } from 'react-native';
import { useGround } from '../../primitives/Ground/Ground.native';
import { Pressable } from '../../primitives/Pressable/Pressable.native';
import { focusScreenReaderOn } from '../../primitives/screen-reader-focus.native';
import { Text } from '../../primitives/Text/Text.native';
import type { ReasonTriggerProps } from '../ActionReason/ActionReason.types';
import { ReasonExplainer } from '../ActionReason/ReasonExplainer.native';
import { isStatedOff, toneOf } from './Button.logic';
import type { ButtonProps, ButtonSize, ButtonTone, ButtonVariant } from './Button.types';

interface NativeButtonProps extends ButtonProps {
  /** Lands on the pill — the DS contract for `style`. */
  style?: StyleProp<ViewStyle>;
}

interface VariantVisual {
  background: string;
  color: string;
  elevation?: ViewStyle;
}

/* Primary is near-black. The accent is never a button fill. */
const VARIANT: Record<ButtonVariant, VariantVisual> = {
  primary: { background: theme.colors['action-primary'], color: theme.colors['text-inverse'] },
  /* Raised, as the design system's button is (`F7-15`, owner ruling D14 B): white at `e2` on every
     ground — the page, a sheet, a tile. */
  secondary: {
    // biome-ignore lint/plugin/raw-white: control — the secondary is white on every ground (D14 B)
    background: theme.colors.surface,
    color: theme.colors['text-primary'],
    elevation: theme.elevation.e2,
  },
  /* Web ghost reads --control-edge so field mode can ring it; RN has no field-mode edge yet. */
  ghost: { background: 'transparent', color: theme.colors['text-secondary'] },
  destructive: { background: theme.colors['danger-text'], color: theme.colors['text-inverse'] },
};

/* The words a tone gives a secondary or ghost pill; the white pill keeps its own ground. */
const TONE: Record<ButtonTone, string> = { danger: theme.colors['danger-text'] };

const SIZE: Record<ButtonSize, ViewStyle> = {
  lg: { height: theme.spacing['sp-12'], paddingHorizontal: theme.spacing['sp-6'] },
  md: { height: theme.spacing['sp-10'], paddingHorizontal: theme.spacing['sp-5'] },
  sm: { height: theme.spacing['sp-8'], paddingHorizontal: theme.spacing['sp-4'] },
};

const LABEL_SIZE: Record<ButtonSize, TextStyle> = {
  lg: { fontSize: theme.type.roles.button.fontSize },
  md: { fontSize: theme.type.roles.button.fontSize },
  sm: { fontSize: theme.type.roles['body-sm'].fontSize },
};

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing['sp-2'],
    borderRadius: theme.radius['r-pill'],
  },
  fullWidth: { alignSelf: 'stretch' },
  label: {
    fontFamily: theme.type.families.sans,
    fontWeight: '500',
    letterSpacing: theme.type.roles.button.letterSpacing,
  },
});

/**
 * Same contract, same behaviour as the web half. Two mappings are worth naming:
 *
 *  · The pressed scale and the 44px floor come from the Pressable primitive, so this file neither
 *    re-answers them nor can undercut them. There is no hover on touch, so the hover elevation the
 *    web half raises has no counterpart here.
 *  · `disabledReason` — a tap opens the sentence in the Explainer bubble above the pill
 *    (`ReasonExplainer`), so a pill with a reason stays pressable: it announces disabled, its act is
 *    suppressed, and its press opens the bubble. There is no off-screen text node to describe it by,
 *    so the pill speaks the sentence after its name.
 *  · `ref` — the handle moves the screen reader's focus to the pill itself, through `Pressable`'s
 *    `hostRef`.
 */
export function Button({
  children,
  variant = 'primary',
  size = 'lg',
  disabled = false,
  disabledReason,
  reasonOpen,
  loading = false,
  icon = null,
  iconRight = null,
  fullWidth = false,
  tone,
  expanded,
  spokenName,
  ref,
  onClick,
  style,
}: NativeButtonProps) {
  const visual = VARIANT[variant];
  const { controlFillDisabled } = useGround();
  const reasonId = useId();
  const holder = useRef<View>(null);
  useImperativeHandle(ref, () => ({ focus: () => focusScreenReaderOn(() => holder.current) }), []);
  /* A spec with no sentence opens nothing and states nothing — see the web half. */
  const stated = isStatedOff(disabled, disabledReason);
  const toned = toneOf(variant, tone);
  const restColor = toned === undefined ? visual.color : TONE[toned];
  /* A stated disabled label is information, not chrome — see the web half. */
  const labelColor = disabled
    ? theme.colors[stated ? 'text-secondary' : 'text-disabled']
    : restColor;
  /* Named by its words even while the spinner stands in for them, so a button that is working
     keeps its name (`F7-26`). */
  const name = spokenName ?? children;

  const pill = (reason?: ReasonTriggerProps) => {
    const open = expanded ?? reason?.expanded;
    return (
      <Pressable
        hostRef={(node) => {
          holder.current = node;
          reason?.ref?.(node);
        }}
        disabled={disabled && reason === undefined}
        onPress={pressOf(reason, loading, onClick)}
        accessibilityState={pillState(loading, open, reason !== undefined)}
        accessibilityLabel={spokenWithReason(name, reason)}
        style={[
          styles.pill,
          SIZE[size],
          { backgroundColor: visual.background },
          disabled ? undefined : visual.elevation,
          // A ghost has no ground, and being unavailable does not give it one — see the web half.
          // Sunk below the page and the tile alike — see the web half.
          disabled && variant !== 'ghost' ? { backgroundColor: controlFillDisabled } : undefined,
          fullWidth ? styles.fullWidth : undefined,
          style,
        ]}
      >
        {loading ? (
          <ActivityIndicator color={labelColor} size="small" />
        ) : (
          <>
            {icon}
            <Text style={[styles.label, LABEL_SIZE[size], { color: labelColor }]}>{children}</Text>
            {iconRight}
          </>
        )}
      </Pressable>
    );
  };

  return stated ? (
    <ReasonExplainer spec={disabledReason} id={reasonId} open={reasonOpen} block={fullWidth}>
      {pill}
    </ReasonExplainer>
  ) : (
    pill()
  );
}

/** A reason's bubble takes the press; a working button sends nothing more, its first press still out. */
function pressOf(
  reason: ReasonTriggerProps | undefined,
  loading: boolean,
  onClick: (() => void) | undefined,
) {
  if (reason !== undefined) return reason.onPress;
  return loading ? undefined : onClick;
}

/** Busy while working; expanded only when something below it shows or hides; off with a reason. */
function pillState(loading: boolean, open: boolean | undefined, reasoned: boolean) {
  return {
    busy: loading,
    ...(open === undefined ? {} : { expanded: open }),
    ...(reasoned ? { disabled: true } : {}),
  };
}

/* There is no off-screen text node to describe the pill by, so it speaks the sentence after its name. */
function spokenWithReason(name: string, reason?: ReasonTriggerProps): string {
  return reason?.spokenReason === undefined ? name : `${name}, ${reason.spokenReason}`;
}
