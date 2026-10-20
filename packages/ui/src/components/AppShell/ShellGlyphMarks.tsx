import { glyphMarks, markKey, type ShellGlyphMarksProps } from './ShellGlyph.logic';

/**
 * One named glyph's marks with no box: the `<svg>` that holds them sets the size, the stroke and
 * the colour, and every mark takes them from it.
 */
export function ShellGlyphMarks({ name, filled = false }: ShellGlyphMarksProps) {
  return (
    <>
      {glyphMarks(name, filled).marks.map((mark) => {
        if (mark.kind === 'path') return <path key={markKey(mark)} d={mark.d} />;
        if (mark.kind === 'circle') {
          return <circle key={markKey(mark)} cx={mark.cx} cy={mark.cy} r={mark.r} />;
        }
        return (
          <rect
            key={markKey(mark)}
            x={mark.x}
            y={mark.y}
            width={mark.width}
            height={mark.height}
            rx={mark.rx}
          />
        );
      })}
    </>
  );
}
