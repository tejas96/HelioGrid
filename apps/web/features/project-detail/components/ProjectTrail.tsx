'use client';
import type { TranslatedText } from '@heliogrid/contracts';
import { Button, ShellGlyph } from '@heliogrid/ui';
import type { ReactNode } from 'react';

/**
 * The way back above a project's page (the picked desktop): the board, then — on the checklist's own
 * page — the project, each a step back, and where the person is now, quiet.
 */
export function ProjectTrail({
  acts,
  board,
  project,
  documents,
  onBoard,
  onProject,
}: {
  /** At the phone width, the page's Call and ⋯ at the row's other end, as the phone's bar holds them. */
  acts: ReactNode;
  board: TranslatedText;
  project: TranslatedText | null;
  documents: TranslatedText | null;
  onBoard: () => void;
  onProject: () => void;
}) {
  const back = <ShellGlyph name="chevron-left" size="sm" />;
  return (
    <div className="hg-project-page-trail-row">
      <nav className="hg-project-page-trail" aria-label={board}>
        <Button variant="ghost" size="sm" icon={back} onClick={onBoard}>
          {board}
        </Button>
        {project === null ? null : documents === null ? (
          <span className="hg-project-page-here" aria-current="page">
            {project}
          </span>
        ) : (
          <>
            <Button variant="ghost" size="sm" onClick={onProject}>
              {project}
            </Button>
            <span className="hg-project-page-here" aria-current="page">
              {documents}
            </span>
          </>
        )}
      </nav>
      {acts}
    </div>
  );
}
