import type { CreateTenant } from '@heliogrid/contracts';
import { COMPANY_SIGNUP } from '@heliogrid/i18n';
import { useTranslate } from '@heliogrid/i18n/react';
import { Text } from '@heliogrid/ui';

/**
 * The three values while they are being written (`SCR-M01-02`, the loading state): facts rather
 * than fields for the moment, never greyed-out inputs — disabled grey is the one colour that may
 * not carry a word a person is checking. A value is the system's `h4`, as ruled on the phone.
 */
export function CompanyFacts({ values }: { values: CreateTenant }) {
  const t = useTranslate();
  const rows = [
    [t(COMPANY_SIGNUP.companyName), values.companyName],
    [t(COMPANY_SIGNUP.yourName), values.ownerName],
    [t(COMPANY_SIGNUP.city), values.city],
  ] as const;
  return (
    <div className="hg-signup-facts">
      {rows.map(([label, value]) => (
        <div key={label} className="hg-signup-fact">
          <Text variant="caption" color="secondary">
            {label}
          </Text>
          <Text variant="h4">{value}</Text>
        </div>
      ))}
    </div>
  );
}
