import type { TranslatedText } from '@heliogrid/contracts';
import { StatusMark } from '../../primitives/StatusMark/StatusMark';
import { Text } from '../../primitives/Text/Text';
import { CardRow } from '../CardRows';
import { Badge } from '../Chip';
import { HueTile } from '../HueTile/HueTile';
import type { renderPending } from '../PendingAction';
import { Provenance } from '../Provenance';
import { CATALOG_KIND_LEADING } from './CatalogItems.rows';
import type { CatalogItemsProps, CatalogRow } from './CatalogItems.types';
import { CatalogRowActs } from './CatalogRowActs';

export interface CatalogItemRowProps {
  row: CatalogRow;
  props: CatalogItemsProps;
  /** The row keeps its two toggles (a desktop's room); a phone's row carries none. */
  toggles: boolean;
  /** The row's write in flight or back, as its pending line; `null` with none. */
  pending: ReturnType<typeof renderPending>;
  waiting: boolean;
  money: (amount: string) => string;
  /** The first row draws no hairline above it. */
  first: boolean;
}

/**
 * One item in the list's glass card (direction A): its kind tile, the name on one line over its spec
 * line, then the marks with the price — or *No price set* — closing their line. A phone's row has
 * no toggles: *Prefer* and *Hide* are in the item's sheet; with a desktop's room the row keeps them
 * at its top end, and an archived row, which cannot open, keeps *Restore* there. The whole
 * row opens the item (`CardRow`): the toggles take their own presses above its target.
 */
export function CatalogItemRow({
  row,
  props,
  toggles,
  pending,
  waiting,
  money,
  first,
}: CatalogItemRowProps) {
  const { words, administers } = props;
  const lead = CATALOG_KIND_LEADING[row.kind];
  const opens = administers && !row.archived;
  return (
    <CardRow
      className="hg-cat-row-body"
      first={first}
      open={
        opens
          ? {
              name: row.labels.row,
              onOpen: () => props.onOpen(row),
              current: row.id === props.openedId,
            }
          : undefined
      }
      /* A phone's row carries no toggles (direction A): *Prefer* and *Hide* are in the item's sheet,
         one tap away. An archived row cannot open, so it keeps *Restore*. */
      aside={
        administers && (row.archived || toggles) ? (
          <CatalogRowActs row={row} stacked acts={props} />
        ) : undefined
      }
      after={pending}
      highlighted={row.id === props.addedId || row.id === props.openedId}
      muted={row.archived}
      busy={waiting}
    >
      <HueTile glyph={lead.glyph} hue={lead.hue} size={40} stroke={1.5} />
      <span className="hg-cat-row-words">
        <span className="hg-cat-row-name" title={row.name}>
          {row.name}
        </span>
        <Text as="span" variant="caption" color="secondary">
          {row.specLine}
        </Text>
      </span>
      <span className="hg-cat-row-marks">
        <RowMarks row={row} props={props} />
        <RowPrice row={row} noPrice={words.noPrice} money={money} />
      </span>
    </CardRow>
  );
}

/** The price closing the marks' line, in mono; a missing one is the named warning. */
function RowPrice({
  row,
  noPrice,
  money,
}: {
  row: CatalogRow;
  noPrice: TranslatedText;
  money: (amount: string) => string;
}) {
  return (
    <span className="hg-cat-row-price">
      {typeof row.amount === 'string' ? (
        <Text as="span" variant="mono" bold className="hg-cat-figure">
          {money(row.amount)}
        </Text>
      ) : row.amount === null ? (
        <StatusMark tone="warning" label={noPrice} />
      ) : null}
    </span>
  );
}

/** The marks under the spec: whose it is, the picker states, where its data comes from, its schemes held. */
function RowMarks({ row, props }: { row: CatalogRow; props: CatalogItemsProps }) {
  const { words } = props;
  return (
    <>
      {/* The platform's own layer is the list's default, which its summary already says; only a
          layer the company made is marked. */}
      {row.layer === 'platform' ? null : (
        <Text as="span" variant="caption" color="accent">
          {row.layerWord}
        </Text>
      )}
      {row.preferred ? (
        <Badge tone="accent" density="functional">
          {words.preferred}
        </Badge>
      ) : null}
      {row.hidden ? (
        <Badge tone="warning" density="functional">
          {words.hiddenFromPickers}
        </Badge>
      ) : null}
      {/* Where the spec's figures come from is the quiet provenance word (`Provenance`, as every
          figure's tier is): on every row of a fresh catalog, an amber badge made a wall of warnings. */}
      {row.provenance === 'representative' ? (
        <Provenance source={row.provenanceWord} size={12} />
      ) : (
        <Text
          as="span"
          variant="caption"
          color={row.provenance === 'verified_datasheet' ? 'success' : 'secondary'}
        >
          {row.provenanceWord}
        </Text>
      )}
      {row.held.map((scheme) => (
        <Badge key={scheme} tone="success" density="functional">
          {scheme}
        </Badge>
      ))}
      {/* A scheme the item holds is marked; none held draws nothing in a row — the absence is the
          missing chip, and the item's sheet and the wide table name it. */}
    </>
  );
}
