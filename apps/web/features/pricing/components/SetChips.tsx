import type { TranslatedText } from '@heliogrid/contracts';
import { PRICING_SETS, type PricingSet } from '@heliogrid/data/react';
import { PRICING } from '@heliogrid/i18n';
import { useTranslate } from '@heliogrid/i18n/react';
import { FilterChips } from '@heliogrid/ui';
import type { ReactNode } from 'react';

const SET_WORDS = {
  limits: PRICING.setLimits,
  included: PRICING.setIncluded,
  charges: PRICING.setCharges,
} satisfies Record<PricingSet, unknown>;

interface SetChipsProps {
  value: PricingSet;
  onChange: (set: PricingSet) => void;
}

/** `Show` — which set the comparison carries; the figures swap in place, nothing moves. */
export function SetChips({ value, onChange }: SetChipsProps) {
  const t = useTranslate();
  return (
    <ChipField label={t(PRICING.show)}>
      <FilterChips
        label={t(PRICING.show)}
        value={value}
        onChange={(next) => onChange(PRICING_SETS.find((set) => set === next) ?? value)}
        options={PRICING_SETS.map((set) => ({ value: set, label: t(SET_WORDS[set]) }))}
      />
    </ChipField>
  );
}

/** A chip strip with its name above it, directly over what it changes. */
export function ChipField({ label, children }: { label: TranslatedText; children: ReactNode }) {
  return (
    <div className="hg-pricing-chips">
      <span className="hg-pricing-chips__label">{label}</span>
      {children}
    </div>
  );
}
