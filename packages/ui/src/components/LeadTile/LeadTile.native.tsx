import { theme } from '@heliogrid/theme';
import { StyleSheet, View } from 'react-native';
import { colors } from '../../primitives/Color/colors';
import { GroundProvider, tileSurface } from '../../primitives/Ground/Ground.native';
import { Pressable } from '../../primitives/Pressable/Pressable.native';
import { Text } from '../../primitives/Text/Text.native';
import { ShellGlyph } from '../AppShell/ShellGlyph.native';
import { Avatar } from '../Avatar/Avatar.native';
import { CardRow, useCardRowAsideRoom } from '../CardRows/CardRows.native';
import { Checkbox } from '../Checkbox/Checkbox.native';
import { IconButton } from '../IconButton/IconButton.native';
import { LeadAge } from '../LeadAge/LeadAge.native';
import { LeadSourceMark } from '../LeadSourceMark/LeadSourceMark.native';
import { NamedGap } from '../NamedGap/NamedGap.native';
import { PendingAction } from '../PendingAction/PendingAction.native';
import type { LeadTileProps } from './LeadTile.types';

/**
 * A lead waiting under the deck on the phone: a row of the Up next card, its two acts at its end —
 * or, in Select, its tick. A tile where there is room for a grid.
 */
export function LeadTile(props: LeadTileProps) {
  return props.form === 'row' ? <LeadRow {...props} /> : <LeadTileCard {...props} />;
}

function Acts({ lead, onAssign, onJunk, waiting, words }: LeadTileProps) {
  return (
    <View style={styles.acts}>
      {onAssign === undefined ? null : (
        <IconButton
          label={words.assign(lead.name)}
          variant="ghost"
          disabled={waiting}
          onClick={onAssign}
        >
          <ShellGlyph name="user-plus" size="md" tone="accent" />
        </IconButton>
      )}
      {onJunk === undefined ? null : (
        <IconButton
          label={words.junk(lead.name)}
          variant="ghost"
          disabled={waiting}
          onClick={onJunk}
        >
          <ShellGlyph name="blocked" size="md" tone="secondary" />
        </IconButton>
      )}
    </View>
  );
}

function Tick({ lead, selected, onSelect, waiting, words }: LeadTileProps) {
  return (
    <Checkbox
      checked={selected}
      disabled={waiting}
      ariaLabel={words.select(lead.name)}
      onChange={onSelect}
    />
  );
}

function Name({ lead, words }: LeadTileProps) {
  return lead.name === null ? (
    <NamedGap gap={words.noName} scale="field" />
  ) : (
    <Text variant="body" bold>
      {lead.name}
    </Text>
  );
}

function Sub(props: LeadTileProps) {
  const { lead, sourceLabel, words, form } = props;
  return (
    <View style={styles.sub}>
      {lead.city === null ? (
        <NamedGap gap={words.noCity} scale="cell" />
      ) : (
        <Text variant="body-sm" color="secondary">
          {lead.city}
        </Text>
      )}
      <LeadSourceMark source={lead.source} label={sourceLabel} form="glyph" />
      {form === 'row' ? <LeadAge elapsedMs={lead.elapsedMs} words={words.age} /> : null}
      {form === 'row' && lead.bill !== null ? (
        <Text variant="mono" style={styles.money}>
          {lead.bill.money}
        </Text>
      ) : null}
    </View>
  );
}

function LeadRow(props: LeadTileProps) {
  const { lead, first, selecting, onOpen, pending, waiting, words } = props;
  return (
    <CardRow
      first={first}
      busy={waiting}
      open={selecting || onOpen === undefined ? undefined : { name: words.open(lead.name), onOpen }}
      aside={selecting ? <Tick {...props} /> : <Acts {...props} />}
      after={pending === undefined ? undefined : <PendingAction {...pending} />}
    >
      <RowBody {...props} />
    </CardRow>
  );
}

/** The row's face and words; the first line keeps clear of the acts at its end. */
function RowBody(props: LeadTileProps) {
  const room = useCardRowAsideRoom();
  return (
    <View style={[styles.row, { paddingEnd: room }]}>
      <Avatar name={props.lead.name ?? undefined} size={40} />
      <View style={styles.main}>
        <Name {...props} />
        <Sub {...props} />
      </View>
    </View>
  );
}

function LeadTileCard(props: LeadTileProps) {
  const { lead, onOpen, pending, words, selected } = props;
  return (
    <View style={[tileSurface, styles.tile, selected ? styles.selected : undefined]}>
      <GroundProvider ground="tile">
        <View style={styles.top}>
          <Tick {...props} />
          <LeadAge elapsedMs={lead.elapsedMs} words={words.age} />
        </View>
        {onOpen === undefined ? (
          <Name {...props} />
        ) : (
          <Pressable
            accessibilityLabel={words.open(lead.name)}
            onPress={onOpen}
            style={styles.open}
          >
            <Name {...props} />
          </Pressable>
        )}
        <Sub {...props} />
        {pending === undefined ? null : <PendingAction {...pending} />}
        <View style={styles.foot}>
          {lead.bill === null ? (
            <NamedGap gap={words.noBill} scale="cell" />
          ) : (
            <Text variant="mono" style={styles.money}>
              {lead.bill.money}
            </Text>
          )}
          <View style={styles.grow} />
          <Acts {...props} />
        </View>
      </GroundProvider>
    </View>
  );
}

const styles = StyleSheet.create({
  acts: { flexDirection: 'row', alignItems: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing['sp-3'] },
  main: { flex: 1, minWidth: 0, gap: theme.spacing['sp-1'] },
  sub: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: theme.spacing['sp-2'] },
  money: { color: colors['text-primary'] },
  tile: {
    gap: theme.spacing['sp-1'],
    paddingVertical: theme.spacing['sp-1'],
    paddingStart: theme.spacing['sp-3'],
    paddingEnd: theme.spacing['sp-1'],
    borderRadius: theme.radius['r-tile'],
  },
  selected: { borderWidth: 2, borderColor: colors.accent },
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  open: { alignItems: 'flex-start', justifyContent: 'center' },
  foot: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: theme.spacing['sp-1'],
    borderTopWidth: 1,
    borderTopColor: colors['line-soft'],
  },
  grow: { flexGrow: 1 },
});
