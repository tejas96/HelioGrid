import { classNames } from '../class-names';
import type { StatusMarkProps } from './StatusMark.types';
import { STATUS_GLYPH } from './StatusMark.types';

interface WebStatusMarkProps extends StatusMarkProps {
  className?: string;
}

/**
 * Status as label + mark, never colour alone (F7-12, docs/17 §4). A component that tints
 * a state without composing this primitive is a defect.
 */
export function StatusMark({ tone, label, mark = true, className }: WebStatusMarkProps) {
  return (
    <span className={classNames('hg-status-mark', className)} data-tone={tone}>
      {mark ? (
        <span className="hg-status-mark-glyph" aria-hidden="true">
          {STATUS_GLYPH[tone]}
        </span>
      ) : null}
      {label}
    </span>
  );
}
