/**
 * The billing module's export surface (apps/api/CLAUDE.md §Local conventions): the module, its
 * service, and the trial start that signup runs inside its own transaction.
 */
export { startTrial } from './billing.admin.repository';
export { BillingModule } from './billing.module';
export { BillingService } from './billing.service';
