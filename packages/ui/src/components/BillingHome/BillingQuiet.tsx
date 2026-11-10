import type { TranslatedText } from '@heliogrid/contracts';
import { Text } from '../../primitives/Text/Text';
import { ShellGlyph } from '../AppShell';
import { EmptyScene } from '../EmptyScene/EmptyScene';
import type { QuietArt } from './BillingHome.parts.types';

/**
 * A region with nothing in it yet, said calmly in one glass tile: a small calm drawing, or the card glyph in its tinted square, what
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
      {art === 'card' ? (
        <span className="hg-billing-quiet-art" aria-hidden="true">
          <ShellGlyph name="credit-card" size="lg" />
        </span>
      ) : (
        <EmptyScene name="settle" size="compact" />
      )}
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
