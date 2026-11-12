import type { CollectionsSettings as Settings } from '@heliogrid/contracts';
import { Button } from '../Button';
import { Chip } from '../Chip';
import { FailedRead } from '../EmptyState';
import { Input } from '../Input';
import { LoadingBars } from '../LoadingBars';
import { useFormat } from '../MarketProvider';
import { QRCode } from '../QRCode';
import { SettingsSection } from '../SettingsSection';
import { BankFacts } from './BankFacts';
import { failureOf } from './CollectionsSettings.logic';
import type { CollectionsSettingsProps } from './CollectionsSettings.types';
import './CollectionsSettings.css';

/**
 * How customers pay the company, on the web (`SCR-M11-04`): the UPI ID and shown name with their
 * one save, the one-rupee test QR, the bank from the business profile, and the ways to record.
 */
export function CollectionsSettings(props: CollectionsSettingsProps) {
  const { read, words } = props;
  if (read.kind === 'loading') {
    return <LoadingBars bars={['row', 'row', 'row']} label={words.loading} />;
  }
  if (read.kind === 'failed') {
    return (
      <div className="hg-collections">
        <FailedRead
          title={words.failedTitle}
          message={words.failedMessage}
          retryLabel={words.retry}
          onRetry={read.retry}
          focusAfter={props.focusAfter}
        />
      </div>
    );
  }
  return (
    <div className="hg-collections">
      <p className="hg-collections-lead">{words.lead}</p>
      {props.savedLine === null ? null : <p className="hg-collections-quiet">{props.savedLine}</p>}
      <UpiSection {...props} settings={read.value} />
      <BankSection {...props} settings={read.value} />
      <SettingsSection title={words.ways}>
        <div className="hg-collections-block">
          <p className="hg-collections-quiet">{words.waysLine}</p>
          <div className="hg-collections-modes">
            {read.value.modes.map((mode) => (
              <Chip key={mode}>{words.mode(mode)}</Chip>
            ))}
          </div>
        </div>
      </SettingsSection>
    </div>
  );
}

function UpiSection(props: CollectionsSettingsProps & { readonly settings: Settings }) {
  const { settings, words, saving, draft } = props;
  const editable = settings.canEdit;
  return (
    <SettingsSection title={words.upi}>
      <div className="hg-collections-block">
        <div className="hg-collections-form">
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
          {editable ? (
            <Button
              variant="primary"
              size="md"
              loading={saving}
              disabled={!props.changed}
              onClick={props.onSave}
            >
              {words.save}
            </Button>
          ) : null}
        </div>
        {settings.testUri === null ? null : (
          <div className="hg-collections-test">
            <QRCode
              // A `upi://` address is for a UPI app, not a reader: the ID is shown in words beside it.
              showValue={false}
              value={settings.testUri}
              size={120}
              label={words.qrLabel}
              errorTitle={words.qrFailedTitle}
              errorMessage={words.qrFailedMessage}
            />
            <div className="hg-collections-test-text">
              <span className="hg-collections-test-title">{words.testTitle}</span>
              <span className="hg-collections-quiet">{words.testLine(settings.payTo.payee)}</span>
            </div>
          </div>
        )}
      </div>
    </SettingsSection>
  );
}

function BankSection({
  settings,
  words,
  onEditBank,
}: CollectionsSettingsProps & { readonly settings: Settings }) {
  const format = useFormat();
  const { bank } = settings.payTo;
  return (
    <SettingsSection title={words.bank}>
      <div className="hg-collections-block">
        {settings.payTo.upiLimit === null ? null : (
          <p className="hg-collections-quiet">
            {words.bankLine(format.money(settings.payTo.upiLimit))}
          </p>
        )}
        {bank === null ? (
          <p className="hg-collections-quiet">{words.noBankYet}</p>
        ) : (
          <BankFacts bank={bank} words={words} />
        )}
        {settings.canEdit ? (
          <Button variant="secondary" size="md" onClick={onEditBank}>
            {words.editBank}
          </Button>
        ) : null}
      </div>
    </SettingsSection>
  );
}
