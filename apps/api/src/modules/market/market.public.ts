/**
 * The market module's export surface (apps/api/CLAUDE.md §Local conventions): the module, and
 * the service the publish command drives. The read shape is a contract type, so nothing else
 * needs exporting.
 */
export { MarketModule } from './market.module';
export { MarketPackService, type PublishOutcome } from './market.service';
