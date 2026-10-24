import { Pressable } from '../../primitives/Pressable';
import { Text } from '../../primitives/Text/Text';
import { ShellGlyph } from '../AppShell/ShellGlyph';
import { Button } from '../Button';
import { NumberField } from '../NumberField';
import { Textarea } from '../Textarea';
import { figureOf, ratesByBasis } from './CatalogRates.logic';
import type {
  CatalogVersionEdit,
  CatalogVersionRow,
  CatalogVersionWords,
} from './CatalogRates.types';

/**
 * The new version as the board draws it (s-version-new, d-version-new): its margin, what changed,
 * *Add a rate*, then the rates under how each is charged — a name that opens the rate sheet and
 * one small money box.
 */
export function VersionEditor(props: CatalogVersionEdit) {
  const { words } = props;
  return (
    <div className="hg-cat-version">
      <NumberField
        label={words.defaultMargin}
        value={figureOf(props.margin)}
        onCommit={(value) => props.onMargin(String(value))}
        commits="as-typed"
        onClear={() => props.onMargin('')}
        unit="%"
        step={0.5}
        precision={1}
        min={0}
        density="functional"
      />
      <Textarea
        label={words.whatChanged}
        value={props.note}
        onChange={props.onNote}
        rows={2}
        density="functional"
        {...(props.noteHint === null ? {} : { helper: props.noteHint })}
      />
      <span className="hg-cat-version-add">
        <Button
          variant="ghost"
          size="sm"
          icon={<ShellGlyph name="plus" size="sm" />}
          onClick={props.onAddRate}
        >
          {words.addRate}
        </Button>
      </span>
      {ratesByBasis(props.rows).map((group) => (
        <section
          key={group.basis}
          className="hg-cat-rate-group"
          aria-label={words.bases[group.basis]}
        >
          <span className="hg-cat-rate-group-head">
            <Text as="span" variant="overline" color="secondary">
              {words.bases[group.basis]}
            </Text>
            <Text as="span" variant="caption" color="secondary">
              {String(group.rates.length)}
            </Text>
          </span>
          <div className="hg-cat-edit-rows">
            {group.rates.map((row) => (
              <EditRow key={row.key} row={row} words={words} />
            ))}
          </div>
        </section>
      ))}
      {props.problem === null ? null : (
        <Text variant="body-sm" color="danger" live>
          {props.problem}
        </Text>
      )}
    </div>
  );
}

/** One rate: its name opens the rate sheet; a moved amount shows the old one struck, *Changed*. */
function EditRow({ row, words }: { row: CatalogVersionRow; words: CatalogVersionWords }) {
  return (
    <div className="hg-cat-edit-row">
      <span className="hg-cat-edit-words">
        <Pressable className="hg-cat-edit-name" onPress={row.onOpen}>
          <Text as="span" variant="body-sm">
            {row.name}
          </Text>
        </Pressable>
        {row.was === null ? null : (
          <span className="hg-cat-version-was">
            <Text as="span" spokenOnly>
              {words.was(row.was)}
            </Text>
            <s className="hg-cat-version-struck" aria-hidden="true">
              {row.was}
            </s>
            <Text as="span" variant="caption" color="info" bold>
              {words.changed}
            </Text>
          </span>
        )}
      </span>
      <span className="hg-cat-edit-amount">
        <NumberField
          labelSpokenOnly
          label={row.labels.amount}
          value={figureOf(row.amount)}
          onCommit={(value) => row.onAmount(String(value))}
          commits="as-typed"
          onClear={() => row.onAmount('')}
          currency
          outOfRange="refuse"
          min={0}
          density="functional"
        />
      </span>
    </div>
  );
}
