import { ShellGlyph } from '../AppShell/ShellGlyph';
import { Avatar } from '../Avatar';
import { CardRow } from '../CardRows';
import { LeadSourceMark } from '../LeadSourceMark';
import { ProvenanceTier } from '../Provenance';
import { LEAD_STAGE_TONE } from '../StatusChip/StatusChip.registry';
import { StatusMark } from '../StatusMark';
import { LEAD_STAGE_GLYPH, leadNextToneOf, MARK_GLYPH_TONE } from './LeadListRow.logic';
import type { LeadListRowProps, LeadNextMarkProps } from './LeadListRow.types';

/** What comes next on a lead, as glyph, word and tint — the list's Next column draws it too. */
export function LeadNextMark(props: LeadNextMarkProps) {
  return <StatusMark tone={leadNextToneOf(props)} label={props.label} />;
}

/** What comes next, as the card's last line: its own glyph and its words in the step's ink. */
function NextLine(props: LeadNextMarkProps) {
  const tone = leadNextToneOf(props);
  return (
    <StatusMark
      tone={tone}
      bare
      label={props.label}
      glyph={<ShellGlyph name={props.glyph} size="sm" tone={MARK_GLYPH_TONE[tone]} />}
    />
  );
}

/** One lead of the list, its own card in three lines: the whole card opens it. */
export function LeadListRow({
  lead,
  sourceLabel,
  lastActivity,
  next,
  first,
  onOpen,
  words,
}: LeadListRowProps) {
  const stage = { glyph: LEAD_STAGE_GLYPH[lead.stage], tone: LEAD_STAGE_TONE[lead.stage] };
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
        <span className="hg-lead-list-row-top">
          {lead.name === null ? (
            <span className="hg-lead-list-row-phone">{lead.phone}</span>
          ) : (
            <span className="hg-lead-list-row-name">{lead.name}</span>
          )}
          <StatusMark
            tone={stage.tone}
            label={words.stage(lead.stage)}
            glyph={<ShellGlyph name={stage.glyph} size="sm" tone={MARK_GLYPH_TONE[stage.tone]} />}
          />
        </span>
        <span className="hg-lead-list-row-facts">
          {lead.name === null ? null : (
            <span className="hg-lead-list-row-number">{lead.phone}</span>
          )}
          <LeadSourceMark
            source={lead.source}
            label={sourceLabel}
            form={lead.city === null && lead.bill === null ? 'word' : 'glyph'}
          />
          {lead.city === null ? null : <span className="hg-lead-list-row-city">{lead.city}</span>}
          {lead.bill === null ? null : (
            <span className="hg-lead-list-row-bill">
              <span className="hg-lead-list-row-money">{lead.bill}</span>
              <ProvenanceTier tier="assumed" />
            </span>
          )}
          <span className="hg-lead-list-row-since">
            <ShellGlyph name="clock" size="xs" tone="secondary" />
            {lastActivity}
          </span>
        </span>
        <span className="hg-lead-list-row-foot">
          <span className="hg-lead-list-row-next">
            {next === null ? null : <NextLine {...next} />}
          </span>
          {lead.owner === null ? (
            <span className="hg-lead-list-row-unowned">{words.noOwner}</span>
          ) : (
            <span className="hg-lead-list-row-owner">
              <Avatar name={lead.owner} size={24} />
              <span className="hg-lead-list-row-owner-name">{lead.owner}</span>
            </span>
          )}
        </span>
      </span>
    </CardRow>
  );
}
