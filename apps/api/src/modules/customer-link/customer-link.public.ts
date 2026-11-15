/**
 * The customer-link module's export surface (apps/api/CLAUDE.md §Local conventions): the module,
 * the acceptance proof Mark won and the handover checklist read (`F5-46`, `T-M06-025`), and the
 * registry the projects module binds its customer service to when it starts — so this module
 * reads a won deal's progress without importing the module that reads its proof.
 */
export { CustomerLinkModule } from './customer-link.module';
export {
  type CustomerProjects,
  CustomerProjectsRegistry,
  type LinkHandover,
  type LinkProgress,
  type ProjectPhaseFacts,
} from './customer-link.projects.repository';
export { type AcceptanceProof, acceptanceProofOf } from './customer-link.proof.repository';
