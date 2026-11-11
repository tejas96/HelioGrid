'use client';
import { useHandover, useProjectScreen } from '@heliogrid/data/react';
import { handoverWords, projectDetailWords, projectPackWords } from '@heliogrid/i18n';
import { useI18n } from '@heliogrid/i18n/react';
import {
  HandoverPanel,
  IconButton,
  LargeTitle,
  ProjectDetailStates,
  ShellGlyph,
  useFormat,
} from '@heliogrid/ui';
import { useRef } from 'react';
import { useProjectMoves } from './hooks/use-project-moves';

import './project-detail.css';

/**
 * The handover on the web (`SCR-M08-06`): the project manager at a desk finishing a job — they came
 * to see that nothing waits, hand over, download the pack, copy the ready message into their own
 * app, and ask for a referral while the customer is happy. Its ✕ leaves for the project. What is
 * read and sent is `useHandover`'s and `useProjectScreen`'s, the phone's too; the web's own parts
 * are the router, the clipboard and the new tab the pack opens in.
 */
export function ProjectHandoverScreen({ projectId }: { projectId: string }) {
  const { t, locale } = useI18n();
  const format = useFormat();
  const screen = useProjectScreen(projectId);
  const moves = useProjectMoves(projectId, screen);
  const { read } = screen;
  const project = read.kind === 'ready' ? read.value.project : null;
  const handover = useHandover(projectId, project?.customer.id ?? '', project !== null);
  const word = projectPackWords(format.pack, locale);
  const words = handoverWords(t, word);
  const detailWords = projectDetailWords(t, word, format.date);
  const room = useRef<HTMLDivElement>(null);
  return (
    <div ref={room} tabIndex={-1} className="hg-shell-page hg-focus-target hg-project-page">
      <div className={handover.handedOver ? 'flex justify-end' : 'flex'}>
        <IconButton label={words.close} onClick={moves.toProject}>
          <ShellGlyph name="close" size="md" tone="primary" />
        </IconButton>
      </div>
      {project === null || handover.handedOver ? null : (
        <LargeTitle
          title={words.title}
          summary={words.summary(project.customer.name ?? project.number, project.customer.city)}
        />
      )}
      {read.kind !== 'ready' ? (
        <ProjectDetailStates read={read} words={detailWords} focusAfter={room} />
      ) : (
        <HandoverPanel
          preview={handover.preview}
          project={read.value.project}
          opening={read.value.view.handover}
          words={words}
          pack={handover.pack}
          onDownload={(fileId) => moves.openFile({ fileId })}
          onLookAgain={handover.lookAgain}
          onOpenRow={moves.documents}
          onHandOver={() => screen.send({ kind: 'handover' })}
          sending={screen.sending}
          failure={detailWords.said(screen.refusal, screen.failed)}
          onShare={null}
          onCopy={(text) => {
            void navigator.clipboard.writeText(text).then(handover.markCopied, () => undefined);
          }}
          copied={handover.copied}
          onRefer={handover.refer}
          referring={handover.referring}
          referred={handover.referred}
          referralKnown={handover.referralKnown}
          referralFailed={handover.referralFailed}
          onSkipReferral={moves.toProject}
        />
      )}
    </div>
  );
}
