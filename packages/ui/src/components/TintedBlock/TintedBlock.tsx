import type { CSSProperties } from 'react';
import { classNames } from '../../primitives/class-names';
import { Text } from '../../primitives/Text';
import type { TintedBlockProps } from './TintedBlock.types';

interface WebTintedBlockProps extends TintedBlockProps {
  className?: string;
  style?: CSSProperties;
}

/** The tinted block above a locked code field or under a finding: the words carry the reason, the tint is the second channel. */
export function TintedBlock({ tone, title, body, className, style }: WebTintedBlockProps) {
  return (
    <div className={classNames('hg-tinted-block', className)} data-tone={tone} style={style}>
      <Text variant="body-sm" color={tone}>
        {title}
      </Text>
      <Text variant="caption" color="secondary">
        {body}
      </Text>
    </div>
  );
}
