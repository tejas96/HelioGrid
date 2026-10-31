/**
 * The ONE entry the workflow bundle is built from (`scripts/build-workflow-bundle.mjs`): every
 * area's workflows, re-exported. Temporal resolves a workflow by exported name across the whole
 * bundle, so an area left out here starts, then fails every task with no type error.
 */
export * from './modules/billing/billing.workflows';
export * from './modules/catalog/catalog.workflows';
export * from './modules/documents/documents.workflows';
export * from './modules/outbox/outbox.workflows';
export * from './modules/platform/platform.workflows';
export * from './modules/team/team.workflows';
export * from './modules/usage/usage.workflows';
