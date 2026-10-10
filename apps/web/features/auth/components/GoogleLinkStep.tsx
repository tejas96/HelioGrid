import type { SignIn } from '@heliogrid/data/react';
import { googleLinkFrame } from '@heliogrid/domain';
import { explainerPagerWords, googleLinkWords, SIGN_IN } from '@heliogrid/i18n';
import { useTranslate } from '@heliogrid/i18n/react';
import {
  AccountTile,
  Button,
  DoorFrame,
  Explainer,
  PhoneField,
  Text,
  TintedBlock,
} from '@heliogrid/ui';
import { LanguageControl } from './LanguageControl';

/**
 * The link step a first Google sign-in lands on (`SCR-M01-01`, `m-google-link` and
 * `d-google-link`): the number the Google login joins, proven by its code. Its frame is domain's
 * and its words i18n's; a locked number keeps the step and loses Send code (`m-google-link-locked`).
 */
export function GoogleLinkStep({ signIn }: { signIn: SignIn }) {
  const t = useTranslate();
  const { state } = signIn;
  const frame = googleLinkFrame(state);
  const words = googleLinkWords(t, frame, state.google?.email ?? '');
  const problem = state.phoneProblem;
  const anotherAccount = () => signIn.press('google');
  return (
    <DoorFrame
      trailing={
        <>
          <Button
            variant="ghost"
            size="sm"
            spokenName={words.useNumber.aria}
            onClick={() => signIn.press('use-number')}
          >
            {words.useNumber.label}
          </Button>
          {/* The phone header holds the way back alone (`m-google-link`); both do not fit at 375. */}
          <div className="hg-door-desktop-only">
            <LanguageControl />
          </div>
        </>
      }
      className="hg-door-front"
      identity={
        <div className="hg-door-title">
          <div className="hg-door-title-row">
            <Text variant="h1">{words.title}</Text>
            {words.explainer === null ? null : (
              <Explainer {...words.explainer} {...explainerPagerWords(t)} />
            )}
          </div>
          <Text variant="body" color="secondary">
            {words.body}
          </Text>
        </div>
      }
    >
      <div className="hg-door-link-account">
        <AccountTile overline={words.tileOverline} account={words.email} />
        <div className="hg-door-phone-only">
          <Button variant="ghost" size="sm" disabled={signIn.busy} onClick={anotherAccount}>
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
      <div className="hg-door-form">
        <PhoneField
          label={words.phoneLabel}
          value={state.phone}
          onChange={signIn.typePhone}
          disabled={frame.kind === 'link-locked'}
          readOnly={frame.sending}
          announceError
          error={
            problem === null
              ? undefined
              : t(SIGN_IN.digitsMismatch, { typed: problem.typed, needed: problem.needed })
          }
          autoFocus={frame.phoneEnabled}
        />
        {words.send === null ? null : (
          <Button
            variant="primary"
            size="lg"
            fullWidth
            loading={frame.sending}
            spokenName={words.send.aria}
            onClick={() => signIn.press('send')}
          >
            {words.send.label}
          </Button>
        )}
      </div>
      <div className="hg-door-desktop-only">
        <div className="hg-door-centred">
          <Button variant="ghost" size="sm" disabled={signIn.busy} onClick={anotherAccount}>
            {words.anotherAccount.short}
          </Button>
        </div>
      </div>
    </DoorFrame>
  );
}
