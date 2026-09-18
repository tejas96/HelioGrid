import { theme } from '@heliogrid/theme';
import { Children, isValidElement, type ReactNode } from 'react';
import type { StyleProp, TextStyle } from 'react-native';
import { Text as RNText } from 'react-native';
import { isMono, lineHeightFor, runsOfString } from './Text.logic';
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

/**
 * A native `Text` carries ONE family, and the brand face has no Devanagari — so the runs are
 * resolved explicitly here (`F3-13`) and each is drawn by the family the theme read from the
 * bundled files. A nested `Text` inherits size, weight and colour, so a run changes the face
 * and nothing else, and the line reads as one typeface decision (`F3-09`).
 *
 * An element child draws its own text and keeps its own box; only words this `Text` holds
 * directly are split.
 */
function drawRuns(children: ReactNode, variant: TextVariant): ReactNode {
  if (isMono(variant)) return children;
  return Children.map(children, (child) => {
    if (isValidElement(child) || (typeof child !== 'string' && typeof child !== 'number')) {
      return child;
    }
    const runs = runsOfString(String(child));
    return runs.map((run, index) => (
      <RNText
        // biome-ignore lint/suspicious/noArrayIndexKey: runs are positional slices of one string
        key={`${run.family}-${index}`}
        style={{ fontFamily: run.family }}
      >
        {run.text}
      </RNText>
    ));
  });
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
  /* Appended only when the scale would clip, and appended LAST so it also outranks a consumer's
     own line height — a shorter box is what loses the marks. `flattenStyle` copies every key of
     every object it is given, `undefined` values included, so an entry written unconditionally
     would erase the variant's line height on every line that needs no raise. */
  const raised = lineHeightFor(variant, children);
  return (
    <RNText
      style={[
        VARIANT[variant],
        { color: COLOR[color] },
        align !== undefined ? { textAlign: ALIGN[align] } : undefined,
        style,
        raised === undefined ? undefined : { lineHeight: raised },
      ]}
      accessibilityLanguage={lang}
      accessibilityLiveRegion={live === true ? 'assertive' : 'none'}
    >
      {drawRuns(children, variant)}
    </RNText>
  );
}
