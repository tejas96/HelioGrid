import { elevation, radius, spacing } from '../token-data';
import { Section } from './TokenPrimitives';

/** Layout domain: spacing scale, radius scale, and elevation (shadow) tokens. */
export function LayoutTokens() {
  return (
    <>
      <Section title="Spacing & layout">
        <div className="ds-grid">
          {spacing.map((t) => (
            <div className="ds-swatch" key={t.name}>
              <div
                className="ds-swatch-chip"
                style={{
                  background: 'var(--accent-subtle)',
                  width: `min(100%, var(--${t.name}))`,
                  height: 'var(--sp-3)',
                }}
              />
              <span className="ds-name">--{t.name}</span>
              <span className="ds-value">{t.value}</span>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Radius (expressive · functional · assignments)">
        <div className="ds-grid">
          {radius.map((t) => (
            <div className="ds-swatch" key={t.name}>
              <div
                className="ds-swatch-chip"
                style={{ background: 'var(--canvas-sunken)', borderRadius: t.value }}
              />
              <span className="ds-name">--{t.name}</span>
              <span className="ds-value">{t.value}</span>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Elevation — shadows felt, not seen">
        <div className="ds-elev-grid">
          {elevation.map((t) => (
            <div className="ds-elev" key={t.name} style={{ boxShadow: `var(--${t.name})` }}>
              <span className="ds-name">--{t.name}</span>
            </div>
          ))}
        </div>
      </Section>
    </>
  );
}
