import { pairs } from '../token-data';
import { Section } from './TokenPrimitives';

/** Accessibility domain: computed WCAG contrast ratios for every declared token pair — the
 *  build fails below floor, so this table is never eyeballed. */
export function ContrastTokens() {
  return (
    <Section title="Contrast pairs — computed, never eyeballed (build fails below floor)">
      <div className="ds-table-wrap">
        <table className="ds-table">
          <caption className="sr-only">
            Computed WCAG contrast ratios for declared token pairs
          </caption>
          <thead>
            <tr>
              <th>fg / bg</th>
              <th>role</th>
              <th className="ds-num">ratio</th>
              <th className="ds-num">floor</th>
              <th>status</th>
            </tr>
          </thead>
          <tbody>
            {pairs.map((p) => (
              <tr key={`${p.fg}-${p.bg}`}>
                <td className="ds-name">
                  {p.fg} / {p.bg}
                </td>
                <td>
                  {p.role}
                  {p.restriction ? <span className="ds-restricted"> restricted</span> : null}
                </td>
                <td className="ds-num">{p.ratio.toFixed(2)}:1</td>
                <td className="ds-num">{p.floor}</td>
                <td className="ds-pass">{p.passes ? 'pass' : 'FAIL'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Section>
  );
}
