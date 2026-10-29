import type { TranslatedText } from '@heliogrid/contracts';
import type { ReactNode } from 'react';

/**
 * One section of a settings page at desktop width (`SCR-SHELL-01`, *More: the settings list*): a
 * card holding a title row and rows of label and control, split by hairlines, the page one column
 * of these at most 760 px wide. The phone lays a settings page out on the open page instead.
 */
export interface SettingsSectionProps {
  /** The section's name, its heading. */
  title: TranslatedText;
  /** Beside the title — the section's `Explainer`. */
  titleAside?: ReactNode;
  /** The rows: `SettingsSectionRow`s, or a `ListRow` drawn flat on the card. */
  children: ReactNode;
}

/**
 * The settings page's raised white card (`SCR-SHELL-01`): a page ground over the page, its look
 * drawn here once — `SettingsSection` stands on it, and so does the phone's account card.
 */
export interface SettingsCardProps {
  children: ReactNode;
}

/** One row of a `SettingsSection`: what is set on the left, the control that sets it on the right. */
export interface SettingsSectionRowProps {
  /** What the row sets. With `controlId`, the label names that control. */
  label: ReactNode;
  /** Beside the label — an `Explainer` for this row. */
  labelAside?: ReactNode;
  /** One quiet line under the label — where the value comes from. */
  caption?: ReactNode;
  /** The control, at the row's end. */
  control?: ReactNode;
  /** Web: the id of the control the label names (`<label for>`). */
  controlId?: string;
}
