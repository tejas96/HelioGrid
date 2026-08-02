'use client';
import '../design.css';
import {
  AuthSections,
  DataSections,
  FeedbackNavSections,
  FormsSections,
  PatternsSections,
  RowsSections,
} from './components';

/**
 * The living component gallery (docs/10 §6 · packages/ui DoD): every component of the
 * 21-component _ds API in every variant × size × state. A state not rendered here does
 * not exist. Interactive states are live (local useState) — click, toggle, focus.
 */
export function GalleryScreen() {
  return (
    <main className="ds-page">
      <header>
        <p className="hg-overline">HelioGrid component gallery</p>
        <h1 className="hg-h1">
          The 21-component _ds API — every variant, size and state, rendered live
        </h1>
        <p className="hg-muted">
          Source: @heliogrid/ui. Light-only v1. Interactive states are live; focus rings and hover
          elevation are pseudo-states — use keyboard and pointer to see them.{' '}
          <a className="font-medium text-accent" href="/design">
            Token reference
          </a>
        </p>
      </header>
      <FormsSections />
      <DataSections />
      <RowsSections />
      <FeedbackNavSections />
      <AuthSections />
      <PatternsSections />
    </main>
  );
}
