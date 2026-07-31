import { theme } from '@heliogrid/tokens/theme';
import { Trans, useLingui } from '@lingui/react';
import { View } from 'react-native';
import { AppText, Button, Input, TextLink } from '../../../ui';
import { styles } from '../styles';
import { H1 } from './Typography';

export function PhoneStep({
  phone,
  sending,
  sendFailed,
  canSubmit,
  onChange,
  onSubmit,
  onOpenInvite,
}: {
  phone: string;
  sending: boolean;
  sendFailed: boolean;
  canSubmit: boolean;
  onChange(v: string): void;
  onSubmit(): void;
  onOpenInvite(): void;
}) {
  const { i18n } = useLingui();
  const secondary = theme.colors['text-secondary'];
  return (
    <>
      <H1>
        <Trans id="Welcome back" />
      </H1>
      <AppText color={secondary} style={styles.lede}>
        <Trans id="Sign in with your phone number. No password — we'll text you a one-time code." />
      </AppText>
      <View style={styles.fieldGroup}>
        <Input
          label={i18n._('Mobile number')}
          value={phone}
          onChange={onChange}
          placeholder="98765 43210"
          type="tel"
          mono
          density="expressive"
          helper={i18n._('Sent by SMS to your registered number.')}
          error={sendFailed ? i18n._("Couldn't send the code. Try again.") : undefined}
          disabled={sending}
          leading={
            <AppText mono weight="700" color={secondary}>
              +91
            </AppText>
          }
        />
      </View>
      <Button
        variant="primary"
        size="lg"
        fullWidth
        loading={sending}
        disabled={!canSubmit}
        onClick={onSubmit}
        style={styles.continueBtn}
      >
        <Trans id="Continue" />
      </Button>
      {/* Module ruling 1: signup is web-only — RN's footer is the invite placeholder. */}
      <TextLink onPress={onOpenInvite} style={styles.footerLink}>
        <Trans id="Joining a team? Open your invite link" />
      </TextLink>
    </>
  );
}
