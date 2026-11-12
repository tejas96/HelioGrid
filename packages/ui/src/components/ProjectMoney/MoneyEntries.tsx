import type { ProjectPaymentEntry, ProjectPayments } from '@heliogrid/contracts';
import { StatusMark } from '../../primitives/StatusMark/StatusMark';
import { Card } from '../Card';
import { HueTile } from '../HueTile';
import { useFormat } from '../MarketProvider';
import { Menu } from '../Menu';
import { CardHead } from '../ProjectDetail/ProjectDetailParts';
import { entriesNewestFirst, entryActsOf } from './ProjectMoney.logic';
import type { ProjectMoneyProps } from './ProjectMoney.types';

/**
 * The money received (`M11-41`, `M11-42`, `M11-47`), newest first: each payment with its mode,
 * reference, day and who recorded it; a reversal beside the payment it takes back, both kept.
 */
export function MoneyEntries(props: ProjectMoneyProps & { readonly payments: ProjectPayments }) {
  const { payments, words } = props;
  const entries = entriesNewestFirst(payments.entries);
  return (
    <section aria-label={words.received}>
      <Card density="functional" className="hg-money-card">
        <CardHead title={words.received} aside={null} />
        {entries.length === 0 ? (
          <p className="hg-money-quiet">{words.nothingReceived}</p>
        ) : (
          <ul className="hg-money-rows">
            {entries.map((entry) => (
              <li key={entry.id} className="hg-money-row">
                <EntryLine {...props} entry={entry} />
                <EntryMenu {...props} entry={entry} />
              </li>
            ))}
          </ul>
        )}
      </Card>
    </section>
  );
}

function EntryLine({
  entry,
  words,
  attaching,
}: ProjectMoneyProps & { readonly entry: ProjectPaymentEntry }) {
  const format = useFormat();
  const isReversal = entry.kind === 'reversal';
  const mode = entry.mode === null ? null : format.word('mode', entry.mode);
  return (
    <div className="hg-money-entry">
      <HueTile
        glyph={isReversal ? 'undo' : 'rupee'}
        hue={isReversal || entry.reversed ? 'neutral' : 'success'}
        size={40}
        stroke={1.8}
      />
      <div className="hg-money-entry-text">
        <span className="hg-money-entry-title">
          <span className="hg-money-figure">{format.money(entry.amount)}</span>
          {mode === null ? null : (
            <span>
              {entry.reference === null ? mode : words.entryReference(mode, entry.reference)}
            </span>
          )}
        </span>
        <span className="hg-money-entry-line">
          {isReversal && entry.reason !== null
            ? words.reversal(entry.reason)
            : words.entryLine(
                format.date(entry.receivedOn ?? entry.recordedAt),
                entry.recordedBy.name,
              )}
        </span>
      </div>
      {entry.reversed ? <StatusMark tone="neutral" label={words.reversedMark} /> : null}
      {attaching.includes(entry.id) ? (
        <StatusMark tone="neutral" label={words.photoAttaching} />
      ) : null}
    </div>
  );
}

/** A payment's acts (`entryActsOf`); a reversal has none. */
function EntryMenu(
  props: ProjectMoneyProps & {
    readonly payments: ProjectPayments;
    readonly entry: ProjectPaymentEntry;
  },
) {
  const { entry, words } = props;
  if (entry.kind !== 'payment' || entry.receiptNumber === null) return null;
  const items = entryActsOf(props, entry);
  // A reversed payment with no photo has nothing to offer: no empty menu is drawn.
  if (items.length === 0) return null;
  return <Menu label={words.entryMenu(entry.receiptNumber)} items={items} align="end" />;
}
