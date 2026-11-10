import { theme } from '@heliogrid/theme';
import { useId, useImperativeHandle, useRef } from 'react';
import type { StyleProp, TextStyle, ViewStyle } from 'react-native';
import { ActivityIndicator, Text as RNText, StyleSheet, type View } from 'react-native';
import type { ThemeColor } from '../../primitives/Color/colors';
import { colors } from '../../primitives/Color/colors';
import { useGround } from '../../primitives/Ground/Ground.native';
import { Pressable } from '../../primitives/Pressable/Pressable.native';
import { focusScreenReaderOn } from '../../primitives/screen-reader-focus.native';
import { Text } from '../../primitives/Text/Text.native';
import type { ReasonTriggerProps } from '../ActionReason/ActionReason.types';
import { ReasonExplainer } from '../ActionReason/ReasonExplainer.native';
import { GlyphInkContext } from '../AppShell/ShellGlyph.native';
import { isStatedOff, labelRunsOf, toneOf } from './Button.logic';
import type { ButtonProps, ButtonSize, ButtonTone, ButtonVariant } from './Button.types';

interface NativeButtonProps extends ButtonProps {
  /** Lands on the pill — the DS contract for `style`. */
  style?: StyleProp<ViewStyle>;
}

interface VariantVisual {
  background: ThemeColor;
  color: ThemeColor;
  elevation?: ViewStyle;
}

/* Primary is the ocean accent with a soft glow of itself; secondary the card colour in a hairline. */
const VARIANT: Record<ButtonVariant, VariantVisual> = {
  primary: {
    background: colors['action-primary'],
    color: colors['text-inverse'],
    elevation: {
      shadowColor: colors['action-primary'],
      shadowOffset: { width: 0, height: 6 },
      shadowRadius: 10,
      shadowOpacity: 0.35,
      elevation: 3,
    },
  },
  secondary: {
    // biome-ignore lint/plugin/raw-white: control — the secondary is the card colour on every ground
    background: colors.surface,
    color: colors['text-primary'],
    elevation: { borderWidth: 1, borderColor: colors['line-strong'] },
  },
  ghost: { background: 'transparent', color: colors['text-secondary'] },
  destructive: { background: colors['danger-text'], color: colors['text-inverse'] },
};

/* The pills with a fill of their own, whose glyphs take the words' ink (`GlyphInkContext`). */
const FILLED: ReadonlySet<ButtonVariant> = new Set<ButtonVariant>(['primary', 'destructive']);

/* The words a tone gives a secondary or ghost pill; the white pill keeps its own ground. */
const TONE: Record<ButtonTone, ThemeColor> = { danger: colors['danger-text'] };

const SIZE: Record<ButtonSize, ViewStyle> = {
  prominent: { height: theme.spacing['sp-16'], paddingHorizontal: theme.spacing['sp-8'] },
  lg: { height: theme.layout['field-h'], paddingHorizontal: theme.spacing['sp-6'] },
  md: { height: theme.spacing['sp-10'], paddingHorizontal: theme.spacing['sp-5'] },
  sm: { height: theme.spacing['sp-8'], paddingHorizontal: theme.spacing['sp-4'] },
};

const LABEL_SIZE: Record<ButtonSize, TextStyle> = {
  prominent: { fontSize: theme.type.roles['body-lg'].fontSize },
  lg: { fontSize: theme.type.roles.button.fontSize },
  md: { fontSize: theme.type.roles.button.fontSize },
  sm: { fontSize: theme.type.roles['body-sm'].fontSize },
};

const styles = StyleSheet.create({
  /* `F7-09`: a figure in the label changes only its face; size and colour stay the label's. */
  figure: { fontFamily: theme.type.families.mono, fontVariant: ['tabular-nums'] },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing['sp-2'],
    borderRadius: theme.radius['r-pill'],
  },
  fullWidth: { alignSelf: 'stretch' },
  prominentGlow: {
    shadowOffset: { width: 0, height: 12 },
    shadowRadius: 20,
    shadowOpacity: 0.45,
    elevation: 6,
  },
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
  figures,
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
  const labelColor = disabled ? colors[stated ? 'text-secondary' : 'text-disabled'] : restColor;
  /* Named by its words even while the spinner stands in for them, so a button that is working
     keeps its name (`F7-26`). */
  const name = spokenName ?? figures?.spoken ?? children;
  const content = loading ? (
    <ActivityIndicator color={labelColor} size="small" />
  ) : (
    <GlyphInkContext.Provider value={FILLED.has(variant) ? labelColor : null}>
      {icon}
      <Text style={[styles.label, LABEL_SIZE[size], { color: labelColor }]}>
        {labelOf(children, figures?.values)}
      </Text>
      {iconRight}
    </GlyphInkContext.Provider>
  );

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
          // The screen's one main verb carries the deepest glow of the accent (see the web half).
          size === 'prominent' && variant === 'primary' && !disabled
            ? styles.prominentGlow
            : undefined,
          // A ghost has no ground, and being unavailable does not give it one — see the web half.
          // Sunk below the page and the tile alike — see the web half.
          disabled && variant !== 'ghost' ? { backgroundColor: controlFillDisabled } : undefined,
          fullWidth ? styles.fullWidth : undefined,
          style,
        ]}
      >
        {content}
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

/** The words, or the words with each figure in mono; the button's name carries the whole line. */
function labelOf(label: string, figures: readonly string[] | undefined) {
  if (figures === undefined) return label;
  return labelRunsOf(label, figures).map((run, index) =>
    run.mono ? (
      // biome-ignore lint/suspicious/noArrayIndexKey: runs are positional slices of one label
      <RNText key={index} style={styles.figure}>
        {run.text}
      </RNText>
    ) : (
      run.text
    ),
  );
}
