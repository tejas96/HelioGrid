import type { MyDay, MyDayItem } from '@heliogrid/contracts';
import { useFocusAfter } from '../../primitives/FocusAfter';
import { StatusMark } from '../../primitives/StatusMark';
import { ShellGlyph } from '../AppShell/ShellGlyph';
import type { ShellGlyphName } from '../AppShell/ShellGlyph.shapes';
import { Button } from '../Button';
import { CardRow, CardRows } from '../CardRows';
import { Checkbox } from '../Checkbox';
import { IconButton } from '../IconButton';
import { useFormat } from '../MarketProvider';
import { Menu } from '../Menu';
import { BAND_HEAD, whenOf } from './MyDay.logic';
import type { MyDayBandRows, MyDayProps } from './MyDay.types';
import { useTaskRow } from './use-task-row';

type BandProps = MyDayProps & { readonly day: MyDay; readonly band: MyDayBandRows };

const menuGlyph = (name: ShellGlyphName) => <ShellGlyph name={name} size="sm" tone="secondary" />;

/** One band — overdue, today or this week: its head and count, its rows, and *Show N more*. */
export function MyDayBand(props: BandProps) {
  const { band, words } = props;
  const head = BAND_HEAD[band.band];
  const title = words.band(band.band);
  return (
    <section className="hg-my-day-band" data-band={band.band} aria-label={title}>
      <div className="hg-my-day-band-head">
        <ShellGlyph name={head.glyph} size="sm" tone={head.tone} />
        <h3 className="hg-my-day-band-title">{title}</h3>
        <span className="hg-my-day-count">{band.count}</span>
      </div>
      <CardRows form="joined">
        {band.rows.map((item, index) => (
          <TaskRow key={item.task.id} {...props} item={item} first={index === 0} />
        ))}
      </CardRows>
      {band.hidden > 0 ? (
        <div className="hg-my-day-more">
          <Button
            variant="ghost"
            size="md"
            iconRight={<ShellGlyph name="caret-down" size="sm" tone="secondary" />}
            onClick={() => props.onExpand(band.band)}
          >
            {words.showMore(band.hidden)}
          </Button>
        </div>
      ) : null}
    </section>
  );
}

/**
 * One task: the tick, who, what and when, and its call — or directions to a visit. The row opens
 * the lead. The tick fills at once and the row leaves with the next read; focus then lands on the
 * screen's `focusAfter`. A call that is off is the sunk circle, and the row says why beside when.
 */
function TaskRow(props: BandProps & { readonly item: MyDayItem; readonly first: boolean }) {
  const { item, words, day, sending } = props;
  const format = useFormat();
  const row = useTaskRow(props, item, useFocusAfter(props.focusAfter), menuGlyph);
  const { name, act } = row;
  const when = whenOf(item, day, words, format);
  return (
    <CardRow
      first={props.first}
      className="hg-my-day-row"
      busy={row.busy}
      open={row.open}
      aside={
        <span className="hg-my-day-row-acts">
          <IconButton label={act.spokenName} disabled={act.off !== null} onClick={act.onPress}>
            <ShellGlyph name={act.glyph} size="sm" tone="primary" />
          </IconButton>
          <Menu label={words.rowMenu(name)} items={row.menu} align="end" />
        </span>
      }
    >
      <Checkbox
        className="hg-my-day-check"
        checked={row.ticked}
        disabled={sending}
        ariaLabel={words.doneName(name)}
        onChange={(checked) => (checked ? row.tick() : undefined)}
      />
      <span className="hg-my-day-row-words">
        <span className="hg-my-day-row-name">{name}</span>
        <span className="hg-my-day-row-line">{words.task(item)}</span>
        <span className="hg-my-day-row-marks">
          <StatusMark tone={when.tone} label={when.label} bare={item.band !== 'overdue'} />
          {act.off === null ? null : <StatusMark tone="warning" label={act.off} bare />}
        </span>
      </span>
    </CardRow>
  );
}
