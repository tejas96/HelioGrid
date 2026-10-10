import { Text } from '../../primitives/Text/Text';
import { Button } from '../Button/Button';
import { DoorFrame } from '../DoorFrame/DoorFrame';
import { DoorTitle } from '../DoorFrame/DoorTitle';
import { PhoneField } from '../PhoneField/PhoneField';
import { TextDivider } from '../TextDivider/TextDivider';
import { TintedBlock } from '../TintedBlock/TintedBlock';
import type { DoorNumberStepProps } from './DoorNumberStep.types';

/** The number step in the frame's two fields: the title in the identity half, the form and the road in the task. The field takes the focus as the step opens (`SCR-M01-01`, desktop only). */
export function DoorNumberStep({
  language,
  title,
  words,
  phone,
  onPhone,
  busy,
  sending,
  googleBusy,
  onPress,
  road,
  lead,
  taskMeasure,
  helper,
  task,
}: DoorNumberStepProps) {
  const { google } = words;
  return (
    <DoorFrame
      trailing={language}
      taskMeasure={taskMeasure}
      column={lead === undefined ? 'centred' : 'deep'}
      lead={lead}
      identity={<DoorTitle {...title} />}
    >
      {task ?? (
        <>
          {words.blocks.map((block) => (
            <TintedBlock key={block.title} {...block} />
          ))}
          <div className="hg-door-number-form">
            <PhoneField
              label={words.phoneLabel}
              value={phone}
              onChange={onPhone}
              readOnly={busy}
              announceError
              autoFocus
              helper={helper}
              error={words.phoneError}
            />
            <Button
              variant="primary"
              size="lg"
              fullWidth
              loading={sending}
              disabled={busy && !sending}
              onClick={() => onPress('send')}
            >
              {words.primary}
            </Button>
            {google === null ? null : (
              <div className="hg-door-number-google">
                <TextDivider label={google.or} />
                <Button
                  variant="secondary"
                  size="lg"
                  fullWidth
                  loading={googleBusy}
                  spokenName={google.aria}
                  onClick={() => onPress('google')}
                >
                  {google.label}
                </Button>
              </div>
            )}
          </div>
          <div className="hg-door-number-road">
            <Text variant="body-sm" color="secondary">
              {road.question}
            </Text>
            <Button variant="ghost" size="md" onClick={road.onPress}>
              {road.label}
            </Button>
          </div>
        </>
      )}
    </DoorFrame>
  );
}
