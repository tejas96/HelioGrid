import type { RolePreset } from '../authz/roles';

/**
 * The preset-precedence ladder (`M13-10`), widest decision surface first: All-scope, then
 * Team/Portfolio, then the own-scope working presets, then the assigned-only execution presets.
 * ORDER IS THE SPEC — a person's home is the home of their highest-rung held preset, so moving a
 * rung moves every multi-role person's front door; a re-order is a commit, never configuration.
 * `tests/shell/home.test.ts` holds every preset to exactly one rung.
 */
export const HOME_LADDER = [
  'epc_owner',
  'sales_manager',
  'operations',
  'project_manager',
  'marketing',
  'finance',
  'hr_admin',
  'sales_executive',
  'design_engineer',
  'survey_engineer',
  'field_technician',
  'installation_team_member',
] as const satisfies readonly RolePreset[];

/**
 * Which body of work is the home's own and which are composed into it — the shell's view-model
 * (Law 11). `composed` names PRESETS, never content: each block is its module's own read and
 * component, placed by the shell (`M13-11`), so nothing here can alter a block.
 */
export interface ComposedHome {
  readonly home: RolePreset;
  readonly composed: readonly RolePreset[];
}

/**
 * The held presets, each once, in ladder order — the switcher's list (`M13-10`). A function of
 * the SET alone (F2-15): the order a token or a row typed them in never shows through.
 */
export function homesOf(held: Iterable<RolePreset>): RolePreset[] {
  const holds = new Set(held);
  return HOME_LADDER.filter((preset) => holds.has(preset));
}

/** The home in force at sign-in: the highest-rung held preset; `null` when nothing is held. */
export function homeFor(held: Iterable<RolePreset>): RolePreset | null {
  const [highest] = homesOf(held);
  return highest ?? null;
}

/**
 * The home in force and the presets composed inside it. `chosen` is the switcher's pick for this
 * session — never stored (`M13-09`); one no longer held falls back to the ladder, never a blank.
 */
export function composedHome(
  held: Iterable<RolePreset>,
  chosen: RolePreset | null = null,
): ComposedHome | null {
  const homes = homesOf(held);
  const home = chosen !== null && homes.includes(chosen) ? chosen : homeFor(homes);
  if (home === null) return null;
  return { home, composed: homes.filter((preset) => preset !== home) };
}

/**
 * The presets whose home block is their module's own part, which the home draws itself instead of
 * a waiting block: the installer's job (`SCR-M08-05`, `M08-45`) and Finance's money due
 * (`SCR-M11-01`, `M11-54`).
 */
export const MODULE_HOME_BLOCKS = [
  'installation_team_member',
  'finance',
] as const satisfies readonly RolePreset[];

/**
 * Whether the home shows Money due (`SCR-M11-01`): Finance's own home block, and the owner's —
 * who answers for the money until the owner's dashboard lands (ruling 2026-11-12).
 */
export function showsMoneyDue(home: ComposedHome | null): boolean {
  return (
    home !== null &&
    [home.home, ...home.composed].some((preset) => preset === 'finance' || preset === 'epc_owner')
  );
}

/** Whether the home in force, or a home composed into it, is the installer's job. */
export function showsInstallerJob(home: ComposedHome | null): boolean {
  return home !== null && [home.home, ...home.composed].includes('installation_team_member');
}

/** The home's blocks still waiting for their module: every preset whose block is not drawn yet. */
export function waitingHomeBlocks(home: ComposedHome): readonly RolePreset[] {
  const drawn: readonly RolePreset[] = MODULE_HOME_BLOCKS;
  return [home.home, ...home.composed].filter((preset) => !drawn.includes(preset));
}
