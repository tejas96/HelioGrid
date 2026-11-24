'use client';
import type { TranslatedText } from '@heliogrid/contracts';
import type { SheetRowKey, StudioScreen } from '@heliogrid/data/react';
import type { MeasurementSystem, RoofNumber, RoofNumberShown } from '@heliogrid/domain';
import type { StudioCanvasWords } from '@heliogrid/i18n';
import { Pressable, ShellGlyph, useFormat } from '@heliogrid/ui';
import type { ReactNode } from 'react';
import { NumberHead, StudioSheetNumber } from './StudioSheetNumber';
import { numberShownBy } from './sheet-number-shown';

/** What every row of the sheet reads. */
export interface SheetFacts {
  readonly studio: StudioScreen;
  readonly units: MeasurementSystem;
  readonly words: StudioCanvasWords;
  /** A phone: one row opens at a time; a desktop shows every number's slider. */
  readonly phone: boolean;
}

/**
 * One row: its name, its value and, where it waits for a person, its amber dot. A tap opens what
 * sets it — on a phone one row at a time; on a desktop a number's slider is always shown.
 */
export function SheetRow({
  facts,
  rowKey,
  label,
  value,
  waits = false,
  always = false,
  openValue,
  onOpen,
  children,
}: {
  facts: SheetFacts;
  rowKey: SheetRowKey;
  label: TranslatedText;
  value: ReactNode;
  waits?: boolean;
  /** Its controls show on a desktop without a tap: a number's slider. */
  always?: boolean;
  /** What the row's line holds where its controls always show: a number's value and its switch. */
  openValue?: ReactNode;
  /** A row that opens another sheet or the picker instead of its own controls. */
  onOpen?: () => void;
  children?: ReactNode;
}) {
  const { studio } = facts;
  const { editable, shown, open, opens } = rowStateOf(facts, rowKey, always, {
    onOpen,
    children,
  });
  return (
    <div className="hg-sheet-row" data-open={open}>
      {opens ? (
        <Pressable
          className="hg-sheet-row-head"
          accessibilityRole="button"
          accessibilityState={onOpen === undefined ? { expanded: open } : {}}
          onPress={onOpen ?? (() => studio.moves.openRow(rowKey))}
        >
          <RowLine label={label} value={value} waits={waits} />
          <span className="hg-sheet-row-chevron" data-open={open || onOpen !== undefined}>
            <ShellGlyph name={onOpen === undefined ? 'chevron-up' : 'chevron-right'} size="sm" />
          </span>
        </Pressable>
      ) : (
        <div className="hg-sheet-row-head">
          <RowLine
            label={label}
            value={shown && openValue !== undefined ? openValue : value}
            waits={waits}
          />
        </div>
      )}
      {editable && open && children !== undefined ? (
        <div className="hg-sheet-row-body">{children}</div>
      ) : null}
    </div>
  );
}

/** Whether a row may be set, shows its controls without a tap, is open, and opens on a tap. */
function rowStateOf(
  { studio, phone }: SheetFacts,
  rowKey: SheetRowKey,
  always: boolean,
  { onOpen, children }: { onOpen: (() => void) | undefined; children: ReactNode },
) {
  const editable = studio.editing.kind === 'editor';
  const shown = editable && always && !phone;
  const open = shown || studio.rowOpen === rowKey;
  const opens = editable && !shown && (onOpen !== undefined || children !== undefined);
  return { editable, shown, open, opens };
}

/** A row's name, and its value with its amber dot where it waits for a person. */
function RowLine({
  label,
  value,
  waits,
}: {
  label: TranslatedText;
  value: ReactNode;
  waits: boolean;
}) {
  return (
    <>
      <span className="hg-sheet-row-label">{label}</span>
      <span className="hg-sheet-row-value">
        {waits ? <span className="hg-sheet-dot" aria-hidden="true" /> : null}
        {value}
      </span>
    </>
  );
}

/** A number's row: its slider (or box) and its reset, set on the roof or, on a side, the side. */
export function NumberRow({
  facts,
  shown,
  label,
  onSide = false,
  waits = false,
}: {
  facts: SheetFacts;
  shown: RoofNumberShown;
  label: TranslatedText;
  onSide?: boolean;
  waits?: boolean;
}) {
  const { studio, units, words } = facts;
  const { moves } = studio;
  const text = numberShownBy(useFormat(), units);
  const key: RoofNumber = shown.key;
  return (
    <SheetRow
      facts={facts}
      rowKey={key}
      label={label}
      value={text(shown)}
      waits={waits}
      always
      openValue={
        <NumberHead
          value={text(shown)}
          name={label}
          outside={shown.outside}
          studio={studio}
          words={words}
        />
      }
    >
      <StudioSheetNumber
        withHead={facts.phone}
        shown={shown}
        name={label}
        studio={studio}
        units={units}
        words={words}
        onSide={onSide}
        onSlide={(value) => moves.slideNumber(key, value)}
        onKeep={moves.keepNumber}
        onSet={(value) => moves.setNumber(key, value)}
        onReset={() => moves.resetNumber(key)}
      />
    </SheetRow>
  );
}
