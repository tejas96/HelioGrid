import { theme } from '@heliogrid/theme';
import type { DimensionValue, StyleProp, TextStyle } from 'react-native';
import { Text as RNText, StyleSheet } from 'react-native';
import type { TextAlign, TextColor, TextProps, TextVariant } from './Text.types';

const R = theme.type.roles;
const sans = theme.type.families.sans;

/** The type scale, dp values straight from the generated theme. */
const VARIANT: Record<TextVariant, TextStyle> = {
  display: {
    fontFamily: sans,
    fontWeight: '700',
    fontSize: R.display.fontSize,
    lineHeight: R.display.lineHeight,
    letterSpacing: R.display.letterSpacing,
  },
  h1: {
    fontFamily: sans,
    fontWeight: '700',
    fontSize: R.h1.fontSize,
    lineHeight: R.h1.lineHeight,
    letterSpacing: R.h1.letterSpacing,
  },
  h2: {
    fontFamily: sans,
    fontWeight: '700',
    fontSize: R.h2.fontSize,
    lineHeight: R.h2.lineHeight,
    letterSpacing: R.h2.letterSpacing,
  },
  h3: {
    fontFamily: sans,
    fontWeight: '700',
    fontSize: R.h3.fontSize,
    lineHeight: R.h3.lineHeight,
    letterSpacing: R.h3.letterSpacing,
  },
  h4: {
    fontFamily: sans,
    fontWeight: '700',
    fontSize: R.h4.fontSize,
    lineHeight: R.h4.lineHeight,
    letterSpacing: R.h4.letterSpacing,
  },
  'body-lg': {
    fontFamily: sans,
    fontWeight: '400',
    fontSize: R['body-lg'].fontSize,
    lineHeight: R['body-lg'].lineHeight,
  },
  body: {
    fontFamily: sans,
    fontWeight: '400',
    fontSize: R.body.fontSize,
    lineHeight: R.body.lineHeight,
  },
  'body-sm': {
    fontFamily: sans,
    fontWeight: '400',
    fontSize: R['body-sm'].fontSize,
    lineHeight: R['body-sm'].lineHeight,
  },
  caption: {
    fontFamily: sans,
    fontWeight: '400',
    fontSize: R.caption.fontSize,
    lineHeight: R.caption.lineHeight,
  },
  /* The 11px/700/uppercase/0.12em signature — the one sanctioned sub-12px appearance. */
  overline: {
    fontFamily: sans,
    fontWeight: '700',
    fontSize: R.overline.fontSize,
    letterSpacing: R.overline.letterSpacing,
    textTransform: 'uppercase',
  },
  /* Mono is the FIGURE variant: money columns, kWh readings, invoice numbers. `fontVariant`
     is the half of it that makes a column a column — the same `font-variant-numeric:
     tabular-nums` Text.css:77 gives the web mono variant. Without it every digit takes its own
     width and nothing under it aligns (Law 7: a treatment on one platform only is a defect). */
  mono: {
    fontFamily: theme.type.families.mono,
    fontWeight: '400',
    fontSize: R['body-sm'].fontSize,
    lineHeight: R['body-sm'].lineHeight,
    fontVariant: ['tabular-nums'],
  },
};

const COLOR: Record<TextColor, string> = {
  primary: theme.colors['text-primary'],
  secondary: theme.colors['text-secondary'],
  tertiary: theme.colors['text-tertiary'],
  disabled: theme.colors['text-disabled'],
  inverse: theme.colors['text-inverse'],
  accent: theme.colors.accent,
  success: theme.colors['success-text'],
  warning: theme.colors['warning-text'],
  danger: theme.colors['danger-text'],
  info: theme.colors['info-text'],
};

const ALIGN: Record<TextAlign, TextStyle['textAlign']> = {
  start: 'left',
  center: 'center',
  end: 'right',
};

/* Native clips a Text's ink to its own box, where the web lets it spill over the line. The heading
   roles' line boxes are shorter than the Devanagari fallback's ink line — Kohinoor Devanagari inks
   1.05 em above the baseline and 0.51 em below it — so हिन्दी and मराठी vowel signs lose their tops.
   The shortfall is padding at both ends paid back by margin, merged with the consumer's own box so
   a Text may still carry a margin: the layout box stays the theme's, only the drawn box grows. */
const DEVANAGARI_INK_LINE_EM = 1.56;

function inkRoom(variant: TextVariant, style: StyleProp<TextStyle>): TextStyle | undefined {
  const { fontSize, lineHeight } = VARIANT[variant];
  if (fontSize === undefined || lineHeight === undefined) return undefined;
  const room = Math.ceil(DEVANAGARI_INK_LINE_EM * fontSize - lineHeight);
  if (room <= 0) return undefined;
  const own = StyleSheet.flatten(style) ?? {};
  const top = roomedEdge(
    own.marginTop ?? own.marginVertical ?? own.margin,
    own.paddingTop ?? own.paddingVertical ?? own.padding,
    room,
  );
  const bottom = roomedEdge(
    own.marginBottom ?? own.marginVertical ?? own.margin,
    own.paddingBottom ?? own.paddingVertical ?? own.padding,
    room,
  );
  return {
    ...(top && { marginTop: top.margin, paddingTop: top.padding }),
    ...(bottom && { marginBottom: bottom.margin, paddingBottom: bottom.padding }),
  };
}

/** An 'auto' or percentage edge is the consumer's alone; only a numeric one can pay the room back. */
function roomedEdge(
  margin: DimensionValue | undefined,
  padding: DimensionValue | undefined,
  room: number,
) {
  const numeric = (value: DimensionValue | undefined) =>
    value === undefined || typeof value === 'number';
  if (!numeric(margin) || !numeric(padding)) return undefined;
  return { margin: (margin ?? 0) - room, padding: (padding ?? 0) + room };
}

interface NativeTextProps extends TextProps {
  style?: StyleProp<TextStyle>;
}

/** The DS type scale — same vocabulary as the web half, dp values from the theme. */
export function Text({
  children,
  variant = 'body',
  color = 'primary',
  align,
  lang,
  live,
  style,
}: NativeTextProps) {
  return (
    <RNText
      style={[
        VARIANT[variant],
        { color: COLOR[color] },
        align !== undefined ? { textAlign: ALIGN[align] } : undefined,
        style,
        inkRoom(variant, style),
      ]}
      accessibilityLanguage={lang}
      accessibilityLiveRegion={live === true ? 'assertive' : 'none'}
    >
      {children}
    </RNText>
  );
}
