import type { TranslatedText } from '@heliogrid/contracts';
import type { BoardRow, ProjectBoardView } from '@heliogrid/domain';
import { type RefObject, useId, useRef, useState } from 'react';
import { type FocusAfter, useFocusAfter } from '../../primitives/FocusAfter';
import { StatusMark } from '../../primitives/StatusMark';
import { ShellGlyph } from '../AppShell/ShellGlyph';
import { Avatar } from '../Avatar';
import { Button } from '../Button';
import { NamedGap } from '../NamedGap';
import { cappedOf, cardMark, TABLE_CAP } from './ProjectBoard.logic';
import type { ProjectBoardProps } from './ProjectBoard.types';
import { ProjectBoardNoMatch } from './ProjectBoardNoMatch';
import './ProjectBoardTable.css';

type DeskProps = ProjectBoardProps & { view: ProjectBoardView };

/**
 * Every live project — or the chosen stage's — under its heading and count, as OneOhm's table:
 * lines, no card, oldest first within each stage, the first fourteen until *Show more*.
 */
export function ProjectBoardDesk(props: DeskProps & { missed: boolean; searchField: FocusAfter }) {
  const { view, words, onChooseStage, missed } = props;
  const heading = useId();
  const headingRef = useRef<HTMLHeadingElement>(null);
  const rows = view.groups.flatMap((group) => group.rows);
  return (
    <section className="hg-project-board-section" aria-labelledby={heading}>
      <div className="hg-project-board-desk-head">
        <h2
          id={heading}
          ref={headingRef}
          tabIndex={-1}
          className="hg-project-board-heading hg-focus-target"
        >
          {view.chosen === null ? words.allLiveProjects : words.stage(view.chosen)}
          <span className="hg-project-board-count">{rows.length}</span>
        </h2>
        {view.chosen === null ? (
          <span className="hg-project-board-quiet">
            {view.sort === 'longest' ? words.byStage : props.top.order[view.sort]}
          </span>
        ) : (
          <ClearStage
            label={words.clearStage}
            onClear={() => onChooseStage(null)}
            focusAfter={headingRef}
          />
        )}
      </div>
      {missed ? (
        <ProjectBoardNoMatch {...props} />
      ) : rows.length === 0 && view.chosen !== null ? (
        <p className="hg-project-board-none">{words.noneInStage(view.chosen)}</p>
      ) : (
        <Table rows={rows} {...props} />
      )}
    </section>
  );
}

/** *Clear stage* leaves with its press: focus lands on the heading that now names every project. */
function ClearStage({
  label,
  onClear,
  focusAfter,
}: {
  label: TranslatedText;
  onClear: () => void;
  focusAfter: FocusAfter;
}) {
  const leaving = useFocusAfter(focusAfter);
  return (
    <Button
      variant="secondary"
      size="sm"
      icon={<ShellGlyph name="close" size="sm" tone="primary" />}
      onClick={leaving(onClear)}
    >
      {label}
    </Button>
  );
}

function Table(props: DeskProps & { rows: readonly BoardRow[] }) {
  const { rows, words } = props;
  const [open, setOpen] = useState(false);
  const reveal = useRef<HTMLButtonElement>(null);
  const leaving = useFocusAfter(reveal);
  const { shown, held } = cappedOf(rows, TABLE_CAP, open);
  return (
    <>
      <table className="hg-project-board-table">
        <thead>
          <tr>
            <th scope="col">{words.table.project}</th>
            <th scope="col">{words.table.stage}</th>
            <th scope="col" data-number="true">
              {words.table.daysHere}
            </th>
            <th scope="col">{words.table.install}</th>
            <th scope="col">{words.table.manager}</th>
            <th scope="col">{words.table.status}</th>
          </tr>
        </thead>
        <tbody>
          {shown.map((row, index) => (
            <TableRow
              key={row.card.id}
              row={row}
              revealRef={open && index === TABLE_CAP ? reveal : undefined}
              {...props}
            />
          ))}
        </tbody>
      </table>
      {held === 0 ? null : (
        <span className="hg-project-board-more">
          <Button variant="ghost" size="sm" onClick={leaving(() => setOpen(true))}>
            {words.showMore(held)}
          </Button>
        </span>
      )}
    </>
  );
}

/** One project's row: the whole row opens it for a pointer; its name is the button for the keys. */
function TableRow({
  row,
  revealRef,
  words,
  onOpen,
  openId,
}: DeskProps & { row: BoardRow; revealRef: RefObject<HTMLButtonElement | null> | undefined }) {
  const { card } = row;
  const mark = cardMark(card, words);
  const install = words.installCell(card);
  return (
    <tr data-open={openId === card.id ? 'true' : undefined} onClick={() => onOpen(card.id)}>
      <td>
        <button
          ref={revealRef}
          type="button"
          className="hg-project-board-open"
          aria-label={words.open(card.name ?? words.noName)}
          onClick={(event) => {
            event.stopPropagation();
            onOpen(card.id);
          }}
        />
        <span className="hg-project-board-cell-name">
          {card.name ?? <NamedGap gap={words.noName} scale="field" />}
        </span>
        {card.place === null ? null : (
          <span className="hg-project-board-cell-line">{card.place}</span>
        )}
      </td>
      <td>{words.stage(card.stage)}</td>
      <td data-number="true">
        <span className="hg-project-board-days">{words.days(row.days)}</span>
      </td>
      <td>
        {install === null ? null : <span className="hg-project-board-install">{install}</span>}
      </td>
      <td>
        <span
          className="hg-project-board-manager"
          role="img"
          aria-label={card.manager.name}
          title={card.manager.name}
        >
          <Avatar name={card.manager.name} size={28} />
        </span>
      </td>
      <td>{mark === null ? null : <StatusMark tone={mark.tone} label={mark.label} />}</td>
    </tr>
  );
}
