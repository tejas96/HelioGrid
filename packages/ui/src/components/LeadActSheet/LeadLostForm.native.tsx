import type { TranslatedText } from '@heliogrid/contracts';
import { LOST_REASONS, type LostReason, leadBillShownOf } from '@heliogrid/domain';
import { theme } from '@heliogrid/theme';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { colors } from '../../primitives/Color/colors';
import { GroundProvider, tileSurface, useGround } from '../../primitives/Ground/Ground.native';
import { Pressable } from '../../primitives/Pressable/Pressable.native';
import { Text } from '../../primitives/Text/Text.native';
import { ShellGlyph } from '../AppShell/ShellGlyph.native';
import { Avatar } from '../Avatar/Avatar.native';
import { DatePicker } from '../DatePicker/DatePicker.native';
import type { ISODate } from '../DatePicker/DatePicker.types';
import { HueTile } from '../HueTile/HueTile.native';
import { useFormat } from '../MarketProvider';
import { ProvenanceTier } from '../Provenance/Provenance.native';
import { LeadActSend, type LeadFormFrame } from './LeadActSend.native';
import { LOST_REASON_LOOK, lostReady, POSTPONE_SPANS, resurfaceOnOf } from './LeadActSheet.lost';
import type { LeadPostponeSpan } from './LeadActSheet.parts.types';
import type { LeadActForm } from './LeadActSheet.types';
import { LeadChoiceChips } from './LeadChoiceChips.native';
import { dayOf } from './LeadParkForms.native';

type LostForm = Extract<LeadActForm, { kind: 'lost' }>;

/**
 * Mark lost (`M07-63`, `M02-54`) on the phone: who is being lost, the seven reasons as tiles two
 * across, and for *Postponed* the day it comes back, said as the moment it returns to Today. The
 * send names the reason and sleeps until the form is complete.
 */
export function LeadLostForm({ form, frame }: { form: LostForm; frame: LeadFormFrame }) {
  const { words, postpone } = form;
  const format = useFormat();
  const [reason, setReason] = useState<LostReason | null>(null);
  const [span, setSpan] = useState<LeadPostponeSpan | null>(null);
  const [picked, setPicked] = useState<ISODate | null>(null);
  const resurfaceOn = resurfaceOnOf(reason, span, picked, postpone);
  const ready = lostReady(reason, resurfaceOn);
  return (
    <View style={styles.form}>
      <LostHead form={form} />
      <LostReasons form={form} reason={reason} onChange={setReason} disabled={frame.pending} />
      {reason === 'postponed' ? (
        <View style={styles.form}>
          <LeadChoiceChips
            label={words.whenLabel}
            choices={POSTPONE_SPANS}
            chosen={span}
            word={(each) => words.span[each]}
            onChoose={setSpan}
            disabled={frame.pending}
          />
          {span === 'pick' ? (
            <DatePicker
              words={frame.fields.date}
              label={words.dayLabel}
              min={form.firstDay}
              {...(picked === null ? {} : { value: picked })}
              onChange={(value) => setPicked(dayOf(value))}
              disabled={frame.pending}
            />
          ) : null}
          {resurfaceOn === null ? null : (
            <ComesBack
              text={words.comesBack(format.date(resurfaceOn), format.time(form.comesBackAt))}
            />
          )}
        </View>
      ) : null}
      {reason === 'not_interested' ? (
        <Text variant="body-sm" color="secondary">
          {words.notInterestedLine}
        </Text>
      ) : null}
      <LeadActSend
        label={words.send(reason)}
        ready={ready}
        pending={frame.pending}
        failure={frame.failure}
        onSend={() => {
          if (reason !== null && ready) form.onSend({ reason, resurfaceOn });
        }}
      />
    </View>
  );
}

/** The lead being lost: their disc, their name and their monthly bill when it is known. */
function LostHead({ form }: { form: LostForm }) {
  const { lead, words } = form;
  const bill = leadBillShownOf(lead.bill, useFormat().pack);
  return (
    <View style={styles.head}>
      <Avatar {...(lead.name === null ? {} : { name: lead.name })} size={40} />
      <View style={styles.who}>
        <Text variant="body" bold>
          {lead.name ?? words.noName}
        </Text>
        {bill === null || lead.bill === null ? null : (
          <View style={styles.bill}>
            <Text variant="body-sm" color="secondary">
              {words.bill(bill)}
            </Text>
            <ProvenanceTier tier={lead.bill.tier} />
          </View>
        )}
      </View>
    </View>
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
  return (
    <View style={styles.group}>
      <Text variant="field-label">{form.words.reasonLabel}</Text>
      <View
        style={styles.reasons}
        accessibilityRole="radiogroup"
        accessibilityLabel={form.words.reasonLabel}
      >
        <GroundProvider ground="tile">
          {LOST_REASONS.map((each, index) => {
            const on = reason === each;
            const look = LOST_REASON_LOOK[each];
            const wide = index === LOST_REASONS.length - 1;
            return (
              <Pressable
                key={each}
                accessibilityRole="radio"
                accessibilityState={{ checked: on }}
                disabled={disabled}
                haptic="selection"
                onPress={() => onChange(each)}
                style={[
                  tileSurface,
                  styles.reason,
                  wide ? styles.wide : styles.half,
                  on ? styles.chosen : undefined,
                ]}
              >
                <HueTile glyph={look.glyph} hue={look.hue} size={36} stroke={1.7} />
                <View style={styles.reasonWords}>
                  <Text variant="body-sm" bold color={on ? 'accent' : 'primary'}>
                    {form.words.reason[each]}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </GroundProvider>
      </View>
    </View>
  );
}

/** When a postponed lead comes back to Today, on the well of the sheet. */
function ComesBack({ text }: { text: TranslatedText }) {
  const ground = useGround();
  return (
    <View style={[styles.back, { backgroundColor: ground.controlFill }]}>
      <ShellGlyph name="calendar-clock" size="md" />
      <View style={styles.reasonWords}>
        <Text variant="body-sm" color="secondary" live>
          {text}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  form: { gap: theme.spacing['sp-4'] },
  group: { gap: theme.spacing['sp-2'] },
  head: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing['sp-3'] },
  who: { flex: 1, minWidth: 0 },
  bill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing['sp-1'],
    flexWrap: 'wrap',
  },
  reasons: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing['sp-2'] },
  reason: {
    minHeight: 58,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing['sp-3'],
    paddingVertical: theme.spacing['sp-2'],
    paddingStart: theme.spacing['sp-2'],
    paddingEnd: theme.spacing['sp-3'],
    borderRadius: theme.radius['r-field'],
  },
  /* Two across: each half takes its share of the row less half the gap between them. */
  half: { flexBasis: '47%', flexGrow: 1 },
  wide: { flexBasis: '100%' },
  /* The chosen reason is the accent wash inside the accent ring, as every chosen option is. The
     ring is one point wider than the resting edge, so the padding gives that point back and the
     words do not move. */
  chosen: {
    backgroundColor: colors['accent-subtle'],
    borderColor: colors.accent,
    borderWidth: 2,
    paddingVertical: theme.spacing['sp-2'] - 1,
    paddingStart: theme.spacing['sp-2'] - 1,
    paddingEnd: theme.spacing['sp-3'] - 1,
  },
  reasonWords: { flex: 1, minWidth: 0 },
  back: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing['sp-2'],
    padding: theme.spacing['sp-3'],
    borderRadius: theme.radius['r-md'],
  },
});
