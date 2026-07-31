import type { OtpFailure } from '@heliogrid/domain';
import { theme } from '@heliogrid/tokens/theme';
import { Trans } from '@lingui/react';
import { CircleAlert } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { View } from 'react-native';
import { styles } from '../styles';
import { Small } from './Typography';

function ErrorRow({ children }: { children: ReactNode }) {
  return (
    <View style={styles.inlineRow}>
      <CircleAlert size={16} strokeWidth={1.5} absoluteStrokeWidth color={theme.colors.danger} />
      <Small color={theme.colors.danger} weight="500">
        {children}
      </Small>
    </View>
  );
}

/**
 * Rendered twice in OtpStep — once above the resend row for the verify-time failures,
 * once below it for the resend-send failure — so each call only ever has one of the two
 * props truthy. Kept as one component so the three msgids and the icon+row markup stay
 * defined once.
 */
export function OtpErrorRow({
  failure,
  sendFailed,
}: {
  failure: OtpFailure | null;
  sendFailed: boolean;
}) {
  return (
    <>
      {failure === 'mismatch' ? (
        <ErrorRow>
          <Trans id="That code doesn’t match. Check it and try again." />
        </ErrorRow>
      ) : failure === 'verify-failed' ? (
        <ErrorRow>
          <Trans id="Couldn't check the code. Try again." />
        </ErrorRow>
      ) : null}
      {sendFailed ? (
        <ErrorRow>
          <Trans id="Couldn't send the code. Try again." />
        </ErrorRow>
      ) : null}
    </>
  );
}
