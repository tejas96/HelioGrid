import { classNames } from '../class-names';
import { lineHeightFor } from './Text.logic';
import type { TextProps, TextVariant } from './Text.types';

type TextElement = 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'p' | 'span' | 'code' | 'div';

const DEFAULT_ELEMENT: Record<TextVariant, TextElement> = {
  display: 'h1',
  h1: 'h1',
  h2: 'h2',
  h3: 'h3',
  h4: 'h4',
  'body-lg': 'p',
  body: 'p',
  'body-sm': 'p',
  caption: 'p',
  overline: 'p',
  mono: 'code',
  'field-label': 'span',
  'field-value': 'span',
  'field-helper': 'p',
};

interface WebTextBase extends TextProps {
  /** Override the rendered element when the document outline needs it. */
  as?: TextElement;
}

/**
 * `spokenOnly`: words for a screen reader alone — hidden from the eye, kept in the accessibility
 * tree. Web only: React Native has no off-screen text node, so a phone half gives the whole sentence
 * to the element the reader lands on (`accessibilityLabel`). It takes no `className`: a class that
 * sets position, size or margin would outrank the one rule and show the words.
 */
type WebTextProps = WebTextBase &
  ({ spokenOnly?: false; className?: string } | { spokenOnly: true; className?: never });

/** The DS type scale. Values live in Text.css as typography tokens only. */
export function Text({
  children,
  variant = 'body',
  color = 'primary',
  align,
  lang,
  live,
  oneLine,
  bold,
  as,
  className,
  spokenOnly,
}: WebTextProps) {
  const Element = as ?? DEFAULT_ELEMENT[variant];
  /* The browser resolves the stack per character, so the face needs no help here — but a line
     the scale would clip needs the same room the phone gives it, from the same answer (`F3-17`,
     Law 7). Undefined for every Latin line, which is drawn exactly as Text.css draws it. */
  const lineHeight = lineHeightFor(variant, children);
  return (
    <Element
      className={classNames(
        'hg-text',
        spokenOnly === true ? 'hg-spoken-only' : undefined,
        className,
      )}
      data-variant={variant}
      data-color={color}
      data-align={align}
      data-one-line={oneLine === true ? 'true' : undefined}
      data-bold={bold === true ? 'true' : undefined}
      lang={lang}
      role={live === true ? 'alert' : undefined}
      style={lineHeight === undefined ? undefined : { lineHeight: `${lineHeight}px` }}
    >
      {children}
    </Element>
  );
}
