import { theme } from '@heliogrid/theme';
import { StyleSheet, View } from 'react-native';
import { useGround } from '../../primitives/Ground/Ground.native';
import { Text } from '../../primitives/Text/Text.native';
import { ShellGlyph } from '../AppShell/ShellGlyph.native';
import { Button } from '../Button/Button.native';
import { BankFacts } from '../CollectionsSettings/BankFacts.native';
import { IconButton } from '../IconButton/IconButton.native';
import { useFormat } from '../MarketProvider';
import { QRCode } from '../QRCode/QRCode.native';
import { SegmentedControl } from '../SegmentedControl/SegmentedControl.native';
import type { MoneySheetForm, MoneySheetProps } from './ProjectMoney.parts.types';
import { useCollectWay } from './use-collect-way';

type CollectProps = MoneySheetProps & {
  readonly form: Extract<MoneySheetForm, { kind: 'collect' }>;
};

/**
 * Collect a part on the phone: its UPI QR for exactly what it still owes, to the company's own UPI
 * ID, or the company's bank — and the message that carries both: opened in the customer's chat
 * where the market has one, with *Share* beside it (the share sheet copies too), else shared.
 * Nothing here sends anything itself or claims a delivery.
 */
export function CollectForm(props: CollectProps) {
  const { form, words, sending } = props;
  const { way, switcher } = useCollectWay(form, words);
  const chat = form.onChat;
  const share = () => form.onSend(form.request.message.text);
  return (
    <>
      <SegmentedControl {...switcher} />
      {way === 'upi' ? <UpiWay {...props} /> : <BankWay {...props} />}
      <View style={styles.acts}>
        <View style={styles.send}>
          <Button
            variant="primary"
            size="lg"
            fullWidth
            disabled={sending}
            icon={<ShellGlyph name={chat === null ? 'upload' : 'chat'} size="md" tone="inverse" />}
            onClick={chat ?? share}
          >
            {chat === null ? words.send : words.sendChat}
          </Button>
        </View>
        {chat === null ? null : (
          <IconButton label={words.send} onClick={share} disabled={sending}>
            <ShellGlyph name="upload" size="md" />
          </IconButton>
        )}
        {form.onFullScreen === null || form.request.upiUri === null ? null : (
          <IconButton label={words.fullScreen} onClick={form.onFullScreen}>
            <ShellGlyph name="expand" size="md" />
          </IconButton>
        )}
      </View>
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
      <Note>
        {request.overUpiLimit && upiLimit !== null ? words.overLimit(upiLimit) : words.noUpi}
      </Note>
    );
  }
  return (
    <View style={styles.qr}>
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
      <Text variant="mono" color="secondary">
        {form.payTo.upiId}
      </Text>
    </View>
  );
}

function BankWay({ form, words }: CollectProps) {
  const { bank } = form.payTo;
  if (bank === null) return <Note>{words.noBank}</Note>;
  return <BankFacts bank={bank} words={words} />;
}

/** Why a way to pay is not offered, on the control fill the sheet's ground gives. */
function Note({ children }: { children: CollectProps['words']['noUpi'] }) {
  const { controlFill } = useGround();
  return (
    <View style={[styles.note, { backgroundColor: controlFill }]}>
      <Text variant="body-sm" color="secondary">
        {children}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  acts: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing['sp-2'] },
  send: { flex: 1, minWidth: 0 },
  qr: { alignItems: 'center', gap: theme.spacing['sp-2'] },
  note: { padding: theme.spacing['sp-3'], borderRadius: theme.radius['r-md'] },
});
