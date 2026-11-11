import { StatusMark } from '../../primitives/StatusMark';
import { ShellGlyph } from '../AppShell/ShellGlyph';
import { Avatar } from '../Avatar';
import { CardRow } from '../CardRows';
import { LeadSourceMark } from '../LeadSourceMark';
import { leadNextToneOf } from './LeadListRow.logic';
import type { LeadListRowProps, LeadNextMarkProps } from './LeadListRow.types';

/** What comes next on a lead, as glyph, word and tint — the list's Next column draws it too. */
export function LeadNextMark(props: LeadNextMarkProps) {
  return <StatusMark tone={leadNextToneOf(props)} label={props.label} />;
}

/** One lead of the list, its own card: the whole card opens it; the bill and what comes next end it. */
export function LeadListRow({ lead, sourceLabel, next, first, onOpen, words }: LeadListRowProps) {
  return (
    <CardRow
      first={first}
      open={{ name: words.open(lead.name), onOpen }}
      className="hg-lead-list-row"
    >
      {lead.name === null ? (
        <span className="hg-lead-list-row-noname" aria-hidden="true">
          <ShellGlyph name="phone" size="sm" tone="secondary" />
        </span>
      ) : (
        <Avatar name={lead.name} size={44} />
      )}
      <span className="hg-lead-list-row-main">
        {lead.name === null ? (
          <span className="hg-lead-list-row-phone">{lead.phone}</span>
        ) : (
          <span className="hg-lead-list-row-name">{lead.name}</span>
        )}
        <span className="hg-lead-list-row-sub">
          <LeadSourceMark source={lead.source} label={sourceLabel} form="glyph" />
          <StatusMark tone="accent" bare label={words.stage(lead.stage)} />
          {lead.city === null ? null : <span className="hg-lead-list-row-city">{lead.city}</span>}
        </span>
      </span>
      {lead.bill === null && next === null && lead.owner === null ? null : (
        <span className="hg-lead-list-row-end">
          {lead.bill === null ? null : <span className="hg-lead-list-row-money">{lead.bill}</span>}
          {next === null ? null : <LeadNextMark {...next} />}
          {lead.owner === null ? null : <Avatar name={lead.owner} size={24} />}
        </span>
      )}
    </CardRow>
  );
}
