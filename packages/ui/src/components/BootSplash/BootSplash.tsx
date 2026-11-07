import { IndeterminateRail } from '../PendingAction/IndeterminateRail';
import { Wordmark } from '../Wordmark/Wordmark';
import type { BootSplashProps } from './BootSplash.types';

/** The session's wait (`BootSplash.types.ts`), filling the window; it fades in after the skeleton delay. */
export function BootSplash({ label }: BootSplashProps) {
  return (
    <div className="hg-boot" role="status" aria-label={label}>
      <div className="hg-boot-mark">
        <Wordmark size={30} />
        {/* As wide as the wordmark's lead, two pixels thin: a line, never a bar. */}
        <IndeterminateRail width="var(--sp-24)" thickness={2} tone="var(--gradient-brand)" />
      </div>
    </div>
  );
}
