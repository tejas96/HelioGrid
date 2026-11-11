import { useFocusAfter } from '../../primitives/FocusAfter';
import { StatusMark } from '../../primitives/StatusMark';
import { ShellGlyph } from '../AppShell/ShellGlyph';
import { Avatar } from '../Avatar';
import { Button } from '../Button';
import { CardRow, CardRows } from '../CardRows';
import { HueTile } from '../HueTile';
import { NamedGap } from '../NamedGap';
import { KIND_TILE, rowActOf, rowOpenOf } from './ProjectRows.logic';
import type {
  ProjectRowGroupProps,
  ProjectRowItem,
  ProjectRowListProps,
  ProjectRowMoreProps,
  ProjectRowProps,
} from './ProjectRows.types';
import './ProjectRows.css';

/** One project in a card of rows; its act, when it has one, sits outside the open target. */
export function ProjectRow(props: ProjectRowProps) {
  const {
    first,
    name,
    line,
    kind,
    mark,
    act,
    chevron,
    highlighted = false,
    targetRef,
    words,
  } = props;
  return (
    <CardRow
      first={first}
      highlighted={highlighted}
      targetRef={targetRef}
      open={rowOpenOf(props)}
      className="hg-project-row"
      aside={act === null ? null : <Button {...rowActOf(act)}>{act.label}</Button>}
    >
      {kind === null ? null : <HueTile glyph={kind.glyph} hue={kind.tint} {...KIND_TILE.row} />}
      <span className="hg-project-row-main">
        <span className="hg-project-row-name">
          {name ?? <NamedGap gap={words.noName} scale="field" />}
        </span>
        {line === null ? null : <span className="hg-project-row-line">{line}</span>}
        {mark === null ? null : (
          <span className="hg-project-row-mark">
            <StatusMark tone={mark.tone} label={mark.label} />
          </span>
        )}
      </span>
      <RowEnd {...props} />
      {chevron ? <ShellGlyph name="chevron-right" size="sm" tone="secondary" /> : null}
    </CardRow>
  );
}

/** The row's end: its days figure, and its manager's face named for a screen reader. */
function RowEnd({ days, manager, act }: ProjectRowProps) {
  if (act !== null || (days === null && manager === null)) return null;
  return (
    <span className="hg-project-row-end">
      {days === null ? null : <span className="hg-project-row-days">{days}</span>}
      {manager === null ? null : (
        <span className="hg-project-row-manager" role="img" aria-label={manager} title={manager}>
          <Avatar name={manager} size={28} />
        </span>
      )}
    </span>
  );
}

/** A group's head inside the card — its kind tile, what the rows below share, and how many. */
export function ProjectRowGroup({ first, kind, label, count }: ProjectRowGroupProps) {
  return (
    <li className="hg-project-row-group" data-first={first ? 'true' : undefined}>
      <HueTile glyph={kind.glyph} hue={kind.tint} {...KIND_TILE.head} />
      <span className="hg-project-row-group-label">{label}</span>
      <span className="hg-project-row-group-count">{count}</span>
    </li>
  );
}

/** The card's last line: the held-back rows' way in. */
export function ProjectRowMore({ label, onPress, focusAfter }: ProjectRowMoreProps) {
  const leaving = useFocusAfter(focusAfter);
  return (
    <li className="hg-project-row-more">
      <Button variant="ghost" size="sm" onClick={leaving(onPress)}>
        {label}
      </Button>
    </li>
  );
}

/** One card of rows: each group's head, then its projects, then *Show more*. */
export function ProjectRowList({ items }: ProjectRowListProps) {
  return <CardRows>{items.map(itemOf)}</CardRows>;
}

function itemOf(item: ProjectRowItem) {
  if (item.kind === 'group') return <ProjectRowGroup key={item.key} {...item.group} />;
  if (item.kind === 'more') return <ProjectRowMore key={item.key} {...item.more} />;
  return <ProjectRow key={item.key} {...item.row} />;
}
