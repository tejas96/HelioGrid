import { Text } from '../../primitives/Text/Text';
import { HeroPanel } from '../HeroPanel';
import { LeadSourceMark } from '../LeadSourceMark';
import { OptionCardGroup } from '../OptionCardGroup';
import { ShareFilter } from '../ShareFilter';
import { duplicateChoiceOf, partsFilterOf } from './LeadImport.props';
import type { LeadImportProps } from './LeadImport.types';

/**
 * The preview's one hero (`M02-19`, `M02-20`): before anything runs, the rows and the duplicates by
 * phone in the file's own count, the parts each a filter onto the rows below, and the one choice
 * every duplicate follows — *Skip* by default, or *Log as enquiry*; never *Keep both*. The choice
 * waits while the run is out, and once run is the job's own.
 */
export function LeadImportPreview(props: LeadImportProps & { wide: boolean }) {
  const { figures, words, wide } = props;
  if (figures === null) return null;
  const filter = partsFilterOf(props, wide ? 'bar' : 'rings');
  return (
    <HeroPanel label={words.beforeRuns}>
      <div className="hg-lead-import-preview" data-wide={wide ? 'true' : 'false'}>
        <div className="hg-lead-import-counts">
          <Text variant="display" as="p" className="hg-lead-import-figure">
            {words.counts(figures.rows, figures.duplicates)}
          </Text>
          {figures.rejected === 0 ? null : (
            <Text variant="body-sm" color="secondary">
              {words.rejectedCount(figures.rejected)}
            </Text>
          )}
          {filter === null ? null : <ShareFilter {...filter} />}
        </div>
        {figures.duplicates === 0 ? null : (
          <div className="hg-lead-import-choice">
            <Text variant="overline" as="p" color="secondary">
              {words.choiceHeading(figures.duplicates)}
            </Text>
            <OptionCardGroup {...duplicateChoiceOf(props, figures.duplicates)} />
          </div>
        )}
      </div>
      <p className="hg-lead-import-land">
        <LeadSourceMark source="import" label={words.sourceImport} />
        <span>{words.landInInbox}</span>
      </p>
    </HeroPanel>
  );
}
