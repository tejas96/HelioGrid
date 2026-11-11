'use client';
import { useProjectBoardScreen } from '@heliogrid/data/react';
import { projectBoardWords } from '@heliogrid/i18n';
import { useI18n } from '@heliogrid/i18n/react';
import {
  boardSummaryOf,
  LargeTitle,
  ProjectBoard,
  projectBoardActsOf,
  useFormat,
} from '@heliogrid/ui';
import { notFound, useRouter } from 'next/navigation';
import { useRef } from 'react';
import { projectEarlyProofPath, projectPath } from '../shell';

/**
 * The Projects board on the web (`SCR-M08-01`). Who uses it: the project manager and the owner,
 * at a desk between calls or on a phone's browser — they came to see what needs them and do it in
 * one tap, and to see where every job stands. What is read, searched, filtered and counted is
 * `useProjectBoardScreen`'s, the phone's too; the web's own parts are the router and the page.
 */
export function ProjectsBoardScreen() {
  const screen = useProjectBoardScreen();
  const { t, locale } = useI18n();
  const format = useFormat();
  const router = useRouter();
  const room = useRef<HTMLDivElement>(null);
  if (!screen.allowed) notFound();
  const words = projectBoardWords(t, format.pack, locale);
  const open = (projectId: string, ask: 'earlyProof' | null) =>
    router.push(ask === null ? projectPath(projectId) : projectEarlyProofPath(projectId));
  const summary = boardSummaryOf(screen.read);
  return (
    <div ref={room} tabIndex={-1} className="hg-shell-page hg-focus-target">
      <ProjectBoard
        {...projectBoardActsOf(screen, open)}
        head={
          <LargeTitle
            title={words.title}
            summary={summary === null ? undefined : words.summary(summary)}
          />
        }
        words={words}
        openId={null}
        focusAfter={room}
      />
    </div>
  );
}
