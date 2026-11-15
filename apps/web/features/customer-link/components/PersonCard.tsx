'use client';
import type { TranslatedText } from '@heliogrid/contracts';
import { theme } from '@heliogrid/theme';
import { Avatar, IconButton, ShellGlyph, useFormat } from '@heliogrid/ui';

/**
 * The person to call (`F5-55`, `F5-73`): on every page of the link and on every failure, a name
 * and a number, one tap from a call.
 */
export function PersonCard({
  name,
  phoneE164,
  role,
  callLabel,
}: {
  name: string;
  phoneE164: string;
  role: TranslatedText;
  callLabel: TranslatedText;
}) {
  const format = useFormat();
  return (
    <section className="hg-cust-person">
      <Avatar name={name} size={theme.spacing['sp-10']} hue="accent" />
      <span className="hg-cust-person-words">
        <b>{name}</b>
        <span>{role}</span>
        <span className="hg-cust-mono">{format.phone(phoneE164)}</span>
      </span>
      <IconButton label={callLabel} href={`tel:${phoneE164}`} variant="surface">
        <ShellGlyph name="phone" />
      </IconButton>
    </section>
  );
}
