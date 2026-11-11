import { glyphStroke } from '../AppShell/ShellGlyph.logic';
import type { ButtonProps } from '../Button/Button.types';
import type { CardRowOpen } from '../CardRows/CardRows.types';
import type { HueTileSize } from '../HueTile/HueTile.types';
import type { ProjectRowAct, ProjectRowProps } from './ProjectRows.types';

/** The row's open target, named for its customer — or as a customer without a name reads. */
export function rowOpenOf({ name, words, onOpen }: ProjectRowProps): CardRowOpen {
  return { name: words.open(name ?? words.noName), onOpen };
}

/** The row's one act as its button: primary only where the act is the person's next move. */
export function rowActOf(act: ProjectRowAct): Omit<ButtonProps, 'children'> {
  return {
    size: 'sm',
    variant: act.primary ? 'primary' : 'secondary',
    spokenName: act.spoken,
    onClick: act.onPress,
  };
}

/** A kind tile's sides: a hero's 48, a row's 40, a group head's 24 — `HueTile`'s, with its glyph's stroke. */
export const KIND_TILE: Readonly<
  Record<'hero' | 'row' | 'head', { readonly size: HueTileSize; readonly stroke: number }>
> = {
  hero: { size: 48, stroke: glyphStroke('lg') },
  row: { size: 40, stroke: glyphStroke('md') },
  head: { size: 24, stroke: glyphStroke('sm') },
};
