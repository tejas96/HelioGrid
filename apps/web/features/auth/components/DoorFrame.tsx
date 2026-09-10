import { BrandBloom, Wordmark } from '@heliogrid/ui';
import type { ReactNode } from 'react';

const WORDMARK_SIZE = 24;

/**
 * The canvas, the bloom and the two columns every door frame shares: the identity on the left,
 * the one task on the right — and under the door's own breakpoint the phone's single column,
 * where the brand sits in the header row instead (sign-in.css).
 */
export function DoorFrame({
  trailing,
  identity,
  children,
}: {
  trailing: ReactNode;
  identity: ReactNode;
  children: ReactNode;
}) {
  return (
    <main className="hg-door">
      <BrandBloom placement="top" className="hg-door-bloom-phone" />
      <BrandBloom placement="desktop" className="hg-door-bloom-desktop" />
      <div className="hg-door-page">
        <header className="hg-door-header">
          <span className="hg-door-wordmark">
            <Wordmark size={WORDMARK_SIZE} />
          </span>
          <div className="hg-door-trailing">{trailing}</div>
        </header>
        <div className="hg-door-body">
          <section className="hg-door-identity">{identity}</section>
          <section className="hg-door-task">{children}</section>
        </div>
      </div>
    </main>
  );
}
