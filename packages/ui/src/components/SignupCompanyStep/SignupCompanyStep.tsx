import { Text } from '../../primitives/Text/Text';
import { Button } from '../Button/Button';
import { DoorFrame } from '../DoorFrame/DoorFrame';
import { DoorTitle } from '../DoorFrame/DoorTitle';
import { SignupSteps } from '../SignupSteps/SignupSteps';
import { TintedBlock } from '../TintedBlock/TintedBlock';
import { SignupAccount } from './SignupAccount';
import type { SignupCompanyStepProps } from './SignupCompanyStep.types';
import { SignupFacts } from './SignupFacts';
import { SignupFields } from './SignupFields';

/**
 * Step 3 in the frame's two fields: the title and every finding about the person in the identity
 * half, the fields in the task, the action held under them. The steer's finding is drawn twice
 * and shown once — over the roads under the breakpoint, in the identity half from it.
 */
export function SignupCompanyStep({
  language,
  words,
  phoneE164,
  bind,
  facts,
  busy,
  onCreate,
  onRequestToJoin,
  onCreateAnyway,
}: SignupCompanyStepProps) {
  const { steer } = words;
  const finding =
    steer === null ? null : (
      <TintedBlock tone="info" {...steer.finding} className="hg-door-finding" />
    );
  const primary = (
    <Button
      variant="primary"
      size="lg"
      fullWidth
      loading={busy}
      spokenName={words.primary.aria}
      onClick={steer === null ? onCreate : onRequestToJoin}
    >
      {words.primary.label}
    </Button>
  );
  return (
    <DoorFrame
      trailing={language}
      taskMeasure="steps"
      lead={<SignupSteps words={words.steps} current={2} />}
      identity={
        <>
          <DoorTitle title={words.title} intro={words.intro ?? undefined} />
          {words.block === null ? null : (
            <TintedBlock {...words.block} className="hg-door-finding" />
          )}
          {words.account === null ? null : (
            <SignupAccount words={words.account} phoneE164={phoneE164} />
          )}
          {words.resumeLine === null ? null : (
            <Text variant="body-sm" color="secondary">
              {words.resumeLine}
            </Text>
          )}
          {finding === null ? null : <div className="hg-door-wide-only">{finding}</div>}
        </>
      }
      footer={
        steer === null ? (
          primary
        ) : (
          <div className="hg-signup-join-footer">
            <div className="hg-signup-narrow-only">{finding}</div>
            <div className="hg-signup-join-roads">
              {primary}
              <Button
                variant="secondary"
                size="lg"
                fullWidth
                disabled={busy}
                onClick={onCreateAnyway}
              >
                {steer.createAnyway}
              </Button>
            </div>
          </div>
        )
      }
    >
      {facts === null ? <SignupFields bind={bind} /> : <SignupFacts facts={facts} />}
      {words.caption === null ? null : (
        <Text variant="caption" color="secondary">
          {words.caption}
        </Text>
      )}
    </DoorFrame>
  );
}
