import { ShellGlyph } from '../AppShell/ShellGlyph';
import { Button } from '../Button';
import { BankFacts } from '../CollectionsSettings/BankFacts';
import { IconButton } from '../IconButton';
import { useFormat } from '../MarketProvider';
import { QRCode } from '../QRCode';
import { SegmentedControl } from '../SegmentedControl';
import type { MoneySheetForm, MoneySheetProps } from './ProjectMoney.parts.types';
import { useCollectWay } from './use-collect-way';

type CollectProps = MoneySheetProps & {
  readonly form: Extract<MoneySheetForm, { kind: 'collect' }>;
};

/**
 * Collect a part (owner ruling 2026-11-11): its UPI QR for exactly what it still owes, to the
 * company's own UPI ID, or the company's bank — and the message that carries both: opened in the
 * customer's chat where the market has one, with *Copy* beside it, else copied. Nothing here sends
 * anything itself or claims a delivery.
 */
export function CollectForm(props: CollectProps) {
  const { form, words, sending } = props;
  const { way, switcher } = useCollectWay(form, words);
  const chat = form.onChat;
  const copy = () => form.onSend(form.request.message.text);
  return (
    <>
      <SegmentedControl {...switcher} />
      {way === 'upi' ? <UpiWay {...props} /> : <BankWay {...props} />}
      <div className="hg-money-collect-acts">
        <Button
          variant="primary"
          size="lg"
          fullWidth
          disabled={sending}
          icon={<ShellGlyph name={chat === null ? 'clipboard' : 'chat'} size="md" tone="inverse" />}
          onClick={chat ?? copy}
        >
          {chat === null ? words.send : words.sendChat}
        </Button>
        {chat === null ? null : (
          <IconButton label={words.send} onClick={copy} disabled={sending}>
            <ShellGlyph name="clipboard" size="md" />
          </IconButton>
        )}
        {form.onFullScreen === null || form.request.upiUri === null ? null : (
          <IconButton label={words.fullScreen} onClick={form.onFullScreen}>
            <ShellGlyph name="expand" size="md" />
          </IconButton>
        )}
      </div>
      <Button variant="ghost" size="md" fullWidth onClick={form.onRecord}>
        {words.paidRecord}
      </Button>
    </>
  );
}

function UpiWay({ form, words, upiLimit }: CollectProps) {
  const format = useFormat();
  const { request } = form;
  if (request.upiUri === null) {
    return (
      <p className="hg-money-note">
        {request.overUpiLimit && upiLimit !== null ? words.overLimit(upiLimit) : words.noUpi}
      </p>
    );
  }
  return (
    <div className="hg-money-qr">
      <QRCode
        // A `upi://` address is for a UPI app, not a reader: the ID is shown in words beside it.
        showValue={false}
        value={request.upiUri}
        size={204}
        label={words.qrLabel(format.money(request.amount))}
        caption={words.noteOnPayment(request.note)}
        errorTitle={words.qrFailedTitle}
        errorMessage={words.qrFailedMessage}
      />
      <span className="hg-money-mono">{form.payTo.upiId}</span>
    </div>
  );
}

function BankWay({ form, words }: CollectProps) {
  const { bank } = form.payTo;
  if (bank === null) return <p className="hg-money-note">{words.noBank}</p>;
  return <BankFacts bank={bank} words={words} />;
}
