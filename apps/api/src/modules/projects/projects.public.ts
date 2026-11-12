/**
 * The projects module's export surface (apps/api/CLAUDE.md §Local conventions): the module, the
 * scope predicate the files module asks whether a person may see a project's papers, and Money
 * due's reader and sums — the owner dashboard's cash is those very figures (`M13-16`).
 */
export { type ProjectReader, projectReaderOf } from './internal/reader';
export { ProjectsModule } from './projects.module';
export { ProjectsPaymentsService } from './projects.payments.service';
export { collectedIn } from './projects.payments-read.repository';
export { projectReadableBy, projectScopeWhere } from './projects.scope.repository';
