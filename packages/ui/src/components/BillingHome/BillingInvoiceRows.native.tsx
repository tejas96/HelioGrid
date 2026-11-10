import { theme } from '@heliogrid/theme';
import { StyleSheet, View } from 'react-native';
import { Text } from '../../primitives/Text/Text.native';
import { ShellGlyph } from '../AppShell/ShellGlyph.native';
import { Block } from '../Block/Block.native';
import { IconButton } from '../IconButton/IconButton.native';
import { ListRow } from '../ListRow/ListRow.native';
import type {
  BillingBodyActing,
  BillingHomeProps,
  BillingInvoiceRow,
  BillingInvoicesView,
} from './BillingHome.types';
import { BillingStatusChip } from './BillingNeeds.native';
import { BillingQuiet } from './BillingQuiet.native';

/**
 * One invoice at 375: the date and what it was for, its state as a chip; the PDF act, then the
 * amount in mono on the right edge. The row holds the PDF control, so the row itself is not one —
 * a pressable row folds the control inside it out of a screen reader's reach.
 */
export function InvoiceRow({
  row,
  pending,
  waiting,
  onPdf,
}: {
  row: BillingInvoiceRow;
  /** This row's PDF is being signed. */
  pending: boolean;
  /** Another act's answer is out: the PDF act waits. */
  waiting: boolean;
  onPdf: (id: string) => void;
}) {
  return (
    <ListRow
      title={row.date}
      subtitle={row.forWhat}
      marks={<BillingStatusChip chip={row.chip} />}
      density="expressive"
      style={styles.flush}
      trailing={
        <View style={styles.trailing}>
          {row.pdfLabel === null ? null : (
            <IconButton
              label={row.pdfLabel}
              variant="ghost"
              disabled={pending || waiting}
              onClick={() => onPdf(row.id)}
            >
              <ShellGlyph name="document" size="md" />
            </IconButton>
          )}
          <Text variant="mono" oneLine>
            {row.amount}
          </Text>
        </View>
      }
    />
  );
}

/** The three latest with `All 24 invoices` under them, or what the first invoice waits on. */
export function BillingInvoices({
  invoices,
  words,
  pending,
  pendingPdf,
  onPdf,
  onAll,
}: {
  invoices: BillingInvoicesView;
  words: BillingHomeProps['words'];
  pending: BillingBodyActing;
  pendingPdf: string | null;
  onPdf: (id: string) => void;
  onAll: (() => void) | undefined;
}) {
  if (invoices.empty !== null) {
    return (
      <Block style={styles.flushRegion} density="expressive" title={words.invoices}>
        <BillingQuiet
          art="none-yet"
          title={invoices.empty.title}
          message={invoices.empty.message}
        />
      </Block>
    );
  }
  return (
    <Block
      style={styles.flushRegion}
      density="expressive"
      title={words.invoices}
      {...(invoices.source === null
        ? {}
        : { provenance: { tier: 'unmarked', source: invoices.source } })}
    >
      <View style={styles.rows}>
        {invoices.rows.map((row) => (
          <InvoiceRow
            key={row.id}
            row={row}
            pending={pendingPdf === row.id}
            waiting={pending !== null}
            onPdf={onPdf}
          />
        ))}
        {invoices.all === null ? null : (
          <ListRow
            title={invoices.all}
            trailing={<ShellGlyph name="chevron-right" size="md" tone="secondary" />}
            density="functional"
            style={styles.flush}
            {...(onAll === undefined ? {} : { onClick: onAll })}
          />
        )}
      </View>
    </Block>
  );
}

const styles = StyleSheet.create({
  /* A region under the hero stands on the page's own edges, as the web's does. */
  flushRegion: { paddingHorizontal: 0, paddingBottom: 0, paddingTop: theme.spacing['sp-2'] },
  rows: { gap: theme.layout['tile-gap'] },
  /** A row inside a region sits on the region's own edges, so its amount ends on the right edge. */
  flush: { paddingHorizontal: 0 },
  trailing: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing['sp-2'],
    flexShrink: 0,
  },
});
