import type { CollectionsSettings as Settings } from '@heliogrid/contracts';
import { theme } from '@heliogrid/theme';
import { StyleSheet, View } from 'react-native';
import { useGround } from '../../primitives/Ground/Ground.native';
import { Text } from '../../primitives/Text/Text.native';
import { Button } from '../Button/Button.native';
import { Chip } from '../Chip/Chip.native';
import { FailedRead } from '../EmptyState/FailedRead.native';
import { Input } from '../Input/Input.native';
import { LoadingBars } from '../LoadingBars/LoadingBars.native';
import { useFormat } from '../MarketProvider';
import { QRCode } from '../QRCode/QRCode.native';
import { SettingsSection } from '../SettingsSection/SettingsSection.native';
import { BankFacts } from './BankFacts.native';
import { failureOf } from './CollectionsSettings.logic';
import type { CollectionsSettingsProps } from './CollectionsSettings.types';

type SectionProps = CollectionsSettingsProps & { readonly settings: Settings };

/**
 * How customers pay the company, on the phone (`SCR-M11-04`): the UPI ID and shown name with their
 * one save, the one-rupee test QR, the bank from the business profile, and the ways to record. Each
 * section is one `SettingsSection` card whose rows hold the parts; the screen's scroll view holds it.
 */
export function CollectionsSettings(props: CollectionsSettingsProps) {
  const { read, words } = props;
  if (read.kind === 'loading') {
    return <LoadingBars bars={['row', 'row', 'row']} label={words.loading} />;
  }
  if (read.kind === 'failed') {
    return (
      <FailedRead
        title={words.failedTitle}
        message={words.failedMessage}
        retryLabel={words.retry}
        onRetry={read.retry}
        focusAfter={props.focusAfter}
      />
    );
  }
  return (
    <View style={styles.page}>
      <Text variant="body-sm" color="secondary">
        {words.lead}
      </Text>
      {props.savedLine === null ? null : (
        <Text variant="body-sm" color="secondary">
          {props.savedLine}
        </Text>
      )}
      <UpiSection {...props} settings={read.value} />
      <BankSection {...props} settings={read.value} />
      <SettingsSection title={words.ways}>
        <View style={styles.body}>
          <Text variant="body-sm" color="secondary">
            {words.waysLine}
          </Text>
          <View style={styles.modes}>
            {read.value.modes.map((mode) => (
              <Chip key={mode}>{words.mode(mode)}</Chip>
            ))}
          </View>
        </View>
      </SettingsSection>
    </View>
  );
}

/** The UPI ID and shown name, committed as typed (a tap on *Save* never blurs the field first). */
function UpiSection(props: SectionProps) {
  const { settings, words, saving, draft } = props;
  const editable = settings.canEdit;
  // The save rides the page's act bar, above the keyboard: a button under the fields would sit
  // behind the keyboard while the owner types.
  return (
    <SettingsSection title={words.upi}>
      <View style={styles.body}>
        <Input
          label={words.upiId}
          type="handle"
          helper={editable ? words.upiIdHint : words.ownerOnly}
          value={draft.upiId}
          onChange={(upiId) => props.onEdit({ upiId })}
          disabled={saving || !editable}
          error={failureOf(props.failure, words)}
          mono
        />
        <Input
          label={words.payee}
          value={draft.payee}
          onChange={(payee) => props.onEdit({ payee })}
          disabled={saving || !editable}
        />
      </View>
      {settings.testUri === null ? null : (
        <View style={styles.body}>
          <TestCode {...props} testUri={settings.testUri} />
        </View>
      )}
    </SettingsSection>
  );
}

/** The one-rupee request to scan from a phone, on the control fill the card's ground gives. */
function TestCode({ settings, words, testUri }: SectionProps & { readonly testUri: string }) {
  const { controlFill } = useGround();
  return (
    <View style={[styles.test, { backgroundColor: controlFill }]}>
      <QRCode
        // A `upi://` address is for a UPI app, not a reader: the ID is shown in words beside it.
        showValue={false}
        value={testUri}
        size={120}
        label={words.qrLabel}
        errorTitle={words.qrFailedTitle}
        errorMessage={words.qrFailedMessage}
      />
      <View style={styles.testText}>
        <Text variant="body" bold>
          {words.testTitle}
        </Text>
        <Text variant="body-sm" color="secondary">
          {words.testLine(settings.payTo.payee)}
        </Text>
      </View>
    </View>
  );
}

/** The bank the business profile holds, its facts term beside value; its edit lives there. */
function BankSection({ settings, words, onEditBank }: SectionProps) {
  const format = useFormat();
  const { bank } = settings.payTo;
  return (
    <SettingsSection title={words.bank}>
      <View style={styles.body}>
        {settings.payTo.upiLimit === null ? null : (
          <Text variant="body-sm" color="secondary">
            {words.bankLine(format.money(settings.payTo.upiLimit))}
          </Text>
        )}
        {bank === null ? (
          <Text variant="body-sm" color="secondary">
            {words.noBankYet}
          </Text>
        ) : (
          <BankFacts bank={bank} words={words} />
        )}
        {settings.canEdit ? (
          <View style={styles.act}>
            <Button variant="secondary" size="md" onClick={onEditBank}>
              {words.editBank}
            </Button>
          </View>
        ) : null}
      </View>
    </SettingsSection>
  );
}

const styles = StyleSheet.create({
  page: { gap: theme.spacing['sp-4'] },
  /* The section's own row padding, as `SettingsSectionRow` sets it, for a row that is a form. */
  body: {
    gap: theme.spacing['sp-3'],
    paddingVertical: theme.spacing['sp-3'],
    paddingHorizontal: theme.spacing['sp-6'],
  },
  act: { alignSelf: 'flex-start' },
  test: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing['sp-3'],
    padding: theme.spacing['sp-3'],
    borderRadius: theme.radius['r-md'],
  },
  testText: { flex: 1, minWidth: 0, gap: theme.spacing['sp-1'] },
  modes: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing['sp-2'] },
});
