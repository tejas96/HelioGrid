import { Text } from '../../primitives/Text/Text';
import type { ImportFormats } from './CatalogImport.logic';
import { fileOf } from './CatalogImport.steps';
import type { CatalogImportProps } from './CatalogImport.types';
import { ImportFind } from './ImportOverview';
import './ImportSkeleton.css';

const RINGS = ['first', 'second', 'third'] as const;
const FIRST_LIST = ['first', 'second'] as const;
const SECOND_LIST = ['first', 'second', 'third'] as const;

/**
 * A kept report reopening (m17-j): the overview's and the lists' own loading form, under a stamp
 * that is already true and a search that is already live. The blocks hold no words; the region
 * says what is happening.
 */
export function ImportSkeleton(
  props: CatalogImportProps & { wide: boolean; formats: ImportFormats },
) {
  const { job, words } = props;
  const stamp = job === null ? null : fileOf(job, words, props.formats, props.mapping).stamp;
  return (
    <div className="hg-import-step" data-step="rows">
      <div className="hg-import-overview" data-wide={props.wide ? 'true' : 'false'}>
        <div className="hg-import-overview-top">
          <span className="hg-import-block" data-shape="heading" />
          {stamp === null ? null : (
            <Text variant="caption" color="secondary" className="hg-import-stamp">
              {stamp}
            </Text>
          )}
        </div>
        <span className="hg-import-block" data-shape="line" />
        <div className="hg-import-skeleton-rings">
          {RINGS.map((ring) => (
            <span key={ring} className="hg-import-skeleton-ring">
              <span className="hg-import-skeleton-track" />
              <span className="hg-import-block" data-shape="label" />
            </span>
          ))}
        </div>
        <div className="hg-import-find">
          <ImportFind words={words} query={props.query} onQuery={props.onQuery} />
        </div>
      </div>
      <div className="hg-import-skeleton-lists" role="status" aria-label={words.opening}>
        <span className="hg-import-block" data-shape="head" />
        <SkeletonList rows={FIRST_LIST} />
        <span className="hg-import-block" data-shape="head-long" />
        <SkeletonList rows={SECOND_LIST} />
      </div>
    </div>
  );
}

function SkeletonList({ rows }: { rows: readonly string[] }) {
  return (
    <div className="hg-import-list">
      {rows.map((row) => (
        <div key={row} className="hg-import-skeleton-row">
          <span className="hg-import-block" data-shape="name" />
          <span className="hg-import-block" data-shape="sub" />
          <span className="hg-import-block" data-shape="reason" />
          <span className="hg-import-skeleton-foot">
            <span className="hg-import-block" data-shape="chip" />
            <span className="hg-import-block" data-shape="price" />
          </span>
        </div>
      ))}
    </div>
  );
}
