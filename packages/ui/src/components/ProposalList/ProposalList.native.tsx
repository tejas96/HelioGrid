import type { ProposalEntryDesign, ProposalEntryProposal } from '@heliogrid/contracts';
import { theme } from '@heliogrid/theme';
import { Fragment } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { colors } from '../../primitives/Color/colors';
import { GroundProvider, tileSurface } from '../../primitives/Ground/Ground.native';
import { Pressable } from '../../primitives/Pressable/Pressable.native';
import { Rising } from '../../primitives/rising.native';
import { Text } from '../../primitives/Text/Text.native';
import { ShellGlyph } from '../AppShell/ShellGlyph.native';
import { Button } from '../Button/Button.native';
import { Badge, Chip } from '../Chip/Chip.native';
import { DesignCover } from '../DesignCover/DesignCover.native';
import { DesignStatus } from '../DesignStatus/DesignStatus.native';
import { EmptyState } from '../EmptyState/EmptyState.native';
import { FailedRead } from '../EmptyState/FailedRead.native';
import { IconButton } from '../IconButton/IconButton.native';
import { LoadingBars } from '../LoadingBars/LoadingBars.native';
import { failedReadOf } from '../ProposalAfterParts/ProposalAfterParts.logic';
import { ProposalStatus } from '../ProposalStatus/ProposalStatus.native';
import { StatusMark } from '../StatusMark/StatusMark.native';
import { emptyWordsOf, filterChips, isQuietStanding, THREE_D_GLYPH } from './ProposalList.logic';
import type { ProposalListProps } from './ProposalList.types';

// web-only part: DataTable — the table is the web wide room; the phone draws the narrow cards.
// web-only part: ProposalBlocks — the web takes only riseOrder for its CSS stagger; the phone uses Rising.

/** A design with no proposal yet: its cover with the 3D mark, then its facts. */
function DesignCard({ row, words, onOpen }: ProposalListProps & { row: ProposalEntryDesign }) {
  return (
    <View style={[styles.card, tileSurface]}>
      <GroundProvider ground="tile">
        <Pressable
          accessibilityLabel={words.design.open(row)}
          onPress={() => onOpen(row)}
          style={styles.open}
        >
          <View style={styles.face}>
            <View style={styles.cover}>
              <DesignCover
                word={words.design.preview}
                mark={
                  <Badge tone="ocean" glyph={THREE_D_GLYPH}>
                    {words.filter('3d')}
                  </Badge>
                }
              />
            </View>
            <View style={styles.top}>
              <Text variant="body-lg" bold style={styles.name}>
                {words.customer(row)}
              </Text>
              <DesignStatus
                status={row.status}
                label={words.design.status(row.status)}
                density="functional"
              />
            </View>
            <Text variant="body-sm" color="secondary">
              {words.design.noPanels}
            </Text>
            <Text variant="body-sm">{words.design.latest(row)}</Text>
          </View>
        </Pressable>
      </GroundProvider>
    </View>
  );
}

function Card({ row, ...props }: ProposalListProps & { row: ProposalEntryProposal }) {
  const { words, onCopy } = props;
  const quiet = isQuietStanding(row.standing);
  const price = words.price(row);
  return (
    <View style={[styles.card, quiet ? styles.quiet : tileSurface]}>
      <View style={styles.cardRow}>
        <Pressable
          accessibilityLabel={words.open(row)}
          onPress={() => props.onOpen(row)}
          style={styles.open}
        >
          <View style={styles.face}>
            <View style={styles.top}>
              <Text
                variant="body-lg"
                bold
                color={quiet ? 'secondary' : 'primary'}
                style={styles.name}
              >
                {words.customer(row)}
              </Text>
              <ProposalStatus
                standing={row.standing}
                label={words.standing(row.standing)}
                density="functional"
              />
            </View>
            {/* The number and the price are figures, in the mono face; the size is words, as the web
              half sets it. */}
            <Text variant="body-sm" color="secondary">
              <Text variant="mono" color="secondary">
                {words.number(row)}
              </Text>
              {` · ${words.system(row)}`}
              {price === null ? null : (
                <>
                  {' · '}
                  <Text variant="mono" color="secondary">
                    {price}
                  </Text>
                </>
              )}
            </Text>
            <Text variant="body-sm" color={quiet ? 'secondary' : 'primary'}>
              {words.latest(row)}
            </Text>
            {row.stale ? (
              <View style={styles.stale}>
                <StatusMark tone="warning" label={words.stale} />
              </View>
            ) : null}
          </View>
        </Pressable>
        {onCopy === undefined ? null : (
          <View style={styles.copy}>
            {/* A tile's control takes the tile's fill, so the copy act's disc shows on the card. */}
            <GroundProvider ground={quiet ? 'page' : 'tile'}>
              <IconButton
                label={words.copyNamed(row)}
                variant="surface"
                onClick={() => onCopy(row)}
              >
                <ShellGlyph name="layers" size="sm" tone="primary" />
              </IconButton>
            </GroundProvider>
          </View>
        )}
      </View>
      {row.stale && props.onNewVersion !== undefined ? (
        <View style={styles.act}>
          <GroundProvider ground={quiet ? 'page' : 'tile'}>
            <Button
              variant="secondary"
              size="sm"
              spokenName={words.newVersionNamed(row)}
              icon={<ShellGlyph name="pencil" size="sm" tone="primary" />}
              onClick={() => props.onNewVersion?.(row)}
            >
              {words.newVersion}
            </Button>
          </GroundProvider>
        </View>
      ) : null}
    </View>
  );
}

function Body(props: ProposalListProps) {
  const { read, words } = props;
  if (read.kind === 'loading') {
    return <LoadingBars bars={['row', 'row', 'row', 'row', 'row']} label={words.loading} />;
  }
  if (read.kind === 'failed') {
    return <FailedRead {...failedReadOf(words, read.retry, props.focusAfter)} />;
  }
  const rows = read.value.rows.items;
  if (rows.length === 0) return <EmptyState scene="filter" {...emptyWordsOf(props)} />;
  return (
    <View style={styles.cards}>
      {rows.map((row, index) => (
        <Rising key={`${row.kind}:${row.id}`} order={index}>
          {row.kind === 'design' ? (
            <DesignCard {...props} row={row} />
          ) : (
            <Card {...props} row={row} />
          )}
        </Rising>
      ))}
      {props.onMore === undefined ? null : (
        <View style={styles.more}>
          <Button variant="secondary" size="md" loading={props.loadingMore} onClick={props.onMore}>
            {words.more}
          </Button>
        </View>
      )}
    </View>
  );
}

/** The Proposals page's list, on the phone (`SCR-M06-19`, `T-M05-001b`): chips, then one card per row. */
export function ProposalList(props: ProposalListProps) {
  const { read, words, filter } = props;
  const counts = read.kind === 'ready' ? read.value.counts : null;
  return (
    <View style={styles.list}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filters}
        accessibilityLabel={words.filterLabel}
      >
        {filterChips(counts).map((chip) => (
          <Fragment key={chip.filter}>
            <Chip
              active={chip.filter === filter}
              count={chip.count}
              {...(chip.glyph === undefined ? {} : { glyph: chip.glyph })}
              onClick={() => props.onFilter(chip.filter)}
            >
              {words.filter(chip.filter)}
            </Chip>
            {/* After the 3D chip: it filters by kind, the chips after it by where a proposal stands. */}
            {chip.ruleAfter ? <View style={styles.rule} /> : null}
          </Fragment>
        ))}
      </ScrollView>
      <Body {...props} />
    </View>
  );
}

const styles = StyleSheet.create({
  list: { gap: theme.spacing['sp-4'] },
  /* The press target fills the card's room: `Pressable` centres its content, which drew each
     card's face at its own width, so the faces of two cards started at different edges. */
  open: { flex: 1, minWidth: 0, alignItems: 'stretch', justifyContent: 'flex-start' },
  /* The name keeps its whole width and wraps to its own line before it is cut; the status then
     wraps under it. */
  name: { flexGrow: 1, flexShrink: 1 },
  filters: {
    alignItems: 'center',
    gap: theme.spacing['sp-2'],
    paddingEnd: theme.spacing['sp-4'],
  },
  rule: {
    alignSelf: 'center',
    width: 1,
    height: theme.spacing['sp-5'],
    marginHorizontal: theme.spacing['sp-1'],
    backgroundColor: colors['line-strong'],
  },
  /* The cover takes the card's width, then the facts sit under it. */
  cover: { alignSelf: 'stretch', marginBottom: theme.spacing['sp-2'] },
  cards: { gap: theme.spacing['sp-3'] },
  card: {
    gap: theme.spacing['sp-3'],
    padding: theme.spacing['sp-4'],
    borderRadius: theme.radius['r-lg'],
  },
  cardRow: { flexDirection: 'row', alignItems: 'flex-start', gap: theme.spacing['sp-2'] },
  stale: { flexDirection: 'row' },
  act: { flexDirection: 'row' },
  quiet: { borderWidth: 1, borderColor: colors['line-soft'] },
  face: { flex: 1, minWidth: 0, gap: theme.spacing['sp-1'] },
  top: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: theme.spacing['sp-2'],
  },
  copy: { flexShrink: 0 },
  more: { alignSelf: 'center' },
});
