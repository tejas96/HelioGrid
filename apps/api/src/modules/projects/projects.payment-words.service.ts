import { formatMoney } from '@heliogrid/domain';
import { paymentDueNotice } from '@heliogrid/i18n';
import { Inject, Injectable } from '@nestjs/common';
import { renderedInEveryLanguage } from '../notification/notification.public';
import { SettingsService } from '../settings/settings.public';
import type { PaymentNoticeWords } from './projects.payment-notices.repository';

/**
 * The words and the money format every money notice of one company is written with — its
 * market's currency and grouping, its quiet hours — gathered before a transaction opens.
 */
@Injectable()
export class ProjectsPaymentWordsService {
  // Explicit token: tsx (esbuild) emits no decorator metadata (apps/api/CLAUDE.md landmine).
  constructor(@Inject(SettingsService) private readonly settings: SettingsService) {}

  async wordsOf(tenantId: string): Promise<PaymentNoticeWords> {
    const [pack, quietHours] = await Promise.all([
      this.settings.packOf(tenantId),
      this.settings.quietHoursOf(tenantId),
    ]);
    const formats = pack.formats;
    return {
      due: (name, part, amount) =>
        renderedInEveryLanguage((t) => paymentDueNotice(t, { name, part, amount })),
      amountOf: (decimal) => formatMoney(formats, decimal),
      format: {
        currency: formats.currency,
        digits: formats.minorUnitDigits,
        timeZone: quietHours.timezone,
      },
      quietHours,
    };
  }
}
