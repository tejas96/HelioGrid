import { theme } from '@heliogrid/theme';
import { StyleSheet, View } from 'react-native';
import { Text } from '../../primitives/Text/Text.native';
import { Button } from '../Button/Button.native';
import { Card } from '../Card/Card.native';
import { DoorFrame } from '../DoorFrame/DoorFrame.native';
import { DoorTitle } from '../DoorFrame/DoorTitle.native';
import { useFormat } from '../MarketProvider/MarketProvider.native';
import type { SignupRequestSentProps } from './SignupRequestSent.types';

/**
 * The request sent in the phone's one column: the title deep under the header row, who it was
 * sent as, and the one route back to creating held under the column.
 */
export function SignupRequestSent({
  language,
  words,
  name,
  phoneE164,
  onCreateInstead,
}: SignupRequestSentProps) {
  const format = useFormat();
  return (
    <DoorFrame
      trailing={language}
      column="deep"
      identity={
        <View style={styles.title}>
          <DoorTitle title={words.title} intro={words.body} />
        </View>
      }
      footer={
        <View style={styles.route}>
          <Text variant="body-sm" color="secondary" align="center">
            {words.prompt}
          </Text>
          <Button variant="secondary" size="lg" fullWidth onClick={onCreateInstead}>
            {words.createInstead}
          </Button>
        </View>
      }
    >
      <Card style={styles.sentAs}>
        <Text variant="overline" color="secondary">
          {words.sentAs}
        </Text>
        <Text variant="body-sm" bold>
          {name}
        </Text>
        <Text variant="mono" bold>
          {format.phone(phoneE164)}
        </Text>
      </Card>
      <View style={styles.closing} />
    </DoorFrame>
  );
}

const styles = StyleSheet.create({
  /** The title block, `sp-5` over the card. */
  title: { paddingBottom: theme.spacing['sp-5'] },
  /** Who the request was sent as: one `Card`, the frame's focal point; its lines `sp-1` apart. */
  sentAs: { gap: theme.spacing['sp-1'] },
  /** The prompt, centred over the one route back to creating. */
  route: { gap: theme.spacing['sp-2'] },
  /** Takes the free height under the card; never under `sp-6`. */
  closing: { flex: 1, minHeight: theme.spacing['sp-6'] },
});
