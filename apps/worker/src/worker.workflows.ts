/**
 * The ONE entry the workflow bundle is built from (`scripts/build-workflow-bundle.mjs`): every
 * area's workflows, re-exported. Temporal resolves a workflow by exported name across the whole
 * bundle, so an area left out here starts, then fails every task with no type error.
 */
export * from './modules/outbox/outbox.workflows';
export * from './modules/platform/platform.workflows';
