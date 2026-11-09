import type { TranslatedText } from '@heliogrid/contracts';
import type { ReactNode } from 'react';
import { ShellGlyph } from '../AppShell';
import type { UsageMeterProps } from './UsageMeter.types';

/** The meter's head: its label — with its glyph in the `tile` form — and its figure. */
export function UsageMeterHead({
  label,
  form,
  glyph,
  children,
}: Pick<UsageMeterProps, 'form' | 'glyph'> & { label: TranslatedText; children: ReactNode }) {
  return (
    <div className="hg-usage-meter-head">
      <span className="hg-usage-meter-label">
        {form === 'tile' && glyph !== undefined ? (
          <ShellGlyph name={glyph} size="sm" tone="secondary" />
        ) : null}
        {label}
      </span>
      <span className="hg-usage-meter-figure">{children}</span>
    </div>
  );
}
