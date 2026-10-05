import type { SignIn } from '@heliogrid/data/react';
import type { SignInWords } from '@heliogrid/i18n';
import { Button, Text } from '@heliogrid/ui';
import { View } from 'react-native';
import { styles } from './door-styles';

/**
 * The Google way a code frame keeps open: on the locked frame the sentence that says the SMS lock
 * does not close it (`M01-04`), then the control; on the taken-phone frame the control alone.
 */
export function CodeGoogle({
  signIn,
  words,
}: {
  signIn: SignIn;
  words: NonNullable<SignInWords['google']>;
}) {
  const busy = signIn.google?.busy ?? false;
  return (
    <View style={styles.lockedGoogle}>
      {words.sentence === null ? null : <Text variant="body-sm">{words.sentence}</Text>}
      <Button
        variant="secondary"
        size="lg"
        fullWidth
        loading={busy}
        disabled={signIn.busy && !busy}
        spokenName={words.aria}
        onClick={() => signIn.press('google')}
      >
        {words.label}
      </Button>
    </View>
  );
}
