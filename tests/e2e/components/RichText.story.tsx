import type { TranslatedText } from '@heliogrid/contracts';
import { RichText, type RichTextTemplate, type RichTextValue } from '@heliogrid/ui';
import { useState } from 'react';
import { RICH_TEXT_ENGLISH, RICH_TEXT_MARKED } from '../support/rich-text-words';

/**
 * The terms editor with its words bound in the browser: `characters` and `loadTemplateNamed` are
 * functions the editor calls while it renders, so they cannot be handed to `mount`. The value
 * lives here too, as a screen holds it, so a placed logo turns the logo button on.
 */
export function WordedRichText({
  marked = false,
  label,
  placeholder,
  maxLength,
  disabled = false,
  templates,
}: {
  marked?: boolean;
  label?: TranslatedText;
  placeholder?: TranslatedText;
  maxLength?: number;
  disabled?: boolean;
  templates?: RichTextTemplate[];
}) {
  const [value, setValue] = useState<RichTextValue>({ version: 1, blocks: [] });
  return (
    <RichText
      words={marked ? RICH_TEXT_MARKED : RICH_TEXT_ENGLISH}
      value={value}
      onChange={setValue}
      label={label}
      placeholder={placeholder}
      maxLength={maxLength}
      disabled={disabled}
      templates={templates}
    />
  );
}
