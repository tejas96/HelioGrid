import {
  CATALOG_AVAILABILITY,
  CATALOG_PROVENANCE_LABELS,
  COMPONENT_KINDS,
  RELEASE_CHANGE_KINDS,
} from '@heliogrid/domain';
import { z } from 'zod';

/**
 * The catalog's closed sets (`T-M01-027`), derived from domain's tuples and mirrored as pgEnums
 * (invariant `enum-parity`). The routes land with part b; these are what the migration's enums
 * are held equal to.
 */

/** What a catalog item is (`M01-45`). */
export const componentKindSchema = z.enum(COMPONENT_KINDS);
export type ComponentKind = z.infer<typeof componentKindSchema>;

/** Where an item's specs came from (`M01-35`) — never a statement about a price. */
export const catalogProvenanceSchema = z.enum(CATALOG_PROVENANCE_LABELS);
export type CatalogProvenanceLabel = z.infer<typeof catalogProvenanceSchema>;

/** Whether a platform item can be bought now (`S5.wrong.4`). */
export const catalogAvailabilitySchema = z.enum(CATALOG_AVAILABILITY);
export type CatalogAvailability = z.infer<typeof catalogAvailabilitySchema>;

/** What one release line says about one item (`M01-43`). */
export const releaseChangeKindSchema = z.enum(RELEASE_CHANGE_KINDS);
export type ReleaseChangeKind = z.infer<typeof releaseChangeKindSchema>;
