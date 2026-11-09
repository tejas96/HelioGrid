import type { TranslatedText } from '@heliogrid/contracts';
import { Text } from '../../primitives/Text/Text';
import { ShellGlyph } from '../AppShell';
import { LottieMoment } from '../LottieMoment';
import type { QuietArt } from './BillingHome.parts.types';

const QUIET_MOMENT = { inbox: 'empty-inbox', empty: 'empty' } as const;

/**
 * A region with nothing in it yet, said calmly in one glass tile: a small moment or a glyph, what
 * is not there, and when it comes — no payment method before a plan, no invoice before a charge.
 */
export function BillingQuiet({
  art,
  title,
  message,
}: {
  art: QuietArt;
  title: TranslatedText;
  message: TranslatedText | null;
}) {
  return (
    <div className="hg-billing-quiet">
      <span className="hg-billing-quiet-art" aria-hidden="true">
        {art === 'card' ? (
          <ShellGlyph name="credit-card" size="lg" />
        ) : (
          <LottieMoment name={QUIET_MOMENT[art]} size={48} />
        )}
      </span>
      <span className="hg-billing-quiet-words">
        <Text variant="body" bold={message !== null}>
          {title}
        </Text>
        {message === null ? null : (
          <Text variant="body-sm" color="secondary">
            {message}
          </Text>
        )}
      </span>
    </div>
  );
}
