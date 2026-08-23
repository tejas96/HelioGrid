import type { CSSProperties } from 'react';
import { classNames } from '../../primitives/class-names';
import { Text } from '../../primitives/Text';
import type { CountBadgeProps } from './AppShell.types';

interface WebCountBadgeProps extends CountBadgeProps {
  className?: string;
  style?: CSSProperties;
}

/**
 * The unread count. A NUMERAL, not a red dot: a dot is the mark with the word removed — it can't
 * match the list it stands for, and it fails `F7-12` on the surface every other screen copies.
 * Renders nothing at zero; over `max` it reads "99+".
 *
 * TWO OBLIGATIONS THE FIRST VERSION BROKE. A numeral is WORDS, so it takes a `-text` colour on a
 * `-bg` fill — white on `--danger` measured 3.91:1, under the floor; `--danger-text` on
 * `--danger-bg` measures 5.79:1. And the digits sit at the type floor, 12px (`--fs-caption`);
 * 11px is the overline role only. A `true` badge still draws a bare dot, which stays legal
 * because it carries no words — and the warning dot takes `--warning-text`, because `--warning`
 * measures 2.17 and is never a mark anywhere in this system.
 *
 * A shell counter carries NO PROVENANCE TIER, and that is stated rather than missing: it is a
 * wayfinder, not a reported figure. What it owes instead is that its number match the list it
 * opens, which is why `count` is read from the record (`F6-17`) and never from push state.
 */
export function CountBadge({
  count,
  max = 99,
  label = 'items',
  tone = 'danger',
  className,
  style,
}: WebCountBadgeProps) {
  const n = typeof count === 'number' ? count : null;
  if (n !== null && n <= 0) {
    return null;
  }
  if (n === null && count !== true) {
    return null;
  }
  const shown = n === null ? null : n > max ? `${max}+` : String(n);
  const words = n === null ? `Unread ${label}` : `${n} unread ${label}`;
  return (
    <span
      className={classNames('hg-app-shell-badge', className)}
      data-tone={tone}
      data-dot={shown === null ? 'true' : undefined}
      style={style}
    >
      {/* The digits are the SIGHTED channel and the sentence below is the spoken one; without this
          the reader heard the numeral twice ("3", then "3 unread alerts"). The same split
          `BlockHeader` makes around its own total. */}
      {shown === null ? null : <span aria-hidden="true">{shown}</span>}
      {/* NAME_FROM_CONTENT (check h): this badge's name has no `aria-label` to be read from — it
          comes from CONTENT, which is where the native half's `accessibilityLabel` sentence lives
          on this side. Written through the DS `Text` primitive rather than a bare `<span>` so the
          name SOURCE is declared rather than inferred: a clipped node the parity gate cannot see
          is a name nobody can audit. */}
      <Text as="span" className="hg-app-shell-badge-words">
        {words}
      </Text>
    </span>
  );
}
