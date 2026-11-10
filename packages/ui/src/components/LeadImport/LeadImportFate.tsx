import { StatusMark } from '../../primitives/StatusMark';
import { ShellGlyph } from '../AppShell/ShellGlyph';
import { Avatar } from '../Avatar';
import { StageTrack } from '../StageTrack';
import { fateLineOf, fateMarkOf } from './LeadImport.logic';
import type { LeadImportRow, LeadImportWords } from './LeadImport.types';

/**
 * What happens to one row (`M02-20`, `M02-21`): its mark in a word, what the duplicate choice does
 * with it, and — for a number the company already has — the existing lead's three facts: owner,
 * stage, last contact. A lead outside the reader's list shows a lock and its owner only.
 */
export function LeadImportFate({ row, words }: { row: LeadImportRow; words: LeadImportWords }) {
  const mark = fateMarkOf(row, words);
  const line = fateLineOf(row, words);
  return (
    <span className="hg-lead-import-fate">
      <span className="hg-lead-import-fate-head">
        <StatusMark tone={mark.tone} label={mark.label} />
        {line === null ? null : <span className="hg-lead-import-fate-line">{line}</span>}
      </span>
      {row.repeatsRow !== null ? (
        <span className="hg-lead-import-facts">{words.sameNumberTwice}</span>
      ) : null}
      {row.match === null ? null : <LeadImportFacts row={row} words={words} />}
    </span>
  );
}

function LeadImportFacts({ row, words }: { row: LeadImportRow; words: LeadImportWords }) {
  const { match } = row;
  if (match === null) return null;
  const owner = (
    <span className="hg-lead-import-fact">
      {match.ownerName === null ? null : <Avatar name={match.ownerName} size={24} />}
      <span>{match.ownerName ?? words.noOwner}</span>
    </span>
  );
  if (match.kind === 'out_of_scope') {
    return (
      <span className="hg-lead-import-facts">
        <span className="hg-lead-import-fact">
          <ShellGlyph name="lock" size="sm" tone="secondary" />
          <span>{words.outside}</span>
        </span>
        {owner}
      </span>
    );
  }
  return (
    <span className="hg-lead-import-facts">
      {owner}
      <span className="hg-lead-import-fact">
        <StageTrack stage={match.stage} size="sm" words={words.stageTrack} />
        <span>{words.stage[match.stage]}</span>
      </span>
      <span className="hg-lead-import-fact">
        <ShellGlyph name="clock" size="sm" tone="secondary" />
        <span>{words.lastContact(row.lastContactAgoMs)}</span>
      </span>
    </span>
  );
}
