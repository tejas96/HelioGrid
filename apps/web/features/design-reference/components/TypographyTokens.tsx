import { TYPE_ROLES } from '../constants';
import { fontsTypo } from '../token-data';
import { Ext, Section } from './TokenPrimitives';

/** Typography domain: live font samples, the type scale by role, and the raw font/type
 *  token table. */
export function TypographyTokens() {
  return (
    <>
      <Section title="Fonts in use">
        <div className="ds-row" style={{ fontFamily: 'var(--font-sans)' }}>
          <span>Geist — The quick brown fox jumps over 39 solar panels.</span>
        </div>
        <div className="ds-row" style={{ fontFamily: 'var(--font-mono)' }}>
          <span>Geist Mono — ₹4,52,471 · 221 panels · 96.8 kWp · +91 98765 43210</span>
        </div>
        <div className="ds-row" style={{ fontFamily: 'var(--font-sans)' }}>
          <span lang="hi">
            Devanagari (Noto Sans Devanagari, extension) — प्रस्ताव तैयार है: ₹4,52,471 · सौर ऊर्जा
            प्रणाली 5.2 kWp
          </span>
        </div>
      </Section>

      <Section title="Typography scale">
        {TYPE_ROLES.map((role) => (
          <div className="ds-row" key={role}>
            <span className="ds-name" style={{ minWidth: '8rem' }}>
              {role}
            </span>
            <span
              style={{
                fontSize: `var(--fs-${role})`,
                lineHeight: `var(--lh-${role}, 1.2)`,
                letterSpacing: `var(--tr-${role}, 0)`,
                fontWeight: role === 'overline' ? 'var(--fw-bold)' : 'var(--fw-medium)',
                textTransform: role === 'overline' ? 'uppercase' : 'none',
              }}
            >
              {role === 'overline' ? 'SITE SURVEY' : 'Solar proposal ₹4,52,471 · 5.2 kWp'}
            </span>
          </div>
        ))}
      </Section>

      <Section title="Fonts & typography tokens">
        <div className="ds-table-wrap">
          <table className="ds-table">
            <caption className="sr-only">Font and typography token values</caption>
            <thead>
              <tr>
                <th>token</th>
                <th>value</th>
              </tr>
            </thead>
            <tbody>
              {fontsTypo.map((t) => (
                <tr key={t.name}>
                  <td className="ds-name">
                    --{t.name}
                    <Ext t={t} />
                  </td>
                  <td className="ds-value">{t.value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>
    </>
  );
}
