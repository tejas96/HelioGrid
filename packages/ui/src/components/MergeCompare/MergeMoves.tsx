import { ShellGlyph } from '../AppShell/ShellGlyph';
import { useFormat } from '../MarketProvider';
import { MERGE_MOVE_GLYPH } from './MergeCompare.logic';
import type { MergeMovesProps } from './MergeCompare.types';

/**
 * What a merge moves, counted, and what it leaves: the other record's fate, no money, and — where
 * the act sits beside it — that it cannot be undone. It draws no card of its own: the phone's
 * confirm sets it in a card, the web's compare in the hero.
 */
export function MergeMoves({
  heading,
  rows,
  tombstone,
  noMoney,
  cannotUndo,
  none,
}: MergeMovesProps) {
  const format = useFormat();
  return (
    <div className="hg-merge-moves">
      <span className="hg-merge-over">{heading}</span>
      <ul className="hg-merge-move-rows">
        {rows.map((row) => (
          <li key={row.key} className="hg-merge-move">
            <ShellGlyph name={MERGE_MOVE_GLYPH[row.key]} size="md" tone="secondary" />
            <span className="hg-merge-move-words">
              <span className="hg-merge-move-label">{row.label}</span>
              {row.note === null ? null : <span className="hg-merge-move-note">{row.note}</span>}
            </span>
            <span className="hg-merge-move-count" data-zero={row.count === 0}>
              {row.count === 0 ? none : format.number(row.count)}
            </span>
          </li>
        ))}
      </ul>
      {tombstone === null ? null : (
        <p className="hg-merge-fact">
          <ShellGlyph name="link" size="md" tone="secondary" />
          <span>{tombstone}</span>
        </p>
      )}
      <p className="hg-merge-fact">
        <ShellGlyph name="rupee" size="md" tone="success" />
        <span>
          <strong>{noMoney.title}</strong> {noMoney.line}
        </span>
      </p>
      {cannotUndo === null ? null : (
        <p className="hg-merge-fact" data-tone="warning">
          <ShellGlyph name="alert-triangle" size="md" tone="warning" />
          <strong>{cannotUndo}</strong>
        </p>
      )}
    </div>
  );
}
