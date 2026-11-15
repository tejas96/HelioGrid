import { MessageSheet } from '../MessageSheet';
import { AfterRow, AfterRows } from '../ProposalAfterParts';
import type { ProjectProposalSectionProps } from './ProjectProposalSection.types';

export function ProjectProposalSection<Missing>({
  rows,
  words,
  sheetWords,
  onScheduleDay,
}: ProjectProposalSectionProps<Missing>) {
  if (rows.version === undefined && !rows.crewDue) return null;
  const version =
    rows.version === undefined ? undefined : words.versionRow(rows.version, rows.newerVersion);
  const crew = rows.crewDue ? words.crewRow(rows.crewMissing) : null;
  return (
    <>
      <AfterRows>
        {version === undefined ? null : version.accepted ? (
          <AfterRow
            glyph="layers"
            title={version.title}
            line={version.line}
            onOpen={rows.openVersions}
          />
        ) : (
          <AfterRow glyph="file-text" hue="neutral" title={version.title} line={version.line} />
        )}
        {crew === null ? null : (
          <AfterRow
            glyph={crew.ready ? 'send' : 'calendar'}
            hue="warning"
            title={crew.title}
            line={crew.line}
            onOpen={crew.ready ? rows.crew.openSheet : onScheduleDay}
          />
        )}
      </AfterRows>
      <MessageSheet
        open={rows.crew.open}
        onClose={rows.crew.close}
        words={sheetWords}
        message={rows.crew.message}
        pending={null}
        failure={null}
        onShare={rows.crew.share}
        onCopy={rows.crew.copy}
      />
    </>
  );
}
