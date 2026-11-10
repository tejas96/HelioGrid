import { Pressable } from '../../primitives/Pressable';
import { ShellGlyph } from '../AppShell/ShellGlyph';
import { Avatar } from '../Avatar';
import { Card } from '../Card';
import { NamedGap } from '../NamedGap';
import { StatusChip } from '../StatusChip';
import { MERGE_FIELD_GLYPH } from './MergeCompare.logic';
import type {
  MergeCompareField,
  MergeCompareProps,
  MergeCompareRecord,
  MergeCompareValue,
  MergeCompareWords,
} from './MergeCompare.types';

/**
 * The compare: which record stays, then a pick for each field the two disagree on. One card holds
 * the records and one the fields; given the room, each lays its two records' values side by side
 * under one shared column grid, so a record's values stand under its card (`MergeCompare.css`).
 */
export function MergeCompare({
  records,
  fields,
  same,
  onStay,
  onPick,
  disabled,
  words,
}: MergeCompareProps) {
  return (
    <div className="hg-merge-compare">
      <Card className="hg-merge-card">
        <div className="hg-merge-row">
          <span className="hg-merge-over">{words.whichStays}</span>
          <div className="hg-merge-pair" role="radiogroup" aria-label={words.whichStays}>
            {records.map((record) => (
              <RecordChoice
                key={record.customerId}
                record={record}
                onStay={onStay}
                disabled={disabled}
                words={words}
              />
            ))}
          </div>
        </div>
      </Card>
      {fields.length === 0 ? null : (
        <div className="hg-merge-fields-head">
          <span className="hg-merge-over">{words.pickEach}</span>
          <span className="hg-merge-count">{words.pickedCount}</span>
        </div>
      )}
      <Card className="hg-merge-card">
        {fields.map((field) => (
          <FieldPick
            key={field.key}
            field={field}
            onPick={onPick}
            disabled={disabled}
            words={words}
          />
        ))}
        {same === null ? null : (
          <p className="hg-merge-same">
            <ShellGlyph name="tick" size="sm" tone="success" />
            <span>{same}</span>
          </p>
        )}
      </Card>
    </div>
  );
}

function RecordChoice({
  record,
  onStay,
  disabled,
  words,
}: {
  record: MergeCompareRecord;
  onStay: MergeCompareProps['onStay'];
  disabled: boolean;
  words: MergeCompareWords;
}) {
  return (
    <Pressable
      className="hg-merge-record"
      onPress={() => onStay(record.customerId)}
      disabled={disabled}
      accessibilityRole="radio"
      accessibilityState={{ checked: record.stays, disabled }}
    >
      <Avatar name={record.name ?? record.phone} size={40} />
      <span className="hg-merge-record-words">
        <span className="hg-merge-record-name">
          {record.name ?? <NamedGap gap={words.noName} scale="cell" />}
        </span>
        <span className="hg-merge-record-line">
          <span className="hg-merge-mono">{record.phone}</span>
          <span>{record.city ?? <NamedGap gap={words.noCity} scale="cell" />}</span>
        </span>
        <StatusChip
          tone={record.stays ? 'success' : 'neutral'}
          label={record.stays ? words.stays : words.mergesIn}
        />
      </span>
      <ChoiceMark on={record.stays} />
    </Pressable>
  );
}

function FieldPick({
  field,
  onPick,
  disabled,
  words,
}: {
  field: MergeCompareField;
  onPick: MergeCompareProps['onPick'];
  disabled: boolean;
  words: MergeCompareWords;
}) {
  return (
    <div className="hg-merge-row hg-merge-field">
      <span className="hg-merge-label">
        <span className="hg-merge-label-words">
          <ShellGlyph name={MERGE_FIELD_GLYPH[field.key]} size="sm" tone="secondary" />
          {field.label}
        </span>
        {field.pickedId === null ? (
          <NamedGap gap={words.pickOne} scale="cell" />
        ) : (
          <span className="hg-merge-picked">
            <ShellGlyph name="tick" size="sm" tone="success" />
            {words.picked}
          </span>
        )}
      </span>
      <div className="hg-merge-pair" role="radiogroup" aria-label={field.label}>
        {field.options.map((option) => (
          <Pressable
            key={option.customerId}
            className="hg-merge-option"
            onPress={() => onPick(field.key, option.customerId)}
            disabled={disabled}
            accessibilityRole="radio"
            accessibilityState={{ checked: field.pickedId === option.customerId, disabled }}
          >
            <ChoiceMark on={field.pickedId === option.customerId} />
            <span className="hg-merge-option-words">
              <Value value={option.value} />
              <span className="hg-merge-option-from">{option.from}</span>
            </span>
          </Pressable>
        ))}
      </div>
      {field.note === null ? null : (
        <p className="hg-merge-note">
          <ShellGlyph name="tick" size="sm" tone="success" />
          <span>{field.note}</span>
        </p>
      )}
    </div>
  );
}

function Value({ value }: { value: MergeCompareValue }) {
  if (value.kind === 'gap') return <NamedGap gap={value.words} scale="cell" />;
  return (
    <span className={value.mono ? 'hg-merge-value hg-merge-mono' : 'hg-merge-value'}>
      {value.text}
    </span>
  );
}

/** Which of a pair is chosen, as a mark beside the words: the ring, filled with its tick once on. */
function ChoiceMark({ on }: { on: boolean }) {
  return (
    <ShellGlyph name={on ? 'circle-check' : 'ring'} size="md" tone={on ? 'accent' : 'secondary'} />
  );
}
