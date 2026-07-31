import { aliasTokens, colorTokens, dataViz } from '../token-data';
import { Section, Swatch } from './TokenPrimitives';

/** Colour domain: raw swatches, the semantic alias table (the dark value-set drop-in
 *  point), and the Studio data-viz namespace (authored extensions — UI colour is never
 *  data colour). */
export function ColorTokens() {
  return (
    <>
      <Section title="Colour — neutrals, accents, semantic, chart">
        <div className="ds-grid">
          {colorTokens.map((t) => (
            <Swatch key={t.name} t={t} />
          ))}
        </div>
      </Section>

      <Section title="Semantic aliases (dark value-set drop-in point)">
        <div className="ds-table-wrap">
          <table className="ds-table">
            <caption className="sr-only">Semantic alias tokens and their targets</caption>
            <thead>
              <tr>
                <th>alias</th>
                <th>points at</th>
                <th>resolved</th>
              </tr>
            </thead>
            <tbody>
              {aliasTokens.map((t) => (
                <tr key={t.name}>
                  <td className="ds-name">--{t.name}</td>
                  <td className="ds-value">{t.value}</td>
                  <td className="ds-value">{t.resolvedValue}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <Section title="Studio data-viz namespaces (authored extensions — UI colour ≠ data colour)">
        <div className="ds-grid">
          {dataViz.map((t) => (
            <Swatch key={t.name} t={t} />
          ))}
        </div>
      </Section>
    </>
  );
}
