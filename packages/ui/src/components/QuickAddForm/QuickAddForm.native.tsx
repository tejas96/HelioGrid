import type { TranslatedText } from '@heliogrid/contracts';
import { COMPANY_PROFILE_FIELD_CAP, PERSON_NAME_CAP } from '@heliogrid/domain';
import { theme } from '@heliogrid/theme';
import { useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import type { FocusHandle } from '../../primitives/FocusAfter';
import { Text } from '../../primitives/Text/Text.native';
import { useFocusRequest } from '../../primitives/use-focus-request';
import { ShellGlyph } from '../AppShell/ShellGlyph.native';
import { Banner } from '../Banner/Banner.native';
import { Button } from '../Button/Button.native';
import { Chip } from '../Chip/Chip.native';
import { Input } from '../Input/Input.native';
import { PendingAction } from '../PendingAction/PendingAction.native';
import { PhoneField } from '../PhoneField/PhoneField.native';
import { SegmentedControl } from '../SegmentedControl/SegmentedControl.native';
import { StatusMark } from '../StatusMark/StatusMark.native';
import { CHECK_TONE, segmentOf, segmentOptionsOf } from './QuickAddForm.logic';
import type { QuickAddFormProps, QuickAddKnownLead } from './QuickAddForm.types';

/**
 * Quick add's four fields and Save on the phone (`SCR-M02-01`, the 375 frames): the referral's
 * chip, the phone with the live check's line under it, name, city, the type, and Save with its
 * rail. The sheet holding it lifts itself over the keyboard, so Save stays in reach while typing.
 * The phone takes the keyboard as the capture opens — the number is the one task.
 */
export function QuickAddForm(props: QuickAddFormProps) {
  const { words, saving, check } = props;
  const phone = useRef<FocusHandle>(null);
  const save = useRef<View>(null);
  useFocusRequest(phone, props.phoneFocus);
  const known = props.knownLead ?? null;
  return (
    <View style={styles.form}>
      {props.cameFrom === null ? null : (
        <View style={styles.cameFrom}>
          <Chip tone="info">{props.cameFrom}</Chip>
        </View>
      )}
      <View style={styles.phone}>
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
        <View accessibilityLiveRegion="polite" style={styles.check}>
          {check === null ? null : <StatusMark tone={CHECK_TONE[check.kind]} label={check.words} />}
        </View>
      </View>
      {known !== null ? (
        <KnownLead known={known} />
      ) : (
        <>
          <Input
            label={words.name}
            value={props.name}
            onChange={props.onName}
            disabled={saving}
            maxLength={PERSON_NAME_CAP}
          />
          <Input
            label={words.city}
            value={props.city}
            onChange={props.onCity}
            disabled={saving}
            maxLength={COMPANY_PROFILE_FIELD_CAP.city}
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
          <View style={styles.foot}>
            <View ref={save}>
              <Button
                variant="primary"
                size="lg"
                fullWidth
                loading={saving}
                icon={<ShellGlyph name="check" size="md" tone="inverse" />}
                onClick={saving ? undefined : props.onSave}
              >
                {words.save}
              </Button>
            </View>
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
          </View>
        </>
      )}
    </View>
  );
}

/** The lead a typed number already belongs to, and the one act that goes on with it. */
function KnownLead({ known }: { known: QuickAddKnownLead }) {
  return (
    <View style={styles.known}>
      <Banner tone="info">
        <Text variant="body-sm">{known.line}</Text>
      </Banner>
      <Button
        variant="primary"
        size="lg"
        fullWidth
        iconRight={<ShellGlyph name="arrow-right" size="md" tone="inverse" />}
        onClick={known.onUse}
      >
        {known.use}
      </Button>
    </View>
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

const styles = StyleSheet.create({
  known: { gap: theme.spacing['sp-4'] },
  form: { gap: theme.spacing['sp-4'] },
  cameFrom: { flexDirection: 'row' },
  phone: { gap: theme.spacing['sp-2'] },
  check: { flexDirection: 'row' },
  foot: { gap: theme.spacing['sp-2'], paddingTop: theme.spacing['sp-2'] },
});
