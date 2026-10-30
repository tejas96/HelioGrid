/**
 * The billing notices' export surface (apps/api/CLAUDE.md §Local conventions): the module alone,
 * which `AppModule` imports. Apart from `billing.public.ts` on purpose: the notices reach
 * `SettingsModule`, which reaches `FileModule`, which reaches `billing.public.ts` — one surface for
 * both would close an import cycle.
 */
export { BillingNoticeModule } from './billing-notice.module';
