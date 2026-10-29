import type { CatalogImportWire } from '@heliogrid/contracts';
import { Text } from '../../primitives/Text/Text';
import { SearchField } from '../SearchField';
import { ShareFilter } from '../ShareFilter';
import type { ImportFormats } from './CatalogImport.logic';
import { fileOf, overviewOf } from './CatalogImport.steps';
import type { CatalogImportProps } from './CatalogImport.types';
import './ImportOverview.css';

interface ImportOverviewProps
  extends Pick<CatalogImportProps, 'words' | 'scope' | 'onScope' | 'query' | 'onQuery'> {
  job: CatalogImportWire;
  phase: 'preview' | 'report';
  wide: boolean;
  formats: ImportFormats;
}

/**
 * The overview card that opens steps 3 and 4: the row count and what is ready (or written), the
 * filters onto each part — three rings at 375, a stacked bar over three count buttons at 1536 —
 * and the search over the lists.
 */
export function ImportOverview(props: ImportOverviewProps) {
  const { job, phase, words, wide } = props;
  const overview = overviewOf(job, phase, words);
  const find = <ImportFind {...props} />;
  const filter = (
    <ShareFilter
      layout={wide ? 'bar' : 'rings'}
      label={overview.label}
      barLabel={overview.barLabel}
      items={overview.filters}
      pressed={props.scope}
      onPress={props.onScope}
    />
  );

  if (wide) {
    return (
      <div className="hg-import-overview" data-wide="true">
        <div className="hg-import-overview-top">
          <div className="hg-import-overview-words">
            <Text variant="h2" as="p">
              {overview.heading}
            </Text>
            <Text variant="caption" color="secondary">
              {overview.long}
            </Text>
          </div>
          <div className="hg-import-find" data-wide="true">
            {find}
          </div>
        </div>
        {filter}
      </div>
    );
  }

  const stamp = phase === 'report' ? fileOf(job, words, props.formats, null).stamp : null;
  return (
    <div className="hg-import-overview">
      {stamp === null ? (
        <div className="hg-import-overview-top">
          <Text variant="body-sm" bold className="hg-import-overview-heading">
            {overview.heading}
          </Text>
          <Text variant="caption" color="secondary" className="hg-import-overview-ready">
            {overview.short}
          </Text>
        </div>
      ) : (
        <div className="hg-import-overview-report">
          <div className="hg-import-overview-stamped">
            <Text variant="body-sm" bold className="hg-import-overview-heading">
              {overview.heading}
            </Text>
            <Text variant="caption" color="secondary" className="hg-import-stamp">
              {stamp}
            </Text>
          </div>
          <Text variant="caption" color="secondary">
            {overview.short}
          </Text>
        </div>
      )}
      {filter}
      <div className="hg-import-find">{find}</div>
    </div>
  );
}

/** *Find in this list*: a search over every list on screen, cleared by its own control. */
export function ImportFind({
  words,
  query,
  onQuery,
}: Pick<CatalogImportProps, 'words' | 'query' | 'onQuery'>) {
  return (
    <SearchField
      placeholder={words.find}
      ariaLabel={words.find}
      value={query}
      onChange={onQuery}
      onClear={query === '' ? undefined : () => onQuery('')}
      clearLabel={words.clearSearch}
      density="functional"
    />
  );
}
