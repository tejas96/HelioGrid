import type { RoleKind, TeamRowStatus } from '@heliogrid/domain';
import type { IrisHue } from '../Avatar/Avatar.types';
import type { BadgeTone } from './Chip.types';

/**
 * A role label's tone is its kind's iris hue (design-system change 7): violet sells and leads,
 * blue plans and runs, magenta works on site. A `Record` over every kind, so a new kind fails
 * typecheck until it is given a hue.
 */
export const ROLE_KIND_TONE: Record<RoleKind, IrisHue> = {
  sell: 'violet',
  plan: 'blue',
  site: 'magenta',
};

/**
 * A team row's standing as a tone — the Status badge's and the Avatar `mark`'s alike, so the dot
 * on a face and the word beside it can never disagree (`SCR-M01-12`).
 */
export const TEAM_STATUS_TONE: Record<
  TeamRowStatus,
  Extract<BadgeTone, 'info' | 'warning' | 'success' | 'neutral'>
> = {
  invited: 'info',
  expired: 'warning',
  active: 'success',
  deactivated: 'neutral',
};
