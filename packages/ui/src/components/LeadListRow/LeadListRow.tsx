import { StatusMark } from '../../primitives/StatusMark';
import { Avatar } from '../Avatar';
import { CardRow } from '../CardRows';
import { LeadSourceMark } from '../LeadSourceMark';
import { NamedGap } from '../NamedGap';
import { StageTrack } from '../StageTrack';
import { leadNextToneOf } from './LeadListRow.logic';
import type { LeadListRowProps, LeadNextMarkProps } from './LeadListRow.types';

/** What comes next on a lead, as glyph, word and tint — the list's Next column draws it too. */
export function LeadNextMark(props: LeadNextMarkProps) {
  return <StatusMark tone={leadNextToneOf(props)} label={props.label} />;
}

/** One lead of the list: the whole row opens it; the bill and the owner stand at its end. */
export function LeadListRow({ lead, sourceLabel, next, first, onOpen, words }: LeadListRowProps) {
  return (
    <CardRow
      first={first}
      open={{ name: words.open(lead.name), onOpen }}
      className="hg-lead-list-row"
    >
      <Avatar name={lead.name ?? undefined} size={40} />
      <span className="hg-lead-list-row-main">
        <span className="hg-lead-list-row-name">
          {lead.name ?? <NamedGap gap={words.noName} scale="field" />}
        </span>
        <span className="hg-lead-list-row-sub">
          <LeadSourceMark source={lead.source} label={sourceLabel} form="glyph" />
          <StageTrack stage={lead.stage} size="sm" words={words.track} />
          <span>{words.stage(lead.stage)}</span>
          {lead.city ?? <NamedGap gap={words.noCity} scale="cell" />}
        </span>
        {next === null ? null : (
          <span className="hg-lead-list-row-next">
            <LeadNextMark {...next} />
          </span>
        )}
      </span>
      <span className="hg-lead-list-row-end">
        {lead.bill === null ? (
          <NamedGap gap={words.noBill} scale="cell" align="right" />
        ) : (
          <span className="hg-lead-list-row-money">{lead.bill}</span>
        )}
        {lead.owner === null ? (
          <NamedGap gap={words.noOwner} scale="cell" align="right" />
        ) : (
          <Avatar name={lead.owner} size={24} />
        )}
      </span>
    </CardRow>
  );
}
