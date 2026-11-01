import type { TranslatedText } from '@heliogrid/contracts';
import { Button } from '@heliogrid/ui';

interface TrialActProps {
  label: TranslatedText;
  line: TranslatedText;
  size: 'lg' | 'md';
  onStart: () => void;
}

/** ONE trial act for the whole page — the trial is tied to no plan (`M12-14`, `M12-52`). */
export function TrialAct({ label, line, size, onStart }: TrialActProps) {
  return (
    <div className="hg-pricing-trial-act">
      <Button variant="primary" size={size} fullWidth={size === 'lg'} onClick={onStart}>
        {label}
      </Button>
      <span className="hg-pricing-trial-act__line">{line}</span>
    </div>
  );
}
