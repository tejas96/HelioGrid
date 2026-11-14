/**
 * The projects module's export surface (apps/api/CLAUDE.md §Local conventions): the module, the
 * scope predicate the files module asks whether a person may see a project's papers, and Money
 * due's reader and sums — the owner dashboard's cash is those very figures (`M13-16`) — and the
 * won deal's project as the customer's link reads it (`F5-61`…`F5-73`).
 */
export { type ProjectReader, projectReaderOf } from './internal/reader';
export type { ProjectPhaseFacts } from './projects.customer.repository';
export {
  type CustomerProgress,
  type CustomerSolarFile,
  ProjectsCustomerService,
} from './projects.customer.service';
export { ProjectsModule } from './projects.module';
export { ProjectsPaymentsService } from './projects.payments.service';
export { collectedIn } from './projects.payments-read.repository';
export { projectReadableBy, projectScopeWhere } from './projects.scope.repository';
