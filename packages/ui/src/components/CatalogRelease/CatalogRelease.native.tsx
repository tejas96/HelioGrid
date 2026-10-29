import { RELEASE_CHANGE_KINDS } from '@heliogrid/domain';
import { theme } from '@heliogrid/theme';
import { StyleSheet, View } from 'react-native';
import { GroundProvider, tileSurface } from '../../primitives/Ground/Ground.native';
import { Pressable } from '../../primitives/Pressable/Pressable.native';
import { Text } from '../../primitives/Text/Text.native';
import { ShellGlyph } from '../AppShell/ShellGlyph.native';
import { Button } from '../Button/Button.native';
import { IconCircle } from '../Card/Card.native';
import { EmptyState } from '../EmptyState/EmptyState.native';
import { Input } from '../Input/Input.native';
import { LoadingBars } from '../LoadingBars/LoadingBars.native';
import { useFormat } from '../MarketProvider/market-context';
import { StatusChip } from '../StatusChip/StatusChip.native';
import { RELEASE_CHANGE_INK } from './CatalogRelease.logic';
import type {
  CatalogContentsBody,
  CatalogPublishBody,
  CatalogReleaseChanges,
  CatalogReleaseItem,
  CatalogReleaseProps,
  CatalogReleaseWords,
} from './CatalogRelease.types';

type ChangeKind = CatalogReleaseItem['kind'];

const KINDS: readonly ChangeKind[] = RELEASE_CHANGE_KINDS;

/**
 * A catalog release's body on the phone: the publish summary (a name and what it will carry) or a
 * published release's before-and-after with the earlier releases under it. The app's sheet holds
 * it, draws its head and its foot.
 */
export function CatalogRelease(props: CatalogReleaseProps) {
  return props.mode === 'publish' ? <Publish {...props} /> : <Contents {...props} />;
}

function Publish(props: CatalogPublishBody) {
  const { words, label, onLabel, problem, changes, more } = props;
  return (
    <View style={styles.body}>
      <Input
        label={words.releaseName}
        value={label}
        onChange={onLabel}
        density="functional"
        {...(problem === null ? {} : { error: problem })}
      />
      {waitOrFail(props) ??
        (changes === null ? null : (
          <>
            <CountTiles changes={changes} />
            <View style={styles.cards}>
              {changes.items.map((item) => (
                <ChangeCard key={item.id} item={item} words={words} />
              ))}
            </View>
          </>
        ))}
      {more === null ? null : (
        <Button variant="ghost" size="sm" onClick={more.onMore}>
          {more.label}
        </Button>
      )}
    </View>
  );
}

function Contents(props: CatalogContentsBody) {
  const { words, release, changes } = props;
  const format = useFormat();
  const waiting = waitOrFail(props);
  if (waiting !== null) return waiting;
  return (
    <View style={styles.body}>
      {release === null ? null : (
        <View style={[release.inForce ? styles.inForce : tileSurface, styles.releaseCard]}>
          <GroundProvider ground="tile">
            <View style={styles.releaseHead}>
              <IconCircle size={40} color={theme.colors.success}>
                <ShellGlyph name="package" size="md" tone="secondary" />
              </IconCircle>
              <View style={styles.grow}>
                <Text variant="mono" bold>
                  {release.tag}
                </Text>
                <Text variant="caption" color="secondary">
                  {release.when}
                </Text>
              </View>
              {release.inForce ? (
                <StatusChip
                  status="in-force"
                  label={words.inForce}
                  tone="success"
                  density="functional"
                />
              ) : null}
            </View>
            {changes === null ? null : <CountTiles changes={changes} />}
          </GroundProvider>
        </View>
      )}
      {changes === null
        ? null
        : KINDS.map((kind) => {
            const items = changes.items.filter((item) => item.kind === kind);
            const word = changes.counts.find((count) => count.kind === kind)?.word;
            if (items.length === 0 || word === undefined) return null;
            return (
              <View key={kind} style={styles.group}>
                <View style={styles.groupHead}>
                  <Text variant="overline" color="secondary">
                    {word}
                  </Text>
                  <Text variant="caption" color="secondary">
                    {format.number(items.length)}
                  </Text>
                </View>
                {items.map((item) => (
                  <ChangeCard key={item.id} item={item} words={words} />
                ))}
              </View>
            );
          })}
      {props.earlier.length === 0 ? null : (
        <View>
          <Text variant="overline" color="secondary" style={styles.earlierHead}>
            {words.earlier}
          </Text>
          {props.earlier.map((each) => (
            <Pressable
              key={each.id}
              onPress={() => props.onOpenEarlier(each.id)}
              style={styles.earlierRow}
            >
              <View style={styles.grow}>
                <Text variant="mono" bold>
                  {each.tag}
                </Text>
                <Text variant="caption" color="secondary">
                  {each.when}
                </Text>
              </View>
              <ShellGlyph name="chevron-right" size="md" tone="secondary" />
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}

/** One tile per kind that moved — never a zero tile. */
function CountTiles({ changes }: { changes: CatalogReleaseChanges }) {
  const format = useFormat();
  const shown = changes.counts.filter((count) => count.count > 0);
  if (shown.length === 0) return null;
  return (
    <View style={styles.tiles}>
      {shown.map((count) => (
        <View key={count.kind} style={[tileSurface, styles.tile]}>
          <Text variant="h3" color={RELEASE_CHANGE_INK[count.kind]}>
            {format.number(count.count)}
          </Text>
          <Text variant="caption" color="secondary">
            {count.word}
          </Text>
        </View>
      ))}
    </View>
  );
}

/** One item's moves: each field, *New* or its struck old value, then what it is now. */
function ChangeCard({ item, words }: { item: CatalogReleaseItem; words: CatalogReleaseWords }) {
  return (
    <View style={[tileSurface, styles.card]}>
      <Text variant="body-sm" bold>
        {item.name}
      </Text>
      {item.fields.map((field) => (
        <View key={field.field} style={styles.move}>
          <Text variant="caption" color="secondary" style={styles.field}>
            {field.field}
          </Text>
          {field.from === null ? (
            <Text variant="caption" color="success" bold>
              {words.newValue}
            </Text>
          ) : (
            <Text
              variant={field.figure ? 'mono' : 'caption'}
              color="tertiary"
              style={styles.struck}
            >
              {field.from}
            </Text>
          )}
          <ShellGlyph name="chevron-right" size="sm" tone="secondary" />
          <Text variant={field.figure ? 'mono' : 'body-sm'} bold>
            {field.to}
          </Text>
        </View>
      ))}
    </View>
  );
}

/* The board's field column: wide enough for *Tax rate* beside its move. */
const FIELD_W = 84;

const styles = StyleSheet.create({
  body: { gap: theme.spacing['sp-4'] },
  cards: { gap: theme.layout['tile-gap'] },
  grow: { flex: 1, minWidth: 0 },
  inForce: { backgroundColor: theme.colors['success-bg'] },
  releaseCard: {
    gap: theme.spacing['sp-3'],
    padding: theme.spacing['sp-4'],
    borderRadius: theme.radius['r-tile'],
  },
  releaseHead: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing['sp-3'] },
  tiles: { flexDirection: 'row', gap: theme.spacing['sp-2'] },
  tile: {
    flex: 1,
    gap: theme.spacing['sp-0-5'],
    paddingVertical: theme.spacing['sp-3'],
    paddingHorizontal: theme.spacing['sp-3'],
    borderRadius: theme.radius['r-tile'],
  },
  card: {
    gap: theme.layout['tile-gap'],
    padding: theme.spacing['sp-3'],
    borderRadius: theme.radius['r-tile'],
  },
  move: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: theme.spacing['sp-2'],
  },
  field: { width: FIELD_W },
  struck: { textDecorationLine: 'line-through' },
  group: { gap: theme.spacing['sp-2'] },
  groupHead: { flexDirection: 'row', alignItems: 'baseline', gap: theme.spacing['sp-2'] },
  earlierHead: { marginBottom: theme.spacing['sp-2'] },
  earlierRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: theme.spacing['sp-3'],
    minHeight: theme.spacing['sp-12'],
    borderTopWidth: 1,
    borderTopColor: theme.colors['line-soft'],
  },
});

/** A body's read still out, or failed with *Try again*; `null` once it is in. */
function waitOrFail(props: CatalogPublishBody | CatalogContentsBody) {
  const { words, read } = props;
  if (read.kind === 'loading') {
    return <LoadingBars label={words.loading} bars={['panel', 'row']} />;
  }
  if (read.kind === 'failed') {
    return (
      <EmptyState
        glow={false}
        title={words.loadFailed}
        action={
          <Button variant="secondary" size="sm" onClick={read.retry}>
            {words.tryAgain}
          </Button>
        }
      />
    );
  }
  return null;
}
