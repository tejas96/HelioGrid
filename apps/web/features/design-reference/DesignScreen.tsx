import {
  ColorTokens,
  ContrastTokens,
  LayoutTokens,
  MotionTokens,
  TypographyTokens,
} from './components';
import { generator, source, tokens } from './token-data';
import './design.css';

/**
 * The living token reference (docs/10 §6): generated from dist/tokens.json — a new token
 * appears automatically; an unrendered token is impossible. "Add a token → it renders at
 * /design or nobody can verify it."
 */
export function DesignScreen() {
  const extensionCount = tokens.filter((t) => t.extension).length;

  return (
    <main className="ds-page">
      <header>
        <p className="hg-overline">HelioGrid design reference</p>
        <h1 className="hg-h1">
          Every token, generated from design/ds-source — {tokens.length} tokens, {extensionCount}{' '}
          marked extensions
        </h1>
        <p className="hg-muted">
          Source: {source} · generator: {generator}. Light-only v1 (ruling A). Never
          hand-transcribed; the manifest is untrusted for values.{' '}
          <a className="font-medium text-accent" href="/design/gallery">
            Component gallery →
          </a>
        </p>
      </header>

      <TypographyTokens />
      <ColorTokens />
      <LayoutTokens />
      <MotionTokens />
      <ContrastTokens />
    </main>
  );
}
