import type { CSSProperties, Ref } from 'react';
import { classNames } from '../../primitives/class-names';
import { Text } from '../../primitives/Text';
import { Explainer } from '../Explainer/Explainer';
import type { TintedBlockProps } from './TintedBlock.types';

interface WebTintedBlockProps extends TintedBlockProps {
  /** Where focus lands once the act this block answers has gone (`F7-23` N5); it takes `tabIndex={-1}`. */
  blockRef?: Ref<HTMLDivElement>;
  className?: string;
  style?: CSSProperties;
}

/** A title's ink: the tone's own, and a neutral note's the secondary words. */
const TITLE_INK = {
  danger: 'danger',
  warning: 'warning',
  info: 'info',
  success: 'success',
  neutral: 'secondary',
} as const;

/** The tinted block above a locked code field or under a finding: the words carry the reason, the tint is the second channel. */
export function TintedBlock({
  tone,
  title,
  body,
  announce,
  heading = false,
  explainer,
  face = 'sans',
  children,
  rise = false,
  blockRef,
  className,
  style,
}: WebTintedBlockProps) {
  const titleLine = heading ? (
    <Text variant="h3" as="h1" color={TITLE_INK[tone]}>
      {title}
    </Text>
  ) : face === 'display' ? (
    <h2 className="hg-tinted-block-display">{title}</h2>
  ) : (
    <Text variant="body-sm" color={TITLE_INK[tone]} bold>
      {title}
    </Text>
  );
  const frame = {
    ref: blockRef,
    tabIndex: blockRef === undefined ? undefined : -1,
    className: classNames(
      'hg-tinted-block',
      blockRef === undefined ? undefined : 'hg-focus-target',
      className,
    ),
    'data-tone': tone,
    'data-face': face,
    'data-rise': rise ? 'true' : undefined,
    style,
  };
  const bodyLine =
    body === undefined ? null : (
      <Text variant="caption" color="secondary">
        {body}
      </Text>
    );
  if (explainer === undefined) {
    return (
      <div {...frame} role={announce}>
        {titleLine}
        {bodyLine}
        {children}
      </div>
    );
  }
  /* The words are the live region and the ask stands outside it: the ask's bubble opens inside its
     own box, and a region that grows is said again whole. */
  return (
    <div {...frame}>
      <div className="hg-tinted-block-words" role={announce}>
        <div className="hg-tinted-block-title">{titleLine}</div>
        {bodyLine}
      </div>
      {children}
      <div className="hg-tinted-block-ask">
        <Explainer {...explainer} inset />
      </div>
    </div>
  );
}
