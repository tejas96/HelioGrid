import type { ItemDraft, ItemDraftEvent, SchemeDraft } from '@heliogrid/domain';
import type { ReactNode } from 'react';
import type { ShellGlyphName } from '../AppShell/ShellGlyph.shapes';
import type { IrisHue } from '../Avatar/Avatar.types';
import type { CatalogItemFormProps, CatalogItemFormWords } from './CatalogItemForm.types';

/**
 * The parts' one contract each (Law 7): both halves of a part implement it. `wide` is the web's
 * alone — the phone draws only the 375 frames — so the web half adds it to the shared shape.
 */

/** The field a refused send lands on: its body path, and the refusal that asks for it. */
export interface FieldFocus {
  readonly path: string | null;
  readonly request: number;
}

export interface ItemCardProps {
  glyph: ShellGlyphName;
  iris: IrisHue;
  title: string;
  /** Beside the title, at its end: the specification's *Your own*. */
  trailing?: ReactNode;
  children?: ReactNode;
}

export interface SheetAcceleratorProps {
  title: string;
  sub: string;
  /** The create is out: the tile is inert until it answers. */
  disabled: boolean;
  onPress: () => void;
}

export interface SchemeSwitchRowProps {
  scheme: string;
  words: { readonly label: string; readonly reference: string | null };
  held: SchemeDraft;
  /** The reference field's words under it, when the gate refused it. */
  error?: string;
  /** `Input`'s `focusRequest` for the reference field. */
  focusRequest?: number;
  /** The create is out: the switch and its reference are inert until it answers. */
  disabled: boolean;
  onChange: (event: ItemDraftEvent) => void;
}

export interface SpecFieldsProps {
  draft: ItemDraft;
  words: CatalogItemFormWords;
  failures: CatalogItemFormProps['failures'];
  focus: FieldFocus;
  /** The create is out: every field and *Add optional values* are inert until it answers. */
  disabled: boolean;
  onChange: (event: ItemDraftEvent) => void;
}

/** The web half's extra fact: the 1536 panel, or the 375 sheet the web draws below it. */
export interface WideProps {
  wide: boolean;
}
