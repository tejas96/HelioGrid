import type { ProjectFile, TranslatedText } from '@heliogrid/contracts';
import { type ReactNode, type Ref, useRef } from 'react';
import { type FocusAfter, useFocusAfter } from '../../primitives/FocusAfter';
import { StatusMark } from '../../primitives/StatusMark';
import { ShellGlyph } from '../AppShell/ShellGlyph';
import { Button } from '../Button';
import { Card } from '../Card';
import { FileLink as NamedFileLink } from '../FileLink';
import { HueTile } from '../HueTile';
import { Switch } from '../Switch';
import type { ProjectBlock } from './ProjectDetail.blocks';
import type { DetailRow, DetailRowAct } from './ProjectDetail.rows';

/** A card's head, inside its tile: its name, a quiet count or note beside it, its one act at the end. */
export function CardHead({
  title,
  aside,
  act = null,
  headingRef,
}: {
  title: TranslatedText;
  aside: TranslatedText | null;
  act?: ReactNode;
  /** Where focus lands when one of the card's acts leaves after its press. */
  headingRef?: Ref<HTMLHeadingElement>;
}) {
  return (
    <div className="hg-project-detail-card-head">
      <h2
        ref={headingRef}
        tabIndex={headingRef === undefined ? undefined : -1}
        className="hg-project-detail-card-title hg-focus-target"
      >
        {title}
      </h2>
      {aside === null ? null : <span className="hg-project-detail-quiet">{aside}</span>}
      {act === null ? null : <span className="hg-project-detail-card-act">{act}</span>}
    </div>
  );
}

/** The files on a row, each its own name, opened with a tap. None draws nothing. */
export function FileLinks({
  files,
  onOpen,
}: {
  files: readonly ProjectFile[];
  onOpen: (file: ProjectFile) => void;
}) {
  if (files.length === 0) return null;
  return (
    <span className="hg-project-detail-files">
      {files.map((file) => (
        <NamedFileLink key={file.id} name={file.name} onOpen={() => onOpen(file)} />
      ))}
    </span>
  );
}

/**
 * A file that did not reach the project, said where the person acted — and, where it can go again,
 * the line is the button that sends it again.
 */
export function NotSent({
  shown,
  words,
  onRetry,
}: {
  shown: boolean;
  words: TranslatedText;
  onRetry: (() => void) | null;
}) {
  if (!shown) return null;
  return (
    <div className="hg-project-detail-failed" role="alert">
      {onRetry === null ? (
        words
      ) : (
        <Button
          variant="ghost"
          size="sm"
          icon={<ShellGlyph name="alert" size="sm" tone="danger" />}
          onClick={onRetry}
        >
          {words}
        </Button>
      )}
    </div>
  );
}

/** One card of the project page: its head and act, a file that did not reach it, its rows, the way on. */
export function DetailCard({
  block,
  words,
  onOpenFile,
}: {
  block: ProjectBlock;
  words: { readonly notSent: TranslatedText };
  onOpenFile: (file: ProjectFile) => void;
}) {
  const { title, aside, act, rows, none, more } = block;
  const heading = useRef<HTMLHeadingElement>(null);
  return (
    <section aria-label={title}>
      <Card density="functional" className="hg-project-detail-card">
        <CardHead
          title={title}
          aside={aside}
          act={act === null ? null : <RowAct act={act} focusAfter={heading} />}
          headingRef={heading}
        />
        <NotSent shown={block.notSent} words={words.notSent} onRetry={act?.onPress ?? null} />
        {rows.length === 0 ? (
          <p className="hg-project-detail-none">{none}</p>
        ) : (
          <ul className="hg-project-detail-rows">
            {rows.map((row) => (
              <Row key={row.key} row={row} words={words} onOpenFile={onOpenFile} focus={heading} />
            ))}
          </ul>
        )}
        {more === null ? null : (
          <span className="hg-project-detail-more">
            <RowAct act={more} focusAfter={heading} />
          </span>
        )}
      </Card>
    </section>
  );
}

function Row({
  row,
  words,
  onOpenFile,
  focus,
}: {
  row: DetailRow;
  words: { readonly notSent: TranslatedText };
  onOpenFile: (file: ProjectFile) => void;
  focus: FocusAfter;
}) {
  const { name } = row;
  return (
    <li className="hg-project-detail-row" aria-busy={row.busy ? true : undefined}>
      <HueTile {...row.tile} />
      <span className="hg-project-detail-row-main">
        {typeof name === 'string' ? (
          <span className="hg-project-detail-row-name">{name}</span>
        ) : (
          <NamedFileLink name={name.name} onOpen={() => onOpenFile(name)} />
        )}
        {row.sub === null ? null : <span className="hg-project-detail-row-sub">{row.sub}</span>}
        <FileLinks files={row.files} onOpen={onOpenFile} />
        <NotSent shown={row.notSent} words={words.notSent} onRetry={row.acts[0]?.onPress ?? null} />
        {row.acts.slice(1).map((act) => (
          <RowAct key={act.key} act={act} focusAfter={focus} />
        ))}
      </span>
      <RowEnd row={row} focus={focus} />
    </li>
  );
}

/**
 * A row's end: its state as glyph and word, a quiet caption, its first act or its switch. A second,
 * quieter act sits under the row's name, so the name keeps its room on a phone.
 */
function RowEnd({ row, focus }: { row: DetailRow; focus: FocusAfter }) {
  const { mark, caption, show } = row;
  const acts = row.acts.slice(0, 1);
  if (mark === null && caption === null && acts.length === 0 && show === null) return null;
  return (
    <span className="hg-project-detail-row-end">
      {mark === null ? null : <StatusMark tone={mark.tone} label={mark.label} />}
      {caption === null ? null : <span className="hg-project-detail-quiet">{caption}</span>}
      {acts.map((act) => (
        <RowAct key={act.key} act={act} focusAfter={focus} />
      ))}
      {show === null ? null : <Switch {...show} />}
    </span>
  );
}

/**
 * One act on a card or a row, spoken with its row. One that leaves after its press — *Needed after
 * all*, *Not needed* once the row is done — lands focus on the card's heading, so the keyboard and
 * the screen reader are never lost.
 */
export function RowAct({ act, focusAfter }: { act: DetailRowAct; focusAfter: FocusAfter }) {
  const leaving = useFocusAfter(focusAfter);
  const { label, spoken, variant, glyph, loading, onPress } = act;
  const icon = glyph === null ? null : <ShellGlyph name={glyph} size="sm" tone="primary" />;
  return (
    <Button
      variant={variant}
      size="sm"
      icon={icon}
      loading={loading}
      {...(spoken === null ? {} : { spokenName: spoken })}
      onClick={leaving(onPress)}
    >
      {label}
    </Button>
  );
}
