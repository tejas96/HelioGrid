import type {
  CatalogReleaseLineWire,
  CatalogReleaseSideWire,
  CatalogReleaseWire,
} from '@heliogrid/contracts';
import type { CatalogReleaseSnapshot } from '@heliogrid/domain';
import { minorUnitsToDecimal } from '@heliogrid/domain/server';
import type { ReleaseHead, ReleaseLine } from '../catalog.release-reads.repository';

export function releaseWire(head: ReleaseHead): CatalogReleaseWire {
  return { ...head, publishedAt: head.publishedAt.toISOString(), counts: { ...head.counts } };
}

export function releaseLineWire(
  line: ReleaseLine,
  minorUnitDigits: number,
): CatalogReleaseLineWire {
  return {
    ...line,
    item: { ...line.item },
    before: line.before === null ? null : sideWire(line.before, minorUnitDigits),
    after: sideWire(line.after, minorUnitDigits),
  };
}

/** One side as stored, its rate's amount scaled to the currency's digits like every wire amount. */
function sideWire(side: CatalogReleaseSnapshot, minorUnitDigits: number): CatalogReleaseSideWire {
  const rate =
    side.rate === null
      ? null
      : {
          amount: minorUnitsToDecimal(side.rate.amount, minorUnitDigits),
          currencyCode: side.rate.currency,
          effectiveOn: side.rate.effectiveOn,
        };
  if (side.kind === 'override') return { ...side, rate };
  return { ...side, certifications: [...side.certifications], rate };
}
