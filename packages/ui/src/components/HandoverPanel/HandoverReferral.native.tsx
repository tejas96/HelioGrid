import { theme } from '@heliogrid/theme';
import { type RefObject, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useFocusAfter } from '../../primitives/FocusAfter';
import { StatusMark } from '../../primitives/StatusMark/StatusMark.native';
import { Text } from '../../primitives/Text/Text.native';
import { ShellGlyph } from '../AppShell/ShellGlyph.native';
import { Button } from '../Button/Button.native';
import { HeroPanel } from '../HeroPanel/HeroPanel.native';
import { Input } from '../Input/Input.native';
import { useFormat } from '../MarketProvider';
import { PhoneField } from '../PhoneField/PhoneField.native';
import { referralOf } from './HandoverPanel.logic';
import type { HandoverReferralProps } from './HandoverPanel.types';

/**
 * The referral ask on the phone (`M08-47`) — the hero once handed over: a name and a mobile, added
 * as a lead marked as referred by this customer — no credit, no points — or *Not now*. Once added,
 * the form gives way to the name it was added under, where the screen reader lands.
 */
export function HandoverReferral(props: HandoverReferralProps) {
  const { words, customerName, referred } = props;
  const frame = useRef<View>(null);
  return (
    <View ref={frame} style={styles.section}>
      <HeroPanel label={words.referralTitle}>
        <View style={styles.card}>
          <Text variant="h3" bold>
            {words.referralLine(customerName)}
          </Text>
          {referred === null ? (
            <ReferralForm {...props} frame={frame} />
          ) : (
            <View accessibilityLiveRegion="polite">
              <StatusMark tone="success" label={words.referralAdded(referred)} />
            </View>
          )}
        </View>
      </HeroPanel>
      <Text variant="caption" color="secondary" align="center">
        {words.referralNote}
      </Text>
    </View>
  );
}

/**
 * The ask's fields and its two acts. While it is out its fields hold and *Not now* waits; a known
 * number or a send that did not land is said above the acts.
 */
function ReferralForm({
  words,
  onRefer,
  referring,
  referralKnown,
  referralFailed,
  onSkipReferral,
  frame,
}: HandoverReferralProps & { frame: RefObject<View | null> }) {
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
      <View style={styles.acts}>
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
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  section: { gap: theme.spacing['sp-3'] },
  card: { gap: theme.spacing['sp-3'] },
  acts: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing['sp-2'] },
});
