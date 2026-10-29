import { theme } from '@heliogrid/theme';
import type { ReactNode } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import { FIELD_BOX_EDGE, fieldBox } from '../../primitives/FieldBox/FieldBox.native';
import { MIN_TOUCH_TARGET } from '../../primitives/Pressable';
import { Text } from '../../primitives/Text/Text.native';
import { renderOverride } from '../FieldOverride/FieldOverride.native';
import { renderGap } from '../NamedGap/NamedGap.native';
import { renderProvenance } from '../Provenance/Provenance.native';
import { Select } from '../Select/Select.native';
import { renderAttribution } from '../ValueSource/ValueSource.native';
import { resolveCell } from './DataTable.logic';
import type { CellEditorProps, CellProps, CellValueProps } from './DataTable.parts.types';
import { isMonoColumn, isMonoEditor, isStrongColumn, plainFieldOf } from './DataTableCell.logic';
import { CellLead } from './DataTableCellLead.native';
import type { DataTableColumn } from './DataTableColumn.types';
import { useCellDraft } from './use-cell-draft';

const styles = StyleSheet.create({
  stack: { flexDirection: 'column', gap: 6, minWidth: 0 },
  right: { alignItems: 'flex-end' },
  /* An inline cell editor is a field: its well, radius and edge are `fieldBox`'s. The padding
     gives back the edge, so the text sits where the web half's does. */
  editor: {
    width: '100%',
    height: MIN_TOUCH_TARGET,
    paddingHorizontal: theme.spacing['sp-3'] - FIELD_BOX_EDGE,
    fontFamily: theme.type.families.sans,
    fontSize: theme.type.roles.body.fontSize,
    color: theme.colors['text-primary'],
  },
  editorMono: { fontFamily: theme.type.families.mono },
});

/**
 * **The commit path for a cell.** Editable only when the COLUMN says `editable` **and** the table
 * has `onCellCommit` — two hands on the switch. It commits as `useCellDraft` says, on blur or
 * submit. The table never decides a problem is solved: it commits and re-reads `cellIssue` /
 * `rowIssue` from the caller.
 *
 * The column header is this cell's name — a cell has no room for a visible label, so the name goes
 * on the control itself.
 */
function CellEditor<Row>({ row, column, issue, onCommit, words }: CellEditorProps<Row>) {
  const { asText, draft, setDraft, focused, setFocused, commit } = useCellDraft(
    row,
    column,
    onCommit,
  );

  if (column.editor === 'select') {
    /* The third editor, which the phone used to lose entirely — a `select` column fell through to
       a free-text field, so the one column with a closed set of answers was the one column a thumb
       could mistype. `Select` measures the room under the trigger and rises rather than being
       clipped, and takes the column header as its name. */
    return (
      <Select
        density="functional"
        value={asText}
        options={column.options ?? []}
        error={issue ?? undefined}
        ariaLabel={column.label}
        placeholder={words.choosePlaceholder}
        closeLabel={words.closeList}
        onChange={(value) => onCommit(row, column.key, value)}
      />
    );
  }

  return (
    <TextInput
      value={draft}
      accessibilityLabel={column.label}
      keyboardType={column.editor === 'number' ? 'decimal-pad' : 'default'}
      onChangeText={setDraft}
      onFocus={() => setFocused(true)}
      onBlur={() => {
        setFocused(false);
        commit();
      }}
      onSubmitEditing={commit}
      textAlign={column.numeric === true ? 'right' : 'left'}
      style={[
        styles.editor,
        isMonoEditor(column) ? styles.editorMono : null,
        fieldBox({ focused, tone: issue === null ? 'none' : 'error', density: 'functional' }),
      ]}
    />
  );
}

function plainValue<Row>(row: Row, column: DataTableColumn<Row>): ReactNode {
  if (column.render !== undefined) return column.render(row);
  const raw = plainFieldOf(row, column);
  if (raw === null) return null;
  return (
    <Text
      variant={isMonoColumn(column) ? 'mono' : 'body-sm'}
      color={column.muted === true ? 'secondary' : 'primary'}
      style={isStrongColumn(column) ? { fontWeight: '700' } : undefined}
    >
      {String(raw)}
    </Text>
  );
}

/**
 * **Which of the three forms the value itself takes**: the editor when the column and the table
 * both allow it, the named absence when there is no value, the value otherwise. A gap never
 * suppresses the editor — on an editable column the editor is how the gap gets filled.
 */
function CellValue<Row>({ row, column, parts, onCellCommit, words }: CellValueProps<Row>) {
  if (parts.editable && onCellCommit !== undefined) {
    return (
      <CellEditor
        row={row}
        column={column}
        issue={parts.issue}
        onCommit={onCellCommit}
        words={words}
      />
    );
  }
  /* `NamedGap`'s own treatment, already rendered — the ring, the sentence and the act that fills
     it. Tertiary-grey words were the colour of a gap and none of its behaviour. */
  if (parts.hasGap) return parts.gap;
  return plainValue(row, column);
}

/**
 * A cell's value, plus — when the column asks for them — its editor, its message, its override or
 * its attribution. **Override and attribution are mutually exclusive:** one number, one marker.
 *
 * **A cell with no value says what is missing** — never an em-dash. A gap suppresses the override,
 * the attribution and the per-figure standing (there is no figure to qualify) but not the editor:
 * on an editable column the editor is how the gap gets filled.
 */
function CellBody<Row>({ row, column, align, cellIssue, onCellCommit, words }: CellProps<Row>) {
  const parts = resolveCell(row, column, cellIssue, onCellCommit, renderGap);
  if (parts.bare) return plainValue(row, column);

  return (
    <View style={[styles.stack, align === 'right' ? styles.right : null]}>
      <CellValue
        row={row}
        column={column}
        parts={parts}
        onCellCommit={onCellCommit}
        words={words}
      />
      {/* This figure's own standing (`M11-42`), resolved from the caller's spec — handing React a
          spec object as a child throws, which is what a bare `{parts.standing}` did. */}
      {renderProvenance(parts.standing, { size: 12, align })}
      {parts.issue === null ? null : (
        <Text variant="caption" color="danger" align={align === 'right' ? 'end' : 'start'}>
          {parts.issue}
        </Text>
      )}
      {renderOverride(parts.override)}
      {/* The column header is the field this layer supplied (`SCR-M01-15`): only the table knows
          it, so only the table can bind it. */}
      {renderAttribution(parts.attribution, { fieldName: column.label })}
    </View>
  );
}

/** The cell, with the column's kind tile before it and its quiet line under it when it has them. */
export function DataTableCell<Row>(props: CellProps<Row>) {
  return (
    <CellLead row={props.row} column={props.column}>
      <CellBody {...props} />
    </CellLead>
  );
}
