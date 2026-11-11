import { useImperativeHandle, useRef } from 'react';
import { Text } from '../../primitives/Text/Text';
import type { LargeTitleProps } from './LargeTitle.types';

export function LargeTitle({ title, summary, titleRef, nameTitle }: LargeTitleProps) {
  const heading = useRef<HTMLHeadingElement>(null);
  useImperativeHandle(titleRef, () => ({ focus: () => heading.current?.focus() }));
  return (
    <header className="hg-large-title">
      <h1
        ref={heading}
        tabIndex={-1}
        className="hg-large-title-name hg-focus-target"
        data-two-lines={nameTitle === true ? 'true' : undefined}
      >
        {title}
      </h1>
      {summary === undefined ? null : (
        <Text variant="body" color="secondary">
          {summary}
        </Text>
      )}
    </header>
  );
}
