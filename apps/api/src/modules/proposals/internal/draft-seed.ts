import { type EditProposal } from '@heliogrid/contracts';
import { type MarketPack, PROPOSAL_LIMITS, type ProposalFieldSet } from '@heliogrid/domain';
import { newDraftFieldSet } from '@heliogrid/domain/server';
import { HttpStatus } from '@nestjs/common';
import { ContractException } from '../../../common/errors/contract-exception';
import { type AssemblyContext } from '../proposals.assembler.service';

/*
 * What a draft starts from and the one limit its components keep (`T-M06-027`, `M06-27`).
 */

/** The figures a commit stores name no person: the cover's "Prepared by" is not one of them. */
export const nobody = { userId: '', name: '', phoneE164: null };

/** A new draft, filled from the company's templates and the market's starting figures (`T-M06-027`). */
export function seededFieldSet(
  context: AssemblyContext,
  segment: Parameters<typeof newDraftFieldSet>[0]['segment'],
): ProposalFieldSet {
  const { pack, settings } = context;
  return newDraftFieldSet({
    settings: settings.inForce,
    coverPicture: settings.coverPicture,
    typicalSystemKwp: settings.inForce.companyIdentity.value.typicalSystemKwp,
    subsidy: pack.subsidy,
    supplyRates: supplyRatesOf(pack),
    market: pack.formats.proposal ?? null,
    segment,
  });
}

const supplyRatesOf = (pack: MarketPack) => pack.tax.systemSupplyRates;

/** A section holds one to three brands (`M06-27`): a fourth is refused with the limit stated. */
export function refuseTooManyBrands(
  components: NonNullable<EditProposal['fields']>['components'],
): void {
  if (components === undefined) return;
  const perCategory = new Map<string, number>();
  for (const line of components) {
    perCategory.set(line.category, (perCategory.get(line.category) ?? 0) + 1);
  }
  const limit = PROPOSAL_LIMITS.brandsPerCategory;
  for (const [category, held] of perCategory) {
    if (held > limit) {
      throw new ContractException(
        'DOMAIN_RULE_VIOLATION',
        `A section holds up to ${limit} brands.`,
        HttpStatus.UNPROCESSABLE_ENTITY,
        [{ path: 'fields.components', issue: `at most ${limit} brands in ${category}` }],
      );
    }
  }
}
