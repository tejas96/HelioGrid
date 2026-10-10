import { theme } from '@heliogrid/theme';
import { StyleSheet, View } from 'react-native';
import { Text } from '../../primitives/Text/Text.native';
import { Button } from '../Button/Button.native';
import { DoorFrame } from '../DoorFrame/DoorFrame.native';
import { DoorTitle } from '../DoorFrame/DoorTitle.native';
import { PhoneField } from '../PhoneField/PhoneField.native';
import { TextDivider } from '../TextDivider/TextDivider.native';
import { TintedBlock } from '../TintedBlock/TintedBlock.native';
import type { DoorNumberStepProps } from './DoorNumberStep.types';

/** The number step in the phone's one column: the title, the form, then the road held at the column's foot. */
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
  helper,
}: DoorNumberStepProps) {
  const { google } = words;
  return (
    <DoorFrame
      trailing={language}
      column={lead === undefined ? 'centred' : 'deep'}
      lead={lead}
      identity={
        <View style={styles.title}>
          <DoorTitle {...title} />
        </View>
      }
    >
      <View style={styles.form}>
        {words.blocks.map((block) => (
          <TintedBlock key={block.title} {...block} />
        ))}
        <PhoneField
          label={words.phoneLabel}
          value={phone}
          onChange={onPhone}
          readOnly={busy}
          announceError
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
          <View style={styles.google}>
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
          </View>
        )}
      </View>
      <View style={styles.spacer} />
      <View style={styles.road}>
        <Text variant="body-sm" color="secondary">
          {road.question}
        </Text>
        <Button variant="ghost" size="md" onClick={road.onPress}>
          {road.label}
        </Button>
      </View>
    </DoorFrame>
  );
}

const styles = StyleSheet.create({
  title: { paddingBottom: theme.spacing['sp-6'] },
  form: { gap: theme.spacing['sp-5'] },
  /** The "or" and Continue with Google: `sp-5` above (the form's gap), `sp-3` between (`SCR-M01-01`). */
  google: { gap: theme.spacing['sp-3'] },
  /** Takes the free height under the form, so the road reaches the column's foot; never under `sp-6`. */
  spacer: { flex: 1, minHeight: theme.spacing['sp-6'] },
  /** The road at the foot: the question and where it goes. */
  road: { alignItems: 'center', gap: theme.spacing['sp-2'] },
});
