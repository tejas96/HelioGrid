import { Text } from '../../primitives/Text/Text';
import { AccountTile } from '../AccountTile/AccountTile';
import { Button } from '../Button/Button';
import { DoorFrame } from '../DoorFrame/DoorFrame';
import { Explainer } from '../Explainer/Explainer';
import { PhoneField } from '../PhoneField/PhoneField';
import { TintedBlock } from '../TintedBlock/TintedBlock';
import type { DoorLinkStepProps } from './DoorLinkStep.types';

/** The link step in the frame's two fields: the title in the identity half, the Google login and its number in the task. */
export function DoorLinkStep({
  language,
  words,
  frame,
  phone,
  onPhone,
  busy,
  onPress,
}: DoorLinkStepProps) {
  const anotherAccount = () => onPress('google');
  return (
    <DoorFrame
      trailing={
        <>
          <Button
            variant="ghost"
            size="sm"
            spokenName={words.useNumber.aria}
            onClick={() => onPress('use-number')}
          >
            {words.useNumber.label}
          </Button>
          <div className="hg-door-wide-only">{language}</div>
        </>
      }
      column="centred"
      identity={
        <div className="hg-door-title">
          <div className="hg-door-title-row">
            <Text variant="h1">{words.title}</Text>
            {words.explainer === null ? null : <Explainer {...words.explainer} />}
          </div>
          <Text variant="body" color="secondary">
            {words.body}
          </Text>
        </div>
      }
    >
      <div className="hg-door-link-account">
        <AccountTile overline={words.tileOverline} account={words.email} />
        <div className="hg-door-link-under-tile">
          <Button variant="ghost" size="sm" disabled={busy} onClick={anotherAccount}>
            {words.anotherAccount.underTile}
          </Button>
        </div>
      </div>
      {words.locked === null ? null : (
        <>
          <TintedBlock {...words.locked.block} />
          <Text variant="body-sm">{words.locked.sentence}</Text>
        </>
      )}
      <div className="hg-door-link-form">
        <PhoneField
          label={words.phoneLabel}
          value={phone}
          onChange={onPhone}
          disabled={frame.kind === 'link-locked'}
          readOnly={frame.sending}
          announceError
          error={words.phoneError}
          autoFocus={frame.phoneEnabled}
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
      </div>
      <div className="hg-door-wide-only">
        <div className="hg-door-centred">
          <Button variant="ghost" size="sm" disabled={busy} onClick={anotherAccount}>
            {words.anotherAccount.short}
          </Button>
        </div>
      </div>
    </DoorFrame>
  );
}
