import { OTP_LENGTH } from '@heliogrid/domain';
import { Text } from '../../primitives/Text/Text';
import { Button } from '../Button/Button';
import { DoorFrame } from '../DoorFrame/DoorFrame';
import { Explainer } from '../Explainer/Explainer';
import { useFormat } from '../MarketProvider';
import { OtpInput } from '../OtpInput/OtpInput';
import { TintedBlock } from '../TintedBlock/TintedBlock';
import type { DoorCodeStepProps, DoorCodeStepWords } from './DoorCodeStep.types';

/** The code step in the frame's two fields: the title and the number in the identity half, the code and its ways on in the task. */
export function DoorCodeStep({
  language,
  words,
  frame,
  phone,
  code,
  onCode,
  busy,
  googleBusy,
  onPress,
  lead,
  taskMeasure,
  helper,
}: DoorCodeStepProps) {
  const { primary, resend } = frame;
  return (
    <DoorFrame
      trailing={
        <>
          <Button variant="ghost" size="sm" onClick={() => onPress('change-number')}>
            {words.changeNumber}
          </Button>
          <div className="hg-door-wide-only">{language}</div>
        </>
      }
      taskMeasure={taskMeasure}
      column={lead === undefined ? 'centred' : 'deep'}
      lead={lead}
      identity={<CodeTitle words={words} phone={phone} />}
    >
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
        <div className="hg-door-centred">
          <Button variant="ghost" size="md" onClick={() => onPress(resend.press)}>
            {words.resend}
          </Button>
        </div>
      ) : null}
      {words.wait === null ? null : (
        <div className="hg-door-centred">
          <Button variant="ghost" size="md" disabled spokenName={words.wait.spoken}>
            {words.wait.label}
          </Button>
        </div>
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
    </DoorFrame>
  );
}

/** The code frame's title: what happened, its rule behind an Explainer, the number, and the Google login it links. */
function CodeTitle({ words, phone }: { words: DoorCodeStepWords; phone: string }) {
  const format = useFormat();
  return (
    <div className="hg-door-title">
      <div className="hg-door-title-row">
        <Text variant="h1">{words.title}</Text>
        {words.explainer === null ? null : <Explainer {...words.explainer} />}
      </div>
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
    </div>
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
    <div className="hg-door-code-google">
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
    </div>
  );
}
