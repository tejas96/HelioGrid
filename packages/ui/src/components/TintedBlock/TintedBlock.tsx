import type { CSSProperties } from 'react';
import { classNames } from '../../primitives/class-names';
import { Text } from '../../primitives/Text';
import { Explainer } from '../Explainer/Explainer';
import type { TintedBlockProps } from './TintedBlock.types';

interface WebTintedBlockProps extends TintedBlockProps {
  className?: string;
  style?: CSSProperties;
}

/** The tinted block above a locked code field or under a finding: the words carry the reason, the tint is the second channel. */
export function TintedBlock({
  tone,
  title,
  body,
  announce,
  heading = false,
  explainer,
  className,
  style,
}: WebTintedBlockProps) {
  const titleLine = heading ? (
    <Text variant="h3" as="h1" color={tone}>
      {title}
    </Text>
  ) : (
    <Text variant="body-sm" color={tone} bold>
      {title}
    </Text>
  );
  const bodyLine =
    body === undefined ? null : (
      <Text variant="caption" color="secondary">
        {body}
      </Text>
    );
  if (explainer === undefined) {
    return (
      <div
        className={classNames('hg-tinted-block', className)}
        data-tone={tone}
        role={announce}
        style={style}
      >
        {titleLine}
        {bodyLine}
      </div>
    );
  }
  /* The words are the live region and the ask stands outside it: the ask's bubble opens inside its
     own box, and a region that grows is said again whole. */
  return (
    <div className={classNames('hg-tinted-block', className)} data-tone={tone} style={style}>
      <div className="hg-tinted-block-words" role={announce}>
        <div className="hg-tinted-block-title">{titleLine}</div>
        {bodyLine}
      </div>
      <div className="hg-tinted-block-ask">
        <Explainer {...explainer} inset />
      </div>
    </div>
  );
}
