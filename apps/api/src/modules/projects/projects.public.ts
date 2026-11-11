/**
 * The projects module's export surface (apps/api/CLAUDE.md §Local conventions): the module, and
 * the scope predicate the files module asks whether a person may see a project's papers.
 */
export { ProjectsModule } from './projects.module';
export { projectReadableBy, projectScopeWhere } from './projects.scope.repository';
