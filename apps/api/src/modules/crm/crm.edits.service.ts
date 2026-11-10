import type { EditLead, LeadDetail } from '@heliogrid/contracts';
import { minorUnitsOfDecimal } from '@heliogrid/domain';
import { HttpStatus, Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { Act } from '../../common/auth/session-context';
import { ContractException } from '../../common/errors/contract-exception';
import { SettingsService } from '../settings/settings.public';
import { CrmEditsRepository } from './crm.edits.repository';
import { moneyOf } from './internal/lead-wire';
import type { LeadReader } from './internal/reader';

/**
 * Lead edits (`M02-36`, `M02-39`): each field saves alone as it is answered, per-field last writer
 * wins by the server's apply order, and every applied change is on the timeline (`F4-16`).
 */
@Injectable()
export class CrmEditsService {
  // Explicit tokens: tsx (esbuild) emits no decorator metadata (apps/api/CLAUDE.md landmine).
  constructor(
    @Inject(CrmEditsRepository) private readonly edits: CrmEditsRepository,
    @Inject(SettingsService) private readonly settings: SettingsService,
  ) {}

  async edit(reader: LeadReader, leadId: string, body: EditLead, act: Act): Promise<LeadDetail> {
    const money = moneyOf((await this.settings.packOf(reader.tenantId)).formats);
    if (body.monthlyBill != null) refuseFinerThanCurrency(body.monthlyBill, money.minorUnitDigits);
    const { capturedAt, ...fields } = body;
    const detail = await this.edits.edit(reader, leadId, fields, new Date(capturedAt), money, act);
    if (detail === null) throw new NotFoundException('No such lead.');
    return detail;
  }
}

/** A bill finer than the currency's smallest unit is refused on its field, never rounded. */
function refuseFinerThanCurrency(amount: string, digits: number): void {
  try {
    minorUnitsOfDecimal(amount, digits);
  } catch {
    throw new ContractException(
      'DOMAIN_RULE_VIOLATION',
      'The bill has more decimal places than your currency.',
      HttpStatus.UNPROCESSABLE_ENTITY,
      [{ path: 'monthlyBill', issue: `at most ${digits} decimal places` }],
    );
  }
}
