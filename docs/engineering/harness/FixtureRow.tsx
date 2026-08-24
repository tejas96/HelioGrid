'use client';
import { Component, type ErrorInfo, type ReactNode } from 'react';
import type { Fixture } from './types';

/**
 * One fixture, fenced by its own error boundary.
 *
 * The boundary is the point: without it a single throwing component blanks the whole page and
 * hides the other 94, which reads as a total failure rather than one defect. On success the row
 * carries `data-ok="<Name>"`, on failure `data-fail="<Name>"`, so the result is machine-readable
 * from the browser console as well as legible in a screenshot.
 */
type Props = { fixture: Fixture; onFail: (name: string) => void };

export class FixtureRow extends Component<Props, { err: string | null }> {
  override state: { err: string | null } = { err: null };

  static getDerivedStateFromError(error: Error) {
    return { err: error.message };
  }

  override componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(`RENDER-FAIL ${this.props.fixture.name}: ${error.message}`, info.componentStack);
    this.props.onFail(this.props.fixture.name);
  }

  override render(): ReactNode {
    const { name, node } = this.props.fixture;
    if (this.state.err !== null) {
      return (
        <section data-fail={name} style={ROW}>
          <h2 style={HEAD}>{name}</h2>
          <p style={FAIL}>✗ {this.state.err}</p>
        </section>
      );
    }
    return (
      <section data-ok={name} style={ROW}>
        <h2 style={HEAD}>{name}</h2>
        {node}
      </section>
    );
  }
}

const ROW = { borderTop: '1px solid var(--hairline)', paddingTop: 24, marginBottom: 40 } as const;
const HEAD = {
  font: '600 13px var(--font-mono)',
  color: 'var(--text-tertiary)',
  marginBottom: 12,
} as const;
const FAIL = { color: 'var(--danger)', font: '400 13px var(--font-mono)' } as const;
