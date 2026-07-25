import contrastPairs from '@heliogrid/tokens/contrast.pairs.json';
import tokensJson from '@heliogrid/tokens/tokens.json';
import './design.css';

/**
 * The living token reference (docs/10 §6): generated from dist/tokens.json — a new token
 * appears automatically; an unrendered token is impossible. "Add a token → it renders at
 * /design or nobody can verify it."
 */

interface TokenRow {
  name: string;
  value: string;
  resolvedValue?: string;
  sourceFile: string;
  kindHint: string | null;
  extension: boolean | string;
}

const tokens = tokensJson.tokens as TokenRow[];
const byFile = (f: string) => tokens.filter((t) => t.sourceFile === f);
const byPrefix = (p: string) => tokens.filter((t) => t.name.startsWith(p));

const isColor = (t: TokenRow) =>
  /^#|^rgba|^linear-gradient|^radial-gradient/.test(t.resolvedValue ?? t.value);

const TYPE_ROLES = [
  'display',
  'h1',
  'h2',
  'h3',
  'h4',
  'body-lg',
  'body',
  'body-sm',
  'caption',
  'overline',
  'button',
  'table',
];

function Ext({ t }: { t: TokenRow }) {
  return t.extension ? <span className="ds-ext">extension</span> : null;
}

function Swatch({ t }: { t: TokenRow }) {
  return (
    <div className="ds-swatch">
      <div className="ds-swatch-chip" style={{ background: t.resolvedValue ?? t.value }} />
      <span className="ds-name">
        --{t.name}
        <Ext t={t} />
      </span>
      <span className="ds-value">{t.value}</span>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="ds-section">
      <h2 className="hg-overline">{title}</h2>
      {children}
    </section>
  );
}

export default function DesignReference() {
  const colorTokens = tokens.filter(
    (t) => (t.sourceFile === 'colors.css' && isColor(t)) || t.name.startsWith('brand-'),
  );
  const aliasTokens = byFile('colors.css').filter((t) => !isColor(t));
  const dataViz = [
    ...byPrefix('data-roof-'),
    ...byPrefix('data-string-'),
    ...byPrefix('data-scale-'),
  ];
  const spacing = byFile('spacing.css');
  const radius = byFile('radius.css');
  const motion = byFile('motion.css');
  const fontsTypo = [...byFile('fonts.css'), ...byFile('typography.css')];
  const pairs = contrastPairs.pairs as Array<{
    fg: string;
    bg: string;
    role: string;
    floor: number;
    ratio: number;
    passes: boolean;
    restriction?: string;
  }>;

  return (
    <main className="ds-page">
      <header>
        <p className="hg-overline">HelioGrid design reference</p>
        <h1 className="hg-h1">
          Every token, generated from design/ds-source — {tokens.length} tokens,{' '}
          {tokens.filter((t) => t.extension).length} marked extensions
        </h1>
        <p className="hg-muted">
          Source: {tokensJson.$source} · generator: {tokensJson.$generator}. Light-only v1 (ruling
          A). Never hand-transcribed; the manifest is untrusted for values.
        </p>
      </header>

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
          {byFile('elevation.css').map((t) => (
            <div className="ds-elev" key={t.name} style={{ boxShadow: `var(--${t.name})` }}>
              <span className="ds-name">--{t.name}</span>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Motion">
        <div className="ds-table-wrap">
          <table className="ds-table">
            <caption className="sr-only">Motion duration and easing tokens</caption>
            <thead>
              <tr>
                <th>token</th>
                <th>value</th>
              </tr>
            </thead>
            <tbody>
              {motion.map((t) => (
                <tr key={t.name}>
                  <td className="ds-name">--{t.name}</td>
                  <td className="ds-value">{t.value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="ds-value">
          prefers-reduced-motion collapses durations to:{' '}
          {tokensJson.reducedMotionOverrides.map((o) => `--${o.name}:${o.value}`).join(' · ')} —
          overrides only, never base values.
        </p>
      </Section>

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
    </main>
  );
}
