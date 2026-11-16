import { useImperativeHandle, useRef } from 'react';
import { Text } from '../../primitives/Text/Text';
import type { LargeTitleProps } from './LargeTitle.types';

export function LargeTitle({ title, summary, titleRef, nameTitle, mono, acts }: LargeTitleProps) {
  const heading = useRef<HTMLHeadingElement>(null);
  useImperativeHandle(titleRef, () => ({ focus: () => heading.current?.focus() }));
  return (
    <header className="hg-large-title">
      <div className="hg-large-title-row">
        <h1
          ref={heading}
          tabIndex={-1}
          className="hg-large-title-name hg-focus-target"
          data-two-lines={nameTitle === true ? 'true' : undefined}
          data-mono={mono === true ? 'true' : undefined}
        >
          {title}
        </h1>
        {acts === undefined ? null : <div className="hg-large-title-acts">{acts}</div>}
      </div>
      {summary === undefined ? null : (
        <Text variant="body" color="secondary">
          {summary}
        </Text>
      )}
    </header>
  );
}
