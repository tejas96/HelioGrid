import { type RefObject, useRef, useState } from 'react';
import { useFocusAfter } from '../../primitives/FocusAfter';
import { StatusMark } from '../../primitives/StatusMark';
import { Text } from '../../primitives/Text/Text';
import { ShellGlyph } from '../AppShell/ShellGlyph';
import { Button } from '../Button';
import { HeroPanel } from '../HeroPanel';
import { Input } from '../Input';
import { useFormat } from '../MarketProvider';
import { PhoneField } from '../PhoneField';
import { referralOf } from './HandoverPanel.logic';
import type { HandoverReferralProps } from './HandoverPanel.types';

/**
 * The referral ask, while they are happy (`M08-47`) — the hero once handed over: a name and a
 * mobile, added as a lead marked as referred by this customer — no credit, no points — or *Not
 * now*. Once added, the form gives way to the name it was added under, and focus lands on the ask.
 */
export function HandoverReferral(props: HandoverReferralProps) {
  const { words, customerName, referred } = props;
  const frame = useRef<HTMLElement>(null);
  return (
    <section
      ref={frame}
      tabIndex={-1}
      className="hg-handover-referral hg-focus-target"
      aria-label={words.referralTitle}
    >
      <HeroPanel label={words.referralTitle}>
        <h2 className="hg-handover-referral-line">{words.referralLine(customerName)}</h2>
        {referred === null ? (
          <ReferralForm {...props} frame={frame} />
        ) : (
          <span role="status">
            <StatusMark tone="success" label={words.referralAdded(referred)} />
          </span>
        )}
      </HeroPanel>
      <Text variant="caption" color="secondary" align="center">
        {words.referralNote}
      </Text>
    </section>
  );
}

/**
 * The ask's fields and its two acts. While it is out its fields hold and *Not now* waits; a number
 * that is already a customer's, or a send that did not land, is said above the acts.
 */
function ReferralForm({
  words,
  onRefer,
  referring,
  referralKnown,
  referralFailed,
  onSkipReferral,
  frame,
}: HandoverReferralProps & { frame: RefObject<HTMLElement | null> }) {
  const format = useFormat();
  const leaving = useFocusAfter(frame);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const draft = referralOf(format.pack, name, phone);
  return (
    <>
      <Input label={words.referralName} value={name} onChange={setName} disabled={referring} />
      <PhoneField
        label={words.referralPhone}
        words={words.phoneField}
        value={phone}
        onChange={setPhone}
        readOnly={referring}
      />
      {referralKnown !== null && referralKnown === draft?.phoneE164 ? (
        <Text variant="body-sm" color="warning" live>
          {words.referralKnown}
        </Text>
      ) : null}
      {referralFailed ? (
        <Text variant="body-sm" color="danger" live>
          {words.referralFailed}
        </Text>
      ) : null}
      <span className="hg-handover-referral-acts">
        <Button
          variant="primary"
          size="md"
          icon={<ShellGlyph name="plus" size="sm" tone="inverse" />}
          loading={referring}
          disabled={draft === null}
          onClick={leaving(() => {
            if (draft !== null && !referring) onRefer(draft);
          })}
        >
          {words.referralAdd}
        </Button>
        <Button variant="secondary" size="md" disabled={referring} onClick={onSkipReferral}>
          {words.referralSkip}
        </Button>
      </span>
    </>
  );
}
