import { Text } from '../../primitives/Text/Text';
import type { SignupFactsProps } from './SignupCompanyStep.types';

/** A value is the system's `h4`, as ruled on the phone. */
export function SignupFacts({ facts }: SignupFactsProps) {
  return (
    <div className="hg-signup-facts">
      {facts.map(({ label, value }) => (
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
