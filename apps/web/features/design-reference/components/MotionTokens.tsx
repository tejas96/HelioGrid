import { motion, reducedMotionOverrides } from '../token-data';
import { Section } from './TokenPrimitives';

/** Motion domain: duration/easing tokens plus the prefers-reduced-motion override note. */
export function MotionTokens() {
  return (
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
        {reducedMotionOverrides.map((o) => `--${o.name}:${o.value}`).join(' · ')} — overrides only,
        never base values.
      </p>
    </Section>
  );
}
