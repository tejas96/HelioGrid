import { Pressable } from '../../primitives/Pressable';
import { Text } from '../../primitives/Text/Text';
import { ShellGlyph } from '../AppShell/ShellGlyph';
import { Button } from '../Button';
import { Card, IconCircle } from '../Card';
import { useMoreFocus } from '../CatalogItems/use-more-focus';
import { useRetryFocus } from '../CatalogItems/use-retry-focus';
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
  const focus = useMoreFocus<HTMLDivElement>(more !== null);
  const retry = useRetryFocus(props.surface);
  return (
    <div ref={retry.target} tabIndex={-1} className="hg-cat-release">
      <Input
        label={words.releaseName}
        value={label}
        onChange={onLabel}
        density="functional"
        error={problem ?? undefined}
      />
      {waitOrFail(props, retry.retrying(props.onRetry)) ??
        (changes === null ? null : (
          <div ref={focus.target} tabIndex={-1} className="hg-cat-release">
            <Changes changes={changes} words={words} grouped={false} />
          </div>
        ))}
      {more === null ? null : (
        <Button variant="ghost" size="sm" onClick={focus.pressing(more.onMore)}>
          {more.label}
        </Button>
      )}
    </div>
  );
}

function ContentsBody(props: CatalogContentsBody) {
  const { words, release, changes } = props;
  const retry = useRetryFocus(props.surface);
  const waiting = waitOrFail(props, retry.retrying(props.onRetry));
  if (waiting !== null) return waiting;
  return (
    <div ref={retry.target} tabIndex={-1} className="hg-cat-release">
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
    </div>
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
 * A body's read still out, or failed with *Try again*; `null` once it is in. `onRetry` moves the
 * reader's focus to the body that comes back.
 */
function waitOrFail(props: CatalogPublishBody | CatalogContentsBody, onRetry: () => void) {
  const { words } = props;
  if (props.surface === 'loading') {
    return <LoadingBars label={words.loading} bars={['panel', 'row', 'row']} />;
  }
  if (props.surface === 'error') {
    return (
      <EmptyState
        glow={false}
        title={words.loadFailed}
        action={
          <Button variant="secondary" size="lg" onClick={onRetry}>
            {words.tryAgain}
          </Button>
        }
      />
    );
  }
  return null;
}
