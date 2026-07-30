'use client';
import '../styles.css';
import './styles.css';
import { DangerSpecimens, MeasuredColumn, SecondarySpecimens } from './components';

/**
 * Contrast proposal — side by side, for the owner ruling on docs/13 UXG-A11Y-02 and
 * UXG-A11Y-03. TEMPORARY: delete this route once the decision lands.
 *
 * Container only (CLAUDE.md: presentation and logic live in different files). Each column
 * measures itself, and every colour and ratio shown is READ from the rendered DOM — nothing
 * is typed in, so the page cannot drift from the tokens it is arguing about.
 */
export default function ContrastComparison() {
  return (
    <main className="ds-page cmp-root">
      <header>
        <p className="hg-overline">Accessibility proposal</p>
        <h1 className="hg-h1">Two tokens, darkened — every ratio measured live in this page</h1>
        <p className="hg-muted">
          Same markup, same components, same cascade on both sides. Only the token values differ,
          and the proposed values are written as <code>color-mix</code> darkenings of the live
          tokens — the exact form they would be adopted in, so nothing here is a mock-up of a
          colour. Ratios and hex values are read from the rendered DOM, not typed in.{' '}
          <a className="font-medium text-accent" href="/design/gallery">
            Component gallery →
          </a>
        </p>
      </header>

      <section>
        <p className="hg-overline">
          UXG-A11Y-02 · <code>--danger</code> at 92% — the shade destructive buttons already hover
          to
        </p>
        <div className="cmp-grid">
          <MeasuredColumn title="Today" token="danger">
            <DangerSpecimens />
          </MeasuredColumn>
          <MeasuredColumn title="Proposed" token="danger" proposed>
            <DangerSpecimens />
          </MeasuredColumn>
        </div>
      </section>

      <section>
        <p className="hg-overline">
          UXG-A11Y-03 · <code>--text-secondary</code> at 90% — the SegmentedControl inactive label
        </p>
        <div className="cmp-grid">
          <MeasuredColumn title="Today" token="secondary">
            <SecondarySpecimens />
          </MeasuredColumn>
          <MeasuredColumn title="Proposed" token="secondary" proposed>
            <SecondarySpecimens />
          </MeasuredColumn>
        </div>
      </section>

      <p className="hg-muted">
        The judgement this page exists for is whether the darker values still read as the brand —
        the ratios already say they clear WCAG AA. Nothing is adopted until you rule; the tokens
        themselves are untouched.
      </p>
    </main>
  );
}
