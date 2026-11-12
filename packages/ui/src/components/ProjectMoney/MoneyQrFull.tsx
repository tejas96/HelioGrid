import { useFormat } from '../MarketProvider';
import { Modal } from '../Modal';
import { QRCode } from '../QRCode';
import type { MoneyQrFullProps } from './ProjectMoney.parts.types';

/**
 * The pay QR held up to the customer on the web: the amount as the title, the QR as large as the
 * dialog allows, and who is paid — so the customer checks the name before paying.
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
        <div className="hg-money-qr hg-money-qr-full">
          <QRCode
            // A `upi://` address is for a UPI app, not a reader: the ID is shown in words beside it.
            showValue={false}
            value={request.upiUri}
            size={320}
            label={words.qrLabel(amount)}
            caption={words.scanAny}
            errorTitle={words.qrFailedTitle}
            errorMessage={words.qrFailedMessage}
          />
          <span className="hg-money-glance-line">{payTo.payee}</span>
          {payTo.upiId === null ? null : <span className="hg-money-mono">{payTo.upiId}</span>}
          <span className="hg-money-quiet">{words.noteOnPayment(request.note)}</span>
        </div>
      )}
    </Modal>
  );
}
