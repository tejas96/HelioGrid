import { Inject, Injectable } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';

/**
 * The internal alerts platform billing raises (`M12-09`, `M12-13`). Each is one `error` log line
 * carrying a fixed `alert` field, which the alert rule in
 * `docs/engineering/09-observability-and-ops.md` matches — so renaming a kind silences its rule.
 *
 * - `billing_repair` — the reconcile found a charge the charge path had not recorded: drift,
 *   repaired. Reconciliation is supposed to be boring; each one is looked at.
 * - `billing_dead_charge` — money landed on a subscription no charge moves.
 * - `billing_charge_refused` — the gateway collected money no subscription can take (another
 *   currency, an unknown subscription). Acknowledged to the gateway, so it is never retried.
 * - `billing_cancelled_mandate` — a company converted on a monthly mandate that a new pick was
 *   cancelling at the same moment: this period is paid. The cancel may or may not have landed,
 *   so the mandate's live status at the gateway is read before a new one is set up.
 * - `billing_pause_event` — the gateway paused or resumed a subscription; the product offers no
 *   pause, so it is never applied.
 * - `billing_invoice_mismatch` — a payment's invoice states a total the gateway did not collect:
 *   its plan object and its price row drifted. The invoice stands; the team looks.
 */
const alertMessages = {
  billing_repair: 'the reconcile recorded a charge the gateway message never delivered',
  billing_dead_charge: 'a charge landed on a subscription no charge moves',
  billing_charge_refused: 'the gateway collected a charge no subscription can take',
  billing_cancelled_mandate:
    'a company converted on a mandate a new pick was cancelling; check at the gateway whether it still renews',
  billing_pause_event: 'the gateway paused or resumed a subscription; not applied',
  billing_invoice_mismatch: 'a payment was invoiced at a total the gateway did not collect',
} as const;

export type BillingAlert = keyof typeof alertMessages;

/** What an alert names: ids and references only, never a person's details. */
export type AlertFacts = Readonly<Record<string, string | number | null>>;

@Injectable()
export class BillingAlerts {
  // Explicit token: tsx (esbuild) emits no decorator metadata (apps/api/CLAUDE.md landmine).
  constructor(@Inject(PinoLogger) private readonly logger: PinoLogger) {
    this.logger.setContext(BillingAlerts.name);
  }

  raise(alert: BillingAlert, facts: AlertFacts): void {
    this.logger.error({ ...facts, alert }, alertMessages[alert]);
  }
}
