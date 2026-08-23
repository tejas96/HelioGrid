import { Pressable } from '../../primitives/Pressable';
import type { StatusTone } from '../../primitives/StatusMark';
import { StatusMark } from '../../primitives/StatusMark';
import { renderPending } from '../PendingAction';
import type { Finding, FindingStatus } from './FindingList.types';
import { FINDING_LABEL, statusOf } from './FindingList.verdict';

/** The three statuses in the StatusMark vocabulary. Ready is a pass, not an absence. */
export const FINDING_TONE: Record<FindingStatus, StatusTone> = {
  blocking: 'danger',
  attention: 'warning',
  ready: 'success',
};

const MARK_PATH: Record<FindingStatus, string> = {
  ready: 'M5 13l4 4L19 7',
  blocking: 'M12 7v7M12 17.5h.01',
  attention: 'M12 8v5M12 16.5h.01',
};

/** The row's own mark. The status pill beside it therefore needs no second glyph. */
function Mark({ status }: { status: FindingStatus }) {
  return (
    <span aria-hidden="true" className="hg-finding-mark" data-status={status}>
      <svg
        aria-hidden="true"
        width="11"
        height="11"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d={MARK_PATH[status]} />
      </svg>
    </span>
  );
}

interface FindingListRowProps {
  finding: Finding;
  onJump?: (finding: Finding) => void;
  jumpLabel?: string;
}

/** One finding: the mark, the check, its meaning in plain language, and the act that fixes it. */
export function FindingListRow({ finding, onJump, jumpLabel }: FindingListRowProps) {
  const status = statusOf(finding);
  const jump = finding.onJump ?? (onJump === undefined ? undefined : () => onJump(finding));
  const jumpWords =
    finding.jumpLabel ?? (finding.step === undefined ? jumpLabel : `Fix in ${finding.step}`);
  const pending = renderPending(finding.pending, { size: 12 });
  return (
    <li className="hg-finding-row">
      <Mark status={status} />
      <div className="hg-finding-body">
        <div className="hg-finding-head">
          <span className="hg-finding-title">{finding.title}</span>
          <StatusMark
            tone={FINDING_TONE[status]}
            label={finding.statusLabel ?? FINDING_LABEL[status]}
            mark={false}
            className="hg-finding-status"
          />
        </div>
        {/* M05-58: the meaning in plain language, always — a check name is not a sentence. */}
        {finding.meaning === undefined ? null : (
          <p className="hg-finding-meaning">{finding.meaning}</p>
        )}
        {finding.family === undefined ? null : (
          <p className="hg-finding-family">{finding.family}</p>
        )}
        {pending}
        {jump === undefined && finding.fix === undefined ? null : (
          <div className="hg-finding-acts">
            {jump === undefined ? null : (
              <Pressable className="hg-finding-jump" onPress={jump}>
                {jumpWords}
                <svg
                  width="15"
                  height="15"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M5 12h13M13 6l6 6-6 6" />
                </svg>
              </Pressable>
            )}
            {/* The second, inline one-tap fix — MS6-27's "Auto-string now". Optional by design:
                most findings have no such act, and inventing one promises a fix that isn't there. */}
            {finding.fix === undefined ? null : (
              <Pressable className="hg-finding-fix" onPress={finding.fix.onFix}>
                {finding.fix.label}
              </Pressable>
            )}
          </div>
        )}
      </div>
    </li>
  );
}
