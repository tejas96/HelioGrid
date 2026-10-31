/**
 * The invoice PDF's export surface (apps/api/CLAUDE.md §Local conventions): the module alone,
 * which `AppModule` imports. Apart from `billing.public.ts` on purpose: it reaches `FileModule`,
 * which reaches `billing.public.ts` — one surface for both would close an import cycle.
 */
export { InvoiceDocumentModule } from './invoice-document.module';
