import { theme } from '@heliogrid/theme';
import { StyleSheet, View } from 'react-native';
import { Button } from '../Button/Button.native';
import { DoorFrame } from '../DoorFrame/DoorFrame.native';
import { DoorTitle } from '../DoorFrame/DoorTitle.native';
import { PhoneValue } from '../PhoneField/PhoneField.native';
import { TintedBlock } from '../TintedBlock/TintedBlock.native';
import type { SignupKnownNumberProps } from './SignupKnownNumber.types';

/**
 * The known number in the phone's one column: the title under the header row, the tinted block,
 * the number as a fact, then both roads. The column closes with its own free height.
 */
export function SignupKnownNumber({
  language,
  words,
  phoneE164,
  onEnter,
  onLeave,
}: SignupKnownNumberProps) {
  return (
    <DoorFrame trailing={language}>
      <View style={styles.title}>
        <DoorTitle title={words.title} explainer={words.explainer} intro={words.intro} />
      </View>
      <TintedBlock tone="info" {...words.finding} />
      <View style={styles.roads}>
        <PhoneValue label={words.phoneLabel} value={phoneE164} />
        <Button variant="primary" size="lg" fullWidth onClick={onEnter}>
          {words.enter}
        </Button>
        <View style={styles.centred}>
          <Button variant="ghost" size="md" onClick={onLeave}>
            {words.leave}
          </Button>
        </View>
      </View>
      <View style={styles.closing} />
    </DoorFrame>
  );
}

const styles = StyleSheet.create({
  /** The title block `sp-6` under the header row and `sp-5` over the block: no step header leads it. */
  title: { paddingTop: theme.spacing['sp-6'], paddingBottom: theme.spacing['sp-5'] },
  /** The number as a fact, then the two roads. */
  roads: { gap: theme.spacing['sp-5'], paddingTop: theme.spacing['sp-5'] },
  centred: { alignItems: 'center' },
  /** Takes the free height under the roads; never under `sp-6`. */
  closing: { flex: 1, minHeight: theme.spacing['sp-6'] },
});
