import { Pressable } from '../../primitives/Pressable';
import { ShellGlyph } from '../AppShell/ShellGlyph';
import { Avatar } from '../Avatar';
import { CardRow } from '../CardRows';
import { Checkbox } from '../Checkbox';
import { IconButton } from '../IconButton';
import { LeadAge } from '../LeadAge';
import { LeadSourceMark } from '../LeadSourceMark';
import { NamedGap } from '../NamedGap';
import { PendingAction } from '../PendingAction';
import type { LeadTileProps } from './LeadTile.types';

/**
 * A lead waiting under the deck: a row of the phone's Up next card, or a tile of the desktop's
 * grid. Either way the two decisions are one tap each and its act's line sits inside it.
 */
export function LeadTile(props: LeadTileProps) {
  return props.form === 'row' ? <LeadRow {...props} /> : <LeadTileCard {...props} />;
}

function Acts({ lead, onAssign, onJunk, waiting, words }: LeadTileProps) {
  return (
    <span className="hg-lead-tile-acts">
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
    </span>
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

function City({ lead, words }: LeadTileProps) {
  return <>{lead.city ?? <NamedGap gap={words.noCity} scale="cell" />}</>;
}

function Name({ lead, words }: LeadTileProps) {
  return <>{lead.name ?? <NamedGap gap={words.noName} scale="field" />}</>;
}

/** One row of the Up next card: the face, the name, where and since when; the acts or the tick. */
function LeadRow(props: LeadTileProps) {
  const { lead, sourceLabel, first, selecting, onOpen, pending, waiting, words } = props;
  return (
    <CardRow
      first={first}
      busy={waiting}
      open={selecting || onOpen === undefined ? undefined : { name: words.open(lead.name), onOpen }}
      aside={selecting ? <Tick {...props} /> : <Acts {...props} />}
      after={pending === undefined ? undefined : <PendingAction {...pending} />}
      className="hg-lead-tile-row"
    >
      <Avatar name={lead.name ?? undefined} size={40} />
      <span className="hg-lead-tile-main">
        <span className="hg-lead-tile-name">
          <Name {...props} />
        </span>
        <span className="hg-lead-tile-sub">
          <City {...props} />
          <LeadSourceMark source={lead.source} label={sourceLabel} form="glyph" />
          <LeadAge elapsedMs={lead.elapsedMs} words={words.age} />
          {lead.bill === null ? null : (
            <span className="hg-lead-tile-money">{lead.bill.money}</span>
          )}
        </span>
      </span>
    </CardRow>
  );
}

/** One tile of the desktop's grid: the tick and the age, the name, where from, the bill and the acts. */
function LeadTileCard(props: LeadTileProps) {
  const { lead, sourceLabel, onOpen, pending, waiting, words } = props;
  return (
    <article
      className="hg-lead-tile"
      data-form="tile"
      data-selected={props.selected ? 'true' : undefined}
      aria-busy={waiting ? true : undefined}
    >
      <div className="hg-lead-tile-top">
        <Tick {...props} />
        <LeadAge elapsedMs={lead.elapsedMs} words={words.age} />
      </div>
      {onOpen === undefined ? (
        <span className="hg-lead-tile-name">
          <Name {...props} />
        </span>
      ) : (
        <Pressable
          className="hg-lead-tile-name hg-lead-tile-open"
          accessibilityLabel={words.open(lead.name)}
          onPress={onOpen}
        >
          <Name {...props} />
        </Pressable>
      )}
      <span className="hg-lead-tile-sub">
        <LeadSourceMark source={lead.source} label={sourceLabel} form="glyph" />
        <City {...props} />
      </span>
      {pending === undefined ? null : <PendingAction {...pending} />}
      <div className="hg-lead-tile-foot">
        {lead.bill === null ? (
          <NamedGap gap={words.noBill} scale="cell" />
        ) : (
          <span className="hg-lead-tile-money">{lead.bill.money}</span>
        )}
        <span className="hg-lead-tile-grow" />
        <Acts {...props} />
      </div>
    </article>
  );
}
