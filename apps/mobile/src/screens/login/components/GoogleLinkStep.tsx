import type { SignIn } from '@heliogrid/data/react';
import { googleLinkFrame } from '@heliogrid/domain';
import { explainerPagerWords, googleLinkWords, SIGN_IN } from '@heliogrid/i18n';
import { useTranslate } from '@heliogrid/i18n/react';
import { AccountTile, Button, Explainer, PhoneField, Text, TintedBlock } from '@heliogrid/ui';
import { View } from 'react-native';
import { styles } from '../../shared/door-styles';
import { InsetDoorFrame } from '../../shared/InsetDoorFrame';
import { useHardwareBack } from '../hooks/use-hardware-back';

/**
 * The link step a first Google sign-in lands on (`SCR-M01-01`, `m-google-link`): the number the
 * Google login joins, proven by its code. Its frame is domain's and its words i18n's; a locked
 * number keeps the step and loses Send code (`m-google-link-locked`).
 */
export function GoogleLinkStep({ signIn }: { signIn: SignIn }) {
  const t = useTranslate();
  const { state } = signIn;
  const frame = googleLinkFrame(state);
  const words = googleLinkWords(t, frame, state.google?.email ?? '');
  const problem = state.phoneProblem;
  useHardwareBack(() => signIn.press('use-number'));
  return (
    <InsetDoorFrame
      trailing={
        <Button
          variant="ghost"
          size="sm"
          spokenName={words.useNumber.aria}
          onClick={() => signIn.press('use-number')}
        >
          {words.useNumber.label}
        </Button>
      }
    >
      <View style={styles.codeColumn}>
        <View style={styles.codeTitle}>
          <View style={styles.titleRow}>
            <Text variant="h2">{words.title}</Text>
            {words.explainer === null ? null : (
              <Explainer
                label={words.explainer.label}
                title={words.explainer.title}
                pages={words.explainer.pages}
                {...explainerPagerWords(t)}
              />
            )}
          </View>
          <Text variant="body" color="secondary">
            {words.body}
          </Text>
        </View>
        <View style={styles.linkAccount}>
          <AccountTile overline={words.tileOverline} account={words.email} />
          <Button
            variant="ghost"
            size="sm"
            disabled={signIn.busy}
            onClick={() => signIn.press('google')}
          >
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
      </View>
    </InsetDoorFrame>
  );
}
