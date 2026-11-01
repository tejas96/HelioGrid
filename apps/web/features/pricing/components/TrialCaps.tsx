import type { DesignPower } from '@heliogrid/data/react';
import type { TierLimit } from '@heliogrid/domain';
import { PRICING } from '@heliogrid/i18n';
import { useTranslate } from '@heliogrid/i18n/react';
import { FactRow, FactRows, Provenance, useFormat } from '@heliogrid/ui';
import { planWords } from '../plan-words';
import { OpenRow } from './OpenRow';

interface TrialCapsProps {
  designPower: DesignPower;
  proposals: TierLimit;
  voiceMinutes: TierLimit;
  storageGb: TierLimit;
  open: boolean;
  /** Absent at 1536, where the caps stand open on `Compared with`'s value edge (`SCR-M12-01`). */
  onToggle?: () => void;
  source: string;
}

/** The trial's caps, the book's data (`BM-41`); what they do not cap reads `Not capped`. */
export function TrialCaps(props: TrialCapsProps) {
  const t = useTranslate();
  const words = planWords(t, useFormat());
  return (
    <div className="hg-pricing-trial">
      <OpenRow
        icon="spark"
        title={t(PRICING.duringTrial)}
        open={props.open}
        onToggle={props.onToggle}
      />
      {props.open ? (
        <div className="hg-pricing-trial__caps">
          <FactRows label={t(PRICING.duringTrial)} density="expressive" form="pair" measure={40}>
            <FactRow label={t(PRICING.biggestDesign)} value={words.power(props.designPower)} />
            <FactRow
              label={t(PRICING.proposals)}
              value={
                props.proposals === 'unlimited'
                  ? t(PRICING.notCapped)
                  : words.limit(props.proposals)
              }
            />
            <FactRow label={t(PRICING.voiceMinutes)} value={words.limit(props.voiceMinutes)} />
            <FactRow label={t(PRICING.storage)} value={words.storage(props.storageGb)} />
          </FactRows>
          <Provenance tier="unmarked" source={props.source} />
        </div>
      ) : null}
    </div>
  );
}
