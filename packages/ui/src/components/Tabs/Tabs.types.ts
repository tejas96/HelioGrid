import type { TranslatedText } from '@heliogrid/contracts';
import type { ReactNode } from 'react';
import type { ActionReasonInput } from '../ActionReason/ActionReason.types';

export interface Tab {
  value: string;
  label: TranslatedText;
  /** A numeral in a neutral pill — the `CountBadge` idiom without the unread red. "99+" above 99. */
  count?: number;
  /** Anything that is not a count — a needs-attention `Badge`. Nodes, through `MarkRow`. */
  marks?: ReactNode | ReactNode[];
  /**
   * A tab that leads nowhere yet is a real state; hiding it would rename the tab set. Which is why
   * the label stays **readable**: an off tab is `--text-tertiary` and its count `--neutral-text`,
   * never `--text-disabled` (which colors.css rules never carries a word a user must read).
   */
  disabled?: boolean;
  /**
   * Why it leads nowhere — law 9's slot. With a reason the tab is `aria-disabled` and **still
   * focusable** (activation suppressed in the component), and the sentence renders under the strip,
   * tied to the tab by `aria-describedby`: a natively `disabled` button leaves the tab order, so the
   * sentence would exist for everyone except the keyboard user who most needs it. Without a reason
   * the native attribute stays, because there is nothing to go and hear.
   */
  disabledReason?: ActionReasonInput;
}

export interface TabsProps {
  /** A tab's label is words, so a bare value string is never its name. */
  tabs: Tab[];
  value: string;
  onChange?: (value: string) => void;
}
