import { Explainer } from '../Explainer/Explainer';
import type { ProfilePreferencesProps } from './ProfilePreferences.types';

/** *About push*, beside the section's heading at both of the web's widths. */
export function AboutPush({ words }: Pick<ProfilePreferencesProps, 'words'>) {
  return (
    <Explainer label={words.push.about.label} pages={words.push.about.line} density="functional" />
  );
}

/** *Why Billing stays on*, beside the locked Billing switch's name. */
export function WhyBilling({ words }: Pick<ProfilePreferencesProps, 'words'>) {
  return (
    <Explainer
      label={words.push.whyBilling.label}
      pages={words.push.whyBilling.line}
      density="functional"
    />
  );
}
