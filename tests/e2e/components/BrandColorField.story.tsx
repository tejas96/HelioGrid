import { BrandColorField } from '@heliogrid/ui';
import { useState } from 'react';
import { BRAND_COLOUR_WORDS } from '../support/brand-colour-words';

/**
 * The colour field as `SCR-M01-18` mounts it beside the live preview: the words hold functions
 * the field calls while it renders, and the colour lives here, in the browser, arriving only
 * through `onChange` — a value handed to `mount` never changes.
 */
export function HeldBrandColorField({
  initial,
  specimen = false,
}: {
  initial: string;
  specimen?: boolean;
}) {
  const [value, setValue] = useState(initial);
  return (
    <BrandColorField
      words={BRAND_COLOUR_WORDS}
      value={value}
      onChange={setValue}
      companyName="E2E Branding"
      helper=""
      specimen={specimen}
      verdict="short"
      density="functional"
    />
  );
}
