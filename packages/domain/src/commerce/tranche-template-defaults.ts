import type { PackLabel } from '../format/languages';
import { type BasisPoints, basisPoints } from '../money/basis-points';
import type { ProjectChainStage } from '../projects/stages';

export interface TrancheLineDefault {
  readonly label: PackLabel;
  readonly share: BasisPoints;
  readonly dueOnStage: ProjectChainStage;
}

export interface TrancheTemplateDefault {
  readonly name: PackLabel;
  readonly lines: readonly TrancheLineDefault[];
}

const ON_SIGNING: PackLabel = {
  en: 'Advance on signing',
  hi: 'हस्ताक्षर पर अग्रिम',
  mr: 'स्वाक्षरीवर आगाऊ रक्कम',
};
/** Demanded once the material is ordered, so nothing ships before it is paid. */
const BEFORE_DISPATCH: PackLabel = { en: 'Before dispatch', hi: 'डिस्पैच से पहले', mr: 'डिस्पॅचपूर्वी' };
const ON_INSTALLATION: PackLabel = { en: 'On installation', hi: 'इंस्टॉलेशन पर', mr: 'इन्स्टॉलेशनवर' };
const ON_COMMISSIONING: PackLabel = { en: 'On commissioning', hi: 'कमीशनिंग पर', mr: 'कमिशनिंगवर' };

/**
 * The two standard splits every tenant starts with (`M01-54` — the source's 10/60/20/10 and
 * 30/60/10), seeded at creation as the tenant's own rows: given, not locked (`SCR-M01-20`). The
 * first is the default. Names and labels in the three launch languages, as the pack's message
 * templates are, because the seed runs on the server and a document reads the row.
 */
export const STANDARD_TRANCHE_TEMPLATES: readonly [TrancheTemplateDefault, TrancheTemplateDefault] =
  [
    {
      name: { en: 'Standard 10/60/20/10', hi: 'मानक 10/60/20/10', mr: 'मानक 10/60/20/10' },
      lines: [
        { label: ON_SIGNING, share: basisPoints(1000), dueOnStage: 'won' },
        { label: BEFORE_DISPATCH, share: basisPoints(6000), dueOnStage: 'material_ordered' },
        { label: ON_INSTALLATION, share: basisPoints(2000), dueOnStage: 'installation' },
        { label: ON_COMMISSIONING, share: basisPoints(1000), dueOnStage: 'commissioned' },
      ],
    },
    {
      name: { en: 'Standard 30/60/10', hi: 'मानक 30/60/10', mr: 'मानक 30/60/10' },
      lines: [
        { label: ON_SIGNING, share: basisPoints(3000), dueOnStage: 'won' },
        { label: BEFORE_DISPATCH, share: basisPoints(6000), dueOnStage: 'material_ordered' },
        { label: ON_COMMISSIONING, share: basisPoints(1000), dueOnStage: 'commissioned' },
      ],
    },
  ];
