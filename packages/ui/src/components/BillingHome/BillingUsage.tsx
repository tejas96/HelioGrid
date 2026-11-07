import { ShellGlyph } from '../AppShell';
import { Block } from '../Block';
import { Button } from '../Button';
import { Provenance } from '../Provenance';
import { UsageMeter } from '../UsageMeter';
import type { BillingHomeWords, BillingUsageView } from './BillingHome.types';

/**
 * `Usage this cycle`: `SCR-M12-04`'s meters nearest their limits, each in its own small glass tile
 * side by side, `All usage` at the region's head, and the two source lines at its foot.
 */
export function BillingUsage({
  usage,
  words,
  onAllUsage,
}: {
  usage: BillingUsageView;
  words: BillingHomeWords;
  /** Absent while another act's answer is out: the route waits. */
  onAllUsage: (() => void) | undefined;
}) {
  return (
    <Block
      title={words.usageThisCycle}
      density="expressive"
      action={
        <Button
          variant="ghost"
          size="sm"
          iconRight={<ShellGlyph name="chevron-right" size="sm" />}
          onClick={onAllUsage}
          disabled={onAllUsage === undefined}
        >
          {words.allUsage}
        </Button>
      }
      footer={
        <span className="hg-billing-sources">
          {usage.sources.map((source) => (
            <Provenance key={source} source={source} size={12} />
          ))}
        </span>
      }
    >
      <div className="hg-billing-meters">
        {usage.meters.map((meter) => (
          <UsageMeter
            key={meter.key}
            className="hg-billing-meter"
            density="expressive"
            form="tile"
            glyph={meter.glyph}
            label={meter.label}
            words={words.usageMeter}
            value={meter.value}
            limit={meter.limit}
            unit={meter.unit ?? undefined}
          />
        ))}
      </div>
    </Block>
  );
}
