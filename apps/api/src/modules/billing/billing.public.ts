/**
 * The billing module's export surface (apps/api/CLAUDE.md §Local conventions): the module, its
 * services — the billing-state gate, the timers, charge truth, entitlements (the gates' read and support's overrides) and
 * the plan-price sync the publish command runs — and the trial start that signup runs inside its
 * own transaction; the usage ledger, and `meterUsage`, which a producer calls inside its own.
 */
export { startTrial } from './billing.admin.repository';
export { BillingModule } from './billing.module';
export { BillingService } from './billing.service';
export { BillingStateGuard } from './billing-state.guard';
export { ChargeRefused, ChargeService } from './charge.service';
export { EntitlementService } from './entitlement.service';
export { PlanPriceService } from './plan-price.service';
export { UsageService } from './usage.service';
export { type MeteredUnit, meterUsage } from './usage-meter.repository';
