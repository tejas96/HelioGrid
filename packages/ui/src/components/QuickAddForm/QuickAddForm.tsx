import type { TranslatedText } from '@heliogrid/contracts';
import { useRef } from 'react';
import type { FocusHandle } from '../../primitives/FocusAfter';
import { StatusMark } from '../../primitives/StatusMark/StatusMark';
import { Text } from '../../primitives/Text/Text';
import { useFocusRequest } from '../../primitives/use-focus-request';
import { ShellGlyph } from '../AppShell/ShellGlyph';
import { Banner } from '../Banner';
import { Button } from '../Button/Button';
import { Chip } from '../Chip/Chip';
import { Input } from '../Input/Input';
import { PendingAction } from '../PendingAction/PendingAction';
import { PhoneField } from '../PhoneField/PhoneField';
import { SegmentedControl } from '../SegmentedControl/SegmentedControl';
import { CHECK_TONE, segmentOf, segmentOptionsOf } from './QuickAddForm.logic';
import type { QuickAddFormProps, QuickAddKnownLead } from './QuickAddForm.types';
import './QuickAddForm.css';

/**
 * Quick add's four fields and Save (`SCR-M02-01`): the referral's chip when there is one, the
 * phone with the live check's line under it, name, city, the type, and Save with its rail. The
 * phone takes focus as the capture opens — the number is the one task — and again whenever a
 * refused Save names it.
 */
export function QuickAddForm(props: QuickAddFormProps) {
  const { words, saving, check } = props;
  const phone = useRef<FocusHandle>(null);
  const save = useRef<FocusHandle>(null);
  useFocusRequest(phone, props.phoneFocus);
  const known = props.knownLead ?? null;
  return (
    <div className="hg-quick-add">
      {props.cameFrom === null ? null : (
        <span className="hg-quick-add-came-from">
          <Chip tone="info">{props.cameFrom}</Chip>
        </span>
      )}
      <div className="hg-quick-add-phone">
        <PhoneField
          ref={phone}
          label={words.phone}
          words={words.phoneField}
          value={props.phoneE164}
          onChange={props.onPhone}
          readOnly={saving}
          autoFocus
          announceError
          {...(props.phoneRefusal === null ? {} : { error: props.phoneRefusal })}
        />
        {/* Said as it changes — "Checking…", then what it found — without taking the focus. */}
        <p className="hg-quick-add-check" role="status">
          {check === null ? null : <StatusMark tone={CHECK_TONE[check.kind]} label={check.words} />}
        </p>
      </div>
      {known !== null ? (
        <KnownLead known={known} />
      ) : (
        <>
          <Input label={words.name} value={props.name} onChange={props.onName} disabled={saving} />
          <Input
            label={words.city}
            value={props.city}
            onChange={props.onCity}
            disabled={saving}
            leading={<ShellGlyph name="pin" size="sm" />}
          />
          <SegmentedControl
            label={words.type}
            options={segmentOptionsOf(words)}
            value={props.segment ?? ''}
            onChange={(value) => {
              const segment = segmentOf(value);
              if (segment !== null && !saving) props.onSegment(segment);
            }}
          />
          <div className="hg-quick-add-foot">
            <Button
              ref={save}
              variant="primary"
              size="lg"
              fullWidth
              loading={saving}
              icon={<ShellGlyph name="tick" size="md" tone="inverse" />}
              onClick={saving ? undefined : props.onSave}
            >
              {words.save}
            </Button>
            <SaveNote note={saving ? undefined : props.saveNote} />
            {saving ? <PendingAction label={words.saving} /> : null}
            {!saving && props.returned !== null ? (
              <PendingAction
                state="returned"
                label={words.save}
                reason={props.returned}
                onRetry={props.onRetry}
                retryLabel={words.tryAgain}
                onDismiss={props.onDismissReturned}
                dismissLabel={words.dismiss}
                focusAfter={save}
              />
            ) : null}
          </div>
        </>
      )}
    </div>
  );
}

/** The lead a typed number already belongs to, and the one act that goes on with it. */
function KnownLead({ known }: { known: QuickAddKnownLead }) {
  return (
    <div className="hg-quick-add-known">
      <Banner tone="info">{known.line}</Banner>
      <Button
        variant="primary"
        size="lg"
        fullWidth
        iconRight={<ShellGlyph name="arrow-right" size="md" tone="inverse" />}
        onClick={known.onUse}
      >
        {known.use}
      </Button>
    </div>
  );
}

/** What the save also does, said quietly under it. */
function SaveNote({ note }: { note: TranslatedText | undefined }) {
  if (note === undefined) return null;
  return (
    <Text variant="caption" color="secondary" align="center">
      {note}
    </Text>
  );
}
