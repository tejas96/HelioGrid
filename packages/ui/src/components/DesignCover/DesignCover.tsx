import type { DesignCoverProps } from './DesignCover.types';
import './DesignCover.css';

/** A design's cover, on the web. */
export function DesignCover({ word, mark }: DesignCoverProps) {
  return (
    <span className="hg-design-cover" data-marked={mark === undefined ? undefined : ''}>
      {mark === undefined ? null : <span className="hg-design-cover-mark">{mark}</span>}
      <span className="hg-design-cover-word">{word}</span>
    </span>
  );
}
