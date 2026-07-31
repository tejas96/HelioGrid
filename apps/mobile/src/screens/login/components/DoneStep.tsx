import { theme } from '@heliogrid/tokens/theme';
import { Trans } from '@lingui/react';
import { Check } from 'lucide-react-native';
import { View } from 'react-native';
import { AppText } from '../../../ui';
import { styles } from '../styles';
import { H1 } from './Typography';

export function DoneStep() {
  const secondary = theme.colors['text-secondary'];
  return (
    <>
      <View style={styles.successDisc}>
        <Check size={30} strokeWidth={1.5} absoluteStrokeWidth color={theme.colors.success} />
      </View>
      <H1 style={styles.doneTitle}>
        <Trans id="You're signed in" />
      </H1>
      <AppText color={secondary} style={styles.lede}>
        <Trans id="Welcome back. Taking you to your day." />
      </AppText>
    </>
  );
}
