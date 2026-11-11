import { Pressable } from '../../primitives/Pressable';
import { ShellGlyph } from '../AppShell/ShellGlyph';
import type { FileLinkProps } from './FileLink.types';
import './FileLink.css';

/** One file by its own name, a sheet glyph before it — the target opens it. */
export function FileLink({ name, onOpen }: FileLinkProps) {
  return (
    <Pressable
      className="hg-file-link"
      accessibilityRole="button"
      accessibilityLabel={name}
      ripple="bounded"
      onPress={onOpen}
    >
      <ShellGlyph name="file" size="sm" tone="accent" />
      <span className="hg-file-link-name">{name}</span>
    </Pressable>
  );
}
