import { theme } from '@heliogrid/theme';
import { StyleSheet, View } from 'react-native';
import { Text } from '../../primitives/Text/Text.native';
import { AccountTile } from '../AccountTile/AccountTile.native';
import { Button } from '../Button/Button.native';
import { DoorFrame } from '../DoorFrame/DoorFrame.native';
import { Explainer } from '../Explainer/Explainer.native';
import { PhoneField } from '../PhoneField/PhoneField.native';
import { TintedBlock } from '../TintedBlock/TintedBlock.native';
import type { DoorLinkStepProps } from './DoorLinkStep.types';

/**
 * The link step in the phone's one column: the way back alone in the header row, the title, the
 * Google login, then its number. The column closes with its own free height, the half the frame
 * leaves to the step under a centred title.
 */
export function DoorLinkStep({ words, frame, phone, onPhone, busy, onPress }: DoorLinkStepProps) {
  return (
    <DoorFrame
      trailing={
        <Button
          variant="ghost"
          size="sm"
          spokenName={words.useNumber.aria}
          onClick={() => onPress('use-number')}
        >
          {words.useNumber.label}
        </Button>
      }
      column="centred"
      identity={
        <View style={styles.title}>
          <View style={styles.titleRow}>
            <Text variant="h2" style={styles.titleText}>
              {words.title}
            </Text>
            {words.explainer === null ? null : <Explainer {...words.explainer} />}
          </View>
          <Text variant="body" color="secondary">
            {words.body}
          </Text>
        </View>
      }
    >
      <View style={styles.task}>
        <View style={styles.account}>
          <AccountTile overline={words.tileOverline} account={words.email} />
          <Button variant="ghost" size="sm" disabled={busy} onClick={() => onPress('google')}>
            {words.anotherAccount.underTile}
          </Button>
        </View>
        {words.locked === null ? null : (
          <>
            <TintedBlock {...words.locked.block} />
            <Text variant="body-sm">{words.locked.sentence}</Text>
          </>
        )}
        <PhoneField
          label={words.phoneLabel}
          value={phone}
          onChange={onPhone}
          disabled={frame.kind === 'link-locked'}
          readOnly={frame.sending}
          announceError
          error={words.phoneError}
        />
        {words.send === null ? null : (
          <Button
            variant="primary"
            size="lg"
            fullWidth
            loading={frame.sending}
            spokenName={words.send.aria}
            onClick={() => onPress('send')}
          >
            {words.send.label}
          </Button>
        )}
      </View>
      <View style={styles.closing} />
    </DoorFrame>
  );
}

const styles = StyleSheet.create({
  /** The title block, `sp-5` over the task (the task's own gap). */
  title: { gap: theme.spacing['sp-1'], paddingBottom: theme.spacing['sp-5'] },
  /** The title and its Explainer on one row, `sp-2` apart. */
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing['sp-2'] },
  /** The title gives way and wraps, so a long one never pushes its Explainer off the screen. */
  titleText: { flexShrink: 1 },
  task: { gap: theme.spacing['sp-5'] },
  /** The tile, then `sp-2`, then "Not you?" at the start of the line. */
  account: { gap: theme.spacing['sp-2'], alignItems: 'flex-start' },
  /** Takes the free height under the task; never under `sp-6`. */
  closing: { flex: 1, minHeight: theme.spacing['sp-6'] },
});
