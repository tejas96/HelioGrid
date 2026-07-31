import { formatPhoneNsn } from '@heliogrid/domain';
import { theme } from '@heliogrid/tokens/theme';
import { Trans } from '@lingui/react';
import { Phone } from 'lucide-react-native';
import { View } from 'react-native';
import { Card, IconCircle, TextLink } from '../../../ui';
import { styles } from '../styles';
import { Small } from './Typography';

/** C6: mockup radius 16 = --r-md on this compact card (logged spec conflict). */
export function CallOfferCard({
  requested,
  phone,
  onCallMe,
}: {
  requested: boolean;
  phone: string;
  onCallMe(): void;
}) {
  const secondary = theme.colors['text-secondary'];
  return (
    <Card density="functional" style={styles.callCard}>
      <View style={styles.callRow}>
        <IconCircle
          icon={
            <Phone size={20} strokeWidth={1.5} absoluteStrokeWidth color={theme.colors.accent} />
          }
        />
        <View style={styles.callBody}>
          {requested ? (
            <Small color={secondary}>
              <Trans
                id="Calling +91 {phoneFormatted} now with your code. Keep the phone nearby."
                values={{
                  phoneFormatted: (
                    <Small weight="500" color={theme.colors['text-primary']}>
                      {formatPhoneNsn(phone)}
                    </Small>
                  ),
                }}
              />
            </Small>
          ) : (
            <>
              <Small color={secondary}>
                <Trans id="Still no code after two tries?" />
              </Small>
              <TextLink onPress={onCallMe}>
                <Trans id="Call me with the code instead" />
              </TextLink>
            </>
          )}
        </View>
      </View>
    </Card>
  );
}
