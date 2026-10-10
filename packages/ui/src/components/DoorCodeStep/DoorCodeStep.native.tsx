import { OTP_LENGTH } from '@heliogrid/domain';
import { theme } from '@heliogrid/theme';
import { StyleSheet, View } from 'react-native';
import { Text } from '../../primitives/Text/Text.native';
import { Button } from '../Button/Button.native';
import { DoorFrame } from '../DoorFrame/DoorFrame.native';
import { Explainer } from '../Explainer/Explainer.native';
import { useFormat } from '../MarketProvider/market-context';
import { OtpInput } from '../OtpInput/OtpInput.native';
import { TintedBlock } from '../TintedBlock/TintedBlock.native';
import type { DoorCodeStepProps, DoorCodeStepWords } from './DoorCodeStep.types';

/**
 * The code step in the phone's one column: the way back alone in the header row, the title, then
 * the code and its ways on. The column closes with its own free height: under a centred title it is
 * the half the frame leaves to the step, and under a step header all of it is below.
 */
export function DoorCodeStep({
  words,
  frame,
  phone,
  code,
  onCode,
  busy,
  googleBusy,
  onPress,
  lead,
  helper,
}: DoorCodeStepProps) {
  const { primary, resend } = frame;
  return (
    <DoorFrame
      trailing={
        <Button variant="ghost" size="sm" onClick={() => onPress('change-number')}>
          {words.changeNumber}
        </Button>
      }
      column={lead === undefined ? 'centred' : 'deep'}
      lead={lead}
      identity={<CodeTitle words={words} phone={phone} />}
    >
      <View style={styles.task}>
        {words.block === null ? null : <TintedBlock {...words.block} announce="alert" />}
        {frame.code === 'absent' ? null : (
          <OtpInput
            length={OTP_LENGTH}
            label={words.codeLabel}
            value={code}
            onChange={onCode}
            disabled={frame.code === 'closed'}
            readOnly={frame.code === 'read-only'}
            busy={busy}
            error={words.codeError ?? undefined}
            autoFocus={frame.code === 'open'}
            helper={helper}
          />
        )}
        {primary === null || words.primary === null ? null : (
          <Button
            variant="primary"
            size="lg"
            fullWidth
            loading={busy}
            spokenName={words.primaryAria ?? undefined}
            onClick={() => onPress(primary.press)}
          >
            {words.primary}
          </Button>
        )}
        {resend?.kind === 'live' && words.resend !== null ? (
          <View style={styles.centred}>
            <Button variant="ghost" size="md" onClick={() => onPress(resend.press)}>
              {words.resend}
            </Button>
          </View>
        ) : null}
        {words.wait === null ? null : (
          <View style={styles.centred}>
            <Button variant="ghost" size="md" disabled spokenName={words.wait.spoken}>
              {words.wait.label}
            </Button>
          </View>
        )}
        {words.call === null ? null : (
          <Button variant="secondary" size="md" fullWidth onClick={() => onPress('choose-call')}>
            {words.call}
          </Button>
        )}
        {words.google === null ? null : (
          <CodeGoogle
            words={words.google}
            busy={googleBusy}
            waiting={busy && !googleBusy}
            onPress={() => onPress('google')}
          />
        )}
        {words.foot === null ? null : (
          <Text variant="caption" color="secondary">
            {words.foot}
          </Text>
        )}
      </View>
      <View style={styles.closing} />
    </DoorFrame>
  );
}

/** The code frame's title: what happened, its rule behind an Explainer, the number, and the Google login it links. */
function CodeTitle({ words, phone }: { words: DoorCodeStepWords; phone: string }) {
  const format = useFormat();
  return (
    <View style={styles.title}>
      <View style={styles.titleRow}>
        <Text variant="h2" style={styles.titleText}>
          {words.title}
        </Text>
        {words.explainer === null ? null : <Explainer {...words.explainer} />}
      </View>
      {/* The lead-in is a line of its own, sentence case, the number under it (`SCR-M01-01` code family). */}
      <Text variant="body-sm" color="secondary">
        {words.sub}
      </Text>
      <Text variant="mono" bold>
        {format.phone(phone)}
      </Text>
      {words.links === null ? null : (
        <Text variant="body-sm" color="secondary">
          {words.links}
        </Text>
      )}
    </View>
  );
}

/**
 * The Google way a code frame keeps open: on the locked frame the sentence that says the SMS lock
 * does not close it (`M01-04`), then the control; on the taken-phone frame the control alone.
 */
function CodeGoogle({
  words,
  busy,
  waiting,
  onPress,
}: {
  words: NonNullable<DoorCodeStepWords['google']>;
  busy: boolean;
  /** Another round trip is in flight: the control waits for it. */
  waiting: boolean;
  onPress: () => void;
}) {
  return (
    <View style={styles.google}>
      {words.sentence === null ? null : <Text variant="body-sm">{words.sentence}</Text>}
      <Button
        variant="secondary"
        size="lg"
        fullWidth
        loading={busy}
        disabled={waiting}
        spokenName={words.aria}
        onClick={onPress}
      >
        {words.label}
      </Button>
    </View>
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
  centred: { alignItems: 'center' },
  /** The frame's way still open: the sentence, `sp-4`, then the Google control (`M01-04`). */
  google: { gap: theme.spacing['sp-4'] },
  /** Takes the free height under the task; never under `sp-6`. */
  closing: { flex: 1, minHeight: theme.spacing['sp-6'] },
});
