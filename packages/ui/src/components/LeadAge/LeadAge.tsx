import type { CSSProperties } from 'react';
import { classNames } from '../../primitives/class-names';
import { StatusMark } from '../../primitives/StatusMark';
import { ShellGlyph } from '../AppShell/ShellGlyph';
import { leadAgeStandingOf } from './LeadAge.logic';
import type { LeadAgeProps } from './LeadAge.types';

interface WebLeadAgeProps extends LeadAgeProps {
  className?: string;
  style?: CSSProperties;
}

/**
 * A waiting lead's age (`M02-24`). Past 24 hours it is a warning mark — glyph, word and tint —
 * and in the last quarter before, the clock takes the warning ink. A screen reader hears the whole
 * sentence once, never "5 h".
 */
export function LeadAge({ elapsedMs, words, className, style }: WebLeadAgeProps) {
  const standing = leadAgeStandingOf(elapsedMs);
  const age = words.age(elapsedMs);
  return (
    <span className={classNames('hg-lead-age', className)} data-standing={standing} style={style}>
      <span className="hg-lead-age-seen" aria-hidden="true">
        {standing === 'past' ? (
          <StatusMark tone="warning" label={age} />
        ) : (
          <>
            <ShellGlyph
              name="clock"
              size="sm"
              tone={standing === 'nearing' ? 'warning' : 'secondary'}
            />
            <span>{age}</span>
          </>
        )}
      </span>
      <span className="hg-spoken-only">{words.spoken(elapsedMs)}</span>
    </span>
  );
}
