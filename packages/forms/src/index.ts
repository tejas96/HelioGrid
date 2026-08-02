/**
 * @heliogrid/forms — headless form layer (foundation-dx spec §2). Apps import ONLY this
 * package for form state: react-hook-form directly is fenced (dep-cruiser
 * `forms-through-heliogrid-forms` + Biome noRestrictedImports).
 */

export type { Control, FieldErrors, SubmitHandler, UseFormReturn } from 'react-hook-form';
export { Controller, useFieldArray, useWatch } from 'react-hook-form';
/**
 * Ad-hoc client-side schemas use THIS z, never `import { z } from 'zod'` in an app: zod
 * ships dual ESM/CJS, so the app's bundler copy is a DIFFERENT instance from the one
 * `installFormsErrorMap` configures — its defaults would render untranslated (hit
 * 2026-08-02 in the web gallery). Real schemas live in @heliogrid/contracts, whose zod is
 * this same instance.
 */
export { z } from 'zod';
export { applyServerErrors } from './apply-server-errors';
export { installFormsErrorMap } from './error-map';
export { useZodForm } from './use-zod-form';
