import { theme } from '@heliogrid/theme';
import { StyleSheet, View } from 'react-native';
import { Text } from '../../primitives/Text/Text.native';
import { useFormat } from '../MarketProvider';
import { Modal } from '../Modal/Modal.native';
import { QRCode } from '../QRCode/QRCode.native';
import type { MoneyQrFullProps } from './ProjectMoney.parts.types';

/**
 * The pay QR held up to the customer on the phone: the amount as the title, the QR as large as
 * the dialog allows, and who is paid — so the customer checks the name before paying.
 */
export function MoneyQrFull({ request, payTo, words, onClose }: MoneyQrFullProps) {
  const format = useFormat();
  const amount = request === null ? '' : format.money(request.amount);
  return (
    <Modal
      open={request !== null && request.upiUri !== null}
      onClose={onClose}
      closeLabel={words.close}
      showClose
      size="md"
      title={amount}
    >
      {request === null || request.upiUri === null ? null : (
        <View style={styles.body}>
          <QRCode
            // A `upi://` address is for a UPI app, not a reader: the ID is shown in words beside it.
            showValue={false}
            value={request.upiUri}
            size={280}
            label={words.qrLabel(amount)}
            caption={words.scanAny}
            errorTitle={words.qrFailedTitle}
            errorMessage={words.qrFailedMessage}
          />
          <Text variant="body">{payTo.payee}</Text>
          {payTo.upiId === null ? null : <Text variant="mono">{payTo.upiId}</Text>}
          <Text variant="body-sm" color="secondary" align="center">
            {words.noteOnPayment(request.note)}
          </Text>
        </View>
      )}
    </Modal>
  );
}

const styles = StyleSheet.create({
  body: { alignItems: 'center', gap: theme.spacing['sp-2'] },
});
