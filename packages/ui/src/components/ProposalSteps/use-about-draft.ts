import { useState } from 'react';
import { useFieldCommits } from '../../primitives/FieldCommits';
import { useCommitOnUnmount } from '../../primitives/use-commit-on-unmount';
import type { TrackRecordStepView } from './ProposalSteps.types';

/**
 * Step 2's words about the company, as both halves hold them: typed here, handed up when the box is
 * left — or as typed inside a form with its own Save — and never lost to a press that unmounts the
 * step first (`packages/ui/CLAUDE.md` Traps).
 */
export function useAboutDraft(view: TrackRecordStepView) {
  const { about } = view;
  const saved = view.record.aboutCompany ?? '';
  const [text, setText] = useState(saved);
  const asTyped = useFieldCommits() === 'as-typed';
  const leave = () => {
    if (text !== saved) about?.onCommit(text);
  };
  useCommitOnUnmount(text !== saved, leave);
  return {
    text,
    leave,
    change: (next: string) => {
      setText(next);
      if (asTyped) about?.onCommit(next);
    },
  };
}
