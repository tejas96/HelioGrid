import { type RefObject, useRef } from 'react';
import type { FocusHandle } from '../../primitives/FocusAfter';
import { ShellGlyph } from '../AppShell/ShellGlyph';
import { Button } from '../Button';
import { FailedRead } from '../EmptyState';
import { FileLink } from '../FileLink';
import { LoadingBars } from '../LoadingBars';
import { NamedGap } from '../NamedGap';
import { PendingAction } from '../PendingAction';
import { leadFilePendingOf, leadFilesFailedOf } from './LeadSections.logic';
import type { LeadFilesPanel, LeadSectionsWords } from './LeadSections.types';

interface LeadFileListProps {
  readonly files: LeadFilesPanel;
  readonly words: LeadSectionsWords;
}

/**
 * The Files section (`M02-32`): the lead's papers, oldest first, each by its own name with who
 * added it and when, opened with a tap; then the pick going up — or come back undone, with its
 * retry — and *Add a file*. One frame holds every state, so focus sent to it after *Try again*
 * stays while the list reads again.
 */
export function LeadFileList({ files, words }: LeadFileListProps) {
  const frame = useRef<HTMLDivElement>(null);
  const add = useRef<FocusHandle>(null);
  const line = leadFilePendingOf(files, words, add);
  const going = files.pending !== null && !files.pending.failed;
  return (
    <div ref={frame} tabIndex={-1} className="hg-lead-files hg-focus-target">
      <FileRows files={files} words={words} frame={frame} />
      {line === null ? null : <PendingAction {...line} />}
      {files.onAdd === null ? null : (
        <div className="hg-lead-section-acts">
          <Button
            ref={add}
            variant="secondary"
            size="sm"
            icon={<ShellGlyph name="plus" size="sm" tone="primary" />}
            loading={going}
            onClick={files.onAdd}
          >
            {words.addFile}
          </Button>
        </div>
      )}
    </div>
  );
}

function FileRows({
  files,
  words,
  frame,
}: LeadFileListProps & { frame: RefObject<HTMLDivElement | null> }) {
  const { read } = files;
  switch (read.kind) {
    case 'loading':
      return <LoadingBars bars={['row', 'row']} label={words.loadingFiles} />;
    case 'failed':
      return <FailedRead {...leadFilesFailedOf(read.retry, words, frame)} />;
    case 'empty':
      return (
        <div className="hg-lead-files-gap">
          <NamedGap gap={words.noFiles} />
          <p className="hg-lead-section-line">{words.filesLine}</p>
        </div>
      );
    case 'ready':
      return (
        <ul className="hg-lead-files-list">
          {read.value.map((file) => (
            <li key={file.id} className="hg-lead-file">
              <FileLink name={file.name} onOpen={() => files.onOpen(file.fileId)} />
              <span className="hg-lead-section-line">{file.line}</span>
            </li>
          ))}
        </ul>
      );
  }
}
