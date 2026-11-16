import type { CSSProperties } from 'react';
import { segmentsOf } from './SegmentBar.logic';
import type { SegmentBarProps } from './SegmentBar.types';

/** The one share bar (`SegmentBar.types.ts`), on the web. */
export function SegmentBar({
  parts,
  size = 'md',
  keepEmpty = false,
  fade = false,
  label,
}: SegmentBarProps) {
  return (
    <span
      className="hg-segment-bar"
      data-size={size}
      {...(label === undefined ? { 'aria-hidden': true } : { role: 'img', 'aria-label': label })}
    >
      {segmentsOf(parts, keepEmpty, fade).map((segment) => {
        const style: CSSProperties = { flexGrow: segment.share, opacity: segment.opacity };
        if (segment.ink !== undefined) style.background = segment.ink;
        return (
          <span
            key={segment.key}
            className="hg-segment-bar-part"
            data-thin={segment.thin ? 'true' : undefined}
            style={style}
          />
        );
      })}
    </span>
  );
}
