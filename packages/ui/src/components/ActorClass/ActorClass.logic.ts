import type { ShellGlyphName } from '../AppShell/AppShell.types';
import type { ActorGlyphName } from './ActorClass.types';

/** The outline each glyph draws. `agent` keeps the cog both halves drew for it before, so the table is total. */
export const ACTOR_GLYPH: Record<ActorGlyphName, ShellGlyphName> = {
  user: 'user',
  cog: 'cog',
  customer: 'chat',
  agent: 'cog',
};
