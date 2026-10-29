import { theme } from '@heliogrid/theme';
import { type RefObject, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { GroundProvider, tileSurface, useGround } from '../../primitives/Ground/Ground.native';
import { Pressable } from '../../primitives/Pressable/Pressable.native';
import { Text } from '../../primitives/Text/Text.native';
import { RetryButton } from '../Button/RetryButton.native';
import { ShowMore } from '../CatalogItems/ShowMore.native';
import { EmptyState } from '../EmptyState/EmptyState.native';
import { LoadingBars } from '../LoadingBars/LoadingBars.native';
import { StatusChip } from '../StatusChip/StatusChip.native';
import { RateGroups } from './CatalogRates.native';
import type {
  CatalogVersionList,
  CatalogVersionProps,
  CatalogVersionRead,
  CatalogVersionSummary,
} from './CatalogRates.types';
import { VersionEdit } from './CatalogVersionEditor.native';

/**
 * One price-book version on the phone — the versions list, one version read-only, or the new one
 * being written. The app's sheet holds it and draws its head (with *Read-only*) and its foot.
 */
export function CatalogVersion(props: CatalogVersionProps) {
  /* The frame stays while a retried read loads and when the last page lands, so *Try again* and
   *Show more* hand the reader to it once they have gone. */
  const frame = useRef<View>(null);
  if (props.mode === 'edit') return <VersionEdit {...props} />;
  return (
    <View ref={frame}>
      {props.mode === 'list' ? (
        <VersionList {...props} frame={frame} />
      ) : (
        <VersionRead {...props} frame={frame} />
      )}
    </View>
  );
}

/** The read surfaces' wait and failure, shared by the list and one version. */
function Unready({
  read,
  words,
  frame,
}: Pick<CatalogVersionRead, 'read' | 'words'> & { frame: RefObject<View | null> }) {
  if (read.kind === 'loading')
    return <LoadingBars label={words.loading} bars={['row', 'row', 'row']} />;
  if (read.kind !== 'failed') return null;
  return (
    <EmptyState
      glow={false}
      title={words.loadFailed}
      action={
        <RetryButton size="sm" onRetry={read.retry} label={words.tryAgain} focusAfter={frame} />
      }
    />
  );
}

function VersionList(props: CatalogVersionList & { frame: RefObject<View | null> }) {
  const { words, versions, read, onOpen, frame } = props;
  if (read.kind === 'loading' || read.kind === 'failed')
    return <Unready read={read} words={words} frame={frame} />;
  const years = [...new Set(versions.map((version) => version.year))];
  return (
    <View style={styles.body}>
      {years.map((year) => (
        <View key={year} style={styles.year}>
          <Text variant="overline" color="secondary">
            {year}
          </Text>
          {versions
            .filter((version) => version.year === year)
            .map((version) => (
              <VersionTile key={version.id} version={version} words={words} onOpen={onOpen} />
            ))}
        </View>
      ))}
      {props.hasMore ? (
        <ShowMore label={words.moreVersions} onMore={props.onMore} focusAfter={frame} />
      ) : null}
    </View>
  );
}

/** A version's tile: its number, its note and byline; in force says so, a past one its margin. */
function VersionTile({
  version,
  words,
  onOpen,
}: { version: CatalogVersionSummary } & Pick<CatalogVersionList, 'words' | 'onOpen'>) {
  /* The disc takes the ground the list lies on — the tile's opposite, read here, outside the
     tile's own provider. */
  const fill = { backgroundColor: useGround().ground };
  return (
    <Pressable
      onPress={() => onOpen(version.id)}
      style={[version.inForce ? styles.live : tileSurface, styles.tile]}
    >
      <GroundProvider ground="tile">
        <View style={[styles.disc, fill]}>
          <Text variant="caption" bold color={version.inForce ? 'success' : 'primary'}>
            {version.tag}
          </Text>
        </View>
        <View style={styles.grow}>
          <Text variant="body-sm" bold>
            {version.note}
          </Text>
          <Text variant="caption" color="secondary">
            {version.byline}
          </Text>
        </View>
        {version.inForce ? (
          <StatusChip status="in-force" label={words.inForce} tone="success" density="functional" />
        ) : (
          <Text variant="caption" bold color="secondary">
            {version.margin}
          </Text>
        )}
      </GroundProvider>
    </Pressable>
  );
}

function VersionRead(props: CatalogVersionRead & { frame: RefObject<View | null> }) {
  const { words, read, frame } = props;
  if (read.kind === 'loading' || read.kind === 'failed')
    return <Unready read={read} words={words} frame={frame} />;
  return (
    <View style={[styles.body, styles.readBody]}>
      <View style={styles.stats}>
        {(
          [
            [props.margin, words.defaultMargin],
            [props.rateCount, words.rates],
          ] as const
        ).map(([figure, word]) => (
          <View key={word} style={[tileSurface, styles.stat]}>
            <Text variant="h3">{figure}</Text>
            <Text variant="caption" color="secondary">
              {word}
            </Text>
          </View>
        ))}
      </View>
      <Text variant="body-sm">{props.note}</Text>
      <RateGroups rates={props.rates} bases={words.bases} />
    </View>
  );
}

const DISC = 36;

const styles = StyleSheet.create({
  body: { gap: theme.spacing['sp-4'] },
  grow: { flex: 1, minWidth: 0 },
  year: { gap: theme.spacing['sp-2'] },
  tile: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: theme.spacing['sp-3'],
    paddingVertical: theme.layout['tile-gap'],
    paddingHorizontal: theme.spacing['sp-3'],
    borderRadius: theme.radius['r-md'],
  },
  live: { backgroundColor: theme.colors['success-bg'] },
  disc: {
    width: DISC,
    height: DISC,
    borderRadius: theme.radius['r-pill'],
    alignItems: 'center',
    justifyContent: 'center',
  },
  stats: { flexDirection: 'row', gap: theme.spacing['sp-2'] },
  /* The sheet's head ends on *Read-only*; the tiles keep a step clear of it. */
  readBody: { paddingTop: theme.spacing['sp-3'] },
  stat: {
    flex: 1,
    gap: theme.spacing['sp-0-5'],
    paddingVertical: theme.spacing['sp-3'],
    paddingHorizontal: theme.spacing['sp-3'],
    borderRadius: theme.radius['r-tile'],
  },
});
