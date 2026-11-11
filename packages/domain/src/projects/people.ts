import type { RolePreset } from '../authz/roles';

/** Who may manage a project (ruling 2026-11-10): a project manager, or the company's owner. */
export const PROJECT_MANAGER_PRESETS = [
  'project_manager',
  'epc_owner',
] as const satisfies readonly RolePreset[];

/** Who may be on a crew: the installation team, who sees only the jobs it is on (`F2-14`). */
export const PROJECT_CREW_PRESETS = [
  'installation_team_member',
] as const satisfies readonly RolePreset[];

/**
 * The stages a crew is on site for — Dispatched until the electrical work is done: the installer's
 * jobs, and what a crew picker counts as a person's live projects. A project moved back before
 * Dispatched keeps its last crew as the next dispatch's default, but is no one's job.
 *
 * Listed in the order an installer's jobs come: the work under way first — today's job, which a
 * first tick must not push down the list — then a dispatch still to begin.
 */
export const CREW_ON_SITE_STAGES = ['installation', 'electrical_metering', 'dispatched'] as const;

/** How far up an installer's list a job at `stage` comes; a stage off site comes last. */
export function crewJobRank(stage: string): number {
  const at = (CREW_ON_SITE_STAGES as readonly string[]).indexOf(stage);
  return at < 0 ? CREW_ON_SITE_STAGES.length : at;
}
