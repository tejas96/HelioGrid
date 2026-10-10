import { Button } from '../Button/Button';
import { DoorFrame } from '../DoorFrame/DoorFrame';
import { DoorTitle } from '../DoorFrame/DoorTitle';
import { PhoneValue } from '../PhoneField/PhoneField';
import { TintedBlock } from '../TintedBlock/TintedBlock';
import type { SignupKnownNumberProps } from './SignupKnownNumber.types';

/**
 * The known number in the frame's two fields: the finding, its rule and the tinted block in the
 * identity half (`SCR-M01-02` decision 21), the number as a fact and both roads in the task.
 */
export function SignupKnownNumber({
  language,
  words,
  phoneE164,
  onEnter,
  onLeave,
}: SignupKnownNumberProps) {
  return (
    <DoorFrame
      trailing={language}
      taskMeasure="steps"
      identity={
        <>
          <DoorTitle title={words.title} explainer={words.explainer} intro={words.intro} />
          <TintedBlock tone="info" {...words.finding} className="hg-door-finding" />
        </>
      }
    >
      <div className="hg-signup-roads">
        <PhoneValue label={words.phoneLabel} value={phoneE164} />
        <Button variant="primary" size="lg" fullWidth onClick={onEnter}>
          {words.enter}
        </Button>
        <div className="hg-door-centred">
          <Button variant="ghost" size="md" onClick={onLeave}>
            {words.leave}
          </Button>
        </div>
      </div>
    </DoorFrame>
  );
}
