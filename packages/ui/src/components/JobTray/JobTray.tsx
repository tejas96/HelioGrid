import type { CSSProperties } from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { classNames } from '../../primitives/class-names';
import { Pressable } from '../../primitives/Pressable';
import { OperationProgress } from '../OperationProgress';
import { IndeterminateRail } from '../PendingAction';
import { isRunning, summariseJobs } from './JobTray.summary';
import type { JobTrayProps } from './JobTray.types';

interface WebJobTrayProps extends JobTrayProps {
  className?: string;
  style?: CSSProperties;
}

/** Work you walked away from, and the one place it lives. Renders nothing with no jobs. */
export function JobTray({
  jobs = [],
  open,
  onOpenChange,
  label = 'Background work',
  onClear,
  clearLabel = 'Clear finished',
  align = 'right',
  className,
  style,
}: WebJobTrayProps) {
  const [innerOpen, setInnerOpen] = useState(false);
  const isOpen = open ?? innerOpen;
  const wrapRef = useRef<HTMLDivElement>(null);
  const setOpen = useCallback(
    (next: boolean) => {
      if (open === undefined) {
        setInnerOpen(next);
      }
      onOpenChange?.(next);
    },
    [open, onOpenChange],
  );

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
  const summary = summariseJobs(jobs);
  const finished = jobs.some((job) => !isRunning(job));

  return (
    <div ref={wrapRef} className={classNames('hg-job-tray', className)} style={style}>
      {/* aria-haspopup and aria-expanded have no prop on the Pressable primitive, so this trigger
          is a plain button that restates the 44px floor in CSS rather than dropping the state a
          screen reader needs. */}
      <button
        type="button"
        className="hg-job-tray-trigger"
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        aria-label={`${label}, ${summary.words}`}
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
            <circle cx="12" cy="12" r="9" />
            <path d="M12 7.5V12l3 2" />
          </svg>
        )}
        <span className="hg-job-tray-words">{summary.words}</span>
      </button>

      {isOpen ? (
        <div role="dialog" aria-label={label} className="hg-job-tray-panel" data-align={align}>
          <div className="hg-job-tray-panel-head">
            <span className="hg-job-tray-panel-label">{label}</span>
            {onClear !== undefined && finished ? (
              <Pressable className="hg-job-tray-clear" onPress={onClear}>
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
