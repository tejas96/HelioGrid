import { designMountSchema, designStatusSchema } from '@heliogrid/contracts';

/** The design studio's pg enums (migration 0071) → the contract schema each must match, exactly. */
export const STUDIO_ENUMS: Record<string, { options: readonly string[]; contract: string }> = {
  design_mount: { options: designMountSchema.options, contract: 'designMountSchema' },
  design_status: { options: designStatusSchema.options, contract: 'designStatusSchema' },
};
