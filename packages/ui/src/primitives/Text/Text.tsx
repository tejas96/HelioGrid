import { classNames } from '../class-names';
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
};

interface WebTextProps extends TextProps {
  /** Override the rendered element when the document outline needs it. */
  as?: TextElement;
  className?: string;
}

/** The DS type scale. Values live in Text.css as typography tokens only. */
export function Text({
  children,
  variant = 'body',
  color = 'primary',
  align,
  lang,
  live,
  as,
  className,
}: WebTextProps) {
  const Element = as ?? DEFAULT_ELEMENT[variant];
  return (
    <Element
      className={classNames('hg-text', className)}
      data-variant={variant}
      data-color={color}
      data-align={align}
      lang={lang}
      role={live === true ? 'alert' : undefined}
    >
      {children}
    </Element>
  );
}
