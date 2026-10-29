import { Text } from '../../primitives/Text/Text';
import { Button } from '../Button';
import { Card } from '../Card';
import { useLoadMore } from '../CatalogItems/use-load-more';
import { EmptyState } from '../EmptyState';
import { LoadingBars } from '../LoadingBars';
import { StatusChip } from '../StatusChip';
import { RateGroups } from './CatalogRates';
import type {
  CatalogVersionList,
  CatalogVersionProps,
  CatalogVersionRead,
} from './CatalogRates.types';
import { VersionEditor } from './CatalogVersionEditor';

/**
 * One price-book version on the web: the versions by year, a past version read-only, or the new one
 * being written. The sheet or side panel, its title and its foot are the app's.
 */
export function CatalogVersion(props: CatalogVersionProps) {
  if (props.mode === 'edit') return <VersionEditor {...props} />;
  if (props.read.kind === 'loading') {
    return <LoadingBars label={props.words.loading} bars={['row', 'row', 'row']} />;
  }
  if (props.read.kind === 'failed') {
    return (
      <EmptyState
        glow={false}
        title={props.words.loadFailed}
        action={
          <Button variant="secondary" size="lg" onClick={props.read.retry}>
            {props.words.tryAgain}
          </Button>
        }
      />
    );
  }
  return props.mode === 'list' ? <VersionList {...props} /> : <VersionRead {...props} />;
}

/** The versions under their year; the one in force says so in words, a past one shows its margin. */
function VersionList({ words, versions, onOpen, hasMore, onMore }: CatalogVersionList) {
  const foot = useLoadMore(hasMore, onMore);
  const years = [...new Set(versions.map((each) => each.year))];
  return (
    <div className="hg-cat-version">
      {years.map((year) => (
        <section key={year} className="hg-cat-version-year" aria-label={year}>
          <Text variant="overline" color="secondary">
            {year}
          </Text>
          {versions
            .filter((each) => each.year === year)
            .map((each) => (
              <Card key={each.id} density="functional" onClick={() => onOpen(each.id)}>
                <span className="hg-cat-version-tile">
                  <span
                    className="hg-cat-version-number"
                    data-live={each.inForce ? 'true' : undefined}
                  >
                    <Text
                      as="span"
                      variant="mono"
                      bold
                      color={each.inForce ? 'success' : 'primary'}
                    >
                      {each.tag}
                    </Text>
                  </span>
                  <span className="hg-cat-version-words">
                    <Text as="span" variant="body-sm" bold>
                      {each.note}
                    </Text>
                    <Text as="span" variant="caption" color="secondary">
                      {each.byline}
                    </Text>
                  </span>
                  {each.inForce ? (
                    <StatusChip
                      status="in-force"
                      label={words.inForce}
                      tone="success"
                      density="functional"
                    />
                  ) : (
                    <Text as="span" variant="caption" bold color="secondary">
                      {each.margin}
                    </Text>
                  )}
                </span>
              </Card>
            ))}
        </section>
      ))}
      <div className="hg-cat-version-more" ref={foot} />
    </div>
  );
}

/** A past version, read-only in words — never greyed: its margin and count as tiles, its note, its rates. */
function VersionRead({ words, margin, rateCount, note, rates }: CatalogVersionRead) {
  return (
    <div className="hg-cat-version">
      <div className="hg-cat-version-stats">
        <Stat value={margin} label={words.defaultMargin} />
        <Stat value={rateCount} label={words.rates} />
      </div>
      <Text variant="body-sm">{note}</Text>
      <RateGroups rates={rates} bases={words.bases} />
    </div>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <Card density="functional">
      <span className="hg-cat-version-stat">
        <Text as="span" variant="h3" bold className="hg-cat-version-figure">
          {value}
        </Text>
        <Text as="span" variant="caption" color="secondary">
          {label}
        </Text>
      </span>
    </Card>
  );
}
