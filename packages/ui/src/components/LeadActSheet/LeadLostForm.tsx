import { LOST_REASONS, type LostReason, leadBillShownOf } from '@heliogrid/domain';
import { useId, useRef, useState } from 'react';
import { Pressable } from '../../primitives/Pressable';
import { rovingTargetOf } from '../../primitives/press-keys';
import { ShellGlyph } from '../AppShell/ShellGlyph';
import { Avatar } from '../Avatar';
import { DatePicker } from '../DatePicker';
import type { ISODate } from '../DatePicker/DatePicker.types';
import { HueTile } from '../HueTile';
import { useFormat } from '../MarketProvider';
import { ProvenanceTier } from '../Provenance';
import type { FormFrame } from './LeadActForms';
import { ActSend, ChoiceChips, dayOf } from './LeadActParts';
import { LOST_REASON_LOOK, lostReady, POSTPONE_SPANS, resurfaceOnOf } from './LeadActSheet.lost';
import type { LeadPostponeSpan } from './LeadActSheet.parts.types';
import type { LeadActForm } from './LeadActSheet.types';

type LostForm = Extract<LeadActForm, { kind: 'lost' }>;

/**
 * Mark lost (`M07-63`, `M02-54`): who is being lost, the seven reasons as tiles, and for
 * *Postponed* the day it comes back — a week, a month, three months or a day picked — said as the
 * moment it returns to Today. The send names the reason and sleeps until the form is complete.
 */
export function LeadLostForm({ form, pending, failure, fields }: FormFrame & { form: LostForm }) {
  const { words, postpone } = form;
  const format = useFormat();
  const [reason, setReason] = useState<LostReason | null>(null);
  const [span, setSpan] = useState<LeadPostponeSpan | null>(null);
  const [picked, setPicked] = useState<ISODate | null>(null);
  const resurfaceOn = resurfaceOnOf(reason, span, picked, postpone);
  const ready = lostReady(reason, resurfaceOn);
  /* *Postponed* opens on a month, the commonest answer, so it sends in one more tap; any other
     span is one tap away. */
  const choose = (next: LostReason) => {
    setReason(next);
    if (next === 'postponed' && span === null) setSpan('month');
  };
  return (
    <>
      <LostHead form={form} />
      <LostReasons form={form} reason={reason} onChange={choose} disabled={pending} />
      {reason === 'postponed' ? (
        <div className="hg-lead-lost-when">
          <ChoiceChips
            label={words.whenLabel}
            options={POSTPONE_SPANS.map((value) => ({ value, label: words.span[value] }))}
            value={span}
            onChange={setSpan}
            disabled={pending}
          />
          {span === 'pick' ? (
            <DatePicker
              label={words.dayLabel}
              words={fields.date}
              value={picked ?? undefined}
              min={form.firstDay}
              disabled={pending}
              onChange={(value) => setPicked(dayOf(value))}
            />
          ) : null}
          {resurfaceOn === null ? null : (
            <p className="hg-lead-lost-back" aria-live="polite">
              <ShellGlyph name="calendar-clock" size="md" />
              <span>
                {words.comesBack(format.date(resurfaceOn), format.time(form.comesBackAt))}
              </span>
            </p>
          )}
        </div>
      ) : null}
      {reason === 'not_interested' ? (
        <p className="hg-lead-act-note">{words.notInterestedLine}</p>
      ) : null}
      <ActSend
        label={words.send(reason)}
        ready={ready}
        pending={pending}
        failure={failure}
        onSend={() => {
          if (reason !== null && ready) form.onSend({ reason, resurfaceOn });
        }}
      />
    </>
  );
}

/** The lead being lost: their disc, their name and their monthly bill when it is known. */
function LostHead({ form }: { form: LostForm }) {
  const { lead, words } = form;
  const bill = leadBillShownOf(lead.bill, useFormat().pack);
  return (
    <div className="hg-lead-lost-head">
      <Avatar name={lead.name ?? undefined} size={40} />
      <div className="hg-lead-lost-who">
        <span className="hg-lead-lost-name">{lead.name ?? words.noName}</span>
        {bill === null || lead.bill === null ? null : (
          <span className="hg-lead-act-note">
            {words.bill(bill)} <ProvenanceTier tier={lead.bill.tier} />
          </span>
        )}
      </div>
    </div>
  );
}

/** The seven reasons as one radio group of tiles, two across; the seventh takes the whole row. */
function LostReasons({
  form,
  reason,
  onChange,
  disabled,
}: {
  form: LostForm;
  reason: LostReason | null;
  onChange: (reason: LostReason) => void;
  disabled: boolean;
}) {
  const labelId = useId();
  const group = useRef<HTMLDivElement>(null);
  const tabbable = reason ?? LOST_REASONS[0];
  /* An arrow moves to the neighbour reason and picks it, as a radio group does. */
  const keyFrom = (at: number) => (key: string) => {
    const to = rovingTargetOf(key, at, LOST_REASONS.length, 'both');
    const next = to === null ? undefined : LOST_REASONS[to];
    if (to === null || next === undefined) return false;
    onChange(next);
    group.current?.querySelectorAll<HTMLElement>('[role="radio"]')[to]?.focus();
    return true;
  };
  return (
    <div className="hg-lead-act-choices">
      <span id={labelId} className="hg-lead-act-label">
        {form.words.reasonLabel}
      </span>
      <div ref={group} className="hg-lead-lost-reasons" role="radiogroup" aria-labelledby={labelId}>
        {LOST_REASONS.map((each, at) => {
          const look = LOST_REASON_LOOK[each];
          return (
            <Pressable
              key={each}
              className="hg-lead-lost-reason"
              accessibilityRole="radio"
              accessibilityState={{ checked: reason === each }}
              disabled={disabled}
              haptic="selection"
              focusGroup={{ tabbable: each === tabbable, onKey: keyFrom(at) }}
              onPress={() => onChange(each)}
            >
              <HueTile glyph={look.glyph} hue={look.hue} size={36} stroke={1.7} />
              <span>{form.words.reason[each]}</span>
            </Pressable>
          );
        })}
      </div>
    </div>
  );
}
