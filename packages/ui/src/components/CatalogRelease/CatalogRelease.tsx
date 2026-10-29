import { useRef } from 'react';
import type { FocusAfter } from '../../primitives/FocusAfter';
import { Pressable } from '../../primitives/Pressable';
import { Text } from '../../primitives/Text/Text';
import { ShellGlyph } from '../AppShell/ShellGlyph';
import { RetryButton } from '../Button/RetryButton';
import { Card, IconCircle } from '../Card';
import { ShowMore } from '../CatalogItems/ShowMore';
import { EmptyState } from '../EmptyState';
import { Input } from '../Input';
import { LoadingBars } from '../LoadingBars';
import { StatusChip } from '../StatusChip';
import { RELEASE_CHANGE_INK, releaseGroups } from './CatalogRelease.logic';
import type {
  CatalogContentsBody,
  CatalogPublishBody,
  CatalogReleaseChanges,
  CatalogReleaseItem,
  CatalogReleaseProps,
  CatalogReleaseWords,
} from './CatalogRelease.types';
import './CatalogRelease.css';

/**
 * A catalog release's body on the web: the publish summary — a name and what it will carry — or a
 * published release's before-and-after with the earlier releases under it. The sheet, the modal
 * and their foot are the app's.
 */
export function CatalogRelease(props: CatalogReleaseProps) {
  return props.mode === 'publish' ? <PublishBody {...props} /> : <ContentsBody {...props} />;
}

function PublishBody(props: CatalogPublishBody) {
  const { words, label, onLabel, problem, changes, more } = props;
  /* After *Try again* focus lands on the body, which stays while it reloads; after *Show more*, on
     the changes it grew. */
  const body = useRef<HTMLDivElement>(null);
  const grown = useRef<HTMLDivElement>(null);
  return (
    <div ref={body} tabIndex={-1} className="hg-cat-release hg-focus-target">
      <Input
        label={words.releaseName}
        value={label}
        onChange={onLabel}
        density="functional"
        error={problem ?? undefined}
      />
      {waitOrFail(props, body) ??
        (changes === null ? null : (
          <div ref={grown} tabIndex={-1} className="hg-cat-release hg-focus-target">
            <Changes changes={changes} words={words} grouped={false} />
          </div>
        ))}
      {more === null ? null : (
        <ShowMore label={more.label} onMore={more.onMore} focusAfter={grown} />
      )}
    </div>
  );
}

function ContentsBody(props: CatalogContentsBody) {
  /* *Try again* leaves with the failure: focus goes to the body, which stays while it reloads. */
  const body = useRef<HTMLDivElement>(null);
  return (
    <div ref={body} tabIndex={-1} className="hg-cat-release hg-focus-target">
      {waitOrFail(props, body) ?? <Contents {...props} />}
    </div>
  );
}

function Contents(props: CatalogContentsBody) {
  const { words, release, changes } = props;
  return (
    <>
      {release === null ? null : (
        <Card density="functional">
          <div className="hg-cat-release-head">
            <IconCircle size={40} color="var(--success)">
              <ShellGlyph name="package" size="md" />
            </IconCircle>
            <span className="hg-cat-release-head-words">
              <Text as="span" variant="mono" bold>
                {release.tag}
              </Text>
              <Text as="span" variant="caption" color="secondary">
                {release.when}
              </Text>
            </span>
            {release.inForce ? (
              <StatusChip
                status="in-force"
                label={words.inForce}
                tone="success"
                density="functional"
              />
            ) : null}
          </div>
        </Card>
      )}
      {changes === null ? null : <Changes changes={changes} words={words} grouped />}
      {props.earlier.length === 0 ? null : (
        <section className="hg-cat-release-earlier">
          <Text variant="overline" color="secondary">
            {words.earlier}
          </Text>
          <ul className="hg-cat-release-earlier-list">
            {props.earlier.map((each) => (
              <li key={each.id}>
                <Pressable
                  className="hg-cat-release-earlier-row"
                  onPress={() => props.onOpenEarlier(each.id)}
                >
                  <span className="hg-cat-release-head-words">
                    <Text as="span" variant="mono" bold>
                      {each.tag}
                    </Text>
                    <Text as="span" variant="caption" color="secondary">
                      {each.when}
                    </Text>
                  </span>
                  <ShellGlyph name="chevron-right" size="md" />
                </Pressable>
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}

/**
 * The counts as tiles — a kind with nothing in it draws no tile — then each item's fields as a
 * before-and-after: a field given for the first time reads *New*, never a struck nothing.
 */
function Changes({
  changes,
  words,
  grouped,
}: {
  changes: CatalogReleaseChanges;
  words: CatalogReleaseWords;
  grouped: boolean;
}) {
  const tiles = changes.counts.filter((each) => each.count > 0);
  return (
    <>
      {tiles.length === 0 ? null : (
        <div className="hg-cat-release-counts">
          {tiles.map((each) => (
            <Card key={each.kind} density="functional">
              <span className="hg-cat-release-count">
                <Text as="span" variant="h3" bold color={RELEASE_CHANGE_INK[each.kind]}>
                  {String(each.count)}
                </Text>
                <Text as="span" variant="caption" color="secondary">
                  {each.word}
                </Text>
              </span>
            </Card>
          ))}
        </div>
      )}
      {grouped ? (
        releaseGroups(changes).map((group) => (
          <section key={group.kind} className="hg-cat-release-group">
            <Text variant="overline" color="secondary">
              {`${group.word} ${group.items.length}`}
            </Text>
            {group.items.map((item) => (
              <ChangeCard key={item.id} item={item} words={words} />
            ))}
          </section>
        ))
      ) : (
        <div className="hg-cat-release-group">
          {changes.items.map((item) => (
            <ChangeCard key={item.id} item={item} words={words} />
          ))}
        </div>
      )}
    </>
  );
}

function ChangeCard({ item, words }: { item: CatalogReleaseItem; words: CatalogReleaseWords }) {
  return (
    <Card density="functional">
      <div className="hg-cat-release-item">
        <Text variant="body-sm" bold>
          {item.name}
        </Text>
        {item.fields.map((field) => (
          <div key={field.field} className="hg-cat-release-field">
            <span className="hg-cat-release-field-name">
              <Text as="span" variant="caption" color="secondary">
                {field.field}
              </Text>
            </span>
            {field.from === null ? (
              <Text as="span" variant="caption" color="success" bold>
                {words.newValue}
              </Text>
            ) : (
              <s className="hg-cat-release-from" data-figure={field.figure ? 'true' : undefined}>
                {field.from}
              </s>
            )}
            <ShellGlyph name="chevron-right" size="sm" />
            <Text as="span" variant={field.figure ? 'mono' : 'body-sm'} bold>
              {field.to}
            </Text>
          </div>
        ))}
      </div>
    </Card>
  );
}

/**
 * A body's read still out, or failed with *Try again*; `null` once it is in. *Try again* leaves
 * with the failure, and focus goes to `body`, which stays.
 */
function waitOrFail(props: CatalogPublishBody | CatalogContentsBody, body: FocusAfter) {
  const { words, read } = props;
  if (read.kind === 'loading') {
    return <LoadingBars label={words.loading} bars={['panel', 'row', 'row']} />;
  }
  if (read.kind === 'failed') {
    return (
      <EmptyState
        glow={false}
        title={words.loadFailed}
        action={
          <RetryButton size="lg" onRetry={read.retry} label={words.tryAgain} focusAfter={body} />
        }
      />
    );
  }
  return null;
}
