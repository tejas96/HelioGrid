import type { CSSProperties } from 'react';
import { useEffect, useRef } from 'react';
import { classNames } from '../../primitives/class-names';
import { closingPress } from '../../primitives/FocusAfter';
import { Pressable } from '../../primitives/Pressable';
import { ShellGlyphMarks } from '../AppShell/ShellGlyphMarks';
import { OperationProgress } from '../OperationProgress';
import { IndeterminateRail } from '../PendingAction';
import { offersClear, summariseJobs } from './JobTray.summary';
import type { JobTrayProps } from './JobTray.types';
import { useTrayOpen } from './use-tray-open';

type WebJobTrayProps = JobTrayProps & {
  className?: string;
  style?: CSSProperties;
};

/** Work you walked away from, and the one place it lives. Renders nothing with no jobs. */
export function JobTray({
  jobs = [],
  open,
  onOpenChange,
  label,
  words,
  onClear,
  clearLabel,
  align = 'right',
  className,
  style,
}: WebJobTrayProps) {
  const [isOpen, setOpen] = useTrayOpen(open, onOpenChange);
  const wrapRef = useRef<HTMLDivElement>(null);
  /* Clearing takes the clear away with the jobs it cleared: focus goes back to the trigger. */
  const trigger = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    };
    const onDown = (event: MouseEvent) => {
      const wrap = wrapRef.current;
      if (wrap !== null && event.target instanceof Node && !wrap.contains(event.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onDown);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', onDown);
    };
  }, [isOpen, setOpen]);

  if (jobs.length === 0) {
    return null;
  }
  const summary = summariseJobs(jobs, words);

  return (
    <div ref={wrapRef} className={classNames('hg-job-tray', className)} style={style}>
      {/* aria-haspopup and aria-expanded have no prop on the Pressable primitive, so this trigger
          is a plain button that restates the 44px floor in CSS rather than dropping the state a
          screen reader needs. */}
      <button
        ref={trigger}
        type="button"
        className="hg-job-tray-trigger"
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        aria-label={words.trigger(label, summary.words)}
        data-open={isOpen ? 'true' : undefined}
        data-tone={summary.tone}
        onClick={() => setOpen(!isOpen)}
      >
        {summary.busy ? (
          <IndeterminateRail width={18} />
        ) : (
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <ShellGlyphMarks name="clock" />
          </svg>
        )}
        <span className="hg-job-tray-words">{summary.words}</span>
      </button>

      {isOpen ? (
        <div role="dialog" aria-label={label} className="hg-job-tray-panel" data-align={align}>
          <div className="hg-job-tray-panel-head">
            <span className="hg-job-tray-panel-label">{label}</span>
            {offersClear(jobs, onClear, clearLabel) ? (
              <Pressable className="hg-job-tray-clear" onPress={closingPress(trigger)(onClear)}>
                {clearLabel}
              </Pressable>
            ) : null}
          </div>
          <ul className="hg-job-tray-jobs">
            {jobs.map((job) => (
              <li key={job.id}>
                <OperationProgress size="inline" {...job} label={job.label} />
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
