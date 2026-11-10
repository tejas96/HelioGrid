import { colors } from '../../primitives/Color/colors';
import { ShellGlyph } from '../AppShell/ShellGlyph';
import { Avatar } from '../Avatar';
import { IconCircle } from '../Card';
import { FactRow, FactRows } from '../FactRow';
import { NamedGap } from '../NamedGap';
import { StageTrack } from '../StageTrack';
import type { DedupeSheetProps } from './DedupeSheet.types';

type DedupeRecordProps = Pick<DedupeSheetProps, 'record' | 'ownerName' | 'stage' | 'words'>;

/**
 * The existing record and its three facts (`M02-08`): who it is when the person may open it, a
 * lock and nothing of it when they may not — and in both, owner, stage and last contact.
 */
export function DedupeRecord({ record, ownerName, stage, words }: DedupeRecordProps) {
  return (
    <div className="hg-dedupe-record">
      {record.kind === 'visible' ? (
        <div className="hg-dedupe-record-who">
          <Avatar name={record.name ?? undefined} size={40} />
          <span className="hg-dedupe-record-words">
            {record.name === null ? (
              <NamedGap gap={words.noName} />
            ) : (
              <span className="hg-dedupe-record-name">{record.name}</span>
            )}
            {record.city === null ? (
              <NamedGap gap={words.noCity} />
            ) : (
              <span className="hg-dedupe-record-line">{record.city}</span>
            )}
          </span>
        </div>
      ) : (
        <div className="hg-dedupe-record-who">
          <IconCircle color={colors['text-secondary']} size={40}>
            <ShellGlyph name="lock" size="md" tone="secondary" />
          </IconCircle>
          <span className="hg-dedupe-record-words">
            <span className="hg-dedupe-record-name">{words.outsideTitle}</span>
            <span className="hg-dedupe-record-line">{words.outsideLine}</span>
          </span>
        </div>
      )}
      <FactRows density="functional">
        <FactRow
          label={words.ownerLabel}
          mark={<ShellGlyph name="person" size="sm" tone="secondary" />}
          value={
            ownerName === null ? (
              words.noOwner
            ) : (
              <span className="hg-dedupe-fact">
                <Avatar name={ownerName} size={24} />
                <span>{ownerName}</span>
              </span>
            )
          }
        />
        <FactRow
          label={words.stageLabel}
          mark={<ShellGlyph name="flag" size="sm" tone="secondary" />}
          value={
            <span className="hg-dedupe-fact">
              <StageTrack stage={stage} words={words.stageTrack} />
              <span>{words.stage}</span>
            </span>
          }
        />
        <FactRow
          label={words.lastContactLabel}
          mark={<ShellGlyph name="clock" size="sm" tone="secondary" />}
          value={words.lastContact}
        />
      </FactRows>
    </div>
  );
}
