import { proposalSheetsOf, sheetKey } from '@heliogrid/domain';
import { type UIEvent, useRef, useState } from 'react';
import { Pressable } from '../../primitives/Pressable';
import { ShellGlyph } from '../AppShell/ShellGlyph';
import { Button } from '../Button';
import { FailedRead } from '../EmptyState';
import { IconButton } from '../IconButton';
import { LoadingBars } from '../LoadingBars';
import { ScaledProposalPage } from '../ProposalPages';
import { pageInView, READER_THUMB_WIDTH } from './ProposalReader.logic';
import type { ProposalReaderDocument, ProposalReaderProps } from './ProposalReader.types';
import './ProposalReader.css';

type Ready = ProposalReaderProps & { readonly document: ProposalReaderDocument };

/** How far above a page's top the reader may be and still count as on it, in px. */
const LOOK_AHEAD = 120;

function Acts({ words, pending, room, ...props }: Ready) {
  const out = pending !== null;
  const share =
    props.onShare === undefined ? null : (
      <Button
        variant="primary"
        size={room === 'wide' ? 'md' : 'lg'}
        fullWidth={room === 'narrow'}
        icon={<ShellGlyph name="send" size="md" tone="inverse" />}
        loading={pending === 'share'}
        disabled={out && pending !== 'share'}
        onClick={props.onShare}
      >
        {words.share}
      </Button>
    );
  if (room === 'narrow') {
    return (
      <div className="hg-reader-dock">
        {props.onNewVersion === undefined ? null : (
          <IconButton label={words.newVersion} disabled={out} onClick={props.onNewVersion}>
            <ShellGlyph name="pencil" size="md" tone="primary" />
          </IconButton>
        )}
        {props.onPdf === undefined ? null : (
          <IconButton label={words.pdf} disabled={out} onClick={props.onPdf}>
            <ShellGlyph name="download" size="md" tone="primary" />
          </IconButton>
        )}
        {share}
      </div>
    );
  }
  return (
    <div className="hg-reader-acts">
      {props.onNewVersion === undefined ? null : (
        <Button
          variant="secondary"
          size="md"
          icon={<ShellGlyph name="pencil" size="md" tone="primary" />}
          disabled={out}
          onClick={props.onNewVersion}
        >
          {words.newVersion}
        </Button>
      )}
      {props.onPdf === undefined ? null : (
        <Button
          variant="secondary"
          size="md"
          icon={<ShellGlyph name="download" size="md" tone="primary" />}
          loading={pending === 'pdf'}
          disabled={out && pending !== 'pdf'}
          onClick={props.onPdf}
        >
          {words.pdf}
        </Button>
      )}
      {share}
    </div>
  );
}

function Pages(props: Ready) {
  const { document, words, room, pageWidth } = props;
  const pages = proposalSheetsOf(document.snapshot.pages, document.snapshot.fields);
  const [at, setAt] = useState(0);
  const sheets = useRef<(HTMLLIElement | null)[]>([]);
  const onScroll = (event: UIEvent<HTMLDivElement>) => {
    const tops = sheets.current.map((sheet) => sheet?.offsetTop ?? 0);
    setAt(pageInView(tops, event.currentTarget.scrollTop, LOOK_AHEAD));
  };
  const goTo = (index: number) => {
    sheets.current[index]?.scrollIntoView({ block: 'start' });
    setAt(index);
  };
  const current = pages[at];
  return (
    <div className="hg-reader-body">
      {room === 'wide' ? (
        <nav className="hg-reader-thumbs" aria-label={words.pagesName}>
          {pages.map((sheet, index) => (
            <Pressable
              key={sheetKey(sheet)}
              className="hg-reader-thumb"
              accessibilityLabel={words.goToPage(index + 1, document.words.titles[sheet.page])}
              accessibilityState={{ selected: index === at }}
              onPress={() => goTo(index)}
            >
              <span className="hg-reader-thumb-paper" aria-hidden="true">
                <ScaledProposalPage
                  {...document}
                  page={sheet.page}
                  part={sheet.part}
                  width={READER_THUMB_WIDTH}
                  still
                />
              </span>
              <span className="hg-reader-thumb-name">
                {words.thumbName(index + 1, document.words.titles[sheet.page])}
              </span>
            </Pressable>
          ))}
        </nav>
      ) : null}
      {/* A tab stop, so the keyboard can scroll the pages. */}
      {/* biome-ignore lint/a11y/useSemanticElements: a scrolling document, not a page landmark. */}
      <div
        className="hg-reader-scroll"
        role="region"
        aria-label={words.documentName}
        // biome-ignore lint/a11y/noNoninteractiveTabindex: a scrolling region must take focus to scroll.
        tabIndex={0}
        onScroll={onScroll}
      >
        {/* Where the room is wide the thumbnails say which page is in view; the pill is the phone's. */}
        {current === undefined || room === 'wide' ? null : (
          <span className="hg-reader-pill" role="status">
            {words.pagePill(at + 1, pages.length, document.words.titles[current.page])}
          </span>
        )}
        <ol className="hg-reader-pages">
          {pages.map((sheet, index) => (
            <li
              key={sheetKey(sheet)}
              ref={(sheet) => {
                sheets.current[index] = sheet;
              }}
            >
              <ScaledProposalPage
                {...document}
                page={sheet.page}
                part={sheet.part}
                width={pageWidth}
              />
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}

/** The proposal document, read on the web (`SCR-M06-17`). */
export function ProposalReader(props: ProposalReaderProps) {
  const { read, words } = props;
  if (read.kind === 'loading') {
    return <LoadingBars bars={['panel', 'panel']} label={words.opening} />;
  }
  if (read.kind === 'failed') {
    return (
      <FailedRead
        title={words.failedTitle}
        message={words.failedMessage}
        retryLabel={words.retry}
        onRetry={read.retry}
        focusAfter={props.focusAfter}
      />
    );
  }
  const ready: Ready = { ...props, document: read.value };
  return (
    <div className="hg-reader" data-room={props.room}>
      {props.room === 'wide' ? <Acts {...ready} /> : null}
      <Pages {...ready} />
      {props.room === 'narrow' ? <Acts {...ready} /> : null}
    </div>
  );
}
