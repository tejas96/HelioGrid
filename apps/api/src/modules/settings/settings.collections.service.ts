import type { CollectionsSettings, CollectionsSettingsWrite, PayTo } from '@heliogrid/contracts';
import { availablePaymentModes, isUpiId, minorUnits, upiIdOf } from '@heliogrid/domain';
import { minorUnitsToDecimal, upiRequestUri } from '@heliogrid/domain/server';
import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import type { Act } from '../../common/auth/session-context';
import { ContractException } from '../../common/errors/contract-exception';
import { SettingsCollectionsRepository } from './settings.collections.repository';
import { SettingsService } from './settings.service';

/**
 * How customers pay the company (`SCR-M11-04`): the UPI ID and shown name it keeps here, beside
 * the bank account its business profile already holds — read once, never copied.
 */
@Injectable()
export class SettingsCollectionsService {
  // Explicit tokens: tsx (esbuild) emits no decorator metadata (apps/api/CLAUDE.md landmine).
  constructor(
    @Inject(SettingsCollectionsRepository) private readonly stored: SettingsCollectionsRepository,
    @Inject(SettingsService) private readonly settings: SettingsService,
  ) {}

  /**
   * Where the customer sends money: the UPI ID, the name a UPI app shows, the bank account, and the
   * market's cap on one UPI request.
   */
  async payTo(tenantId: string): Promise<PayTo> {
    return (await this.facts(tenantId)).payTo;
  }

  private async facts(tenantId: string) {
    const [row, profile, pack] = await Promise.all([
      this.stored.read(tenantId),
      this.settings.businessProfile(tenantId),
      this.settings.packOf(tenantId),
    ]);
    const bank = profile.bankDetails;
    const limit = pack.paymentRails.upiRequestLimit ?? null;
    const payTo: PayTo = {
      upiId: row?.upiId ?? null,
      payee: row?.payeeName ?? profile.companyName ?? '',
      bank:
        bank === null
          ? null
          : {
              bankName: bank.bankName,
              accountName: bank.accountName,
              accountNumber: bank.accountNumber,
              routing: bank.bankRoutingIdentifier,
            },
      upiLimit: limit === null ? null : minorUnitsToDecimal(limit, pack.formats.minorUnitDigits),
    };
    return { payTo, row, pack };
  }

  async read(tenantId: string): Promise<CollectionsSettings> {
    const { payTo, row, pack } = await this.facts(tenantId);
    const { currency, minorUnitDigits } = pack.formats;
    return {
      payTo,
      testUri:
        payTo.upiId === null
          ? null
          : upiRequestUri({
              upiId: payTo.upiId,
              payee: payTo.payee,
              amount: minorUnits(10 ** minorUnitDigits),
              fractionDigits: minorUnitDigits,
              currency,
              note: 'HelioGrid test',
            }),
      canEdit: true,
      modes: availablePaymentModes(pack.paymentRails, false).map((mode) => mode.mode),
      lastSaved:
        row === null
          ? null
          : { at: row.savedAt.toISOString(), by: { id: row.savedBy.id, name: row.savedBy.name } },
    };
  }

  async save(
    tenantId: string,
    body: CollectionsSettingsWrite,
    act: Act,
  ): Promise<CollectionsSettings> {
    const upiId = body.upiId === null ? null : upiIdOf(body.upiId);
    if (upiId !== null && !isUpiId(upiId)) {
      throw new ContractException(
        'UPI_ID_MALFORMED',
        'A UPI ID reads as name@bank.',
        HttpStatus.UNPROCESSABLE_ENTITY,
        [{ path: 'upiId', issue: 'A UPI ID reads as name@bank.' }],
      );
    }
    await this.stored.save(tenantId, { upiId, payeeName: body.payee.trim() }, act);
    return this.read(tenantId);
  }
}
