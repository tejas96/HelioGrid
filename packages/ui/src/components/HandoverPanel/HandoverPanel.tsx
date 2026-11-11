import type { TranslatedText } from '@heliogrid/contracts';
import { type RefObject, useRef } from 'react';
import { useFocusAfter } from '../../primitives/FocusAfter';
import { Text } from '../../primitives/Text/Text';
import { ShellGlyph } from '../AppShell/ShellGlyph';
import { Button } from '../Button';
import { CardRow, CardRows } from '../CardRows';
import { FailedRead } from '../EmptyState';
import { HeroPanel } from '../HeroPanel';
import { LoadingBars } from '../LoadingBars';
import { LottieMoment } from '../LottieMoment';
import { projectFailedOf } from '../ProjectDetail/ProjectDetail.states';
import { HandoverMessage } from './HandoverMessage';
import { HandoverPack } from './HandoverPack';
import {
  documentCountsOf,
  handedOverNameOf,
  handOverBlockedOf,
  handoverLoadingOf,
  isHandedOver,
} from './HandoverPanel.logic';
import type { HandoverPanelProps } from './HandoverPanel.types';
import { HandoverReferral } from './HandoverReferral';
import './HandoverPanel.css';

type Frames = {
  readonly frame: RefObject<HTMLDivElement | null>;
  readonly doneRef: RefObject<HTMLHeadingElement | null>;
};

/**
 * The handover on the web, one column in a page or a panel. One frame holds every state, so focus
 * sent to it after *Try again* stays while the preview loads again; once handed over, focus lands
 * on the moment that replaced the act.
 */
export function HandoverPanel(props: HandoverPanelProps) {
  const frame = useRef<HTMLDivElement>(null);
  const doneRef = useRef<HTMLHeadingElement>(null);
  return (
    <div ref={frame} tabIndex={-1} className="hg-handover hg-focus-target">
      <HandoverBody {...props} frame={frame} doneRef={doneRef} />
    </div>
  );
}

/**
 * The panel's one column: the wait, the failure, or the checks, the pack, the message and the act
 * — and once handed over, the moment, the pack to download, the message to send and the referral.
 */
function HandoverBody(props: HandoverPanelProps & Frames) {
  const { preview, project, words, frame } = props;
  if (preview.kind === 'loading') return <LoadingBars {...handoverLoadingOf(words)} />;
  if (preview.kind === 'failed') {
    return <FailedRead {...projectFailedOf(words, preview.retry, frame)} />;
  }
  const { pendingRows, message } = preview.value;
  if (isHandedOver(project)) {
    return (
      <>
        <div className="hg-handover-done" role="status">
          <LottieMoment name="success" size={120} />
          <h1 ref={props.doneRef} tabIndex={-1} className="hg-handover-done-title hg-focus-target">
            {words.done}
          </h1>
          <p className="hg-handover-done-line">
            {words.doneLine(handedOverNameOf(project), props.pack.kind !== 'empty')}
          </p>
        </div>
        {props.pack.kind === 'empty' ? null : <HandoverPack {...props} />}
        <HandoverMessage {...props} message={message} sendable />
        <HandoverReferral {...props} customerName={project.customer.name} />
      </>
    );
  }
  return (
    <>
      <Checks {...props} pendingRows={pendingRows} />
      <HandoverPack {...props} />
      <HandoverMessage {...props} message={message} sendable={false} />
      <HandOver {...props} blocked={handOverBlockedOf(words, props.opening, pendingRows)} />
    </>
  );
}

/** What handover checks: every row done — counted — or the rows that still wait, each opening its document. */
function Checks({
  words,
  project,
  pendingRows,
  onOpenRow,
}: HandoverPanelProps & { pendingRows: readonly string[] }) {
  const counts = documentCountsOf(project);
  const ready = pendingRows.length === 0;
  return (
    <>
      <HeroPanel name={ready ? words.ready : words.waitingTitle}>
        <div className="hg-handover-status">
          <span className="hg-handover-mark" data-tone={ready ? 'success' : 'warning'}>
            <ShellGlyph
              name={ready ? 'tick' : 'alert-circle'}
              size="md"
              tone={ready ? 'success' : 'warning'}
            />
          </span>
          <span className="hg-handover-status-words">
            <span className="hg-handover-status-title">
              {ready ? words.ready : words.waitingTitle}
            </span>
            <span className="hg-handover-on-panel-line">
              {ready ? words.readyLine(counts.done, counts.notNeeded) : words.waitingLine}
            </span>
          </span>
        </div>
      </HeroPanel>
      {ready ? null : (
        <CardRows form="joined">
          {pendingRows.map((row, index) => (
            <CardRow
              key={row}
              first={index === 0}
              open={{ name: words.row(row), onOpen: () => onOpenRow(row) }}
              className="hg-handover-row"
            >
              <span className="hg-handover-row-mark">
                <ShellGlyph name="file" size="md" tone="warning" />
              </span>
              <span className="hg-handover-row-name">{words.row(row)}</span>
              <ShellGlyph name="chevron-right" size="sm" tone="secondary" />
            </CardRow>
          ))}
        </CardRows>
      )}
    </>
  );
}

/** The act: off with its reason while a row waits; its failure said above it. */
function HandOver({
  words,
  sending,
  failure,
  onHandOver,
  blocked,
  doneRef,
}: HandoverPanelProps & Frames & { blocked: TranslatedText | null }) {
  const leaving = useFocusAfter(doneRef);
  return (
    <div className="hg-handover-act">
      {failure === null ? null : (
        <Text variant="body-sm" color="danger" live>
          {failure}
        </Text>
      )}
      <Button
        variant="primary"
        size="lg"
        fullWidth
        icon={<ShellGlyph name="key" size="md" tone="inverse" />}
        loading={sending}
        disabled={blocked !== null}
        disabledReason={blocked ?? undefined}
        onClick={leaving(() => {
          if (!sending && blocked === null) onHandOver();
        })}
      >
        {words.send}
      </Button>
    </div>
  );
}
