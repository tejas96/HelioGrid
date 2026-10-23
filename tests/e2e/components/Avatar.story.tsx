import { AvatarGroup, ShellGlyph } from '@heliogrid/ui';

/**
 * Design-system change 18 as the grant card draws it (`SCR-M01-13`): things as glyph discs, in a
 * group whose ring takes the tinted ground it sits on. `discs` glyphs, four shown, then *+N*.
 */
export function GlyphGroupOnTint({ discs }: { discs: number }) {
  const glyphs = ['search', 'palette', 'house', 'wallet', 'package', 'megaphone'] as const;
  return (
    <div style={{ background: 'var(--accent-subtle)', padding: 'var(--sp-4)' }}>
      <AvatarGroup
        people={glyphs.slice(0, discs).map((name) => ({
          name,
          glyph: <ShellGlyph name={name} size="sm" tone="accent" />,
        }))}
        size={36}
        max={4}
        ring="var(--accent-subtle)"
      />
    </div>
  );
}
