import type { MyDay, MyDayItem } from '@heliogrid/contracts';
import { theme } from '@heliogrid/theme';
import { StyleSheet, View } from 'react-native';
import { useFocusAfter } from '../../primitives/FocusAfter/use-focus-after.native';
import { StatusMark } from '../../primitives/StatusMark/StatusMark.native';
import { Text } from '../../primitives/Text/Text.native';
import { ShellGlyph } from '../AppShell/ShellGlyph.native';
import { Avatar } from '../Avatar/Avatar.native';
import { Button } from '../Button/Button.native';
import { CardRow, CardRows, useCardRowAsideRoom } from '../CardRows/CardRows.native';
import { Checkbox } from '../Checkbox/Checkbox.native';
import { IconButton } from '../IconButton/IconButton.native';
import { useFormat } from '../MarketProvider';
import { Menu } from '../Menu/Menu.native';
import { BAND_HEAD, whenOf } from './MyDay.logic';
import type { MyDayBandRows, MyDayProps } from './MyDay.types';
import { useTaskRow } from './use-task-row';

type BandProps = MyDayProps & { readonly day: MyDay; readonly band: MyDayBandRows };

/** One band on the phone — overdue, today or this week: its head, a card per task, *Show N more*. */
export function MyDayBand(props: BandProps) {
  const { band, words } = props;
  const head = BAND_HEAD[band.band];
  const overdue = band.band === 'overdue';
  return (
    <View
      style={styles.band}
      accessibilityLabel={words.band(band.band)}
      role="region"
      collapsable={false}
    >
      <View style={styles.head}>
        <ShellGlyph name={head.glyph} size="sm" tone={head.tone} />
        <View style={styles.title}>
          <Text variant="overline" color={overdue ? 'danger' : 'secondary'}>
            {words.band(band.band)}
          </Text>
        </View>
        <Text variant="mono" color={overdue ? 'danger' : 'secondary'} oneLine>
          {String(band.count)}
        </Text>
      </View>
      <CardRows form="separate">
        {band.rows.map((item, index) => (
          <TaskRow key={item.task.id} {...props} item={item} first={index === 0} />
        ))}
      </CardRows>
      {band.hidden > 0 ? (
        <View style={styles.more}>
          <Button
            variant="ghost"
            size="md"
            iconRight={<ShellGlyph name="caret-down" size="sm" tone="secondary" />}
            onClick={() => props.onExpand(band.band)}
          >
            {words.showMore(band.hidden)}
          </Button>
        </View>
      ) : null}
    </View>
  );
}

/**
 * One task: the tick, who, what and when, and its call — or directions to a visit. The card opens
 * the lead. The tick fills at once and the card leaves with the next read; the screen reader then
 * lands on the screen's `focusAfter`.
 */
function TaskRow(props: BandProps & { readonly item: MyDayItem; readonly first: boolean }) {
  const { item, words, sending } = props;
  const row = useTaskRow(props, item, useFocusAfter(props.focusAfter));
  const { name, act } = row;
  return (
    <CardRow
      first={props.first}
      busy={row.busy}
      open={row.open}
      aside={
        <View style={styles.acts}>
          <IconButton
            label={act.spokenName}
            disabled={act.off !== null}
            disabledReason={act.off ?? undefined}
            onClick={act.onPress}
          >
            <ShellGlyph name={act.glyph} size="sm" tone="primary" />
          </IconButton>
          <Menu label={words.rowMenu(name)} items={row.menu} align="end" />
        </View>
      }
    >
      <View style={styles.row}>
        <Checkbox
          checked={row.ticked}
          disabled={sending}
          ariaLabel={words.doneName(name)}
          onChange={(checked) => (checked ? row.tick() : undefined)}
        />
        <Avatar name={name} size={36} />
        <RowWords {...props} name={name} />
      </View>
    </CardRow>
  );
}

/** The row's words, the name clear of the call at the card's top end. */
function RowWords(props: BandProps & { readonly item: MyDayItem; readonly name: string }) {
  const { item, words, day, name } = props;
  const format = useFormat();
  const asideRoom = useCardRowAsideRoom();
  const when = whenOf(item, day, words, format);
  return (
    <View style={styles.rowWords}>
      <Text variant="body" bold style={asideRoom === 0 ? undefined : { paddingEnd: asideRoom }}>
        {name}
      </Text>
      <Text variant="body-sm" color="secondary">
        {words.task(item)}
      </Text>
      <View style={styles.when}>
        <StatusMark tone={when.tone} label={when.label} bare={item.band !== 'overdue'} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  band: { gap: theme.spacing['sp-2'] },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing['sp-2'],
    paddingHorizontal: theme.spacing['sp-1'],
  },
  title: { flex: 1, minWidth: 0 },
  row: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing['sp-2'] },
  acts: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing['sp-1'] },
  rowWords: { flex: 1, minWidth: 0, gap: theme.spacing['sp-0-5'] },
  when: { flexDirection: 'row', paddingTop: theme.spacing['sp-0-5'] },
  more: { alignSelf: 'center' },
});
